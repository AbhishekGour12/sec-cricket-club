import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Send,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { getAdminMediaUrl } from '../utils/mediaUrl';
import { getApiUrl } from '../lib/api';

const EVENT_TYPES = [
  'League Match',
  'Tournament',
  'Friendly',
  'Club Gala',
  'Annual Event',
  'Other',
] as const;

const EVENT_STATUSES = [
  'Draft',
  'Published',
  'Cancelled',
  'Completed',
] as const;

const SPONSOR_TIERS = [
  'Title Sponsor',
  'Co-Sponsor',
  'Associate Sponsor',
] as const;

type EventType = (typeof EVENT_TYPES)[number];
type EventStatus = (typeof EVENT_STATUSES)[number] | 'Expired';
type SponsorTier = (typeof SPONSOR_TIERS)[number];
type LifecycleTab = 'all' | 'draft' | 'published' | 'completed' | 'cancelled';
type SortOption = 'newest' | 'event_date' | 'recently_created';

interface Sponsor {
  id?: number;
  sponsor_id?: number;
  name: string;
  logo: string;
  website: string;
  tier: SponsorTier;
  display_order: number;
}

interface ClubEvent {
  id: number;
  event_name: string;
  event_type: EventType;
  event_date: string;
  start_time: string;
  venue_name: string;
  venue_address?: string | null;
  map_link?: string | null;
  teams_involved?: string | null;
  description?: string | null;
  event_image?: string | null;
  is_featured: boolean;
  status: EventStatus;
  sponsor_count?: number;
  sponsors?: Sponsor[];
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface EventForm {
  event_name: string;
  event_type: EventType;
  event_date: string;
  start_time: string;
  venue_name: string;
  venue_address: string;
  map_link: string;
  teams_involved: string;
  description: string;
  event_image: string;
  is_featured: boolean;
  status: EventStatus;
  sponsors: Sponsor[];
}

const EMPTY_SPONSOR = (): Sponsor => ({
  name: '',
  logo: '',
  website: '',
  tier: 'Associate Sponsor',
  display_order: 0,
});

const EMPTY_FORM: EventForm = {
  event_name: '',
  event_type: 'League Match',
  event_date: '',
  start_time: '',
  venue_name: '',
  venue_address: '',
  map_link: '',
  teams_involved: '',
  description: '',
  event_image: '',
  is_featured: false,
  status: 'Draft',
  sponsors: [],
};

const toDateInput = (value?: string | null): string => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimeInput = (value?: string | null): string => {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
};

const formatEventDate = (value?: string | null) => {
  if (!value) return '—';
  const dateOnly = toDateInput(value);
  if (!dateOnly) return '—';
  const d = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateOnly;
  return d.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (value?: string | null) => {
  const time = toTimeInput(value);
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const Events: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  
  // Secondary Filters
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<LifecycleTab>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [previewItem, setPreviewItem] = useState<ClubEvent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClubEvent | null>(null);

  const apiURL = getApiUrl();
  const token = localStorage.getItem('admin_jwt');
  const limit = 10;

  useEffect(() => {
    const statusParam = searchParams.get('status') || searchParams.get('tab');
    const allowed: LifecycleTab[] = ['all', 'draft', 'published', 'completed', 'cancelled'];
    if (statusParam && allowed.includes(statusParam as LifecycleTab)) {
      setActiveTab(statusParam as LifecycleTab);
    } else {
      setActiveTab('all');
    }

    if (searchParams.get('type')) {
      setTypeFilter(searchParams.get('type') || '');
    }
  }, [searchParams]);

  const getImageUrl = (path?: string | null) => getAdminMediaUrl(path, '');

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = { page, limit, sort };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;
      if (upcomingOnly) params.filter = 'Upcoming';
      if (featuredOnly) params.filter = 'Featured';

      if (activeTab === 'published') params.status = 'Published';
      else if (activeTab === 'draft') params.status = 'Draft';
      else if (activeTab === 'completed') params.status = 'Completed';
      else if (activeTab === 'cancelled') params.status = 'Cancelled';

      const response = await axios.get(`${apiURL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const fetchedEvents: ClubEvent[] = response.data.events || [];
      setEvents(fetchedEvents);
      const pagination = response.data.pagination || {};
      setTotal(pagination.total ?? response.data.total ?? fetchedEvents.length);
      setTotalPages(pagination.total_pages ?? response.data.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events roster.');
    } finally {
      setIsLoading(false);
    }
  }, [apiURL, token, page, search, typeFilter, sort, activeTab, upcomingOnly, featuredOnly]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 1-Click Inline Toggle Featured State
  const handleToggleFeatured = async (event: ClubEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = !event.is_featured;
    setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, is_featured: updated } : ev));

    try {
      await axios.put(
        `${apiURL}/admin/events/${event.id}`,
        { is_featured: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Event "${event.event_name}" ${updated ? 'featured on club home' : 'unfeatured'}.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      fetchEvents();
      setError(err.response?.data?.message || 'Failed to toggle featured state.');
    }
  };

  const handleTabChange = (tab: LifecycleTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams(tab === 'all' ? {} : { status: tab });
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setUpcomingOnly(false);
    setFeaturedOnly(false);
    setSort('newest');
    setPage(1);
  };

  const mapEventToForm = (event: ClubEvent): EventForm => ({
    event_name: event.event_name || '',
    event_type: event.event_type || 'League Match',
    event_date: toDateInput(event.event_date),
    start_time: toTimeInput(event.start_time),
    venue_name: event.venue_name || '',
    venue_address: event.venue_address || '',
    map_link: event.map_link || '',
    teams_involved: event.teams_involved || '',
    description: event.description || '',
    event_image: event.event_image || '',
    is_featured: !!event.is_featured,
    status: event.status || 'Draft',
    sponsors: (event.sponsors || []).map((s, index) => ({
      id: s.id,
      sponsor_id: s.sponsor_id,
      name: s.name || '',
      logo: s.logo || '',
      website: s.website || '',
      tier: (s.tier as SponsorTier) || 'Associate Sponsor',
      display_order: s.display_order ?? index,
    })),
  });

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEditForm = async (item: ClubEvent) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.get(`${apiURL}/admin/events/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const event: ClubEvent = response.data.event ?? item;
      setEditingId(event.id);
      setForm(mapEventToForm(event));
      setIsFormOpen(true);
    } catch {
      setEditingId(item.id);
      setForm(mapEventToForm(item));
      setIsFormOpen(true);
    }
  };

  const openPreview = async (item: ClubEvent) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
    try {
      const response = await axios.get(`${apiURL}/admin/events/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.event) setPreviewItem(response.data.event);
    } catch {
      // keep row snapshot
    }
  };

  const uploadEventImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${apiURL}/admin/events/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Event banner must be an image file.');
      return;
    }
    setImageUploading(true);
    setError(null);
    try {
      const url = await uploadEventImage(file);
      setForm((prev) => ({ ...prev, event_image: url }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload event image.');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const addSponsor = () => {
    setForm((prev) => ({
      ...prev,
      sponsors: [
        ...prev.sponsors,
        { ...EMPTY_SPONSOR(), display_order: prev.sponsors.length },
      ],
    }));
  };

  const updateSponsor = (index: number, patch: Partial<Sponsor>) => {
    setForm((prev) => {
      const sponsors = [...prev.sponsors];
      sponsors[index] = { ...sponsors[index], ...patch };
      return { ...prev, sponsors };
    });
  };

  const removeSponsor = (index: number) => {
    setForm((prev) => ({
      ...prev,
      sponsors: prev.sponsors
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, display_order: i })),
    }));
  };

  // Boundary Validations
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    // Boundary check: Date must be valid
    if (!form.event_date) {
      setError('Event date is required.');
      setActionLoading(false);
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (!editingId && form.status === 'Published' && form.event_date < todayStr) {
      if (!window.confirm('The selected event date is in the past. Do you still wish to publish it as an upcoming event?')) {
        setActionLoading(false);
        return;
      }
    }

    for (let i = 0; i < form.sponsors.length; i++) {
      const sponsor = form.sponsors[i];
      if (!sponsor.name.trim()) {
        setError(`Sponsor #${i + 1}: Name is required.`);
        setActionLoading(false);
        return;
      }
      if (!sponsor.logo.trim()) {
        setError(`Sponsor #${i + 1}: Logo is required.`);
        setActionLoading(false);
        return;
      }
    }

    const payload = {
      event_name: form.event_name.trim(),
      event_type: form.event_type,
      event_date: form.event_date,
      start_time: form.start_time,
      venue_name: form.venue_name.trim(),
      venue_address: form.venue_address.trim() || null,
      map_link: form.map_link.trim() || null,
      teams_involved: form.teams_involved.trim() || null,
      description: form.description.trim() || null,
      event_image: form.event_image || null,
      is_featured: form.is_featured,
      status: form.status,
      sponsors: form.sponsors.map((s, index) => ({
        sponsor_id: s.sponsor_id,
        name: s.name.trim(),
        logo: s.logo,
        website: s.website.trim() || null,
        tier: s.tier,
        display_order: s.display_order ?? index,
      })),
    };

    try {
      if (editingId) {
        const response = await axios.put(`${apiURL}/admin/events/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(response.data.message || 'Event updated successfully.');
      } else {
        const response = await axios.post(`${apiURL}/admin/events`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(response.data.message || 'Event created successfully.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (item: ClubEvent) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await axios.patch(
        `${apiURL}/admin/events/${item.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(response.data.message || 'Event published to member app.');
      fetchEvents();
      if (previewItem?.id === item.id && response.data.event) {
        setPreviewItem(response.data.event);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async (item: ClubEvent) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await axios.patch(
        `${apiURL}/admin/events/${item.id}/unpublish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(response.data.message || 'Event returned to draft status.');
      fetchEvents();
      if (previewItem?.id === item.id && response.data.event) {
        setPreviewItem(response.data.event);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unpublish event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await axios.delete(`${apiURL}/admin/events/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(response.data.message || 'Event deleted permanently.');
      setDeleteTarget(null);
      setIsPreviewOpen(false);
      setPreviewItem(null);
      fetchEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event.');
      setDeleteTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
            <CheckCircle size={10} className="mr-1" /> Published
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
            <CheckCircle size={10} className="mr-1" /> Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
            <Ban size={10} className="mr-1" /> Cancelled
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

  const tabs: { key: LifecycleTab; label: string }[] = [
    { key: 'all', label: 'All Events' },
    { key: 'draft', label: 'Drafts' },
    { key: 'published', label: 'Published' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 relative min-h-screen pb-20 text-[#0E1525]">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight flex items-center gap-2">
              <Calendar size={28} className="text-[#C41230]" />
              Events &amp; Tournaments
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Schedule, feature, and broadcast league matches and tournaments for club members.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateForm}
              className="bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Create Event</span>
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

        {/* Normalized Lifecycle Status Tabs */}
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

        {/* Filter Controls Row (Includes Secondary Flags & Event Type) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:flex-1 relative min-w-0">
            <Search className="absolute left-3.5 top-3 text-[#7A85A0]" size={18} />
            <input
              type="text"
              placeholder="Search by event name, venue, or teams..."
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
            {/* Quick Flag Chips */}
            <button
              type="button"
              onClick={() => setUpcomingOnly(!upcomingOnly)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1 ${
                upcomingOnly 
                  ? 'bg-blue-50 border-blue-400 text-blue-700' 
                  : 'bg-[#F0F2F7] border-slate-200 text-[#5A6380] hover:bg-slate-200'
              }`}
            >
              <Clock size={12} />
              <span>Upcoming</span>
            </button>

            <button
              type="button"
              onClick={() => setFeaturedOnly(!featuredOnly)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1 ${
                featuredOnly 
                  ? 'bg-amber-50 border-amber-400 text-amber-800' 
                  : 'bg-[#F0F2F7] border-slate-200 text-[#5A6380] hover:bg-slate-200'
              }`}
            >
              <Star size={12} fill={featuredOnly ? 'currentColor' : 'none'} />
              <span>Featured</span>
            </button>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230] min-w-[150px]"
            >
              <option value="">All Event Types</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setPage(1);
              }}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230]"
            >
              <option value="newest">Newest First</option>
              <option value="event_date">Event Date</option>
              <option value="recently_created">Recently Added</option>
            </select>

            {(search || typeFilter || upcomingOnly || featuredOnly) && (
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

        {/* Events Table Container (Fixed zero-record overflow & Sticky Actions Column) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="border-b border-[#243260] text-xs font-bold text-white uppercase tracking-wider bg-[#1A2744]">
                  <th className="py-4 px-5">Event</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Time</th>
                  <th className="py-4 px-4">Venue</th>
                  <th className="py-4 px-4 text-center">Featured</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Sponsors</th>
                  <th className="py-4 px-6 text-right sticky right-0 bg-[#1A2744] z-10 min-w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-[#3A4260] text-xs">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2" />
                      <p className="font-semibold">Loading events…</p>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-[#3A4260] text-sm font-medium">
                      No events match your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  events.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openPreview(item)}
                      className="group hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {item.event_image ? (
                            <img
                              src={getImageUrl(item.event_image)}
                              alt={item.event_name}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#F0F2F7] border border-slate-200 flex items-center justify-center text-[#7A85A0] shrink-0">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div className="font-bold text-xs text-[#0E1525] group-hover:text-[#C41230] transition-colors max-w-[200px] truncate">
                            {item.event_name}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-[#3A4260]">{item.event_type}</td>

                      <td className="py-4 px-4 text-xs font-mono text-[#3A4260]">
                        {formatEventDate(item.event_date)}
                      </td>

                      <td className="py-4 px-4 text-xs font-mono text-[#3A4260]">
                        {formatTime(item.start_time)}
                      </td>

                      <td className="py-4 px-4 text-xs text-[#3A4260] font-medium max-w-[160px] truncate">
                        {item.venue_name}
                      </td>

                      {/* 1-Click Interactive Featured Switch */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFeatured(item, e)}
                          className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ${
                            item.is_featured 
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                              : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                          }`}
                          title={item.is_featured ? 'Click to unfeature' : 'Click to feature on homepage'}
                        >
                          <Star size={14} fill={item.is_featured ? 'currentColor' : 'none'} />
                        </button>
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(item.status)}</td>

                      <td className="py-4 px-4 text-xs font-bold text-[#1A2744]">
                        {item.sponsor_count ?? item.sponsors?.length ?? 0}
                      </td>

                      {/* Sticky Actions Column */}
                      <td 
                        className="py-4 px-6 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => openPreview(item)}
                            title="Preview Event"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditForm(item)}
                            title="Edit Event"
                            className="p-1.5 rounded-lg border border-slate-200 text-[#1A2744] hover:bg-slate-100 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          {item.status === 'Published' ? (
                            <button
                              onClick={() => handleUnpublish(item)}
                              disabled={actionLoading}
                              title="Unpublish (Return to draft)"
                              className="p-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                              <EyeOff size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(item)}
                              disabled={actionLoading}
                              title="Publish to Members"
                              className="p-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Event"
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

        {/* Create / Edit Modal with Date Validation */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 text-[#0E1525] border border-slate-200 my-8">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-[#1A2744]">
                  <Calendar size={20} className="text-[#C41230]" />
                  <h3 className="font-extrabold text-lg">
                    {editingId ? 'Edit Club Event' : 'Create New Event'}
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
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SEC Annual Cricket Championship 2026"
                      value={form.event_name}
                      onChange={(e) => setForm({ ...form, event_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Event Type *
                    </label>
                    <select
                      value={form.event_type}
                      onChange={(e) => setForm({ ...form, event_type: e.target.value as EventType })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Lifecycle Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    >
                      {EVENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SEC Cricket Stadium"
                      value={form.venue_name}
                      onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Teams / Participants
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SEC Lions vs Tigers"
                      value={form.teams_involved}
                      onChange={(e) => setForm({ ...form, teams_involved: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Venue Address &amp; Map URL
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Street address, City"
                        value={form.venue_address}
                        onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                      />
                      <input
                        type="url"
                        placeholder="Google Maps link"
                        value={form.map_link}
                        onChange={(e) => setForm({ ...form, map_link: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Details about match rules, ticket info, schedule..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  {/* Banner Image */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#3A4260] uppercase mb-1">
                      Event Banner Image (16:9 Recommended)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="https://... or upload below"
                        value={form.event_image}
                        onChange={(e) => setForm({ ...form, event_image: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                      />
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors border border-slate-300 flex items-center gap-1.5 shrink-0">
                        <Upload size={14} />
                        <span>{imageUploading ? 'Uploading…' : 'Upload'}</span>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={imageUploading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Feature on homepage switch */}
                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="rounded text-[#C41230] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="is_featured" className="font-bold text-xs text-[#0E1525] cursor-pointer">
                      Feature this event on the club mobile application homepage
                    </label>
                  </div>
                </div>

                {/* Sponsors Section */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-[#1A2744] uppercase tracking-wider">
                      Event Sponsors ({form.sponsors.length})
                    </span>
                    <button
                      type="button"
                      onClick={addSponsor}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#1A2744] font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Add Sponsor</span>
                    </button>
                  </div>

                  {form.sponsors.map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Sponsor Name *"
                        value={s.name}
                        onChange={(e) => updateSponsor(idx, { name: e.target.value })}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                      <select
                        value={s.tier}
                        onChange={(e) => updateSponsor(idx, { tier: e.target.value as SponsorTier })}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        {SPONSOR_TIERS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Logo URL *"
                        value={s.logo}
                        onChange={(e) => updateSponsor(idx, { logo: e.target.value })}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="Website URL"
                          value={s.website}
                          onChange={(e) => updateSponsor(idx, { website: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeSponsor(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Remove sponsor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
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
                    {actionLoading ? 'Saving Event…' : editingId ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Preview Modal */}
        {isPreviewOpen && previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-[#0E1525] border border-slate-200">
              {previewItem.event_image && (
                <div className="h-48 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={getImageUrl(previewItem.event_image)}
                    alt={previewItem.event_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 rounded border text-slate-600 uppercase">
                      {previewItem.event_type}
                    </span>
                    <h2 className="text-lg font-extrabold text-[#0E1525] mt-1">{previewItem.event_name}</h2>
                  </div>
                  {getStatusBadge(previewItem.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-slate-400 font-medium">Date &amp; Time</p>
                    <p className="font-bold text-[#0E1525] mt-0.5">{formatEventDate(previewItem.event_date)} at {formatTime(previewItem.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Venue</p>
                    <p className="font-bold text-[#0E1525] mt-0.5">{previewItem.venue_name}</p>
                  </div>
                </div>

                {previewItem.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{previewItem.description}</p>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openEditForm(previewItem);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-[#1A2744] text-white rounded-xl hover:bg-[#111B30] shadow"
                  >
                    Edit Event
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
                <h3 className="font-extrabold text-base">Delete Event</h3>
              </div>
              <p className="text-xs text-slate-600 mb-6">
                Are you sure you want to permanently delete <strong>{deleteTarget.event_name}</strong>? This action cannot be undone.
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
                  {actionLoading ? 'Deleting…' : 'Delete Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Events;
