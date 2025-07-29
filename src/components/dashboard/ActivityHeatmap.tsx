'use client';

import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, getDay } from 'date-fns';
import { Competition, Participant, Proposal, Finance } from '@/types';

interface ActivityHeatmapProps {
  data: {
    competitions: Competition[];
    participants: Participant[];
    proposals: Proposal[];
    finances: Finance[];
  };
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { competitions, participants, proposals, finances } = data;

  const heatmapData = useMemo(() => {
    const last365Days = eachDayOfInterval({
      start: subDays(new Date(), 364),
      end: new Date()
    });

    return last365Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count activities for this date
      const competitionCount = competitions.filter(c => 
        format(new Date(c.createdAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      const participantCount = participants.filter(p => 
        format(new Date(p.registrationDate), 'yyyy-MM-dd') === dateStr
      ).length;
      
      const proposalCount = proposals.filter(p => 
        format(new Date(p.createdAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      const financeCount = finances.filter(f => 
        format(new Date(f.date), 'yyyy-MM-dd') === dateStr
      ).length;

      const total = competitionCount + participantCount + proposalCount + financeCount;
      
      // Determine activity level (0-4)
      let level = 0;
      if (total > 0) level = 1;
      if (total > 2) level = 2;
      if (total > 5) level = 3;
      if (total > 10) level = 4;

      return {
        date: dateStr,
        count: total,
        level,
        day: getDay(date)
      };
    });
  }, [competitions, participants, proposals, finances]);

  // Group by weeks
  const weeks = useMemo(() => {
    const weeksArray = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeksArray.push(heatmapData.slice(i, i + 7));
    }
    return weeksArray;
  }, [heatmapData]);

  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-red-100';
      case 2: return 'bg-red-200';
      case 3: return 'bg-red-400';
      case 4: return 'bg-red-600';
      default: return 'bg-gray-100';
    }
  };

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex mb-2 ml-8">
          {monthLabels.map((month, index) => (
            <div key={month} className="flex-1 text-xs text-gray-500 text-center">
              {month}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col justify-start mr-2">
            {dayLabels.map((day, index) => (
              <div key={day} className="h-3 flex items-center text-xs text-gray-500 mb-1">
                {index % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col mr-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm mb-1 ${getColorClass(day.level)} hover:ring-2 hover:ring-red-300 cursor-pointer transition-all`}
                    title={`${format(new Date(day.date), 'dd MMM yyyy')}: ${day.count} aktivitas`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>Sedikit</span>
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getColorClass(level)}`}
              />
            ))}
          </div>
          <span>Banyak</span>
        </div>
      </div>
    </div>
  );
}