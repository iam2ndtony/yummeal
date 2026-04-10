'use client';
import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import PostDetailModal from '@/app/community/PostDetailModal';

export default function ProfileGridClient({ posts, currentUserId }: { posts: any[]; currentUserId: string | null }) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>📸</div>
        <p>Chưa có bài đăng nào.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
        {posts.map((post) => (
          <div 
            key={post.id} 
            style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer' }} 
            className="profile-post-item"
            onClick={() => setSelectedPost(post)}
          >
            <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div className="profile-post-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', opacity: 0, transition: 'opacity 0.2s' }}>
              <span style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>
                <Heart size={18} fill="white" /> {post._count.likes}
              </span>
              <span style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>
                <MessageCircle size={18} fill="white" /> {post._count.comments}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          isOwner={currentUserId === selectedPost.user.id}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
