import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy,
  Users,
  Calendar,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Loader2,
  AlertCircle,
  UserCheck,
  UserPlus,
  UserX,
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminApi, getApiUrl } from '../lib/api';

interface DashboardMetrics {
  total_members: number;
  approved_members: number;
  pending_members: number;
  rejected_members: number;
  inactive_members?: number;
  members_this_month: number;
  members_change_pct: number;
  upcoming_events: number;
  published_events: number;
  active_tournaments: number;
  published_announcements: number;
  draft_announcements: number;
  announcements_this_month: number;
  unread_notifications: number;
}

interface DashboardRecent {
  notifications: Array<{
    id: number;
    title: string;
    message?: string;
    read: boolean;
    created_at?: string;
    user?: { full_name?: string; email?: string } | null;
  }>;
  pending_members: Array<{
    id: number;
    full_name?: string;
    email?: string;
    created_at?: string;
    profile_image?: string;
  }>;
  upcoming_events: Array<{
    id: number;
    event_name: string;
    event_type: string;
    event_date: string;
    start_time: string;
    venue_name: string;
    is_featured?: boolean;
  }>;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  changeLabel: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  accentColor: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
  };
  icon: React.ReactNode;
  to?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changeLabel,
  trendType = 'neutral',
  accentColor,
  icon,
  to,
}) => {
  const content = (
    <div className={`bg-white border ${accentColor.border} rounded-2xl p-5 transition-all duration-200 hover:shadow-lg h-full flex flex-col justify-between group`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-[#3A4260] uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-black text-[#0E1525] mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${accentColor.bg} ${accentColor.text} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center space-x-1.5 mt-4 text-xs font-semibold">
        {trendType === 'positive' && (
          <span className="flex items-center text-emerald-600 font-bold">
            <ArrowUpRight size={15} className="mr-0.5" />
          </span>
        )}
        {trendType === 'negative' && (
          <span className="flex items-center text-rose-600 font-bold">
            <ArrowDownRight size={15} className="mr-0.5" />
          </span>
        )}
        <span className="text-[#5A6380] font-medium">{changeLabel}</span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recent, setRecent] = useState<DashboardRecent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quick Reject Modal State
  const [rejectingMemberId, setRejectingMemberId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.get('/admin/dashboard/stats');
      setMetrics(data.metrics);
      setRecent(data.recent);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleQuickApprove = async (memberId: number, name?: string) => {
    if (!window.confirm(`Approve membership for ${name || 'this member'}?`)) return;
    try {
      const token = localStorage.getItem('admin_jwt');
      const apiURL = getApiUrl();
      await axios.post(
        `${apiURL}/admin/member/${memberId}/approve`,
        { confirm: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionSuccess(`Member approved successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);
      void fetchStats(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to approve member');
    }
  };

  const handleQuickRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingMemberId) return;
    if (rejectionReason.trim().length < 5) {
      alert('Please provide a descriptive rejection reason (min 5 characters).');
      return;
    }

    setRejectLoading(true);
    try {
      const token = localStorage.getItem('admin_jwt');
      const apiURL = getApiUrl();
      await axios.post(
        `${apiURL}/admin/member/${rejectingMemberId}/reject`,
        { reason: rejectionReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRejectingMemberId(null);
      setRejectionReason('');
      setActionSuccess(`Application rejected and explanatory notification dispatched.`);
      setTimeout(() => setActionSuccess(null), 3000);
      void fetchStats(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reject applicant');
    } finally {
      setRejectLoading(false);
    }
  };

  const memberChange = metrics?.members_change_pct ?? 0;
  const isPositiveGrowth = memberChange > 0;
  const isNegativeGrowth = memberChange < 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Real-time operational metrics across members roster, club matches, and broadcast updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isLoading || isRefreshing}
              onClick={() => void fetchStats(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1A2744] hover:bg-[#111B30] text-white text-xs font-bold transition-all shadow flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing…' : 'Refresh Metrics'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle size={16} />
            {actionSuccess}
          </div>
        )}

        {isLoading && !metrics ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#1A2744]">
            <Loader2 className="animate-spin text-[#C41230] mb-3" size={32} />
            <span className="font-bold text-sm">Loading live executive dashboard…</span>
          </div>
        ) : (
          <>
            {/* Even 4x2 KPI Cards Grid (8 Cards) with Semantic Contextual Styling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* 1. Total Members */}
              <MetricCard
                title="Total Members"
                value={metrics?.total_members ?? 0}
                changeLabel={`${memberChange >= 0 ? '+' : ''}${memberChange}% this month`}
                trendType={isPositiveGrowth ? 'positive' : isNegativeGrowth ? 'negative' : 'neutral'}
                accentColor={{
                  bg: 'bg-indigo-50',
                  text: 'text-indigo-600',
                  border: 'border-indigo-100',
                  badgeBg: 'bg-indigo-500/10'
                }}
                icon={<Users size={22} />}
                to="/members?tab=approved"
              />

              {/* 2. Approved Members */}
              <MetricCard
                title="Approved Members"
                value={metrics?.approved_members ?? 0}
                changeLabel="Active directory access"
                trendType="neutral"
                accentColor={{
                  bg: 'bg-emerald-50',
                  text: 'text-emerald-600',
                  border: 'border-emerald-100',
                  badgeBg: 'bg-emerald-500/10'
                }}
                icon={<UserCheck size={22} />}
                to="/members?tab=approved"
              />

              {/* 3. Pending Approvals */}
              <MetricCard
                title="Pending Approvals"
                value={metrics?.pending_members ?? 0}
                changeLabel={`${metrics?.pending_members ?? 0} applicants waiting`}
                trendType="neutral"
                accentColor={{
                  bg: 'bg-amber-50',
                  text: 'text-amber-600',
                  border: 'border-amber-100',
                  badgeBg: 'bg-amber-500/10'
                }}
                icon={<UserPlus size={22} />}
                to="/members?tab=pending"
              />

              {/* 4. Inactive / Rejected */}
              <MetricCard
                title="Rejected / Inactive"
                value={(metrics?.rejected_members ?? 0) + (metrics?.inactive_members ? Math.max(0, metrics.inactive_members - (metrics.rejected_members ?? 0)) : 0)}
                changeLabel={`${metrics?.rejected_members ?? 0} applications rejected`}
                trendType="neutral"
                accentColor={{
                  bg: 'bg-rose-50',
                  text: 'text-rose-600',
                  border: 'border-rose-100',
                  badgeBg: 'bg-rose-500/10'
                }}
                icon={<UserX size={22} />}
                to="/members?tab=rejected"
              />

              {/* 5. Upcoming Events */}
              <MetricCard
                title="Upcoming Events"
                value={metrics?.upcoming_events ?? 0}
                changeLabel={`${metrics?.published_events ?? 0} published total`}
                trendType="neutral"
                accentColor={{
                  bg: 'bg-blue-50',
                  text: 'text-blue-600',
                  border: 'border-blue-100',
                  badgeBg: 'bg-blue-500/10'
                }}
                icon={<Calendar size={22} />}
                to="/events"
              />

              {/* 6. Active Tournaments (Accurate subtext!) */}
              <MetricCard
                title="Active Tournaments"
                value={metrics?.active_tournaments ?? 0}
                changeLabel={`${metrics?.active_tournaments ?? 0} matches scheduled`}
                trendType="neutral"
                accentColor={{
                  bg: 'bg-amber-50',
                  text: 'text-amber-600',
                  border: 'border-amber-100',
                  badgeBg: 'bg-amber-500/10'
                }}
                icon={<Trophy size={22} />}
                to="/events"
              />

              {/* 7. Published Announcements */}
              <MetricCard
                title="Announcements"
                value={metrics?.published_announcements ?? 0}
                changeLabel={`${metrics?.announcements_this_month ?? 0} this month · ${metrics?.draft_announcements ?? 0} drafts`}
                trendType="neutral"
                accentColor={{
                  bg: 'bg-purple-50',
                  text: 'text-purple-600',
                  border: 'border-purple-100',
                  badgeBg: 'bg-purple-500/10'
                }}
                icon={<Megaphone size={22} />}
                to="/announcements"
              />

              {/* 8. Unread Notifications */}
              <MetricCard
                title="Unread Alerts"
                value={metrics?.unread_notifications ?? 0}
                changeLabel="Admin action inbox"
                trendType="neutral"
                accentColor={{
                  bg: 'bg-red-50',
                  text: 'text-red-600',
                  border: 'border-red-100',
                  badgeBg: 'bg-red-500/10'
                }}
                icon={<Bell size={22} />}
                to="/notifications"
              />
            </div>

            {/* Direct Interactive Widgets Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Widget 1: Direct Actionable Pending Members */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-[#1A2744] font-extrabold">
                      <UserPlus size={18} className="text-amber-500" />
                      <h2>Pending Approvals</h2>
                    </div>
                    <Link
                      to="/members?tab=pending"
                      className="text-xs font-bold text-[#C41230] hover:underline flex items-center gap-1"
                    >
                      View All <ChevronRight size={12} />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {(recent?.pending_members?.length ?? 0) === 0 ? (
                      <div className="py-8 text-center bg-[#F0F2F7] rounded-xl border border-dashed border-slate-300">
                        <CheckCircle size={24} className="mx-auto text-emerald-500 mb-1" />
                        <p className="text-xs text-[#3A4260] font-bold">All caught up!</p>
                        <p className="text-[11px] text-slate-500">No pending member approval requests.</p>
                      </div>
                    ) : (
                      recent!.pending_members.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#0E1525] truncate">
                                {m.full_name || 'Incomplete Profile'}
                              </p>
                              <p className="text-[11px] text-[#5A6380] truncate">{m.email}</p>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">{formatDate(m.created_at)}</p>
                            </div>

                            {/* Direct Inline Approve & Reject CTA */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleQuickApprove(m.id, m.full_name)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                                title="Quick Approve"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => setRejectingMemberId(m.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                                title="Reject Applicant"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    to="/members?tab=pending"
                    className="w-full block text-center py-2 bg-[#F0F2F7] hover:bg-slate-200 text-[#1A2744] text-xs font-bold rounded-xl transition-colors"
                  >
                    Open Member Review Queue
                  </Link>
                </div>
              </div>

              {/* Widget 2: Upcoming Events with Empty-State CTA */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-[#1A2744] font-extrabold">
                      <Calendar size={18} className="text-[#C41230]" />
                      <h2>Upcoming Schedule</h2>
                    </div>
                    <Link
                      to="/events"
                      className="text-xs font-bold text-[#C41230] hover:underline flex items-center gap-1"
                    >
                      View All <ChevronRight size={12} />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {(recent?.upcoming_events?.length ?? 0) === 0 ? (
                      <div className="py-8 px-4 text-center bg-[#F0F2F7] rounded-xl border border-dashed border-slate-300">
                        <Calendar size={28} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-xs font-bold text-[#0E1525]">No upcoming events scheduled</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                          Publish a match or tournament to show on member home screens.
                        </p>
                        <Link
                          to="/events"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold text-xs rounded-lg transition-colors shadow"
                        >
                          <Plus size={13} />
                          <span>Create Event</span>
                        </Link>
                      </div>
                    ) : (
                      recent!.upcoming_events.map((e) => (
                        <Link
                          key={e.id}
                          to="/events"
                          className="block rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 hover:border-[#1A2744]/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-bold text-[#0E1525] truncate">{e.event_name}</p>
                            {e.is_featured && (
                              <span className="px-1.5 py-0.5 text-[8px] font-black bg-amber-100 text-amber-800 rounded">
                                FEATURED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#5A6380] mt-0.5">
                            {e.event_type} · {formatDate(e.event_date)} {e.start_time ? `· ${e.start_time}` : ''}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 truncate">{e.venue_name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    to="/events"
                    className="w-full block text-center py-2 bg-[#F0F2F7] hover:bg-slate-200 text-[#1A2744] text-xs font-bold rounded-xl transition-colors"
                  >
                    Manage Club Events
                  </Link>
                </div>
              </div>

              {/* Widget 3: System Recent Alerts Feed */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-[#1A2744] font-extrabold">
                      <Bell size={18} className="text-[#C41230]" />
                      <h2>Recent Alerts Feed</h2>
                    </div>
                    <Link
                      to="/notifications"
                      className="text-xs font-bold text-[#C41230] hover:underline flex items-center gap-1"
                    >
                      View All <ChevronRight size={12} />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {(recent?.notifications?.length ?? 0) === 0 ? (
                      <div className="py-8 text-center bg-[#F0F2F7] rounded-xl border border-dashed border-slate-300">
                        <Bell size={24} className="mx-auto text-slate-400 mb-1" />
                        <p className="text-xs text-[#3A4260] font-bold">No system notifications</p>
                      </div>
                    ) : (
                      recent!.notifications.map((n) => (
                        <Link
                          key={n.id}
                          to="/notifications"
                          className="block rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 hover:border-[#1A2744]/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-[#0E1525] truncate">{n.title}</p>
                            {!n.read && (
                              <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-black uppercase bg-[#C41230] text-white rounded">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#5A6380] mt-0.5 line-clamp-1">
                            {n.message || n.user?.full_name || n.user?.email}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">{formatDate(n.created_at)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    to="/notifications"
                    className="w-full block text-center py-2 bg-[#F0F2F7] hover:bg-slate-200 text-[#1A2744] text-xs font-bold rounded-xl transition-colors"
                  >
                    Open System Notification Center
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {rejectingMemberId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#0E1525] border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle size={20} />
                <h3 className="font-extrabold text-base">Reject Member Application</h3>
              </div>
              <button
                onClick={() => {
                  setRejectingMemberId(null);
                  setRejectionReason('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5A6380] mb-4">
              Please enter the specific reason for rejecting this profile registration. An automated email and push notification will be dispatched to the applicant.
            </p>

            <form onSubmit={handleQuickRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                  Reason for Rejection (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={5}
                  placeholder="e.g. Incomplete ID verification proof attached, please upload clear visiting card..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingMemberId(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectLoading || rejectionReason.trim().length < 5}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow"
                >
                  {rejectLoading ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
