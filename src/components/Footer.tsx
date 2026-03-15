'use client';

import Link from 'next/link';
import styles from './DashboardFooter.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>YUMMEAL</Link>
            <p>Trợ lý nấu ăn thông minh của bạn.</p>
          </div>
          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>Dịch vụ</h4>
              <Link href="/menu">Thực đơn</Link>
              <Link href="/recipes">Công thức</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
