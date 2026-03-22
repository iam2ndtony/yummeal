// Mock Nutritional API Mapping
const NUTRITION_DB: Record<string, { kcal: number, protein: number, carbs: number, fat: number, estimatedPrice: number }> = {
  // Default values for common Vietnamese ingredients per 100g or 1 unit
  'thịt heo': { kcal: 242, protein: 27, carbs: 0, fat: 14, estimatedPrice: 15 }, // approx 15k VNĐ per 100g
  'thịt bò': { kcal: 250, protein: 26, carbs: 0, fat: 15, estimatedPrice: 30 },
  'thịt gà': { kcal: 165, protein: 31, carbs: 0, fat: 3.6, estimatedPrice: 10 },
  'trứng': { kcal: 155, protein: 13, carbs: 1.1, fat: 11, estimatedPrice: 3 },
  'cá': { kcal: 206, protein: 22, carbs: 0, fat: 5, estimatedPrice: 20 },
  'tôm': { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, estimatedPrice: 25 },
  'đậu hũ': { kcal: 76, protein: 8, carbs: 1.9, fat: 4.8, estimatedPrice: 5 },
  // Veggies
  'rau cải': { kcal: 23, protein: 3, carbs: 4.3, fat: 0.2, estimatedPrice: 2 },
  'cà rốt': { kcal: 41, protein: 1, carbs: 9.6, fat: 0.2, estimatedPrice: 3 },
  'khoai tây': { kcal: 77, protein: 2, carbs: 17, fat: 0.1, estimatedPrice: 4 },
  'hành tây': { kcal: 40, protein: 1, carbs: 9.3, fat: 0.1, estimatedPrice: 2 },
  'cà chua': { kcal: 18, protein: 1, carbs: 3.9, fat: 0.2, estimatedPrice: 3 },
  // Carbs
  'gạo': { kcal: 130, protein: 3, carbs: 28, fat: 0.3, estimatedPrice: 5 }, // cooked
  'bún': { kcal: 110, protein: 2, carbs: 24, fat: 0.2, estimatedPrice: 3 },
  'mì': { kcal: 138, protein: 4, carbs: 25, fat: 2.1, estimatedPrice: 4 }
};

const DEFAULT_NUTRITION = { kcal: 50, protein: 2, carbs: 5, fat: 1, estimatedPrice: 5 }; // fallback per ingredient match

export function identifyIngredientNutrition(ingredientName: string) {
  const normName = ingredientName.toLowerCase();
  
  for (const [key, value] of Object.entries(NUTRITION_DB)) {
    if (normName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return DEFAULT_NUTRITION;
}

export function calculateMealNutrition(ingredients: any[]) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0;
  
  ingredients.forEach(ing => {
    const nutData = identifyIngredientNutrition(ing.name);
    // Assume 1 serving is roughly 2.5x the base 100g unit for calculation purposes
    kcal += nutData.kcal * 2.5;
    protein += nutData.protein * 2.5;
    carbs += nutData.carbs * 2.5;
    fat += nutData.fat * 2.5;
  });

  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };
}

export function calculateWeeklyDashboard(menuPlans: any[], fridgeItems: any[]) {
  let totalKcal = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let mealsCount = 0;
  let totalSavings = 0;

  // Track reused expiring items to avoid double counting savings
  const rescuedFridgeIds = new Set<string>();

  // Find expiring items (StatusType: "warning" or "urgent")
  const expiringFridgeItems = fridgeItems.filter(
    item => item.statusType === 'warning' || item.statusType === 'urgent'
  );

  menuPlans.forEach(plan => {
    plan.meals.forEach((meal: any) => {
      mealsCount++;
      const mealNut = calculateMealNutrition(meal.ingredients);
      totalKcal += mealNut.kcal;
      totalProtein += mealNut.protein;
      totalCarbs += mealNut.carbs;
      totalFat += mealNut.fat;

      // Check savings
      meal.ingredients.forEach((ing: any) => {
        for (const fItem of expiringFridgeItems) {
            if (ing.name.toLowerCase().includes(fItem.name.toLowerCase()) || fItem.name.toLowerCase().includes(ing.name.toLowerCase())) {
                if (!rescuedFridgeIds.has(fItem.id)) {
                    rescuedFridgeIds.add(fItem.id);
                    totalSavings += identifyIngredientNutrition(fItem.name).estimatedPrice * 5; // e.g. 5x base price
                }
            }
        }
      });
    });
  });

  const dailyAvgKcal = menuPlans.length > 0 ? Math.round(totalKcal / menuPlans.length) : 0;
  const dailyAvgProtein = menuPlans.length > 0 ? Math.round(totalProtein / menuPlans.length) : 0;
  const dailyAvgCarbs = menuPlans.length > 0 ? Math.round(totalCarbs / menuPlans.length) : 0;
  const dailyAvgFat = menuPlans.length > 0 ? Math.round(totalFat / menuPlans.length) : 0;
  
  // Example goals
  const targetKcal = 2000;
  const targetProtein = 80;

  return {
    dailyAvgKcal,
    targetKcal,
    dailyAvgProtein,
    targetProtein,
    dailyAvgCarbs,
    dailyAvgFat,
    totalSavings, // in thousands VND
    mealsCount
  };
}
