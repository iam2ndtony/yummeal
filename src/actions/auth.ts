'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession, clearSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { success: false, error: 'Vui lòng nhập đầy đủ thông tin' };
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, error: 'Email hoặc mật khẩu không đúng' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return { success: false, error: 'Email hoặc mật khẩu không đúng' };
    }

    await setSession(user.id, user.email, user.name, user.plan);
    return { success: true, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
  }
}

export async function registerAction(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) {
      return { success: false, error: 'Vui lòng nhập đầy đủ thông tin' };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: 'Email đã được sử dụng' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
  }
}

import { redirect } from 'next/navigation';

export async function logoutAction() {
  await clearSession();
  revalidatePath('/');
  redirect('/login');
}
