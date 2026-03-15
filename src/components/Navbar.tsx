'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Thermometer, BookOpen, CalendarDays, MessageCircle, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/fridge', label: 'Tủ lạnh', icon: Thermometer },
  { href: '/recipes', label: 'Công thức', icon: BookOpen },
  { href: '/menu', label: 'Thực đơn', icon: CalendarDays },
  { href: '/assistant', label: 'Trợ lý AI', icon: MessageCircle },
];

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo}>
          <Home size={18} className={styles.logoIcon} />
          YUMMEAL
        </Link>

        <div className={styles.navLinks}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.navActions}>
          {!isLoading && (
            user ? (
              <div className={styles.userProfileWrapper}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    <UserIcon size={16} />
                  </div>
                  <span className={styles.userName}>{user.name}</span>
                  {user.plan === 'PLUS' && (
                    <span className={styles.plusBadge}>PLUS</span>
                  )}
                </div>
                {user.plan !== 'PLUS' && (
                  <Link href="/upgrade" className={styles.upgradeBtn}>
                    Nâng cấp
                  </Link>
                )}
                <button onClick={logout} className={styles.logoutBtn} title="Đăng xuất">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className={styles.loginBtn}>Đăng nhập</Link>
                <Link href="/register" className={styles.registerBtn}>Đăng ký</Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
