'use client';

import DashboardFooter from '@/components/DashboardFooter';
import { Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getRecipes } from '@/actions/recipes';
import { Recipe } from '@prisma/client';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadRecipes() {
      const data = await getRecipes();
      setRecipes(data);
      setLoading(false);
    }
    loadRecipes();
  }, []);

  return (
    <>
      <main className={styles.recipesContainer}>
        {/* Decorative swirl background */}
        <div className={styles.swirlBg} aria-hidden="true">
          <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="1300" cy="200" rx="500" ry="400" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
            <ellipse cx="100" cy="700" rx="400" ry="320" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
          </svg>
        </div>

        <div className={`container ${styles.inner}`}>
          {/* Sổ tay công thức cá nhân */}
          {!loading && recipes.filter(r => !r.image?.startsWith('/images/')).length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div className={styles.header} style={{ marginBottom: '20px' }}>
                <h2 className={styles.title} style={{ fontSize: '1.8rem' }}>Sổ tay công thức cá nhân</h2>
                <p className={styles.subtitle}>Các công thức do Trợ lý AI tạo và lưu trữ</p>
              </div>

              <div className={styles.grid}>
                {recipes.filter(r => !r.image?.startsWith('/images/')).map((recipe: Recipe) => (
                  <div
                    key={recipe.id}
                    className={styles.card}
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                  >
                    <div
                      className={styles.cardImage}
                      style={{
                        backgroundImage: recipe.image ? `url(${recipe.image})` : undefined,
                        backgroundColor: recipe.image ? undefined : '#f5f1e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {!recipe.image && <span style={{ color: '#D35400', fontSize: '0.9rem', fontWeight: 600 }}>Chưa có ảnh</span>}
                      <span className={`${styles.badge} ${styles[recipe.difficultyType]}`} style={{ position: 'absolute', top: 16, right: 16 }}>
                        {recipe.difficulty}
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <h3 className={styles.recipeTitle}>{recipe.title}</h3>
                      <p className={styles.recipeDescription}>{recipe.description}</p>
                      <div className={styles.metaInfo}>
                        <div className={styles.metaItem}><Clock size={14} /><span>{recipe.time}</span></div>
                        <div className={styles.metaItem}><Users size={14} /><span>{recipe.servings}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.header}>
            <h1 className={styles.title}>Bộ sưu tập Yummeal</h1>
            <p className={styles.subtitle}>Món ăn chuẩn vị với hướng dẫn từng bước chi tiết</p>
          </div>


          <div className={styles.grid}>
            {loading ? (
              <div className={styles.loadingContainer}><p>Đang tải công thức...</p></div>
            ) : recipes.length === 0 ? (
              <div className={styles.emptyState}><p>Chưa có công thức nào. Vui lòng đăng nhập để xem.</p></div>
            ) : (
            recipes.filter(r => r.image?.startsWith('/images/')).map((recipe: Recipe) => (
              <div
                key={recipe.id}
                className={styles.card}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
              >
                {/* Food photo area */}
                <div
                  className={styles.cardImage}
                  style={{
                    backgroundImage: recipe.image ? `url(${recipe.image})` : undefined,
                    backgroundColor: recipe.image ? undefined : '#D35400',
                  }}
                >
                  <span className={`${styles.badge} ${styles[recipe.difficultyType]}`}>
                    {recipe.difficulty}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.recipeTitle}>{recipe.title}</h3>
                  <p className={styles.recipeDescription}>{recipe.description}</p>
                  <div className={styles.metaInfo}>
                    <div className={styles.metaItem}><Clock size={14} /><span>{recipe.time}</span></div>
                    <div className={styles.metaItem}><Users size={14} /><span>{recipe.servings}</span></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && recipes.filter(r => r.image?.startsWith('/images/')).length > 6 && (
          <div className={styles.loadMore}>
            <button className="btn-primary" style={{ padding: '12px 40px' }}>Xem thêm</button>
          </div>
        )}
        </div>
      </main>

      <DashboardFooter />
    </>
  );
}
