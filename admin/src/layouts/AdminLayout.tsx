import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Megaphone, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Bell,
  Search,
  LayoutDashboard
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false }) => {
  return (
    <button
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-500/20'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: true },
    { icon: <Users size={20} />, label: 'Members' },
    { icon: <Calendar size={20} />, label: 'Events' },
    { icon: <Megaphone size={20} />, label: 'Announcements' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transform lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Trophy className="text-white" size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                SEC Cricket Club
              </span>
            </div>
            <button 
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item, idx) => (
              <SidebarItem 
                key={idx} 
                icon={item.icon} 
                label={item.label} 
                active={item.active} 
              />
            ))}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-semibold">
                JD
              </div>
              <div>
                <p className="text-xs font-semibold text-white">John Doe</p>
                <p className="text-[10px] text-slate-500 font-medium">Club Administrator</p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/20 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-4">
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            
            {/* Search Bar - Hidden on small mobile */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-1.5 w-64 focus-within:border-sky-500/50 transition-colors">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-sky-500 rounded-full border-2 border-slate-900" />
            </button>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
