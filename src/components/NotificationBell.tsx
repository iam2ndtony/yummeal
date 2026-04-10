'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, Repeat2, CheckCheck } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '@/actions/social';
import styles from './NotificationBell.module.css';

const ICONS: Record<string, React.ReactNode> = {
  like: <Heart size={14} fill="#ef4444" color="#ef4444" />,
  comment: <MessageCircle size={14} color="#3b82f6" />,
  reply: <Repeat2 size={14} color="#8b5cf6" />,
  comment_like: <Heart size={14} fill="#f59e0b" color="#f59e0b" />,
};

export default function NotificationBell() {
  const [socialNotifs, setSocialNotifs] = useState<any[]>([]);
  const [fridgeNotifs, setFridgeNotifs] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fridge alerts
    let mounted = true;
    async function fetchFridge() {
      try {
        const { getFridgeItems } = await import('@/actions/fridge');
        const items = await getFridgeItems();
        if (mounted) setFridgeNotifs(items.filter((item: any) => [1, 3, 5].includes(item.remainingDays)));
      } catch {}
    }
    fetchFridge();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Social notifications
    let mounted = true;
    async function fetchSocial() {
      try {
        const notifs = await getNotifications();
        if (mounted) setSocialNotifs(notifs);
      } catch {}
    }
    fetchSocial();
    // Poll every 30s
    const interval = setInterval(fetchSocial, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const unreadCount = socialNotifs.filter(n => !n.isRead).length + fridgeNotifs.length;

  const handleOpen = async () => {
    const next = !show;
    setShow(next);
    if (next && socialNotifs.some(n => !n.isRead)) {
      setLoading(true);
      await markNotificationsRead();
      setSocialNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setLoading(false);
    }
  };

  const timeAgo = (date: Date) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button className={styles.bellBtn} onClick={handleOpen} title="Thông báo">
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {show && (
        <div className={styles.dropdown} style={{ width: '320px', maxHeight: '480px', overflowY: 'auto' }}>
          <div className={styles.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Thông báo</span>
            {loading && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đang cập nhật...</span>}
          </div>

          {/* Social notifications */}
          {socialNotifs.length > 0 && (
            <div>
              <div style={{ padding: '6px 14px 4px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hoạt động</div>
              {socialNotifs.map(n => (
                <div key={n.id} className={styles.item} style={{ background: n.isRead ? 'transparent' : 'rgba(211,84,0,0.04)', borderLeft: n.isRead ? 'none' : '3px solid var(--primary)' }}>
                  <span style={{ marginRight: '8px' }}>{ICONS[n.type] ?? <Bell size={14} />}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.87rem', color: 'var(--text-primary)' }}>{n.message}</span>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <CheckCheck size={12} color="var(--primary)" />}
                </div>
              ))}
            </div>
          )}

          {/* Fridge alerts */}
          {fridgeNotifs.length > 0 && (
            <div>
              <div style={{ padding: '6px 14px 4px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Tủ lạnh</div>
              {fridgeNotifs.map(n => (
                <div key={n.id} className={styles.item}>
                  <span style={{ color: '#f59e0b', fontWeight: 600, marginRight: '6px' }}>⚠️</span>
                  <span style={{ fontSize: '0.87rem' }}><strong>{n.name}</strong> ({n.quantity}) - còn <strong>{n.remainingDays} ngày</strong></span>
                </div>
              ))}
            </div>
          )}

          {socialNotifs.length === 0 && fridgeNotifs.length === 0 && (
            <div className={styles.item} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
              <Bell size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.87rem' }}>Không có thông báo mới</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
