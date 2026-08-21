import React, { useState, useEffect, useCallback } from 'react';
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
  MapPin,
  Users,
  Link2,
  Building2,
  Ban,
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';

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
  'Expired',
] as const;

const SPONSOR_TIERS = [
  'Title Sponsor',
  'Co-Sponsor',
  'Associate Sponsor',
] as const;

const DESCRIPTION_MAX = 1000;

type EventType = (typeof EVENT_TYPES)[number];
type EventStatus = (typeof EVENT_STATUSES)[number];
type SponsorTier = (typeof SPONSOR_TIERS)[number];
type FilterTab =
  | 'all'
  | 'upcoming'
  | 'published'
  | 'draft'
  | 'completed'
  | 'cancelled'
  | 'featured';
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

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const Events: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [imageUploading, setImageUploading] = useState(false);
  const [sponsorUploadingIndex, setSponsorUploadingIndex] = useState<number | null>(null);

  const [previewItem, setPreviewItem] = useState<ClubEvent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClubEvent | null>(null);

  const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
  const token = localStorage.getItem('admin_jwt');
  const limit = 10;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const allowed: FilterTab[] = [
      'all',
      'upcoming',
      'published',
      'draft',
      'completed',
      'cancelled',
      'featured',
    ];
    if (tabParam && allowed.includes(tabParam as FilterTab)) {
      setActiveTab(tabParam as FilterTab);
    } else {
      setActiveTab('all');
    }
  }, [searchParams]);

  const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    const trimmedPath = String(path).trim();
    if (!trimmedPath) return '';
    const baseURL = apiURL.replace('/api', '');

    const uploadsIndex = trimmedPath.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativeUploadPath = trimmedPath.substring(uploadsIndex);
      return baseURL ? `${baseURL}${relativeUploadPath}` : relativeUploadPath;
    }

    if (!trimmedPath.startsWith('http://') && !trimmedPath.startsWith('https://')) {
      const cleanPath = trimmedPath.startsWith('/') ? trimmedPath : '/' + trimmedPath;
      return `${baseURL}${cleanPath}`;
    }

    if (trimmedPath.startsWith('http://') && (window.location.protocol === 'https:' || baseURL.startsWith('https:'))) {
      return trimmedPath.replace('http://', 'https://');
    }

    return trimmedPath;
  };

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit, sort };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;

      if (activeTab === 'upcoming') params.filter = 'Upcoming';
      else if (activeTab === 'featured') params.filter = 'Featured';
      else if (activeTab === 'published') params.status = 'Published';
      else if (activeTab === 'draft') params.status = 'Draft';
      else if (activeTab === 'completed') params.status = 'Completed';
      else if (activeTab === 'cancelled') params.status = 'Cancelled';

      const response = await axios.get(`${apiURL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setEvents(response.data.events || []);
      const pagination = response.data.pagination || {};
      setTotal(pagination.total ?? response.data.total ?? 0);
      setTotalPages(pagination.total_pages ?? response.data.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setIsLoading(false);
    }
  }, [apiURL, token, page, search, typeFilter, sort, activeTab]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
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

  const uploadSponsorLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${apiURL}/admin/sponsors/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Event image must be an image file.');
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

  const handleSponsorLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Sponsor logo must be an image file.');
      return;
    }
    setSponsorUploadingIndex(index);
    setError(null);
    try {
      const url = await uploadSponsorLogo(file);
      setForm((prev) => {
        const sponsors = [...prev.sponsors];
        sponsors[index] = { ...sponsors[index], logo: url };
        return { ...prev, sponsors };
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload sponsor logo.');
    } finally {
      setSponsorUploadingIndex(null);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    for (let i = 0; i < form.sponsors.length; i++) {
      const sponsor = form.sponsors[i];
      if (!sponsor.name.trim()) {
        setError(`Sponsor #${i + 1}: name is required.`);
        setActionLoading(false);
        return;
      }
      if (!sponsor.logo.trim()) {
        setError(`Sponsor #${i + 1}: logo is required.`);
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
      setSuccess(response.data.message || 'Event published.');
      fetchEvents();
      if (previewItem?.id === item.id && response.data.event) {
        setPreviewItem(response.data.event);
      }
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
      setSuccess(response.data.message || 'Event unpublished.');
      fetchEvents();
      if (previewItem?.id === item.id && response.data.event) {
        setPreviewItem(response.data.event);
      }
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
      setSuccess(response.data.message || 'Event deleted.');
      setDeleteTarget(null);
      setIsPreviewOpen(false);
      setPreviewItem(null);
      fetchEvents();
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle size={12} className="mr-1" />
            Published
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
            <Ban size={12} className="mr-1" />
            Cancelled
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

  const sponsorsByTier = (sponsors: Sponsor[] = []) => {
    const groups: { tier: SponsorTier; items: Sponsor[] }[] = SPONSOR_TIERS.map((tier) => ({
      tier,
      items: sponsors.filter((s) => s.tier === tier),
    }));
    return groups.filter((g) => g.items.length > 0);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'published', label: 'Published' },
    { key: 'draft', label: 'Draft' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'featured', label: 'Featured' },
  ];

  const canPublish = (status: EventStatus) =>
    status === 'Draft' || status === 'Cancelled' || status === 'Completed';

  return (
    <AdminLayout>
      <div className="space-y-6 relative min-h-screen pb-20 text-[#0E1525]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight flex items-center gap-2">
              <Calendar size={28} className="text-[#C41230]" />
              Club Events
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Create, schedule, and publish events for SEC Cricket Club members.
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
              Add Event
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
                placeholder="Search by name, venue, or teams..."
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
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption);
                  setPage(1);
                }}
                className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0E1525] font-medium focus:outline-none focus:border-[#C41230] min-w-[170px]"
              >
                <option value="newest">Newest</option>
                <option value="event_date">Event Date</option>
                <option value="recently_created">Recently Created</option>
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
                  <th className="py-4 px-6">Event</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6">Venue</th>
                  <th className="py-4 px-6">Featured</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Sponsors</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#3A4260] text-sm">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2" />
                      <p>Loading events...</p>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#3A4260] text-sm font-medium">
                      No events match your filters.
                    </td>
                  </tr>
                ) : (
                  events.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openPreview(item)}
                      className="group hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {item.event_image ? (
                            <img
                              src={getImageUrl(item.event_image)}
                              alt={item.event_name}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#F0F2F7] border border-slate-200 flex items-center justify-center text-[#7A85A0]">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div className="font-semibold text-[#0E1525] group-hover:text-[#C41230] transition-colors max-w-[200px] truncate">
                            {item.event_name}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#3A4260] font-medium">{item.event_type}</td>
                      <td className="py-4 px-6 text-xs text-[#3A4260] font-mono">
                        {formatEventDate(item.event_date)}
                      </td>
                      <td className="py-4 px-6 text-xs text-[#3A4260] font-mono">
                        {formatTime(item.start_time)}
                      </td>
                      <td className="py-4 px-6 text-sm text-[#3A4260] font-medium max-w-[160px] truncate">
                        {item.venue_name}
                      </td>
                      <td className="py-4 px-6">
                        {item.is_featured ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C41230]/10 text-[#C41230] border border-[#C41230]/20">
                            <Star size={10} fill="currentColor" />
                            Featured
                          </span>
                        ) : (
                          <span className="text-[#7A85A0] text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-[#1A2744]">
                        {item.sponsor_count ?? item.sponsors?.length ?? 0}
                      </td>
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
                          ) : canPublish(item.status) ? (
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
                    {editingId ? 'Edit Event' : 'New Event'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    {editingId ? 'Update event details below.' : 'Fill in the details to create a new event.'}
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
                {/* Basic */}
                <section className="space-y-4">
                  <h3 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
                    Basic
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Event Name *</label>
                      <input
                        type="text"
                        required
                        maxLength={200}
                        value={form.event_name}
                        onChange={(e) => setForm({ ...form, event_name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Event Type *</label>
                      <select
                        required
                        value={form.event_type}
                        onChange={(e) =>
                          setForm({ ...form, event_type: e.target.value as EventType })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Event Date *</label>
                      <input
                        type="date"
                        required
                        value={form.event_date}
                        onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Start Time *</label>
                      <input
                        type="time"
                        required
                        value={form.start_time}
                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold flex items-center gap-1.5">
                        <Users size={12} />
                        Teams Involved
                      </label>
                      <input
                        type="text"
                        value={form.teams_involved}
                        onChange={(e) => setForm({ ...form, teams_involved: e.target.value })}
                        placeholder="e.g. SEC XI vs Rival CC"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                  </div>
                </section>

                {/* Venue */}
                <section className="space-y-4">
                  <h3 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#C41230]" />
                    Venue
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Venue Name *</label>
                      <input
                        type="text"
                        required
                        maxLength={200}
                        value={form.venue_name}
                        onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Venue Address</label>
                      <input
                        type="text"
                        value={form.venue_address}
                        onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold flex items-center gap-1.5">
                        <Link2 size={12} />
                        Map Link
                      </label>
                      <input
                        type="url"
                        value={form.map_link}
                        onChange={(e) => setForm({ ...form, map_link: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                  </div>
                </section>

                {/* Details */}
                <section className="space-y-4">
                  <h3 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
                    Details
                  </h3>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-[#3A4260] font-semibold">Description</label>
                      <span
                        className={`text-[10px] font-bold ${
                          form.description.length > DESCRIPTION_MAX
                            ? 'text-[#C41230]'
                            : 'text-[#7A85A0]'
                        }`}
                      >
                        {form.description.length}/{DESCRIPTION_MAX}
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={DESCRIPTION_MAX}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230] resize-none"
                    />
                  </div>
                </section>

                {/* Image + Featured + Status */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-[#3A4260] font-semibold flex items-center gap-1.5">
                      <ImageIcon size={12} />
                      Event Image
                    </label>
                    {form.event_image ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200">
                        <img
                          src={getImageUrl(form.event_image)}
                          alt="Event preview"
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, event_image: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-[#C41230] hover:bg-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#1A2744] bg-white transition-all">
                        <Upload size={24} className="text-[#7A85A0] mb-2" />
                        <span className="text-xs text-[#7A85A0] font-semibold">
                          {imageUploading ? 'Uploading...' : 'Click to upload image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value as EventStatus })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      >
                        {EVENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#C41230] focus:ring-[#C41230]"
                      />
                      <span className="text-sm font-semibold text-[#0E1525] flex items-center gap-1.5">
                        <Star size={14} className="text-[#C41230]" />
                        Feature this event
                      </span>
                    </label>
                  </div>
                </section>

                {/* Sponsors */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={12} className="text-[#C41230]" />
                      Sponsors
                    </h3>
                    <button
                      type="button"
                      onClick={addSponsor}
                      className="text-xs font-bold text-[#C41230] hover:text-[#9E0E27] flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Sponsor
                    </button>
                  </div>

                  {form.sponsors.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-[#7A85A0] font-medium">
                      No sponsors added yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.sponsors.map((sponsor, index) => (
                        <div
                          key={index}
                          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1A2744]">
                              Sponsor #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSponsor(index)}
                              className="p-1.5 text-[#C41230] hover:bg-[#C41230]/10 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-[#3A4260] font-semibold">Name *</label>
                              <input
                                type="text"
                                required
                                value={sponsor.name}
                                onChange={(e) => updateSponsor(index, { name: e.target.value })}
                                className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-[#3A4260] font-semibold">Tier *</label>
                              <select
                                value={sponsor.tier}
                                onChange={(e) =>
                                  updateSponsor(index, { tier: e.target.value as SponsorTier })
                                }
                                className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                              >
                                {SPONSOR_TIERS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-xs text-[#3A4260] font-semibold">Website</label>
                              <input
                                type="url"
                                value={sponsor.website}
                                onChange={(e) => updateSponsor(index, { website: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-xs text-[#3A4260] font-semibold">Logo *</label>
                              {sponsor.logo ? (
                                <div className="flex items-center gap-3">
                                  <img
                                    src={getImageUrl(sponsor.logo)}
                                    alt={sponsor.name || 'Sponsor logo'}
                                    className="w-14 h-14 rounded-lg object-contain border border-slate-200 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateSponsor(index, { logo: '' })}
                                    className="text-xs font-semibold text-[#C41230]"
                                  >
                                    Remove logo
                                  </button>
                                </div>
                              ) : (
                                <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#1A2744] bg-[#F0F2F7] transition-all">
                                  <Upload size={16} className="text-[#7A85A0]" />
                                  <span className="text-xs text-[#7A85A0] font-semibold">
                                    {sponsorUploadingIndex === index
                                      ? 'Uploading...'
                                      : 'Upload logo'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleSponsorLogoUpload(e, index)}
                                    disabled={sponsorUploadingIndex === index}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

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
                    disabled={
                      actionLoading ||
                      imageUploading ||
                      sponsorUploadingIndex !== null
                    }
                    className="bg-[#C41230] hover:bg-[#9E0E27] disabled:opacity-50 text-white font-bold text-sm px-8 py-2.5 rounded-xl shadow-lg shadow-[#C41230]/20 transition-all flex items-center gap-2"
                  >
                    {actionLoading ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
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
                    <h2 className="text-xl font-bold text-white">Event Preview</h2>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      How members will see this event.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-[#243260] rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#F0F2F7]">
                  {previewItem.event_image ? (
                    <img
                      src={getImageUrl(previewItem.event_image)}
                      alt={previewItem.event_name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-[#1A2744] flex items-center justify-center text-white/60">
                      <Calendar size={40} />
                    </div>
                  )}
                  <div className="p-6 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(previewItem.status)}
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1A2744]/10 text-[#1A2744] border border-[#1A2744]/20">
                        {previewItem.event_type}
                      </span>
                      {previewItem.is_featured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C41230]/10 text-[#C41230] border border-[#C41230]/20">
                          <Star size={10} fill="currentColor" />
                          Featured
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-[#0E1525] leading-tight">
                        {previewItem.event_name}
                      </h3>
                      {previewItem.teams_involved && (
                        <p className="text-sm text-[#3A4260] mt-2 font-medium flex items-center gap-1.5">
                          <Users size={14} />
                          {previewItem.teams_involved}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-xs">
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Date</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatEventDate(previewItem.event_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Time</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatTime(previewItem.start_time)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Venue</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {previewItem.venue_name}
                        </span>
                        {previewItem.venue_address && (
                          <span className="text-xs text-[#3A4260] mt-0.5 block">
                            {previewItem.venue_address}
                          </span>
                        )}
                        {previewItem.map_link && (
                          <a
                            href={previewItem.map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C41230] mt-1 hover:underline"
                          >
                            <MapPin size={12} />
                            Open map
                          </a>
                        )}
                      </div>
                    </div>

                    {previewItem.description && (
                      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                        <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider mb-2">
                          About
                        </h4>
                        <p className="text-sm text-[#3A4260] leading-relaxed whitespace-pre-wrap">
                          {previewItem.description}
                        </p>
                      </div>
                    )}

                    {(previewItem.sponsors?.length ?? 0) > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
                          Sponsors
                        </h4>
                        {sponsorsByTier(previewItem.sponsors).map(({ tier, items }) => (
                          <div
                            key={tier}
                            className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm"
                          >
                            <p className="text-[10px] font-bold text-[#7A85A0] uppercase tracking-wider mb-3">
                              {tier}
                            </p>
                            <div className="space-y-3">
                              {items.map((sponsor, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  {sponsor.logo ? (
                                    <img
                                      src={getImageUrl(sponsor.logo)}
                                      alt={sponsor.name}
                                      className="w-12 h-12 rounded-lg object-contain border border-slate-200 bg-white"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[#F0F2F7] border border-slate-200" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#0E1525] truncate">
                                      {sponsor.name}
                                    </p>
                                    {sponsor.website && (
                                      <a
                                        href={sponsor.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#C41230] font-semibold hover:underline truncate block"
                                      >
                                        {sponsor.website}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-xs">
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Created</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatDateTime(previewItem.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Last Updated</span>
                        <span className="text-sm font-semibold text-[#0E1525] mt-1 block">
                          {formatDateTime(previewItem.updated_at)}
                        </span>
                      </div>
                    </div>
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
                    ) : canPublish(previewItem.status) ? (
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
                <h3 className="text-lg font-bold text-[#0E1525]">Delete Event?</h3>
              </div>
              <p className="text-sm text-[#3A4260] leading-relaxed">
                This permanently removes{' '}
                <strong className="text-[#0E1525]">{deleteTarget.event_name}</strong> and any
                uploaded images. This cannot be undone.
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

export default Events;
