'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Thermometer, BookOpen, CalendarDays, MessageCircle, Users } from 'lucide-react';
import styles from './MobileBottomNav.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/fridge', label: 'Tủ lạnh', icon: Thermometer },
  { href: '/community', label: 'Chia sẻ', icon: Users },
  { href: '/recipes', label: 'Công thức', icon: BookOpen },
  { href: '/menu', label: 'Thực đơn', icon: CalendarDays },
  { href: '/assistant', label: 'Trợ lý AI', icon: MessageCircle },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.bottomNavContainer}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
