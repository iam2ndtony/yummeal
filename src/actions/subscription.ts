'use server';

import prisma from '@/lib/prisma';
import { getSession, setSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function upgradePlanAction() {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { plan: 'PLUS' }
    });

    // Update session cookie
    await setSession(updatedUser.id, updatedUser.email, updatedUser.name, updatedUser.plan);
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Upgrade error:', error);
    return { success: false, error: 'Lỗi nâng cấp tài khoản' };
  }
}
