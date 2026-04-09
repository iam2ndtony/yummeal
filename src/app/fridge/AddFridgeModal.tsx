'use client';

import { useState } from 'react';
import { Plus, X, Loader2, Info } from 'lucide-react';
import { addFridgeItem } from '@/actions/fridge';
import styles from './page.module.css';

const QUICK_ITEMS = [
  { name: 'Thịt heo', category: 'Thịt', expiry: 5, icon: '🥩' },
  { name: 'Thịt bò', category: 'Thịt', expiry: 5, icon: '🥩' },
  { name: 'Thịt gà', category: 'Thịt', expiry: 4, icon: '🍗' },
  { name: 'Thịt vịt', category: 'Thịt', expiry: 4, icon: '🦆' },
  
  { name: 'Cá biển', category: 'Thịt', expiry: 3, icon: '🐟' },
  { name: 'Tôm mực', category: 'Thịt', expiry: 3, icon: '🍤' },
  { name: 'Cua ghẹ', category: 'Thịt', expiry: 2, icon: '🦀' },
  { name: 'Chả lụa', category: 'Khác', expiry: 7, icon: '🌯' },

  { name: 'Trứng gà', category: 'Sữa và trứng', expiry: 14, icon: '🥚' },
  { name: 'Trứng vịt', category: 'Sữa và trứng', expiry: 14, icon: '🥚' },
  { name: 'Sữa tươi', category: 'Sữa và trứng', expiry: 7, icon: '🥛' },
  { name: 'Sữa chua', category: 'Sữa và trứng', expiry: 10, icon: '🍨' },

  { name: 'Rau cải', category: 'Rau củ', expiry: 4, icon: '🥬' },
  { name: 'Bắp cải', category: 'Rau củ', expiry: 7, icon: '🥗' },
  { name: 'Rau muống', category: 'Rau củ', expiry: 3, icon: '🥬' },
  { name: 'Đậu cove', category: 'Rau củ', expiry: 5, icon: '🫛' },

  { name: 'Cà rốt', category: 'Rau củ', expiry: 10, icon: '🥕' },
  { name: 'Khoai tây', category: 'Rau củ', expiry: 14, icon: '🥔' },
  { name: 'Cà chua', category: 'Rau củ', expiry: 7, icon: '🍅' },
  { name: 'Nấm', category: 'Rau củ', expiry: 5, icon: '🍄' },
  
  { name: 'Đậu hũ', category: 'Rau củ', expiry: 3, icon: '🧊' },
  { name: 'Hành tiêu', category: 'Gia vị', expiry: 21, icon: '🧅' },
  { name: 'Tỏi gừng', category: 'Gia vị', expiry: 30, icon: '🧄' },
  { name: 'Ớt chanh', category: 'Gia vị', expiry: 14, icon: '🌶️' },

  { name: 'Gạo tẻ', category: 'Ngũ cốc', expiry: 90, icon: '🌾' },
  { name: 'Bún phở', category: 'Ngũ cốc', expiry: 3, icon: '🍜' },
  { name: 'Mì gói', category: 'Ngũ cốc', expiry: 180, icon: '🍜' },
  { name: 'Bánh mì', category: 'Ngũ cốc', expiry: 3, icon: '🥖' },
];

