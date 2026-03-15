import { getMenuPlans } from '@/actions/menu';
import GenerateMenuButton from './GenerateMenuButton';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import MenuContent from './MenuContent';
import DashboardFooter from '@/components/DashboardFooter';
import { Sparkles } from 'lucide-react';
import styles from './page.module.css';

export default async function MenuPage() {
  const weeklyMenu = await getMenuPlans();
  const session = await getSession();

  return (
    <>
      <main className={styles.menuContainer}>
        {/* Decorative swirl background */}
        <div className={styles.swirlBg} aria-hidden="true">
          <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="1300" cy="200" rx="500" ry="400" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
            <ellipse cx="100" cy="700" rx="400" ry="320" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
          </svg>
        </div>

        <div className={`container ${styles.inner}`}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Thực đơn tuần này</h1>
              <p className={styles.subtitle}>Gợi ý công thức dựa trên tủ lạnh của bạn</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <GenerateMenuButton />
              {session?.plan !== 'PLUS' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gói Miễn phí: 3 lượt/ngày. <Link href="/upgrade" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Nâng cấp</Link>
                </p>
              )}
            </div>
          </div>

          <MenuContent weeklyMenu={weeklyMenu} />

          {weeklyMenu.length > 0 && (
            <div className={styles.aiAlertBox}>
              <div className={styles.aiAlertHeader}>
                <Sparkles size={18} />
                <h4>Cá nhân hóa bởi AI</h4>
              </div>
              <p className={styles.aiAlertText}>
                Thực đơn này sử dụng nguyên liệu từ tủ lạnh của bạn, đặc biệt là những thực phẩm
                sắp hết hạn. Nó cũng xem xét lịch sử nấu ăn và sở thích của bạn để gợi ý
                những món bạn yêu thích.
              </p>
            </div>
          )}
        </div>
      </main>

      <DashboardFooter />
    </>
  );
}
