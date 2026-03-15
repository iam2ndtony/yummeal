'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const defaultRecipesContent = [
  {
    title: 'Phở Bò Gia Truyền',
    description: 'Hương vị truyền thống với nước dùng trong, ngọt thanh từ xương bò và quế hồi.',
    time: '2-3 giờ',
    servings: '4 người',
    difficulty: 'Trung bình',
    difficultyType: 'medium',
    image: '/images/pho-bo.jpg',
    instructions: '1. Sơ chế: Nướng gừng, hành tím. Rửa sạch xương bò, chân giò.\n2. Nấu nước dùng: Cho xương vào nồi áp suất, thêm quế, hồi, đinh hương đã rang thơm. Hầm trong 2-3 tiếng.\n3. Chuẩn bị thịt: Thái mỏng thịt bò tái. Thịt chín vớt ra thái miếng vừa ăn.\n4. Trình bày: Trụng bánh phở, xếp thịt lên trên, chan nước dùng nóng.\n5. Thưởng thức: Ăn kèm tương ớt, tương đen và chanh.',
    detailedInstructions: 'HƯỚNG DẪN CHUYÊN SÂU TỪ ĐẦU BẾP\n\n1. Kỹ thuật nấu nước dùng tinh tế:\n- Xương bò phải được ngâm nước muối loãng 1 tiếng, sau đó luộc sơ (blanching) 15 phút với gừng để loại bỏ hoàn toàn bọt bẩn.\n- Gia vị thảo mộc (quế, hồi, thảo quả) chỉ được cho vào 45 phút cuối để nước dùng không bị đắng.\n- Phải giữ lửa nhỏ liu riu (simmer) và tuyệt đối không đậy nắp nồi để nước dùng luôn trong suốt.\n\n2. Bí quyết thịt bò mềm ngọt:\n- Thịt bò tái nên dùng phần thăn nội hoặc thăn ngoại. Trước khi thái, hãy để tủ đông 30 phút để lát thịt mỏng đều đẹp mắt.\n- Thịt bò chín phải được ngâm ngay vào nước đá sau khi vớt để giữ độ giòn.\n\n3. Trình bày chuẩn vị:\n- Bát phở phải được tráng nước sôi trước khi cho bánh phở vào để giữ nhiệt.\n- Hành lá phần trắng chẻ nhỏ, phần xanh thái nhuyễn, thêm ngò gai hương vị mới đúng điệu.',
    ingredients: '2kg xương bò\n500g thịt bò nạm\n400g bánh phở\n2 củ hành tây, cắt đôi\n1 củ gừng (5cm)\nHoa hồi (5 cái)\nQue quế\nNước mắm (3 thìa)\nRau thơm tươi (húng quế, ngò, chanh)\nGia đỗ',
  },
  {
    title: 'Bánh Mì Thịt Nướng',
    description: 'Bánh mì giòn với nhân thịt đậm đà và rau thơm tươi.',
    time: '30 phút',
    servings: '2 khẩu phần',
    difficulty: 'Dễ',
    difficultyType: 'easy',
    image: '/images/banh-mi.jpg',
    instructions: '1. Chuẩn bị thịt: Thái thịt heo thành lát mỏng, ướp với nước mắm, đường, tỏi, sả.\n2. Nướng thịt: Nướng thịt trên chảo hoặc lò nướng đến khi vàng đều và thơm.\n3. Chuẩn bị rau: Rửa sạch dưa leo, cà rốt, ngò, ớt.\n4. Nướng bánh mì: Nướng bánh mì cho giòn vỏ ngoài, mềm trong.\n5. Lắp ráp: Phết pate, xếp thịt, rau vào bánh và thưởng thức.',
    detailedInstructions: 'BÍ QUYẾT BÁNH MÌ THỊT NƯỚNG HOÀN HẢO\n\n1. Ướp thịt đậm đà:\n- Ướp thịt ít nhất 2 tiếng trong tủ lạnh với nước mắm ngon, đường, tỏi ớt, sả băm, nước màu.\n\n2. Kỹ thuật nướng lý tưởng:\n- Nướng ở nhiệt độ 200°C, thoa dầu mỡ lên thịt giữa chừng để thịt bóng đẹp và không bị khô.\n\n3. Đồ chua không thể thiếu:\n- Ngâm cà rốt + củ cải trắng trong hỗn hợp dấm + đường + muối ít nhất 30 phút. Đây là linh hồn của bánh mì Việt.',
    ingredients: '300g thịt heo ba chỉ\n2 ổ bánh mì Việt\nPate gan\nDưa leo\nCà rốt ngâm chua\nNgò rí\nỚt tươi\nNước mắm, đường, tỏi, sả',
  },
  {
    title: 'Bún Chả Hà Nội',
    description: 'Thịt nướng thơm lừng ăn kèm bún và nước mắm chua ngọt chuẩn vị Hà thành.',
    time: '45 phút',
    servings: '4 khẩu phần',
    difficulty: 'Trung bình',
    difficultyType: 'medium',
    image: '/images/bun-cha.jpg',
    instructions: '1. Ướp thịt: Thịt ba chỉ và thịt nạc băm ướp với hành khô, tiêu, nước hàng, nước mắm.\n2. Nướng: Viên thịt băm và xiên thịt miếng, nướng trên than hoa cho đến khi vàng đều.\n3. Nước chấm: Pha nước mắm, đường, dấm, nước lọc theo tỷ lệ 1:1:1:5, đun ấm, thêm tỏi ớt và đu đủ chua.\n4. Rau sống: Xà lách, tía tô, kinh giới rửa sạch.\n5. Thưởng thức: Cho thịt nướng vào bát nước chấm, ăn cùng bún và rau sống.',
    detailedInstructions: 'TINH HOA BÚN CHẢ HÀ NỘI\n\n1. Công thức ướp thịt độc quyền:\n- Phải dùng nước màu (nước hàng) tự thắng từ đường để thịt nướng xong có hương vị đặc trưng.\n- Thịt băm (Chả viên) nên chọn phần nạc vai có mỡ để khi nướng không bị khô.\n\n2. Linh hồn bát nước chấm:\n- Đu đủ xanh và cà rốt ngâm (đồ chua). Phải bóp muối rồi ngâm dấm đường trước 30 phút để giữ độ giòn.\n- Nước chấm phải được đun ấm lên trước khi phục vụ để hương vị lan tỏa.',
    ingredients: '300g thịt ba chỉ\n200g thịt nạc băm\n300g bún tươi\nXà lách, tía tô, kinh giới\nNước mắm, đường, dấm\nTỏi ớt\nĐu đủ xanh + cà rốt ngâm chua',
  },
  {
    title: 'Gỏi Cuốn Tôm Thịt',
    description: 'Đế cuốn tươi mát, tốt cho sức khỏe với tôm, thịt heo và rau sống.',
    time: '20 phút',
    servings: '6 khẩu phần',
    difficulty: 'Dễ',
    difficultyType: 'easy',
    image: '/images/goi-cuon.jpg',
    instructions: '1. Chuẩn bị: Luộc thịt ba chỉ với chút muối, luộc tôm rồi lột vỏ, bỏ chỉ lưng. Rửa sạch các loại rau sống.\n2. Sơ chế: Thịt ba chỉ thái lát mỏng. Tôm xẻ đôi theo chiều dọc.\n3. Cuốn: Nhúng bánh tráng qua nước cho mềm. Xếp rau sống, bún, thịt và tôm lên trên rồi cuốn chặt tay.\n4. Nước chấm: Pha tương đen với bơ đậu phộng, thêm chút ớt băm và đồ chua.\n5. Thưởng thức: Chấm gỏi cuốn vào tương và thưởng thức độ tươi ngon.',
    detailedInstructions: 'MẸO CUỐN ĐẸP VÀ PHA NƯỚC CHẤM ĐỈNH CAO\n\n1. Kỹ thuật luộc tôm & thịt chuẩn:\n- Thịt ba chỉ luộc cùng 1 củ hành tím đập dập để khử mùi. Khi vừa chín tới, vớt ra ngâm nước lạnh.\n- Tôm luộc nhanh trong 3-5 phút. Thái đôi tôm giúp khi cuốn mặt đỏ của tôm hướng ra ngoài bắt mắt.\n\n2. Nghệ thuật cuốn gỏi cuốn:\n- Chỉ nhúng nước bánh tráng thật nhanh, không ngâm lâu bánh sẽ bị nhão.\n\n3. Nước chấm "thần thánh":\n- Xào tỏi băm với dầu, cho tương đen vào hầm cùng nước luộc thịt. Thêm 1 thìa bơ đậu phộng để tạo độ béo.',
    ingredients: '12 tôm sú (200g)\n200g thịt ba chỉ\n12 bánh tráng\n100g bún tươi\nXà lách, húng quế, ngò\nDưa leo\nTương đen + bơ đậu phộng',
  },
  {
    title: 'Cơm Tấm Sườn Bì',
    description: 'Đặc sản Sài Gòn với sườn nướng mật ong, bì thính và chả trứng hấp.',
    time: '1 giờ',
    servings: '4 khẩu phần',
    difficulty: 'Trung bình',
    difficultyType: 'medium',
    image: '/images/com-tam.jpg',
    instructions: '1. Cơm tấm: Gạo tấm vo sạch, nấu chín vừa tới, không quá nát.\n2. Sườn nướng: Ướp sườn với sả, tỏi, mật ong, dầu hào ít nhất 1 tiếng rồi nướng trên than hoa.\n3. Bì: Trộn thính với da heo luộc thái sợi và thịt nạc chiên.\n4. Chả trứng: Trộn trứng, miến, mộc nhĩ, thịt băm rồi hấp chín.\n5. Thưởng thức: Ăn kèm nước mắm chua ngọt, dưa leo và mỡ hành.',
    detailedInstructions: 'QUY TRÌNH CHẾ BIẾN CƠM TẤM ĐÚNG CHUẨN SÀI THÀNH\n\n1. Nấu gạo tấm không bị bết:\n- Tỷ lệ gạo:nước là 1:1. Nên cho thêm 1 thìa dầu ăn vào nước nấu để hạt gạo tấm bóng bẩy, tơi xốp.\n\n2. Ướp sườn nướng mềm tan:\n- Thêm 1/2 chén nước cam hoặc Coca-Cola vào hỗn hợp ướp để sườn mềm và có màu đỏ nâu cánh gián đẹp.\n\n3. Làm mỡ hành xanh mướt:\n- Hành lá thái nhỏ, thêm muối và đường. Đun dầu thật nóng rồi dội thẳng vào bát hành. Hành chín tái, giữ màu xanh lâu.',
    ingredients: '500g gạo tấm\n4 sườn heo\n200g da heo + thịt nạc (làm bì)\n3 trứng gà\nMiến + mộc nhĩ\nSả, tỏi, mật ong, dầu hào\nNước mắm chua ngọt\nDưa leo, cà chua',
  },
  {
    title: 'Chả Giò Rán',
    description: 'Chả giò giòn rụm với nhân thịt và rau củ, chấm nước mắm chua ngọt.',
    time: '40 phút',
    servings: '4 khẩu phần',
    difficulty: 'Trung bình',
    difficultyType: 'medium',
    image: '/images/cha-gio.jpg',
    instructions: '1. Làm nhân: Trộn thịt heo băm, cà rốt, miến, mộc nhĩ, hành, trứng và gia vị.\n2. Cuốn chả: Cuốn hỗn hợp nhân vào bánh tráng, cuốn chặt và gấp mép.\n3. Chiên lần 1: Chiên ở lửa vừa đến khi chả vàng nhẹ, vớt ra để ráo.\n4. Chiên lần 2: Chiên lại lửa cao để vỏ giòn rụm, vàng đẹp.\n5. Thưởng thức: Ăn nóng kèm nước mắm chua ngọt và rau sống.',
    detailedInstructions: 'BÍ QUYẾT CHẢ GIÒ GIÒN LÂU\n\n1. Nhân không bị chảy nước:\n- Miến phải được ngâm nước ấm, để ráo hoàn toàn trước khi trộn vào nhân.\n- Vắt ráo nước cà rốt bào bằng muối, bóp nhẹ và để khô trước khi trộn.\n\n2. Kỹ thuật chiên 2 lần (Double Fry):\n- Lần 1 ở 160°C: Chiên cho nhân chín bên trong, vỏ vàng nhẹ.\n- Lần 2 ở 190°C: Chiên chớp nhoáng 1-2 phút để vỏ giòn rụm và vàng cánh gián.\n\n3. Mẹo dùng Bánh tráng đúng loại:\n- Dùng bánh tráng chuyên dụng chiên chả giò. Nhúng nước rất nhanh, cuốn chắc tay để vỏ không bị bong tróc.',
    ingredients: '300g thịt heo băm\n100g cà rốt bào\n50g miến khô\n30g mộc nhĩ\n2 trứng gà\nHành tím, tỏi\nBánh tráng chiên\nNước mắm chua ngọt',
  },
];

