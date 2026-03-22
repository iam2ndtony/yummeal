import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      {/* Background food photo */}
      <div className={styles.heroBg}></div>

      {/* Hero text content */}
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>YUMMEAL</h1>
        <p className={styles.heroSubtitle}>Trợ lý bếp thông minh của bạn</p>
        <div className={styles.ctaGroup}>
          <Link href="/fridge" className={styles.ctaBtn}>Bắt đầu quản lý thực phẩm</Link>
          <Link href="/assistant" className={styles.ctaBtnOutline}>Chat với AI đầu bếp</Link>
        </div>
      </div>

      {/* Orange wave divider */}
      <div className={styles.taglineBar}>
        <div className={styles.taglineContent}>
          <span>Thông minh</span>
          <span className={styles.dot}>•</span>
          <span>Thân thiện</span>
          <span className={styles.dot}>•</span>
          <span>Bền vững</span>
        </div>
      </div>
    </section>
  );
}
