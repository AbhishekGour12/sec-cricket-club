import fs from 'fs';
import path from 'path';

const API_BASE = 'https://sec-api.duckdns.org/api';

async function main() {
  console.log(`Connecting to remote API at: ${API_BASE}`);

  // 1. Authenticate as admin
  const adminEmail = 'sportsentertainmentclub9@gmail.com';
  const adminPassword = '123456';

  let token = '';
  try {
    const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    const loginData: any = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    token = loginData.token;
    console.log(`Successfully logged in to remote server as: ${adminEmail}`);
  } catch (err: any) {
    console.error('Login request error:', err.message);
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 2. Fetch existing events on the remote server
  let currentList: any[] = [];
  try {
    const eventsRes = await fetch(`${API_BASE}/admin/events?limit=50`, {
      headers: authHeaders,
    });
    const eventsData: any = await eventsRes.json();
    currentList = eventsData.events || [];
    console.log(`\nRemote Events found (${currentList.length}):`);
    for (const ev of currentList) {
      console.log(
        `- Event #${ev.id}: "${ev.event_name}" (${ev.event_type}) | Date: ${ev.event_date} | Status: ${ev.status} | Sponsors: ${ev.sponsor_count || 0}`
      );
    }
  } catch (err: any) {
    console.error('Failed to fetch remote events:', err.message);
  }

  // 3. Upload sponsor logo files to remote server
  const sponsorLogoFiles = [
    'sponsor-apex-sports.png',
    'sponsor-skyline-steel.png',
    'sponsor-mehta-builders.png',
    'sponsor-royal-energy.png',
    'sponsor-tata-capital.png',
    'sponsor-sg-sports.png',
  ];

  const uploadedLogos: Record<string, string> = {};

  for (const file of sponsorLogoFiles) {
    const localPath = path.join(__dirname, '../../uploads/sponsors', file);
    if (fs.existsSync(localPath)) {
      try {
        const fileBuffer = fs.readFileSync(localPath);
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', blob, file);

        const uploadRes = await fetch(`${API_BASE}/admin/sponsors/upload`, {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });

        const uploadData: any = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          uploadedLogos[file] = uploadData.url;
          console.log(`Uploaded ${file} -> ${uploadData.url}`);
        } else {
          console.error(`Upload error for ${file}:`, uploadData);
        }
      } catch (err: any) {
        console.error(`Failed to upload ${file}:`, err.message);
      }
    } else {
      console.warn(`Local file missing: ${localPath}`);
    }
  }

  // 4. Create / update events with sponsors on the remote server
  const eventsToSync = [
    {
      event_name: 'SEC Annual Premier League 2026',
      event_type: 'Tournament',
      event_date: '2026-09-18',
      start_time: '14:00',
      venue_name: 'SEC International Stadium, Ground A',
      venue_address: 'Sports Entertainment Club Complex, Ludhiana',
      teams_involved: 'SEC Tigers vs Royal Strikers',
      description:
        'The biggest cricket showdown of the season featuring top club teams competing for the SEC Championship Trophy.',
      is_featured: true,
      status: 'Published',
      sponsors: [
        {
          name: 'Apex Sports & Fitness Gear',
          logo: uploadedLogos['sponsor-apex-sports.png'] || null,
          website: 'https://apexsports.example.com',
          tier: 'Title Sponsor',
          display_order: 1,
        },
        {
          name: 'Skyline Steel & Infrastructure Pvt. Ltd.',
          logo: uploadedLogos['sponsor-skyline-steel.png'] || null,
          website: 'https://skylinesteel.example.com',
          tier: 'Co-Sponsor',
          display_order: 2,
        },
        {
          name: 'Royal Energy Drinks',
          logo: uploadedLogos['sponsor-royal-energy.png'] || null,
          website: 'https://royalenergy.example.com',
          tier: 'Associate Sponsor',
          display_order: 3,
        },
      ],
    },
    {
      event_name: 'SEC Champions Cup 2026 - Semi Finals',
      event_type: 'League Match',
      event_date: '2026-09-25',
      start_time: '16:30',
      venue_name: 'Ludhiana Cricket Arena',
      venue_address: 'Civil Lines, Ludhiana',
      teams_involved: 'SEC Warriors vs Super Kings',
      description:
        'High voltage semi-final clash under floodlights with official tournament partners.',
      is_featured: true,
      status: 'Published',
      sponsors: [
        {
          name: 'Mehta Builders & Developers',
          logo: uploadedLogos['sponsor-mehta-builders.png'] || null,
          website: 'https://mehtabuilders.example.com',
          tier: 'Title Sponsor',
          display_order: 1,
        },
        {
          name: 'SG Cricket International',
          logo: uploadedLogos['sponsor-sg-sports.png'] || null,
          website: 'https://sgcricket.example.com',
          tier: 'Co-Sponsor',
          display_order: 2,
        },
        {
          name: 'Tata Capital Services',
          logo: uploadedLogos['sponsor-tata-capital.png'] || null,
          website: 'https://tatacapital.example.com',
          tier: 'Associate Sponsor',
          display_order: 3,
        },
      ],
    },
    {
      event_name: 'SEC Corporate Invitational Trophy',
      event_type: 'Friendly',
      event_date: '2026-10-04',
      start_time: '09:00',
      venue_name: 'Green Valley Sports Complex',
      venue_address: 'Green Valley, Ludhiana',
      teams_involved: 'Corporate XI vs Club All-Stars',
      description:
        'Weekend fixture celebrating corporate networking, cricket camaraderie, and sponsor partnership.',
      is_featured: false,
      status: 'Published',
      sponsors: [
        {
          name: 'Tata Capital Services',
          logo: uploadedLogos['sponsor-tata-capital.png'] || null,
          website: 'https://tatacapital.example.com',
          tier: 'Title Sponsor',
          display_order: 1,
        },
        {
          name: 'Apex Sports & Fitness Gear',
          logo: uploadedLogos['sponsor-apex-sports.png'] || null,
          website: 'https://apexsports.example.com',
          tier: 'Associate Sponsor',
          display_order: 2,
        },
      ],
    },
  ];

  for (const ev of eventsToSync) {
    const existing = currentList.find(
      (e: any) => e.event_name.toLowerCase() === ev.event_name.toLowerCase()
    );

    if (existing) {
      try {
        const updateRes = await fetch(`${API_BASE}/admin/events/${existing.id}`, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(ev),
        });
        const updateData: any = await updateRes.json();
        if (updateRes.ok) {
          console.log(`Updated remote event #${existing.id}: "${ev.event_name}" with sponsors!`);
        } else {
          console.error(`Update failed for event #${existing.id}:`, updateData);
        }
      } catch (err: any) {
        console.error(`Failed to update event #${existing.id}:`, err.message);
      }
    } else {
      try {
        const createRes = await fetch(`${API_BASE}/admin/events`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(ev),
        });
        const createData: any = await createRes.json();
        if (createRes.ok) {
          console.log(`Created remote event #${createData.event?.id}: "${ev.event_name}" with sponsors!`);
        } else {
          console.error(`Creation failed for "${ev.event_name}":`, createData);
        }
      } catch (err: any) {
        console.error(`Failed to create event "${ev.event_name}":`, err.message);
      }
    }
  }

  // Also update Event #4 if it exists on remote server
  const ev4 = currentList.find((e: any) => e.id === 4);
  if (ev4) {
    try {
      const res = await fetch(`${API_BASE}/admin/events/4`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: ev4.event_name || 'SEC Match',
          event_type: ev4.event_type || 'League Match',
          event_date: '2026-09-12',
          start_time: '15:00',
          venue_name: ev4.venue_name || 'SEC Stadium',
          status: 'Published',
          is_featured: true,
          sponsors: [
            {
              name: 'Skyline Steel & Infrastructure Pvt. Ltd.',
              logo: uploadedLogos['sponsor-skyline-steel.png'] || null,
              website: 'https://skylinesteel.example.com',
              tier: 'Title Sponsor',
              display_order: 1,
            },
            {
              name: 'Mehta Builders & Developers',
              logo: uploadedLogos['sponsor-mehta-builders.png'] || null,
              website: 'https://mehtabuilders.example.com',
              tier: 'Co-Sponsor',
              display_order: 2,
            },
          ],
        }),
      });
      if (res.ok) {
        console.log('Updated Event #4 with sponsors on remote server!');
      }
    } catch (err: any) {
      console.error('Failed to update Event #4:', err.message);
    }
  }

  console.log('\nRemote API data sync complete!');
}

main().catch((err) => {
  console.error('Error during remote seed:', err);
});
