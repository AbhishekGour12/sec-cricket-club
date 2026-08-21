import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  Calendar,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Bell,
  Loader2,
  AlertCircle,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminApi } from '../lib/api';

interface DashboardMetrics {
  total_members: number;
  approved_members: number;
  pending_members: number;
  rejected_members: number;
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
  changePositive?: boolean;
  icon: React.ReactNode;
  to?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changeLabel,
  changePositive = true,
  icon,
  to,
}) => {
  const content = (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:border-[#1A2744]/30 hover:shadow-md h-full">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-[#3A4260]">{title}</p>
          <h3 className="text-3xl font-extrabold text-[#0E1525] mt-2 tracking-tight">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#D0D8EE] flex items-center justify-center text-[#1A2744]">
          {icon}
        </div>
      </div>
      <div
        className={`flex items-center space-x-1 mt-4 text-xs font-semibold ${
          changePositive ? 'text-[#C41230]' : 'text-[#3A4260]'
        }`}
      >
        {changePositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{changeLabel}</span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
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
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.get('/admin/dashboard/stats');
      setMetrics(data.metrics);
      setRecent(data.recent);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const memberChange = metrics?.members_change_pct ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Live club metrics from members, events, and announcements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchStats()}
            className="px-4 py-2 rounded-xl bg-[#1A2744] text-white text-sm font-bold hover:bg-[#111B30]"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {isLoading && !metrics ? (
          <div className="flex items-center justify-center py-20 text-[#1A2744]">
            <Loader2 className="animate-spin mr-2" size={22} />
            <span className="font-semibold">Loading live dashboard…</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Members"
                value={metrics?.total_members ?? 0}
                changeLabel={`${memberChange >= 0 ? '+' : ''}${memberChange}% this month`}
                changePositive={memberChange >= 0}
                icon={<Users size={22} />}
                to="/members"
              />
              <MetricCard
                title="Upcoming Events"
                value={metrics?.upcoming_events ?? 0}
                changeLabel={`${metrics?.published_events ?? 0} published total`}
                icon={<Calendar size={22} />}
                to="/events"
              />
              <MetricCard
                title="Published Announcements"
                value={metrics?.published_announcements ?? 0}
                changeLabel={`${metrics?.announcements_this_month ?? 0} this month · ${metrics?.draft_announcements ?? 0} drafts`}
                icon={<Megaphone size={22} />}
                to="/announcements"
              />
              <MetricCard
                title="Active Tournaments"
                value={metrics?.active_tournaments ?? 0}
                changeLabel={`${metrics?.pending_members ?? 0} pending approvals`}
                icon={<Trophy size={22} />}
                to="/events?type=Tournament"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Approved Members"
                value={metrics?.approved_members ?? 0}
                changeLabel="Active club roster"
                icon={<UserCheck size={22} />}
                to="/members?tab=approved"
              />
              <MetricCard
                title="Pending Approvals"
                value={metrics?.pending_members ?? 0}
                changeLabel={`${metrics?.rejected_members ?? 0} rejected`}
                changePositive={false}
                icon={<UserPlus size={22} />}
                to="/members?tab=pending"
              />
              <MetricCard
                title="Unread Notifications"
                value={metrics?.unread_notifications ?? 0}
                changeLabel="Admin inbox"
                changePositive={false}
                icon={<Bell size={22} />}
                to="/notifications"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-1">
                <div className="flex items-center space-x-2 text-[#1A2744] font-extrabold mb-4">
                  <Clock size={18} className="text-[#C41230]" />
                  <h2>Pending Members</h2>
                </div>
                <div className="space-y-3">
                  {(recent?.pending_members?.length ?? 0) === 0 ? (
                    <p className="text-sm text-[#7A85A0] font-medium">No pending approvals.</p>
                  ) : (
                    recent!.pending_members.map((m) => (
                      <Link
                        key={m.id}
                        to="/members?tab=pending"
                        className="block rounded-xl border border-slate-200 bg-[#F0F2F7] px-3 py-3 hover:border-[#1A2744]/30"
                      >
                        <p className="text-sm font-bold text-[#0E1525]">
                          {m.full_name || 'Member'}
                        </p>
                        <p className="text-xs text-[#3A4260] mt-0.5">{m.email}</p>
                        <p className="text-[11px] text-[#7A85A0] mt-1">{formatDate(m.created_at)}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-1">
                <div className="flex items-center space-x-2 text-[#1A2744] font-extrabold mb-4">
                  <Calendar size={18} className="text-[#C41230]" />
                  <h2>Upcoming Events</h2>
                </div>
                <div className="space-y-3">
                  {(recent?.upcoming_events?.length ?? 0) === 0 ? (
                    <p className="text-sm text-[#7A85A0] font-medium">No upcoming events.</p>
                  ) : (
                    recent!.upcoming_events.map((e) => (
                      <Link
                        key={e.id}
                        to="/events"
                        className="block rounded-xl border border-slate-200 bg-[#F0F2F7] px-3 py-3 hover:border-[#1A2744]/30"
                      >
                        <p className="text-sm font-bold text-[#0E1525]">{e.event_name}</p>
                        <p className="text-xs text-[#3A4260] mt-0.5">
                          {e.event_type} · {formatDate(e.event_date)} · {e.start_time}
                        </p>
                        <p className="text-[11px] text-[#7A85A0] mt-1">{e.venue_name}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-1">
                <div className="flex items-center space-x-2 text-[#1A2744] font-extrabold mb-4">
                  <Bell size={18} className="text-[#C41230]" />
                  <h2>Recent Alerts</h2>
                </div>
                <div className="space-y-3">
                  {(recent?.notifications?.length ?? 0) === 0 ? (
                    <p className="text-sm text-[#7A85A0] font-medium">No notifications yet.</p>
                  ) : (
                    recent!.notifications.map((n) => (
                      <Link
                        key={n.id}
                        to="/notifications"
                        className="block rounded-xl border border-slate-200 bg-[#F0F2F7] px-3 py-3 hover:border-[#1A2744]/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-[#0E1525]">{n.title}</p>
                          {!n.read && (
                            <span className="shrink-0 text-[10px] font-bold uppercase text-[#C41230]">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#3A4260] mt-0.5 line-clamp-2">
                          {n.message || n.user?.full_name || n.user?.email}
                        </p>
                        <p className="text-[11px] text-[#7A85A0] mt-1">{formatDate(n.created_at)}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
