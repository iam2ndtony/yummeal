'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { X, Save, Box, Book, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getUserDetailsAction, updateUserAction, deletePostAction } from './actions';

interface ManageUserModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ManageUserModal({ userId, userName, onClose, onSaved }: ManageUserModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [plan, setPlan] = useState('FREE');
  const [generationCount, setGenerationCount] = useState(0);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const res = await getUserDetailsAction(userId);
      if (res.success && res.user) {
        setUser(res.user);
        setPlan(res.user.plan);
        setGenerationCount(res.user.generationCount);
      }
      setLoading(false);
    }
    loadUser();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateUserAction(userId, { plan, generationCount: Number(generationCount) });
    setSaving(false);
    if (res.success) {
      onSaved();
    } else {
      alert('Error updating user');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const res = await deletePostAction(postId);
    if (res.success) {
      setUser((prev: any) => ({
        ...prev,
        communityPosts: prev.communityPosts.filter((p: any) => p.id !== postId)
      }));
    } else {
      alert('Error deleting post');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Manage {userName}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
        </div>

        {loading ? (
          <div className={styles.loadingSpinner}>Loading details...</div>
        ) : !user ? (
          <div>User not found</div>
        ) : (
          <div className={styles.modalBody}>
            {/* Left side: Edit Form */}
            <form className={styles.editForm} onSubmit={handleSave}>
              <h3 className={styles.sectionHeading}>User Status</h3>
              <div className={styles.inputGroup}>
                <label>Subscription Plan</label>
                <select value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="FREE">FREE</option>
                  <option value="PLUS">PLUS</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Generations Used</label>
                <input 
                  type="number" 
                  value={generationCount} 
                  onChange={e => setGenerationCount(Number(e.target.value))}
                  min={0}
                />
              </div>
              <button disabled={saving} type="submit" className={styles.saveBtn}>
                {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </form>

            <div className={styles.relationsSplit}>
              {/* Fridge Items view */}
              <div className={styles.relationSection}>
                <h3 className={styles.sectionHeading}><Box size={18} /> Fridge Items ({user.fridgeItems.length})</h3>
                <div className={styles.itemList}>
                  {user.fridgeItems.length === 0 ? <p className={styles.emptyText}>No items</p> : null}
                  {user.fridgeItems.map((item: any) => (
                    <div key={item.id} className={styles.itemCard}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemMeta}>{item.quantity} - {item.statusType}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipes view */}
              <div className={styles.relationSection}>
                <h3 className={styles.sectionHeading}><Book size={18} /> Recipes Saved ({user.recipes.length})</h3>
                <div className={styles.itemList}>
                   {user.recipes.length === 0 ? <p className={styles.emptyText}>No recipes</p> : null}
                  {user.recipes.map((r: any) => (
                    <div key={r.id} className={styles.itemCard}>
                      <span className={styles.itemName}>{r.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts view */}
              <div className={styles.relationSection}>
                <h3 className={styles.sectionHeading}><ImageIcon size={18} /> Posts ({user.communityPosts.length})</h3>
                <div className={styles.itemList}>
                   {user.communityPosts.length === 0 ? <p className={styles.emptyText}>No posts</p> : null}
                  {user.communityPosts.map((p: any) => (
                    <div key={p.id} className={styles.itemCardPost}>
                      {p.imageUrl && <img src={p.imageUrl} alt="Post" className={styles.postThumbnail} />}
                      <div className={styles.postInfo}>
                        <span className={styles.postCaption}>{p.caption || 'No caption'}</span>
                        <button 
                          className={styles.deleteBtn} 
                          onClick={() => handleDeletePost(p.id)}
                          title="Delete Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
