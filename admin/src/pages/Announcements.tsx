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
  FileText,
  Image as ImageIcon,
  Send,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { getAdminMediaUrl } from '../utils/mediaUrl';

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
  const [coverUploading, setCoverUploading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
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
      const status = TAB_STATUS_MAP[activeTab];
      if (status) params.status = status;

      const response = await axios.get(`${apiURL}/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setAnnouncements(response.data.announcements || []);
      setTotal(response.data.total ?? 0);
      setTotalPages(response.data.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, [apiURL, token, page, search, typeFilter, priorityFilter, activeTab]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAnnouncements();
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEditForm = async (item: Announcement) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.get(`${apiURL}/admin/announcements/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const a: Announcement = response.data.announcement ?? item;
      setEditingId(a.id);
      setForm({
        title: a.title,
        announcement_type: a.announcement_type,
        priority: a.priority,
        short_description: a.short_description,
        description: a.description,
        cover_image: a.cover_image || '',
        attachments: a.attachments || [],
        is_pinned: a.is_pinned,
        publish_date: toDatetimeLocal(a.publish_date),
        expiry_date: toDatetimeLocal(a.expiry_date),
        status: a.status,
      });
      setIsFormOpen(true);
    } catch {
      setEditingId(item.id);
      setForm({
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

  const uploadFile = async (file: File): Promise<string> => {
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
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Cover must be an image file.');
      return;
    }
    setCoverUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      setForm((prev) => ({ ...prev, cover_image: url }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload cover image.');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Attachment must be a PDF file.');
      return;
    }
    setAttachmentUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      setForm((prev) => ({ ...prev, attachments: [...prev.attachments, url] }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setAttachmentUploading(false);
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
      publish_date: fromDatetimeLocal(form.publish_date),
      expiry_date: fromDatetimeLocal(form.expiry_date),
      status: form.status,
    };

    try {
      if (editingId) {
        const response = await axios.put(`${apiURL}/admin/announcements/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(response.data.message || 'Announcement updated successfully.');
      } else {
        const response = await axios.post(`${apiURL}/admin/announcements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(response.data.message || 'Announcement created successfully.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchAnnouncements();
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
      setSuccess(response.data.message || 'Announcement published.');
      fetchAnnouncements();
      if (previewItem?.id === item.id && response.data.announcement) {
        setPreviewItem(response.data.announcement);
      }
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
      setSuccess(response.data.message || 'Announcement unpublished.');
      fetchAnnouncements();
      if (previewItem?.id === item.id && response.data.announcement) {
        setPreviewItem(response.data.announcement);
      }
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
      const response = await axios.delete(`${apiURL}/admin/announcements/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(response.data.message || 'Announcement deleted.');
      setDeleteTarget(null);
      setIsPreviewOpen(false);
      setPreviewItem(null);
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete announcement.');
      setDeleteTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: AnnouncementStatus) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle size={12} className="mr-1" />
            Published
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            <Clock size={12} className="mr-1" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertCircle size={12} className="mr-1" />
            Draft
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    const styles: Record<AnnouncementPriority, string> = {
      Low: 'bg-slate-100 text-slate-600 border-slate-200',
      Medium: 'bg-blue-100 text-blue-700 border-blue-200',
      High: 'bg-orange-100 text-orange-700 border-orange-200',
      Urgent: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs: { key: StatusTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'drafts', label: 'Drafts' },
    { key: 'published', label: 'Published' },
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
              Club Announcements
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Create, schedule, and publish announcements for SEC Cricket Club members.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 border border-slate-200 shadow-sm rounded-xl">
              <span className="text-xs text-[#7A85A0] font-bold uppercase tracking-wider">Total</span>
              <p className="text-lg font-extrabold text-[#1A2744]">{total}</p>
            </div>
            <button
              onClick={openCreateForm}
              className="bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-[#C41230]/20 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Add Announcement
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 gap-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === key ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
              }`}
            >
              {label}
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3.5 text-[#7A85A0]" size={18} />
              <input
                type="text"
                placeholder="Search by title, description, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-[#0E1525] placeholder-[#7A85A0] focus:outline-none focus:border-[#C41230] transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0E1525] font-medium focus:outline-none focus:border-[#C41230] min-w-[160px]"
              >
                <option value="">All Types</option>
                {ANNOUNCEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0E1525] font-medium focus:outline-none focus:border-[#C41230] min-w-[140px]"
              >
                <option value="">All Priorities</option>
                {ANNOUNCEMENT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-[#C41230] hover:bg-[#9E0E27] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-[#C41230]/20 transition-all"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="border border-slate-300 hover:bg-slate-100 text-[#1A2744] text-sm px-4 py-3 rounded-xl transition-all font-semibold"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
            {success}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#243260] text-xs font-bold text-white uppercase tracking-wider bg-[#1A2744]">
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Pinned</th>
                  <th className="py-4 px-6">Publish Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#3A4260] text-sm">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2" />
                      <p>Loading announcements...</p>
                    </td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#3A4260] text-sm font-medium">
                      No announcements match your filters.
                    </td>
                  </tr>
                ) : (
                  announcements.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openPreview(item)}
                      className="group hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#0E1525] group-hover:text-[#C41230] transition-colors max-w-[240px] truncate">
                          {item.title}
                        </div>
                        <p className="text-xs text-[#7A85A0] truncate max-w-[240px]">{item.short_description}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#3A4260] font-medium">{item.announcement_type}</td>
                      <td className="py-4 px-6">{getPriorityBadge(item.priority)}</td>
                      <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-6">
                        {item.is_pinned ? (
                          <Pin size={16} className="text-[#C41230]" fill="currentColor" />
                        ) : (
                          <span className="text-[#7A85A0] text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-[#3A4260] font-mono">{formatDate(item.publish_date)}</td>
                      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openPreview(item)}
                            title="Preview"
                            className="p-2 rounded-lg border border-slate-200 text-[#1A2744] hover:bg-slate-100 transition-all"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditForm(item)}
                            title="Edit"
                            className="p-2 rounded-lg border border-slate-200 text-[#1A2744] hover:bg-slate-100 transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          {item.status === 'Published' ? (
                            <button
                              onClick={() => handleUnpublish(item)}
                              disabled={actionLoading}
                              title="Unpublish"
                              className="p-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-all disabled:opacity-50"
                            >
                              <EyeOff size={14} />
                            </button>
                          ) : item.status !== 'Expired' ? (
                            <button
                              onClick={() => handlePublish(item)}
                              disabled={actionLoading}
                              title="Publish"
                              className="p-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-all disabled:opacity-50"
                            >
                              <Send size={14} />
                            </button>
                          ) : null}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Delete"
                            className="p-2 rounded-lg border border-[#C41230]/30 text-[#C41230] hover:bg-[#C41230]/10 transition-all"
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

          {!isLoading && totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-[#F0F2F7] text-sm">
              <span className="text-[#3A4260]">
                Showing Page <span className="text-[#0E1525] font-bold">{page}</span> of{' '}
                <span className="text-[#0E1525] font-bold">{totalPages}</span>
                {' '}({total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-300 hover:bg-white text-[#1A2744] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-slate-300 hover:bg-white text-[#1A2744] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
              <div className="sticky top-0 z-10 p-6 border-b border-slate-200 bg-[#1A2744] text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingId ? 'Edit Announcement' : 'New Announcement'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    {editingId ? 'Update announcement details below.' : 'Fill in the details to create a new announcement.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-[#243260] rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-6 bg-[#F0F2F7]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Title *</label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Type *</label>
                    <select
                      required
                      value={form.announcement_type}
                      onChange={(e) =>
                        setForm({ ...form, announcement_type: e.target.value as AnnouncementType })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    >
                      {ANNOUNCEMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Priority *</label>
                    <select
                      required
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value as AnnouncementPriority })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    >
                      {ANNOUNCEMENT_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Short Description * (max 500 chars)</label>
                    <input
                      type="text"
                      required
                      maxLength={500}
                      value={form.short_description}
                      onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Description *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-[#3A4260] font-semibold flex items-center gap-1.5">
                      <ImageIcon size={12} />
                      Cover Image
                    </label>
                    {form.cover_image && getImageUrl(form.cover_image) ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200">
                        <img
                          src={getImageUrl(form.cover_image)}
                          alt="Cover preview"
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, cover_image: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-[#C41230] hover:bg-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          disabled={coverUploading}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          disabled={coverUploading}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            coverInputRef.current?.click();
                          }}
                          className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#1A2744] bg-white transition-all disabled:opacity-50"
                        >
                          <Upload size={24} className="text-[#7A85A0] mb-2" />
                          <span className="text-xs text-[#7A85A0] font-semibold">
                            {coverUploading ? 'Uploading...' : 'Click to upload cover'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-[#3A4260] font-semibold flex items-center gap-1.5">
                      <FileText size={12} />
                      PDF Attachment (optional)
                    </label>
                    <div className="space-y-2">
                      {form.attachments.map((url, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        >
                          <a
                            href={getImageUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C41230] font-semibold truncate flex-1"
                          >
                            Attachment {idx + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                attachments: form.attachments.filter((_, i) => i !== idx),
                              })
                            }
                            className="p-1 text-[#C41230] hover:bg-[#C41230]/10 rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleAttachmentUpload}
                        disabled={attachmentUploading}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        disabled={attachmentUploading}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          attachmentInputRef.current?.click();
                        }}
                        className="flex items-center justify-center gap-2 h-16 w-full border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#1A2744] bg-white transition-all disabled:opacity-50"
                      >
                        <Upload size={16} className="text-[#7A85A0]" />
                        <span className="text-xs text-[#7A85A0] font-semibold">
                          {attachmentUploading ? 'Uploading...' : 'Add PDF'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold flex items-center gap-1.5">
                      <Calendar size={12} />
                      Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.publish_date}
                      onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold flex items-center gap-1.5">
                      <Clock size={12} />
                      Expiry Date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.expiry_date}
                      onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as AnnouncementStatus })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    >
                      {ANNOUNCEMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_pinned}
                        onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#C41230] focus:ring-[#C41230]"
                      />
                      <span className="text-sm font-semibold text-[#0E1525] flex items-center gap-1.5">
                        <Pin size={14} className="text-[#C41230]" />
                        Pin to top
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl text-[#3A4260] hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || coverUploading || attachmentUploading}
                    className="bg-[#C41230] hover:bg-[#9E0E27] disabled:opacity-50 text-white font-bold text-sm px-8 py-2.5 rounded-xl shadow-lg shadow-[#C41230]/20 transition-all flex items-center gap-2"
                  >
                    {actionLoading ? 'Saving...' : editingId ? 'Update Announcement' : 'Create Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Drawer */}
        {isPreviewOpen && previewItem && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsPreviewOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <div className="w-screen max-w-xl bg-white border-l border-slate-200 text-[#0E1525] flex flex-col shadow-2xl relative">
                <div className="p-6 border-b border-slate-200 bg-[#1A2744] text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Announcement Preview</h2>
                    <p className="text-xs text-slate-300 mt-1 font-medium">How members will see this announcement.</p>
                  </div>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-[#243260] rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#F0F2F7]">
                  {previewItem.cover_image && (
                    <img
                      src={getImageUrl(previewItem.cover_image)}
                      alt={previewItem.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(previewItem.status)}
                      {getPriorityBadge(previewItem.priority)}
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1A2744]/10 text-[#1A2744] border border-[#1A2744]/20">
                        {previewItem.announcement_type}
                      </span>
                      {previewItem.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C41230]/10 text-[#C41230] border border-[#C41230]/20">
                          <Pin size={10} fill="currentColor" />
                          Pinned
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-[#0E1525] leading-tight">{previewItem.title}</h3>
                      <p className="text-sm text-[#3A4260] mt-2 font-medium">{previewItem.short_description}</p>
                    </div>

                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider mb-2">Full Description</h4>
                      <p className="text-sm text-[#3A4260] leading-relaxed whitespace-pre-wrap">
                        {previewItem.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-xs">
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Publish Date</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatDate(previewItem.publish_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Expiry Date</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatDate(previewItem.expiry_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Created</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatDate(previewItem.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Last Updated</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatDate(previewItem.updated_at)}
                        </span>
                      </div>
                    </div>

                    {(previewItem.attachments?.length ?? 0) > 0 && (
                      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                        <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FileText size={12} className="text-[#C41230]" />
                          Attachments
                        </h4>
                        <div className="space-y-2">
                          {previewItem.attachments!.map((url, idx) => (
                            <a
                              key={idx}
                              href={getImageUrl(url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm font-semibold text-[#C41230] hover:underline"
                            >
                              <FileText size={14} />
                              PDF Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditForm(previewItem)}
                      className="bg-[#1A2744] hover:bg-[#111B30] text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    {previewItem.status === 'Published' ? (
                      <button
                        onClick={() => handleUnpublish(previewItem)}
                        disabled={actionLoading}
                        className="border border-amber-400 text-amber-700 hover:bg-amber-50 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <EyeOff size={14} />
                        Unpublish
                      </button>
                    ) : previewItem.status !== 'Expired' ? (
                      <button
                        onClick={() => handlePublish(previewItem)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                      >
                        <Send size={14} />
                        Publish
                      </button>
                    ) : null}
                    <button
                      onClick={() => setDeleteTarget(previewItem)}
                      className="border border-[#C41230]/40 text-[#C41230] hover:bg-[#C41230]/10 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-[#0E1525] font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-6">
              <div className="flex items-center space-x-3 text-[#C41230]">
                <Trash2 size={24} />
                <h3 className="text-lg font-bold text-[#0E1525]">Delete Announcement?</h3>
              </div>
              <p className="text-sm text-[#3A4260] leading-relaxed">
                This permanently removes{' '}
                <strong className="text-[#0E1525]">{deleteTarget.title}</strong> and any uploaded
                cover images or attachments. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-xl text-[#3A4260] hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-sm font-bold bg-[#C41230] hover:bg-[#9E0E27] text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Permanently'}
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
