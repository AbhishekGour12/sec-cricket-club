import React from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import {
  Trophy,
  Users,
  Calendar,
  Megaphone,
  ArrowUpRight,
  Activity
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon }) => {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 transition-all duration-200 hover:border-slate-700/80 hover:shadow-lg hover:shadow-sky-500/5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-sky-400">
          {icon}
        </div>
      </div>
      <div className="flex items-center space-x-1 mt-4 text-xs font-semibold text-emerald-400">
        <ArrowUpRight size={14} />
        <span>{change}</span>
        <span className="text-slate-500 font-medium ml-1">from last month</span>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor club metrics, announcements, and match statuses.</p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Members"
            value="142"
            change="+12%"
            icon={<Users size={22} />}
          />
          <MetricCard
            title="Upcoming Events"
            value="8"
            change="+25%"
            icon={<Calendar size={22} />}
          />
          <MetricCard
            title="Recent Announcements"
            value="3"
            change="0%"
            icon={<Megaphone size={22} />}
          />
          <MetricCard
            title="Active Tournaments"
            value="2"
            change="+100%"
            icon={<Trophy size={22} />}
          />
        </div>

        {/* Database & Server Status Panel */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center space-x-2 text-sky-400 font-bold mb-4">
            <Activity size={18} />
            <h2>System Connection Health</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">POSTGRESQL (SUPABASE)</p>
                <p className="text-sm text-white font-medium mt-1">aws-0-ap-southeast-1.pooler.supabase.com</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">EXPRESS API SERVICE</p>
                <p className="text-sm text-white font-medium mt-1">http://localhost:5000/api</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default App;
