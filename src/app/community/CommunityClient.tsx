'use client';

import React, { useState } from 'react';
import { Heart, Flame, Clock, Award, Users, Trash2, MessageCircle, Search, X as XIcon } from 'lucide-react';
import { toggleLike, deletePost } from '@/actions/community';
import SharePostModal from './SharePostModal';
import PostDetailModal from './PostDetailModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────
interface PostUser { id: string; name: string; avatarUrl?: string | null; }
interface PostRecipe { id: string; title: string; description?: string; time?: string; servings?: string; instructions?: string; ingredients?: any; }
interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  featured: boolean;
  user: PostUser;
  recipe: PostRecipe | null;
  _count: { likes: number, comments?: number };
  comments?: any[];
}
interface Recipe { id: string; title: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAvatar(user: PostUser) {
  if (user.avatarUrl) return user.avatarUrl;
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${Math.abs(hash)}`;
}

function parseIngredients(recipe: PostRecipe | null): string[] {
  if (!recipe) return [];
  const ing = recipe.ingredients;
  if (Array.isArray(ing)) return ing.map(String);
  if (typeof ing === 'string') {
    try { const p = JSON.parse(ing); if (Array.isArray(p)) return p.map(String); } catch {}
    return ing.split('\n').filter(Boolean);
  }
  return [];
}

// Normalise post for detail modal
function toDetailPost(p: Post) {
  return { ...p, recipe: p.recipe ? { ...p.recipe, ingredients: parseIngredients(p.recipe) } : null };
}

// ── Empty Feed ───────────────────────────────────────────────────────────────
function EmptyFeed() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '5rem', marginBottom: '24px' }}>🍳</div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Chưa có bài đăng nào</h2>
      <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>Hãy là người đầu tiên chia sẻ thành quả của mình với cộng đồng Yummeal!</p>
    </div>
  );
}

// ── Feed Card ─────────────────────────────────────────────────────────────
function FeedCard({ post, isLiked, canDelete, onLike, onOpen, onDelete }: {
  post: Post; isLiked: boolean; canDelete: boolean;
  onLike: (id: string) => void; onOpen: (post: Post) => void; onDelete: (id: string) => void;
}) {
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localCount, setLocalCount] = useState(post._count.likes);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalLiked((p) => !p);
    setLocalCount((p) => (localLiked ? p - 1 : p + 1));
    await onLike(post.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Xóa bài đăng này?')) return;
    setDeleting(true);
    await onDelete(post.id);
  };

  return (
    <div
      style={{ marginBottom: '32px', background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', maxWidth: '480px', width: '100%', margin: '0 auto 32px auto' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
        <Link href={`/community/user/${post.user.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
          <img src={getAvatar(post.user)} alt="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{post.user.name}</span>
        </Link>
        {canDelete && (
          <button onClick={handleDelete} disabled={deleting} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Image */}
      <div onClick={() => onOpen(post)} style={{ width: '100%', cursor: 'pointer', background: '#0f172a' }}>
        <img src={post.imageUrl} alt="post" style={{ display: 'block', width: '100%', maxHeight: '600px', objectFit: 'contain' }} />
      </div>

      {/* Action Bar */}
      <div style={{ padding: '12px 16px 8px 16px', display: 'flex', gap: '12px' }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart size={26} fill={localLiked ? '#ef4444' : 'none'} color={localLiked ? '#ef4444' : '#1e293b'} />
        </button>
        <button onClick={() => onOpen(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle size={26} color="#1e293b" />
        </button>
      </div>

      {/* Stats & Caption */}
      <div style={{ padding: '0 16px 16px 16px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', margin: '0 0 6px 0' }}>{localCount} lượt thích</p>
        {(post.caption || post.recipe) && (
          <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.4' }}>
            <span style={{ fontWeight: 700, marginRight: '6px', color: '#1e293b' }}>{post.user.name}</span>
            {post.caption}
            {post.recipe && (
              <Link
                href={`/recipes/${post.recipe.id}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 600, textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                🔗 {post.recipe.title} →
              </Link>
            )}
          </div>
        )}
        
        {/* View all comments */}
        {post._count.comments ? (
          <button onClick={() => onOpen(post)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', padding: 0, marginTop: '8px', cursor: 'pointer' }}>
            Xem tất cả {post._count.comments} bình luận
          </button>
        ) : (
          <button onClick={() => onOpen(post)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', padding: 0, marginTop: '8px', cursor: 'pointer' }}>
            Thêm bình luận...
          </button>
        )}
      </div>
    </div>
  );
}

// ── Featured Card ─────────────────────────────────────────────────────────────
function FeaturedCard({ post, onOpen }: { post: Post; onOpen: (p: Post) => void }) {
  return (
    <div className="featured-card" onClick={() => onOpen(post)} style={{ flex: '0 0 280px', borderRadius: '24px', overflow: 'hidden', position: 'relative', height: '380px', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)' }}>
      <img src={post.imageUrl} alt="featured" className="featured-img" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 55%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <img src={getAvatar(post.user)} alt={post.user.name} style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid white', background: '#fff' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.user.name}</span>
        </div>
        {post.recipe && <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}>{post.recipe.title}</h3>}
        {post.caption && <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.88, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{post.caption}"</p>}
      </div>
      <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '5px', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
        <Heart size={13} fill="white" /> {post._count.likes}
      </div>
    </div>
  );
}

// ── My Posts Grid ─────────────────────────────────────────────────────────────
function MyPostsGrid({ posts, onOpen, onDelete }: { posts: Post[]; onOpen: (p: Post) => void; onDelete: (id: string) => void }) {
  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📸</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Bạn chưa có bài đăng nào</h3>
        <p style={{ color: '#64748b' }}>Bấm "Chia sẻ ảnh" để chia sẻ thành quả của mình!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => onOpen(post)}
          style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer', aspectRatio: '1', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} />
          <div className="masonry-hover" style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={async (e) => { e.stopPropagation(); if (!confirm('Xóa bài đăng này?')) return; await onDelete(post.id); }}
                style={{ background: 'rgba(239,68,68,0.85)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div>
              {post.recipe && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', margin: '0 0 3px 0' }}>🔗 {post.recipe.title}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
                <Heart size={13} fill="white" /> {post._count.likes}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────
export default function CommunityClient({
  initialPosts, initialFeatured, initialLikedIds, userRecipes, myPosts, currentUserId
}: {
  initialPosts: Post[];
  initialFeatured: Post[];
  initialLikedIds: string[];
  userRecipes: Recipe[];
  myPosts: Post[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'community' | 'mine'>('community');
  const [feedTab, setFeedTab] = useState<'trending' | 'recent'>('trending');
  const [likedIds, setLikedIds] = useState(new Set(initialLikedIds));
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [myPostsState, setMyPostsState] = useState(myPosts);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLike = async (postId: string) => {
    setLikedIds((prev) => { const n = new Set(prev); n.has(postId) ? n.delete(postId) : n.add(postId); return n; });
    await toggleLike(postId);
  };

  const handleDelete = async (postId: string) => {
    const res = await deletePost(postId);
    if (res.success) {
      setMyPostsState((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
      router.refresh();
    }
  };

  const handleUpdate = (postId: string, caption: string, recipeId: string) => {
    setMyPostsState((prev) =>
      prev.map((p) => p.id === postId ? { ...p, caption: caption || null, recipe: p.recipe?.id === recipeId ? p.recipe : (userRecipes.find(r => r.id === recipeId) ? { ...p.recipe, id: recipeId, title: userRecipes.find(r => r.id === recipeId)!.title } : null) } : p)
    );
    router.refresh();
  };

  const sorted = feedTab === 'trending'
    ? [...initialPosts].sort((a, b) => b._count.likes - a._count.likes)
    : [...initialPosts];

  const filtered = searchQuery.trim()
    ? sorted.filter(p =>
        p.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.caption?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.recipe?.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sorted;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '100px' }}>
      <style>{`
        .masonry-item:hover img { transform: scale(1.04); }
        .masonry-item .masonry-hover { opacity: 0; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.15)); transition: opacity 0.3s; display: flex; flex-direction: column; justify-content: space-between; padding: 14px; }
        .masonry-item:hover .masonry-hover { opacity: 1; }
        .featured-card:hover .featured-img { transform: scale(1.05); }
        ::-webkit-scrollbar { display: none; }
        @media (min-width: 600px) { .masonry-grid { column-count: 3 !important; } }
        @media (min-width: 900px) { .masonry-grid { column-count: 4 !important; } }
      `}</style>

      {/* HEADER */}
      <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={26} style={{ color: 'var(--primary)' }} /> Cộng đồng
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>{initialPosts.length} bài đăng từ cộng đồng Yummeal</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search bar */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, món ăn..."
                style={{ paddingLeft: '34px', paddingRight: searchQuery ? '34px' : '14px', paddingTop: '9px', paddingBottom: '9px', borderRadius: '99px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.88rem', background: '#f8fafc', width: '200px' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <XIcon size={14} />
                </button>
              )}
            </div>
            <SharePostModal recipes={userRecipes} onSuccess={() => router.refresh()} />
          </div>
        </div>

        {/* Main Tabs */}
        <div className="container" style={{ marginTop: '16px', display: 'flex', gap: '4px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0' }}>
          {([['community', '🌍 Cộng đồng'], ['mine', '📸 Bài của tôi']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === tab ? 'var(--primary)' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', marginBottom: '-2px', transition: 'all 0.2s' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ marginTop: '28px' }}>

        {/* ── "MÌnh" Tab ───────────────────────────────── */}
        {activeTab === 'mine' && (
          <MyPostsGrid posts={myPostsState} onOpen={(p) => setSelectedPost(p)} onDelete={handleDelete} />
        )}

        {/* ── Community Tab ── */}
        {activeTab === 'community' && (
          <>
            {/* Wall of Fame */}
            {initialFeatured.length > 0 && (
              <section style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <Award size={22} style={{ color: '#f59e0b' }} />
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Bếp trưởng tuần này</h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                  {initialFeatured.map((p) => <FeaturedCard key={p.id} post={p} onOpen={setSelectedPost} />)}
                </div>
              </section>
            )}

            {/* Feed tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {([['trending', <><Flame size={15} /> Đang Hot</>], ['recent', <><Clock size={15} /> Mới nhất</>]] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setFeedTab(tab as any)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 20px', borderRadius: '99px', fontWeight: 700, cursor: 'pointer', border: 'none', fontSize: '0.88rem', background: feedTab === tab ? '#1e293b' : '#f1f5f9', color: feedTab === tab ? 'white' : '#64748b', transition: 'all 0.2s' }}
                >
                  {label as any}
                </button>
              ))}
            </div>

            {/* Vertical Feed */}
            {searchQuery && filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <Search size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ fontSize: '1rem' }}>Không tìm thấy kết quả cho "{searchQuery}"</p>
              </div>
            ) : sorted.length === 0 ? <EmptyFeed /> : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    isLiked={likedIds.has(post.id)}
                    canDelete={post.user.id === currentUserId}
                    onLike={handleLike}
                    onOpen={setSelectedPost}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={toDetailPost(selectedPost) as any}
          onClose={() => setSelectedPost(null)}
          isOwner={selectedPost.user.id === currentUserId}
          currentUserId={currentUserId}
          userRecipes={userRecipes}
          onDeleted={(id) => { setMyPostsState((prev) => prev.filter(p => p.id !== id)); router.refresh(); }}
          onUpdated={handleUpdate}
        />
      )}
    </div>
  );
}
