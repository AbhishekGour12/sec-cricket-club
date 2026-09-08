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

  const res = await fetch(`${API_BASE}/admin/events?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data: any = await res.json();

  console.log(`\nVerified ${data.events.length} Events on https://sec-api.duckdns.org:`);
  for (const e of data.events) {
    console.log(
      `Event #${e.id}: "${e.event_name}" | Date: ${e.event_date} | Image: ${e.event_image} | Sponsors: ${e.sponsor_count}`
    );
  }
}

main().catch(console.error);
