import React, { useState } from 'react';
import axios from 'axios';
import { X, Save, Plus, Trash2, Star } from 'lucide-react';

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
  achievements?: Achievement[];
  privacy_settings?: PrivacySettings;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface MemberEditModalProps {
  member: EditableMember;
  apiURL: string;
  token: string | null;
  onClose: () => void;
  onSaved: (updated?: EditableMember) => void;
}

const TEXT_FIELDS: { key: keyof EditableMember; label: string; type?: string }[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Login Email', type: 'email' },
  { key: 'membership_number', label: 'Membership Number' },
  { key: 'designation', label: 'Designation' },
  { key: 'phone', label: 'Primary Phone' },
  { key: 'alternate_phone', label: 'Alternate Phone' },
  { key: 'contact_email', label: 'Contact Email', type: 'email' },
];

const BUSINESS_FIELDS: { key: keyof EditableMember; label: string }[] = [
  { key: 'business_name', label: 'Business Name' },
  { key: 'business_category', label: 'Industry Category' },
  { key: 'business_address', label: 'Business Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
];

const SOCIAL_FIELDS: { key: keyof EditableMember; privacy: PrivacyField; label: string }[] = [
  { key: 'website', privacy: 'website', label: 'Business Website' },
  { key: 'instagram_url', privacy: 'instagram_url', label: 'Instagram' },
  { key: 'facebook_url', privacy: 'facebook_url', label: 'Facebook' },
  { key: 'linkedin_url', privacy: 'linkedin_url', label: 'LinkedIn' },
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
  'w-full bg-[#F0F2F7] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0E1525] focus:outline-none focus:border-[#C41230]';

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof EditableMember, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await axios.put(
        `${apiURL}/admin/member/${member.id}`,
        { ...form, achievements, privacy_settings: privacy },
        { headers: { Authorization: `Bearer ${token}` } },
      );
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
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl relative shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-slate-200 bg-[#1A2744] text-white flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold">Edit Member Profile</h3>
            <p className="text-xs text-slate-300 mt-1">
              {member.full_name || member.email || `Member #${member.id}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#243260] rounded-xl transition-all"
            aria-label="Close editor"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F0F2F7]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <section className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
              Personal &amp; Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <section className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
              Business Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#3A4260] font-semibold">
                Nature of Business / Bio
              </label>
              <textarea
                rows={3}
                value={form.business_description ?? ''}
                onChange={(e) => setField('business_description', e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </section>

          <section className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
              Social Links
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SOCIAL_FIELDS.map((field) => (
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
            </div>
          </section>

          <section className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
              Club Accomplishments &amp; Awards
            </h4>

            {achievements.length === 0 && (
              <p className="text-xs text-[#7A85A0] italic">No accomplishments recorded.</p>
            )}

            <div className="space-y-2">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-[#FFFBF2] border border-[#F5E4C3] rounded-xl px-4 py-3"
                >
                  <Star size={16} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0E1525]">{item.title}</p>
                    {item.year && <p className="text-xs text-[#7A85A0]">{item.year}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAchievements((c) => c.filter((a) => a.id !== item.id))}
                    className="p-2 text-[#7A85A0] hover:text-[#C41230] transition-colors"
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Accomplishment title"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                className={`${inputClass} flex-1`}
              />
              <input
                type="text"
                placeholder="Year"
                maxLength={4}
                value={newAchievement.year}
                onChange={(e) => setNewAchievement({ ...newAchievement, year: e.target.value })}
                className={`${inputClass} sm:w-28`}
              />
              <button
                type="button"
                onClick={addAchievement}
                className="bg-[#1A2744] hover:bg-[#111B30] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </section>

          <section className="bg-white p-5 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-extrabold text-[#1A2744] uppercase tracking-wider">
              Directory Visibility
            </h4>
            <p className="text-xs text-[#7A85A0]">
              Hidden fields are not sent to other members&apos; devices.
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
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
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

          <section className="bg-white p-5 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-[#3A4260] font-semibold">Visibility Status</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className={inputClass}
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#3A4260] font-semibold">Approval Status</label>
              <select
                value={form.approval_status}
                onChange={(e) => setField('approval_status', e.target.value)}
                className={inputClass}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl text-[#3A4260] hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-bold bg-[#C41230] hover:bg-[#9E0E27] text-white rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberEditModal;
