import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Globe, 
  CreditCard,
  User as UserIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Upload,
  Download,
  Plus,
  Pencil,
  Trash2,
  Star,
  Instagram,
  Facebook,
  Linkedin,
  EyeOff,
  Image as ImageIcon
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { MemberEditModal, Achievement, PrivacySettings } from '../components/MemberEditModal';

interface BusinessFlyer {
  id: number;
  user_id: number;
  image_url: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

interface Member {
  id: number;
  firebase_uid: string;
  /** Nullable: bulk-imported members are keyed on mobile number. */
  email?: string | null;
  full_name?: string;
  profile_image?: string;
  phone?: string;
  alternate_phone?: string;
  contact_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  achievements?: Achievement[];
  privacy_settings?: PrivacySettings;
  membership_number?: string;
  designation?: string;
  business_name?: string;
  business_category?: string;
  business_description?: string;
  business_address?: string;
  business_logo?: string;
  visiting_card?: string;
  business_images?: string[];
  business_flyers?: BusinessFlyer[];
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  role: 'member' | 'admin' | 'moderator';
  is_profile_completed: boolean;
  created_at: string;
}

const PRESET_CATEGORIES = [
  'Manufacturing & Production',
  'Technology & IT',
  'Retail & Commerce',
  'Services & Consulting',
  'Healthcare & Medicine',
  'Real Estate & Construction',
  'Finance & Banking',
  'Education & Training',
  'Food & Hospitality',
  'Agriculture',
  'Others',
];

export const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected' | 'import' | 'add'>('approved');
  
