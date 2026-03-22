'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardFooter from '@/components/DashboardFooter';
import SubscriptionPlan from '@/components/SubscriptionPlan';
import { upgradePlanAction } from '@/actions/subscription';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';
import styles from './page.module.css';

export default function UpgradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);

  const handleUpgradeClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setShowQR(true);
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
            buttonText={user?.plan === 'PLUS' ? 'Gói hiện tại' : 'Thanh toán 49k'}
            onAction={user?.plan !== 'PLUS' ? handleUpgradeClick : () => {}}
          />
        </div>

        {showQR && (
          <div className={styles.modalOverlay} onClick={() => setShowQR(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button className={styles.closeBtn} onClick={() => setShowQR(false)}>
                <X size={32} strokeWidth={1.5} />
              </button>
              <h2 className={styles.modalTitle}>Thanh toán Yummeal Plus</h2>
              <div className={styles.qrContainer}>
                {/* Thay thế ảnh dưới bằng ảnh QR thật của bạn (đặt tên qr-payment.png trong public) */}
                <img src="/qr-payment.png" alt="Mã QR Thanh Toán" className={styles.qrImage} />
              </div>
              <div className={styles.paymentInfo}>
                <p>Trị giá: <strong>49.000đ / tháng</strong></p>
                <p>Nội dung chuyển khoản (bắt buộc):</p>
                <div className={styles.transferCode}>YM {user?.email || 'email-cua-ban'}</div>
                <p className={styles.paymentNote}>
                  * Ban quản lý sẽ đối chiếu giao dịch và kích hoạt Plus thủ công cho bạn trong vòng 5-10 phút.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <DashboardFooter />
    </>
  );
}
