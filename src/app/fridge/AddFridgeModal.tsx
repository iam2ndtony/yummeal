'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { addFridgeItem } from '@/actions/fridge';
import styles from './page.module.css';

export default function AddFridgeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await addFridgeItem(formData);

    if (result.success) {
      setIsOpen(false);
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
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Thêm thực phẩm mới</h2>
              <button className="closeBtn" onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modalForm">
              {error && <div className="errorAlert">{error}</div>}
              
              <div className="inputGroup">
                <label htmlFor="name">Tên thực phẩm</label>
                <input type="text" id="name" name="name" required placeholder="VD: Sữa tươi" />
              </div>

              <div className="inputGroup">
                <label htmlFor="category">Danh mục</label>
                <select id="category" name="category" required>
                  <option value="Thịt">Thịt</option>
                  <option value="Rau củ">Rau củ</option>
                  <option value="Ngũ cốc">Ngũ cốc</option>
                  <option value="Gia vị">Gia vị</option>
                  <option value="Sữa và trứng">Sữa & Trứng</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="inputGroup">
                <label htmlFor="quantity">Số lượng</label>
                <input type="text" id="quantity" name="quantity" required placeholder="VD: 2 kg, 1 hộp..." />
              </div>

              <div className="inputGroup">
                <label htmlFor="expiryDays">Lưu trữ trong (số ngày)</label>
                <input type="number" id="expiryDays" name="expiryDays" required min="1" placeholder="VD: 7" />
              </div>

              <div className="modalActions">
                <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? <Loader2 size={18} className="spin" /> : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