  // Day 4 Specific States
  const [memberToApprove, setMemberToApprove] = useState<Member | null>(null);
  const [memberToReject, setMemberToReject] = useState<Member | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Profile administration
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Manual Member Form States
  const [manualForm, setManualForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    membership_number: '',
    designation: 'Associate Member',
    business_name: '',
    business_category: '',
    city: '',
    state: '',
    country: '',
    status: 'active', // active / inactive
    approval_status: 'approved', // approved / pending
  });
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Spreadsheet import pipeline state
  interface ValidatedRow {
    rowNumber: number;
    full_name: string;
    phone: string;
    email: string;
    business_name: string;
    business_description: string;
    business_category: string;
    business_address: string;
    city: string;
    instagram_url: string;
    facebook_url: string;
    linkedin_url: string;
    designation: string;
    errors: string[];
    action: 'create' | 'update' | 'skip';
  }

  interface ValidationReport {
    mode: 'create_only' | 'create_update';
    summary: {
      total: number;
      valid: number;
      errors: number;
      toCreate: number;
      toUpdate: number;
      toSkip: number;
    };
    rows: ValidatedRow[];
  }

  const [rawRows, setRawRows] = useState<any[] | null>(null);
  const [importReport, setImportReport] = useState<ValidationReport | null>(null);
  const [importMode, setImportMode] = useState<'create_only' | 'create_update'>('create_only');
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
  const token = localStorage.getItem('admin_jwt');

  // Synchronize Tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending') setActiveTab('pending');
    else if (tabParam === 'rejected') setActiveTab('rejected');
    else if (tabParam === 'import') setActiveTab('import');
    else if (tabParam === 'add') setActiveTab('add');
    else setActiveTab('approved');
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Re-fetch members when tab, page, or filters change
  useEffect(() => {
    fetchMembers();
  }, [page, categoryFilter, activeTab]);

  // Members can edit their own profile from the app at any time, so refresh
  // whenever the admin returns to this tab.
  useEffect(() => {
    const onFocus = () => {
      if (activeTab !== 'add' && activeTab !== 'import') fetchMembers();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [activeTab, page, categoryFilter, search]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiURL}/members/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.categories || []);
    } catch (err: any) {
      // Sanitized error handling
    }
  };

  const fetchMembers = async () => {
    if (activeTab === 'add' || activeTab === 'import') {
      setIsLoading(false);
      setTotal(0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let fetchedList: Member[] = [];
      
      if (activeTab === 'pending') {
        const response = await axios.get(`${apiURL}/admin/pending-members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchedList = response.data.members || [];
      } else {
        const response = await axios.get(`${apiURL}/admin/auth/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allMembers = response.data.members || [];
        if (activeTab === 'approved') {
          fetchedList = allMembers.filter((m: any) => m.approval_status === 'approved');
        } else {
          fetchedList = allMembers.filter((m: any) => m.approval_status === 'rejected');
        }
      }

      // Apply client-side search & category filtering
      let filtered = [...fetchedList];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(m => 
          (m.full_name || '').toLowerCase().includes(s) ||
          (m.email || '').toLowerCase().includes(s) ||
          (m.business_name || '').toLowerCase().includes(s) ||
          (m.business_category || '').toLowerCase().includes(s) ||
          (m.membership_number || '').toLowerCase().includes(s)
        );
      }
      if (categoryFilter) {
        filtered = filtered.filter(m => m.business_category === categoryFilter);
      }

      setTotal(filtered.length);
      const itemsPerPage = 10;
      setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
      
      const startIndex = (page - 1) * itemsPerPage;
      setMembers(filtered.slice(startIndex, startIndex + itemsPerPage));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load members.');
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * Opens the detail drawer. The row we already have is shown immediately, then
   * replaced with a fresh read so edits made from the member's phone are never
   * missed because of a stale list.
   */
  const openMemberDrawer = async (member: Member) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
    try {
      const response = await axios.get(`${apiURL}/admin/auth/members/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fresh = response.data.member;
      if (fresh) {
        setSelectedMember(fresh);
        setMembers((current) => current.map((m) => (m.id === fresh.id ? { ...m, ...fresh } : m)));
      }
    } catch {
      // Keep the row snapshot on screen if the refresh call fails.
    }
  };

  /** Always edit against the newest server copy, never a cached table row. */
  const openMemberEditor = async (member: Member) => {
    try {
      const response = await axios.get(`${apiURL}/admin/auth/members/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMemberToEdit(response.data.member ?? member);
    } catch {
      setMemberToEdit(member);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setPage(1);
    setTimeout(() => {
      fetchMembers();
    }, 0);
  };

  const handleApproveConfirm = async () => {
    if (!memberToApprove) return;
    setActionLoading(true);
    try {
      await axios.post(
        `${apiURL}/admin/member/${memberToApprove.id}/approve`,
        { confirm: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMemberToApprove(null);
      fetchMembers();
      setIsDrawerOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToReject) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      alert('Rejection reason must be at least 5 characters long.');
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(
        `${apiURL}/admin/member/${memberToReject.id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMemberToReject(null);
      setRejectionReason('');
      fetchMembers();
      setIsDrawerOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    setActionLoading(true);
    try {
      const response = await axios.delete(`${apiURL}/admin/member/${memberToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMemberToDelete(null);
      setIsDrawerOpen(false);
      setSelectedMember(null);
      setImportSuccess(response.data.message || 'Member deleted.');
      fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete the member.');
      setMemberToDelete(null);
    } finally {
      setActionLoading(false);
    }
  };

  // 1. Single Manual Member Form Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setManualSuccess(null);
    setError(null);
    try {
      const submitPayload = { ...manualForm };
      if (submitPayload.business_category === 'Others' && customCategoryInput.trim()) {
        submitPayload.business_category = customCategoryInput.trim();
      }
      const response = await axios.post(
        `${apiURL}/admin/members/create-manual`,
        submitPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setManualSuccess(response.data.message || 'Member Created Successfully!');
      setCustomCategoryInput('');
      // Reset form
      setManualForm({
        full_name: '',
        email: '',
        phone: '',
        membership_number: '',
        designation: 'Associate Member',
        business_name: '',
        business_category: '',
        city: '',
        state: '',
        country: '',
        status: 'active',
        approval_status: 'approved',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create manual member.');
    } finally {
      setActionLoading(false);
    }
  };

  const saveBlob = (data: BlobPart, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // 2. Download the server-generated template (single source of truth)
  const downloadTemplate = async () => {
    setError(null);
    try {
      const response = await axios.get(`${apiURL}/admin/members/import-template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      saveBlob(response.data, 'sec_member_import_template.csv');
    } catch {
      setError('Failed to download the import template.');
    }
  };

  // 3. Parse the chosen spreadsheet, then ask the server to validate it
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSuccess(null);
    setError(null);

    if (file.size > 10 * 1024 * 1024) {
      setError('Maximum file size limit of 10 MB exceeded.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        if (data.length === 0) {
          setError('The selected file has no data rows.');
          return;
        }
        if (data.length > 5000) {
          setError('Maximum spreadsheet limit of 5,000 rows exceeded.');
          return;
        }

        setRawRows(data);
        validateImport(data, importMode);
      } catch {
        setError('Failed to parse the spreadsheet. Please upload a valid CSV, XLS, or XLSX file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateImport = async (rows: any[], mode: 'create_only' | 'create_update') => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await axios.post<ValidationReport>(
        `${apiURL}/admin/members/import/validate`,
        { rows, mode },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setImportReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate the spreadsheet.');
      setImportReport(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModeChange = (mode: 'create_only' | 'create_update') => {
    setImportMode(mode);
    // Duplicate handling differs per mode, so re-validate against the server.
    if (rawRows) validateImport(rawRows, mode);
  };

  const downloadErrorReport = async () => {
    if (!rawRows) return;
    try {
      const response = await axios.post(
        `${apiURL}/admin/members/import/error-report`,
        { rows: rawRows, mode: importMode },
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' },
      );
      saveBlob(response.data, 'sec_member_import_errors.csv');
    } catch {
      setError('Failed to download the error report.');
    }
  };

  const resetImport = () => {
    setRawRows(null);
    setImportReport(null);
    const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // 4. Commit — the server re-validates and writes in a single transaction
  const handleBulkImportSubmit = async () => {
    if (!rawRows || !importReport || importReport.summary.errors > 0) return;

    setActionLoading(true);
    setError(null);
    setImportSuccess(null);

    try {
      const response = await axios.post(
        `${apiURL}/admin/members/import/commit`,
        { rows: rawRows, mode: importMode },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setImportSuccess(response.data.message);
      resetImport();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete the import. No members were changed.');
      if (err.response?.status === 422 && err.response.data?.rows) {
        setImportReport(err.response.data as ValidationReport);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100';
    const trimmedPath = String(path).trim();
    if (!trimmedPath) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100';
    if (trimmedPath.startsWith('http')) return trimmedPath;
    const baseURL = apiURL.replace('/api', '');
    const cleanPath = trimmedPath.startsWith('/') ? trimmedPath : '/' + trimmedPath;
    return `${baseURL}${cleanPath}`;
  };

  const getVisitingCards = (visitingCardString?: string): string[] => {
    if (!visitingCardString) return [];
    const trimmed = visitingCardString.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // Fallback
      }
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleDeleteBusinessFlyer = async (flyerId: number) => {
    if (!selectedMember) return;
    if (!window.confirm('Delete this business flyer? This cannot be undone.')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('admin_jwt');
      await axios.delete(
        `${apiURL}/admin/member/${selectedMember.id}/business-flyers/${flyerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedMember({
        ...selectedMember,
        business_flyers: (selectedMember.business_flyers || []).filter((f) => f.id !== flyerId),
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete business flyer');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadImage = (path: string, fileName: string) => {
    const url = getImageUrl(path);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const getStatusBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={12} className="mr-1" />
            Verified Member
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={12} className="mr-1" />
            Registration Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={12} className="mr-1" />
            Pending Approval
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 relative min-h-screen pb-20 text-[#0E1525]">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight">Members Workflow</h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">Review, approve, and manage registered members verification status.</p>
          </div>
          <div className="bg-white px-4 py-2 border border-slate-200 shadow-sm rounded-xl">
            <span className="text-xs text-[#7A85A0] font-bold uppercase tracking-wider">Total Listings</span>
            <p className="text-lg font-extrabold text-[#1A2744]">{total}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-slate-200 gap-6">
          <button 
            onClick={() => { setActiveTab('approved'); setPage(1); setSearchParams({ tab: 'approved' }); }}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'approved' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            Approved Members
            {activeTab === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>
          <button 
            onClick={() => { setActiveTab('pending'); setPage(1); setSearchParams({ tab: 'pending' }); }}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'pending' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            Pending Approvals
            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>
          <button 
            onClick={() => { setActiveTab('rejected'); setPage(1); setSearchParams({ tab: 'rejected' }); }}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'rejected' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            Rejected Applications
            {activeTab === 'rejected' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>
          <button 
            onClick={() => { setActiveTab('import'); setPage(1); setSearchParams({ tab: 'import' }); }}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'import' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            Import Members
            {activeTab === 'import' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>
          <button 
            onClick={() => { setActiveTab('add'); setPage(1); setSearchParams({ tab: 'add' }); }}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'add' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            Add Member
            {activeTab === 'add' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>
        </div>

        {/* Filter Controls Row - Hidden on Add/Import Tabs */}
        {activeTab !== 'add' && activeTab !== 'import' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-3.5 text-[#7A85A0]" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, business, category, or membership..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-[#0E1525] placeholder-[#7A85A0] focus:outline-none focus:border-[#C41230] transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0E1525] font-medium focus:outline-none focus:border-[#C41230] min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
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
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Approved and Rejected Members Tab Tables */}
        {(activeTab === 'approved' || activeTab === 'rejected') && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#243260] text-xs font-bold text-white uppercase tracking-wider bg-[#1A2744]">
                    <th className="py-4 px-6">Photo</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Business Detail</th>
                    <th className="py-4 px-6">Status Badge</th>
                    {activeTab === 'approved' && <th className="py-4 px-6">Approved Info</th>}
                    {activeTab === 'rejected' && <th className="py-4 px-6">Reason / Actions</th>}
                    <th className="py-4 px-6 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#3A4260] text-sm">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2"></div>
                        <p>Loading members...</p>
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#3A4260] text-sm font-medium">
                        No members matching the criteria were found.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr 
                        key={member.id}
                        onClick={() => openMemberDrawer(member)}
                        className="group hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6">
                          <img 
                            src={getImageUrl(member.profile_image)} 
                            alt={member.full_name || 'Member'}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-[#1A2744] transition-colors"
                          />
                        </td>
                        <td className="py-4 px-6 font-semibold text-[#0E1525] group-hover:text-[#C41230] transition-colors">
                          {member.full_name || 'Incomplete Profile'}
                          <p className="text-xs text-[#7A85A0] font-normal">
                            {member.email || member.phone || 'No contact on file'}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#3A4260]">
                          <div className="font-semibold text-[#0E1525]">{member.business_name || 'N/A'}</div>
                          <div className="text-xs text-[#7A85A0]">{member.business_category || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(member.approval_status)}
                        </td>
                        {activeTab === 'approved' && (
                          <td className="py-4 px-6 text-xs text-[#7A85A0]">
                            <div>Approved By ID: {member.approved_by || 'Admin'}</div>
                            <div>{member.approved_at ? new Date(member.approved_at).toLocaleDateString() : 'N/A'}</div>
                          </td>
                        )}
                        {activeTab === 'rejected' && (
                          <td className="py-4 px-6 text-xs text-[#7A85A0]" onClick={(e) => e.stopPropagation()}>
                            <div className="max-w-[200px] truncate text-red-600 font-semibold mb-2" title={member.rejection_reason}>
                              {member.rejection_reason || 'No reason provided'}
                            </div>
                            <button
                              onClick={() => setMemberToApprove(member)}
                              className="inline-flex items-center gap-1 bg-[#1A2744]/10 hover:bg-[#1A2744]/20 text-[#1A2744] px-3 py-1.5 rounded-lg border border-[#1A2744]/20 font-bold transition-all text-[11px]"
                            >
                              <RotateCcw size={12} />
                              Restore & Approve
                            </button>
                          </td>
                        )}
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openMemberEditor(member)}
                              title="Edit member profile"
                              aria-label={`Edit ${member.full_name || member.email}`}
                              className="p-2 rounded-lg border border-slate-200 text-[#1A2744] hover:bg-slate-100 transition-all"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setMemberToDelete(member)}
                              title="Delete member"
                              aria-label={`Delete ${member.full_name || member.email}`}
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
            {/* Pagination Footer */}
            {!isLoading && totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-[#F0F2F7] text-sm">
                <span className="text-[#3A4260]">
                  Showing Page <span className="text-[#0E1525] font-bold">{page}</span> of <span className="text-[#0E1525] font-bold">{totalPages}</span>
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
        )}

        {/* Pending Approval Tab Cards */}
        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-[#3A4260] text-sm">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2"></div>
                <p>Loading pending reviews...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[#3A4260] text-sm bg-white border border-slate-200 shadow-sm rounded-2xl font-medium">
                No pending registrations require review.
              </div>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-[#1A2744]/30 transition-all hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Member Top Info Card */}
                    <div className="flex items-center space-x-3.5">
                      <img 
                        src={getImageUrl(member.profile_image)} 
                        alt={member.full_name} 
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[#0E1525] truncate text-base">{member.full_name || 'Incomplete Profile'}</h4>
                        <p className="text-xs text-[#7A85A0] truncate">
                          {member.email || member.phone || 'No contact on file'}
                        </p>
                      </div>
                    </div>

                    {/* Meta Fields */}
                    <div className="bg-[#F0F2F7] p-3.5 border border-slate-200/60 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#7A85A0] font-bold uppercase text-[9px]">Business</span>
                        <span className="text-[#0E1525] truncate max-w-[150px] font-semibold">{member.business_name || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A85A0] font-bold uppercase text-[9px]">Category</span>
                        <span className="text-[#0E1525] font-semibold">{member.business_category || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A85A0] font-bold uppercase text-[9px]">Submitted</span>
                        <span className="text-[#3A4260] font-mono">{new Date(member.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-2.5 mt-5">
                    <button
                      onClick={() => openMemberDrawer(member)}
                      className="flex-1 border border-slate-300 hover:bg-slate-100 text-[#1A2744] font-semibold text-xs py-2.5 rounded-xl transition-all"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => setMemberToApprove(member)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <ThumbsUp size={13} />
                      Approve
                    </button>
                    <button
                      onClick={() => setMemberToReject(member)}
                      className="flex-1 bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <ThumbsDown size={13} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Member Tab Form */}
        {activeTab === 'add' && (
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-[#0E1525] mb-6">Add New Club Member</h2>
            {manualSuccess && (
              <div className="mb-6 bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
                {manualSuccess}
              </div>
            )}
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#1A2744] uppercase tracking-wider">Basic Information</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={manualForm.full_name}
                      onChange={e => setManualForm({...manualForm, full_name: e.target.value})}
                      className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Email *</label>
                    <input 
                      type="email" 
                      required
                      value={manualForm.email}
                      onChange={e => setManualForm({...manualForm, email: e.target.value})}
                      className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Mobile Number</label>
                    <input 
                      type="text" 
                      value={manualForm.phone}
                      onChange={e => setManualForm({...manualForm, phone: e.target.value})}
                      className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Membership Number *</label>
                    <input 
                      type="text" 
                      required
                      value={manualForm.membership_number}
                      onChange={e => setManualForm({...manualForm, membership_number: e.target.value})}
                      className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Designation</label>
                    <input 
                      type="text" 
                      value={manualForm.designation}
                      onChange={e => setManualForm({...manualForm, designation: e.target.value})}
                      className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#1A2744] uppercase tracking-wider">Business & Listing details</h3>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Business Name *</label>
                    <input 
                      type="text" 
                      required
                      value={manualForm.business_name}
                      onChange={e => setManualForm({...manualForm, business_name: e.target.value})}
                      className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#3A4260] font-semibold">Business Category *</label>
                    <select 
                      required
                      value={manualForm.business_category}
                      onChange={e => setManualForm({...manualForm, business_category: e.target.value})}
                      className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                    >
                      <option value="">Select Category</option>
                      {Array.from(new Set([...PRESET_CATEGORIES, ...categories])).map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {manualForm.business_category === 'Others' && (
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Specify Custom Category *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter custom category"
                        value={customCategoryInput}
                        onChange={e => setCustomCategoryInput(e.target.value)}
                        className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#7A85A0] font-bold uppercase">City</label>
                      <input 
                        type="text" 
                        value={manualForm.city}
                        onChange={e => setManualForm({...manualForm, city: e.target.value})}
                        className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#7A85A0] font-bold uppercase">State</label>
                      <input 
                        type="text" 
                        value={manualForm.state}
                        onChange={e => setManualForm({...manualForm, state: e.target.value})}
                        className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#7A85A0] font-bold uppercase">Country</label>
                      <input 
                        type="text" 
                        value={manualForm.country}
                        onChange={e => setManualForm({...manualForm, country: e.target.value})}
                        className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0E1525] focus:outline-none focus:border-[#C41230]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Visibility Status</label>
                      <select 
                        value={manualForm.status}
                        onChange={e => setManualForm({...manualForm, status: e.target.value})}
                        className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0E1525] focus:outline-none"
                      >
                        <option value="active">Active (Visible)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#3A4260] font-semibold">Approval Status</label>
                      <select 
                        value={manualForm.approval_status}
                        onChange={e => setManualForm({...manualForm, approval_status: e.target.value})}
                        className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0E1525] focus:outline-none"
                      >
                        <option value="approved">Approved (Verified)</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#C41230] hover:bg-[#9E0E27] disabled:opacity-50 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-[#C41230]/20 transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  {actionLoading ? 'Saving Record...' : 'Create Member Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Import Members Tab Spreadsheets Console */}
        {activeTab === 'import' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Guidelines Card */}
            <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0E1525] flex items-center gap-2">
                    <Download size={18} className="text-[#C41230]" />
                    Excel & Spreadsheet Guidelines
                  </h3>
                  <p className="text-xs text-[#3A4260] mt-1 font-medium">Ensure format match before uploading rosters.</p>
                </div>
                <button 
                  onClick={downloadTemplate}
                  className="bg-[#1A2744]/10 border border-[#1A2744]/20 hover:bg-[#1A2744]/20 text-[#1A2744] font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Download Import Template
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#3A4260] leading-relaxed border-t border-slate-200 pt-4">
                <div>
                  <span className="font-bold text-[#0E1525] block mb-1">Supported Formats</span>
                  <p>CSV, XLS, XLSX — max 10 MB, up to 5,000 rows.</p>
                </div>
                <div>
                  <span className="font-bold text-[#0E1525] block mb-1">Required Columns</span>
                  <p>
                    <strong>Full Name</strong> and <strong>Mobile Number</strong> are required.
                    Email, Business Name, Nature of Business, Industry Category, Business Address,
                    City, Instagram, Facebook, LinkedIn and Designation are optional.
                  </p>
                </div>
                <div className="md:col-span-2 bg-[#F0F2F7] border border-slate-200 rounded-xl p-3">
                  <span className="font-bold text-[#0E1525] block mb-1">All-or-nothing imports</span>
                  <p>
                    Every row is validated before anything is written. If any row fails, nothing is
                    imported — download the error report, fix the rows, and upload again.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            {!importReport && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-10 flex flex-col items-center justify-center border-dashed border-2 hover:border-[#1A2744] transition-all shadow-sm">
                <Upload size={48} className="text-[#7A85A0] mb-4" />
                <span className="font-bold text-[#0E1525] text-sm">Upload Spreadsheet File</span>
                <span className="text-xs text-[#7A85A0] mt-1 mb-6">Select a .csv, .xls, or .xlsx file to preview</span>
                
                <input 
                  id="excel-file-input"
                  type="file" 
                  accept=".csv, .xls, .xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById('excel-file-input')?.click()}
                  className="bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-[#C41230]/20 transition-all"
                >
                  Choose File
                </button>
              </div>
            )}

            {/* Validation Report & Preview */}
            {importReport && (
              <div className="space-y-6">
                {/* Summary banner */}
                <div
                  className={`p-4 rounded-xl text-sm font-semibold border ${
                    importReport.summary.errors > 0
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {importReport.summary.valid} rows valid, {importReport.summary.errors} rows with errors.
                  {importReport.summary.errors > 0
                    ? ' Fix the highlighted rows and upload again — nothing has been imported.'
                    : ' Review the preview below and confirm to commit.'}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <span className="text-[10px] text-[#7A85A0] font-bold uppercase">Total Rows</span>
                    <p className="text-2xl font-bold text-[#0E1525] mt-1">{importReport.summary.total}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl border-l-4 border-l-emerald-500 shadow-sm">
                    <span className="text-[10px] text-[#7A85A0] font-bold uppercase">Valid</span>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{importReport.summary.valid}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl border-l-4 border-l-red-500 shadow-sm">
                    <span className="text-[10px] text-[#7A85A0] font-bold uppercase">Errors</span>
                    <p className="text-2xl font-bold text-red-600 mt-1">{importReport.summary.errors}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl border-l-4 border-l-[#1A2744] shadow-sm">
                    <span className="text-[10px] text-[#7A85A0] font-bold uppercase">Will Create</span>
                    <p className="text-2xl font-bold text-[#1A2744] mt-1">{importReport.summary.toCreate}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl border-l-4 border-l-amber-500 shadow-sm">
                    <span className="text-[10px] text-[#7A85A0] font-bold uppercase">
                      {importMode === 'create_update' ? 'Will Update' : 'Will Skip'}
                    </span>
                    <p className="text-2xl font-bold text-amber-700 mt-1">
                      {importMode === 'create_update'
                        ? importReport.summary.toUpdate
                        : importReport.summary.toSkip}
                    </p>
                  </div>
                </div>

                {/* Import mode */}
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <span className="font-bold text-sm text-[#0E1525]">Import Mode</span>
                    <p className="text-xs text-[#3A4260] mt-1 font-medium">
                      Existing members are matched by mobile number.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleModeChange('create_only')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        importMode === 'create_only'
                          ? 'bg-[#C41230] text-white shadow-md'
                          : 'bg-[#F0F2F7] text-[#1A2744] hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      Create Only
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('create_update')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        importMode === 'create_update'
                          ? 'bg-[#C41230] text-white shadow-md'
                          : 'bg-[#F0F2F7] text-[#1A2744] hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      Create &amp; Update
                    </button>
                  </div>
                </div>

                {/* Preview table */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-[#F0F2F7]">
                    <span className="font-bold text-xs text-[#0E1525]">Preview Before Commit</span>
                    <span className="text-[10px] text-[#7A85A0]">
                      Showing first 100 of {importReport.summary.total} rows
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0">
                        <tr className="border-b border-[#243260] font-bold text-white uppercase bg-[#1A2744]">
                          <th className="py-3 px-4">Row</th>
                          <th className="py-3 px-4">Full Name</th>
                          <th className="py-3 px-4">Mobile</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Business</th>
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importReport.rows.slice(0, 100).map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={row.errors.length > 0 ? 'bg-red-50/60' : 'hover:bg-slate-50'}
                          >
                            <td className="py-3 px-4 font-mono text-[#7A85A0]">{row.rowNumber}</td>
                            <td className="py-3 px-4 text-[#0E1525] font-semibold">
                              {row.full_name || <span className="text-red-500 italic">Missing</span>}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#3A4260]">
                              {row.phone || <span className="text-red-500 italic">Missing</span>}
                            </td>
                            <td className="py-3 px-4 text-[#3A4260]">{row.email || '—'}</td>
                            <td className="py-3 px-4 text-[#3A4260]">{row.business_name || '—'}</td>
                            <td className="py-3 px-4">
                              {row.errors.length > 0 ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold text-[9px]">
                                  Error
                                </span>
                              ) : row.action === 'create' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[9px]">
                                  Create
                                </span>
                              ) : row.action === 'update' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[9px]">
                                  Update
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[9px]">
                                  Skip
                                </span>
                              )}
                            </td>
                            <td
                              className="py-3 px-4 text-red-600 max-w-[260px] truncate"
                              title={row.errors.join(' ')}
                            >
                              {row.errors.join(' ') || <span className="text-[#7A85A0]">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-200 bg-[#F0F2F7] flex flex-wrap justify-end gap-3">
                    <button
                      onClick={resetImport}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-[#1A2744] hover:bg-white"
                    >
                      Cancel / Reset
                    </button>
                    {importReport.summary.errors > 0 && (
                      <button
                        onClick={downloadErrorReport}
                        className="px-4 py-2 border border-[#C41230]/30 text-[#C41230] rounded-xl text-xs font-bold hover:bg-[#C41230]/10 flex items-center gap-1.5"
                      >
                        <Download size={14} />
                        Download Error Report
                      </button>
                    )}
                    <button
                      onClick={handleBulkImportSubmit}
                      disabled={actionLoading || importReport.summary.errors > 0}
                      className="bg-[#C41230] hover:bg-[#9E0E27] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-2 rounded-xl shadow-lg"
                    >
                      {actionLoading
                        ? 'Committing Import...'
                        : `Confirm Import (${importReport.summary.toCreate} new, ${
                            importMode === 'create_update'
                              ? `${importReport.summary.toUpdate} updated`
                              : `${importReport.summary.toSkip} skipped`
                          })`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {importSuccess && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
                {importSuccess}
              </div>
            )}
          </div>
        )}

        {/* Member Details Sliding Drawer */}
        {isDrawerOpen && selectedMember && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div 
              className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <div className="w-screen max-w-xl bg-white border-l border-slate-200 text-[#0E1525] flex flex-col justify-between shadow-2xl relative">
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-200 bg-[#1A2744] text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Member Profile Details</h2>
                    <p className="text-xs text-slate-300 mt-1 font-medium">Verify business listing & uploads details.</p>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-[#243260] rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Body Scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F0F2F7]">
                  {/* Top Header Card */}
                  <div className="flex items-center space-x-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
                    <img 
                      src={getImageUrl(selectedMember.profile_image)} 
                      alt={selectedMember.full_name} 
                      className="w-20 h-20 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0E1525]">{selectedMember.full_name || 'Incomplete Profile'}</h3>
                      <p className="text-sm text-[#C41230] font-bold">{selectedMember.designation || 'Club Member'}</p>
                      <div className="mt-2 flex gap-2">
                        {getStatusBadge(selectedMember.approval_status)}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1A2744] text-white border border-[#243260]">
                          {selectedMember.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Credentials */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider flex items-center gap-2">
                      <UserIcon size={14} className="text-[#C41230]" />
                      Contact & Club Credentials
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Email Address</span>
                        <span className="text-sm font-semibold text-[#0E1525] flex items-center mt-1">
                          <Mail size={12} className="mr-1.5 text-[#7A85A0]" />
                          {selectedMember.email || 'Not Provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Phone Number</span>
                        <span className="text-sm font-semibold text-[#0E1525] flex items-center mt-1">
                          <Phone size={12} className="mr-1.5 text-[#7A85A0]" />
                          {selectedMember.phone || 'Not Provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Membership ID Number</span>
                        <span className="text-sm font-mono font-bold text-[#1A2744] flex items-center mt-1">
                          <CreditCard size={12} className="mr-1.5 text-[#7A85A0]" />
                          {selectedMember.membership_number || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Location (Address)</span>
                        <span className="text-sm font-semibold text-[#0E1525] flex items-center mt-1">
                          <MapPin size={12} className="mr-1.5 text-[#7A85A0]" />
                          {[selectedMember.city, selectedMember.state, selectedMember.country].filter(Boolean).join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Business Profile */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider flex items-center gap-2">
                      <Building size={14} className="text-[#C41230]" />
                      Business Professional Details
                    </h4>
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Company Name</span>
                          <span className="text-sm font-bold text-[#0E1525] mt-1 block">
                            {selectedMember.business_name || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Industry Category</span>
                          <span className="text-sm font-semibold text-[#3A4260] mt-1 block">
                            {selectedMember.business_category || 'N/A'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Website URL</span>
                          {selectedMember.website ? (
                            <a 
                              href={selectedMember.website.startsWith('http') ? selectedMember.website : `https://${selectedMember.website}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-[#C41230] hover:underline flex items-center mt-1"
                            >
                              <Globe size={12} className="mr-1.5" />
                              {selectedMember.website}
                            </a>
                          ) : (
                            <span className="text-sm text-[#7A85A0] block mt-1">None Provided</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block">Business Description</span>
                        <p className="text-sm text-[#3A4260] mt-1.5 leading-relaxed bg-[#F0F2F7] p-3 rounded-lg border border-slate-200">
                          {selectedMember.business_description || 'No business description provided.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Club Accomplishments & Awards */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider flex items-center gap-2">
                      <Star size={14} className="text-[#C41230]" />
                      Club Accomplishments &amp; Awards
                    </h4>
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-2">
                      {selectedMember.achievements && selectedMember.achievements.length > 0 ? (
                        selectedMember.achievements.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-[#FFFBF2] border border-[#F5E4C3] rounded-lg px-3 py-2.5"
                          >
                            <Star size={14} className="text-amber-500 shrink-0" />
                            <span className="text-sm font-semibold text-[#0E1525] flex-1">
                              {item.title}
                            </span>
                            {item.year && (
                              <span className="text-xs text-[#7A85A0] font-mono">{item.year}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#7A85A0] italic py-2">
                          No accomplishments added by this member.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact & Social Links */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider flex items-center gap-2">
                      <Globe size={14} className="text-[#C41230]" />
                      Contact &amp; Social Links
                    </h4>
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {([
                        { label: 'Alternate Phone', value: selectedMember.alternate_phone, key: 'alternate_phone', icon: <Phone size={12} /> },
                        { label: 'Contact Email', value: selectedMember.contact_email, key: 'contact_email', icon: <Mail size={12} /> },
                        { label: 'Instagram', value: selectedMember.instagram_url, key: 'instagram_url', icon: <Instagram size={12} /> },
                        { label: 'Facebook', value: selectedMember.facebook_url, key: 'facebook_url', icon: <Facebook size={12} /> },
                        { label: 'LinkedIn', value: selectedMember.linkedin_url, key: 'linkedin_url', icon: <Linkedin size={12} /> },
                      ] as const).map((row) => {
                        const hidden = selectedMember.privacy_settings?.[row.key] === 'hidden';
                        return (
                          <div key={row.key}>
                            <span className="text-[10px] text-[#7A85A0] font-bold uppercase flex items-center gap-1.5">
                              {row.label}
                              {hidden && (
                                <span className="inline-flex items-center gap-1 text-[9px] text-[#7A85A0] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                                  <EyeOff size={9} />
                                  Hidden
                                </span>
                              )}
                            </span>
                            <span className="text-sm font-semibold text-[#0E1525] flex items-center gap-1.5 mt-1 break-all">
                              <span className="text-[#7A85A0]">{row.icon}</span>
                              {row.value || 'Not provided'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Uploaded Assets */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
                      Business Verification Cards & Assets
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Logo */}
                      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block mb-2">Corporate Logo</span>
                        {selectedMember.business_logo ? (
                          <img 
                            src={getImageUrl(selectedMember.business_logo)} 
                            alt="Business Logo" 
                            className="w-full h-32 object-contain bg-[#F0F2F7] border border-slate-200 rounded-lg p-2"
                          />
                        ) : (
                          <div className="h-32 rounded-lg bg-[#F0F2F7] border border-slate-200 flex items-center justify-center text-xs text-[#7A85A0] italic">
                            No Logo Uploaded
                          </div>
                        )}
                      </div>

                      {/* Visiting Card */}
                      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase block mb-2">Visiting Card</span>
                        {getVisitingCards(selectedMember.visiting_card).length > 0 ? (
                          <div className="space-y-2">
                            {getVisitingCards(selectedMember.visiting_card).map((cardPath, cIdx) => (
                              <img 
                                key={cIdx}
                                src={getImageUrl(cardPath)} 
                                alt={`Visiting Card ${cIdx + 1}`} 
                                className="w-full h-32 object-cover bg-[#F0F2F7] border border-slate-200 rounded-lg"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="h-32 rounded-lg bg-[#F0F2F7] border border-slate-200 flex items-center justify-center text-xs text-[#7A85A0] italic">
                            No Card Uploaded
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Showcase Images */}
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                      <span className="text-[10px] text-[#7A85A0] font-bold uppercase block mb-3">Product / Business Images</span>
                      {selectedMember.business_images && selectedMember.business_images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedMember.business_images.map((imgPath, imgIdx) => (
                            <img 
                              key={imgIdx}
                              src={getImageUrl(imgPath)} 
                              alt={`Business Image ${imgIdx + 1}`} 
                              className="w-full h-20 object-cover bg-[#F0F2F7] border border-slate-200 rounded-lg"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-[#7A85A0] italic">
                          No business showcase images uploaded.
                        </div>
                      )}
                    </div>

                    {/* Business Flyers */}
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-[#7A85A0] font-bold uppercase flex items-center gap-1.5">
                          <ImageIcon size={12} />
                          Business Flyers
                        </span>
                        <span className="text-[10px] font-bold text-[#C41230]">
                          {(selectedMember.business_flyers || []).length} / 5
                        </span>
                      </div>
                      {(selectedMember.business_flyers || []).length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {(selectedMember.business_flyers || []).map((flyer) => (
                            <div
                              key={flyer.id}
                              className="relative group rounded-lg overflow-hidden border border-slate-200 bg-[#F0F2F7]"
                            >
                              <img
                                src={getImageUrl(flyer.image_url)}
                                alt={`Business Flyer ${flyer.display_order + 1}`}
                                className="w-full h-28 object-cover"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <a
                                  href={getImageUrl(flyer.image_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 bg-white/90 hover:bg-white text-[#1A2744] text-[10px] font-bold py-1.5 rounded-md text-center"
                                >
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadImage(
                                      flyer.image_url,
                                      `flyer-${selectedMember.id}-${flyer.id}.jpg`,
                                    )
                                  }
                                  className="flex-1 bg-white/90 hover:bg-white text-[#1A2744] text-[10px] font-bold py-1.5 rounded-md flex items-center justify-center gap-1"
                                >
                                  <Download size={10} />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleDeleteBusinessFlyer(flyer.id)}
                                  className="flex-1 bg-[#C41230] hover:bg-[#9E0E27] text-white text-[10px] font-bold py-1.5 rounded-md flex items-center justify-center gap-1 disabled:opacity-60"
                                >
                                  <Trash2 size={10} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-[#7A85A0] italic">
                          No business flyers uploaded.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center">
                  <div className="flex gap-2">
                    {selectedMember.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => setMemberToApprove(selectedMember)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <ThumbsUp size={14} />
                          Approve Profile
                        </button>
                        <button
                          onClick={() => setMemberToReject(selectedMember)}
                          className="bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <ThumbsDown size={14} />
                          Reject Profile
                        </button>
                      </>
                    )}
                    {selectedMember.approval_status === 'rejected' && (
                      <button
                        onClick={() => setMemberToApprove(selectedMember)}
                        className="bg-[#1A2744] hover:bg-[#111B30] text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <RotateCcw size={14} />
                        Restore & Approve
                      </button>
                    )}
                    <button
                      onClick={() => openMemberEditor(selectedMember)}
                      className="bg-[#1A2744] hover:bg-[#111B30] text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Pencil size={14} />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setMemberToDelete(selectedMember)}
                      className="border border-[#C41230]/40 text-[#C41230] hover:bg-[#C41230]/10 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-[#0E1525] font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Profile Editor */}
        {memberToEdit && (
          <MemberEditModal
            member={memberToEdit}
            apiURL={apiURL}
            token={token}
            onClose={() => setMemberToEdit(null)}
            onSaved={(updated) => {
              setImportSuccess('Member profile updated successfully.');
              if (updated) {
                setMembers((current) =>
                  current.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
                );
                // Keep the drawer in sync instead of forcing the admin to reopen it.
                setSelectedMember((current) =>
                  current && current.id === updated.id ? { ...current, ...updated } : current,
                );
              }
              fetchMembers();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {memberToDelete && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm"
              onClick={() => setMemberToDelete(null)}
            />
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-6">
              <div className="flex items-center space-x-3 text-[#C41230]">
                <Trash2 size={24} />
                <h3 className="text-lg font-bold text-[#0E1525]">Delete Member Permanently?</h3>
              </div>
              <p className="text-sm text-[#3A4260] leading-relaxed">
                This permanently removes{' '}
                <strong className="text-[#0E1525]">
                  {memberToDelete.full_name || memberToDelete.email}
                </strong>{' '}
                and all of their profile data, uploads, and directory listing. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setMemberToDelete(null)}
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

        {/* ── Day 4 Modals ── */}
        
        {/* Approve Confirmation Modal */}
        {memberToApprove && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm" onClick={() => setMemberToApprove(null)} />
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-6">
              <div className="flex items-center space-x-3 text-emerald-700">
                <CheckCircle size={26} />
                <h3 className="text-lg font-bold text-[#0E1525]">Approve Member Verification?</h3>
              </div>
              <p className="text-sm text-[#3A4260] leading-relaxed">
                Are you sure you want to approve <strong className="text-[#0E1525]">{memberToApprove.full_name}</strong>? 
                This will grant them immediate access to the directory, business search, and all member-only features.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setMemberToApprove(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-xl text-[#3A4260] hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveConfirm}
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Confirm Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {memberToReject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm" onClick={() => setMemberToReject(null)} />
            <form onSubmit={handleRejectSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-6">
              <div className="flex items-center space-x-3 text-[#C41230]">
                <AlertCircle size={26} className="text-[#C41230]" />
                <h3 className="text-lg font-bold text-[#0E1525]">Reject Member Registration</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3A4260] uppercase tracking-wider block">
                  Rejection Reason (Required)
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear description explaining what needs to be fixed (e.g., Visiting card text blurry, Business category mismatched)..."
                  className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl p-3.5 text-sm text-[#0E1525] placeholder-[#7A85A0] focus:outline-none focus:border-[#C41230] transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setMemberToReject(null); setRejectionReason(''); }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-xl text-[#3A4260] hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || rejectionReason.trim().length < 5}
                  className="px-5 py-2.5 text-sm font-bold bg-[#C41230] hover:bg-[#9E0E27] text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Rejecting...' : 'Submit Rejection'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Members;
