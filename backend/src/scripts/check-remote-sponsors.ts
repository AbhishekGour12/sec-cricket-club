const API_BASE = 'https://sec-api.duckdns.org/api';

async function checkAll() {
  const loginRes = await (globalThis as any).fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sportsentertainmentclub9@gmail.com', password: '123456' }),
  });
  const loginData: any = await loginRes.json();
  const token = loginData.token;

  const evRes = await (globalThis as any).fetch(`${API_BASE}/admin/events?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const evData: any = await evRes.json();
  console.log(`TOTAL EVENTS: ${evData.events?.length}`);

  let totalSponsors = 0;
  for (const ev of evData.events || []) {
    const fullRes = await (globalThis as any).fetch(`${API_BASE}/admin/events/${ev.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fullData: any = await fullRes.json();
    const sponsors = fullData.event?.sponsors || [];
    totalSponsors += sponsors.length;
    console.log(`Event #${ev.id} (${ev.event_name}) [Status: ${ev.status}]: ${sponsors.length} sponsors`);
    for (const sp of sponsors) {
      console.log(`   - Sponsor #${sp.id} (sponsor_id: ${sp.sponsor_id}): name="${sp.name}" tier="${sp.tier}" logo="${sp.logo}" website="${sp.website}"`);
    }
  }
  console.log(`\nTotal sponsors across all events: ${totalSponsors}`);
}

checkAll().catch(console.error);
