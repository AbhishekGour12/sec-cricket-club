const API_BASE = 'https://sec-api.duckdns.org/api';

async function main() {
  // Login as member or test /events/featured
  // Let's test with admin login to get a token and test mobile endpoints
  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sportsentertainmentclub9@gmail.com', password: '123456' }),
  });
  const { token } = (await loginRes.json()) as any;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('Testing GET /events/sponsors on remote server:');
  const spRes = await fetch(`${API_BASE}/events/sponsors`, { headers });
  console.log(`Status /events/sponsors: ${spRes.status}`);
  const spText = await spRes.text();
  console.log('Response /events/sponsors:', spText);

  console.log('\nTesting GET /events/featured on remote server:');
  const featRes = await fetch(`${API_BASE}/events/featured`, { headers });
  console.log(`Status /events/featured: ${featRes.status}`);
  const featData: any = await featRes.json();
  console.log('Featured events count:', featData.events?.length);
  if (featData.events?.length > 0) {
    console.log('Sample event sponsors:', featData.events[0].sponsors);
  }
}

main().catch(console.error);
