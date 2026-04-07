import DashboardFooter from '@/components/DashboardFooter';
import { AlertCircle, Trash2 } from 'lucide-react';
import styles from './page.module.css';
import { getFridgeItems, deleteFridgeItem } from '@/actions/fridge';
import AddFridgeModal from './AddFridgeModal';
import { FridgeItem } from '@prisma/client';
import FridgeItemQuantity from './FridgeItemQuantity';

export default async function FridgePage() {
  const fridgeItems: any[] = await getFridgeItems();
  const warningItems = fridgeItems.filter((item: any) => item.statusType === 'warning' || item.statusType === 'urgent').length;

  return (
    <>
      <main className={styles.fridgeContainer}>
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
              <h1 className={styles.title}>Tủ lạnh của tôi</h1>
              <p className={styles.subtitle}>Theo dõi nguyên liệu và giảm lãng phí</p>
            </div>
            <AddFridgeModal />
          </div>

        {/* Warning Alert */}
        {warningItems > 0 && (
          <div className={styles.alertBanner}>
            <AlertCircle size={20} />
            <span>{warningItems} thực phẩm cần chú ý - dùng sớm để tránh lãng phí!</span>
          </div>
        )}

        {/* Ingredients Grid */}
        {fridgeItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>Tủ lạnh của bạn đang trống. Hãy thêm thực phẩm mới nhé!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {fridgeItems.map((item: any) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <span className={styles.category}>{item.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`${styles.badge} ${styles[item.statusType]}`}>
                      {item.status}
                    </span>
                    <form action={async () => {
                      'use server';
                      await deleteFridgeItem(item.id);
                    }}>
                      <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.statRow}>
                    <span>Độ tươi</span>
                    <span className={styles[item.statusType]}>{item.freshness}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ 
                        width: `${item.freshness}%`,
                        backgroundColor: item.statusType === 'fresh' ? 'var(--success)' : 
                                         item.statusType === 'warning' ? 'var(--warning)' : 'var(--error)'
                      }}
                    />
                  </div>

                  <div className={styles.detailsList}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Số lượng:</span>
                      <FridgeItemQuantity itemId={item.id} initialQuantity={item.quantity} />
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Tình trạng:</span>
                      <span className={styles.detailValue}>{item.remainingDays > 0 ? `Còn ${item.remainingDays} ngày` : 'Đã hết hạn'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        </div>
      </main>
      
      <DashboardFooter />
    </>
  );
}
