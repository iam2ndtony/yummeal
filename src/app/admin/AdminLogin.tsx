'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { verifyAdminPassword } from './actions';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const res = await verifyAdminPassword(password);
    if (res.success) {
      window.location.reload();
    } else {
      setError(res.error || 'Invalid password');
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginIcon}>
          <Lock size={32} />
        </div>
        <h1 className={styles.loginTitle}>Admin Access</h1>
        <p className={styles.loginSubtitle}>Enter the administrator password to manage Yummeal.</p>
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <input
            type="password"
            autoFocus
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.loginInput}
          />
          {error && <p className={styles.loginError}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.loginBtn}>
            {loading ? 'Verifying...' : 'Unlock Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
