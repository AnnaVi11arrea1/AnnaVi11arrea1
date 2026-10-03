// One-off generator for assets/hero.svg. Re-run with `node scripts/build-hero.js` after tweaking.
const fs = require("fs");
const path = require("path");
const { COLORS, FONT } = require("./theme");
const { FAMILY, fetchFont, fontFace } = require("./fonts");

const W = 900;
const H = 280;
const OUT = path.join(__dirname, "..", "assets", "hero.svg");

// Small seeded RNG so the banner is identical between runs.
let seed = 815;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const dots = Array.from({ length: 70 }, (_, i) => {
  const x = (rand() * W).toFixed(1);
  const y = (rand() * (H - 90)).toFixed(1);
  const r = (rand() * 1.2 + 0.4).toFixed(2);
  return `<circle class="tw" cx="${x}" cy="${y}" r="${r}" fill="${COLORS.star}" style="animation-delay:${(rand() * 4).toFixed(2)}s"/>`;
}).join("");

// Four-point sparkles like the ones in the city-cat window.
const sparkle = (x, y, s, color, delay) =>
  `<path class="sp" style="animation-delay:${delay}s;transform-origin:${x}px ${y}px" fill="${color}" d="M${x} ${y - s} Q${x + s * 0.15} ${y - s * 0.15} ${x + s} ${y} Q${x + s * 0.15} ${y + s * 0.15} ${x} ${y + s} Q${x - s * 0.15} ${y + s * 0.15} ${x - s} ${y} Q${x - s * 0.15} ${y - s * 0.15} ${x} ${y - s}Z"/>`;

const sparkles = [
  sparkle(92, 52, 11, COLORS.star, 0),
  sparkle(812, 44, 13, COLORS.cyan, 1.2),
  sparkle(728, 128, 7, COLORS.pink, 2.1),
  sparkle(176, 150, 6, COLORS.cyan, 0.7),
  sparkle(612, 34, 6, COLORS.star, 2.8),
  sparkle(300, 30, 8, COLORS.pink, 1.6),
].join("");

