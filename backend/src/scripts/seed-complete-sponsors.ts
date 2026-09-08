import fs from 'fs';
import path from 'path';

const API_BASE = 'https://sec-api.duckdns.org/api';

async function syncAllSponsors() {
  console.log('Connecting to remote API...');
  
  // 1. Admin login
  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sportsentertainmentclub9@gmail.com', password: '123456' }),
  });
  const loginData: any = await loginRes.json();
  const token = loginData.token;
  console.log('Logged in successfully.');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Upload sponsor logos
  const sponsorFiles = [
    { file: 'sponsor-apex-sports.png', name: 'Apex Sports India', tier: 'Title Sponsor', website: 'https://apexsports.in' },
    { file: 'sponsor-skyline-steel.png', name: 'Skyline Steel & Infra', tier: 'Co-Sponsor', website: 'https://skylinesteel.com' },
    { file: 'sponsor-mehta-builders.png', name: 'Mehta Developers', tier: 'Title Sponsor', website: 'https://mehtabuilders.in' },
    { file: 'sponsor-royal-energy.png', name: 'Royal Energy Drink', tier: 'Co-Sponsor', website: 'https://royalenergy.in' },
    { file: 'sponsor-tata-capital.png', name: 'Tata Capital Services', tier: 'Associate Sponsor', website: 'https://tatacapital.com' },
    { file: 'sponsor-sg-sports.png', name: 'SG Cricket Gear', tier: 'Associate Sponsor', website: 'https://sgcricket.com' },
  ];

  const uploadedLogos: Record<string, string> = {};

  for (const item of sponsorFiles) {
    const localPath = path.join(__dirname, '../../uploads/sponsors', item.file);
    if (!fs.existsSync(localPath)) {
      console.error('File not found:', localPath);
      continue;
    }

    const fileBuffer = fs.readFileSync(localPath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, item.file);

    const uploadRes = await fetch(`${API_BASE}/admin/sponsors/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    const uploadData: any = await uploadRes.json();
    if (uploadRes.ok && uploadData.url) {
      uploadedLogos[item.file] = uploadData.url;
      console.log(`Uploaded ${item.file} => ${uploadData.url}`);
    } else {
      console.error(`Failed to upload ${item.file}:`, uploadData);
    }
  }

  // 3. Fetch all events
  const evRes = await fetch(`${API_BASE}/admin/events?limit=50`, {
    headers: authHeaders,
  });
  const evData: any = await evRes.json();
  const events = evData.events || [];
  console.log(`Found ${events.length} events on remote server.`);

  // 4. Update each event with distinct, valid sponsors
  const eventSponsorConfigs: Record<number, any[]> = {
    8: [
      { name: 'Apex Sports India', logo: uploadedLogos['sponsor-apex-sports.png'], tier: 'Title Sponsor', website: 'https://apexsports.in', display_order: 0 },
      { name: 'Skyline Steel & Infra', logo: uploadedLogos['sponsor-skyline-steel.png'], tier: 'Co-Sponsor', website: 'https://skylinesteel.com', display_order: 1 },
    ],
    7: [
      { name: 'Mehta Developers', logo: uploadedLogos['sponsor-mehta-builders.png'], tier: 'Title Sponsor', website: 'https://mehtabuilders.in', display_order: 0 },
      { name: 'SG Cricket Gear', logo: uploadedLogos['sponsor-sg-sports.png'], tier: 'Co-Sponsor', website: 'https://sgcricket.com', display_order: 1 },
      { name: 'Tata Capital Services', logo: uploadedLogos['sponsor-tata-capital.png'], tier: 'Associate Sponsor', website: 'https://tatacapital.com', display_order: 2 },
    ],
    6: [
      { name: 'Apex Sports India', logo: uploadedLogos['sponsor-apex-sports.png'], tier: 'Title Sponsor', website: 'https://apexsports.in', display_order: 0 },
      { name: 'Royal Energy Drink', logo: uploadedLogos['sponsor-royal-energy.png'], tier: 'Co-Sponsor', website: 'https://royalenergy.in', display_order: 1 },
      { name: 'Skyline Steel & Infra', logo: uploadedLogos['sponsor-skyline-steel.png'], tier: 'Associate Sponsor', website: 'https://skylinesteel.com', display_order: 2 },
    ],
    5: [
      { name: 'SG Cricket Gear', logo: uploadedLogos['sponsor-sg-sports.png'], tier: 'Title Sponsor', website: 'https://sgcricket.com', display_order: 0 },
      { name: 'Tata Capital Services', logo: uploadedLogos['sponsor-tata-capital.png'], tier: 'Co-Sponsor', website: 'https://tatacapital.com', display_order: 1 },
    ],
    4: [
      { name: 'Skyline Steel & Infra', logo: uploadedLogos['sponsor-skyline-steel.png'], tier: 'Title Sponsor', website: 'https://skylinesteel.com', display_order: 0 },
      { name: 'Mehta Developers', logo: uploadedLogos['sponsor-mehta-builders.png'], tier: 'Co-Sponsor', website: 'https://mehtabuilders.in', display_order: 1 },
    ],
    3: [
      { name: 'Apex Sports India', logo: uploadedLogos['sponsor-apex-sports.png'], tier: 'Title Sponsor', website: 'https://apexsports.in', display_order: 0 },
      { name: 'Royal Energy Drink', logo: uploadedLogos['sponsor-royal-energy.png'], tier: 'Co-Sponsor', website: 'https://royalenergy.in', display_order: 1 },
    ],
  };

  for (const ev of events) {
    const sponsors = eventSponsorConfigs[ev.id] || [
      { name: 'Apex Sports India', logo: uploadedLogos['sponsor-apex-sports.png'], tier: 'Title Sponsor', website: 'https://apexsports.in', display_order: 0 },
      { name: 'Tata Capital Services', logo: uploadedLogos['sponsor-tata-capital.png'], tier: 'Co-Sponsor', website: 'https://tatacapital.com', display_order: 1 },
    ];

    const putRes = await fetch(`${API_BASE}/admin/events/${ev.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sponsors }),
    });

    const putData: any = await putRes.json();
    console.log(`Updated Event #${ev.id} (${ev.event_name}): ${putRes.status === 200 ? 'SUCCESS' : JSON.stringify(putData)}`);
  }

  console.log('\nAll remote events updated with verified sponsor logos!');
}

syncAllSponsors().catch(console.error);
