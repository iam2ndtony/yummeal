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
        _count: { select: { likes: true } },
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
        _count: { select: { likes: true } },
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
        _count: { select: { likes: true } },
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

