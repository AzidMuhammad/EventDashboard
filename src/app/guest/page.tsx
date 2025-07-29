'use client';

import { useEffect, useState } from 'react';
import { Trophy, Users, FileText, Calendar, Award, MapPin, Clock } from 'lucide-react';
import { Competition, Participant, Proposal } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function GuestPage() {
  const [data, setData] = useState({
    competitions: [] as Competition[],
    participants: [] as Participant[],
    proposals: [] as Proposal[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        // Note: In a real implementation, you'd create separate public API endpoints
        // that don't require authentication for guest access
        const [competitionsRes, participantsRes, proposalsRes] = await Promise.all([
          fetch('/api/competitions'),
          fetch('/api/participants'),
          fetch('/api/proposals'),
        ]);

        const [competitions, participants, proposals] = await Promise.all([
          competitionsRes.json(),
          participantsRes.json(),
          proposalsRes.json(),
        ]);

        setData({ competitions, participants, proposals });
      } catch (error) {
        console.error('Error fetching public data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const activeCompetitions = data.competitions.filter(c => c.status === 'active');
  const totalParticipants = data.participants.length;
  const approvedProposals = data.proposals.filter(p => p.status === 'approved').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
              <span className="text-4xl">🏆</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Lomba 17 Agustus 2024
            </h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Merayakan kemerdekaan Indonesia dengan berbagai kompetisi menarik
              untuk seluruh masyarakat
            </p>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {activeCompetitions.length}
              </h3>
              <p className="text-gray-600">Lomba Aktif</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {totalParticipants}
              </h3>
              <p className="text-gray-600">Total Peserta</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {approvedProposals}
              </h3>
              <p className="text-gray-600">Proposal Disetujui</p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitions Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Lomba yang Tersedia
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ikuti berbagai kompetisi menarik dalam rangka memperingati HUT RI ke-79
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.competitions.map((competition) => {
              const participantCount = data.participants.filter(
                p => p.competitionId === competition._id
              ).length;

              return (
                <div key={competition._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        competition.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : competition.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {competition.status === 'active' ? 'Aktif' : 
                         competition.status === 'draft' ? 'Draft' : 
                         competition.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                      </span>
                      <Trophy className="w-5 h-5 text-gray-400" />
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {competition.name}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {competition.description}
                    </p>

                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {format(new Date(competition.startDate), 'dd MMM', { locale: id })} - {' '}
                          {format(new Date(competition.endDate), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>
                          {participantCount} / {competition.maxParticipants} peserta
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{competition.category}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress Pendaftaran</span>
                        <span>{Math.round((participantCount / competition.maxParticipants) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((participantCount / competition.maxParticipants) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Prizes */}
                    {(competition.prizes?.first || competition.prizes?.second || competition.prizes?.third) && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Hadiah:</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          {competition.prizes.first && (
                            <div className="flex items-center">
                              <span className="text-yellow-500 mr-2">🥇</span>
                              <span>{competition.prizes.first}</span>
                            </div>
                          )}
                          {competition.prizes.second && (
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-2">🥈</span>
                              <span>{competition.prizes.second}</span>
                            </div>
                          )}
                          {competition.prizes.third && (
                            <div className="flex items-center">
                              <span className="text-orange-600 mr-2">🥉</span>
                              <span>{competition.prizes.third}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {data.competitions.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum Ada Lomba
              </h3>
              <p className="text-gray-500">
                Lomba akan segera hadir. Stay tuned!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Participants Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Peserta Terbaru
            </h2>
            <p className="text-gray-600">
              Peserta yang baru saja mendaftar dalam lomba
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.participants.slice(0, 8).map((participant) => (
              <div key={participant._id} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {participant.name}
                </h4>
                <p className="text-sm text-gray-500 mb-2">
                  Usia: {participant.age} tahun
                </p>
                <p className="text-xs text-gray-400">
                  {format(new Date(participant.registrationDate), 'dd MMM yyyy', { locale: id })}
                </p>
              </div>
            ))}
          </div>

          {data.participants.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum Ada Peserta
              </h3>
              <p className="text-gray-500">
                Jadilah yang pertama mendaftar!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Lomba 17 Agustus. Made with ❤️ for Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}