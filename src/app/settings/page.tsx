'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getKitchenGear, updateKitchenGear, getUserProfile, updateAvatar } from '@/actions/auth';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import Cropper from 'react-easy-crop';
import { createPortal } from 'react-dom';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { 
  Coffee,
  Wind,
  Flame,
  Zap,
  ThermometerSun
} from 'lucide-react';
import DashboardFooter from '@/components/DashboardFooter';

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string | null> {
  const img = new Image();
  img.src = imageSrc;
  await new Promise((res) => (img.onload = res));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  const MAX = 300;
  if (pixelCrop.width > MAX) {
    const sc = document.createElement('canvas'); const scCtx = sc.getContext('2d');
    sc.width = MAX; sc.height = (pixelCrop.height * MAX) / pixelCrop.width;
    scCtx?.drawImage(canvas, 0, 0, sc.width, sc.height);
    return sc.toDataURL('image/jpeg', 0.85);
  }
  return canvas.toDataURL('image/jpeg', 0.85);
}

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

  // Avatar state
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [rawAvatarSrc, setRawAvatarSrc] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarAreaPixels, setAvatarAreaPixels] = useState<any>(null);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const avatarAreaPixelsRef = useRef<any>(null);

  const onAvatarCropComplete = useCallback((_: any, pixels: any) => {
    setAvatarAreaPixels(pixels);
    avatarAreaPixelsRef.current = pixels;
  }, []);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      // Pre-compute default square crop so confirm works even without user interaction
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.naturalWidth, img.naturalHeight);
        const defaultPixels = {
          x: Math.floor((img.naturalWidth - size) / 2),
          y: Math.floor((img.naturalHeight - size) / 2),
          width: size,
          height: size,
        };
        setAvatarAreaPixels(defaultPixels);
        avatarAreaPixelsRef.current = defaultPixels;
      };
      img.src = src;
      setRawAvatarSrc(src);
      setAvatarCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarCropConfirm = async () => {
    const pixels = avatarAreaPixelsRef.current ?? avatarAreaPixels;
    if (!rawAvatarSrc || !pixels) return;
    setAvatarSaving(true);
    const cropped = await getCroppedImg(rawAvatarSrc, pixels);
    if (cropped) {
      const res = await updateAvatar(cropped);
      if (res.success) { setAvatarUrl(cropped); setAvatarSuccess(true); setTimeout(() => setAvatarSuccess(false), 3000); }
    }
    setAvatarSaving(false);
    setAvatarCropOpen(false);
    setRawAvatarSrc(null);
  };

  useEffect(() => {
    async function loadData() {
      const [gear, profile] = await Promise.all([getKitchenGear(), getUserProfile()]);
      setSelectedGear(gear);
      setUserProfile(profile);
      if ((profile as any)?.avatarUrl) setAvatarUrl((profile as any).avatarUrl);
    }
    loadData();
  }, []);

  const toggleGear = (id: string) =>{
    setSelectedGear(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    setMessage({ text: '', type: '' });
  };

  const handleSave = async () => {
    setIsSaving(true); setMessage({ text: '', type: '' });
    const result = await updateKitchenGear(selectedGear);
    if (result.success) setMessage({ text: 'Đã lưu thiết bị bếp thành công! Trợ lý AI sẽ tối ưu công thức cho bạn.', type: 'success' });
    else setMessage({ text: result.error || 'Đã có lỗi xảy ra', type: 'error' });
    setIsSaving(false);
  };

  const isPlus = userProfile?.plan === 'PLUS' || user?.plan === 'PLUS';

  let expirationText = 'Không giới hạn';
  if (isPlus) {
    if (userProfile?.planExpiresAt) expirationText = new Date(userProfile.planExpiresAt).toLocaleDateString('vi-VN');
    else if (userProfile?.updatedAt) { const d = new Date(userProfile.updatedAt); d.setMonth(d.getMonth() + 1); expirationText = d.toLocaleDateString('vi-VN'); }
  }

  // Derive display avatar
  const displayAvatar = avatarUrl || (userProfile ? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userProfile.id || 'user')}` : null);

  return (
    <>
      {mounted && avatarCropOpen && rawAvatarSrc && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '90%', maxWidth: '500px', height: '400px', backgroundColor: '#333', borderRadius: '12px', overflow: 'hidden' }}>
            <Cropper
              image={rawAvatarSrc}
              crop={avatarCrop}
              zoom={avatarZoom}
              aspect={1}
              onCropChange={setAvatarCrop}
              onCropComplete={onAvatarCropComplete}
              onZoomChange={setAvatarZoom}
            />
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
            <button
              onClick={() => { setAvatarCropOpen(false); setRawAvatarSrc(null); }}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#475569', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              <X size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }}/> Hủy
            </button>
            <button
              onClick={handleAvatarCropConfirm}
              disabled={avatarSaving}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {avatarSaving ? <Loader2 size={18} className="animate-spin" style={{ marginRight: '6px' }}/> : <Check size={18} style={{ marginRight: '6px' }}/>}
              {avatarSaving ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </div>,
        document.body
      )}
      <main className={styles.settingsContainer}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Cài đặt cá nhân</h1>
            <p className={styles.subtitle}>Quản lý hồ sơ và ưu tiên của bạn</p>
          </div>

          <div className={styles.content}>

            {/* ── Avatar Section ── */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Hình ảnh đại diện</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                  {displayAvatar && (
                    <img
                      src={displayAvatar}
                      alt="avatar"
                      style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 4px 12px rgba(211,84,0,0.2)' }}
                    />
                  )}
                  <button
                    onClick={() => avatarFileRef.current?.click()}
                    style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'var(--primary)', border: '2px solid white', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0', fontSize: '1rem' }}>{user?.name}</p>
                  <p style={{ color: '#94a3b8', margin: '0 0 12px 0', fontSize: '0.85rem' }}>{userProfile?.email}</p>
                  <button
                    onClick={() => avatarFileRef.current?.click()}
                    style={{ padding: '9px 18px', borderRadius: '10px', border: '1.5px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Camera size={15} /> Thay ảnh đại diện
                  </button>
                  {avatarSuccess && <p style={{ color: '#22c55e', margin: '8px 0 0 0', fontSize: '0.85rem', fontWeight: 600 }}>✅ Đã cập nhật ảnh!</p>}
                </div>
              </div>
              <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
            </section>
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
