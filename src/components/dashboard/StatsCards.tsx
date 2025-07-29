'use client';

import { Trophy, Users, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Competition, Participant, Proposal, Finance } from '@/types';

interface StatsCardsProps {
  data: {
    competitions: Competition[];
    participants: Participant[];
    proposals: Proposal[];
    finances: Finance[];
  };
}

export default function StatsCards({ data }: StatsCardsProps) {
  const { competitions, participants, proposals, finances } = data;

  // Calculate stats
  const activeCompetitions = competitions.filter(c => c.status === 'active').length;
  const totalParticipants = participants.length;
  const pendingProposals = proposals.filter(p => p.status === 'under_review').length;
  
  const totalIncome = finances
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);
  
  const totalExpense = finances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  
  const balance = totalIncome - totalExpense;

  const stats = [
    {
      title: 'Lomba Aktif',
      value: activeCompetitions,
      icon: Trophy,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Peserta',
      value: totalParticipants,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Proposal Pending',
      value: pendingProposals,
      icon: FileText,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Saldo',
      value: `Rp ${balance.toLocaleString('id-ID')}`,
      icon: balance >= 0 ? TrendingUp : TrendingDown,
      color: balance >= 0 ? 'bg-green-500' : 'bg-red-500',
      bgColor: balance >= 0 ? 'bg-green-50' : 'bg-red-50',
      textColor: balance >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.textColor} mt-2`}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}
              </p>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`h-6 w-6 text-white ${stat.color} p-1 rounded`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}