// Skyline silhouette with lit windows along the bottom edge.
const buildings = [];
const windows = [];
for (let x = -10; x < W; ) {
  const w = 26 + Math.floor(rand() * 34);
  const h = 28 + Math.floor(rand() * 58);
  const y = H - h;
  buildings.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`);
  if (rand() > 0.55) buildings.push(`<rect x="${x + w / 2 - 1}" y="${y - 10}" width="2" height="10"/>`);
  for (let wy = y + 8; wy < H - 6; wy += 9) {
    for (let wx = x + 5; wx < x + w - 6; wx += 8) {
      if (rand() > 0.78) {
        const color = rand() > 0.5 ? COLORS.cyan : COLORS.pink;
        windows.push(`<rect class="win" x="${wx}" y="${wy}" width="3" height="4" fill="${color}" style="animation-delay:${(rand() * 6).toFixed(1)}s"/>`);
      }
    }
  }
  x += w + 2;
}

const renderHero = (fontCss) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Anna Villarreal — Infinite Curiosity">
  <title>Anna Villarreal — Infinite Curiosity</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${COLORS.void}"/>
      <stop offset="0.55" stop-color="#0f0a2c"/>
      <stop offset="1" stop-color="#22125a"/>
    </linearGradient>
    <radialGradient id="nebulaPink" cx="0.78" cy="0.3" r="0.45">
      <stop offset="0" stop-color="${COLORS.magenta}" stop-opacity="0.3"/>
      <stop offset="1" stop-color="${COLORS.magenta}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="nebulaCyan" cx="0.18" cy="0.45" r="0.45">
      <stop offset="0" stop-color="${COLORS.cyan}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${COLORS.cyan}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="name" x1="0" x2="1">
      <stop offset="0" stop-color="${COLORS.cyan}"/>
      <stop offset="0.5" stop-color="${COLORS.pink}"/>
      <stop offset="1" stop-color="${COLORS.magenta}"/>
    </linearGradient>
    <linearGradient id="frame" x1="0" x2="1">
      <stop offset="0" stop-color="${COLORS.cyan}"/>
      <stop offset="0.5" stop-color="${COLORS.violet}"/>
      <stop offset="1" stop-color="${COLORS.magenta}"/>
    </linearGradient>
    <linearGradient id="city" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c1450"/>
      <stop offset="1" stop-color="${COLORS.void}"/>
    </linearGradient>
    <radialGradient id="scrim" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${COLORS.void}" stop-opacity="0.75"/>
      <stop offset="1" stop-color="${COLORS.void}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-10%" y="-40%" width="120%" height="180%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  </defs>
  <style>
    ${fontCss}
    .tw { animation: tw 3.5s ease-in-out infinite; }
    .sp { animation: sp 4s ease-in-out infinite; }
    .win { animation: win 6s steps(1) infinite; }
    .drift { animation: drift 14s ease-in-out infinite alternate; }
    @keyframes tw { 0%,100% { opacity: .2 } 50% { opacity: 1 } }
    @keyframes sp { 0%,100% { opacity: .5; transform: scale(.7) } 50% { opacity: 1; transform: scale(1.1) } }
    @keyframes win { 0%,80% { opacity: 1 } 90% { opacity: .25 } }
    @keyframes drift { from { transform: translateX(-12px) } to { transform: translateX(12px) } }
    @media (prefers-reduced-motion: reduce) { .tw, .sp, .win, .drift { animation: none; } }
  </style>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <g class="drift">
      <rect width="${W}" height="${H}" fill="url(#nebulaPink)"/>
      <rect width="${W}" height="${H}" fill="url(#nebulaCyan)"/>
    </g>
    ${dots}
    ${sparkles}
    <ellipse cx="${W / 2}" cy="140" rx="380" ry="90" fill="url(#scrim)"/>
    <g fill="url(#city)">${buildings.join("")}</g>
    ${windows.join("")}
  </g>
  <text x="${W / 2}" y="112" text-anchor="middle" font-family="'${FAMILY}Name', ${FONT}" font-size="58" font-weight="700" letter-spacing="1" fill="url(#name)" filter="url(#glow)">Anna Villarreal</text>
  <text x="${W / 2}" y="154" text-anchor="middle" font-family="'${FAMILY}Text', ${FONT}" font-size="17" font-weight="600" letter-spacing="6" fill="${COLORS.star}">I N F I N I T E   ✦   C U R I O S I T Y</text>
  <text x="${W / 2}" y="188" text-anchor="middle" font-family="'${FAMILY}Text', ${FONT}" font-size="18" font-weight="600" letter-spacing="1" fill="${COLORS.cyan}">Web Developer · IT Support · Artist · Chicagoland</text>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="21" fill="none" stroke="url(#frame)" stroke-width="3"/>
</svg>
`;

// Thin glowing rule used between README sections.
const divider = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="24" viewBox="0 0 ${W} 24" role="presentation">
  <defs>
    <linearGradient id="line" x1="0" x2="1">
      <stop offset="0" stop-color="${COLORS.cyan}" stop-opacity="0"/>
      <stop offset="0.25" stop-color="${COLORS.cyan}"/>
      <stop offset="0.5" stop-color="${COLORS.violet}"/>
      <stop offset="0.75" stop-color="${COLORS.magenta}"/>
      <stop offset="1" stop-color="${COLORS.magenta}" stop-opacity="0"/>
    </linearGradient>
    <filter id="g"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <rect x="0" y="11" width="${W}" height="2" fill="url(#line)" filter="url(#g)"/>
  <rect x="0" y="11.5" width="${W}" height="1" fill="url(#line)"/>
  ${sparkle(W / 2, 12, 9, COLORS.star, 0)}
  <style>.sp { animation: sp 4s ease-in-out infinite; } @keyframes sp { 0%,100% { opacity: .5; transform: scale(.7) } 50% { opacity: 1; transform: scale(1.1) } } @media (prefers-reduced-motion: reduce) { .sp { animation: none; } }</style>
</svg>
`;

const main = async () => {
  const name = "Anna Villarreal";
  const text = "INFINTECUROSYWeb Developer · IT Support · Artist · Chicagoland";
  const fontCss = [
    fontFace(await fetchFont(name, 700), `${FAMILY}Name`, 700),
    fontFace(await fetchFont(text, 600), `${FAMILY}Text`, 600),
  ].join(" ");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, renderHero(fontCss));
  fs.writeFileSync(path.join(path.dirname(OUT), "divider.svg"), divider);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} and divider.svg`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
