'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCards from '@/components/dashboard/StatsCards';
import ChartsGrid from '@/components/dashboard/ChartsGrid';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import TimelineModern from '@/components/dashboard/TimelineModern';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { Competition, Participant, Proposal, Finance, Notification } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState({
    competitions: [] as Competition[],
    participants: [] as Participant[],
    proposals: [] as Proposal[],
    finances: [] as Finance[],
    notifications: [] as Notification[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          competitionsRes,
          participantsRes,
          proposalsRes,
          financesRes,
          notificationsRes
        ] = await Promise.all([
          fetch('/api/competitions'),
          fetch('/api/participants'),
          fetch('/api/proposals'),
          fetch('/api/finances'),
          fetch('/api/notifications?limit=10')
        ]);

        const [competitions, participants, proposals, finances, notifications] = await Promise.all([
          competitionsRes.json(),
          participantsRes.json(),
          proposalsRes.json(),
          financesRes.json(),
          notificationsRes.json()
        ]);

        setDashboardData({
          competitions,
          participants,
          proposals,
          finances,
          notifications
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Selamat datang, {session.user?.name}!
          </h1>
          <p className="text-red-100">
            Dashboard Manajemen Lomba 17 Agustus - {session.user?.role === 'admin' ? 'Administrator' : 'Guest'}
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards data={dashboardData} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartsGrid data={dashboardData} />
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-6">Aktivitas Harian</h2>
          <ActivityHeatmap data={dashboardData} />
        </div>

        {/* Timeline and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Timeline Kegiatan</h2>
            <TimelineModern data={dashboardData} />
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Aktivitas Terakhir</h2>
            <RecentActivity notifications={dashboardData.notifications} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}