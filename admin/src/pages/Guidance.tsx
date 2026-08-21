import React from 'react';
import { BookOpen, CalendarDays, Megaphone, Users, Bell, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';

const sections = [
  {
    title: 'Members',
    icon: Users,
    items: [
      'Review Pending Members before approving access to the mobile directory.',
      'Use Add Member for a single offline member, or Import Members for a CSV batch.',
      'Rejected members can correct their profile and submit again; record a clear rejection reason.',
    ],
  },
  {
    title: 'Events and sponsors',
    icon: CalendarDays,
    items: [
      'Save an event as a draft until all date, time, venue, image, and sponsor details are ready.',
      'Publish only confirmed events. Unpublishing removes the event from member views within about 15 seconds while their app is open.',
      'Use a clear title and a compressed event image so the mobile app loads quickly.',
    ],
  },
  {
    title: 'Announcements',
    icon: Megaphone,
    items: [
      'Use announcements for official club news, meetings, emergency notices, and event updates.',
      'Pin only high-priority updates. Unpublishing removes an announcement from members within about 15 seconds while their app is open.',
      'Check the preview text, publish date, and cover image before publishing.',
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      'The bell and Notifications page show registration and approval activity.',
      'Mark alerts as read after actioning them to keep the queue manageable.',
      'Member push delivery depends on the user granting notifications and having an active network connection.',
    ],
  },
  {
    title: 'Safe administration',
    icon: ShieldCheck,
    items: [
      'Use a unique admin password and sign out on shared computers.',
      'Do not share member exports, profile images, or login tokens outside authorised club use.',
      'Verify an event or announcement after publishing from the member app before circulating it.',
    ],
  },
];

export const Guidance: React.FC = () => (
  <AdminLayout>
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#D0D8EE] p-3 text-[#1A2744]">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0E1525]">Guidance &amp; Help</h1>
            <p className="mt-1 text-sm font-medium text-[#3A4260]">
              Practical steps for managing SEC Cricket Club content and members.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {sections.map(({ title, icon: Icon, items }) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-[#1A2744]">
              <Icon size={19} className="text-[#C41230]" />
              <h2 className="font-extrabold">{title}</h2>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-[#3A4260]">
              {items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C41230]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  </AdminLayout>
);

export default Guidance;
