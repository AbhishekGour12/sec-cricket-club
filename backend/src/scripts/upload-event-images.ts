import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const API_BASE = 'https://sec-api.duckdns.org/api';

async function createEventBanner(
  filename: string,
  title: string,
  tagline: string,
  color1: string,
  color2: string,
  accentColor: string
) {
  const uploadDir = path.join(__dirname, '../../uploads/events');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);

  const svg = `
  <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="60%" style="stop-color:${color2};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#060D1C;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.4" />
        <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bg)" />
    
    <!-- Stadium light effects -->
    <circle cx="150" cy="80" r="300" fill="url(#glow)" />
    <circle cx="1050" cy="80" r="300" fill="url(#glow)" />

    <!-- Cricket pitch geometric lines -->
    <path d="M 0 520 Q 600 460 1200 520 L 1200 675 L 0 675 Z" fill="#0A1428" opacity="0.8" />
    <circle cx="600" cy="560" r="180" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.3" />

    <!-- Top Badge -->
    <rect x="80" y="60" width="280" height="42" rx="21" fill="${accentColor}" opacity="0.2" stroke="${accentColor}" stroke-width="1.5" />
    <text x="220" y="87" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">🏏 SEC CRICKET TOURNAMENT</text>

    <!-- Main Title Card Overlay -->
    <g filter="url(#cardShadow)">
      <text x="80" y="240" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="900" fill="#FFFFFF" letter-spacing="-1">${title.replace(/&/g, '&amp;')}</text>
      <text x="80" y="310" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="${accentColor}" letter-spacing="1">${tagline.replace(/&/g, '&amp;')}</text>
    </g>

    <!-- Feature Highlights Bar -->
    <rect x="80" y="380" width="680" height="70" rx="16" fill="#FFFFFF" opacity="0.08" stroke="#FFFFFF" stroke-width="1" />
    <text x="110" y="422" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">Stadium Lights • Official Fixture • Championship</text>
  </svg>
  `;

  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(filePath);

  console.log(`Created banner: ${filePath}`);
  return filePath;
}

async function main() {
  console.log('Generating banners and uploading to remote server...');

  // 1. Generate distinct banners
  await createEventBanner(
    'event-premier-league-2026.png',
    'SEC Premier League 2026',
    'SEASON OPENER & TOURNAMENT SHOWDOWN',
    '#1A2744',
    '#0F1E36',
    '#F59E0B'
  );

  await createEventBanner(
    'event-champions-cup-2026.png',
    'SEC Champions Cup 2026',
    'SEMI FINALS • HIGH VOLTAGE FLOODLIGHT CLASH',
    '#881337',
    '#4C0519',
    '#FB7185'
  );

  await createEventBanner(
    'event-corporate-trophy-2026.png',
    'Corporate Invitational Trophy',
    'WEEKEND ALL-STARS & CLUB NETWORKING',
    '#064E3B',
    '#022C22',
    '#34D399'
  );

  await createEventBanner(
    'event-cricket-championship.png',
    'Annual Cricket Championship',
    'PREMIER TROPHY LEAGUE & FIXTURES',
    '#1E1B4B',
    '#0F172A',
    '#38BDF8'
  );

  await createEventBanner(
    'event-practice-friendly.png',
    'Monthly Practice Friendly',
    'TRAINING, SQUAD TRIALS & PRACTICE FIXTURE',
    '#1E293B',
    '#0F172A',
    '#A855F7'
  );

  // 2. Authenticate with remote server
  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sportsentertainmentclub9@gmail.com',
      password: '123456',
    }),
  });

  const { token } = (await loginRes.json()) as any;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Upload event images to remote API
  const bannersToUpload = [
    'event-premier-league-2026.png',
    'event-champions-cup-2026.png',
    'event-corporate-trophy-2026.png',
    'event-cricket-championship.png',
    'event-practice-friendly.png',
  ];

  const uploadedUrls: Record<string, string> = {};

  for (const b of bannersToUpload) {
    const localPath = path.join(__dirname, '../../uploads/events', b);
    const fileBuffer = fs.readFileSync(localPath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, b);

    const uploadRes = await fetch(`${API_BASE}/admin/events/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    const uploadData: any = await uploadRes.json();
    if (uploadRes.ok && uploadData.url) {
      uploadedUrls[b] = uploadData.url;
      console.log(`Uploaded ${b} -> ${uploadData.url}`);
    } else {
      console.error(`Failed to upload ${b}:`, uploadData);
    }
  }

  // 4. Fetch all remote events and attach images
  const listRes = await fetch(`${API_BASE}/admin/events?limit=50`, { headers: authHeaders });
  const listData: any = await listRes.json();
  const events = listData.events || [];

  for (const ev of events) {
    let chosenImage = uploadedUrls['event-premier-league-2026.png'];
    const nameLower = (ev.event_name || '').toLowerCase();

    if (nameLower.includes('champions cup') || nameLower.includes('semi final')) {
      chosenImage = uploadedUrls['event-champions-cup-2026.png'];
    } else if (nameLower.includes('corporate')) {
      chosenImage = uploadedUrls['event-corporate-trophy-2026.png'];
    } else if (nameLower.includes('practice') || nameLower.includes('friendly')) {
      chosenImage = uploadedUrls['event-practice-friendly.png'];
    } else if (nameLower.includes('annual cricket') || nameLower.includes('championship')) {
      chosenImage = uploadedUrls['event-cricket-championship.png'];
    }

    // Get full event details to preserve sponsors
    const detailRes = await fetch(`${API_BASE}/admin/events/${ev.id}`, { headers: authHeaders });
    const detailData: any = await detailRes.json();
    const fullEvent = detailData.event || ev;

    const payload = {
      event_name: fullEvent.event_name,
      event_type: fullEvent.event_type,
      event_date: fullEvent.event_date,
      start_time: fullEvent.start_time,
      venue_name: fullEvent.venue_name,
      venue_address: fullEvent.venue_address,
      map_link: fullEvent.map_link,
      teams_involved: fullEvent.teams_involved,
      description: fullEvent.description,
      event_image: chosenImage,
      is_featured: true,
      status: 'Published',
      sponsors: fullEvent.sponsors || [],
    };

    const updateRes = await fetch(`${API_BASE}/admin/events/${ev.id}`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (updateRes.ok) {
      console.log(`Updated Event #${ev.id} ("${ev.event_name}") with cover image: ${chosenImage}`);
    } else {
      const errData = await updateRes.json();
      console.error(`Failed to update Event #${ev.id}:`, errData);
    }
  }

  console.log('\nAll events on remote server updated with cover images!');
}

main().catch(console.error);
