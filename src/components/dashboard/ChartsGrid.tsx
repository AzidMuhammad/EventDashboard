'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Competition, Participant, Proposal, Finance } from '@/types';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChartsGridProps {
  data: {
    competitions: Competition[];
    participants: Participant[];
    proposals: Proposal[];
    finances: Finance[];
  };
}

export default function ChartsGrid({ data }: ChartsGridProps) {
  const { competitions, participants, proposals, finances } = data;

  // Financial chart data (last 30 days)
  const financialData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(date => {
      const dayFinances = finances.filter(f => 
        format(new Date(f.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const income = dayFinances
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0);

      const expense = dayFinances
        .filter(f => f.type === 'expense')
        .reduce((sum, f) => sum + f.amount, 0);

      return {
        date: format(date, 'dd/MM'),
        pemasukan: income,
        pengeluaran: expense,
        saldo: income - expense
      };
    });
  }, [finances]);

  // Proposal status distribution
  const proposalStatusData = useMemo(() => {
    const statusCount = proposals.reduce((acc, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusLabels = {
      draft: 'Draft',
      submitted: 'Disubmit',
      under_review: 'Direview',
      approved: 'Disetujui',
      rejected: 'Ditolak'
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels] || status,
      value: count,
      status
    }));
  }, [proposals]);

  // Competition participants data
  const competitionParticipantsData = useMemo(() => {
    return competitions.map(comp => ({
      name: comp.name.length > 15 ? comp.name.substring(0, 15) + '...' : comp.name,
      peserta: comp.currentParticipants,
      maksimal: comp.maxParticipants,
      persentase: (comp.currentParticipants / comp.maxParticipants) * 100
    }));
  }, [competitions]);

  // Registration trend (last 7 days)
  const registrationTrendData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(date => {
      const dayRegistrations = participants.filter(p => 
        format(new Date(p.registrationDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length;

      return {
        date: format(date, 'dd/MM'),
        pendaftaran: dayRegistrations
      };
    });
  }, [participants]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  return (
    <>
      {/* Financial Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Trend Keuangan (30 Hari Terakhir)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={financialData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `${(value / 1000)}k`} />
            <Tooltip 
              formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
              labelFormatter={(label) => `Tanggal: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="pemasukan" 
              stroke="#22c55e" 
              name="Pemasukan"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="pengeluaran" 
              stroke="#ef4444" 
              name="Pengeluaran"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Proposal Status Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Distribusi Status Proposal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={proposalStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {proposalStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Competition Participants */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Peserta per Lomba</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={competitionParticipantsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="peserta" fill="#3b82f6" name="Peserta Saat Ini" />
            <Bar dataKey="maksimal" fill="#e5e7eb" name="Maksimal" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Registration Trend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Trend Pendaftaran (7 Hari Terakhir)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={registrationTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="pendaftaran" 
              stroke="#ef4444" 
              fill="#fef2f2" 
              name="Pendaftaran"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}