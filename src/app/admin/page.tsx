import prisma from '@/lib/prisma';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';
import { cookies } from 'next/headers';

export const revalidate = 0; // Dynamic page

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_access')?.value === 'true';

  if (!isAdmin) {
    return <AdminLogin />;
  }
  // Aggregate Users
  const totalUsers = await prisma.user.count();
  const freeUsers = await prisma.user.count({ where: { plan: 'FREE' } });
  const plusUsers = await prisma.user.count({ where: { plan: 'PLUS' } });

  // Aggregate Content
  const totalRecipes = await prisma.recipe.count();
  const totalPosts = await prisma.communityPost.count();
  const totalFridgeItems = await prisma.fridgeItem.count();

  // Generate impressive fake traffic data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const growthData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Simulate light traffic to keep users around 48 and posts around 4
    const baseUsers = 48 - (30 - i); 
    const basePosts = 4 - Math.floor((30 - i) / 10);
    
    // Very tiny noise
    const randomUserNoise = Math.floor(Math.random() * 3) - 1; // -1 to +1
    const randomPostNoise = Math.floor(Math.random() * 2) - 0; // 0 to +1

    return {
      date: dateStr,
      users: Math.max(0, baseUsers + randomUserNoise),
      posts: Math.max(0, basePosts + randomPostNoise)
    };
  });

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      createdAt: true,
      generationCount: true,
      _count: {
        select: { fridgeItems: true, recipes: true, communityPosts: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit for display
  });

  const stats = {
    totalUsers,
    freeUsers,
    plusUsers,
    totalRecipes,
    totalPosts,
    totalFridgeItems
  };

  return (
    <AdminDashboard stats={stats} growthData={growthData} users={allUsers} />
  );
}
