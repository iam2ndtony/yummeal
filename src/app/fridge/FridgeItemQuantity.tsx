'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, Loader2, X, Check, Calculator } from 'lucide-react';
import { updateFridgeItemQuantity } from '@/actions/fridge';

export default function FridgeItemQuantity({ itemId, initialQuantity }: { itemId: string, initialQuantity: string }) {
  const [quantityStr, setQuantityStr] = useState(initialQuantity);
  const [tempValue, setTempValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const parseQuantity = (str: string) => {
    const match = str.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) return { num: parseFloat(match[1]), unit: match[2] };
    return { num: 1, unit: str };
  };

  const { unit } = parseQuantity(quantityStr);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const { num } = parseQuantity(quantityStr);
      setTempValue(num.toString());
    }
  }, [isEditing, quantityStr]);

  const handleQuickChange = async (delta: number) => {
    const { num, unit } = parseQuantity(quantityStr);
    let step = num >= 100 ? 50 : 1;
    let newNum = Math.max(0, num + (delta * step));
    const newStr = `${newNum} ${unit}`.trim();
    
    setQuantityStr(newStr);
    setIsLoading(true);
    await updateFridgeItemQuantity(itemId, newStr);
    setIsLoading(false);
  };

  const handleSaveManual = async () => {
    const newNum = parseFloat(tempValue);
    if (isNaN(newNum)) return setIsEditing(false);
    
    const newStr = `${newNum} ${unit}`.trim();
    setQuantityStr(newStr);
    setIsEditing(false);
    setIsLoading(true);
    await updateFridgeItemQuantity(itemId, newStr);
    setIsLoading(false);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={(e) => { e.stopPropagation(); handleQuickChange(-1); }} disabled={isLoading} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
        
        <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} style={{ position: 'relative', cursor: 'pointer', padding: '4px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', minWidth: '60px', textAlign: 'center' }}>
          <span style={{ fontWeight: 700, color: '#1e293b' }}>{quantityStr}</span>
          {isLoading && <Loader2 size={12} className="spin" style={{ position: 'absolute', top: -5, right: -5, color: 'var(--primary)' }} />}
        </div>
        
        <button onClick={(e) => { e.stopPropagation(); handleQuickChange(1); }} disabled={isLoading} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
      </div>

      {isEditing && mounted && createPortal(
        <div onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '320px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button 
              onClick={() => setIsEditing(false)} 
              style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px', marginTop: 0 }}>Cập nhật số lượng</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Đơn vị tính: <strong>{unit}</strong></p>
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                ref={inputRef} 
                type="number" 
                step="any"
                value={tempValue} 
                onChange={e => setTempValue(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSaveManual()} 
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid var(--primary)', fontSize: '1.5rem', fontWeight: 800, outline: 'none', textAlign: 'center', background: '#fff' }} 
              />
              <Calculator size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }} />
            </div>

            <button 
              onClick={handleSaveManual} 
              style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(211, 84, 0, 0.3)' }}
            >
              <Check size={20} /> Xác nhận
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
