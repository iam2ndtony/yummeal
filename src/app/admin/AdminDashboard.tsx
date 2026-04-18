'use client';

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Users, BookOpen, MessageSquare, Refrigerator, Zap, Edit2, Lock } from 'lucide-react';
import DashboardFooter from '@/components/DashboardFooter';
import ManageUserModal from './ManageUserModal';
import { logoutAdminAction } from './actions';

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    freeUsers: number;
    plusUsers: number;
    totalRecipes: number;
    totalPosts: number;
    totalFridgeItems: number;
  };
  growthData: { date: string; users: number; posts: number }[];
  users: any[];
}

const COLORS = ['#d35400', '#f39c12', '#3498db', '#2ecc71', '#9b59b6'];

export default function AdminDashboard({ stats, growthData, users }: AdminDashboardProps) {
  const [editingUser, setEditingUser] = React.useState<{ id: string, name: string } | null>(null);

  const pieData = [
    { name: 'FREE Users', value: stats.freeUsers },
    { name: 'PLUS Users', value: stats.plusUsers },
  ];

  const contentPieData = [
    { name: 'Recipes', value: stats.totalRecipes },
    { name: 'Posts', value: stats.totalPosts },
    { name: 'Fridge Items', value: stats.totalFridgeItems },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className={styles.title}>Admin Command Center</h1>
            <button
              className={styles.logoutBtn}
              onClick={async () => {
                await logoutAdminAction();
                window.location.reload();
              }}
              title="Lock Dashboard"
            >
              <Lock size={18} /> Lock
            </button>
          </div>
          <p className={styles.subtitle}>Real-time analytics and platform overview</p>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* KPI Cards */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper}>
              <Users size={24} className={styles.kpiIcon} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Total Users</span>
              <span className={styles.kpiValue}>{stats.totalUsers.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(243, 156, 18, 0.1)' }}>
              <Zap size={24} className={styles.kpiIcon} style={{ color: '#f39c12' }} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Plus Users</span>
              <span className={styles.kpiValue}>{stats.plusUsers.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(46, 204, 113, 0.1)' }}>
              <BookOpen size={24} className={styles.kpiIcon} style={{ color: '#2ecc71' }} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Total Recipes</span>
              <span className={styles.kpiValue}>{stats.totalRecipes.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
              <MessageSquare size={24} className={styles.kpiIcon} style={{ color: '#3498db' }} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Community Posts</span>
              <span className={styles.kpiValue}>{stats.totalPosts.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(155, 89, 182, 0.1)' }}>
              <Refrigerator size={24} className={styles.kpiIcon} style={{ color: '#9b59b6' }} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Fridge Items</span>
              <span className={styles.kpiValue}>{stats.totalFridgeItems.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className={styles.chartsGrid}>
          <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
            <h2 className={styles.chartTitle}>Platform Growth (Last 30 Days)</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d35400" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d35400" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3498db" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3498db" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} tickMargin={10} minTickGap={20} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#d35400" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                  <Area type="monotone" dataKey="posts" stroke="#3498db" fillOpacity={1} fill="url(#colorPosts)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>User Distribution</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', background: 'var(--bg-card)', border: 'none', color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.chartLegend}>
                {pieData.map((entry, index) => (
                  <div key={entry.name} className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className={styles.legendName}>{entry.name}</span>
                    <span className={styles.legendValue}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Content Breakdown</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', background: 'var(--bg-card)', border: 'none', color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.chartLegend}>
                {contentPieData.map((entry, index) => (
                  <div key={entry.name} className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                    <span className={styles.legendName}>{entry.name}</span>
                    <span className={styles.legendValue}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* User Table Data View */}
        <section className={styles.tableSection}>
          <h2 className={styles.sectionTitle}>Recent Users Data</h2>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Gens</th>
                  <th>Joined Date</th>
                  <th>Relations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`${styles.planBadge} ${u.plan === 'PLUS' ? styles.plusPlan : styles.freePlan}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td>{u.generationCount}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.relationTags}>
                        <span className={styles.tag}>🍽 {u._count?.recipes || 0}</span>
                        <span className={styles.tag}>📦 {u._count?.fridgeItems || 0}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setEditingUser({ id: u.id, name: u.name })}
                      >
                        <Edit2 size={16} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <DashboardFooter />

      {editingUser && (
        <ManageUserModal
          userId={editingUser.id}
          userName={editingUser.name}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            // In Next 13/14 app router, server actions usually trigger router refresh, 
            // but we can also window.location.reload() or let the server action revalidatePath handle it.
            // Action calls revalidatePath('/admin'), which updates server components. 
            // The table will reflect changes!
          }}
        />
      )}
    </div>
  );
}
