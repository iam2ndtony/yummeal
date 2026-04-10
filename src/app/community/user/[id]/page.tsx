import { getCommunityUserProfile } from '@/actions/social';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, ChevronLeft, Award } from 'lucide-react';

function getAvatar(user: { id: string; name: string; avatarUrl?: string | null }) {
  if (user.avatarUrl) return user.avatarUrl;
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${Math.abs(hash)}`;
}

import ProfileGridClient from './ProfileGridClient';
interface Props { params: Promise<{ id: string }> }

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const data = await getCommunityUserProfile(id);
  if (!data) notFound();

  const { user, posts } = data;
  const session = await getSession();
  const totalLikes = posts.reduce((sum: number, p: any) => sum + p._count.likes, 0);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: '80px' }}>
      <style>{`
        .profile-post-item:hover .profile-post-overlay { opacity: 1 !important; }
      `}</style>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Back */}
        <Link href="/community" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '28px', fontWeight: 600 }}>
          <ChevronLeft size={18} /> Quay lại Cộng đồng
        </Link>

        {/* Profile Header */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px', padding: '0 8px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={getAvatar(user)}
              alt={user.name}
              style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 4px 14px rgba(211,84,0,0.2)' }}
            />
            {user.plan === 'PLUS' && (
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                <Award size={12} color="white" />
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user.name}</h1>
              {user.plan === 'PLUS' && (
                <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>PLUS</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '28px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{posts.length}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>bài đăng</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalLikes}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>lượt thích</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {new Date(user.createdAt).getFullYear()}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>tham gia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: '3px' }} />

        {/* Posts Grid */}
        <ProfileGridClient posts={posts} currentUserId={session?.id ?? null} />
      </div>
    </main>
  );
}
