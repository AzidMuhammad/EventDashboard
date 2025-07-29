import React from 'react';
import ActivityCalendar from 'react-activity-calendar';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface ActivityHeatmapProps {
  activities: Array<{
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }>;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activities }) => {
  // Default data if none provided
  const defaultData = [
    { date: '2023-01-01', count: 0, level: 0 },
    { date: '2023-01-02', count: 1, level: 1 },
    // Add more default dates as needed
  ];

  const data = activities.length > 0 ? activities : defaultData;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-4">Aktivitas Terkini</h3>
      <ActivityCalendar
        data={data}
        blockSize={14}
        blockMargin={4}
        fontSize={14}
        theme={{
          light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
          dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
        }}
        labels={{
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
          weekdays: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
          totalCount: '{{count}} aktivitas di {{year}}',
          legend: {
            less: 'Sedikit',
            more: 'Banyak',
          },
        }}
        renderBlock={(block, activity) => (
          <React.Fragment>
            <a
              data-tooltip-id="react-tooltip"
              data-tooltip-html={`${activity.count} aktivitas pada ${activity.date}`}
            >
              {block}
            </a>
            <ReactTooltip id="react-tooltip" />
          </React.Fragment>
        )}
      />
    </div>
  );
};

export default ActivityHeatmap;