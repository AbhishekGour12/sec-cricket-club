import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  CalendarDays, 
  Megaphone, 
  Users, 
  ShieldCheck, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Image as ImageIcon,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: string[];
  cta?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}

export const Guidance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

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

  const sections: GuideSection[] = [
    {
      id: 'members',
      title: 'Member Verification & Approvals',
      icon: Users,
      items: [
        'Review Pending Members in the approval queue before granting access to the directory.',
        'Inspect member ID proof and visiting card images in the profile drawer prior to verifying.',
        'When rejecting an applicant, always provide a clear reason; an explanatory email is automatically dispatched.',
        'Use Add Member for single registrations or Import Members for batch spreadsheet rosters.',
      ],
      cta: {
        label: 'Go to Pending Approvals',
        to: '/members?tab=pending',
      },
    },
    {
      id: 'events',
      title: 'Events, Matches & Tournaments',
      icon: CalendarDays,
      items: [
        'Save an event as a Draft until dates, timings, venues, sponsors, and banner images are finalized.',
        'Feature key league matches to display them prominently on member mobile home screens.',
        'Set date boundaries: event dates cannot be in the past when publishing upcoming tournaments.',
        'Sponsors can be organized by tiers (Title, Co-Sponsor, Associate) with logos and links.',
      ],
      cta: {
        label: 'Schedule New Event',
        to: '/events',
      },
    },
    {
      id: 'announcements',
      title: 'Announcements & Broadcasts',
      icon: Megaphone,
      items: [
        'Use Markdown formatting (bold, lists, headings) to structure official club announcements.',
        'Set an optional Expiration Date to auto-archive notices after events or deadlines pass.',
        'Pin critical urgent announcements so they stay at the top of member notification feeds.',
        'Use the Live Preview tab to inspect formatting before publishing.',
      ],
      cta: {
        label: 'Broadcast Announcement',
        to: '/announcements',
      },
    },
    {
      id: 'media_specs',
      title: 'Media & Asset Specifications',
      icon: ImageIcon,
      items: [
        'Event Banners: Recommended 16:9 aspect ratio (1200×675px), max file size 2MB (JPG/PNG).',
        'Profile Avatars: 1:1 square ratio (400×400px), JPG or PNG under 1MB.',
        'Visiting Cards / ID Proofs: Clear front & back scans, max 3MB per image.',
        'Sponsor Logos: Transparent PNG format recommended (min 300px width).',
      ],
    },
    {
      id: 'csv_specs',
      title: 'CSV Schema & Batch Imports',
      icon: FileSpreadsheet,
      items: [
        'Required headers: Membership Number, Full Name, Email, Mobile Number, Business Name.',
        'Optional headers: Designation, Business Category, City, State, Country.',
        'Mobile numbers must be unique across all members for secure account authorization.',
        'All bulk inserts run in atomic database transactions to ensure data consistency.',
      ],
      cta: {
        label: 'Download CSV Template',
        onClick: downloadTemplate,
      },
    },
    {
      id: 'security',
      title: 'Roles, Access & Safe Administration',
      icon: ShieldCheck,
      items: [
        'Super Admins have full permissions over member approvals, event lifecycle, and content.',
        'Use unique passwords and change credentials regularly from the top-right profile flyout.',
        'Do not export or share member phone numbers or business information outside club administration.',
        'Always sign out when accessing the administrative portal from shared or public computers.',
      ],
      cta: {
        label: 'Review System Audit Logs',
        to: '/notifications',
      },
    },
  ];

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-8 text-[#0E1525]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#D0D8EE] p-3 text-[#1A2744]">
              <BookOpen size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0E1525]">
                Guidance &amp; Operational Center
              </h1>
              <p className="mt-1 text-sm font-medium text-[#3A4260]">
                Standard operating procedures, media dimensions, and CSV import specifications.
              </p>
            </div>
          </div>
        </div>

        {/* In-Page Keyword Search */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-[#7A85A0]" size={18} />
            <input
              type="text"
              placeholder="Search guidance topics, specs, or operational rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F0F2F7] border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-[#0E1525] placeholder-[#7A85A0] focus:outline-none focus:border-[#C41230] transition-colors"
            />
          </div>
        </div>

        {/* Balanced 6-Card Grid (2x3 or 3x2) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSections.map(({ id, title, icon: Icon, items, cta }) => (
            <section 
              key={id} 
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="mb-4 flex items-center gap-2.5 text-[#1A2744]">
                  <div className="p-2 rounded-xl bg-[#F0F2F7] text-[#C41230] group-hover:bg-[#C41230] group-hover:text-white transition-colors">
                    <Icon size={18} />
                  </div>
                  <h2 className="font-extrabold text-sm text-[#0E1525]">{title}</h2>
                </div>

                <ul className="space-y-2.5 text-xs leading-relaxed text-[#4A5568]">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {cta && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {cta.to ? (
                    <Link
                      to={cta.to}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C41230] hover:text-[#9E0E27] transition-colors"
                    >
                      <span>{cta.label}</span>
                      <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={cta.onClick}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C41230] hover:text-[#9E0E27] transition-colors"
                    >
                      <Download size={13} />
                      <span>{cta.label}</span>
                    </button>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Embedded Sample CSV Header Schema Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#1A2744]">
              <FileSpreadsheet size={20} className="text-[#C41230]" />
              <h3 className="font-extrabold text-sm">Official CSV / Excel Import Schema Reference</h3>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-3 py-1.5 bg-[#1A2744] hover:bg-[#111B30] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow"
            >
              <Download size={12} />
              <span>Download Schema Sample</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-[#1A2744] font-bold">
                  <th className="p-3">Field Header</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">Format / Example</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-mono font-bold text-[#0E1525]">Membership Number</td>
                  <td className="p-3 font-bold text-rose-600">Required</td>
                  <td className="p-3 font-mono">SEC0001</td>
                  <td className="p-3">Unique member identifier code</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#0E1525]">Full Name</td>
                  <td className="p-3 font-bold text-rose-600">Required</td>
                  <td className="p-3">Rahul Sharma</td>
                  <td className="p-3">Primary member display name</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#0E1525]">Email</td>
                  <td className="p-3 font-bold text-rose-600">Required</td>
                  <td className="p-3 font-mono">rahul@example.com</td>
                  <td className="p-3">Registered email address for authorization</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#0E1525]">Mobile Number</td>
                  <td className="p-3 font-bold text-rose-600">Required</td>
                  <td className="p-3 font-mono">9876543210</td>
                  <td className="p-3">10-15 digit phone number (Must be unique)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#0E1525]">Business Name</td>
                  <td className="p-3 text-slate-500 font-medium">Optional</td>
                  <td className="p-3">Sharma Steel</td>
                  <td className="p-3">Enterprise or company trade name</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#0E1525]">Business Category</td>
                  <td className="p-3 text-slate-500 font-medium">Optional</td>
                  <td className="p-3">Manufacturing &amp; Production</td>
                  <td className="p-3">Industry sector classification</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Guidance;
