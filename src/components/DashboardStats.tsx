import { FiAward, FiUsers, FiFileText, FiDollarSign } from 'react-icons/fi';

interface DashboardStatsProps {
  stats: {
    totalCompetitions: number;
    totalParticipants: number;
    pendingProposals: number;
    totalBudget: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <FiAward size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Total Lomba</h3>
            <p className="text-2xl font-bold">{stats.totalCompetitions}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <FiUsers size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Total Peserta</h3>
            <p className="text-2xl font-bold">{stats.totalParticipants}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <FiFileText size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Proposal Pending</h3>
            <p className="text-2xl font-bold">{stats.pendingProposals}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <FiDollarSign size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Total Budget</h3>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;