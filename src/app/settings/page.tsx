'use client';

import { useState, useEffect } from 'react';
import { getKitchenGear, updateKitchenGear, getUserProfile } from '@/actions/auth';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { 
  Coffee, // Blender/Coffee maker
  Wind, // Air Fryer
  Flame, // Slow Cooker/Fire
  Zap, // Microwave
  ThermometerSun // Oven/Sous Vide
} from 'lucide-react';
import DashboardFooter from '@/components/DashboardFooter';

// Use generic icons that fit the description
const KITCHEN_GEAR_OPTIONS = [
  { id: 'Nồi chiên không dầu', label: 'Nồi chiên không dầu', icon: Wind },
  { id: 'Lò vi sóng', label: 'Lò vi sóng', icon: Zap },
  { id: 'Lò nướng', label: 'Lò nướng', icon: ThermometerSun },
  { id: 'Nồi nấu chậm', label: 'Nồi nấu chậm', icon: Flame },
  { id: 'Máy xay sinh tố', label: 'Máy xay sinh tố', icon: Coffee },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [selectedGear, setSelectedGear] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    async function loadData() {
      const [gear, profile] = await Promise.all([
        getKitchenGear(),
        getUserProfile()
      ]);
      setSelectedGear(gear);
      setUserProfile(profile);
    }
    loadData();
  }, []);

  const toggleGear = (id: string) => {
    setSelectedGear(prev => {
      if (prev.includes(id)) {
        return prev.filter(g => g !== id);
      } else {
        return [...prev, id];
      }
    });
    setMessage({ text: '', type: '' }); // Clear message on change
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    const result = await updateKitchenGear(selectedGear);
    if (result.success) {
      setMessage({ text: 'Đã lưu thiết bị bếp thành công! Trợ lý AI sẽ tối ưu công thức cho bạn.', type: 'success' });
    } else {
      setMessage({ text: result.error || 'Đã có lỗi xảy ra', type: 'error' });
    }
    
    setIsSaving(false);
  };

  const isPlus = userProfile?.plan === 'PLUS' || user?.plan === 'PLUS';

  let expirationText = 'Không giới hạn';
  if (isPlus) {
    if (userProfile?.planExpiresAt) {
      expirationText = new Date(userProfile.planExpiresAt).toLocaleDateString('vi-VN');
    } else if (userProfile?.updatedAt) {
      const expDate = new Date(userProfile.updatedAt);
      expDate.setMonth(expDate.getMonth() + 1);
      expirationText = expDate.toLocaleDateString('vi-VN');
    }
  }

  return (
    <>
      <main className={styles.settingsContainer}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Cài đặt cá nhân</h1>
            <p className={styles.subtitle}>Quản lý hồ sơ và ưu tiên của bạn</p>
          </div>

          <div className={styles.content}>
            {/* Subscription Section */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Gói đăng ký & Tài khoản</h2>
              <div className={`${styles.subscriptionCard} ${isPlus ? styles.subscriptionCardPlus : ''}`}>
                <div className={styles.planInfo}>
                  <div className={`${styles.planBadge} ${isPlus ? styles.planBadgePlus : ''}`}>{isPlus ? 'PLUS' : 'FREE'}</div>
                  <div className={styles.planDetails}>
                    <h3 className={styles.planName}>
                      {isPlus ? 'Yummeal Plus' : 'Gói Miễn Phí'}
                    </h3>
                    <p className={styles.planStatus}>
                      Trạng thái: <span className={styles.statusActive}>Đang hoạt động</span>
                    </p>
                  </div>
                </div>
                
                <div className={styles.subscriptionDates}>
                  <div className={styles.dateRow}>
                    <span className={styles.dateLabel}>Ngày hết hạn:</span>
                    <span className={styles.dateValue}>{expirationText}</span>
                  </div>
                </div>
              </div>
            </section>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>My Kitchen (Bếp của tôi)</h2>
              <p className={styles.sectionDesc}>
                Chọn các thiết bị bạn đang có. Trợ lý AI sẽ ưu tiên gợi ý các công thức có thể nấu bằng những thiết bị này.
              </p>

              <div className={styles.gearGrid}>
                {KITCHEN_GEAR_OPTIONS.map((gear) => {
                  const Icon = gear.icon;
                  const isSelected = selectedGear.includes(gear.id);
                  
                  return (
                    <button
                      key={gear.id}
                      className={`${styles.gearCard} ${isSelected ? styles.gearCardSelected : ''}`}
                      onClick={() => toggleGear(gear.id)}
                    >
                      <div className={styles.gearIcon}>
                        <Icon size={32} />
                      </div>
                      <span className={styles.gearLabel}>{gear.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.actionRow}>
                <button 
                  className={styles.saveBtn} 
                  onClick={handleSave} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thiết bị'}
                </button>
                
                {message.text && (
                  <p className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                    {message.text}
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <DashboardFooter />
    </>
  );
}
