import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Clock, Users } from 'lucide-react';
import { getRecipeById, getDefaultIngredients } from '@/actions/recipes';
import { getSession } from '@/lib/auth';
import DashboardFooter from '@/components/DashboardFooter';
import RecipeImageUpload from './RecipeImageUpload';
import RecipeActions from './RecipeActions';
import styles from './page.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) notFound();

  const session = await getSession();
  const isOwner = session?.id === recipe.userId;

  let ingredientList: string[] = [];
  let detailedInstructionsDisplay: string = '';

  try {
    const parsedData = JSON.parse(recipe.detailedInstructions || '{}');
    if (parsedData && parsedData.aiIngredients) {
      ingredientList = parsedData.aiIngredients;
    }
    if (parsedData && parsedData.aiDetailed) {
      detailedInstructionsDisplay = parsedData.aiDetailed;
    }
  } catch (e) {
    // If not JSON, it's just a normal string
    detailedInstructionsDisplay = recipe.detailedInstructions;
  }

  if (ingredientList.length === 0) {
    const ingredientsString = await getDefaultIngredients(recipe.title);
    ingredientList = ingredientsString ? ingredientsString.split('\n').filter(Boolean) : [];
  }

  const stepList: string[] = recipe.instructions ? recipe.instructions.split('\n').filter(Boolean) : [];

  return (
    <>
      <main className={styles.page}>
        {/* Decorative swirl background */}
        <div className={styles.swirlBg} aria-hidden="true">
          <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="1300" cy="200" rx="500" ry="400" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
            <ellipse cx="100" cy="700" rx="400" ry="320" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
          </svg>
        </div>

        <div className={`container ${styles.inner}`}>
          {/* Back link */}
          <Link href="/recipes" className={styles.backLink}>
            <ChevronLeft size={18} />
            Quay lại công thức
          </Link>

          {/* Recipe card */}
          <div className={styles.recipeCard}>
            {/* Hero food photo */}
            {(!recipe.image?.startsWith('/images/') && isOwner) ? (
              <RecipeImageUpload recipeId={recipe.id} initialImage={recipe.image} />
            ) : recipe.image && (
              <div className={styles.heroPhoto}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={recipe.image} alt={recipe.title} />
              </div>
            )}

            {/* Title + meta */}
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{recipe.title}</h1>
              <span className={`${styles.badge} ${styles[recipe.difficultyType]}`}>
                {recipe.difficulty}
              </span>
            </div>
            <p className={styles.description}>{recipe.description}</p>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}><Clock size={16} /> {recipe.time}</span>
              <span className={styles.metaItem}><Users size={16} /> {recipe.servings}</span>
            </div>

            {/* Two columns: ingredients + steps */}
            <div className={styles.body}>
              {/* Ingredients column */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Nguyên liệu</h2>
                {ingredientList.length > 0 ? (
                  <ul className={styles.ingredientList}>
                    {ingredientList.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.muted}>Xem hướng dẫn bên dưới.</p>
                )}
              </div>

              {/* Steps column */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Cách làm</h2>
                <ol className={styles.stepList}>
                  {stepList.map((step: string, i: number) => {
                    const text = step.replace(/^\d+\.\s*/, '');
                    return (
                      <li key={i}>
                        <span className={styles.stepNum}>{i + 1}</span>
                        <span>{text}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* Detailed instructions */}
            {detailedInstructionsDisplay && (
              <div className={styles.detailedSection}>
                <h2 className={styles.sectionTitle}>Hướng dẫn chi tiết</h2>
                <div className={styles.detailedText}>
                  {detailedInstructionsDisplay.split('\n').map((line: string, i: number) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.actions}>
              {(!recipe.image?.startsWith('/images/') && isOwner) && (
                <RecipeActions 
                  recipe={recipe} 
                  ingredientList={ingredientList} 
                  detailedInstructionsDisplay={detailedInstructionsDisplay} 
                />
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Link href="/recipes" className={styles.btnOutline}>Quay lại công thức</Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DashboardFooter />
    </>
  );
}
