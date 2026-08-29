import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  CheckCheck,
  UserCheck,
  UserPlus,
  KeyRound,
  UserCog,
  Check,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import logo from '../assets/logo.png';
import { getApiUrl } from '../lib/api';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number | null;
  badgeColor?: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, badge, badgeColor = 'bg-[#C41230]', active = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[#C41230] to-[#9E0E27] text-white shadow-md shadow-[#C41230]/25'
          : 'text-slate-300 hover:bg-[#243260]/60 hover:text-white'
      }`}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
      {badge !== undefined && badge !== null && badge > 0 && (
        <span className={`px-2 py-0.5 text-[10px] font-black ${badgeColor} text-white rounded-full`}>
          {badge}
        </span>
      )}
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

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Profile Flyout State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Profile Edit & Password Change Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Global Search / Command Palette
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const token = localStorage.getItem('admin_jwt');
  const apiURL = getApiUrl();

  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${apiURL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch {
      // Ignore background notification failure
    }
  };

  const fetchPendingCount = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${apiURL}/admin/pending-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data.members || [];
      setPendingCount(list.length);
    } catch {
      // Ignore background pending fetch failure
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPendingCount();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingCount();
    }, 20000);
    return () => clearInterval(interval);
  }, [token]);

  // Global keyboard shortcut for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchPaletteOpen(false);
        setIsProfileMenuOpen(false);
        setIsNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
    try {
      await axios.post(`${apiURL}/admin/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // Fallback
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_jwt');
    localStorage.removeItem('admin_user');
    window.dispatchEvent(new Event('admin-auth-changed'));
    window.location.href = '/login';
  };

  const openEditProfile = () => {
    setEditName(user?.full_name || '');
    setEditImage(user?.profile_image || '');
    setModalError(null);
    setModalSuccess(null);
    setIsProfileMenuOpen(false);
    setIsEditProfileOpen(true);
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setModalError(null);
    setModalSuccess(null);
    setIsProfileMenuOpen(false);
    setIsChangePasswordOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const response = await axios.put(
        `${apiURL}/admin/auth/profile`,
        { full_name: editName, profile_image: editImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = response.data.user || { ...user, full_name: editName, profile_image: editImage };
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setModalSuccess('Profile updated successfully!');
      setTimeout(() => setIsEditProfileOpen(false), 1200);
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setModalError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setModalError('New password must be at least 6 characters.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      await axios.put(
        `${apiURL}/admin/auth/change-password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModalSuccess('Password changed successfully!');
      setTimeout(() => setIsChangePasswordOpen(false), 1200);
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Failed to change password. Verify your current password.');
    } finally {
      setModalLoading(false);
    }
  };

  const fullName = user?.full_name || 'Admin User';
  const email = user?.email || 'admin@secclub.com';
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
      'Manufacturing & Production',
      'Ludhiana',
      'Punjab',
      'India'
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), example.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sec_member_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={20} />, label: 'Members', path: '/members', badge: pendingCount > 0 ? pendingCount : null },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications', badge: unreadCount > 0 ? unreadCount : null },
    { icon: <Calendar size={20} />, label: 'Events', path: '/events' },
    { icon: <Megaphone size={20} />, label: 'Announcements', path: '/announcements' },
    { icon: <CircleHelp size={20} />, label: 'Guidance & Help', path: '/guidance' },
  ];

  // Global Quick Commands / Navigation Options
  const commandOptions = [
    { title: 'Dashboard Overview', desc: 'View live club KPIs & metrics', path: '/', icon: <LayoutDashboard size={18} /> },
    { title: 'Approved Members', desc: 'Active member directory and profiles', path: '/members?tab=approved', icon: <UserCheck size={18} /> },
    { title: 'Pending Applications', desc: `Review member approvals (${pendingCount} pending)`, path: '/members?tab=pending', icon: <UserPlus size={18} /> },
    { title: 'Add Member Form', desc: 'Register a new member profile offline', path: '/members?tab=add', icon: <Users size={18} /> },
    { title: 'Import Members CSV', desc: 'Bulk import member roster from spreadsheet', path: '/members?tab=import', icon: <Users size={18} /> },
    { title: 'Events & Matches', desc: 'Create and publish club tournaments', path: '/events', icon: <Calendar size={18} /> },
    { title: 'Announcements', desc: 'Broadcast notices and club updates', path: '/announcements', icon: <Megaphone size={18} /> },
    { title: 'System Notifications', desc: 'View complete notification history', path: '/notifications', icon: <Bell size={18} /> },
    { title: 'Help & Operational Guide', desc: 'Media specs, CSV format & guidelines', path: '/guidance', icon: <CircleHelp size={18} /> },
  ];

  const filteredCommands = commandOptions.filter(c => 
    c.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

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
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#243260] shadow-lg shrink-0">
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
                      badge={item.badge}
                      onClick={() => {
                        navigate('/members?tab=approved');
                        setIsSidebarOpen(false);
                      }}
                    />
                    {/* Clean Nested Submenu without raw bullets */}
                    <div className="pl-4 ml-5 space-y-1 border-l-2 border-[#243260] mt-1.5 py-1">
                      <button 
                        onClick={() => { navigate('/members?tab=approved'); setIsSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors ${
                          currentPath.startsWith('/members') && (location.search.includes('approved') || (!location.search.includes('pending') && !location.search.includes('add') && !location.search.includes('import') && !location.search.includes('rejected')))
                            ? 'bg-[#243260] text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-[#243260]/40'
                        }`}
                      >
                        <span>All Members</span>
                      </button>
                      <button 
                        onClick={() => { navigate('/members?tab=pending'); setIsSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors ${
                          location.search.includes('pending') ? 'bg-[#243260] text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-[#243260]/40'
                        }`}
                      >
                        <span>Pending Members</span>
                        {pendingCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-[#111B30] rounded-full">
                            {pendingCount}
                          </span>
                        )}
                      </button>
                      <button 
                        onClick={() => { navigate('/members?tab=rejected'); setIsSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg block transition-colors ${
                          location.search.includes('rejected') ? 'bg-[#243260] text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-[#243260]/40'
                        }`}
                      >
                        <span>Rejected Roster</span>
                      </button>
                      <button 
                        onClick={() => { navigate('/members?tab=add'); setIsSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg block transition-colors ${
                          location.search.includes('add') ? 'bg-[#243260] text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-[#243260]/40'
                        }`}
                      >
                        <span>Add Member</span>
                      </button>
                      <button 
                        onClick={() => { navigate('/members?tab=import'); setIsSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg block transition-colors ${
                          location.search.includes('import') ? 'bg-[#243260] text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-[#243260]/40'
                        }`}
                      >
                        <span>Import Members</span>
                      </button>
                      <button 
                        onClick={downloadTemplate}
                        className="w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-[#243260]/40 transition-colors"
                      >
                        <span>Download Template</span>
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
                  badge={item.badge}
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
        <div className="p-4 border-t border-[#243260] relative" ref={profileMenuRef}>
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#243260]/70 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-600 object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#C41230] border border-white/20 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{email}</p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#243260] text-slate-300 rounded border border-white/10 shrink-0">
              Admin
            </span>
          </div>

          {/* Profile Anchored Flyout Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-16 left-4 right-4 bg-[#1A2744] border border-[#243260] rounded-2xl shadow-2xl p-2 z-50 text-white space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="p-3 border-b border-[#243260] mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white truncate">{fullName}</p>
                  <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-[#C41230]/20 text-[#F9D0D7] rounded border border-[#C41230]/40">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{email}</p>
              </div>

              <button
                onClick={openEditProfile}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-[#243260] rounded-xl transition-colors text-left"
              >
                <UserCog size={15} className="text-slate-400" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={openChangePassword}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-[#243260] rounded-xl transition-colors text-left"
              >
                <KeyRound size={15} className="text-slate-400" />
                <span>Change Password</span>
              </button>

              <div className="pt-1 border-t border-[#243260]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
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
            
            {/* High Contrast Global Search with Shortcut Trigger */}
            <div 
              onClick={() => setIsSearchPaletteOpen(true)}
              className="hidden sm:flex items-center space-x-2 bg-[#111B30] border border-[#3A4A75] hover:border-[#C41230] rounded-xl px-3 py-1.5 w-72 cursor-pointer transition-colors shadow-inner"
            >
              <Search size={16} className="text-slate-300 shrink-0" />
              <span className="text-xs text-slate-300 select-none flex-1">
                Search actions, members...
              </span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#1A2744] border border-[#243260] text-slate-300 rounded shadow">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            {/* Topbar Notification Center */}
            <div className="relative" ref={notifMenuRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-200 hover:text-white rounded-xl bg-[#243260] hover:bg-[#111B30] transition-colors relative"
                title="System Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[18px] text-[8px] font-black bg-[#C41230] text-white rounded-full border border-[#1A2744] flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-88 sm:w-96 bg-[#1A2744] border border-[#243260] rounded-2xl shadow-2xl p-3 z-50 space-y-2 max-h-[440px] overflow-y-auto text-white animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center px-2 py-1 border-b border-[#243260] pb-2">
                    <div>
                      <span className="font-bold text-xs text-white">System Alerts Feed</span>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-[#C41230] text-white rounded-full">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-[#111B30] rounded-lg p-0.5 border border-[#243260]">
                        <button
                          onClick={() => setNotifFilter('all')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${notifFilter === 'all' ? 'bg-[#C41230] text-white' : 'text-slate-400'}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setNotifFilter('unread')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${notifFilter === 'unread' ? 'bg-[#C41230] text-white' : 'text-slate-400'}`}
                        >
                          Unread
                        </button>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="p-1 hover:bg-[#243260] text-slate-300 hover:text-white rounded text-xs transition-colors"
                          title="Mark all as read"
                        >
                          <CheckCheck size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-[#243260] space-y-1">
                    {notifications.filter(n => notifFilter === 'all' || !n.read).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 italic">
                        No {notifFilter === 'unread' ? 'unread ' : ''}notifications at this moment.
                      </div>
                    ) : (
                      notifications
                        .filter(n => notifFilter === 'all' || !n.read)
                        .slice(0, 8)
                        .map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              if (!n.read) handleMarkAsRead(n.id);
                              if (n.type === 'new_registration' || n.type === 'approval_request') {
                                navigate('/members?tab=pending');
                                setIsNotifOpen(false);
                              }
                            }}
                            className={`p-3 text-left transition-colors cursor-pointer hover:bg-[#243260]/80 rounded-xl flex gap-2.5 items-start ${
                              !n.read ? 'bg-[#243260] border-l-4 border-l-[#C41230]' : 'border-l-4 border-l-transparent'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              n.type === 'new_registration' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#C41230]/20 text-[#F9D0D7]'
                            }`}>
                              {n.type === 'new_registration' ? <Users size={14} /> : <Bell size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-[11px] font-bold text-white leading-normal truncate">{n.title}</p>
                                {!n.read && <span className="w-2 h-2 rounded-full bg-[#C41230] shrink-0" />}
                              </div>
                              <p className="text-[10px] text-slate-200 mt-0.5 leading-normal line-clamp-2">{n.message}</p>
                              <p className="text-[8px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                                <Clock size={9} />
                                {formatRelativeTime(n.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#243260] text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs font-bold text-[#F9D0D7] hover:text-white transition-colors block py-1"
                    >
                      View All Notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-[#243260]" />

            {/* Top Right Avatar Button (Opens anchored profile flyout) */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none rounded-full p-0.5 hover:ring-2 hover:ring-[#C41230] transition-all"
                title="Admin Account"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-300 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#C41230] flex items-center justify-center text-white font-bold text-xs shadow">
                    {initials}
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Command Search Palette Modal (Cmd+K / Ctrl+K) */}
      {isSearchPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1A2744] border border-[#243260] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-white">
            <div className="p-4 border-b border-[#243260] flex items-center gap-3">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search actions, pages, workflows..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm text-white placeholder-slate-400 focus:outline-none w-full"
              />
              <button 
                onClick={() => setIsSearchPaletteOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#243260]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#243260]/40">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching admin actions found for "{globalSearchQuery}".
                </div>
              ) : (
                filteredCommands.map((cmd, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setIsSearchPaletteOpen(false);
                      setGlobalSearchQuery('');
                      navigate(cmd.path);
                    }}
                    className="p-3 rounded-xl flex items-center justify-between hover:bg-[#243260] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#111B30] text-slate-300 group-hover:text-white group-hover:bg-[#C41230] transition-colors">
                        {cmd.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{cmd.title}</p>
                        <p className="text-[11px] text-slate-400">{cmd.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#111B30] border-t border-[#243260] flex items-center justify-between text-[10px] text-slate-400">
              <span>Press <kbd className="px-1 py-0.5 bg-[#1A2744] rounded border border-[#243260]">ESC</kbd> to close</span>
              <span>SEC Cricket Club Admin</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#0E1525] border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-[#1A2744]">
                <UserCog size={20} className="text-[#C41230]" />
                <h3 className="font-extrabold text-lg">Edit Administrator Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle size={14} />
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
                <Check size={14} />
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#C41230]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#C41230]"
                />
              </div>

              {editImage && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <img src={editImage} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                  <span className="text-xs text-slate-500 font-medium">Avatar Image Preview</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-bold bg-[#C41230] text-white rounded-xl hover:bg-[#9E0E27] disabled:opacity-50 transition-colors shadow"
                >
                  {modalLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#0E1525] border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-[#1A2744]">
                <KeyRound size={20} className="text-[#C41230]" />
                <h3 className="font-extrabold text-lg">Change Admin Password</h3>
              </div>
              <button 
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle size={14} />
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
                <Check size={14} />
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#C41230]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#C41230]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#C41230]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-bold bg-[#C41230] text-white rounded-xl hover:bg-[#9E0E27] disabled:opacity-50 transition-colors shadow"
                >
                  {modalLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
