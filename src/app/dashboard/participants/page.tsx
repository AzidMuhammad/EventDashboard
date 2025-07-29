'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Participant, Competition } from '@/types';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, UserGroupIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ParticipantsPage() {
  const { data: session, status } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [formData, setFormData] = useState({
    competitionId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    age: 0,
    status: 'registered' as const,
    teamMembers: ['']
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [participantsRes, competitionsRes] = await Promise.all([
        fetch('/api/participants'),
        fetch('/api/competitions')
      ]);
      
      const [participantsData, competitionsData] = await Promise.all([
        participantsRes.json(),
        competitionsRes.json()
      ]);
      
      setParticipants(participantsData);
      setCompetitions(competitionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingParticipant 
        ? `/api/participants/${editingParticipant._id}`
        : '/api/participants';
      
      const method = editingParticipant ? 'PUT' : 'POST';
      
      const dataToSend = {
        ...formData,
        teamMembers: formData.teamMembers.filter(member => member.trim() !== '')
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        await fetchData();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving participant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus peserta ini?')) {
      try {
        const response = await fetch(`/api/participants/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchData();
        }
      } catch (error) {
        console.error('Error deleting participant:', error);
      }
    }
  };

  const updateStatus = async (id: string, newStatus: 'registered' | 'confirmed' | 'disqualified') => {
    try {
      const response = await fetch(`/api/participants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      competitionId: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      age: 0,
      status: 'registered',
      teamMembers: ['']
    });
    setEditingParticipant(null);
  };

  const openEditModal = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormData({
      competitionId: participant.competitionId,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      address: participant.address,
      age: participant.age,
      status: participant.status,
      teamMembers: participant.teamMembers && participant.teamMembers.length > 0 
        ? participant.teamMembers 
        : ['']
    });
    setShowModal(true);
  };

  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, '']
    });
  };

  const removeTeamMember = (index: number) => {
    const newTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      teamMembers: newTeamMembers.length > 0 ? newTeamMembers : ['']
    });
  };

  const updateTeamMember = (index: number, value: string) => {
    const newTeamMembers = [...formData.teamMembers];
    newTeamMembers[index] = value;
    setFormData({
      ...formData,
      teamMembers: newTeamMembers
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'disqualified': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'disqualified': return 'Diskualifikasi';
      default: return 'Terdaftar';
    }
  };

  const getCompetitionName = (competitionId: string) => {
    const competition = competitions.find(c => c._id === competitionId);
    return competition ? competition.name : 'Lomba Tidak Ditemukan';
  };

  // Filter participants
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    const matchesCompetition = competitionFilter === 'all' || participant.competitionId === competitionFilter;
    
    return matchesSearch && matchesStatus && matchesCompetition;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const isAdmin = session?.user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Peserta</h1>
            <p className="text-gray-600 mt-1">Kelola semua peserta lomba 17 Agustus</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Tambah Peserta
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Peserta</p>
                <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terdaftar</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {participants.filter(p => p.status === 'registered').length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dikonfirmasi</p>
                <p className="text-2xl font-bold text-green-600">
                  {participants.filter(p => p.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diskualifikasi</p>
                <p className="text-2xl font-bold text-red-600">
                  {participants.filter(p => p.status === 'disqualified').length}
                </p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari Peserta</label>
              <input
                type="text"
                placeholder="Nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">Semua Status</option>
                <option value="registered">Terdaftar</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="disqualified">Diskualifikasi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Lomba</label>
              <select
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">Semua Lomba</option>
                {competitions.map(competition => (
                  <option key={competition._id} value={competition._id}>
                    {competition.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCompetitionFilter('all');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lomba
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Daftar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant) => (
                  <tr key={participant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                        <div className="text-sm text-gray-500">Umur: {participant.age} tahun</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{participant.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCompetitionName(participant.competitionId)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{participant.email}</div>
                      <div className="text-sm text-gray-500">{participant.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {participant.teamMembers && participant.teamMembers.length > 0 ? (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">Tim ({participant.teamMembers.length} anggota)</div>
                          <div className="text-gray-500">
                            {participant.teamMembers.slice(0, 2).join(', ')}
                            {participant.teamMembers.length > 2 && '...'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Individual</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(participant.status)}`}>
                        {getStatusText(participant.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(participant.registrationDate).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => openEditModal(participant)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <div className="relative group">
                              <button className="text-green-600 hover:text-green-900">
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                              <div className="absolute right-0 top-6 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                                <button
                                  onClick={() => updateStatus(participant._id, 'registered')}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  Terdaftar
                                </button>
                                <button
                                  onClick={() => updateStatus(participant._id, 'confirmed')}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  Konfirmasi
                                </button>
                                <button
                                  onClick={() => updateStatus(participant._id, 'disqualified')}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  Diskualifikasi
                                </button>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDelete(participant._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredParticipants.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada peserta</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || competitionFilter !== 'all' 
                  ? 'Tidak ada peserta yang sesuai dengan filter.'
                  : 'Belum ada peserta yang terdaftar.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && isAdmin && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingParticipant ? 'Edit Peserta' : 'Tambah Peserta Baru'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lomba</label>
                  <select
                    required
                    value={formData.competitionId}
                    onChange={(e) => setFormData({ ...formData, competitionId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Pilih Lomba</option>
                    {competitions.filter(c => c.status === 'active').map(competition => (
                      <option key={competition._id} value={competition._id}>
                        {competition.name} - {competition.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Umur</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Alamat</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="registered">Terdaftar</option>
                    <option value="confirmed">Dikonfirmasi</option>
                    <option value="disqualified">Diskualifikasi</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Anggota Tim (Opsional)</label>
                    <button
                      type="button"
                      onClick={addTeamMember}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      + Tambah Anggota
                    </button>
                  </div>
                  {formData.teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`Nama anggota ${index + 1}`}
                        value={member}
                        onChange={(e) => updateTeamMember(index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                      {formData.teamMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                  >
                    {editingParticipant ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}