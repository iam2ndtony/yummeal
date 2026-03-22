'use client';

import { X, Flame, ShoppingCart, Clock, HeartPulse, Wheat, Droplet } from 'lucide-react';
import styles from './MealRecipeModal.module.css';
import ReactMarkdown from 'react-markdown';
import { calculateMealNutrition } from '@/lib/nutritionCalculator';

interface MealRecipeModalProps {
  meal: any;
  onClose: () => void;
}

export default function MealRecipeModal({ meal, onClose }: MealRecipeModalProps) {
  if (!meal) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.typeBadge}>{meal.type}</div>
          <h2 className={styles.title}>{meal.name}</h2>
        </div>

        {meal.ingredients && (
          <div className={styles.nutritionBanner}>
            <div className={styles.nutItem}>
              <Flame size={14} color="#e74c3c" />
              <span>{calculateMealNutrition(meal.ingredients).kcal} Kcal</span>
            </div>
            <div className={styles.nutItem}>
              <HeartPulse size={14} color="#2ecc71" />
              <span>{calculateMealNutrition(meal.ingredients).protein}g Protein</span>
            </div>
            <div className={styles.nutItem}>
              <Wheat size={14} color="#e67e22" />
              <span>{calculateMealNutrition(meal.ingredients).carbs}g Carbs</span>
            </div>
            <div className={styles.nutItem}>
              <Droplet size={14} color="#f1c40f" />
              <span>{calculateMealNutrition(meal.ingredients).fat}g Fat</span>
            </div>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <ShoppingCart size={18} />
              <h3>Nguyên liệu</h3>
            </div>
            <ul className={styles.ingredientList}>
              {meal.ingredients.map((ing: any) => (
                <li key={ing.id}>{ing.name}</li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Flame size={18} />
              <h3>Công thức nấu ăn</h3>
            </div>
            <div className={styles.recipeBody}>
              {meal.recipeContent ? (
                <ReactMarkdown>{meal.recipeContent}</ReactMarkdown>
              ) : (
                <p className={styles.noRecipe}>Chưa có hướng dẫn cho món này.</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.doneBtn} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
