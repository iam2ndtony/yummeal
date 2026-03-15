'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getMenuPlans() {
  const session = await getSession();
  if (!session || !session.id) return [];

  try {
    const plans = await prisma.menuPlan.findMany({
      where: { userId: session.id },
      include: {
        meals: {
          include: {
            ingredients: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return plans;
  } catch (error) {
    console.error('Error fetching menu plans:', error);
    return [];
  }
}

export async function generateMenuPlan() {
  const session = await getSession();
  if (!session || !session.id) return { success: false, error: 'Chưa đăng nhập' };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { success: false, error: 'Chưa cấu hình API Key' };

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!dbUser) return { success: false, error: 'User not found' };

    let currentCount = dbUser.generationCount;
    const now = new Date();
    const isSameDay = dbUser.lastGenerationDate &&
      now.getFullYear() === dbUser.lastGenerationDate.getFullYear() &&
      now.getMonth() === dbUser.lastGenerationDate.getMonth() &&
      now.getDate() === dbUser.lastGenerationDate.getDate();

    if (dbUser.plan === 'FREE') {
      if (!isSameDay) currentCount = 0;
      if (currentCount >= 3) {
        return {
          success: false,
          error: 'Giới hạn 3 lần/ngày. Vui lòng nâng cấp gói PLUS!'
        };
      }
    }

    // 1. Fetch Fridge items
    const fridgeItems = await prisma.fridgeItem.findMany({
      where: { userId: session.id }
    });
    const fridgeContext = fridgeItems.length > 0
      ? fridgeItems.map((i: any) => `${i.name} (${i.quantity}, ${i.status})`).join(', ')
      : 'Trống';

    // 2. Call AI
    const systemPrompt = `Bạn là chuyên gia dinh dưỡng của Yummeal. 
Hãy tạo thực đơn 7 ngày (Sáng, Trưa, Tối) dựa trên nguyên liệu: ${fridgeContext}.
Trả về DUY NHẤT một mảng JSON có cấu trúc:
[
  {
    "day": "Thứ ...",
    "meals": [
      {
        "type": "Sáng" | "Trưa" | "Tối",
        "name": "Tên món",
        "ingredients": ["NL 1", "NL 2"],
        "recipeContent": "Hướng dẫn nấu ăn ngắn gọn (1 đoạn văn)."
      }
    ]
  }
]
Luôn ưu tiên dùng đồ trong tủ lạnh. Ưu tiên đồ sắp hết hạn.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI Error Body:', errText);
      const errJson = JSON.parse(errText);
      if (errJson.error?.message?.includes('Invalid model ID')) {
        return { success: false, error: 'Model AI không hợp lệ. Đang liên hệ kỹ thuật...' };
      }
      throw new Error(`AI Error: ${response.status}`);
    }

    const data = await response.json();
    let menuData;
    try {
      const content = data.choices[0].message.content;
      // Handle the case where the AI might wrap it in ```json ... ``` or return markdown
      const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
      menuData = JSON.parse(jsonStr);
      // Some models return { "menu": [...] } instead of directly the array
      if (menuData.menu) menuData = menuData.menu;
      if (menuData.days) menuData = menuData.days;
      if (!Array.isArray(menuData)) throw new Error('AI response is not an array of days');
    } catch (e) {
      console.error('JSON Parse Error. Raw content:', data.choices[0].message.content);
      return { success: false, error: 'AI trả về dữ liệu không đúng định dạng. Vui lòng thử lại.' };
    }

    // 3. Clear and save
    await prisma.menuPlan.deleteMany({ where: { userId: session.id } });

    for (const plan of menuData) {
      await prisma.menuPlan.create({
        data: {
          userId: session.id,
          day: plan.day,
          meals: {
            create: plan.meals.map((meal: any) => ({
              type: meal.type,
              name: meal.name,
              recipeContent: meal.recipeContent,
              ingredients: {
                create: meal.ingredients.map((ing: string) => ({ name: ing }))
              }
            }))
          }
        }
      });
    }

    // 4. Update count
    if (dbUser.plan === 'FREE') {
      await prisma.user.update({
        where: { id: session.id },
        data: {
          generationCount: currentCount + 1,
          lastGenerationDate: new Date()
        }
      });
    }

    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Không thể tạo thực đơn AI.' };
  }
}
