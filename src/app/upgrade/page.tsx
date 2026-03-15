'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardFooter from '@/components/DashboardFooter';
import SubscriptionPlan from '@/components/SubscriptionPlan';
import { upgradePlanAction } from '@/actions/subscription';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function UpgradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsUpgrading(true);
    const res = await upgradePlanAction();
    setIsUpgrading(false);
    
    if (res.success) {
      alert('Nâng cấp thành công! Chào mừng tới Yummeal Plus.');
      router.push('/');
    } else {
      alert(res.error || 'Nâng cấp thất bại');
    }
  };

  return (
    <>
      <main className={`container ${styles.upgradeContainer}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Nâng cấp tài khoản</h1>
          <p className={styles.subtitle}>Mở khóa toàn bộ trải nghiệm AI với Yummeal Plus</p>
        </div>

        <div className={styles.plansGrid}>
          <SubscriptionPlan 
            title="Tài khoản Thường" 
            price="Miễn phí" 
            period="/mãi mãi" 
            features={[
              'Giới hạn 3 lần tạo thực đơn/ngày',
              'Giới hạn 3 câu hỏi AI/ngày',
              'Lưu trữ công thức cơ bản',
              'Quản lý tủ lạnh tiêu chuẩn'
            ]}
            buttonText={user?.plan === 'FREE' ? 'Gói hiện tại' : 'Bắt đầu ngay'}
            onAction={user?.plan === 'FREE' ? () => {} : undefined}
            href={!user ? '/login' : undefined}
          />
          <SubscriptionPlan 
            title="Yummeal Plus" 
            price="49.000đ" 
            period="/tháng" 
            features={[
              'Không giới hạn tạo thực đơn',
              'Không giới hạn trợ lý AI',
              'Lưu trữ công thức không giới hạn',
              'Cảnh báo tủ lạnh thông minh ưu tiên',
              'Hỗ trợ ưu tiên 24/7'
            ]}
            isPopular={true}
            buttonText={isUpgrading ? 'Đang xử lý...' : (user?.plan === 'PLUS' ? 'Gói hiện tại' : 'Thanh toán 49k')}
            onAction={user?.plan !== 'PLUS' ? handleUpgrade : () => {}}
          />
        </div>
      </main>
      <DashboardFooter />
    </>
  );
}
