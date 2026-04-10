'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ──────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────
export async function getNotifications() {
  const session = await getSession();
  if (!session?.id) return [];
  try {
    return await prisma.notification.findMany({
      where: { recipientId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  } catch { return []; }
}

export async function markNotificationsRead() {
  const session = await getSession();
  if (!session?.id) return;
  try {
    await prisma.notification.updateMany({
      where: { recipientId: session.id, isRead: false },
      data: { isRead: true },
    });
  } catch {}
}

async function createNotification(recipientId: string, type: string, message: string, postId?: string) {
  // Don't notify yourself
  const session = await getSession();
  if (session?.id === recipientId) return;
  try {
    await prisma.notification.create({
      data: { recipientId, type, message, postId: postId ?? null },
    });
  } catch {}
}

// ──────────────────────────────────────────────
// COMMENT LIKES
// ──────────────────────────────────────────────
export async function toggleCommentLike(commentId: string) {
  const session = await getSession();
  if (!session?.id) return { success: false };
  try {
    const comment = await prisma.communityComment.findUnique({
      where: { id: commentId },
      include: { user: true, post: true },
    });
    if (!comment) return { success: false };

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId: session.id } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      return { success: true, liked: false };
    } else {
      await prisma.commentLike.create({ data: { commentId, userId: session.id } });
      // Notify comment author
      const liker = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
      await createNotification(
        comment.userId,
        'comment_like',
        `${liker?.name} đã thích bình luận của bạn`,
        comment.postId,
      );
      return { success: true, liked: true };
    }
  } catch { return { success: false }; }
}

export async function getUserCommentLikes(commentIds: string[]) {
  const session = await getSession();
  if (!session?.id || commentIds.length === 0) return [];
  try {
    const likes = await prisma.commentLike.findMany({
      where: { userId: session.id, commentId: { in: commentIds } },
      select: { commentId: true },
    });
    return likes.map(l => l.commentId);
  } catch { return []; }
}

// ──────────────────────────────────────────────
// REPLIES
// ──────────────────────────────────────────────
export async function addReply(postId: string, parentId: string, content: string) {
  const session = await getSession();
  if (!session?.id) return { success: false, error: 'Vui lòng đăng nhập.' };
  if (!content.trim()) return { success: false, error: 'Nội dung trống.' };

  try {
    const parent = await prisma.communityComment.findUnique({
      where: { id: parentId },
      include: { user: true },
    });
    if (!parent) return { success: false, error: 'Không tìm thấy bình luận gốc.' };

    const reply = await prisma.communityComment.create({
      data: { postId, userId: session.id, content: content.trim(), parentId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Notify parent comment author
    const replier = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
    await createNotification(
      parent.userId,
      'reply',
      `${replier?.name} đã trả lời bình luận của bạn`,
      postId,
    );

    revalidatePath('/community');
    return { success: true, reply };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Không thể gửi trả lời.' };
  }
}

// ──────────────────────────────────────────────
// USER PROFILE
// ──────────────────────────────────────────────
export async function getCommunityUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, avatarUrl: true, createdAt: true, plan: true,
        _count: { select: { communityPosts: true, communityLikes: true } },
      },
    });
    if (!user) return null;

    const posts = await prisma.communityPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        recipe: { select: { id: true, title: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return { user, posts };
  } catch { return null; }
}
