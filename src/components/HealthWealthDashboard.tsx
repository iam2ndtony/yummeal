'use client';

import { useMemo } from 'react';
import { calculateWeeklyDashboard } from '@/lib/nutritionCalculator';
import styles from './HealthWealthDashboard.module.css';
import { HeartPulse, PiggyBank, Target, Flame, Wheat, Droplet } from 'lucide-react';

export default function HealthWealthDashboard({ weeklyMenu, fridgeItems }: { weeklyMenu: any[], fridgeItems: any[] }) {
  const stats = useMemo(() => calculateWeeklyDashboard(weeklyMenu, fridgeItems), [weeklyMenu, fridgeItems]);

  if (weeklyMenu.length === 0) return null;

  if (weeklyMenu.length === 0) return null;

  return (
    <div className={styles.dashboardCard}>
      <div className={styles.dashboardHeader}>
        <h3 className={styles.dashboardTitle}>
          <Target size={20} />
          Mục tiêu Sức Khỏe & Chống Lãng Phí
        </h3>
      </div>
      
      <div className={styles.dashboardContent}>
        {/* Health Section */}
        <div className={styles.healthSection}>
          <div className={styles.macroBlock} style={{ backgroundColor: 'rgba(231, 76, 60, 0.05)' }}>
            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(231,76,60,0.1)' }}>
              <Flame size={24} color="#e74c3c" />
            </div>
            <div className={styles.macroInfo}>
              <span className={styles.macroValue}>
                {stats.dailyAvgKcal}
                <span className={styles.perDayText}>/ ngày</span>
              </span>
              <span className={styles.macroLabel}>Calo (Kcal)</span>
            </div>
          </div>

          <div className={styles.macroBlock} style={{ backgroundColor: 'rgba(46, 204, 113, 0.05)' }}>
            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(46,204,113,0.1)' }}>
              <HeartPulse size={24} color="#2ecc71" />
            </div>
            <div className={styles.macroInfo}>
              <span className={styles.macroValue}>
                {stats.dailyAvgProtein}g
                <span className={styles.perDayText}>/ ngày</span>
              </span>
              <span className={styles.macroLabel}>Đạm (Protein)</span>
            </div>
          </div>

          <div className={styles.macroBlock} style={{ backgroundColor: 'rgba(230, 126, 34, 0.05)' }}>
            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(230,126,34,0.1)' }}>
              <Wheat size={24} color="#e67e22" />
            </div>
            <div className={styles.macroInfo}>
              <span className={styles.macroValue}>
                {stats.dailyAvgCarbs}g
                <span className={styles.perDayText}>/ ngày</span>
              </span>
              <span className={styles.macroLabel}>Tinh bột (Carbs)</span>
            </div>
          </div>

          <div className={styles.macroBlock} style={{ backgroundColor: 'rgba(241, 196, 15, 0.05)' }}>
            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(241,196,15,0.1)' }}>
              <Droplet size={24} color="#f39c14" />
            </div>
            <div className={styles.macroInfo}>
              <span className={styles.macroValue}>
                {stats.dailyAvgFat}g
                <span className={styles.perDayText}>/ ngày</span>
              </span>
              <span className={styles.macroLabel}>Chất béo (Fat)</span>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Wealth Section */}
        <div className={styles.wealthSection}>
          <div className={styles.wealthIconWrapper}>
            <PiggyBank size={32} color="#2ecc71" />
          </div>
          <div className={styles.wealthInfo}>
            <span className={styles.wealthValue}>
              {stats.totalSavings > 0 ? `${stats.totalSavings}k VNĐ` : '0đ'}
            </span>
            <span className={styles.wealthSubtitle}>Tiết kiệm được</span>
          </div>
        </div>
      </div>
      
      <div className={styles.footerCaption}>
        {stats.totalSavings > 0 
          ? `Nhờ sử dụng các nguyên liệu sắp hết hạn, bạn đã tiết kiệm được khoảng ${stats.totalSavings}.000đ tuần này!`
          : `Tủ lạnh của bạn đang trong trạng thái hoàn hảo, không có lãng phí tuần này!`}
      </div>
    </div>
  );
}
