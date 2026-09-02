import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  Save,
  Plus,
  Trash2,
  Star,
  Upload,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getAdminMediaUrl } from '../utils/mediaUrl';

export interface Achievement {
  id: string;
  title: string;
  year?: string;
}

export type PrivacyField =
  | 'phone'
  | 'alternate_phone'
  | 'contact_email'
  | 'instagram_url'
  | 'facebook_url'
  | 'linkedin_url'
  | 'website';

export type PrivacySettings = Partial<Record<PrivacyField, 'all' | 'hidden'>>;

export interface EditableMember {
  id: number;
  email?: string | null;
  full_name?: string;
  phone?: string;
  alternate_phone?: string;
  contact_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  membership_number?: string;
  designation?: string;
  business_name?: string;
  business_category?: string;
  business_description?: string;
  business_address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  profile_image?: string | null;
  business_logo?: string | null;
  visiting_card?: string | null;
  visiting_card_status?: 'pending' | 'approved' | 'rejected';
  visiting_card_rejection_reason?: string | null;
  business_images?: string[];
  achievements?: Achievement[];
  privacy_settings?: PrivacySettings;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  is_profile_completed?: boolean;
}

interface MemberEditModalProps {
  member: EditableMember;
  apiURL: string;
  token: string | null;
  onClose: () => void;
  onSaved: (updated?: EditableMember) => void;
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

const TEXT_FIELDS: { key: keyof EditableMember; label: string; type?: string }[] = [
  { key: 'full_name', label: 'Full Name *' },
  { key: 'email', label: 'Login Email *', type: 'email' },
  { key: 'membership_number', label: 'Membership Number *' },
  { key: 'designation', label: 'Designation / Role' },
  { key: 'phone', label: 'Primary Mobile *' },
  { key: 'alternate_phone', label: 'Alternate Phone' },
  { key: 'contact_email', label: 'Public Contact Email', type: 'email' },
];

const BUSINESS_FIELDS: { key: keyof EditableMember; label: string }[] = [
  { key: 'business_name', label: 'Business / Company Name *' },
  { key: 'business_address', label: 'Business Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
];

const SOCIAL_FIELDS: { key: keyof EditableMember; privacy: PrivacyField; label: string }[] = [
  { key: 'website', privacy: 'website', label: 'Business Website' },
  { key: 'instagram_url', privacy: 'instagram_url', label: 'Instagram Profile URL' },
  { key: 'facebook_url', privacy: 'facebook_url', label: 'Facebook Page URL' },
  { key: 'linkedin_url', privacy: 'linkedin_url', label: 'LinkedIn Profile URL' },
];

const PRIVACY_ROWS: { key: PrivacyField; label: string }[] = [
  { key: 'phone', label: 'Primary Phone' },
  { key: 'alternate_phone', label: 'Alternate Phone' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'website', label: 'Website' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'facebook_url', label: 'Facebook' },
  { key: 'linkedin_url', label: 'LinkedIn' },
];

const inputClass =
  'w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#0E1525] focus:outline-none focus:border-[#C41230] transition-colors';

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  member,
  apiURL,
  token,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<EditableMember>({ ...member });
  const [achievements, setAchievements] = useState<Achievement[]>(member.achievements ?? []);
  const [privacy, setPrivacy] = useState<PrivacySettings>(member.privacy_settings ?? {});
  const [newAchievement, setNewAchievement] = useState({ title: '', year: '' });

  // Media states
  const parsedCards = (member.visiting_card || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const [cardFront, setCardFront] = useState(parsedCards[0] || '');
  const [cardBack, setCardBack] = useState(parsedCards[1] || '');
  const [businessImages, setBusinessImages] = useState<string[]>(
    Array.isArray(member.business_images) ? member.business_images : []
  );
  const [newShowcaseUrl, setNewShowcaseUrl] = useState('');

  // Business Category custom handling
  const initialCategory = member.business_category || 'Services & Consulting';
  const isPreset = PRESET_CATEGORIES.includes(initialCategory) && initialCategory !== 'Others';
  const [isCustomCategory, setIsCustomCategory] = useState(!isPreset);
  const [customCategoryText, setCustomCategoryText] = useState(!isPreset ? initialCategory : '');

  // Flyers state
  const [flyers, setFlyers] = useState<Array<{ id: number; image_url: string; title?: string }>>([]);
  const [flyerLoading, setFlyerLoading] = useState(false);
  const [newFlyerUrl, setNewFlyerUrl] = useState('');
  const [flyerUploading, setFlyerUploading] = useState(false);

  // Upload loading tracking
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getImageUrl = (path?: string | null) => getAdminMediaUrl(path, '');

  // Fetch member flyers
  useEffect(() => {
    const fetchFlyers = async () => {
      try {
        setFlyerLoading(true);
        const res = await axios.get(`${apiURL}/admin/member/${member.id}/business-flyers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFlyers(res.data.flyers || []);
      } catch {
        // quiet ignore
      } finally {
        setFlyerLoading(false);
      }
    };
    if (member.id) fetchFlyers();
  }, [member.id, apiURL, token]);

  const setField = (key: keyof EditableMember, value: any) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Upload media helper (supports both single and multiple files)
  const handleFilesUpload = async (
    field: 'profile_image' | 'business_logo' | 'card_front' | 'card_back' | 'showcase' | 'flyer',
    files: FileList | File[]
  ) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      setError('Selected file(s) must be valid images.');
      return;
    }

    setUploadingField(field);
    setError(null);

    try {
      if (field === 'showcase') {
        const remaining = 5 - businessImages.length;
        if (remaining <= 0) {
          setError('Maximum 5 showcase images allowed. Please remove existing ones first.');
          return;
        }

        const toUpload = fileArray.slice(0, remaining);
        const uploadedUrls: string[] = [];

        for (const file of toUpload) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await axios.post(`${apiURL}/admin/members/upload-media`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          const url = res.data?.url || (Array.isArray(res.data?.urls) ? res.data.urls[0] : null);
          if (url) uploadedUrls.push(url);
        }

        setBusinessImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
        if (fileArray.length > remaining) {
          setSuccess(`Uploaded ${uploadedUrls.length} image(s). (Showcase gallery limit is 5 images)`);
        } else {
          setSuccess(`${uploadedUrls.length} showcase image(s) uploaded successfully!`);
        }
        setTimeout(() => setSuccess(null), 2500);
        return;
      }

      if (field === 'flyer') {
        const remaining = 5 - flyers.length;
        if (remaining <= 0) {
          setError('Maximum 5 business flyers allowed. Please remove existing ones first.');
          return;
        }

        const toUpload = fileArray.slice(0, remaining);
        const newFlyers: any[] = [];

        for (const file of toUpload) {
          const formData = new FormData();
          formData.append('image', file);
          const res = await axios.post(`${apiURL}/admin/member/${member.id}/business-flyers`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          if (res.data?.flyer) {
            newFlyers.push(res.data.flyer);
          }
        }

        setFlyers((prev) => [...prev, ...newFlyers]);
        if (fileArray.length > remaining) {
          setSuccess(`Uploaded ${newFlyers.length} flyer(s). (Business flyers limit is 5)`);
        } else {
          setSuccess(`${newFlyers.length} flyer(s) uploaded successfully!`);
        }
        setTimeout(() => setSuccess(null), 2500);
        return;
      }

      // Single file fields: profile_image, business_logo, card_front, card_back
      const file = fileArray[0];
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${apiURL}/admin/members/upload-media`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = res.data.url;
      if (field === 'profile_image') {
        setField('profile_image', uploadedUrl);
      } else if (field === 'business_logo') {
        setField('business_logo', uploadedUrl);
      } else if (field === 'card_front') {
        setCardFront(uploadedUrl);
      } else if (field === 'card_back') {
        setCardBack(uploadedUrl);
      }
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to upload image for ${field}.`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleFileUpload = (
    field: 'profile_image' | 'business_logo' | 'card_front' | 'card_back' | 'showcase' | 'flyer',
    file: File
  ) => handleFilesUpload(field, [file]);

  // Add showcase image by URL
  const handleAddShowcaseUrl = () => {
    const trimmed = newShowcaseUrl.trim();
    if (!trimmed) return;
    if (businessImages.length >= 5) {
      setError('Maximum 5 showcase images allowed.');
      return;
    }
    setBusinessImages((prev) => [...prev, trimmed]);
    setNewShowcaseUrl('');
  };

  // Add flyer by URL
  const handleAddFlyerUrl = async () => {
    const trimmed = newFlyerUrl.trim();
    if (!trimmed) return;
    if (flyers.length >= 5) {
      setError('Maximum 5 business flyers allowed. Please remove existing ones first.');
      return;
    }
    setFlyerUploading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${apiURL}/admin/member/${member.id}/business-flyers`,
        { image_url: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.flyer) {
        setFlyers((prev) => [...prev, res.data.flyer]);
      }
      setNewFlyerUrl('');
      setSuccess('Flyer added successfully!');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add flyer URL.');
    } finally {
      setFlyerUploading(false);
    }
  };

  // Delete flyer
  const handleDeleteFlyer = async (flyerId: number) => {
    try {
      await axios.delete(`${apiURL}/admin/member/${member.id}/business-flyers/${flyerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFlyers((prev) => prev.filter((f) => f.id !== flyerId));
    } catch {
      setError('Failed to delete flyer.');
    }
  };

  // Achievements
  const addAchievement = () => {
    const title = newAchievement.title.trim();
    if (title.length < 3) return;
    setAchievements((current) => [
      ...current,
      {
        id: `ach_${Date.now()}_${current.length}`,
        title,
        ...(newAchievement.year.trim() ? { year: newAchievement.year.trim() } : {}),
      },
    ]);
    setNewAchievement({ title: '', year: '' });
  };

  // Submit Profile Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const combinedCards = [cardFront.trim(), cardBack.trim()].filter(Boolean).join(',');
    const finalCategory = isCustomCategory
      ? customCategoryText.trim() || 'Others'
      : form.business_category || 'Others';

    const payload = {
      ...form,
      visiting_card: combinedCards || null,
      business_category: finalCategory,
      business_images: businessImages,
      achievements,
      privacy_settings: privacy,
    };

    try {
      const response = await axios.put(`${apiURL}/admin/member/${member.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSaved(response.data.member);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update the member profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#111B30]/80 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl relative shadow-2xl max-h-[92vh] flex flex-col z-10"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-[#1A2744] text-white flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 className="text-base font-extrabold">Edit Member Profile</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {member.full_name || member.email || `Member #${member.id}`} • Full Administrator Access
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-[#243260] rounded-xl transition-all"
            aria-label="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#F8FAFC]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={16} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. MEDIA & BRANDING ASSETS SECTION */}
          <section className="bg-white p-5 border border-slate-200 rounded-2xl space-y-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={15} className="text-[#C41230]" />
                <span>Media & Branding Assets (File Upload + URL Input)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload from your device or enter direct image URLs. Previews update in real time.
              </p>
            </div>

            {/* Profile Picture & Business Logo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Profile Picture */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-[#1A2744]">Profile Picture (Avatar)</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                    {form.profile_image ? (
                      <img
                        src={getImageUrl(form.profile_image)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        {(form.full_name || 'U').substring(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="text"
                      placeholder="Image URL..."
                      value={form.profile_image ?? ''}
                      onChange={(e) => setField('profile_image', e.target.value)}
                      className={inputClass}
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-[#1A2744] rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors">
                        {uploadingField === 'profile_image' ? (
                          <Loader2 size={12} className="animate-spin text-[#C41230]" />
                        ) : (
                          <Upload size={12} />
                        )}
                        <span>{uploadingField === 'profile_image' ? 'Uploading…' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingField !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload('profile_image', f);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                      {form.profile_image && (
                        <button
                          type="button"
                          onClick={() => setField('profile_image', null)}
                          className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Logo */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-[#1A2744]">Business Brand Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                    {form.business_logo ? (
                      <img
                        src={getImageUrl(form.business_logo)}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon size={20} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="text"
                      placeholder="Logo URL..."
                      value={form.business_logo ?? ''}
                      onChange={(e) => setField('business_logo', e.target.value)}
                      className={inputClass}
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-[#1A2744] rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors">
                        {uploadingField === 'business_logo' ? (
                          <Loader2 size={12} className="animate-spin text-[#C41230]" />
                        ) : (
                          <Upload size={12} />
                        )}
                        <span>{uploadingField === 'business_logo' ? 'Uploading…' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingField !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload('business_logo', f);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                      {form.business_logo && (
                        <button
                          type="button"
                          onClick={() => setField('business_logo', null)}
                          className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visiting Cards (Front & Back) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#1A2744] uppercase tracking-wider">
                  Visiting Card (Digital Business Card)
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">Card Status:</span>
                  <select
                    value={form.visiting_card_status || 'approved'}
                    onChange={(e) => setField('visiting_card_status', e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {form.visiting_card_status === 'rejected' && (
                <input
                  type="text"
                  placeholder="Card Rejection Reason (shown to user in app)..."
                  value={form.visiting_card_rejection_reason ?? ''}
                  onChange={(e) => setField('visiting_card_rejection_reason', e.target.value)}
                  className={`${inputClass} border-rose-300 bg-rose-50/50`}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Front Side */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase block">Front Side</span>
                  <div className="h-36 bg-white border border-slate-200 rounded-xl overflow-hidden p-1.5 flex items-center justify-center relative group">
                    {cardFront ? (
                      <img
                        src={getImageUrl(cardFront)}
                        alt="Visiting Card Front"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-slate-400 text-xs">
                        <ImageIcon size={24} className="mx-auto mb-1 text-slate-300" />
                        <span>No Front Card Uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Front image URL..."
                      value={cardFront}
                      onChange={(e) => setCardFront(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                    <label className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 shadow-sm transition-colors">
                      {uploadingField === 'card_front' ? (
                        <Loader2 size={12} className="animate-spin text-[#C41230]" />
                      ) : (
                        <Upload size={12} />
                      )}
                      <span>File</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingField !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload('card_front', f);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                    {cardFront && (
                      <button
                        type="button"
                        onClick={() => setCardFront('')}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Clear front card"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Back Side */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase block">Back Side</span>
                  <div className="h-36 bg-white border border-slate-200 rounded-xl overflow-hidden p-1.5 flex items-center justify-center relative group">
                    {cardBack ? (
                      <img
                        src={getImageUrl(cardBack)}
                        alt="Visiting Card Back"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-slate-400 text-xs">
                        <ImageIcon size={24} className="mx-auto mb-1 text-slate-300" />
                        <span>No Back Card Uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Back image URL..."
                      value={cardBack}
                      onChange={(e) => setCardBack(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                    <label className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 shadow-sm transition-colors">
                      {uploadingField === 'card_back' ? (
                        <Loader2 size={12} className="animate-spin text-[#C41230]" />
                      ) : (
                        <Upload size={12} />
                      )}
                      <span>File</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingField !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload('card_back', f);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                    {cardBack && (
                      <button
                        type="button"
                        onClick={() => setCardBack('')}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Clear back card"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product & Business Showcase Images (Up to 5) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#1A2744] uppercase tracking-wider">
                  Showcase Gallery ({businessImages.length}/5 Images)
                </span>
                <span className="text-[11px] text-slate-400">Featured in member profile showcase</span>
              </div>

              {businessImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {businessImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white group shadow-sm">
                      <a
                        href={getImageUrl(img)}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full h-full"
                        title="Click to view full image"
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Showcase ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={() => setBusinessImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white hover:bg-rose-600 rounded-full transition-colors opacity-90 group-hover:opacity-100 z-10"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {businessImages.length < 5 && (
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add showcase photo by URL..."
                    value={newShowcaseUrl}
                    onChange={(e) => setNewShowcaseUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAddShowcaseUrl}
                      disabled={!newShowcaseUrl.trim()}
                      className="px-3 py-1.5 bg-[#1A2744] text-white rounded-lg text-xs font-bold hover:bg-[#111B30] disabled:opacity-50"
                    >
                      Add URL
                    </button>
                    <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors">
                      {uploadingField === 'showcase' ? (
                        <Loader2 size={13} className="animate-spin text-[#C41230]" />
                      ) : (
                        <Upload size={13} />
                      )}
                      <span>{uploadingField === 'showcase' ? 'Uploading...' : 'Upload Files (Multi-select)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingField !== null}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFilesUpload('showcase', e.target.files);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Business Flyers Management */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#1A2744] uppercase tracking-wider">
                  Business Flyers ({flyers.length}/5 Flyers)
                </span>
                <span className="text-[11px] text-slate-400">Promotional marketing flyers (max 5)</span>
              </div>

              {flyerLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading flyers…</div>
              ) : flyers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No business flyers uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {flyers.map((flyer) => (
                    <div key={flyer.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-white group shadow-sm">
                      <a
                        href={getImageUrl(flyer.image_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full h-full"
                        title="Click to view full flyer"
                      >
                        <img
                          src={getImageUrl(flyer.image_url)}
                          alt="Flyer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('/uploads/flyers/')) {
                              target.src = target.src.replace('/uploads/flyers/', '/uploads/userprofile/');
                              return;
                            }
                            if (target.src.includes('/flyers/')) {
                              target.src = target.src.replace('/flyers/', '/userprofile/');
                              return;
                            }
                          }}
                        />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteFlyer(flyer.id)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white hover:bg-rose-600 rounded-full transition-colors opacity-90 group-hover:opacity-100 z-10"
                        title="Delete flyer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Flyer (Allowed up to 5 flyers) */}
              {flyers.length < 5 ? (
                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Paste Flyer image URL..."
                    value={newFlyerUrl}
                    onChange={(e) => setNewFlyerUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAddFlyerUrl}
                      disabled={!newFlyerUrl.trim() || flyerUploading}
                      className="px-3 py-1.5 bg-[#1A2744] text-white rounded-lg text-xs font-bold hover:bg-[#111B30] disabled:opacity-50"
                    >
                      Add by URL
                    </button>
                    <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors">
                      {uploadingField === 'flyer' ? (
                        <Loader2 size={13} className="animate-spin text-[#C41230]" />
                      ) : (
                        <Upload size={13} />
                      )}
                      <span>{uploadingField === 'flyer' ? 'Uploading...' : 'Upload Flyers (Multi-select)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingField !== null}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFilesUpload('flyer', e.target.files);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/80">
                  Maximum limit of 5 business flyers reached. Remove an existing flyer to add a new one.
                </p>
              )}
            </div>
          </section>

          {/* 2. PERSONAL & CONTACT DETAILS SECTION */}
          <section className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider border-b border-slate-100 pb-2">
              Personal & Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {TEXT_FIELDS.map((field) => (
                <div key={String(field.key)} className="space-y-1">
                  <label className="text-xs text-[#3A4260] font-semibold">{field.label}</label>
                  <input
                    type={field.type ?? 'text'}
                    value={(form[field.key] as string) ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 3. BUSINESS DETAILS SECTION */}
          <section className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider border-b border-slate-100 pb-2">
              Business & Professional Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {BUSINESS_FIELDS.map((field) => (
                <div key={String(field.key)} className="space-y-1">
                  <label className="text-xs text-[#3A4260] font-semibold">{field.label}</label>
                  <input
                    type="text"
                    value={(form[field.key] as string) ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}

              {/* Industry Category Dropdown + Custom Category */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-[#3A4260] font-semibold">Business Category</label>
                <select
                  value={isCustomCategory ? 'Others' : form.business_category || 'Services & Consulting'}
                  onChange={(e) => {
                    if (e.target.value === 'Others') {
                      setIsCustomCategory(true);
                      setField('business_category', customCategoryText.trim() || 'Others');
                    } else {
                      setIsCustomCategory(false);
                      setField('business_category', e.target.value);
                    }
                  }}
                  className={inputClass}
                >
                  {PRESET_CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {isCustomCategory && (
                  <input
                    type="text"
                    placeholder="Enter custom business category..."
                    value={customCategoryText}
                    onChange={(e) => {
                      setCustomCategoryText(e.target.value);
                      setField('business_category', e.target.value.trim() || 'Others');
                    }}
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#3A4260] font-semibold">Business Description / Services Overview</label>
              <textarea
                rows={3}
                placeholder="Describe business offerings, products, and services..."
                value={form.business_description ?? ''}
                onChange={(e) => setField('business_description', e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </section>

          {/* 4. SOCIAL & WEB LINKS */}
          <section className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider border-b border-slate-100 pb-2">
              Social Links & Web Presence
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SOCIAL_FIELDS.map((field) => (
                <div key={String(field.key)} className="space-y-1">
                  <label className="text-xs text-[#3A4260] font-semibold">{field.label}</label>
                  <input
                    type="text"
                    placeholder={`https://...`}
                    value={(form[field.key] as string) ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 5. ACCOMPLISHMENTS & AWARDS */}
          <section className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider border-b border-slate-100 pb-2">
              Club Accomplishments & Awards
            </h4>

            {achievements.length === 0 ? (
              <p className="text-xs text-[#7A85A0] italic">No accomplishments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {achievements.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-[#FFFBF2] border border-[#F5E4C3] rounded-xl px-4 py-2.5"
                  >
                    <Star size={15} className="text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#0E1525]">{item.title}</p>
                      {item.year && <p className="text-[11px] text-[#7A85A0]">{item.year}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAchievements((c) => c.filter((a) => a.id !== item.id))}
                      className="p-1.5 text-[#7A85A0] hover:text-[#C41230] transition-colors"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                placeholder="Accomplishment title..."
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                className={`${inputClass} flex-1`}
              />
              <input
                type="text"
                placeholder="Year (e.g. 2024)"
                maxLength={4}
                value={newAchievement.year}
                onChange={(e) => setNewAchievement({ ...newAchievement, year: e.target.value })}
                className={`${inputClass} sm:w-28`}
              />
              <button
                type="button"
                onClick={addAchievement}
                className="bg-[#1A2744] hover:bg-[#111B30] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </section>

          {/* 6. DIRECTORY PRIVACY OVERRIDES */}
          <section className="bg-white p-5 border border-slate-200 rounded-2xl space-y-3 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
              Directory Privacy Settings
            </h4>
            <p className="text-[11px] text-[#7A85A0]">
              Control whether contact details are visible to all members or hidden.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRIVACY_ROWS.map((row) => {
                const hidden = privacy[row.key] === 'hidden';
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() =>
                      setPrivacy((c) => ({ ...c, [row.key]: hidden ? 'all' : 'hidden' }))
                    }
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      hidden
                        ? 'bg-slate-100 border-slate-200 text-[#7A85A0]'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <span>{row.label}</span>
                    <span>{hidden ? 'Hidden' : 'Visible'}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 7. ACCOUNT STATUS & PROFILE COMPLETION */}
          <section className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider border-b border-slate-100 pb-2">
              Account Status & Approvals
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs text-[#3A4260] font-semibold">Account Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#3A4260] font-semibold">Member Approval Status</label>
                <select
                  value={form.approval_status}
                  onChange={(e) => setField('approval_status', e.target.value)}
                  className={inputClass}
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#3A4260] font-semibold">Profile Completion</label>
                <select
                  value={form.is_profile_completed ? 'completed' : 'incomplete'}
                  onChange={(e) => setField('is_profile_completed', e.target.value === 'completed')}
                  className={inputClass}
                >
                  <option value="completed">Completed</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
            </div>

            {form.approval_status === 'rejected' && (
              <div className="space-y-1">
                <label className="text-xs text-rose-600 font-semibold">Member Rejection Reason</label>
                <textarea
                  rows={2}
                  placeholder="Reason for rejecting member application..."
                  value={form.rejection_reason ?? ''}
                  onChange={(e) => setField('rejection_reason', e.target.value)}
                  className={`${inputClass} border-rose-300 bg-rose-50/40 resize-none`}
                />
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-xl text-[#3A4260] hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-xs font-bold bg-[#C41230] hover:bg-[#9E0E27] text-white rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            <span>{saving ? 'Saving Changes…' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberEditModal;
