import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Bell, 
  Users, 
  Clock, 
  CheckCircle, 
  Filter,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { AdminLayout, AdminNotification } from '../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { getAdminMediaUrl } from '../utils/mediaUrl';
import { getApiUrl } from '../lib/api';

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const cleanText = (text?: string) => {
  if (!text) return '';
  // Remove double whitespaces before parentheses
  return text.replace(/\s+\(/g, ' (').trim();
};

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'new_registration' | 'approval_request'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const apiURL = getApiUrl();
  const token = localStorage.getItem('admin_jwt');

  const fetchNotifications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiURL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await axios.post(`${apiURL}/admin/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // Ignore error
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    setActionLoading(true);
    try {
      await axios.post(`${apiURL}/admin/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // Fallback
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } finally {
      setActionLoading(false);
    }
  };

  // Deduplication & lifecycle consolidation logic
  const consolidatedNotifs = useMemo(() => {
    const seen = new Set<string>();
    const result: AdminNotification[] = [];

    for (const notif of notifications) {
      // Group alerts by user_id and day
      const dateKey = notif.created_at ? notif.created_at.slice(0, 10) : '';
      const key = `${notif.user_id}_${notif.type}_${dateKey}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(notif);
      }
    }

    return result;
  }, [notifications]);

  // Filter logic
  const filteredNotifs = consolidatedNotifs.filter(n => {
    const matchType = filterType === 'all' || n.type === filterType;
    const matchRead = filterRead === 'all' || 
      (filterRead === 'unread' && !n.read) || 
      (filterRead === 'read' && n.read);
    return matchType && matchRead;
  });

  const getImageUrl = (imagePath?: string) => getAdminMediaUrl(imagePath, '') || undefined;

  return (
    <AdminLayout>
      <div className="space-y-6 text-[#0E1525]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight flex items-center gap-2">
              <Bell size={28} className="text-[#C41230]" />
              System Alerts &amp; Audit Log
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Review member onboarding timelines and registration approval requests in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-[#1A2744] font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Refresh Feed
            </button>
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading || notifications.filter(n => !n.read).length === 0}
              className="bg-[#C41230] hover:bg-[#9E0E27] disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCheck size={15} />
              <span>Mark All as Read</span>
            </button>
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-[#3A4260] text-xs font-extrabold uppercase">
            <Filter size={15} className="text-[#C41230]" />
            <span>Filter Event Logs</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230]"
            >
              <option value="all">All Alert Types</option>
              <option value="new_registration">New Member Registrations</option>
              <option value="approval_request">Profile Approval Requests</option>
            </select>

            {/* Filter by Read Status */}
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as any)}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230]"
            >
              <option value="all">All (Read &amp; Unread)</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-[#3A4260] text-xs">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2"></div>
              <p className="font-semibold">Loading system audit timeline…</p>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-[#3A4260] text-sm font-medium">
              No matching alerts or notifications were found in system logs.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifs.map((n) => {
                const isUnread = !n.read;
                return (
                  <div 
                    key={n.id}
                    className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors ${
                      isUnread ? 'bg-indigo-50/40 border-l-4 border-l-[#C41230]' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      {/* Event Type Icon */}
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        n.type === 'new_registration' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F9D0D7] text-[#C41230]'
                      }`}>
                        {n.type === 'new_registration' ? <Users size={18} /> : <Bell size={18} />}
                      </div>

                      {/* Content block */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#0E1525] leading-normal">{cleanText(n.title)}</span>
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#C41230] text-white">
                              UNREAD
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A6380] leading-relaxed">{cleanText(n.message)}</p>
                        
                        {/* Member Details mini view */}
                        {n.user && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                            {n.user.profile_image ? (
                              <img 
                                src={getImageUrl(n.user.profile_image)} 
                                alt={n.user.full_name || 'Member'}
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#1A2744] flex items-center justify-center text-white font-bold text-[8px]">
                                {n.user.full_name?.charAt(0) || 'M'}
                              </div>
                            )}
                            <span className="text-[11px] text-[#7A85A0]">
                              Applicant: <span className="text-[#0E1525] font-semibold">{n.user.full_name || 'Member'}</span> ({n.user.email})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta & Dynamic Action CTA */}
                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end md:justify-start border-t border-slate-100 md:border-none pt-3 md:pt-0 mt-1 md:mt-0">
                      <div className="text-right flex flex-col items-end gap-0.5 font-mono text-[10px] text-[#7A85A0]" title={n.created_at ? new Date(n.created_at).toLocaleString() : ''}>
                        <span className="flex items-center gap-1 font-semibold text-[#0E1525]">
                          <Clock size={11} className="text-[#C41230]" />
                          {formatRelativeTime(n.created_at)}
                        </span>
                        <span>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</span>
                      </div>

                      <div className="flex gap-2">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-[#1A2744] rounded-xl transition-all"
                            title="Mark as Read"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (isUnread) handleMarkAsRead(n.id);
                            navigate('/members?tab=pending');
                          }}
                          className="px-3.5 py-2 bg-[#1A2744] hover:bg-[#111B30] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm"
                        >
                          <span>Review Application</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Notifications;
