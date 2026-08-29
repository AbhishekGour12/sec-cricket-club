import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Eye,
  Pin,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Send,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Link as LinkIcon,
  Code
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { getAdminMediaUrl } from '../utils/mediaUrl';
import { getApiUrl } from '../lib/api';

const ANNOUNCEMENT_TYPES = [
  'General',
  'Meeting',
  'Event',
  'Emergency',
  'Holiday',
  'Club Update',
  'Tournament',
  'Business Update',
] as const;

const ANNOUNCEMENT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
const ANNOUNCEMENT_STATUSES = ['Draft', 'Published', 'Expired'] as const;

type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];
type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];
type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];
type StatusTab = 'all' | 'drafts' | 'published' | 'expired';

interface Announcement {
  id: number;
  title: string;
  short_description: string;
  description: string;
  cover_image?: string | null;
  attachments?: string[];
  announcement_type: AnnouncementType;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  status: AnnouncementStatus;
  publish_date?: string | null;
  expiry_date?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface AnnouncementForm {
  title: string;
  announcement_type: AnnouncementType;
  priority: AnnouncementPriority;
  short_description: string;
  description: string;
  cover_image: string;
  attachments: string[];
  is_pinned: boolean;
  publish_date: string;
  expiry_date: string;
  status: AnnouncementStatus;
}

const EMPTY_FORM: AnnouncementForm = {
  title: '',
  announcement_type: 'General',
  priority: 'Medium',
  short_description: '',
  description: '',
  cover_image: '',
  attachments: [],
  is_pinned: false,
  publish_date: '',
  expiry_date: '',
  status: 'Draft',
};

const TAB_STATUS_MAP: Record<StatusTab, string> = {
  all: '',
  drafts: 'Draft',
  published: 'Published',
  expired: 'Expired',
};

const toDatetimeLocal = (value?: string | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocal = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const apiURL = getApiUrl();
  const token = localStorage.getItem('admin_jwt');
  const limit = 10;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'drafts') setActiveTab('drafts');
    else if (tabParam === 'published') setActiveTab('published');
    else if (tabParam === 'expired') setActiveTab('expired');
    else setActiveTab('all');
  }, [searchParams]);

  const getImageUrl = (path?: string | null) => getAdminMediaUrl(path, '');

  const fetchAnnouncements = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (TAB_STATUS_MAP[activeTab]) params.status = TAB_STATUS_MAP[activeTab];

      const response = await axios.get(`${apiURL}/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const fetchedAnnouncements: Announcement[] = response.data.announcements || [];
      setAnnouncements(fetchedAnnouncements);
      const pagination = response.data.pagination || {};
      setTotal(pagination.total ?? response.data.total ?? fetchedAnnouncements.length);
      setTotalPages(pagination.total_pages ?? response.data.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, [apiURL, token, page, search, typeFilter, priorityFilter, activeTab]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // 1-Click Interactive Inline Pinning Switch
  const handleTogglePin = async (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = !item.is_pinned;
    setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, is_pinned: updated } : a));

    try {
      await axios.put(
        `${apiURL}/admin/announcements/${item.id}`,
        { is_pinned: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Announcement "${item.title}" ${updated ? 'pinned to top' : 'unpinned'}.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      fetchAnnouncements();
      setError(err.response?.data?.message || 'Failed to toggle pin state.');
    }
  };

  // Duplicate Announcement Action
  const handleDuplicate = (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setForm({
      title: `${item.title} (Copy)`,
      announcement_type: item.announcement_type,
      priority: item.priority,
      short_description: item.short_description || '',
      description: item.description || '',
      cover_image: item.cover_image || '',
      attachments: item.attachments || [],
      is_pinned: false,
      publish_date: '',
      expiry_date: item.expiry_date ? toDatetimeLocal(item.expiry_date) : '',
      status: 'Draft',
    });
    setIsFormOpen(true);
  };

  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const mapToForm = (item: Announcement): AnnouncementForm => ({
    title: item.title,
    announcement_type: item.announcement_type,
    priority: item.priority,
    short_description: item.short_description,
    description: item.description,
    cover_image: item.cover_image || '',
    attachments: item.attachments || [],
    is_pinned: item.is_pinned,
    publish_date: toDatetimeLocal(item.publish_date),
    expiry_date: toDatetimeLocal(item.expiry_date),
    status: item.status,
  });

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorMode('write');
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEditForm = async (item: Announcement) => {
    setError(null);
    setSuccess(null);
    setEditorMode('write');
    try {
      const response = await axios.get(`${apiURL}/admin/announcements/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Announcement = response.data.announcement ?? item;
      setEditingId(data.id);
      setForm(mapToForm(data));
      setIsFormOpen(true);
    } catch {
      setEditingId(item.id);
      setForm(mapToForm(item));
      setIsFormOpen(true);
    }
  };

  const openPreview = async (item: Announcement) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
    try {
      const response = await axios.get(`${apiURL}/admin/announcements/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.announcement) setPreviewItem(response.data.announcement);
    } catch {
      // keep row snapshot
    }
  };

  // Markdown Toolbar Inserter
  const insertMarkdown = (syntaxBefore: string, syntaxAfter = '') => {
    const textarea = document.getElementById('announcement-desc-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.description.substring(start, end);
    const replacement = `${syntaxBefore}${selectedText || 'text'}${syntaxAfter}`;

    const newText = form.description.substring(0, start) + replacement + form.description.substring(end);
    setForm({ ...form, description: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxBefore.length, start + replacement.length - syntaxAfter.length);
    }, 50);
  };

  const uploadCoverImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${apiURL}/admin/announcements/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Cover must be an image file.');
      return;
    }
    setCoverUploading(true);
    setError(null);
    try {
      const url = await uploadCoverImage(file);
      setForm((prev) => ({ ...prev, cover_image: url }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload cover image.');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: form.title.trim(),
      announcement_type: form.announcement_type,
      priority: form.priority,
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      cover_image: form.cover_image || null,
      attachments: form.attachments,
      is_pinned: form.is_pinned,
      status: form.status,
      publish_date: fromDatetimeLocal(form.publish_date),
      expiry_date: fromDatetimeLocal(form.expiry_date),
    };

    try {
      if (editingId) {
        const response = await axios.put(
          `${apiURL}/admin/announcements/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setSuccess(response.data.message || 'Announcement updated.');
      } else {
        const response = await axios.post(`${apiURL}/admin/announcements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(response.data.message || 'Announcement created.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchAnnouncements();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (item: Announcement) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await axios.patch(
        `${apiURL}/admin/announcements/${item.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(response.data.message || 'Announcement published to member apps.');
      fetchAnnouncements();
      if (previewItem?.id === item.id && response.data.announcement) {
        setPreviewItem(response.data.announcement);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async (item: Announcement) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await axios.patch(
        `${apiURL}/admin/announcements/${item.id}/unpublish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(response.data.message || 'Announcement reverted to draft.');
      fetchAnnouncements();
      if (previewItem?.id === item.id && response.data.announcement) {
        setPreviewItem(response.data.announcement);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unpublish announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await axios.delete(
        `${apiURL}/admin/announcements/${deleteTarget.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(response.data.message || 'Announcement deleted.');
      setDeleteTarget(null);
      setIsPreviewOpen(false);
      setPreviewItem(null);
      fetchAnnouncements();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete announcement.');
      setDeleteTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">Low</span>;
    }
  };

  const getStatusBadge = (status: AnnouncementStatus) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
            <CheckCircle size={10} className="mr-1" /> Published
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            <Clock size={10} className="mr-1" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock size={10} className="mr-1" /> Draft
          </span>
        );
    }
  };

  const tabs: { key: StatusTab; label: string }[] = [
    { key: 'all', label: 'All Notices' },
    { key: 'published', label: 'Published' },
    { key: 'drafts', label: 'Drafts' },
    { key: 'expired', label: 'Expired' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 relative min-h-screen pb-20 text-[#0E1525]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight flex items-center gap-2">
              <Megaphone size={28} className="text-[#C41230]" />
              Announcements &amp; News
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Broadcast club news, meeting notices, emergency alerts, and tournament updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateForm}
              className="bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Create Announcement</span>
            </button>
          </div>
        </div>

        {/* Notifications & Feedback */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800">✕</button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex border-b border-slate-200 gap-8">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`pb-3.5 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === key ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
              }`}
            >
              <span>{label}</span>
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:flex-1 relative min-w-0">
            <Search className="absolute left-3.5 top-3 text-[#7A85A0]" size={18} />
            <input
              type="text"
              placeholder="Search by announcement title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-[#0E1525] placeholder-[#7A85A0] focus:outline-none focus:border-[#C41230] transition-colors"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230] min-w-[150px]"
            >
              <option value="">All Categories</option>
              {ANNOUNCEMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230]"
            >
              <option value="">All Priorities</option>
              {ANNOUNCEMENT_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {(search || typeFilter || priorityFilter) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-[#C41230] font-bold hover:underline px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Announcements Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="border-b border-[#243260] text-xs font-bold text-white uppercase tracking-wider bg-[#1A2744]">
                  <th className="py-4 px-5">Announcement</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4 text-center">Pinned</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Published At</th>
                  <th className="py-4 px-4">Expires At</th>
                  <th className="py-4 px-6 text-right sticky right-0 bg-[#1A2744] z-10 min-w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#3A4260] text-xs">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2" />
                      <p className="font-semibold">Loading announcements…</p>
                    </td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#3A4260] text-sm font-medium">
                      No announcements match your search or filter options.
                    </td>
                  </tr>
                ) : (
                  announcements.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openPreview(item)}
                      className="group hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {item.cover_image ? (
                            <img
                              src={getImageUrl(item.cover_image)}
                              alt={item.title}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#F0F2F7] border border-slate-200 flex items-center justify-center text-[#7A85A0] shrink-0">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#0E1525] group-hover:text-[#C41230] transition-colors max-w-[240px] truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#7A85A0] max-w-[240px] truncate mt-0.5">
                              {item.short_description || item.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-[#3A4260]">{item.announcement_type}</td>

                      <td className="py-4 px-4">{getPriorityBadge(item.priority)}</td>

                      {/* 1-Click Interactive Pin Toggle */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(item, e)}
                          className={`p-1.5 rounded-lg transition-colors inline-flex items-center ${
                            item.is_pinned 
                              ? 'bg-red-50 text-[#C41230] hover:bg-red-100' 
                              : 'text-slate-300 hover:text-[#C41230] hover:bg-slate-100'
                          }`}
                          title={item.is_pinned ? 'Click to unpin' : 'Click to pin to top'}
                        >
                          <Pin size={14} fill={item.is_pinned ? 'currentColor' : 'none'} />
                        </button>
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(item.status)}</td>

                      <td className="py-4 px-4 text-xs font-mono text-[#5A6380]">
                        {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-4 px-4 text-xs font-mono text-[#5A6380]">
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : <span className="text-slate-400">Never</span>}
                      </td>

                      {/* Sticky Actions Column */}
                      <td 
                        className="py-4 px-6 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => openPreview(item)}
                            title="Preview Notice"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => openEditForm(item)}
                            title="Edit Notice"
                            className="p-1.5 rounded-lg border border-slate-200 text-[#1A2744] hover:bg-slate-100 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={(e) => handleDuplicate(item, e)}
                            title="Duplicate Notice"
                            className="p-1.5 rounded-lg border border-slate-200 text-[#1A2744] hover:bg-slate-100 transition-colors"
                          >
                            <Copy size={14} />
                          </button>

                          {item.status === 'Published' ? (
                            <button
                              onClick={() => handleUnpublish(item)}
                              disabled={actionLoading}
                              title="Revert to Draft"
                              className="p-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                              <EyeOff size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(item)}
                              disabled={actionLoading}
                              title="Publish Announcement"
                              className="p-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            >
                              <Send size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Notice"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-[#F8FAFC] text-xs text-[#5A6380]">
              <span>
                Showing Page <span className="font-bold text-[#0E1525]">{page}</span> of{' '}
                <span className="font-bold text-[#0E1525]">{totalPages}</span> ({total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-300 hover:bg-white text-[#1A2744] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-slate-300 hover:bg-white text-[#1A2744] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Markdown Rich Editor & Creation Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 text-[#0E1525] border border-slate-200 my-8">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-[#1A2744]">
                  <Megaphone size={20} className="text-[#C41230]" />
                  <h3 className="font-extrabold text-lg">
                    {editingId ? 'Edit Club Announcement' : 'New Club Announcement'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Announcement Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual General Body Meeting 2026 Scheduled"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Category Type *
                    </label>
                    <select
                      value={form.announcement_type}
                      onChange={(e) => setForm({ ...form, announcement_type: e.target.value as AnnouncementType })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    >
                      {ANNOUNCEMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Priority Level *
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as AnnouncementPriority })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    >
                      {ANNOUNCEMENT_PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Expiration Date Time Picker */}
                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Auto-Expires At (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={form.expiry_date}
                      onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Auto-moves to Expired tab after this date.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as AnnouncementStatus })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    >
                      {ANNOUNCEMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Short Summary / Banner Text *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Brief 1-sentence synopsis shown in push notifications..."
                      value={form.short_description}
                      onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  {/* Rich Text / Markdown Editor Section */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-[#3A4260] uppercase">
                        Full Content (Markdown Supported) *
                      </label>
                      <div className="flex bg-[#F0F2F7] rounded-lg p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setEditorMode('write')}
                          className={`px-3 py-1 font-bold text-[10px] rounded ${editorMode === 'write' ? 'bg-[#1A2744] text-white shadow' : 'text-slate-600'}`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('preview')}
                          className={`px-3 py-1 font-bold text-[10px] rounded ${editorMode === 'preview' ? 'bg-[#1A2744] text-white shadow' : 'text-slate-600'}`}
                        >
                          Live Preview
                        </button>
                      </div>
                    </div>

                    {editorMode === 'write' ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#C41230]">
                        {/* Editor Toolbar */}
                        <div className="bg-[#F8FAFC] border-b border-slate-200 p-1.5 flex flex-wrap gap-1 items-center text-slate-600">
                          <button
                            type="button"
                            onClick={() => insertMarkdown('**', '**')}
                            className="p-1.5 hover:bg-slate-200 rounded"
                            title="Bold"
                          >
                            <Bold size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown('*', '*')}
                            className="p-1.5 hover:bg-slate-200 rounded"
                            title="Italic"
                          >
                            <Italic size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown('### ')}
                            className="p-1.5 hover:bg-slate-200 rounded"
                            title="Heading"
                          >
                            <Heading size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown('- ')}
                            className="p-1.5 hover:bg-slate-200 rounded"
                            title="Bullet list"
                          >
                            <List size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown('1. ')}
                            className="p-1.5 hover:bg-slate-200 rounded"
                            title="Numbered list"
                          >
                            <ListOrdered size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown('[', '](https://example.com)')}
                            className="p-1.5 hover:bg-slate-200 rounded"
                            title="Link"
                          >
                            <LinkIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown('`', '`')}
                            className="p-1.5 hover:bg-slate-200 rounded"
                            title="Code snippet"
                          >
                            <Code size={14} />
                          </button>
                        </div>
                        <textarea
                          id="announcement-desc-textarea"
                          rows={6}
                          required
                          placeholder="Write detailed club announcement details here. Use markdown for styling..."
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="w-full p-3 text-xs focus:outline-none font-mono"
                        />
                      </div>
                    ) : (
                      <div className="p-4 border border-slate-200 rounded-xl min-h-[140px] bg-slate-50 prose prose-sm max-w-none text-xs">
                        {form.description ? (
                          <div className="whitespace-pre-wrap">{form.description}</div>
                        ) : (
                          <span className="text-slate-400 italic">No content typed yet.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Banner Cover Image */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Cover Banner Image
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="https://... or upload below"
                        value={form.cover_image}
                        onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                      />
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors border border-slate-300 flex items-center gap-1.5 shrink-0">
                        <Upload size={14} />
                        <span>{coverUploading ? 'Uploading…' : 'Upload'}</span>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                          disabled={coverUploading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Pin switch */}
                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_pinned"
                      checked={form.is_pinned}
                      onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                      className="rounded text-[#C41230] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="is_pinned" className="font-bold text-xs text-[#0E1525] cursor-pointer">
                      Pin this announcement to top of member notice boards
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-bold bg-[#C41230] text-white rounded-xl hover:bg-[#9E0E27] disabled:opacity-50 transition-colors shadow"
                  >
                    {actionLoading ? 'Saving Notice…' : editingId ? 'Update Notice' : 'Broadcast Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {isPreviewOpen && previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-[#0E1525] border border-slate-200">
              {previewItem.cover_image && (
                <div className="h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={getImageUrl(previewItem.cover_image)}
                    alt={previewItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 rounded border text-slate-600 uppercase">
                      {previewItem.announcement_type}
                    </span>
                    <h2 className="text-lg font-extrabold text-[#0E1525] mt-1">{previewItem.title}</h2>
                  </div>
                  {getStatusBadge(previewItem.status)}
                </div>

                {previewItem.short_description && (
                  <p className="text-xs font-semibold text-[#1A2744] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {previewItem.short_description}
                  </p>
                )}

                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {previewItem.description}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openEditForm(previewItem);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-[#1A2744] text-white rounded-xl hover:bg-[#111B30] shadow"
                  >
                    Edit Notice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#0E1525] border border-slate-200">
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                <Trash2 size={24} />
                <h3 className="font-extrabold text-base">Delete Announcement</h3>
              </div>
              <p className="text-xs text-slate-600 mb-6">
                Are you sure you want to permanently delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow"
                >
                  {actionLoading ? 'Deleting…' : 'Delete Notice'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Announcements;
