'use client';

import { X, Flame, ShoppingCart, Clock } from 'lucide-react';
import styles from './MealRecipeModal.module.css';
import ReactMarkdown from 'react-markdown';

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
