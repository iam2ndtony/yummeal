'use client';

import { useState } from 'react';
import { Pencil, Trash2, X, Clock, Users, BarChart3, ChefHat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteRecipe, updateRecipe } from '@/actions/recipes';

export default function RecipeActions({ recipe, ingredientList, detailedInstructionsDisplay }: { recipe: any, ingredientList: string[], detailedInstructionsDisplay: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: recipe.title,
    description: recipe.description,
    time: recipe.time,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: ingredientList.join('\n'),
    instructions: recipe.instructions,
    detailedInstructions: detailedInstructionsDisplay
  });

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa công thức này?')) return;
    setIsDeleting(true);
    const res = await deleteRecipe(recipe.id);
    if (res.success) router.push('/recipes');
    else setIsDeleting(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    await updateRecipe(recipe.id, formData);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button 
          onClick={() => setIsEditing(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            backgroundColor: 'white', color: '#333', border: '1px solid #e2e8f0', borderRadius: '14px',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <Pencil size={18} style={{ color: 'var(--primary)' }} /> Chỉnh sửa
        </button>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '14px',
            fontWeight: 700, fontSize: '0.9rem', cursor: isDeleting ? 'not-allowed' : 'pointer', 
            transition: 'all 0.2s', opacity: isDeleting ? 0.6 : 1
          }}
        >
          <Trash2 size={18} /> {isDeleting ? 'Đang xóa...' : 'Xóa món'}
        </button>
      </div>

      {isEditing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setIsEditing(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <X size={20} />
            </button>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Biên tập công thức</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Cập nhật lại các thông tin chi tiết cho món ăn của bạn.</p>
            </div>
            
            <form onSubmit={handleUpdate} className="modalForm" style={{ marginTop: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '20px' }}>
                <div className="inputGroup">
                  <label>Tên món ăn</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="VD: Bánh Flan Sữa Tươi" />
                </div>
                <div className="inputGroup">
                  <label>Độ khó</label>
                  <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>
              </div>
              
              <div className="inputGroup">
                <label>Mô tả ngắn gọn</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ minHeight: '80px', resize: 'vertical', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--border-color)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
                <div className="inputGroup">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Thời gian</label>
                  <input required type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} placeholder="vd: 30 phút" />
                </div>
                <div className="inputGroup">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} /> Khẩu phần</label>
                  <input required type="text" value={formData.servings} onChange={e => setFormData({...formData, servings: e.target.value})} placeholder="vd: 2 người" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                <div className="inputGroup">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart3 size={16} /> Nguyên liệu</label>
                  <textarea required value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} style={{ minHeight: '180px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', lineHeight: '1.6' }} placeholder="Mỗi dòng 1 nguyên liệu..." />
                </div>
                <div className="inputGroup">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ChefHat size={16} /> Cách làm</label>
                  <textarea required value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} style={{ minHeight: '180px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', lineHeight: '1.6' }} placeholder="Mỗi dòng 1 bước làm..." />
                </div>
              </div>

              <div className="inputGroup">
                <label>Mẹo / Chi tiết thêm</label>
                <textarea value={formData.detailedInstructions} onChange={e => setFormData({...formData, detailedInstructions: e.target.value})} style={{ minHeight: '100px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', lineHeight: '1.6' }} />
              </div>

              <div className="modalActions" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Hủy bỏ</button>
                <button type="submit" className="btn-primary">Lưu công thức</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
