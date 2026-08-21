import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, 
  Check, 
  Users, 
  Clock, 
  CheckCircle,
  Eye,
  Filter
} from 'lucide-react';
import { AdminLayout, AdminNotification } from '../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { getAdminMediaUrl } from '../utils/mediaUrl';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'new_registration' | 'approval_request'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const apiURL = import.meta.env.VITE_API_URL || 'https://sec-api.duckdns.org/api';
  const token = localStorage.getItem('admin_jwt');

  const fetchNotifications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiURL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      // Sanitized error handling
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
    } catch (err) {
      // Sanitized error handling
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => 
        axios.post(`${apiURL}/admin/notifications/${n.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      // Sanitized error handling
    }
  };


  // Filter logic
  const filteredNotifs = notifications.filter(n => {
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
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight">System Alerts Center</h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">Review club onboarding events and registration approval requests.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-[#1A2744] font-semibold text-xs rounded-xl transition-all"
            >
              Refresh Logs
            </button>
            <button
              onClick={handleMarkAllAsRead}
              disabled={notifications.filter(n => !n.read).length === 0}
              className="bg-[#C41230] hover:bg-[#9E0E27] disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <Check size={14} />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-[#3A4260] text-xs font-extrabold uppercase">
            <Filter size={14} className="text-[#C41230]" />
            <span>Filter Alerts</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2 text-xs text-[#0E1525] font-medium focus:outline-none focus:border-[#C41230]"
            >
              <option value="all">All Types</option>
              <option value="new_registration">New Registrations</option>
              <option value="approval_request">Approval Requests</option>
            </select>

            {/* Filter by Read Status */}
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as any)}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2 text-xs text-[#0E1525] font-medium focus:outline-none focus:border-[#C41230]"
            >
              <option value="all">Read & Unread</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-[#3A4260] text-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2"></div>
              <p>Loading notifications history...</p>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-[#3A4260] text-sm font-medium">
              No matching alerts were found in system logs.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifs.map((n) => {
                const isUnread = !n.read;
                return (
                  <div 
                    key={n.id}
                    className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors ${
                      isUnread ? 'bg-[#F9D0D7]/20 border-l-4 border-l-[#C41230]' : 'border-l-4 border-l-transparent'
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
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#0E1525] leading-normal">{n.title}</span>
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#F9D0D7] text-[#C41230] border border-[#C41230]/20">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#3A4260] leading-relaxed">{n.message}</p>
                        
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
                              Triggered by: <span className="text-[#0E1525] font-semibold">{n.user.full_name || 'Anonymous'}</span> ({n.user.email})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta & Actions block */}
                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end md:justify-start border-t border-slate-100 md:border-none pt-3 md:pt-0 mt-1 md:mt-0">
                      <div className="text-right flex flex-col items-end gap-1 font-mono text-[10px] text-[#7A85A0]">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex gap-2">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-[#1A2744] rounded-xl transition-all"
                            title="Mark Read"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (isUnread) handleMarkAsRead(n.id);
                            navigate('/members?tab=pending');
                          }}
                          className="px-3.5 py-2 bg-[#1A2744]/10 hover:bg-[#1A2744]/20 border border-[#1A2744]/20 text-[#1A2744] font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View Pending
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
