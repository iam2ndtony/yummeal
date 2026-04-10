'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerAction } from '@/actions/auth';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      const result = await registerAction(formData);
      if (result.success) {
        // After register, auto-login
        const loginFormData = new FormData();
        loginFormData.append('email', email);
        loginFormData.append('password', password);
        const { loginAction } = await import('@/actions/auth');
        const loginResult = await loginAction(loginFormData);
        if (loginResult.success && loginResult.user) {
          login(loginResult.user as any);
        }
        router.push('/');
      } else {
        setError(result.error || 'Đăng ký thất bại.');
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Tạo tài khoản mới</h1>
        <p className={styles.subtitle}>Bắt đầu hành trình nấu ăn thông minh của bạn.</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Họ và tên</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nguyễn Văn A" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Tối thiểu 6 ký tự" minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>
        <p className={styles.switchAuth}>Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}
