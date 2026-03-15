'use client';

import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { generateMenuPlan } from '@/actions/menu';
import styles from './page.module.css';

export default function GenerateMenuButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await generateMenuPlan();
    setIsLoading(false);
    
    if (result.success) {
      alert('Tạo thực đơn thành công!');
    } else {
      alert(result.error || 'Có lỗi xảy ra khi tạo thực đơn.');
    }
  };

  return (
    <button 
      className={styles.generateBtn} 
      onClick={handleGenerate}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="spin" />
          Đang tạo...
        </>
      ) : (
        <>
          <Wand2 size={18} />
          Tạo thực đơn mới
        </>
      )}
    </button>
  );
}
