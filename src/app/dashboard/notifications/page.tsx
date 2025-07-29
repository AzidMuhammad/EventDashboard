'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Notification } from '@/types';
import { 
  BellIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  UserGroupIcon,
  CogIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    fetchNotifications();
  }, [session]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) {
      try {
        await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
        });
        
        setNotifications(prev => prev.filter(notif => notif._id !== id));
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedNotifications.length} notifikasi?`)) {
      try {
        await Promise.all(
          selectedNotifications.map(id =>
            fetch(`/api/notifications/${id}`, { method: 'DELETE' })
          )
        );
        
        setNotifications(prev => 
          prev.filter(notif => !selectedNotifications.includes(notif._id))
        );
        setSelectedNotifications([]);
      } catch (error) {
        console.error('Error deleting selected notifications:', error);
      }
    }
  };

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notif => notif._id));
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filter === 'all' || notification.type === filter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'read' && notification.read) ||
                         (statusFilter === 'unread' && !notification.read);
    
    return matchesType && matchesStatus;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'proposal_update':
        return <DocumentTextIcon className="h-5 w-5 text-blue-600" />;
      case 'finance_update':
        return <BanknotesIcon className="h-5 w-5 text-green-600" />;
      case 'participant_update':
        return <UserGroupIcon className="h-5 w-5 text-purple-600" />;
      case 'system':
        return <CogIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get notification type text
  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'proposal_update':
        return 'Update Proposal';
      case 'finance_update':
        return 'Update Keuangan';
      case 'participant_update':
        return 'Update Peserta';
      case 'system':
        return 'Sistem';
      default:
        return 'Notifikasi';
    }
  };

  // Get notification status color
  const getStatusColor = (read: boolean) => {
    return read ? 'bg-gray-100 text-gray-800' : 'bg-orange-100 text-orange-800';
  };

  const getStatusText = (read: boolean) => {
    return read ? 'Dibaca' : 'Belum Dibaca';
  };

  // Statistics
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const todayCount = notifications.filter(n => 
    new Date(n.createdAt).toDateString() === new Date().toDateString()
  ).length;

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
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Notifikasi</h1>
            <p className="text-gray-600 mt-1">Kelola dan pantau semua notifikasi sistem lomba 17 Agustus</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <CheckIcon className="h-5 w-5" />
                Tandai Semua Dibaca
              </button>
            )}
            {selectedNotifications.length > 0 && (
              <button
                onClick={deleteSelected}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
                Hapus ({selectedNotifications.length})
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifikasi</p>
                <p className="text-2xl font-bold text-gray-900">{totalNotifications}</p>
              </div>
              <BellIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Belum Dibaca</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hari Ini</p>
                <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sudah Dibaca</p>
                <p className="text-2xl font-bold text-green-600">{totalNotifications - unreadCount}</p>
              </div>
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filter Notifikasi</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Semua Tipe</option>
              <option value="proposal_update">Update Proposal</option>
              <option value="finance_update">Update Keuangan</option>
              <option value="participant_update">Update Peserta</option>
              <option value="system">Sistem</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Semua Status</option>
              <option value="read">Sudah Dibaca</option>
              <option value="unread">Belum Dibaca</option>
            </select>

            <button
              onClick={selectAllNotifications}
              className="border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              {selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0 
                ? 'Batal Pilih Semua' 
                : 'Pilih Semua'
              }
            </button>

            <div className="text-sm text-gray-600 flex items-center">
              {filteredNotifications.length} notifikasi ditemukan
            </div>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada notifikasi
              </h3>
              <p className="text-gray-600">
                Belum ada notifikasi yang sesuai dengan filter Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                        onChange={selectAllNotifications}
                        className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notifikasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
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
                  {filteredNotifications.map((notification) => (
                    <tr key={notification._id} className={`hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification._id)}
                          onChange={() => toggleSelectNotification(notification._id)}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                              {!notification.read && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Baru
                                </span>
                              )}
                            </div>
                            <div className={`text-sm ${!notification.read ? 'text-gray-800' : 'text-gray-500'} line-clamp-2`}>
                              {notification.message}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getNotificationTypeText(notification.type)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(notification.createdAt).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(notification.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.read)}`}>
                          {getStatusText(notification.read)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {notification.data && (
                            <button 
                              onClick={() => setShowDetails(
                                showDetails === notification._id ? null : notification._id
                              )}
                              className="text-blue-600 hover:text-blue-900"
                              title="Lihat detail"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Tandai sebagai dibaca"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus notifikasi"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notification Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detail Notifikasi</h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {(() => {
                const notification = notifications.find(n => n._id === showDetails);
                if (!notification) return null;

                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Judul</label>
                      <p className="text-sm text-gray-900">{notification.title}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pesan</label>
                      <p className="text-sm text-gray-900">{notification.message}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipe</label>
                      <p className="text-sm text-gray-900">{getNotificationTypeText(notification.type)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Waktu</label>
                      <p className="text-sm text-gray-900">
                        {new Date(notification.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>

                    {notification.data && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Detail</label>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-60">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setShowDetails(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}