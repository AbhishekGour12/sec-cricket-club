const API_BASE = 'https://sec-api.duckdns.org/api';

async function main() {
  const adminEmail = 'sportsentertainmentclub9@gmail.com';
  const adminPassword = '123456';

  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const { token } = (await loginRes.json()) as any;

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Attach sponsors to Event 3
  await fetch(`${API_BASE}/admin/events/3`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      event_name: 'SEC Premier League — Season Opener 2026',
      event_type: 'League Match',
      event_date: '2026-09-14',
      start_time: '14:00',
      venue_name: 'SEC Main Cricket Ground',
      status: 'Published',
      is_featured: true,
      sponsors: [
        {
          name: 'Apex Sports & Fitness Gear',
          logo: '/uploads/sponsors/file-1788850530604-563677027.png',
          website: 'https://apexsports.example.com',
          tier: 'Title Sponsor',
          display_order: 1,
        },
        {
          name: 'Royal Energy Drinks',
          logo: '/uploads/sponsors/file-1788850530791-300021682.png',
          website: 'https://royalenergy.example.com',
          tier: 'Co-Sponsor',
          display_order: 2,
        },
      ],
    }),
  });

  // Attach sponsors to Event 5
  await fetch(`${API_BASE}/admin/events/5`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      event_name: 'SEC Monthly Practice Friendly — September 2026',
      event_type: 'Friendly',
      event_date: '2026-09-20',
      start_time: '10:00',
      venue_name: 'Club Training Grounds',
      status: 'Published',
      is_featured: false,
      sponsors: [
        {
          name: 'SG Cricket International',
          logo: '/uploads/sponsors/file-1788850530910-553886242.png',
          website: 'https://sgcricket.example.com',
          tier: 'Title Sponsor',
          display_order: 1,
        },
        {
          name: 'Tata Capital Services',
          logo: '/uploads/sponsors/file-1788850530855-78283636.png',
          website: 'https://tatacapital.example.com',
          tier: 'Co-Sponsor',
          display_order: 2,
        },
      ],
    }),
  });

  console.log('Successfully attached sponsors to Events #3 and #5 on remote server!');

  // Fetch final list
  const listRes = await fetch(`${API_BASE}/admin/events`, { headers: authHeaders });
  const listData: any = await listRes.json();
  console.log('\nFinal Remote Server Events:');
  for (const ev of listData.events || []) {
    console.log(`- #${ev.id}: "${ev.event_name}" (${ev.event_type}) | Date: ${ev.event_date} | Sponsors: ${ev.sponsor_count}`);
  }
}

main().catch(console.error);
