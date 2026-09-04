const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
const outputDir = path.join(rootDir, 'playstore-assets');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const logoPath = path.join(rootDir, 'frontend/assets/images/logo.png');

async function generateAssets() {
  console.log('Generating Google Play Store assets...');

  // 1. App Icon: 512 x 512 PNG
  const iconSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1A2744" />
        <stop offset="100%" stop-color="#0E1626" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />
    <circle cx="256" cy="256" r="225" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
    <circle cx="256" cy="256" r="215" fill="none" stroke="url(#goldGrad)" stroke-width="2.5" opacity="0.6" />
  </svg>
  `;

  // Resize logo for 512x512 icon
  const logoForIcon = await sharp(logoPath)
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const iconOutput = path.join(outputDir, 'app-icon-512x512.png');
  await sharp(Buffer.from(iconSvg))
    .composite([
      {
        input: logoForIcon,
        top: 76,
        left: 76,
      },
    ])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(iconOutput);

  console.log('✅ Created App Icon:', iconOutput);

  // 2. Feature Graphic: 1024 x 500 PNG
  const bannerSvg = `
  <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="40%" stop-color="#1A2744" />
        <stop offset="100%" stop-color="#0B1120" />
      </linearGradient>
      <linearGradient id="redAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#DC2626" />
        <stop offset="100%" stop-color="#991B1B" />
      </linearGradient>
      <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="50%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="1024" height="500" fill="url(#bannerBg)" />
    <rect width="1024" height="500" fill="url(#gridPattern)" />

    <!-- Ambient glow circles -->
    <circle cx="260" cy="250" r="220" fill="#1E3A8A" opacity="0.3" filter="blur(40px)" />
    <circle cx="800" cy="200" r="180" fill="#DC2626" opacity="0.15" filter="blur(50px)" />
    <circle cx="260" cy="250" r="150" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
    <circle cx="260" cy="250" r="170" fill="none" stroke="url(#goldText)" stroke-width="1.5" opacity="0.4" stroke-dasharray="6,6" />

    <!-- Subtle accent bar -->
    <rect x="490" y="160" width="6" height="180" rx="3" fill="url(#redAccent)" />

    <!-- Text Section -->
    <text x="520" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" letter-spacing="2">
      SEC CRICKET CLUB
    </text>

    <text x="520" y="255" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="url(#goldText)" letter-spacing="1.5">
      EXCLUSIVE MEMBER COMMUNITY &amp; NETWORK
    </text>

    <!-- Badges / Tagline Pills -->
    <g transform="translate(520, 290)">
      <!-- Pill 1 -->
      <rect x="0" y="0" width="130" height="32" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <text x="65" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#E2E8F0" text-anchor="middle">🏏 Sports Club</text>

      <!-- Pill 2 -->
      <rect x="142" y="0" width="145" height="32" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <text x="214.5" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#E2E8F0" text-anchor="middle">👥 Member Directory</text>

      <!-- Pill 3 -->
      <rect x="299" y="0" width="135" height="32" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <text x="366.5" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#E2E8F0" text-anchor="middle">📢 Club Events</text>
    </g>
  </svg>
  `;

  // Resize logo for 1024x500 banner (left side)
  const logoForBanner = await sharp(logoPath)
    .resize(260, 260, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const bannerOutput = path.join(outputDir, 'feature-graphic-1024x500.png');
  await sharp(Buffer.from(bannerSvg))
    .composite([
      {
        input: logoForBanner,
        top: 120,
        left: 130,
      },
    ])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(bannerOutput);

  console.log('✅ Created Feature Graphic:', bannerOutput);
}

generateAssets().catch(console.error);
