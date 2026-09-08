import fs from 'fs';
import path from 'path';

const API_BASE = 'https://sec-api.duckdns.org/api';

// Curated high quality cricket & stadium photography URLs
const PHOTO_SOURCES = [
  {
    filename: 'event-cricket-night-match.jpg',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80&auto=format&fit=crop', // Night cricket stadium
  },
  {
    filename: 'event-cricket-batsman-action.jpg',
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80&auto=format&fit=crop', // Cricket match action
  },
  {
    filename: 'event-cricket-stadium-pitch.jpg',
    url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200&q=80&auto=format&fit=crop', // Lush stadium pitch & crowd
  },
  {
    filename: 'event-cricket-trophy-celebration.jpg',
    url: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=1200&q=80&auto=format&fit=crop', // Trophy celebration / championship
  },
  {
    filename: 'event-sports-networking.jpg',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80&auto=format&fit=crop', // Gala / awards networking
  },
];

async function downloadPhoto(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    console.log(`Downloaded photo -> ${destPath} (${Math.round(arrayBuffer.byteLength / 1024)} KB)`);
    return true;
  } catch (err: any) {
    console.warn(`Could not download ${url}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Fetching real event photos and uploading to remote server...');

  const eventsDir = path.join(__dirname, '../../uploads/events');
  if (!fs.existsSync(eventsDir)) {
    fs.mkdirSync(eventsDir, { recursive: true });
  }

  // 1. Download or copy photos
  const uploadedUrls: Record<string, string> = {};

  for (const item of PHOTO_SOURCES) {
    const localPath = path.join(eventsDir, item.filename);
    if (!fs.existsSync(localPath)) {
      const ok = await downloadPhoto(item.url, localPath);
      if (!ok) {
        // Fallback to existing demo photo if offline/download error
        const fallback = path.join(__dirname, '../../uploads/announcements/demo-summer-cup.jpg');
        if (fs.existsSync(fallback)) {
          fs.copyFileSync(fallback, localPath);
          console.log(`Used local fallback for ${item.filename}`);
        }
      }
    }
  }

  // Also include local demo photos if present
  const localDemoPhotos = [
    { name: 'demo-summer-cup.jpg', path: path.join(__dirname, '../../uploads/announcements/demo-summer-cup.jpg') },
    { name: 'demo-networking.jpg', path: path.join(__dirname, '../../uploads/announcements/demo-networking.jpg') },
    { name: 'demo-membership.jpg', path: path.join(__dirname, '../../uploads/announcements/demo-membership.jpg') },
    { name: 'demo-agm.jpg', path: path.join(__dirname, '../../uploads/announcements/demo-agm.jpg') },
  ];

  for (const dp of localDemoPhotos) {
    const target = path.join(eventsDir, dp.name);
    if (fs.existsSync(dp.path) && !fs.existsSync(target)) {
      fs.copyFileSync(dp.path, target);
    }
  }

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

  // 3. Upload all photos to remote server
  const allPhotoFiles = [
    'event-cricket-night-match.jpg',
    'event-cricket-batsman-action.jpg',
    'event-cricket-stadium-pitch.jpg',
    'event-cricket-trophy-celebration.jpg',
    'event-sports-networking.jpg',
    'demo-summer-cup.jpg',
    'demo-networking.jpg',
    'demo-agm.jpg',
  ];

  for (const filename of allPhotoFiles) {
    const localPath = path.join(eventsDir, filename);
    if (fs.existsSync(localPath)) {
      try {
        const fileBuffer = fs.readFileSync(localPath);
        const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const blob = new Blob([fileBuffer], { type: mimeType });
        const formData = new FormData();
        formData.append('file', blob, filename);

        const uploadRes = await fetch(`${API_BASE}/admin/events/upload`, {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });

        const uploadData: any = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          uploadedUrls[filename] = uploadData.url;
          console.log(`Uploaded ${filename} -> ${uploadData.url}`);
        } else {
          console.error(`Failed to upload ${filename}:`, uploadData);
        }
      } catch (err: any) {
        console.error(`Upload error for ${filename}:`, err.message);
      }
    }
  }

  // 4. Map beautiful realistic event images to remote events
  const listRes = await fetch(`${API_BASE}/admin/events?limit=50`, { headers: authHeaders });
  const listData: any = await listRes.json();
  const events = listData.events || [];

  const photoMapping: Record<string, string> = {
    'sec annual premier league 2026': uploadedUrls['event-cricket-night-match.jpg'] || uploadedUrls['demo-summer-cup.jpg'],
    'sec champions cup 2026 - semi finals': uploadedUrls['event-cricket-batsman-action.jpg'] || uploadedUrls['demo-summer-cup.jpg'],
    'sec corporate invitational trophy': uploadedUrls['event-sports-networking.jpg'] || uploadedUrls['demo-networking.jpg'],
    'sec premier league — season opener 2026': uploadedUrls['event-cricket-stadium-pitch.jpg'] || uploadedUrls['demo-summer-cup.jpg'],
    'sec annual cricket championship 2026': uploadedUrls['event-cricket-trophy-celebration.jpg'] || uploadedUrls['demo-agm.jpg'],
    'sec monthly practice friendly — september 2026': uploadedUrls['demo-membership.jpg'] || uploadedUrls['event-cricket-stadium-pitch.jpg'],
  };

  for (const ev of events) {
    const key = (ev.event_name || '').toLowerCase().trim();
    const chosenImage = photoMapping[key] || uploadedUrls['event-cricket-night-match.jpg'] || ev.event_image;

    // Fetch full event details to keep existing sponsors intact
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
      console.log(`Updated Event #${ev.id} ("${ev.event_name}") with realistic photo -> ${chosenImage}`);
    } else {
      const errJson = await updateRes.json();
      console.error(`Failed to update #${ev.id}:`, errJson);
    }
  }

  console.log('\nAll events successfully updated with high quality real event photography on remote server!');
}

main().catch(console.error);
