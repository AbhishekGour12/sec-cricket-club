import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Members } from './pages/Members';
import { Notifications } from './pages/Notifications';
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
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:border-[#1A2744]/30 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-[#3A4260]">{title}</p>
          <h3 className="text-3xl font-extrabold text-[#0E1525] mt-2 tracking-tight">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#D0D8EE] flex items-center justify-center text-[#1A2744]">
          {icon}
        </div>
      </div>
      <div className="flex items-center space-x-1 mt-4 text-xs font-semibold text-[#C41230]">
        <ArrowUpRight size={14} />
        <span>{change}</span>
        <span className="text-slate-500 font-medium ml-1">from last month</span>
      </div>
    </div>
  );
};

// Dashboard Content
const Dashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-[#3A4260] mt-1 font-medium">Monitor club metrics, announcements, and match statuses.</p>
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-[#1A2744] font-extrabold mb-4">
            <Activity size={18} className="text-[#C41230]" />
            <h2>System Connection Health</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F0F2F7] p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#3A4260] font-bold">POSTGRESQL (SUPABASE)</p>
                <p className="text-sm text-[#0E1525] font-semibold mt-1">aws-0-ap-southeast-1.pooler.supabase.com</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Connected
              </span>
            </div>
            <div className="bg-[#F0F2F7] p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#3A4260] font-bold">EXPRESS API SERVICE</p>
                <p className="text-sm text-[#0E1525] font-semibold mt-1">http://localhost:5000/api</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_jwt'));

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            token ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />
        <Route 
          path="/members" 
          element={
            token ? <Members /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/notifications" 
          element={
            token ? <Notifications /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={
            token ? <Dashboard /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="*" 
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
};

export default App;
