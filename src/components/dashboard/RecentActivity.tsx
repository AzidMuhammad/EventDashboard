'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { Notification } from '@/types';
import { useState } from 'react';

interface RecentActivityProps {
  notifications: Notification[];
}

export default function RecentActivity({ notifications }: RecentActivityProps) {
  const [localNotifications, setLocalNotifications] = useState(notifications);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'proposal_update': return CheckCircle;
      case 'finance_update': return AlertCircle;
      case 'participant_update': return Bell;
      case 'system': return Info;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'proposal_update': return 'text-blue-500 bg-blue-50';
      case 'finance_update': return 'text-green-500 bg-green-50';
      case 'participant_update': return 'text-purple-500 bg-purple-50';
      case 'system': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: notificationId,
          read: true,
        }),
      });

      if (response.ok) {
        setLocalNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocalNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="space-y-3">
      {localNotifications.map((notification) => {
        const Icon = getNotificationIcon(notification.type);
        
        return (
          <div
            key={notification._id}
            className={`relative flex items-start space-x-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
              notification.read 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-white border-blue-200 shadow-sm'
            }`}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                    {notification.title}
                  </h4>
                  <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Tandai sebagai dibaca"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Hapus notifikasi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        );
      })}

      {localNotifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Belum ada notifikasi</p>
        </div>
      )}
    </div>
  );
}