export async function getRecipes() {
  const session = await getSession();
  if (!session || !session.id) return [];

  try {
    let recipes = await prisma.recipe.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' }
    });

    if (recipes.length === 0) {
      for (const recipe of defaultRecipesContent) {
        await prisma.recipe.create({
          data: {
            title: recipe.title,
            description: recipe.description,
            time: recipe.time,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            difficultyType: recipe.difficultyType,
            image: recipe.image,
            instructions: recipe.instructions,
            detailedInstructions: recipe.detailedInstructions,
            userId: session.id,
          },
        });
      }

      recipes = await prisma.recipe.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Sync image paths for existing recipes
      for (const recipe of recipes) {
        const matchingDefault = defaultRecipesContent.find((d) => d.title === recipe.title);
        if (matchingDefault && recipe.image !== matchingDefault.image) {
          await prisma.recipe.update({
            where: { id: recipe.id },
            data: { image: matchingDefault.image },
          });
        }
      }
      recipes = await prisma.recipe.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    return recipes;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

export async function getRecipeById(id: string) {
  const session = await getSession();
  if (!session || !session.id) return null;

  try {
    return await prisma.recipe.findFirst({
      where: { id, userId: session.id },
    });
  } catch (error) {
    console.error('Error fetching recipe by id:', error);
    return null;
  }
}

export async function getDefaultIngredients(title: string): Promise<string> {
  const match = defaultRecipesContent.find((r) => r.title === title);
  return match?.ingredients ?? '';
}
