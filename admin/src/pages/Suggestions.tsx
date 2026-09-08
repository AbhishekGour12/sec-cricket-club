import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
  Archive,
  Search,
  Trash2,
  Pencil,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Filter,
  Check,
  X,
  Loader2,
  FileText,
  Building
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { getAdminMediaUrl } from '../utils/mediaUrl';
import { adminApi } from '../lib/api';
import { useToast } from '../components/Toast';

export type SuggestionType = 'Suggestion' | 'Complaint' | 'Feedback' | 'General';
export type SuggestionStatus = 'Pending' | 'Reviewed' | 'Resolved' | 'Archived';

interface MemberUser {
  id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  profile_image?: string | null;
  member_id?: string;
  company_name?: string;
  category?: string;
}

interface SuggestionItem {
  id: number;
  user_id?: number | null;
  type: SuggestionType;
  subject?: string | null;
  message: string;
  status: SuggestionStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  user?: MemberUser | null;
}

interface StatsData {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  archived: number;
  byType: {
    suggestion: number;
    complaint: number;
    feedback: number;
  };
}

export const Suggestions: React.FC = () => {
  const toast = useToast();

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    pending: 0,
    reviewed: 0,
    resolved: 0,
    archived: 0,
    byType: { suggestion: 0, complaint: 0, feedback: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action Modals State
  const [editingItem, setEditingItem] = useState<SuggestionItem | null>(null);
  const [newStatus, setNewStatus] = useState<SuggestionStatus>('Pending');
  const [adminNote, setAdminNote] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const res = await adminApi.get('/admin/suggestions/stats');
      setStats(res.data);
    } catch (err: any) {
      console.error('Failed to fetch suggestion stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 15,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedType !== 'All') params.type = selectedType;
      if (selectedStatus !== 'All') params.status = selectedStatus;

      const res = await adminApi.get('/admin/suggestions', { params });
      setSuggestions(res.data.suggestions || []);
      setTotalPages(res.data.pagination?.total_pages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Could not fetch member suggestions.',
        'Failed to load suggestions'
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedType, selectedStatus, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Handle Edit Status & Note Modal Open
  const handleOpenEdit = (item: SuggestionItem) => {
    setEditingItem(item);
    setNewStatus(item.status);
    setAdminNote(item.admin_notes || '');
  };

  // Submit Status / Note update
  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSubmittingAction(true);
      await adminApi.patch(`/admin/suggestions/${editingItem.id}/status`, {
        status: newStatus,
        admin_notes: adminNote,
      });

      toast.success(
        `Status set to "${newStatus}".`,
        'Suggestion Updated'
      );
      setEditingItem(null);
      fetchSuggestions();
      fetchStats();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Could not update suggestion status.',
        'Update Failed'
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await adminApi.delete(`/admin/suggestions/${deletingId}`);
      toast.success('Suggestion removed successfully.', 'Deleted');
      setDeletingId(null);
      fetchSuggestions();
      fetchStats();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Could not delete suggestion.',
        'Delete Failed'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (type: SuggestionType) => {
    switch (type) {
      case 'Complaint':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={13} className="text-rose-600" />
            Complaint
          </span>
        );
      case 'Suggestion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Lightbulb size={13} className="text-blue-600" />
            Suggestion
          </span>
        );
      case 'Feedback':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageSquare size={13} className="text-emerald-600" />
            Feedback
          </span>
        );
      case 'General':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText size={13} className="text-slate-500" />
            General
          </span>
        );
    }
  };

  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock size={13} className="text-amber-600" />
            Pending Review
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Check size={13} className="text-sky-600" />
            Reviewed
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Resolved
          </span>
        );
      case 'Archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive size={13} className="text-slate-500" />
            Archived
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A2744] flex items-center gap-2.5">
              <MessageSquare className="text-[#C41230]" size={26} />
              Member Suggestions & Complaints
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review, track, and resolve feedback submitted by club members.
            </p>
          </div>
          <button
            onClick={() => {
              fetchStats();
              fetchSuggestions();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Submissions
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <MessageSquare size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-[#1A2744] mt-2">
              {isStatsLoading ? '…' : stats.total}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              All time member inputs
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 rounded-2xl border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Pending Action
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900 mt-2">
              {isStatsLoading ? '…' : stats.pending}
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">
              Awaiting admin review
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-pink-50/40 p-5 rounded-2xl border border-rose-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Complaints
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-900 mt-2">
              {isStatsLoading ? '…' : stats.byType.complaint}
            </div>
            <div className="text-xs text-rose-700 font-medium mt-1">
              Priority issues reported
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Resolved
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-2">
              {isStatsLoading ? '…' : stats.resolved}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              Successfully addressed
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by member name, email, phone, or keyword..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Type & Status Selects */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Filter size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Suggestion">Suggestions</option>
                  <option value="Complaint">Complaints</option>
                  <option value="Feedback">Feedback</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Clock size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions Feed / Cards */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#C41230] mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No submissions found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedType !== 'All' || selectedStatus !== 'All'
                ? 'Try adjusting your search filters to find what you are looking for.'
                : 'No suggestions or complaints have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-4"
              >
                {/* Header: Member Info & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1A2744] to-[#243260] text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                      {item.user?.profile_image ? (
                        <img
                          src={getAdminMediaUrl(item.user.profile_image)}
                          alt={item.user?.full_name || 'Member'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {item.user?.full_name
                            ? item.user.full_name.charAt(0).toUpperCase()
                            : 'M'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#1A2744] text-base">
                          {item.user?.full_name || 'Anonymous Member'}
                        </h4>
                        {item.user?.member_id && (
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {item.user.member_id}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                        {item.user?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            {item.user.email}
                          </span>
                        )}
                        {item.user?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" />
                            {item.user.phone}
                          </span>
                        )}
                        {item.user?.company_name && (
                          <span className="inline-flex items-center gap-1">
                            <Building size={12} className="text-slate-400" />
                            {item.user.company_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    {getTypeBadge(item.type)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Content Body */}
                <div className="space-y-2">
                  {item.subject && (
                    <h5 className="text-sm font-bold text-slate-900">
                      {item.subject}
                    </h5>
                  )}
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    {item.message}
                  </p>
                </div>

                {/* Admin Notes Callout if present */}
                {item.admin_notes && (
                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 space-y-1">
                    <div className="font-bold text-sky-800 flex items-center gap-1.5">
                      <Check size={13} className="text-sky-600" />
                      Admin Internal Response / Action Notes:
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{item.admin_notes}</p>
                  </div>
                )}

                {/* Footer: Date & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock size={13} />
                    <span>
                      Submitted on {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#1A2744] hover:text-white text-slate-700 rounded-xl font-semibold transition-colors"
                    >
                      <Pencil size={13} />
                      Update Status / Note
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete submission"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-600">
                <div>
                  Showing page <span className="font-bold">{page}</span> of{' '}
                  <span className="font-bold">{totalPages}</span> ({totalCount} total)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Update Status & Admin Note Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Pencil size={18} className="text-[#C41230]" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Update Suggestion Status
                  </h3>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Current Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Pending', 'Reviewed', 'Resolved', 'Archived'] as SuggestionStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                            newStatus === st
                              ? 'bg-[#1A2744] text-white border-[#1A2744] shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Internal Admin Notes / Action Taken
                  </label>
                  <textarea
                    rows={4}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter notes on actions taken or communication with member..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
                  />
                  <span className="text-[11px] text-slate-400">
                    Use this space to document follow-ups, committee reviews, or resolution details.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#C41230] hover:bg-[#A30F28] rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSubmittingAction ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Delete Submission</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete this suggestion? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Suggestions;
