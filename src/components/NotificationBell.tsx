'use client';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getFridgeItems } from '@/actions/fridge';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchNotifs() {
      try {
        const items = await getFridgeItems();
        if (mounted) {
          const alerts = items.filter((item: any) => [1, 3, 5].includes(item.remainingDays));
          setNotifications(alerts);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchNotifs();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={styles.wrapper}>
      <button className={styles.bellBtn} onClick={() => setShow(!show)} title="Thông báo hết hạn">
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className={styles.badge}>{notifications.length}</span>
        )}
      </button>

      {show && (
        <div className={styles.dropdown}>
          <div className={styles.header}>Thông báo tủ lạnh ({notifications.length})</div>
          {notifications.length === 0 ? (
            <div className={styles.item}>Không có thực phẩm nào sắp hết hạn (1/3/5 ngày)</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={styles.item}>
                <span style={{color: 'var(--warning)', fontWeight: 600}}>⚠️ Chú ý: </span>
                <span><strong>{n.name}</strong> ({n.quantity}) - Chỉ còn đúng <strong>{n.remainingDays} ngày</strong></span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
