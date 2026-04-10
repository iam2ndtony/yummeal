'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Heart, ExternalLink, Clock, Users, ChefHat, BarChart3,
  Trash2, Pencil, Check, Loader2, ChevronDown, MessageCircle, BookOpen, CornerDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { deletePost } from '@/actions/community';

interface PostRecipe {
  id: string; title: string; description?: string; time?: string;
  servings?: string; instructions?: string; ingredients?: string[];
}
interface PostUser { id: string; name: string; avatarUrl?: string | null; }
interface CommentLike { id: string; userId: string; }
interface Reply { id: string; content: string; user: PostUser; userId?: string; likes: CommentLike[]; createdAt: Date; }
interface Comment {
  id: string; content: string; user: PostUser; userId?: string;
  likes: CommentLike[]; replies: Reply[]; createdAt: Date;
}
interface Post {
  id: string; imageUrl: string; caption: string | null; user: PostUser;
  recipe: PostRecipe | null;
  _count: { likes: number; comments?: number };
  comments?: Comment[];
}
interface Recipe { id: string; title: string; }

function getAvatar(user: PostUser) {
  if (user.avatarUrl) return user.avatarUrl;
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${Math.abs(hash)}`;
}

// ── Like Button for comments ──
function CommentLikeBtn({ commentId, initialLiked, initialCount, onLike }: {
  commentId: string; initialLiked: boolean; initialCount: number;
  onLike?: () => void;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const { toggleCommentLike } = await import('@/actions/social');
    const res = await toggleCommentLike(commentId);
    if (res.success) { setLiked(res.liked ?? !liked); setCount(c => res.liked ? c + 1 : c - 1); onLike?.(); }
    setBusy(false);
  };

  return (
    <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: liked ? '#ef4444' : '#94a3b8', fontSize: '0.78rem', fontWeight: 600, padding: '2px 4px', borderRadius: '6px' }}>
      <Heart size={12} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#94a3b8'} />
      {count > 0 && count}
    </button>
  );
}

export default function PostDetailModal({
  post, onClose, isOwner = false, userRecipes = [], onDeleted, onUpdated, currentUserId
}: {
  post: Post; onClose: () => void; isOwner?: boolean; currentUserId?: string | null;
  userRecipes?: Recipe[]; onDeleted?: (id: string) => void;
  onUpdated?: (id: string, caption: string, recipeId: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [rightTab, setRightTab] = useState<'recipe' | 'comments'>('comments');
  const [editCaption, setEditCaption] = useState(post.caption ?? '');
  const [editRecipeId, setEditRecipeId] = useState(post.recipe?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [localComments, setLocalComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [localComments]);
  useEffect(() => { if (replyingTo) replyInputRef.current?.focus(); }, [replyingTo]);

  if (!mounted) return null;

  const steps = post.recipe?.instructions ? post.recipe.instructions.split('\n').filter(Boolean) : [];

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) return;
    setDeleting(true);
    const res = await deletePost(post.id);
    if (res.success) { onDeleted?.(post.id); onClose(); }
    setDeleting(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { updateCommunityPost } = await import('@/actions/community');
    const res = await updateCommunityPost(post.id, { caption: editCaption, recipeId: editRecipeId || null });
    setSaving(false);
    if (res.success) { onUpdated?.(post.id, editCaption, editRecipeId); setMode('view'); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || sendingComment) return;
    setSendingComment(true);
    const { addComment } = await import('@/actions/community');
    const res = await addComment(post.id, commentText);
    setSendingComment(false);
    if (res.success && res.comment) {
      setLocalComments(prev => [...prev, { ...res.comment, replies: [], likes: [] } as any]);
      setCommentText('');
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo || sendingReply) return;
    setSendingReply(true);
    const { addReply } = await import('@/actions/social');
    const res = await addReply(post.id, replyingTo.id, replyText);
    setSendingReply(false);
    if (res.success && res.reply) {
      setLocalComments(prev => prev.map(c =>
        c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), { ...res.reply, likes: [] } as any] } : c
      ));
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Xóa bình luận này?')) return;
    const { deleteComment } = await import('@/actions/community');
    const res = await deleteComment(commentId);
    if (res.success) setLocalComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!confirm('Xóa câu trả lời này?')) return;
    const { deleteComment } = await import('@/actions/community');
    const res = await deleteComment(replyId);
    if (res.success) {
      setLocalComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: c.replies.filter(r => r.id !== replyId) } : c
      ));
    }
  };

  const TAB = (active: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    padding: '10px 8px', border: 'none', background: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.81rem',
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    color: active ? 'var(--primary)' : '#94a3b8', transition: 'all 0.2s',
  });

  return createPortal(
    <>
      <style>{`
        .post-detail-wrapper {
          background: white; border-radius: 20px; width: 100%; max-width: 900px;
          max-height: 90vh; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.5);
          display: flex; flex-direction: column;
        }
        .post-detail-body {
          display: flex; flex: 1; overflow: hidden; min-height: 0; flex-direction: row;
        }
        .post-detail-image-container {
          flex-shrink: 0; width: 50%; background: #0a0e1a; display: flex; align-items: center;
          justify-content: center; position: relative; border-right: 1px solid #f1f5f9; border-bottom: none;
        }
        .post-detail-panel {
          flex: 1; display: flex; flex-direction: column; overflow: hidden;
        }

        @media (max-width: 768px) {
          .post-detail-body { flex-direction: column; overflow-y: auto !important; display: block; }
          .post-detail-image-container { width: 100%; height: 350px; flex-shrink: 0; border-right: none; border-bottom: 1px solid #f1f5f9; }
          .post-detail-panel { width: 100%; overflow: visible; display: flex; flex-direction: column; }
        }
      `}</style>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div onClick={(e) => e.stopPropagation()} className="post-detail-wrapper">

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <Link href={`/community/user/${post.user.id}`} onClick={onClose} style={{ flexShrink: 0 }}>
                <img src={getAvatar(post.user)} alt={post.user.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
              </Link>
              <div>
                <Link href={`/community/user/${post.user.id}`} onClick={onClose} style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem', textDecoration: 'none', display: 'block' }}>
                  {post.user.name}
                </Link>
                {post.recipe && mode === 'view' && (
                  <Link href={`/recipes/${post.recipe.id}`} style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }} onClick={onClose}>
                    🔗 {post.recipe.title}
                  </Link>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isOwner && mode === 'view' && (
                <>
                  <button onClick={() => setMode('edit')} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', border: 'none', color: '#475569', padding: '7px 13px', borderRadius: '9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>
                    <Pencil size={13} /> Sửa
                  </button>
                  <button onClick={handleDelete} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fef2f2', border: 'none', color: '#ef4444', padding: '7px 13px', borderRadius: '9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>
                    {deleting ? <Loader2 size={13} /> : <Trash2 size={13} />} Xóa
                  </button>
                </>
              )}
              {isOwner && mode === 'edit' && (
                <>
                  <button onClick={() => setMode('view')} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '7px 13px', borderRadius: '9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>Hủy</button>
                  <button onClick={handleSaveEdit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--primary)', border: 'none', color: 'white', padding: '7px 15px', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                    {saving ? <Loader2 size={13} /> : <Check size={13} />} Lưu
                  </button>
                </>
              )}
              <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', color: '#94a3b8', width: '33px', height: '33px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="post-detail-body">

            {/* LEFT: Image */}
            <div className="post-detail-image-container">
              <img src={post.imageUrl} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '14px', left: '14px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '6px 13px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: 700, fontSize: '0.87rem' }}>
                <Heart size={14} fill="white" /> {post._count.likes} lượt thích
              </div>
            </div>

            {/* RIGHT: Panel */}
            <div className="post-detail-panel">

              {/* Edit mode */}
              {mode === 'edit' ? (
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.82rem', marginBottom: '7px' }}>📝 Caption</label>
                  <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} maxLength={300}
                    placeholder="Chia sẻ cảm nghĩ của bạn..."
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #f1f5f9', fontSize: '0.88rem', minHeight: '90px', resize: 'none', outline: 'none', lineHeight: '1.5', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = '#f1f5f9'} />
                  <p style={{ textAlign: 'right', fontSize: '0.73rem', color: '#94a3b8', margin: '3px 0 0 0' }}>{editCaption.length}/300</p>
                </div>
                {userRecipes.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.82rem', marginBottom: '7px' }}>🔗 Gắn công thức</label>
                    <div style={{ position: 'relative' }}>
                      <select value={editRecipeId} onChange={e => setEditRecipeId(e.target.value)}
                        style={{ width: '100%', padding: '9px 34px 9px 11px', borderRadius: '10px', border: '2px solid #f1f5f9', fontSize: '0.88rem', outline: 'none', background: 'white', appearance: 'none', cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = '#f1f5f9'}>
                        <option value="">— Không gắn công thức —</option>
                        {userRecipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                      <ChevronDown size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                    </div>
                  </div>
                )}
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#c2410c' }}>💡 Không thể thay đổi ảnh sau khi đăng.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                  <button style={TAB(rightTab === 'comments')} onClick={() => setRightTab('comments')}>
                    <MessageCircle size={13} /> Bình luận ({localComments.length})
                  </button>
                  {post.recipe && (
                    <button style={TAB(rightTab === 'recipe')} onClick={() => setRightTab('recipe')}>
                      <BookOpen size={13} /> Công thức
                    </button>
                  )}
                </div>

                {/* ── COMMENTS TAB ── */}
                {rightTab === 'comments' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                      {/* Caption block */}
                      {post.caption && (
                        <div style={{ display: 'flex', gap: '10px', padding: '11px 13px', background: 'linear-gradient(135deg,#fff7ed,#fef3e8)', borderRadius: '14px', border: '1px solid #fed7aa', marginBottom: '4px', flexShrink: 0 }}>
                          <Link href={`/community/user/${post.user.id}`} onClick={onClose} style={{ flexShrink: 0 }}>
                            <img src={getAvatar(post.user)} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary)', display: 'block' }} />
                          </Link>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <Link href={`/community/user/${post.user.id}`} onClick={onClose} style={{ fontWeight: 800, fontSize: '0.87rem', color: '#1e293b', textDecoration: 'none' }}>{post.user.name}</Link>
                              <span style={{ fontSize: '0.68rem', background: 'var(--primary)', color: 'white', padding: '1px 7px', borderRadius: '99px', fontWeight: 700 }}>Tác giả</span>
                            </div>
                            <span style={{ fontSize: '0.87rem', color: '#475569', lineHeight: '1.5' }}>{post.caption}</span>
                          </div>
                        </div>
                      )}

                      {post.caption && localComments.length > 0 && (
                        <div style={{ borderTop: '1px dashed #e2e8f0' }} />
                      )}

                      {localComments.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '28px 0', color: '#cbd5e1' }}>
                          <MessageCircle size={28} style={{ marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '0.87rem' }}>Chưa có bình luận. Hãy là người đầu tiên!</p>
                        </div>
                      )}

                      {/* Comment items */}
                      {localComments.map(c => (
                        <div key={c.id}>
                          {/* Top-level comment */}
                          <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                            <Link href={`/community/user/${c.user.id}`} onClick={onClose} style={{ flexShrink: 0 }}>
                              <img src={getAvatar(c.user)} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'block' }} />
                            </Link>
                            <div style={{ flex: 1 }}>
                              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '8px 12px' }}>
                                <Link href={`/community/user/${c.user.id}`} onClick={onClose} style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', textDecoration: 'none', display: 'inline' }}>{c.user.name}</Link>
                                <span style={{ fontSize: '0.85rem', color: '#475569', marginLeft: '6px', lineHeight: '1.5' }}>{c.content}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px', marginTop: '4px' }}>
                                <CommentLikeBtn commentId={c.id} initialLiked={c.likes?.some(l => l.userId === currentUserId) ?? false} initialCount={c.likes?.length ?? 0} />
                                <button onClick={() => setReplyingTo(replyingTo?.id === c.id ? null : { id: c.id, name: c.user.name })}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, padding: '2px 4px' }}>
                                  Trả lời
                                </button>
                                {(isOwner || (currentUserId && c.userId === currentUserId)) && (
                                  <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: '2px' }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Replies */}
                          {c.replies && c.replies.length > 0 && (
                            <div style={{ marginLeft: '39px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {c.replies.map(r => (
                                <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                  <CornerDownRight size={12} style={{ color: '#cbd5e1', flexShrink: 0, marginTop: '8px' }} />
                                  <Link href={`/community/user/${r.user.id}`} onClick={onClose} style={{ flexShrink: 0 }}>
                                    <img src={getAvatar(r.user)} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'block' }} />
                                  </Link>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '7px 11px' }}>
                                      <Link href={`/community/user/${r.user.id}`} onClick={onClose} style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', textDecoration: 'none' }}>{r.user.name}</Link>
                                      <span style={{ fontSize: '0.82rem', color: '#475569', marginLeft: '6px', lineHeight: '1.5' }}>{r.content}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', paddingLeft: '3px', marginTop: '3px' }}>
                                      <CommentLikeBtn commentId={r.id} initialLiked={r.likes?.some(l => l.userId === currentUserId) ?? false} initialCount={r.likes?.length ?? 0} />
                                      {(isOwner || currentUserId === r.userId) && (
                                        <button onClick={() => handleDeleteReply(c.id, r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, fontSize: '0.75rem' }}>
                                          <Trash2 size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply input (inline) */}
                          {replyingTo?.id === c.id && (
                            <form onSubmit={handleAddReply} style={{ marginLeft: '39px', marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                ref={replyInputRef}
                                type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                placeholder={`Trả lời ${replyingTo.name}...`}
                                style={{ flex: 1, padding: '8px 13px', borderRadius: '99px', border: '1.5px solid var(--primary)', outline: 'none', fontSize: '0.85rem', background: '#fff7ed' }}
                              />
                              <button type="submit" disabled={!replyText.trim() || sendingReply}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                {sendingReply ? <Loader2 size={14} /> : 'Gửi'}
                              </button>
                              <button type="button" onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem' }}>
                                Hủy
                              </button>
                            </form>
                          )}
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>

                    {/* Comment input */}
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '11px 14px', flexShrink: 0 }}>
                      <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
                        <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                          placeholder="Thêm bình luận..."
                          style={{ flex: 1, padding: '9px 15px', borderRadius: '99px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.88rem', background: '#f8fafc' }}
                          onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                        <button type="submit" disabled={!commentText.trim() || sendingComment}
                          style={{ background: 'none', border: 'none', color: commentText.trim() ? 'var(--primary)' : '#94a3b8', fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'default', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                          {sendingComment ? <Loader2 size={15} /> : 'Đăng'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* ── RECIPE TAB ── */}
                {rightTab === 'recipe' && post.recipe && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{post.recipe.title}</h3>
                    {post.recipe.description && <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem', lineHeight: '1.6' }}>{post.recipe.description}</p>}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {post.recipe.time && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', color: '#c2410c', padding: '4px 11px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 }}><Clock size={12} /> {post.recipe.time}</span>}
                      {post.recipe.servings && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#166534', padding: '4px 11px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 }}><Users size={12} /> {post.recipe.servings}</span>}
                    </div>

                    {post.recipe.ingredients && post.recipe.ingredients.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 7px 0', fontWeight: 700, color: '#334155', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}><BarChart3 size={13} /> Nguyên liệu</p>
                        <ul style={{ margin: 0, paddingLeft: '17px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {post.recipe.ingredients.slice(0, 8).map((ing, i) => <li key={i} style={{ fontSize: '0.83rem', color: '#475569' }}>{ing}</li>)}
                          {post.recipe.ingredients.length > 8 && <li style={{ fontSize: '0.81rem', color: '#94a3b8', listStyle: 'none' }}>+{post.recipe.ingredients.length - 8} nguyên liệu nữa...</li>}
                        </ul>
                      </div>
                    )}

                    {steps.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 7px 0', fontWeight: 700, color: '#334155', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}><ChefHat size={13} /> Các bước làm</p>
                        <ol style={{ margin: 0, paddingLeft: '17px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {steps.slice(0, 3).map((step, i) => <li key={i} style={{ fontSize: '0.81rem', color: '#475569', lineHeight: '1.5' }}>{step.replace(/^\d+\.\s*/, '')}</li>)}
                          {steps.length > 3 && <li style={{ fontSize: '0.79rem', color: '#94a3b8', listStyle: 'none' }}>... và {steps.length - 3} bước nữa</li>}
                        </ol>
                      </div>
                    )}

                    <Link href={`/recipes/${post.recipe.id}`} onClick={onClose}
                      style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,var(--primary) 0%,#e07020 100%)', color: 'white', padding: '12px 18px', borderRadius: '13px', fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem', justifyContent: 'center', boxShadow: '0 4px 14px rgba(211,84,0,0.25)' }}>
                      <ExternalLink size={15} /> Xem công thức đầy đủ
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
