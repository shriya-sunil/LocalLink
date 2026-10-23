import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  CalendarCheck,
  Tag,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../lib/api/notifications';
import { NotificationItem } from '../../types';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const list = await getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    fetchNotifs();
  };

  const handleClickItem = async (item: NotificationItem) => {
    await markNotificationAsRead(item.id);
    if (item.link) {
      navigate(item.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return <Tag size={16} className="text-teal" />;
      case 'booking':
        return <CalendarCheck size={16} className="text-navy" />;
      case 'chat':
        return <MessageSquare size={16} className="text-salmon" />;
      default:
        return <Info size={16} className="text-teal" />;
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-navy hover:bg-sage-light flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-teal hover:underline flex items-center gap-1"
          >
            <CheckCheck size={15} />
            <span>{t('notifications.mark_all_read')}</span>
          </button>
        )}
      </div>

      <div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {t('notifications.title')}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Job updates, quotes received, and booking milestones
        </p>
      </div>

      {/* Push & SMS Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-teal-light border border-teal/30 flex items-start gap-2.5 text-xs text-teal-dark">
        <Sparkles size={16} className="text-teal flex-shrink-0 mt-0.5" />
        <span className="leading-relaxed">{t('notifications.push_notice')}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ll-card p-4 animate-pulse space-y-2">
              <div className="h-4 bg-sage-light rounded w-1/3" />
              <div className="h-3 bg-sage-light rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="ll-card p-8 text-center space-y-2 bg-salmon-light/30 border-salmon">
          <Bell size={28} className="text-navy mx-auto opacity-50" />
          <h3 className="font-bold text-navy text-sm">{t('notifications.empty')}</h3>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClickItem(item)}
              className={`ll-card p-4 transition-all cursor-pointer flex items-start gap-3 shadow-soft ${
                !item.isRead ? 'border-teal bg-teal-light/20' : 'hover:border-sage-border'
              }`}
            >
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${!item.isRead ? 'bg-teal-light' : 'bg-sage-light'}`}>
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className={`text-xs font-bold truncate ${!item.isRead ? 'text-navy' : 'text-gray-700'}`}>
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {item.createdAt}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-teal flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
