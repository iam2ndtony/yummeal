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
    const systemPrompt = `Bạn là chuyên gia dinh dưỡng và đầu bếp chuyên nghiệp của Yummeal. 
Hãy tạo thực đơn 7 ngày (Sáng, Trưa, Tối) dựa trên nguyên liệu trong tủ lạnh: ${fridgeContext}.
Trả về DUY NHẤT một mảng JSON có cấu trúc đúng định dạng sau:
[
  {
    "day": "Thứ ...",
    "meals": [
      {
        "type": "Sáng" | "Trưa" | "Tối",
        "name": "Tên món ăn",
        "ingredients": ["NL 1 (khối lượng cụ thể - VD: 200g, 2 quả)", "NL 2 (khối lượng)"],
        "recipeContent": "Sử dụng Markdown cực kỳ đẹp mắt. In đậm các bước bằng cú pháp **Bước 1: Tên bước**."
      }
    ]
  }
]
Luôn ưu tiên dùng đồ trong tủ lạnh. Ưu tiên đồ sắp hết hạn. CỰC KỲ QUAN TRỌNG: Để tránh lỗi JSON, BẮT BUỘC KHÔNG DÙNG phím Enter/xuống dòng thực tế trong chuỗi 'recipeContent'. Thay vào đó, dùng ký hiệu <br> để ngăn cách các dòng. VD: "Bước 1: ... <br>Bước 2: ..."`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Yummeal App',
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: systemPrompt }]
      })
    });
    
    clearTimeout(timeoutId);

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
      // Extract just the JSON array to avoid Markdown codeblocks or conversational text
      const content = data.choices[0].message.content;
      let jsonStr = content;
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        jsonStr = match[0];
      }
      menuData = JSON.parse(jsonStr);
      // Some models return { "menu": [...] } instead of directly the array
      if (menuData.menu) menuData = menuData.menu;
      if (menuData.days) menuData = menuData.days;
      if (!Array.isArray(menuData)) throw new Error('AI response is not an array of days');
    } catch (e: any) {
      console.error('JSON Parse Error:', e);
      // Return detailed error to the UI to see what went wrong
      const snippet = data.choices && data.choices[0] ? data.choices[0].message.content.substring(0, 100) : 'No content';
      return { success: false, error: `Lỗi xử lý JSON: ${e.message}. Raw: ${snippet}...` };
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
              recipeContent: meal.recipeContent ? meal.recipeContent.replace(/<br>/gi, '\n') : '',
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
  } catch (error: any) {
    console.error('Error in generateMenuPlan:', error);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Tra cứu Thực đơn AI đang quá tải (Timeout). Xin hãy thử lại!' };
    }
    return { success: false, error: 'Không thể tạo thực đơn AI. Vui lòng kiểm tra lại kết nối.' };
  }
}
