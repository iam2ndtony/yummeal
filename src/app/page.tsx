import Hero from '@/components/Hero';
import FeatureCard from '@/components/FeatureCard';
import Link from 'next/link';
import { Leaf, Bot, CalendarDays, Recycle, BookOpen, MessageSquare } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Hero />

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className="container">
          <h2 className={styles.featuresSectionTitle}>Mọi thứ bạn cần cho một<br />bữa ăn chuẩn Việt</h2>
          <div className={styles.featuresGrid}>
            <FeatureCard icon={<Leaf size={22} />} title="Quản lý thực phẩm" description="Theo dõi nguyên liệu với cảnh báo hạn sử dụng thông minh và kho trực quan" />
            <FeatureCard icon={<Bot size={22} />} title="Trợ lý bếp AI" description="Nhận gợi ý công thức cá nhân hóa dựa trên nguyên liệu bạn có" />
            <FeatureCard icon={<CalendarDays size={22} />} title="Lập thực đơn" description="AI học sở thích của bạn để đề xuất thực đơn hàng ngày hoàn hảo" />
            <FeatureCard icon={<Recycle size={22} />} title="Giảm lãng phí" description="Nhắc nhở thông minh và công thức sử dụng nguyên liệu trước khi hỏng" />
            <FeatureCard icon={<BookOpen size={22} />} title="Kho công thức" description="Công thức món Việt chuẩn vị với hướng dẫn từng bước chi tiết" />
            <FeatureCard icon={<MessageSquare size={22} />} title="Trợ lý chat" description="Hỏi bất cứ điều gì về món ăn, nguyên liệu hay ẩm thực Việt Nam" />
          </div>
        </div>
      </section>

      {/* Orange CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Sẵn sàng chế biến<br />món ăn của riêng bạn?</h2>
          <Link href="/register" className={styles.ctaDarkBtn}>Bắt đầu ngay</Link>
        </div>
      </section>
    </>
  );
}
