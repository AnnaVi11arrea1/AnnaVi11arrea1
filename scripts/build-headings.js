// Generates assets/headings/*.svg — section titles set in Oxanium, since GitHub markdown can't load fonts.
// Re-run with `node scripts/build-headings.js` after adding or renaming a heading.
const fs = require("fs");
const path = require("path");
const { COLORS, escapeXml } = require("./theme");
const { FAMILY, WEIGHT, fetchFont, advanceWidths, fontFace } = require("./fonts");
const OUT_DIR = path.join(__dirname, "..", "assets", "headings");

const HEADINGS = [
  { file: "about", text: "About me" },
  { file: "stack", text: "Tech stack" },
  { file: "dev", text: "DEV Community" },
  { file: "snake", text: "Contribution snake" },
  { file: "stats", text: "GitHub stats" },
  { file: "trophies", text: "Trophies", size: 24 },
];

// Same four-point sparkle as the banner and dividers.
const sparkle = (x, y, s) =>
  `M${x} ${y - s} Q${x + s * 0.15} ${y - s * 0.15} ${x + s} ${y} Q${x + s * 0.15} ${y + s * 0.15} ${x} ${y + s} Q${x - s * 0.15} ${y + s * 0.15} ${x - s} ${y} Q${x - s * 0.15} ${y - s * 0.15} ${x} ${y - s}Z`;

const renderHeading = (text, size, font, measure) => {
  const letterSpacing = 1;
  const textX = Math.round(size * 1.25);
  const textWidth = Math.ceil(measure(text, size) + letterSpacing * text.length);
  const width = textX + textWidth + 10; // room for the glow
  const height = Math.round(size * 1.6);
  const baseline = Math.round(height * 0.7);
  const sparkleSize = size * 0.38;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(text)}">
  <title>${escapeXml(text)}</title>
  <defs>
    <style>${fontFace(font, `${FAMILY}Heading`, WEIGHT)}</style>
    <linearGradient id="fill" gradientUnits="userSpaceOnUse" x1="${textX}" x2="${textX + textWidth}" y1="0" y2="0">
      <stop offset="0" stop-color="${COLORS.cyan}"/>
      <stop offset="0.55" stop-color="${COLORS.pink}"/>
      <stop offset="1" stop-color="${COLORS.magenta}"/>
    </linearGradient>
    <filter id="glow" x="-10%" y="-40%" width="120%" height="180%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="${sparkle(sparkleSize + 3, baseline - size * 0.36, sparkleSize)}" fill="${COLORS.cyan}" filter="url(#glow)"/>
  <text x="${textX}" y="${baseline}" font-family="'${FAMILY}Heading', 'Segoe UI', sans-serif" font-weight="${WEIGHT}" font-size="${size}" letter-spacing="${letterSpacing}" fill="url(#fill)" filter="url(#glow)">${escapeXml(text)}</text>
</svg>
`;
};

const main = async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const { file, text, size = 30 } of HEADINGS) {
    const font = await fetchFont(text);
    const svg = renderHeading(text, size, font, advanceWidths(font));
    fs.writeFileSync(path.join(OUT_DIR, `${file}.svg`), svg);
    console.log(`Wrote headings/${file}.svg (${(svg.length / 1024).toFixed(1)} KB)`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
