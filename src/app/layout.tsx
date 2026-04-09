import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';

import { AuthProvider } from '@/context/AuthContext';
import { getSession } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yummeal - Trợ lý bếp thông minh của bạn',
  description: 'Quản lý thực phẩm, gợi ý công thức và lên thực đơn tự động bằng AI.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="vi">
      <body>
        <AuthProvider initialSession={session as any}>
          <Navbar />
          <main>{children}</main>
          <MobileBottomNav />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
