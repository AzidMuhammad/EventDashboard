'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Competition } from '@/types';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, UserGroupIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

type CompetitionStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export default function CompetitionsPage() {
  const { data: session, status } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    startDate: '',
    endDate: '',
    maxParticipants: 0,
    status: 'draft' as CompetitionStatus,
    prizes: {
      first: '',
      second: '',
      third: ''
    }
  });

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchCompetitions();
    }
  }, [session]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/competitions', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCompetitions(data);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      showToast('Gagal memuat data lomba', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast('Nama lomba harus diisi', 'error');
      return false;
    }
    if (!formData.description.trim()) {
      showToast('Deskripsi harus diisi', 'error');
      return false;
    }
    if (!formData.category.trim()) {
      showToast('Kategori harus diisi', 'error');
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      showToast('Tanggal mulai dan selesai harus diisi', 'error');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      showToast('Tanggal selesai harus setelah tanggal mulai', 'error');
      return false;
    }
    if (formData.maxParticipants <= 0) {
      showToast('Jumlah maksimum peserta harus lebih dari 0', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const url = editingCompetition 
        ? `/api/competitions/${editingCompetition._id}`
        : '/api/competitions';
      
      const method = editingCompetition ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      await fetchCompetitions();
      setShowModal(false);
      resetForm();
      showToast(
        editingCompetition ? 'Lomba berhasil diperbarui' : 'Lomba berhasil dibuat',
        'success'
      );
    } catch (error) {
      console.error('Error saving competition:', error);
      showToast(
        error instanceof Error ? error.message : 'Gagal menyimpan lomba',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus lomba "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/competitions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      await fetchCompetitions();
      showToast('Lomba berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting competition:', error);
      showToast(
        error instanceof Error ? error.message : 'Gagal menghapus lomba',
        'error'
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      startDate: '',
      endDate: '',
      maxParticipants: 0,
      status: 'draft',
      prizes: {
        first: '',
        second: '',
        third: ''
      }
    });
    setEditingCompetition(null);
  };

  const openEditModal = (competition: Competition) => {
    setEditingCompetition(competition);
    setFormData({
      name: competition.name,
      description: competition.description,
      category: competition.category,
      startDate: new Date(competition.startDate).toISOString().split('T')[0],
      endDate: new Date(competition.endDate).toISOString().split('T')[0],
      maxParticipants: competition.maxParticipants,
      status: competition.status,
      prizes: competition.prizes || { first: '', second: '', third: '' }
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Draft';
    }
  };

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
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-2 rounded-md shadow-lg ${
                toast.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Lomba</h1>
            <p className="text-gray-600 mt-1">Kelola semua lomba 17 Agustus</p>
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
              Tambah Lomba
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lomba</p>
                <p className="text-2xl font-bold text-gray-900">{competitions.length}</p>
              </div>
              <TrophyIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lomba Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {competitions.filter(c => c.status === 'active').length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Peserta</p>
                <p className="text-2xl font-bold text-blue-600">
                  {competitions.reduce((sum, c) => sum + (c.currentParticipants || 0), 0)}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lomba Selesai</p>
                <p className="text-2xl font-bold text-purple-600">
                  {competitions.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <TrophyIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Competitions Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lomba
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {competitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Belum ada lomba yang dibuat
                    </td>
                  </tr>
                ) : (
                  competitions.map((competition) => (
                    <tr key={competition._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{competition.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">{competition.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{competition.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(competition.startDate).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500">
                          s/d {new Date(competition.endDate).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {competition.currentParticipants || 0} / {competition.maxParticipants}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(((competition.currentParticipants || 0) / competition.maxParticipants) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(competition.status)}`}>
                          {getStatusText(competition.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            title="Lihat Detail"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button 
                                title="Edit Lomba"
                                onClick={() => openEditModal(competition)}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button 
                                title="Hapus Lomba"
                                onClick={() => handleDelete(competition._id, competition.name)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && isAdmin && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCompetition ? 'Edit Lomba' : 'Tambah Lomba Baru'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Lomba *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={submitting}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kategori *</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={submitting}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={submitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Mulai *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      disabled={submitting}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Selesai *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={submitting}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Peserta *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                      disabled={submitting}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CompetitionStatus })}
                    disabled={submitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hadiah Juara 1</label>
                    <input
                      type="text"
                      value={formData.prizes.first}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        prizes: { ...formData.prizes, first: e.target.value }
                      })}
                      disabled={submitting}
                      placeholder="Contoh: Rp 1.000.000"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hadiah Juara 2</label>
                    <input
                      type="text"
                      value={formData.prizes.second}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        prizes: { ...formData.prizes, second: e.target.value }
                      })}
                      disabled={submitting}
                      placeholder="Contoh: Rp 750.000"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hadiah Juara 3</label>
                    <input
                      type="text"
                      value={formData.prizes.third}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        prizes: { ...formData.prizes, third: e.target.value }
                      })}
                      disabled={submitting}
                      placeholder="Contoh: Rp 500.000"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {submitting ? 'Menyimpan...' : (editingCompetition ? 'Update' : 'Simpan')}
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