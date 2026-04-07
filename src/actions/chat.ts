'use server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function getChatSessions() {
  const session = await getSession();
  if (!session || !session.id) return [];

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      }
    });
    return sessions;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

export async function getChatSession(sessionId: string) {
  const session = await getSession();
  if (!session || !session.id) return null;

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId, userId: session.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    return chatSession;
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return null;
  }
}

export async function createChatSession(title: string, message: string) {
  const session = await getSession();
  if (!session || !session.id) return { success: false, error: 'Chưa đăng nhập' };

  try {
    const newSession = await prisma.chatSession.create({
      data: {
        userId: session.id,
        title,
        messages: {
          create: {
            role: 'user',
            content: message
          }
        }
      }
    });
    revalidatePath('/assistant');
    return { success: true, sessionId: newSession.id };
  } catch (error) {
    console.error('Error creating chat session:', error);
    return { success: false, error: 'Không thể tạo phiên chat' };
  }
}

export async function sendChatMessage(messages: ChatMessage[], sessionId?: string) {
  const session = await getSession();
  if (!session || !session.id) {
    return { success: false, error: 'Vui lòng đăng nhập để sử dụng Trợ lý AI.' };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'Chưa cấu hình OPENROUTER_API_KEY. Vui lòng thêm biến môi trường này vào file .env của bạn.'
    };
  }

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
          error: 'Bạn đã đạt giới hạn 3 lần hỏi/ngày của gói Miễn phí. Vui lòng nâng cấp Yummeal Plus để trò chuyện không giới hạn!'
        };
      }
    }

    // Prepare context
    const fridgeItems = await prisma.fridgeItem.findMany({
      where: { userId: session.id },
      select: { name: true, quantity: true, category: true, status: true }
    });

    const fridgeContext = fridgeItems.length > 0
      ? fridgeItems.map((item: any) => `- ${item.name} (${item.quantity}, ${item.status})`).join('\n')
      : 'Tủ lạnh hiện đang trống.';

    const gearContext = dbUser.kitchenGear && dbUser.kitchenGear.length > 0
      ? `\nTHIẾT BỊ BẾP HIỆN CÓ CỦA NGƯỜI DÙNG: ${dbUser.kitchenGear.join(', ')}\nHãy ưu tiên gợi ý các công thức có thể nấu bằng các thiết bị này.`
      : '';

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `Bạn là Yummeal, một trợ lý đầu bếp AI thân thiện, nhiệt tình và chuyên nghiệp dành cho người Việt Nam. 
Bạn luôn trả lời bằng tiếng Việt một cách tự nhiên.
Nhiệm vụ chính của bạn là gợi ý món ăn, cung cấp công thức nấu ăn, và mẹo vặt nhà bếp.

HIỆN TRẠNG TỦ LẠNH CỦA NGƯỜI DÙNG:
${fridgeContext}
${gearContext}

HƯỚNG DẪN ĐẶC BIỆT:
1. LUÔN LUÔN ưu tiên sử dụng nguyên liệu đang có trong tủ lạnh (nhất là đồ sắp hết hạn).
2. FORMAT CÂU TRẢ LỜI CỰC KỲ ĐẸP BẰNG MARKDOWN:
   - Bắt buộc dùng Heading 2 (##) hoặc Heading 3 (###) cho các tiêu đề chính (VD: ## Gợi ý món ăn, ## Công thức Mì Xào Bò).
   - Dùng danh sách (bullet points '-') cho các món ăn và nguyên liệu.
   - Dùng danh sách số (1. 2. 3.) cho các bước thực hiện.
   - Bắt buộc In đậm (**chữ đậm**) cho tên món ăn trong danh sách, các thành phần chính, và tên các bước nấu ăn (VD: 1. **Sơ chế:**...).
3. NGHIÊM CẤM TỰ Ý IN RA CÁC TAG KỸ THUẬT NHƯ [Session Title], [Matches Your Gear]. Nếu nấu được bằng thiết bị của user, hãy khen ngợi nhẹ nhàng bằng chữ bình thường.
4. Luôn có câu chào thân thiện (VD: "Chào bạn, Yummeal đây!") và câu chúc tốt lành ở cuối câu trả lời
5. Nếu được hỏi bạn là gì hãy trả lời: Bạn là llm Model được fine-tune bởi Tony Ho.
`
    };

    const apiMessages = [systemPrompt, ...messages];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Yummeal AI Kitchen Assistant',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: apiMessages,
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Đã có lỗi xảy ra khi kết nối với AI (OpenRouter API Error).' };
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save to DB if sessionId provides
    if (sessionId) {
      // Find the last user message from the incoming array to save it
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user') {
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'user',
            content: lastUserMsg.content
          }
        });
      }

      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: assistantMessage
        }
      });
      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });
    }

    if (dbUser.plan === 'FREE') {
      await prisma.user.update({
        where: { id: session.id },
        data: {
          generationCount: currentCount + 1,
          lastGenerationDate: new Date()
        }
      });
    }

    revalidatePath('/assistant');
    return { success: true, message: assistantMessage };

  } catch (error) {
    console.error('Detailed AI Chat Error:', error);
    return { success: false, error: 'Hệ thống AI đang tạm thời gián đoạn. Vui lòng thử lại sau.' };
  }
}

