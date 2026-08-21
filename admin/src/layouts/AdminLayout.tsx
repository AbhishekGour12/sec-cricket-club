import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Calendar, 
  Megaphone, 
  Menu, 
  X, 
  LogOut, 
  Bell,
  Search,
  LayoutDashboard,
  CircleHelp,
} from 'lucide-react';
import logo from '../assets/logo.png';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[#C41230] to-[#9E0E27] text-white shadow-md shadow-[#C41230]/25'
          : 'text-slate-300 hover:bg-[#243260]/60 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export interface AdminNotification {
  id: number;
  type: 'new_registration' | 'approval_request';
  title: string;
  message: string;
  read: boolean;
  user_id: number;
  created_at: string;
  user?: {
    id: number;
    full_name?: string;
    email: string;
    profile_image?: string;
  };
}

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const token = localStorage.getItem('admin_jwt');
  const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${apiURL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      // Sanitized error logging
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await axios.post(`${apiURL}/admin/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      // Sanitized error logging
    }
  };


  const userStr = localStorage.getItem('admin_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('admin_jwt');
    localStorage.removeItem('admin_user');
    window.dispatchEvent(new Event('admin-auth-changed'));
    window.location.href = '/login';
  };

  const fullName = user?.full_name || 'Admin User';
  const avatarUrl = user?.profile_image;
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AD';

  const currentPath = location.pathname;

  const downloadTemplate = () => {
    const headers = [
      'Membership Number',
      'Full Name',
      'Email',
      'Mobile Number',
      'Designation',
      'Business Name',
      'Business Category',
      'City',
      'State',
      'Country'
    ];
    const example = [
      'SEC0001',
      'Rahul Sharma',
      'rahul@example.com',
      '9876543210',
      'Director',
      'Sharma Steel',
      'Manufacturing',
      'Ludhiana',
      'Punjab',
      'India'
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), example.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "member_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={20} />, label: 'Members', path: '/members' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications' },
    { icon: <Calendar size={20} />, label: 'Events', path: '/events' },
    { icon: <Megaphone size={20} />, label: 'Announcements', path: '/announcements' },
    { icon: <CircleHelp size={20} />, label: 'Guidance & Help', path: '/guidance' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F7] text-[#0E1525] flex font-sans antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#111B30]/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1A2744] text-white border-r border-[#243260] flex flex-col justify-between transform lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#243260]">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#243260] shadow-lg">
                <img src={logo} alt="SEC Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                SEC Cricket Club
              </span>
            </div>
            <button 
              className="lg:hidden p-1 text-slate-300 hover:text-white rounded-lg hover:bg-[#243260]"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item, idx) => {
              const active = item.path === '/' 
                ? currentPath === '/' 
                : currentPath.startsWith(item.path);

              if (item.label === 'Members') {
                return (
                  <div key={idx} className="space-y-1">
                    <SidebarItem 
                      icon={item.icon} 
                      label={item.label} 
                      active={active} 
                      onClick={() => {
                        navigate('/members?tab=approved');
                        setIsSidebarOpen(false);
                      }}
                    />
                    {/* Nested Submenu */}
                    <div className="pl-9 space-y-1 border-l border-[#243260] ml-4 mt-1.5">
                      <button 
                        onClick={() => { navigate('/members?tab=approved'); setIsSidebarOpen(false); }}
                        className={`w-full text-left py-1 text-xs font-semibold block transition-colors ${
                          currentPath.startsWith('/members') && (location.search.includes('approved') || (!location.search.includes('pending') && !location.search.includes('add') && !location.search.includes('import') && !location.search.includes('rejected')))
                            ? 'text-[#F9D0D7] font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        • All Members
                      </button>
                      <button 
                        onClick={() => { navigate('/members?tab=pending'); setIsSidebarOpen(false); }}
                        className={`w-full text-left py-1 text-xs font-semibold block transition-colors ${
                          location.search.includes('pending') ? 'text-[#F9D0D7] font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        • Pending Members
                      </button>
                      <button 
                        onClick={() => { navigate('/members?tab=add'); setIsSidebarOpen(false); }}
                        className={`w-full text-left py-1 text-xs font-semibold block transition-colors ${
                          location.search.includes('add') ? 'text-[#F9D0D7] font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        • Add Member
                      </button>
                      <button 
                        onClick={() => { navigate('/members?tab=import'); setIsSidebarOpen(false); }}
                        className={`w-full text-left py-1 text-xs font-semibold block transition-colors ${
                          location.search.includes('import') ? 'text-[#F9D0D7] font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        • Import Members
                      </button>
                      <button 
                        onClick={downloadTemplate}
                        className="w-full text-left py-1 text-xs font-semibold block text-slate-300 hover:text-white transition-colors"
                      >
                        • Download Template
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <SidebarItem 
                  key={idx} 
                  icon={item.icon} 
                  label={item.label} 
                  active={active} 
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                />
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-[#243260]">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#243260]/50 transition-colors">
            <div className="flex items-center space-x-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-600" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#C41230] border border-white/20 flex items-center justify-center text-white font-semibold text-xs">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{fullName}</p>
                <p className="text-[10px] text-slate-300 font-medium">Administrator</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-300 hover:text-[#C41230] p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 border-b border-[#243260] bg-[#1A2744] text-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <button 
              className="lg:hidden p-2 text-slate-200 hover:text-white rounded-lg hover:bg-[#243260] transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            
            {/* Search Bar - Hidden on small mobile */}
            <div className="hidden sm:flex items-center space-x-2 bg-[#111B30] border border-[#243260] rounded-xl px-3 py-1.5 w-64 focus-within:border-[#C41230] transition-colors">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-200 hover:text-white rounded-xl bg-[#243260] hover:bg-[#111B30] transition-colors relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[18px] text-[8px] font-black bg-[#C41230] text-white rounded-full border border-[#1A2744] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-[#1A2744] border border-[#243260] rounded-2xl shadow-2xl p-2 z-50 space-y-2 max-h-[360px] overflow-y-auto text-white">
                  <div className="flex justify-between items-center px-3 py-2 border-b border-[#243260]">
                    <span className="font-bold text-xs text-white">Notification Alert Log</span>
                    {unreadCount > 0 && (
                      <span className="text-[9px] text-[#F9D0D7] font-bold">{unreadCount} Unread</span>
                    )}
                  </div>
                  <div className="divide-y divide-[#243260] space-y-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-300 italic">No notifications logged.</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (!n.read) handleMarkAsRead(n.id);
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-[#243260]/60 rounded-xl flex gap-2.5 items-start ${
                            !n.read ? 'bg-[#243260] border border-[#C41230]/40' : ''
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            n.type === 'new_registration' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#C41230]/20 text-[#F9D0D7]'
                          }`}>
                            {n.type === 'new_registration' ? <Users size={14} /> : <Bell size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-white leading-normal truncate">{n.title}</p>
                            <p className="text-[10px] text-slate-200 mt-0.5 leading-normal">{n.message}</p>
                            <p className="text-[8px] text-slate-400 mt-1 font-mono">{new Date(n.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-[#243260]" />
            <div className="flex items-center space-x-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-300" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#C41230] flex items-center justify-center text-white font-bold text-xs shadow">
                  {initials}
                </div>
              )}
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
