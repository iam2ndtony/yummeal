'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, ExternalLink, Clock, Users, ChefHat, BarChart3, Trash2, Pencil, Check, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { deletePost } from '@/actions/community';

interface PostRecipe {
  id: string;
  title: string;
  description?: string;
  time?: string;
  servings?: string;
  instructions?: string;
  ingredients?: string[];
}

interface PostUser { id: string; name: string; avatarUrl?: string | null; }

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  user: PostUser;
  recipe: PostRecipe | null;
  _count: { likes: number };
}

interface Recipe { id: string; title: string; }

function getAvatar(user: PostUser) {
  if (user.avatarUrl) return user.avatarUrl;
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${Math.abs(hash)}`;
}

export default function PostDetailModal({
  post, onClose, isOwner = false, userRecipes = [], onDeleted, onUpdated
}: {
  post: Post;
  onClose: () => void;
  isOwner?: boolean;
  userRecipes?: Recipe[];
  onDeleted?: (id: string) => void;
  onUpdated?: (id: string, caption: string, recipeId: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editCaption, setEditCaption] = useState(post.caption ?? '');
  const [editRecipeId, setEditRecipeId] = useState(post.recipe?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const steps = post.recipe?.instructions
    ? post.recipe.instructions.split('\n').filter(Boolean)
    : [];

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) return;
    setDeleting(true);
    const res = await deletePost(post.id);
    if (res.success) {
      onDeleted?.(post.id);
      onClose();
    }
    setDeleting(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    // Import updatePost action dynamically to keep modal self-contained
    const { updateCommunityPost } = await import('@/actions/community');
    const res = await updateCommunityPost(post.id, {
      caption: editCaption,
      recipeId: editRecipeId || null,
    });
    setSaving(false);
    if (res.success) {
      onUpdated?.(post.id, editCaption, editRecipeId);
      setMode('view');
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '28px', width: '100%', maxWidth: '840px',
          maxHeight: '92vh', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={getAvatar(post.user)}
              alt={post.user.name}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', background: '#f1f5f9' }}
            />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{post.user.name}</p>
              {post.recipe && mode === 'view' && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Nấu theo: {post.recipe.title}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOwner && mode === 'view' && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', color: '#475569', padding: '8px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  <Pencil size={15} /> Chỉnh sửa
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', border: 'none', color: '#ef4444', padding: '8px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {deleting ? <Loader2 size={15} /> : <Trash2 size={15} />} Xóa
                </button>
              </>
            )}
            {isOwner && mode === 'edit' && (
              <>
                <button
                  onClick={() => setMode('view')}
                  style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '8px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', border: 'none', color: 'white', padding: '8px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {saving ? <Loader2 size={15} /> : <Check size={15} />} Lưu
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: '#f8fafc', border: 'none', color: '#94a3b8', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

            {/* Left — Image */}
            <div style={{ position: 'relative', minHeight: '420px', background: '#0f172a' }}>
              <img
                src={post.imageUrl}
                alt="post"
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', padding: '7px 14px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: 700 }}>
                <Heart size={15} fill="white" /> {post._count.likes} lượt thích
              </div>
            </div>

            {/* Right — Info / Edit */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* ── EDIT MODE ── */}
              {mode === 'edit' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.85rem', marginBottom: '8px' }}>📝 Caption</label>
                    <textarea
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      maxLength={300}
                      placeholder="Chia sẻ cảm nghĩ của bạn..."
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '0.9rem', minHeight: '100px', resize: 'none', outline: 'none', lineHeight: '1.5', fontFamily: 'inherit', transition: 'border 0.2s' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={(e) => (e.target.style.borderColor = '#f1f5f9')}
                    />
                    <p style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>{editCaption.length}/300</p>
                  </div>

                  {userRecipes.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.85rem', marginBottom: '8px' }}>🔗 Gắn công thức</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={editRecipeId}
                          onChange={(e) => setEditRecipeId(e.target.value)}
                          style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '0.9rem', outline: 'none', background: 'white', appearance: 'none', cursor: 'pointer' }}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                          onBlur={(e) => (e.target.style.borderColor = '#f1f5f9')}
                        >
                          <option value="">— Không gắn công thức —</option>
                          {userRecipes.map((r) => (
                            <option key={r.id} value={r.id}>{r.title}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '12px 16px' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#c2410c' }}>💡 Lưu ý: Không thể thay đổi ảnh sau khi đăng. Hãy xóa và đăng lại nếu muốn đổi ảnh.</p>
                  </div>
                </>
              ) : (
                /* ── VIEW MODE ── */
                <>
                  {post.caption && (
                    <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', fontStyle: 'italic' }}>"{post.caption}"</p>
                    </div>
                  )}

                  {post.recipe ? (
                    <>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{post.recipe.title}</h3>
                      {post.recipe.description && (
                        <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6', fontSize: '0.88rem' }}>{post.recipe.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {post.recipe.time && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff7ed', color: '#c2410c', padding: '5px 12px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: 600 }}>
                            <Clock size={13} /> {post.recipe.time}
                          </span>
                        )}
                        {post.recipe.servings && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#166534', padding: '5px 12px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: 600 }}>
                            <Users size={13} /> {post.recipe.servings}
                          </span>
                        )}
                      </div>

                      {post.recipe.ingredients && post.recipe.ingredients.length > 0 && (
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#334155', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <BarChart3 size={14} /> Nguyên liệu
                          </p>
                          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {post.recipe.ingredients.slice(0, 6).map((ing, i) => (
                              <li key={i} style={{ fontSize: '0.85rem', color: '#475569' }}>{ing}</li>
                            ))}
                            {post.recipe.ingredients.length > 6 && (
                              <li style={{ fontSize: '0.83rem', color: '#94a3b8', listStyle: 'none' }}>+{post.recipe.ingredients.length - 6} nguyên liệu nữa...</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {steps.length > 0 && (
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#334155', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ChefHat size={14} /> Các bước làm
                          </p>
                          <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {steps.slice(0, 4).map((step, i) => (
                              <li key={i} style={{ fontSize: '0.83rem', color: '#475569', lineHeight: '1.5' }}>{step.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                            {steps.length > 4 && <li style={{ fontSize: '0.8rem', color: '#94a3b8', listStyle: 'none' }}>...</li>}
                          </ol>
                        </div>
                      )}

                      <Link
                        href={`/recipes/${post.recipe.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', justifyContent: 'center', marginTop: 'auto' }}
                      >
                        <ExternalLink size={16} /> Xem công thức đầy đủ
                      </Link>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍽️</div>
                      <p>Bài đăng này chưa gắn với công thức nào.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
