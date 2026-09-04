const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
const outputDir = path.join(rootDir, 'playstore-assets');
const logoPath = path.join(rootDir, 'frontend/assets/images/logo.png');

async function generateScreenshots() {
  console.log('Generating Play Store Phone Screenshots...');

  const logoBuffer = await sharp(logoPath)
    .resize(220, 220, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const screens = [
    {
      name: 'phone-screenshot-1.png',
      headline: 'WELCOME TO SEC CRICKET CLUB',
      subline: 'Exclusive Member Network &amp; Sports Community',
      accentColor: '#F59E0B',
      cardTitle: 'Club Announcements &amp; Events',
      cardSubtitle: 'Stay updated with all tournament fixtures and meetings.',
      tag: 'TOURNAMENTS &amp; MATCHES',
    },
    {
      name: 'phone-screenshot-2.png',
      headline: 'VERIFIED MEMBER DIRECTORY',
      subline: 'Discover &amp; Network with Fellow Club Members',
      accentColor: '#3B82F6',
      cardTitle: 'Professional Business Directory',
      cardSubtitle: 'Browse members by category, designation, and skills.',
      tag: 'CONNECT WITH MEMBERS',
    },
    {
      name: 'phone-screenshot-3.png',
      headline: 'DIGITAL BUSINESS CARDS',
      subline: 'Share Visiting Cards &amp; Promote Your Business',
      accentColor: '#10B981',
      cardTitle: 'Business Flyers &amp; Showcase',
      cardSubtitle: 'Upload marketing flyers and product showcase galleries.',
      tag: 'BUSINESS NETWORKING',
    },
    {
      name: 'phone-screenshot-4.png',
      headline: 'REAL-TIME NOTIFICATIONS',
      subline: 'Never Miss Important Club Updates',
      accentColor: '#EC4899',
      cardTitle: 'Live Updates &amp; Event RSVP',
      cardSubtitle: 'Instant push alerts for club activities and notices.',
      tag: 'INSTANT NOTIFICATIONS',
    },
  ];

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const svg = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad${i}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="35%" stop-color="#1A2744" />
          <stop offset="100%" stop-color="#0B1120" />
        </linearGradient>
        <linearGradient id="cardGrad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0F172A" />
        </linearGradient>
        <linearGradient id="accentGrad${i}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${s.accentColor}" />
          <stop offset="100%" stop-color="#FFFFFF" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1080" height="1920" fill="url(#bgGrad${i})" />

      <!-- Ambient glow -->
      <circle cx="540" cy="500" r="400" fill="${s.accentColor}" opacity="0.12" filter="blur(60px)" />

      <!-- Top Tag Pill -->
      <g transform="translate(340, 160)">
        <rect x="0" y="0" width="400" height="52" rx="26" fill="rgba(255,255,255,0.08)" stroke="${s.accentColor}" stroke-width="2" />
        <text x="200" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="${s.accentColor}" text-anchor="middle" letter-spacing="1">
          ${s.tag}
        </text>
      </g>

      <!-- Main Headline -->
      <text x="540" y="290" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">
        ${s.headline}
      </text>

      <!-- Subline -->
      <text x="540" y="360" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500" fill="#94A3B8" text-anchor="middle">
        ${s.subline}
      </text>

      <!-- Mockup Phone Frame -->
      <g transform="translate(190, 480)">
        <!-- Phone Outer Shell -->
        <rect x="0" y="0" width="700" height="1340" rx="60" fill="#0B0F19" stroke="rgba(255,255,255,0.15)" stroke-width="4" />
        
        <!-- Screen Glass -->
        <rect x="20" y="20" width="660" height="1300" rx="44" fill="#131D33" />

        <!-- Camera Notch / Dynamic Island -->
        <rect x="270" y="35" width="120" height="24" rx="12" fill="#000000" />

        <!-- Header inside app -->
        <rect x="45" y="90" width="610" height="75" rx="16" fill="#1A2744" />
        <text x="350" y="138" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          SEC CRICKET CLUB
        </text>

        <!-- Card Container 1 -->
        <g transform="translate(45, 400)">
          <rect x="0" y="0" width="610" height="340" rx="24" fill="url(#cardGrad${i})" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
          <rect x="30" y="30" width="8" height="40" rx="4" fill="${s.accentColor}" />
          <text x="50" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">
            ${s.cardTitle}
          </text>
          <text x="30" y="125" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94A3B8">
            ${s.cardSubtitle}
          </text>

          <!-- Action Button inside Card -->
          <rect x="30" y="220" width="550" height="70" rx="18" fill="#C41230" />
          <text x="305" y="264" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle">
            Explore Now
          </text>
        </g>

        <!-- Feature List Items inside Phone -->
        <g transform="translate(45, 780)">
          <rect x="0" y="0" width="610" height="100" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
          <circle cx="50" cy="50" r="24" fill="${s.accentColor}" opacity="0.2" />
          <circle cx="50" cy="50" r="10" fill="${s.accentColor}" />
          <text x="95" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#F1F5F9">
            Verified Club Member Network
          </text>
        </g>

        <g transform="translate(45, 900)">
          <rect x="0" y="0" width="610" height="100" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
          <circle cx="50" cy="50" r="24" fill="${s.accentColor}" opacity="0.2" />
          <circle cx="50" cy="50" r="10" fill="${s.accentColor}" />
          <text x="95" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#F1F5F9">
            Digital Visiting Cards &amp; Flyers
          </text>
        </g>

        <g transform="translate(45, 1020)">
          <rect x="0" y="0" width="610" height="100" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
          <circle cx="50" cy="50" r="24" fill="${s.accentColor}" opacity="0.2" />
          <circle cx="50" cy="50" r="10" fill="${s.accentColor}" />
          <text x="95" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#F1F5F9">
            Club Tournaments &amp; Announcements
          </text>
        </g>

        <!-- Bottom Navigation Mockup -->
        <g transform="translate(20, 1190)">
          <rect x="0" y="0" width="660" height="80" fill="#0D1525" />
          <line x1="0" y1="0" x2="660" y2="0" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
          <text x="110" y="48" font-size="18" font-weight="700" fill="#FFFFFF" text-anchor="middle">Home</text>
          <text x="330" y="48" font-size="18" font-weight="700" fill="#94A3B8" text-anchor="middle">Directory</text>
          <text x="550" y="48" font-size="18" font-weight="700" fill="#94A3B8" text-anchor="middle">Profile</text>
        </g>
      </g>
    </svg>
    `;

    const outputPath = path.join(outputDir, s.name);
    await sharp(Buffer.from(svg))
      .composite([
        {
          input: logoBuffer,
          top: 660,
          left: 430,
        },
      ])
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`✅ Created Screenshot ${i + 1}:`, outputPath);
  }
}

generateScreenshots().catch(console.error);
