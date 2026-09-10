import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
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
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { MemberEditModal, Achievement, PrivacySettings } from '../components/MemberEditModal';
import { getAdminMediaUrl } from '../utils/mediaUrl';
import { getApiUrl } from '../lib/api';

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

export function parseVisitingCards(raw?: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      // fallback to comma split
    }
  }
  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
}

export const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [rawMembersList, setRawMembersList] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>(PRESET_CATEGORIES);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Business Category Management
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isManualCustomCategory, setIsManualCustomCategory] = useState(false);
  const [manualCustomCategory, setManualCustomCategory] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected'>('approved');

  // Sorting
  const [sortField, setSortField] = useState<'full_name' | 'created_at' | 'membership_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Approval / Rejection Modals
  const [memberToApprove, setMemberToApprove] = useState<Member | null>(null);
  const [memberToReject, setMemberToReject] = useState<Member | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Profile Edit & Delete Modals
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    membership_number: '',
    designation: 'Associate Member',
    business_name: '',
    business_category: 'Services & Consulting',
    city: '',
    state: '',
    country: 'India',
    status: 'active',
    approval_status: 'approved',
  });
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Spreadsheet Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  interface ValidatedRow {
    rowNumber: number;
    full_name: string;
    phone: string;
    email: string;
    membership_number: string;
    business_name: string;
    business_category: string;
    city: string;
    state: string;
    country: string;
    designation: string;
    errors: string[];
  }

  const [importRows, setImportRows] = useState<ValidatedRow[]>([]);
  const [importMode, setImportMode] = useState<'create_only' | 'create_update'>('create_only');
  const [importReport, setImportReport] = useState<{ total: number; valid: number; errors: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const apiURL = getApiUrl();
  const token = localStorage.getItem('admin_jwt');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Synchronize Tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending') setActiveTab('pending');
    else if (tabParam === 'rejected') setActiveTab('rejected');
    else setActiveTab('approved');
    setSelectedIds([]);
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiURL}/members/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const backendCats: string[] = response.data.categories || [];
      const merged = Array.from(new Set([...PRESET_CATEGORIES, ...backendCats]));
      setCategories(merged);
    } catch {
      setCategories(PRESET_CATEGORIES);
    }
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setCategoryFilter(trimmed);
    setNewCategoryInput('');
    setIsAddCategoryModalOpen(false);
    setSuccessMessage(`Business category "${trimmed}" added!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchMembers = async () => {
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

      setRawMembersList(fetchedList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load members directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeTab]);

  // Client-side filtering, sorting, and pagination
  const filteredAndSortedMembers = useMemo(() => {
    let list = [...rawMembersList];

    // Filter by search
    if (debouncedSearch.trim()) {
      const s = debouncedSearch.toLowerCase().trim();
      list = list.filter(m => 
        (m.full_name || '').toLowerCase().includes(s) ||
        (m.email || '').toLowerCase().includes(s) ||
        (m.phone || '').toLowerCase().includes(s) ||
        (m.business_name || '').toLowerCase().includes(s) ||
        (m.business_category || '').toLowerCase().includes(s) ||
        (m.membership_number || '').toLowerCase().includes(s) ||
        (m.city || '').toLowerCase().includes(s)
      );
    }

    // Filter by category
    if (categoryFilter) {
      list = list.filter(m => m.business_category === categoryFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let fieldA = (a[sortField] || '').toString().toLowerCase();
      let fieldB = (b[sortField] || '').toString().toLowerCase();
      if (sortField === 'created_at') {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [rawMembersList, debouncedSearch, categoryFilter, sortField, sortOrder]);

  useEffect(() => {
    setTotal(filteredAndSortedMembers.length);
    const pages = Math.ceil(filteredAndSortedMembers.length / pageSize) || 1;
    setTotalPages(pages);
    if (page > pages) setPage(1);

    const startIndex = (page - 1) * pageSize;
    setMembers(filteredAndSortedMembers.slice(startIndex, startIndex + pageSize));
  }, [filteredAndSortedMembers, page, pageSize]);

  const handleSort = (field: 'full_name' | 'created_at' | 'membership_number') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length && members.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map(m => m.id));
    }
  };

  const toggleSelectMember = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Approve all ${selectedIds.length} selected members?`)) return;

    setActionLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          axios.post(
            `${apiURL}/admin/member/${id}/approve`,
            { confirm: true },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      setSuccessMessage(`Successfully approved ${selectedIds.length} members.`);
      setSelectedIds([]);
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch {
      setError('Failed to approve some selected members.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkExportCSV = () => {
    const listToExport = filteredAndSortedMembers.filter(m => 
      selectedIds.length === 0 || selectedIds.includes(m.id)
    );

    const data = listToExport.map(m => ({
      'Membership Number': m.membership_number || '',
      'Full Name': m.full_name || '',
      'Email': m.email || '',
      'Mobile Phone': m.phone || '',
      'Designation': m.designation || '',
      'Business Name': m.business_name || '',
      'Business Category': m.business_category || '',
      'City': m.city || '',
      'State': m.state || '',
      'Country': m.country || '',
      'Approval Status': m.approval_status,
      'Created Date': m.created_at ? new Date(m.created_at).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `sec_members_${activeTab}_${Date.now()}.xlsx`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected members? This cannot be undone.`)) return;

    setActionLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          axios.delete(`${apiURL}/admin/member/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setSuccessMessage(`Deleted ${selectedIds.length} members successfully.`);
      setSelectedIds([]);
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch {
      setError('Failed to delete some selected members.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open member details drawer (Read-only view)
  const openMemberDrawer = async (member: Member) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
    try {
      const response = await axios.get(`${apiURL}/admin/members/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.member) {
        setSelectedMember(response.data.member);
      }
    } catch {
      // Keep existing snapshot
    }
  };

  const handleConfirmApprove = async () => {
    if (!memberToApprove) return;
    setActionLoading(true);
    try {
      await axios.post(
        `${apiURL}/admin/member/${memberToApprove.id}/approve`,
        { confirm: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(`Approved ${memberToApprove.full_name || 'member'} successfully!`);
      setMemberToApprove(null);
      if (selectedMember?.id === memberToApprove.id) setIsDrawerOpen(false);
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to approve member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToReject) return;
    if (rejectionReason.trim().length < 5) {
      alert('Please provide a descriptive rejection reason (min 5 characters).');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        `${apiURL}/admin/member/${memberToReject.id}/reject`,
        { reason: rejectionReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(`Application rejected. An explanatory email notification has been dispatched to ${memberToReject.email || 'the applicant'}.`);
      setMemberToReject(null);
      setRejectionReason('');
      if (selectedMember?.id === memberToReject.id) setIsDrawerOpen(false);
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setActionLoading(true);
    try {
      await axios.delete(`${apiURL}/admin/member/${memberToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage(`Deleted ${memberToDelete.full_name || 'member'} permanently.`);
      setMemberToDelete(null);
      if (selectedMember?.id === memberToDelete.id) setIsDrawerOpen(false);
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete member.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Member Manual Submission Validation
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!manualForm.full_name.trim()) errors.full_name = 'Full name is required';
    if (!manualForm.email.trim()) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualForm.email.trim())) errors.email = 'Invalid email format';

    if (manualForm.phone.trim() && !/^[+]?[\d\s-]{10,15}$/.test(manualForm.phone.trim())) errors.phone = 'Invalid phone number (min 10 digits)';

    if (Object.keys(errors).length > 0) {
      setManualErrors(errors);
      return;
    }

    setManualErrors({});
    setIsSubmittingManual(true);

    const finalCategory = isManualCustomCategory
      ? (manualCustomCategory.trim() || 'Others')
      : manualForm.business_category;

    const payload = {
      ...manualForm,
      business_category: finalCategory,
    };

    try {
      await axios.post(
        `${apiURL}/admin/members/create-manual`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (isManualCustomCategory && manualCustomCategory.trim()) {
        const cat = manualCustomCategory.trim();
        if (!categories.includes(cat)) {
          setCategories(prev => [...prev, cat]);
        }
      }
      setSuccessMessage(`Member "${manualForm.full_name}" registered successfully.`);
      setIsAddModalOpen(false);
      setIsManualCustomCategory(false);
      setManualCustomCategory('');
      setManualForm({
        full_name: '',
        email: '',
        phone: '',
        membership_number: '',
        designation: 'Associate Member',
        business_name: '',
        business_category: 'Services & Consulting',
        city: '',
        state: '',
        country: 'India',
        status: 'active',
        approval_status: 'approved',
      });
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setManualErrors({ form: err?.response?.data?.message || 'Failed to create member record.' });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // CSV Import Validation Engine
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const validated: ValidatedRow[] = rawJson.map((row, idx) => {
          const rowNum = idx + 2;
          const errs: string[] = [];

          const mNum = String(row['Membership Number'] || row['membership_number'] || '').trim();
          const name = String(row['Full Name'] || row['full_name'] || '').trim();
          const email = String(row['Email'] || row['email'] || '').trim().toLowerCase();
          const phone = String(row['Mobile Number'] || row['mobile_number'] || row['phone'] || '').trim();
          const designation = String(row['Designation'] || row['designation'] || 'Associate Member').trim();
          const bizName = String(row['Business Name'] || row['business_name'] || '').trim();
          const bizCat = String(row['Business Category'] || row['business_category'] || 'Others').trim();
          const city = String(row['City'] || row['city'] || '').trim();
          const state = String(row['State'] || row['state'] || '').trim();
          const country = String(row['Country'] || row['country'] || 'India').trim();

          if (!mNum) errs.push('Missing Membership Number');
          if (!name) errs.push('Missing Full Name');
          if (!email) errs.push('Missing Email');
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Invalid Email format');

          return {
            rowNumber: rowNum,
            membership_number: mNum,
            full_name: name,
            email,
            phone,
            designation,
            business_name: bizName,
            business_category: bizCat,
            city,
            state,
            country,
            errors: errs,
          };
        });

        const errorCount = validated.filter(r => r.errors.length > 0).length;
        setImportRows(validated);
        setImportReport({
          total: validated.length,
          valid: validated.length - errorCount,
          errors: errorCount,
        });
        setIsImportModalOpen(true);
      } catch (err) {
        alert('Failed to parse spreadsheet file. Please verify CSV/Excel format.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleCommitImport = async () => {
    if (importRows.length === 0) return;
    if (importReport && importReport.errors > 0) {
      if (!window.confirm(`There are ${importReport.errors} invalid rows with errors. Do you want to proceed and skip invalid rows?`)) {
        return;
      }
    }

    const validPayload = importRows
      .filter(r => r.errors.length === 0)
      .map(r => ({
        'Membership Number': r.membership_number,
        'Full Name': r.full_name,
        'Email': r.email,
        'Mobile Number': r.phone,
        'Designation': r.designation,
        'Business Name': r.business_name,
        'Business Category': r.business_category,
        'City': r.city,
        'State': r.state,
        'Country': r.country,
      }));

    setIsImporting(true);
    try {
      const response = await axios.post(
        `${apiURL}/admin/members/bulk-import`,
        { records: validPayload, mode: importMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(`Import completed! Created: ${response.data.results?.created || 0}, Updated: ${response.data.results?.updated || 0}.`);
      setIsImportModalOpen(false);
      setImportRows([]);
      setImportReport(null);
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete bulk import.');
    } finally {
      setIsImporting(false);
    }
  };

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

  const getImageUrl = (path?: string) =>
    getAdminMediaUrl(
      path,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
    );

  const formatApproverDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 relative min-h-screen pb-20 text-[#0E1525]">
        {/* Top Header Row with Persistent Action CTAs */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0E1525] tracking-tight">
              Members Administration
            </h1>
            <p className="text-sm text-[#3A4260] mt-1 font-medium">
              Review verification status, inspect ID proofs, and manage the official club roster.
            </p>
          </div>

          {/* Action CTAs (Separated from filter tabs) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-[#1A2744] text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              title="Download CSV Template"
            >
              <Download size={14} />
              <span>Template</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-[#1A2744] text-[#1A2744] hover:bg-[#1A2744] hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet size={15} />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-[#C41230] hover:bg-[#9E0E27] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Notifications & Alerts */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800">✕</button>
          </div>
        )}

        {/* Clean Status Filter Tabs */}
        <div className="flex border-b border-slate-200 gap-8">
          <button 
            onClick={() => { setActiveTab('approved'); setPage(1); setSearchParams({ tab: 'approved' }); }}
            className={`pb-3.5 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'approved' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            <span>Approved Members</span>
            {activeTab === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>

          <button 
            onClick={() => { setActiveTab('pending'); setPage(1); setSearchParams({ tab: 'pending' }); }}
            className={`pb-3.5 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'pending' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            <span>Pending Approvals</span>
            {rawMembersList.filter(m => m.approval_status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black bg-amber-500 text-white rounded-full">
                {rawMembersList.filter(m => m.approval_status === 'pending').length}
              </span>
            )}
            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>

          <button 
            onClick={() => { setActiveTab('rejected'); setPage(1); setSearchParams({ tab: 'rejected' }); }}
            className={`pb-3.5 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'rejected' ? 'text-[#C41230]' : 'text-[#7A85A0] hover:text-[#0E1525]'
            }`}
          >
            <span>Rejected Applications</span>
            {activeTab === 'rejected' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C41230]" />}
          </button>
        </div>

        {/* Filter Controls Row (Expanded search input without clipping) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:flex-1 relative min-w-0">
            <Search className="absolute left-3.5 top-3 text-[#7A85A0]" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone, business, category, or member ID..."
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
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230] min-w-[170px]"
            >
              <option value="">All Business Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-[#0E1525] font-bold flex items-center gap-1.5 transition-colors shrink-0"
              title="Add New Business Category"
            >
              <Plus size={13} className="text-[#C41230]" />
              <span>Add Category</span>
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#F0F2F7] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0E1525] font-semibold focus:outline-none focus:border-[#C41230]"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            {(search || categoryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                }}
                className="text-xs text-[#C41230] font-bold hover:underline px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Batch Operations Toolbar (When rows are selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-[#1A2744] text-white rounded-xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="bg-[#C41230] px-2 py-0.5 rounded-full">{selectedIds.length}</span>
              <span>Members Selected</span>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'pending' && (
                <button
                  onClick={handleBulkApprove}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <CheckCircle size={13} />
                  <span>Approve Selected</span>
                </button>
              )}
              <button
                onClick={handleBulkExportCSV}
                className="px-3 py-1.5 bg-[#243260] hover:bg-[#314380] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Download size={13} />
                <span>Export Selected</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* Members Roster Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#243260] text-xs font-bold text-white uppercase tracking-wider bg-[#1A2744]">
                  <th className="py-4 px-4 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={members.length > 0 && selectedIds.length === members.length}
                      onChange={toggleSelectAll}
                      className="rounded text-[#C41230] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-4">Photo</th>
                  <th 
                    className="py-4 px-4 cursor-pointer select-none hover:text-slate-200"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Name & Contact</span>
                      {sortField === 'full_name' ? (sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="opacity-40" />}
                    </div>
                  </th>
                  <th 
                    className="py-4 px-4 cursor-pointer select-none hover:text-slate-200"
                    onClick={() => handleSort('membership_number')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Member ID</span>
                      {sortField === 'membership_number' ? (sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="opacity-40" />}
                    </div>
                  </th>
                  <th className="py-4 px-4">Business Profile</th>
                  <th className="py-4 px-4">Status</th>
                  
                  {activeTab === 'approved' && <th className="py-4 px-4">Approved By</th>}
                  {activeTab === 'rejected' && <th className="py-4 px-4">Rejection Reason</th>}
                  
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#3A4260] text-xs">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41230] mb-2"></div>
                      <p className="font-semibold">Loading members roster…</p>
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#3A4260] text-sm font-medium">
                      No members matching the criteria were found in {activeTab} status.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const isSelected = selectedIds.includes(member.id);
                    return (
                      <tr 
                        key={member.id}
                        className={`group hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                      >
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectMember(member.id)}
                            className="rounded text-[#C41230] focus:ring-0 cursor-pointer"
                          />
                        </td>

                        <td className="py-4 px-4 cursor-pointer" onClick={() => openMemberDrawer(member)}>
                          <img 
                            src={getImageUrl(member.profile_image)} 
                            alt={member.full_name || 'Member'}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-[#1A2744] transition-colors"
                          />
                        </td>

                        <td className="py-4 px-4 cursor-pointer" onClick={() => openMemberDrawer(member)}>
                          <p className="font-bold text-xs text-[#0E1525] group-hover:text-[#C41230] transition-colors">
                            {member.full_name || 'Incomplete Profile'}
                          </p>
                          <p className="text-[11px] text-[#7A85A0] mt-0.5">
                            {member.email || 'No email on file'}
                          </p>
                          {member.phone && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.phone}</p>
                          )}
                        </td>

                        <td className="py-4 px-4 text-xs font-mono font-bold text-[#1A2744]">
                          {member.membership_number ? (
                            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                              {member.membership_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-xs text-[#3A4260]">
                          <div className="font-bold text-[#0E1525] truncate max-w-[180px]">{member.business_name || 'N/A'}</div>
                          <div className="text-[11px] text-[#7A85A0] truncate max-w-[180px]">{member.business_category || 'N/A'}</div>
                        </td>

                        <td className="py-4 px-4">
                          {member.approval_status === 'approved' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle size={10} className="mr-1" /> Approved
                            </span>
                          )}
                          {member.approval_status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock size={10} className="mr-1" /> Pending
                            </span>
                          )}
                          {member.approval_status === 'rejected' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              <AlertCircle size={10} className="mr-1" /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Masked Foreign Key: Clean formatted Admin name & date */}
                        {activeTab === 'approved' && (
                          <td className="py-4 px-4 text-xs text-[#5A6380]">
                            <p className="font-semibold text-[#0E1525]">Approved by Admin</p>
                            <p className="text-[10px] text-slate-400">{formatApproverDate(member.approved_at)}</p>
                          </td>
                        )}

                        {/* Rejected Application Details */}
                        {activeTab === 'rejected' && (
                          <td className="py-4 px-4 text-xs text-[#5A6380]">
                            <p className="text-rose-600 font-semibold truncate max-w-[200px]" title={member.rejection_reason}>
                              {member.rejection_reason || 'No specific reason'}
                            </p>
                            <p className="text-[10px] text-slate-400">{formatApproverDate(member.rejected_at)}</p>
                          </td>
                        )}

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {/* Read-Only Details View CTA */}
                            <button
                              onClick={() => openMemberDrawer(member)}
                              title="View full member profile details"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Pending Quick Actions */}
                            {activeTab === 'pending' && (
                              <>
                                <button
                                  onClick={() => setMemberToApprove(member)}
                                  title="Approve Member"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                  <ThumbsUp size={14} />
                                </button>
                                <button
                                  onClick={() => setMemberToReject(member)}
                                  title="Reject Application"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                                >
                                  <ThumbsDown size={14} />
                                </button>
                              </>
                            )}

                            {/* Rejected Re-evaluate CTA */}
                            {activeTab === 'rejected' && (
                              <button
                                onClick={() => setMemberToApprove(member)}
                                title="Re-evaluate & Approve"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition-colors flex items-center gap-1"
                              >
                                <RotateCcw size={11} />
                                <span>Re-evaluate</span>
                              </button>
                            )}

                            {/* Edit Profile */}
                            <button
                              onClick={() => setMemberToEdit(member)}
                              title="Edit Member Information"
                              className="p-1.5 rounded-lg border border-slate-200 text-[#1A2744] hover:bg-slate-100 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>

                            {/* Delete Record */}
                            <button
                              onClick={() => setMemberToDelete(member)}
                              title="Delete Member"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {!isLoading && total > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-200 bg-[#F8FAFC] text-xs text-[#5A6380] gap-4">
              <div>
                Showing <span className="font-bold text-[#0E1525]">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-[#0E1525]">{Math.min(page * pageSize, total)}</span> of{' '}
                <span className="font-bold text-[#0E1525]">{total}</span> members
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-300 hover:bg-white text-[#1A2744] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="px-3 font-semibold text-[#0E1525]">
                  Page {page} of {totalPages}
                </span>
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

        {/* Read-Only Profile View Details Drawer */}
        {isDrawerOpen && selectedMember && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150 flex justify-end">
            <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between">
              <div>
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1A2744] text-white">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getImageUrl(selectedMember.profile_image)} 
                      alt={selectedMember.full_name || 'Member'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
                    />
                    <div>
                      <h2 className="font-extrabold text-base text-white">{selectedMember.full_name || 'Incomplete Profile'}</h2>
                      <p className="text-xs text-slate-300">{selectedMember.email || selectedMember.phone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#243260]"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="p-6 space-y-6 text-xs text-[#0E1525]">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verification Status</span>
                      <p className="font-bold text-sm capitalize mt-0.5 text-[#1A2744]">{selectedMember.approval_status}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Membership Number</span>
                      <p className="font-mono font-bold text-sm mt-0.5 text-[#C41230]">{selectedMember.membership_number || 'Unassigned'}</p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-wider mb-3">Contact & Identification</h3>
                    <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-slate-400 font-medium">Primary Mobile</p>
                        <p className="font-bold text-[#0E1525] mt-0.5">{selectedMember.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Alternate Mobile</p>
                        <p className="font-bold text-[#0E1525] mt-0.5">{selectedMember.alternate_phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Contact Email</p>
                        <p className="font-bold text-[#0E1525] mt-0.5">{selectedMember.contact_email || selectedMember.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Designation</p>
                        <p className="font-bold text-[#0E1525] mt-0.5">{selectedMember.designation || 'Member'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div>
                    <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-wider mb-3">Business Enterprise</h3>
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-200 space-y-2">
                      <div>
                        <p className="text-slate-400 font-medium">Business Name</p>
                        <p className="font-bold text-sm text-[#0E1525] mt-0.5">{selectedMember.business_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Category</p>
                        <p className="font-semibold text-[#0E1525] mt-0.5">{selectedMember.business_category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Location</p>
                        <p className="font-semibold text-[#0E1525] mt-0.5">
                          {[selectedMember.city, selectedMember.state, selectedMember.country].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                      {selectedMember.business_description && (
                        <div>
                          <p className="text-slate-400 font-medium">Description</p>
                          <p className="text-slate-700 mt-0.5 leading-relaxed">{selectedMember.business_description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Logo */}
                  {selectedMember.business_logo && (
                    <div>
                      <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-wider mb-3">Business Logo</h3>
                      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center gap-3">
                        <img 
                          src={getImageUrl(selectedMember.business_logo)} 
                          alt="Business Logo" 
                          className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-200 p-1"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div>
                          <p className="font-bold text-xs text-[#0E1525]">{selectedMember.business_name || 'Business Logo'}</p>
                          <p className="text-[11px] text-slate-400">Official Brand Logo</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visiting Card / Identity Assets (Supports Multiple / Front & Back) */}
                  {(() => {
                    const cards = parseVisitingCards(selectedMember.visiting_card);
                    if (cards.length === 0) return null;
                    const labels = ['Front Side', 'Back Side'];
                    return (
                      <div>
                        <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-wider mb-3">
                          Visiting Card ({cards.length})
                        </h3>
                        <div className={`grid ${cards.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3`}>
                          {cards.map((cardPath, cIdx) => (
                            <div key={cIdx} className="border border-slate-200 rounded-xl overflow-hidden p-2 bg-slate-50">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 px-1">
                                {labels[cIdx] || `Card Image ${cIdx + 1}`}
                              </span>
                              <a
                                href={getImageUrl(cardPath)}
                                target="_blank"
                                rel="noreferrer"
                                className="block group relative"
                                title="Click to open full resolution image"
                              >
                                <img 
                                  src={getImageUrl(cardPath)} 
                                  alt={`Visiting Card ${labels[cIdx] || cIdx + 1}`} 
                                  className="w-full h-44 object-contain rounded-lg bg-white border border-slate-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="%23f1f5f9"/><text x="50" y="32" font-size="9" text-anchor="middle" fill="%2394a3b8">Card Image</text></svg>';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <Eye size={15} />
                                  <span>View Full Image</span>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Product & Business Showcase Images */}
                  {selectedMember.business_images && selectedMember.business_images.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-wider mb-3">
                        Showcase Images ({selectedMember.business_images.length})
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedMember.business_images.map((img, i) => (
                          <a key={i} href={getImageUrl(img)} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img src={getImageUrl(img)} alt={`Showcase ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Business Flyers */}
                  {selectedMember.business_flyers && selectedMember.business_flyers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-wider mb-3">
                        Business Flyers ({selectedMember.business_flyers.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedMember.business_flyers.map((flyer) => (
                          <a key={flyer.id} href={getImageUrl(flyer.image_url)} target="_blank" rel="noreferrer" className="block aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img src={getImageUrl(flyer.image_url)} alt="Flyer" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {selectedMember.achievements && selectedMember.achievements.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-wider mb-3">Cricket &amp; Club Achievements</h3>
                      <div className="space-y-2">
                        {selectedMember.achievements.map((ach, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                            <Star size={14} className="text-amber-500 shrink-0" />
                            <span className="font-semibold text-[#0E1525]">{ach.title}</span>
                            {ach.year && <span className="text-slate-400 font-mono text-[10px]">({ach.year})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setMemberToEdit(selectedMember);
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 text-[#1A2744] font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Edit Profile
                </button>

                <div className="flex items-center gap-2">
                  {selectedMember.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setMemberToReject(selectedMember);
                        }}
                        className="px-4 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100 border border-rose-200 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setMemberToApprove(selectedMember);
                        }}
                        className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 shadow transition-colors"
                      >
                        Approve Member
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Rejection Reason Modal */}
        {memberToReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#0E1525] border border-slate-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle size={20} />
                  <h3 className="font-extrabold text-base">Reject Application</h3>
                </div>
                <button
                  onClick={() => {
                    setMemberToReject(null);
                    setRejectionReason('');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-[#5A6380] mb-4">
                Please specify the reason for rejecting <strong>{memberToReject.full_name || memberToReject.email}</strong>. This note will be recorded in the audit trail and emailed directly to the applicant with instructions to re-submit.
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                    Rejection Reason (Required, min 5 chars)
                  </label>
                  <textarea
                    required
                    rows={4}
                    minLength={5}
                    placeholder="e.g. Identity document is unclear, please upload a clear business visiting card or government ID..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMemberToReject(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || rejectionReason.trim().length < 5}
                    className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow"
                  >
                    {actionLoading ? 'Rejecting & Notifying…' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {memberToApprove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#0E1525] border border-slate-200">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <CheckCircle size={28} />
                <div>
                  <h3 className="font-extrabold text-base">Approve Club Member</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Grant full access to mobile directory and events.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-6">
                Are you sure you want to approve <strong>{memberToApprove.full_name || memberToApprove.email}</strong>? An automated welcome push notification will be sent.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToApprove(null)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmApprove}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow"
                >
                  {actionLoading ? 'Approving…' : 'Yes, Approve Member'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#0E1525] border border-slate-200">
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                <Trash2 size={24} />
                <div>
                  <h3 className="font-extrabold text-base">Delete Member Account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action is permanent and cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-6">
                Are you sure you want to permanently delete <strong>{memberToDelete.full_name || memberToDelete.email}</strong> from the SEC Cricket Club database?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow"
                >
                  {actionLoading ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Member Edit Modal */}
        {memberToEdit && (
          <MemberEditModal
            member={memberToEdit}
            apiURL={apiURL}
            token={token}
            onClose={() => setMemberToEdit(null)}
            onSaved={() => {
              setMemberToEdit(null);
              fetchMembers();
              setSuccessMessage('Member profile updated successfully.');
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
          />
        )}

        {/* Add Member Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-[#0E1525] border border-slate-200 my-8">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-[#1A2744]">
                  <Plus size={20} className="text-[#C41230]" />
                  <h3 className="font-extrabold text-lg">Add New Club Member</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {manualErrors.form && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{manualErrors.form}</span>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={manualForm.full_name}
                      onChange={(e) => setManualForm({ ...manualForm, full_name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#C41230] ${manualErrors.full_name ? 'border-red-400' : 'border-slate-200'}`}
                    />
                    {manualErrors.full_name && <p className="text-[10px] text-red-600 mt-1 font-semibold">{manualErrors.full_name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      Membership Number <span className="text-slate-400 font-normal lowercase">(optional - auto assigned)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SEC-1 (Leave blank to auto-generate)"
                      value={manualForm.membership_number}
                      onChange={(e) => setManualForm({ ...manualForm, membership_number: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#C41230] ${manualErrors.membership_number ? 'border-red-400' : 'border-slate-200'}`}
                    />
                    {manualErrors.membership_number && <p className="text-[10px] text-red-600 mt-1 font-semibold">{manualErrors.membership_number}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#C41230] ${manualErrors.email ? 'border-red-400' : 'border-slate-200'}`}
                    />
                    {manualErrors.email && <p className="text-[10px] text-red-600 mt-1 font-semibold">{manualErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      Mobile Number (E.164) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#C41230] ${manualErrors.phone ? 'border-red-400' : 'border-slate-200'}`}
                    />
                    {manualErrors.phone && <p className="text-[10px] text-red-600 mt-1 font-semibold">{manualErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma Steel Corporation"
                      value={manualForm.business_name}
                      onChange={(e) => setManualForm({ ...manualForm, business_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      Business Category
                    </label>
                    <select
                      value={isManualCustomCategory ? 'Others' : manualForm.business_category}
                      onChange={(e) => {
                        if (e.target.value === 'Others') {
                          setIsManualCustomCategory(true);
                          setManualForm({ ...manualForm, business_category: manualCustomCategory.trim() || 'Others' });
                        } else {
                          setIsManualCustomCategory(false);
                          setManualForm({ ...manualForm, business_category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    >
                      {categories.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                    {isManualCustomCategory && (
                      <input
                        type="text"
                        placeholder="Enter custom business category..."
                        value={manualCustomCategory}
                        onChange={(e) => {
                          setManualCustomCategory(e.target.value);
                          setManualForm({ ...manualForm, business_category: e.target.value.trim() || 'Others' });
                        }}
                        className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ludhiana"
                      value={manualForm.city}
                      onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director"
                      value={manualForm.designation}
                      onChange={(e) => setManualForm({ ...manualForm, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingManual}
                    className="px-5 py-2 text-xs font-bold bg-[#C41230] text-white rounded-xl hover:bg-[#9E0E27] disabled:opacity-50 transition-colors shadow"
                  >
                    {isSubmittingManual ? 'Saving Member…' : 'Register Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CSV Bulk Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 text-[#0E1525] border border-slate-200 my-8">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-[#1A2744]">
                  <FileSpreadsheet size={22} className="text-[#C41230]" />
                  <h3 className="font-extrabold text-lg">Bulk Import Members Roster</h3>
                </div>
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportRows([]);
                    setImportReport(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* File Upload Box */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-[#1A2744] transition-colors bg-[#F8FAFC]">
                  <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="font-bold text-sm text-[#0E1525]">Select CSV or Excel Spreadsheet</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 mb-4">
                    Ensure columns match: Membership Number, Full Name, Email, Mobile Number, Business Name.
                  </p>
                  <div className="flex justify-center gap-3">
                    <label className="px-4 py-2 bg-[#1A2744] hover:bg-[#111B30] text-white font-bold rounded-xl cursor-pointer transition-colors shadow">
                      Choose File
                      <input 
                        type="file" 
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleFileSelect}
                        className="hidden" 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 font-bold rounded-xl transition-colors"
                    >
                      Download Template
                    </button>
                  </div>
                </div>

                {/* Validation Report Summary */}
                {importReport && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-[#1A2744]">Pre-Import Validation Summary</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">
                          Total: {importReport.total}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                          Valid: {importReport.valid}
                        </span>
                        {importReport.errors > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded">
                            Errors: {importReport.errors}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mode selection */}
                    <div className="flex items-center gap-4 text-xs font-semibold pt-2 border-t border-slate-200">
                      <span>Import Mode:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="create_only"
                          checked={importMode === 'create_only'}
                          onChange={() => setImportMode('create_only')}
                        />
                        <span>Create New (Skip existing)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="create_update"
                          checked={importMode === 'create_update'}
                          onChange={() => setImportMode('create_update')}
                        />
                        <span>Create &amp; Update Existing</span>
                      </label>
                    </div>

                    {/* Pre-import Preview Table */}
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#1A2744] text-white font-bold sticky top-0">
                            <th className="p-2">Row</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Member ID</th>
                            <th className="p-2">Validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {importRows.slice(0, 50).map((r, i) => (
                            <tr key={i} className={r.errors.length > 0 ? 'bg-rose-50' : 'bg-white'}>
                              <td className="p-2 font-mono">{r.rowNumber}</td>
                              <td className="p-2 font-semibold">{r.full_name || '<Empty>'}</td>
                              <td className="p-2">{r.email || '<Empty>'}</td>
                              <td className="p-2 font-mono">{r.membership_number}</td>
                              <td className="p-2">
                                {r.errors.length === 0 ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <Check size={12} /> Valid
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-bold" title={r.errors.join(', ')}>
                                    {r.errors.join(', ')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportRows([]);
                      setImportReport(null);
                    }}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isImporting || importRows.length === 0}
                    onClick={handleCommitImport}
                    className="px-5 py-2 text-xs font-bold bg-[#C41230] text-white rounded-xl hover:bg-[#9E0E27] disabled:opacity-50 transition-colors shadow"
                  >
                    {isImporting ? 'Processing Database Transaction…' : `Execute Import (${importRows.length} Rows)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Add Business Category Modal */}
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B30]/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 text-[#0E1525] border border-slate-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                <h3 className="font-extrabold text-sm text-[#1A2744]">Add Business Category</h3>
                <button
                  onClick={() => {
                    setIsAddCategoryModalOpen(false);
                    setNewCategoryInput('');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddNewCategory} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#3A4260] uppercase mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Solar Energy, Legal Services..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#C41230]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddCategoryModalOpen(false);
                      setNewCategoryInput('');
                    }}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newCategoryInput.trim()}
                    className="px-4 py-1.5 text-xs font-bold bg-[#C41230] text-white rounded-xl hover:bg-[#9E0E27] disabled:opacity-50 transition-colors shadow"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Members;
