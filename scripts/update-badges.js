const fs = require("fs");
const path = require("path");
const { COLORS, FONT, escapeXml } = require("./theme");

const DEVTO_USERNAME = process.env.DEVTO_USERNAME || "annavi11arrea1";
const PROFILE_URL = `https://dev.to/${DEVTO_USERNAME}`;
const CARD_FILE = path.join(__dirname, "..", "assets", "devto-badges.svg");
const USER_AGENT = "Mozilla/5.0 (compatible; AnnaVi11arrea1-GitHub-Actions)";

// DEV has no API for badges, so they're read from the public profile page.
// Each badge is rendered as: <div ... title="Badge Name" class="js-profile-badge ..."><img src="...">
const BADGE_PATTERN =
  /<div[^>]*?title="([^"]+)"[^>]*?class="js-profile-badge[^"]*"[^>]*>\s*<img\s+src="([^"]+)"/g;

const ICON = 64;
const GAP = 14;
const PER_ROW = 10;
const PAD_X = 32;
const HEADER = 64;
const PAD_BOTTOM = 28;

const decodeHtml = (value) =>
  value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

const fetchOk = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url} failed (${res.status} ${res.statusText})`);
  return res;
};

const scrapeBadges = async () => {
  const html = await (await fetchOk(PROFILE_URL)).text();
  const badges = [];
  const seen = new Set();

  for (const [, title, src] of html.matchAll(BADGE_PATTERN)) {
    const name = decodeHtml(title);
    if (seen.has(name)) continue;
    seen.add(name);
    // Ask DEV's image CDN for a small webp instead of the 192px default, to keep the card light.
    badges.push({ name, src: src.replace(/width=\d+/, "width=96").replace(/format=auto/, "format=webp") });
  }

  return badges;
};

// GitHub shows README SVGs as <img>, which blocks external hrefs, so images must be inlined.
const toDataUri = async (url) => {
  const res = await fetchOk(url);
  const type = res.headers.get("content-type") || "image/png";
  const data = Buffer.from(await res.arrayBuffer()).toString("base64");
  return `data:${type};base64,${data}`;
};

const renderCard = (badges) => {
  const rows = Math.ceil(badges.length / PER_ROW);
  const width = PAD_X * 2 + PER_ROW * ICON + (PER_ROW - 1) * GAP;
  const height = HEADER + rows * ICON + (rows - 1) * GAP + PAD_BOTTOM;

  const cells = badges
    .map((badge, i) => {
      const row = Math.floor(i / PER_ROW);
      const col = i % PER_ROW;
      // Center a short last row instead of leaving it ragged-left.
      const inRow = row === rows - 1 ? badges.length - row * PER_ROW : PER_ROW;
      const rowOffset = ((PER_ROW - inRow) * (ICON + GAP)) / 2;
      const x = PAD_X + rowOffset + col * (ICON + GAP);
      const y = HEADER + row * (ICON + GAP);
      const delay = ((i * 0.37) % 4).toFixed(2);
      return `  <g class="b" style="animation-delay:${delay}s">
    <title>${escapeXml(badge.name)}</title>
    <circle cx="${x + ICON / 2}" cy="${y + ICON / 2}" r="${ICON / 2 + 3}" fill="${COLORS.indigo}" opacity="0.55"/>
    <image href="${badge.dataUri}" x="${x}" y="${y}" width="${ICON}" height="${ICON}" preserveAspectRatio="xMidYMid meet"/>
  </g>`;
    })
    .join("\n");

  const stars = Array.from({ length: 26 }, (_, i) => {
    // Deterministic scatter so the file only changes when the badges do.
    const x = (i * 97 + 31) % width;
    const y = (i * 53 + 17) % height;
    const r = i % 3 === 0 ? 1.4 : 0.8;
    return `<circle class="s" cx="${x}" cy="${y}" r="${r}" fill="${COLORS.star}" style="animation-delay:${(i % 5) * 0.6}s"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${badges.length} DEV.to badges">
  <title>${badges.length} DEV.to badges earned by ${escapeXml(DEVTO_USERNAME)}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLORS.void}"/>
      <stop offset="0.6" stop-color="${COLORS.night}"/>
      <stop offset="1" stop-color="${COLORS.indigo}"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" x2="1">
      <stop offset="0" stop-color="${COLORS.cyan}"/>
      <stop offset="0.5" stop-color="${COLORS.violet}"/>
      <stop offset="1" stop-color="${COLORS.magenta}"/>
    </linearGradient>
    <radialGradient id="nebula" cx="0.85" cy="0.1" r="0.7">
      <stop offset="0" stop-color="${COLORS.magenta}" stop-opacity="0.25"/>
      <stop offset="1" stop-color="${COLORS.magenta}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .s { animation: twinkle 3s ease-in-out infinite; }
    .b { animation: float 4s ease-in-out infinite; }
    @keyframes twinkle { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
    @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
    @media (prefers-reduced-motion: reduce) { .s, .b { animation: none; } }
  </style>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="url(#bg)"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="url(#nebula)"/>
  ${stars}
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="none" stroke="url(#edge)" stroke-width="2"/>
  <text x="${PAD_X}" y="40" font-family="${FONT}" font-size="18" font-weight="800" letter-spacing="2" fill="${COLORS.pink}">✦ BADGE COLLECTION</text>
  <text x="${width - PAD_X}" y="40" text-anchor="end" font-family="${FONT}" font-size="14" font-weight="600" fill="${COLORS.cyan}">${badges.length} earned on DEV</text>
${cells}
</svg>
`;
};

const main = async () => {
  const badges = await scrapeBadges();

  // An empty result almost always means DEV changed its markup; keep the last good card.
  if (badges.length === 0) {
    throw new Error("No badges found on the DEV profile page; leaving the existing card untouched.");
  }

  for (const badge of badges) {
    badge.dataUri = await toDataUri(badge.src);
  }

  fs.mkdirSync(path.dirname(CARD_FILE), { recursive: true });
  fs.writeFileSync(CARD_FILE, renderCard(badges));
  console.log(`Badge card updated with ${badges.length} badges.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
