'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getFridgeItems() {
  const session = await getSession();
  if (!session || !session.id) return [];

  try {
    const items = await prisma.fridgeItem.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    
    const enrichedItems = items.map(item => {
      // Calculate real-time decay
      // Using absolute Time difference to get accurate days
      const daysPassed = Math.floor((now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, item.expiryDays - daysPassed);
      
      let status = 'Tươi';
      let statusType = 'fresh';
      
      if (remainingDays === 0) {
        status = 'Hết hạn';
        statusType = 'error';
      } else if (remainingDays <= 3) {
        status = 'Dùng ngay!';
        statusType = 'urgent';
      } else if (remainingDays <= 7) {
        status = 'Sắp hết hạn';
        statusType = 'warning';
      }
      
      let freshness = 100;
      if (remainingDays === 0) {
        freshness = 0;
      } else if (remainingDays <= 3) {
        freshness = 20;
      } else if (remainingDays <= 7) {
        freshness = 50;
      } else {
        freshness = 100;
      }

      return {
        ...item,
        remainingDays, // Dynamic injected property
        freshness,
        status,
        statusType
      };
    });
    
    // Sort by remaining days ascending
    enrichedItems.sort((a, b) => a.remainingDays - b.remainingDays);
    
    return enrichedItems;
  } catch (error) {
    console.error('Error fetching fridge items:', error);
    return [];
  }
}

export async function addFridgeItem(formData: FormData) {
  const session = await getSession();
  if (!session || !session.id) return { success: false, error: 'Chưa đăng nhập' };

  try {
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const quantity = formData.get('quantity') as string;
    const expiryDaysStr = formData.get('expiryDays') as string;
    const freshnessStr = formData.get('freshness') as string;

    if (!name || !category || !quantity || !expiryDaysStr) {
      return { success: false, error: 'Vui lòng nhập đầy đủ thông tin' };
    }

    const expiryDays = parseInt(expiryDaysStr);
    const freshness = freshnessStr ? parseInt(freshnessStr) : (expiryDays > 7 ? 100 : expiryDays > 3 ? 50 : 20);
    
    // Determine status based on freshness/expiry
    let status = 'Tươi';
    let statusType = 'fresh';
    if (expiryDays <= 3) {
      status = 'Dùng ngay!';
      statusType = 'urgent';
    } else if (expiryDays <= 7) {
      status = 'Sắp hết hạn';
      statusType = 'warning';
    }

    await prisma.fridgeItem.create({
      data: {
        userId: session.id,
        name,
        category,
        quantity,
        expiryDays,
        freshness,
        status,
        statusType
      }
    });

    revalidatePath('/fridge');
    return { success: true };
  } catch (error) {
    console.error('Error adding fridge item:', error);
    return { success: false, error: 'Đã có lỗi xảy ra' };
  }
}

export async function deleteFridgeItem(id: string) {
  const session = await getSession();
  if (!session || !session.id) return { success: false, error: 'Chưa đăng nhập' };

  try {
    await prisma.fridgeItem.delete({
      where: {
        id,
        userId: session.id // Security check
      }
    });
    revalidatePath('/fridge');
    return { success: true };
  } catch (error) {
    console.error('Error deleting fridge item:', error);
    return { success: false, error: 'Không thể xóa' };
  }
}
