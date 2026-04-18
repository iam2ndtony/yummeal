'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUserDetailsAction(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        fridgeItems: {
          orderBy: { createdAt: 'desc' }
        },
        recipes: {
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        communityPosts: {
          select: { id: true, caption: true, imageUrl: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserAction(userId: string, data: { plan: string; generationCount: number }) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: data.plan,
        generationCount: data.generationCount
      }
    });
    
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePostAction(postId: string) {
  try {
    await prisma.communityPost.delete({
      where: { id: postId }
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyAdminPassword(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD || 'yummeal2026';
  
  if (password === correctPassword) {
    const { cookies } = await import('next/headers');
    (await cookies()).set('admin_access', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    return { success: true };
  }
  return { success: false, error: 'Invalid password' };
}
