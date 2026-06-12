const sharp = require('sharp');
const fs = require('fs');

// Create a 1200x630 canvas with dark background
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#080808"/>
  <g transform="translate(600, 140) scale(1.3)">
    <path d="M-60 -30 H-75 A25 25 0 0 1 -75 -80 H-60" stroke="#FACC15" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M60 -30 H75 A25 25 0 0 0 75 -80 H60" stroke="#FACC15" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M-80 170 H80" stroke="#FACC15" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-20 50 V 70 C-20 80 -28 88 -38 95 C-65 110 -80 145 -80 170" stroke="#FACC15" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M20 50 V 70 C20 80 28 88 38 95 C65 110 80 145 80 170" stroke="#FACC15" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M60 -80 H-60 V 10 A60 60 0 0 0 60 10 V-80 Z" stroke="#FACC15" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <text x="600" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#FACC15">GoldenXI</text>
  <text x="600" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#A1A1AA">World Cup Bracket Challenge</text>
</svg>
`;

sharp(Buffer.from(svg))
  .resize(1200, 630)
  .png()
  .toFile('./public/og-image.png')
  .then(() => console.log('OG image created: public/og-image.png'))
  .catch(err => console.error('Error creating OG image:', err));
