'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getCommunityPosts() {
  try {
    const posts = await prisma.communityPost.findMany({
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        recipe: { select: { id: true, title: true, description: true, time: true, servings: true, instructions: true, ingredients: true } },
        _count: { select: { likes: true, comments: true } },
        comments: { where: { parentId: null }, include: { user: { select: { id: true, name: true, avatarUrl: true } }, likes: true, replies: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, likes: true }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    return posts;
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return [];
  }
}

export async function getFeaturedPosts() {
  try {
    return await prisma.communityPost.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        recipe: { select: { id: true, title: true, description: true, time: true, servings: true, instructions: true, ingredients: true } },
        _count: { select: { likes: true, comments: true } },
        comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
  } catch {
    return [];
  }
}

export async function createCommunityPost(data: {
  imageBase64: string;
  caption?: string;
  recipeId?: string;
}) {
  const session = await getSession();
  if (!session?.id) return { success: false, error: 'Vui lòng đăng nhập.' };

  try {
    await prisma.communityPost.create({
      data: {
        userId: session.id,
        imageUrl: data.imageBase64,
        caption: data.caption || null,
        recipeId: data.recipeId || null,
      },
    });
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    console.error('Error creating community post:', error);
    return { success: false, error: 'Không thể đăng ảnh.' };
  }
}

export async function toggleLike(postId: string) {
  const session = await getSession();
  if (!session?.id) return { success: false, error: 'Vui lòng đăng nhập.' };

  try {
    const existing = await prisma.communityLike.findUnique({
      where: { postId_userId: { postId, userId: session.id } },
    });

    if (existing) {
      await prisma.communityLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.communityLike.create({ data: { postId, userId: session.id } });
      // Notify post owner
      const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { userId: true } });
      if (post && post.userId !== session.id) {
        const liker = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
        await prisma.notification.create({
          data: { recipientId: post.userId, type: 'like', message: `${liker?.name} đã thích bài đăng của bạn`, postId },
        });
      }
    }

    revalidatePath('/community');
    return { success: true, liked: !existing };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, error: 'Lỗi khi thao tác.' };
  }
}

export async function getUserLikedPosts() {
  const session = await getSession();
  if (!session?.id) return [];
  try {
    const likes = await prisma.communityLike.findMany({
      where: { userId: session.id },
      select: { postId: true },
    });
    return likes.map((l) => l.postId);
  } catch {
    return [];
  }
}

export async function getUserRecipes() {
  const session = await getSession();
  if (!session?.id) return [];
  try {
    return await prisma.recipe.findMany({
      where: { userId: session.id },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
    });
  } catch {
    return [];
  }
}

export async function getMyPosts() {
  const session = await getSession();
  if (!session?.id) return [];
  try {
    return await prisma.communityPost.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        recipe: { select: { id: true, title: true, description: true, time: true, servings: true, instructions: true, ingredients: true } },
        _count: { select: { likes: true, comments: true } },
        comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
  } catch {
    return [];
  }
}

export async function updateCommunityPost(postId: string, data: { caption: string; recipeId: string | null }) {
  const session = await getSession();
  if (!session?.id) return { success: false, error: 'Chưa đăng nhập' };
  try {
    await prisma.communityPost.update({
      where: { id: postId, userId: session.id },
      data: {
        caption: data.caption || null,
        recipeId: data.recipeId || null,
      },
    });
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, error: 'Không thể cập nhật bài đăng' };
  }
}

export async function deletePost(postId: string) {
  const session = await getSession();
  if (!session?.id) return { success: false };
  try {
    await prisma.communityPost.delete({
      where: { id: postId, userId: session.id },
    });
    revalidatePath('/community');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function addComment(postId: string, content: string) {
  const session = await getSession();
  if (!session?.id) return { success: false, error: 'Vui lòng đăng nhập.' };
  if (!content.trim()) return { success: false, error: 'Nội dung trống.' };

  try {
    const comment = await prisma.communityComment.create({
      data: { postId, userId: session.id, content: content.trim() },
      include: { user: { select: { id: true, name: true, avatarUrl: true } }, likes: true, replies: true },
    });

    // Notify post owner
    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== session.id) {
      const commenter = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
      await prisma.notification.create({
        data: { recipientId: post.userId, type: 'comment', message: `${commenter?.name} đã bình luận về bài đăng của bạn`, postId },
      });
    }

    revalidatePath('/community');
    return { success: true, comment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Không thể gởi bình luận.' };
  }
}

export async function deleteComment(commentId: string) {
  const session = await getSession();
  if (!session?.id) return { success: false, error: 'Vui lòng đăng nhập.' };

  try {
    const existing = await prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!existing) return { success: false, error: 'Bình luận không tồn tại.' };
    
    // Allow post owner or comment owner to delete
    if (existing.userId !== session.id) {
      const post = await prisma.communityPost.findUnique({ where: { id: existing.postId } });
      if (post?.userId !== session.id) {
        return { success: false, error: 'Không có quyền xóa.' };
      }
    }

    await prisma.communityComment.delete({ where: { id: commentId } });
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Lỗi khi xóa bình luận.' };
  }
}

