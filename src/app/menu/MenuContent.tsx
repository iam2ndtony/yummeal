'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import styles from './page.module.css';
import MealRecipeModal from './MealRecipeModal';

export default function MenuContent({ weeklyMenu }: { weeklyMenu: any[] }) {
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);

  if (weeklyMenu.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Bạn chưa có thực đơn nào. Hãy nhấn &quot;Tạo thực đơn mới&quot; để bắt đầu nhé!</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.menuList}>
        {weeklyMenu.map((dayPlan: any) => (
          <div key={dayPlan.id} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div className={styles.dayTitleWrapper}>
                <Calendar size={20} className={styles.calendarIcon} />
                <h2 className={styles.dayTitle}>{dayPlan.day}</h2>
              </div>
              <button className={styles.editPill}>Chỉnh sửa</button>
            </div>

            <div className={styles.mealsGrid}>
              {dayPlan.meals.map((meal: any) => (
                <div 
                  key={meal.id} 
                  className={styles.mealCard} 
                  onClick={() => setSelectedMeal(meal)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.mealTypeBadge}>{meal.type}</div>
                  <h3 className={styles.mealName}>{meal.name}</h3>
                  <ul className={styles.ingredientList}>
                    {meal.ingredients.map((ingredient: any) => (
                      <li key={ingredient.id}>{ingredient.name}</li>
                    ))}
                  </ul>
                  <div className={styles.recipeHint}>Xem công thức ➔</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedMeal && (
        <MealRecipeModal 
          meal={selectedMeal} 
          onClose={() => setSelectedMeal(null)} 
        />
      )}
    </>
  );
}