export default function AddFridgeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Controlled form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Thịt');
  const [quantity, setQuantity] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');

  const handleSelectQuickItem = (item: typeof QUICK_ITEMS[0]) => {
    setName(item.name);
    setCategory(item.category);
    setExpiryDays(item.expiry.toString());
    // Auto focus quantity
    document.getElementById('quantity')?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('quantity', quantity);
    formData.append('expiryDays', expiryDays);

    const result = await addFridgeItem(formData);

    if (result.success) {
      setIsOpen(false);
      setName('');
      setCategory('Thịt');
      setQuantity('');
      setExpiryDays('7');
    } else {
      setError(result.error || 'Đã có lỗi xảy ra');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <button className={styles.addBtn} onClick={() => setIsOpen(true)}>
        <Plus size={18} />
        Thêm thực phẩm
      </button>

      {isOpen && (
        <div className="modalOverlay" onClick={() => setIsOpen(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', display: 'flex', flexDirection: 'column', padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
            
            <div className="modalHeader" style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: 0 }}>Thêm thực phẩm mới</h2>
              <button className="closeBtn" onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.addModalBody}>
              {/* Left Side: Quick Select Grid */}
              <div className={styles.quickSelectSection}>
                <h3 className={styles.sectionTitle}>Gợi ý nhanh</h3>
                <p className={styles.sectionDesc}>Bấm để điền tự động (Thay ảnh dễ dàng trong code)</p>
                <div className={styles.quickGrid}>
                  {QUICK_ITEMS.map((item, idx) => (
                    <button 
                      key={idx} 
                      type="button" 
                      className={`${styles.quickItem} ${name === item.name ? styles.quickItemActive : ''}`}
                      onClick={() => handleSelectQuickItem(item)}
                    >
                      <div className={styles.quickIcon}>{item.icon}</div>
                      <span className={styles.quickName}>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

               {/* Right Side: Form */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Chi tiết</h3>
                
                <style>{`
                  .modern-input-group label {
                    font-weight: 700;
                    color: var(--text-dark);
                    font-size: 0.85rem;
                    margin-bottom: 6px;
                    display: block;
                  }
                  .modern-input {
                    width: 100%;
                    padding: 14px 16px;
                    background-color: var(--bg-main);
                    border: 2px solid transparent;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                    outline: none;
                    color: var(--text-dark);
                    font-weight: 500;
                  }
                  .modern-input:focus {
                    background-color: var(--bg-card);
                    border-color: var(--primary);
                    box-shadow: 0 4px 12px rgba(211, 84, 0, 0.1);
                  }
                  .chip-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                  }
                  .chip {
                    padding: 8px 14px;
                    border-radius: 99px;
                    background-color: var(--bg-main);
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s;
                    flex: 1 1 auto;
                    text-align: center;
                  }
                  .chip.active {
                    background-color: rgba(211, 84, 0, 0.1);
                    color: var(--primary);
                    border-color: var(--primary);
                  }
                `}</style>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: 0, marginTop: '16px' }}>
                  {error && <div className="errorAlert">{error}</div>}
                  
                  <div className="modern-input-group">
                    <label htmlFor="name">Trữ gì hôm nay?</label>
                    <input type="text" id="name" name="name" className="modern-input" value={name} onChange={e => setName(e.target.value)} required placeholder="VD: Sữa tươi, Sườn non..." />
                  </div>

                  <div className="modern-input-group">
                    <label>Phân loại mảng</label>
                    <div className="chip-container">
                      {[
                        { val: 'Thịt', icon: '🥩' },
                        { val: 'Rau củ', icon: '🥬' },
                        { val: 'Sữa và trứng', icon: '🥚' },
                        { val: 'Ngũ cốc', icon: '🌾' },
                        { val: 'Gia vị', icon: '🧂' },
                        { val: 'Khác', icon: '📦' }
                      ].map(cat => (
                        <div 
                          key={cat.val}
                          className={`chip ${category === cat.val ? 'active' : ''}`}
                          onClick={() => setCategory(cat.val)}
                        >
                          {cat.icon} {cat.val === 'Sữa và trứng' ? 'Sữa/Trứng' : cat.val}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                    <div className="modern-input-group">
                      <label htmlFor="quantity">Số lượng</label>
                      <input type="text" id="quantity" name="quantity" className="modern-input" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder="VD: 500g, 2 hộp..." />
                    </div>

                    <div className="modern-input-group">
                      <label htmlFor="expiryDays">Thời hạn (ngày)</label>
                      <input type="number" id="expiryDays" name="expiryDays" className="modern-input" value={expiryDays} onChange={e => setExpiryDays(e.target.value)} required min="1" placeholder="VD: 7" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={() => setIsOpen(false)} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#f8fafc', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                      Đóng
                    </button>
                    <button type="submit" disabled={isLoading} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 16px -4px rgba(211,84,0,0.3)' }}>
                      {isLoading ? <Loader2 size={18} className="spin" /> : 'Lưu vào tủ lạnh'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
