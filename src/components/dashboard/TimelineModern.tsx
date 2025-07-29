'use client';

import { useMemo } from 'react';
import { format, compareDesc } from 'date-fns';
import { id } from 'date-fns/locale';
import { Trophy, Users, FileText, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Competition, Participant, Proposal, Finance } from '@/types';

interface TimelineModernProps {
  data: {
    competitions: Competition[];
    participants: Participant[];
    proposals: Proposal[];
    finances: Finance[];
  };
}

export default function TimelineModern({ data }: TimelineModernProps) {
  const { competitions, participants, proposals, finances } = data;

  const timelineEvents = useMemo(() => {
    const events = [];

    // Add competition events
    competitions.forEach(comp => {
      events.push({
        id: `comp-${comp._id}`,
        date: new Date(comp.createdAt),
        title: `Lomba "${comp.name}" dibuat`,
        description: comp.description,
        type: 'competition',
        icon: Trophy,
        status: comp.status === 'active' ? 'completed' : 'upcoming',
        data: comp
      });
    });

    // Add participant events
    participants.slice(0, 10).forEach(participant => {
      events.push({
        id: `participant-${participant._id}`,
        date: new Date(participant.registrationDate),
        title: `${participant.name} mendaftar`,
        description: `Peserta baru untuk lomba`,
        type: 'participant',
        icon: Users,
        status: 'completed',
        data: participant
      });
    });

    // Add proposal events
    proposals.slice(0, 10).forEach(proposal => {
      events.push({
        id: `proposal-${proposal._id}`,
        date: new Date(proposal.createdAt),
        title: `Proposal "${proposal.title}" dibuat`,
        description: proposal.description,
        type: 'proposal',
        icon: FileText,
        status: proposal.status === 'approved' ? 'completed' : 'in_progress',
        data: proposal
      });
    });

    // Add finance events
    finances.slice(0, 10).forEach(finance => {
      events.push({
        id: `finance-${finance._id}`,
        date: new Date(finance.date),
        title: `${finance.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${finance.amount.toLocaleString('id-ID')}`,
        description: finance.description,
        type: 'finance',
        icon: DollarSign,
        status: 'completed',
        data: finance
      });
    });

    return events
      .sort((a, b) => compareDesc(a.date, b.date))
      .slice(0, 15);
  }, [competitions, participants, proposals, finances]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'upcoming': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'upcoming': return AlertCircle;
      default: return Clock;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'competition': return 'text-blue-600 bg-blue-50';
      case 'participant': return 'text-green-600 bg-green-50';
      case 'proposal': return 'text-purple-600 bg-purple-50';
      case 'finance': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {timelineEvents.map((event, index) => {
        const StatusIcon = getStatusIcon(event.status);
        
        return (
          <div key={event.id} className="relative flex items-start space-x-4">
            {/* Timeline line */}
            {index < timelineEvents.length - 1 && (
              <div className="absolute left-4 top-10 w-0.5 h-12 bg-gray-200" />
            )}

            {/* Icon */}
            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(event.status)}`}>
              <event.icon className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {event.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <StatusIcon className={`w-4 h-4 ${event.status === 'completed' ? 'text-green-500' : event.status === 'in_progress' ? 'text-yellow-500' : 'text-blue-500'}`} />
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {event.description}
              </p>
              
              <p className="text-xs text-gray-400 mt-2">
                {format(event.date, 'dd MMM yyyy, HH:mm', { locale: id })}
              </p>
            </div>
          </div>
        );
      })}

      {timelineEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Belum ada aktivitas</p>
        </div>
      )}
    </div>
  );
}