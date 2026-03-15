import { Check } from 'lucide-react';
import styles from './SubscriptionPlan.module.css';
import Link from 'next/link';

interface SubscriptionPlanProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  buttonText?: string;
  onAction?: () => void;
  href?: string;
}

export default function SubscriptionPlan({ title, price, period, features, isPopular, buttonText, onAction, href }: SubscriptionPlanProps) {
  return (
    <div className={`${styles.pricingCard} ${isPopular ? styles.popular : ''}`}>
      {isPopular && <div className={styles.popularBadge}>Phổ biến nhất</div>}
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.priceContainer}>
          <span className={styles.price}>{price}</span>
          <span className={styles.period}>{period}</span>
        </div>
      </div>
      <ul className={styles.featuresList}>
        {features.map((f, i) => (
          <li key={i} className={styles.featureItem}>
            <Check size={18} className={styles.checkIcon} />
            {f}
          </li>
        ))}
      </ul>
      {onAction ? (
        <button onClick={onAction} className={isPopular ? 'btn-primary' : styles.btnOutline} style={{ width: '100%', marginTop: 'auto' }}>
          {buttonText || 'Bắt đầu ngay'}
        </button>
      ) : (
        <Link href={href || "/register"} className={isPopular ? 'btn-primary' : styles.btnOutline} style={{ display: 'block', textAlign: 'center', marginTop: 'auto' }}>
          {buttonText || 'Bắt đầu ngay'}
        </Link>
      )}
    </div>
  );
}