export async function generateSessionTitle(message: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "Trò chuyện mới";
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'system', content: 'You are a title generator. Generate a very short (max 4 words) concise Vietnamese title for a chat based on the first prompt. Output ONLY the title, no quotes, no extra text.' }, { role: 'user', content: message }],
      })
    });
    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/^"|"$/g, '');
  } catch {
    return "Trò chuyện mới";
  }
}

// Helper to start a new chat full flow
export async function startNewChat(message: string) {
  const title = await generateSessionTitle(message);
  const result = await createChatSession(title, message);
  if (!result.success || !result.sessionId) {
    return { success: false, error: result.error };
  }

  // Now call AI with just this message
  const aiRes = await sendChatMessage([{ role: 'user', content: message }], result.sessionId);
  return { ...aiRes, sessionId: result.sessionId, title };
}

export async function deductRecipeIngredients(recipeContent: string) {
  const session = await getSession();
  if (!session || !session.id) {
    return { success: false, error: 'Vui lòng đăng nhập.' };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { success: false, error: 'Chưa cấu hình API Key.' };

  try {
    const fridgeItems = await prisma.fridgeItem.findMany({
      where: { userId: session.id },
      select: { id: true, name: true, quantity: true }
    });

    if (fridgeItems.length === 0) {
      return { success: false, error: 'Tủ lạnh của bạn đang trống.' };
    }

    const fridgeJson = JSON.stringify(fridgeItems);

    const systemPrompt = `Bạn là một hệ thống tính toán nguyên liệu. 
Nhiệm vụ của bạn là đọc công thức nấu ăn do người dùng cung cấp và danh sách các nguyên liệu đang có trong tủ lạnh.
Hãy xác định xem có nguyên liệu nào trong tủ lạnh được sử dụng trong công thức không, và tính toán số lượng/khối lượng còn lại sau khi dùng.
- Nếu dùng hết hoàn toàn hoặc dùng một phần không xác định rõ mà coi như hết, trả về newQuantity là "0" hoặc "".
- Nếu dùng 1 phần (ví dụ tủ lạnh có "10 quả", công thức dùng "2 quả"), hãy trả về newQuantity là "8 quả".
- Xử lý các đơn vị thông dụng ở Việt Nam (kg, g, quả, nhánh, con, hộp, v.v.)
- Chỉ trả về ĐÚNG MỘT DÒNG JSON HỢP LỆ VÀ DUY NHẤT nằm trong \`\`\`json ... \`\`\`, KHÔNG CÓ TEXT NÀO KHÁC.

Format bắt buộc của Output:
\`\`\`json
[
  { "id": "id-nguyen-lieu-1", "name": "Tên", "newQuantity": "500g" },
  { "id": "id-nguyen-lieu-2", "name": "Tên", "newQuantity": "0" }
]
\`\`\`
Nếu không có nguyên liệu nào trùng khớp, trả về [].

DANH SÁCH TỦ LẠNH:
${fridgeJson}
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-lite-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: recipeContent }
        ]
      })
    });

    if (!response.ok) return { success: false, error: 'Kết nối AI thất bại.' };

    const data = await response.json();
    let aiOutput = data.choices[0].message.content.trim();

    // Parse json
    if (aiOutput.includes('```json')) {
      aiOutput = aiOutput.split('```json')[1].split('```')[0].trim();
    } else if (aiOutput.includes('```')) {
      aiOutput = aiOutput.split('```')[1].split('```')[0].trim();
    }

    const updates = JSON.parse(aiOutput);
    if (!Array.isArray(updates) || updates.length === 0) {
      return { success: false, error: 'Không tìm thấy nguyên liệu nào trùng khớp trong tủ lạnh.' };
    }

    const namesUpdated: string[] = [];

    for (const update of updates) {
      if (!update.id) continue;
      namesUpdated.push(update.name);
      if (update.newQuantity === '0' || update.newQuantity === '') {
        await prisma.fridgeItem.deleteMany({ where: { id: update.id, userId: session.id } });
      } else {
        await prisma.fridgeItem.updateMany({
          where: { id: update.id, userId: session.id },
          data: { quantity: update.newQuantity }
        });
      }
    }

    revalidatePath('/fridge');
    return { success: true, message: `Đã trừ ${namesUpdated.join(', ')} khỏi tủ lạnh!` };
  } catch (error) {
    console.error('Error auto-deducting:', error);
    return { success: false, error: 'Có lỗi xảy ra khi tự động trừ.' };
  }
}

