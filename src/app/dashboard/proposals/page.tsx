'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Proposal, Competition, Participant } from '@/types';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function ProposalsPage() {
  const { data: session, status } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [reviewingProposal, setReviewingProposal] = useState<Proposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [formData, setFormData] = useState({
    competitionId: '',
    participantId: '',
    title: '',
    description: '',
    status: 'draft' as const,
    files: ['']
  });
  const [reviewData, setReviewData] = useState({
    score: 0,
    feedback: '',
    status: 'under_review' as const
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
      const [proposalsRes, competitionsRes, participantsRes] = await Promise.all([
        fetch('/api/proposals'),
        fetch('/api/competitions'),
        fetch('/api/participants')
      ]);
      
      const [proposalsData, competitionsData, participantsData] = await Promise.all([
        proposalsRes.json(),
        competitionsRes.json(),
        participantsRes.json()
      ]);
      
      setProposals(proposalsData);
      setCompetitions(competitionsData);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProposal 
        ? `/api/proposals/${editingProposal._id}`
        : '/api/proposals';
      
      const method = editingProposal ? 'PUT' : 'POST';
      
      const dataToSend = {
        ...formData,
        files: formData.files.filter(file => file.trim() !== ''),
        submittedAt: formData.status === 'submitted' ? new Date() : undefined
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
      console.error('Error saving proposal:', error);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewingProposal) return;

    try {
      const response = await fetch(`/api/proposals/${reviewingProposal._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          reviewedAt: new Date()
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowReviewModal(false);
        setReviewingProposal(null);
        setReviewData({
          score: 0,
          feedback: '',
          status: 'under_review'
        });
      }
    } catch (error) {
      console.error('Error reviewing proposal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus proposal ini?')) {
      try {
        const response = await fetch(`/api/proposals/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchData();
        }
      } catch (error) {
        console.error('Error deleting proposal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      competitionId: '',
      participantId: '',
      title: '',
      description: '',
      status: 'draft',
      files: ['']
    });
    setEditingProposal(null);
  };

  const openEditModal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setFormData({
      competitionId: proposal.competitionId,
      participantId: proposal.participantId,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      files: proposal.files && proposal.files.length > 0 ? proposal.files : ['']
    });
    setShowModal(true);
  };

  const openReviewModal = (proposal: Proposal) => {
    setReviewingProposal(proposal);
    setReviewData({
      score: proposal.score || 0,
      feedback: proposal.feedback || '',
      status: proposal.status === 'submitted' ? 'under_review' : proposal.status as any
    });
    setShowReviewModal(true);
  };

  const addFile = () => {
    setFormData({
      ...formData,
      files: [...formData.files, '']
    });
  };

  const removeFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      files: newFiles.length > 0 ? newFiles : ['']
    });
  };

  const updateFile = (index: number, value: string) => {
    const newFiles = [...formData.files];
    newFiles[index] = value;
    setFormData({
      ...formData,
      files: newFiles
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Terkirim';
      case 'under_review': return 'Dalam Review';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return 'Draft';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <DocumentTextIcon className="h-4 w-4" />;
      case 'under_review': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getCompetitionName = (competitionId: string) => {
    const competition = competitions.find(c => c._id === competitionId);
    return competition ? competition.name : 'Lomba Tidak Ditemukan';
  };

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p._id === participantId);
    return participant ? participant.name : 'Peserta Tidak Ditemukan';
  };

  const getFilteredParticipants = () => {
    if (!formData.competitionId) return [];
    return participants.filter(p => p.competitionId === formData.competitionId);
  };

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesCompetition = competitionFilter === 'all' || proposal.competitionId === competitionFilter;
    
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
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Proposal</h1>
            <p className="text-gray-600 mt-1">Kelola semua proposal lomba 17 Agustus</p>
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
              Tambah Proposal
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Proposal</p>
                <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-600">
                  {proposals.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dalam Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {proposals.filter(p => p.status === 'under_review').length}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">
                  {proposals.filter(p => p.status === 'approved').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ditolak</p>
                <p className="text-2xl font-bold text-red-600">
                  {proposals.filter(p => p.status === 'rejected').length}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari Proposal</label>
              <input
                type="text"
                placeholder="Judul atau deskripsi..."
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
                <option value="draft">Draft</option>
                <option value="submitted">Terkirim</option>
                <option value="under_review">Dalam Review</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
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

        {/* Proposals Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proposal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lomba
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProposals.map((proposal) => (
                  <tr key={proposal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{proposal.description}</div>
                        {proposal.files && proposal.files.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {proposal.files.length} file(s) attached
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCompetitionName(proposal.competitionId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getParticipantName(proposal.participantId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                        {getStatusIcon(proposal.status)}
                        {getStatusText(proposal.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {proposal.score !== undefined ? (
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">{proposal.score}/100</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {proposal.submittedAt 
                          ? new Date(proposal.submittedAt).toLocaleDateString('id-ID')
                          : new Date(proposal.createdAt).toLocaleDateString('id-ID')
                        }
                      </div>
                      {proposal.reviewedAt && (
                        <div className="text-xs text-gray-500">
                          Review: {new Date(proposal.reviewedAt).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => openEditModal(proposal)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {(proposal.status === 'submitted' || proposal.status === 'under_review') && (
                              <button 
                                onClick={() => openReviewModal(proposal)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                <StarIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(proposal._id)}
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
          
          {filteredProposals.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada proposal</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || competitionFilter !== 'all' 
                  ? 'Tidak ada proposal yang sesuai dengan filter.'
                  : 'Belum ada proposal yang dibuat.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && isAdmin && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProposal ? 'Edit Proposal' : 'Tambah Proposal Baru'}
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
                    onChange={(e) => setFormData({ ...formData, competitionId: e.target.value, participantId: '' })}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">Peserta</label>
                  <select
                    required
                    value={formData.participantId}
                    onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    disabled={!formData.competitionId}
                  >
                    <option value="">Pilih Peserta</option>
                    {getFilteredParticipants().map(participant => (
                      <option key={participant._id} value={participant._id}>
                        {participant.name} - {participant.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Judul Proposal</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    <option value="draft">Draft</option>
                    <option value="submitted">Terkirim</option>
                    <option value="under_review">Dalam Review</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">File Lampiran</label>
                    <button
                      type="button"
                      onClick={addFile}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      + Tambah File
                    </button>
                  </div>
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`URL file ${index + 1}`}
                        value={file}
                        onChange={(e) => updateFile(index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                      {formData.files.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
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
                    {editingProposal ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && reviewingProposal && isAdmin && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Review Proposal: {reviewingProposal.title}
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Detail Proposal</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Peserta:</strong> {getParticipantName(reviewingProposal.participantId)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Lomba:</strong> {getCompetitionName(reviewingProposal.competitionId)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Deskripsi:</strong> {reviewingProposal.description}
                </p>
              </div>

              <form onSubmit={handleReview} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Skor (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewData.score}
                      onChange={(e) => setReviewData({ ...reviewData, score: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status Review</label>
                    <select
                      value={reviewData.status}
                      onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="under_review">Dalam Review</option>
                      <option value="approved">Disetujui</option>
                      <option value="rejected">Ditolak</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Feedback</label>
                  <textarea
                    rows={4}
                    value={reviewData.feedback}
                    onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                    placeholder="Berikan feedback untuk peserta..."
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                  >
                    Simpan Review
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