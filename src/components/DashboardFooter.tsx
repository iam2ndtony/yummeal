import Link from 'next/link';
import styles from './DashboardFooter.module.css';

export default function DashboardFooter() {
  return (
    <footer className={styles.dashboardFooter}>
      {/* Decorative large swirl SVG background */}
      <div className={styles.swirlBg} aria-hidden="true">
        <svg viewBox="0 0 1440 500" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <ellipse cx="300" cy="250" rx="520" ry="420" stroke="rgba(255,255,255,0.25)" strokeWidth="80" fill="none"/>
          <ellipse cx="1140" cy="250" rx="380" ry="300" stroke="rgba(255,255,255,0.15)" strokeWidth="60" fill="none"/>
        </svg>
      </div>

      {/* Content: nav links top right */}
      <div className={styles.contentRow}>
        <div className={styles.navSection}>
          <h2 className={styles.tagline}>Nay ăn gì nhỉ&nbsp;?</h2>
          <nav className={styles.links}>
            <Link href="/">Trang chủ</Link>
            <Link href="#">Cộng đồng</Link>
            <Link href="#">Về Yummeal</Link>
            <Link href="#">Dịch vụ</Link>
            <Link href="#">Liên hệ</Link>
          </nav>
        </div>
      </div>

      {/* Watermark YUMMEAL text */}
      <div className={styles.watermarkRow}>
        <span className={styles.watermark}>YUMMEAL</span>
      </div>

      {/* Copyright bottom right */}
      <div className={styles.copyright}>
        © 2025 YUMMEAL. Thông minh. Thân thiện và Bền vững.
      </div>
    </footer>
  );
}
