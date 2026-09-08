const API_BASE = 'https://sec-api.duckdns.org/api';

async function testMemberEndpoints() {
  const loginRes = await (globalThis as any).fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sportsentertainmentclub9@gmail.com', password: '123456' }),
  });
  const loginData: any = await loginRes.json();
  const adminToken = loginData.token;

  const mRes = await (globalThis as any).fetch(`${API_BASE}/admin/members?limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const mData: any = await mRes.json();
  console.log('Admin Members API count:', mData.members?.length);
  const approvedMember = (mData.members || []).find((m: any) => m.approval_status === 'approved' && m.status === 'active');
  console.log('Found approved member:', approvedMember ? { id: approvedMember.id, phone: approvedMember.phone, name: approvedMember.name } : 'None');

  // Let's test /events/sponsors using admin token
  const spAdminRes = await (globalThis as any).fetch(`${API_BASE}/events/sponsors`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('SPONSORS WITH ADMIN TOKEN status:', spAdminRes.status, await spAdminRes.json());
}

testMemberEndpoints().catch(console.error);
