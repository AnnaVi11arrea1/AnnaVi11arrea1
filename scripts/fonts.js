// Font helpers for generated SVGs. GitHub shows README SVGs through <img>, which can't load
// external fonts, so glyphs are fetched as a subset and embedded as a data URI.
const FAMILY = "Oxanium";
const WEIGHT = 700;

// Google Fonts subsets to the requested characters, and serves TTF when no browser UA is sent.
const fetchFont = async (text, weight = WEIGHT) => {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${FAMILY}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/);
  if (!match) throw new Error(`No TTF source in Google Fonts response for "${text}":\n${css}`);
  return Buffer.from(await (await fetch(match[1])).arrayBuffer());
};

// Minimal TrueType reader: just enough of cmap/hmtx to measure a string's advance width,
// so each SVG can be sized to its text and the gradient spans exactly the letters.
const advanceWidths = (font) => {
  const tables = {};
  const numTables = font.readUInt16BE(4);
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    tables[font.toString("latin1", rec, rec + 4)] = font.readUInt32BE(rec + 8);
  }

  const unitsPerEm = font.readUInt16BE(tables.head + 18);
  const numHMetrics = font.readUInt16BE(tables.hhea + 34);
  const glyphAdvance = (gid) => font.readUInt16BE(tables.hmtx + 4 * Math.min(gid, numHMetrics - 1));

  const cmap = tables.cmap;
  const glyphFor = new Map();
  const numSub = font.readUInt16BE(cmap + 2);
  for (let i = 0; i < numSub; i++) {
    const sub = cmap + font.readUInt32BE(cmap + 4 + i * 8 + 4);
    const format = font.readUInt16BE(sub);
    if (format === 4) {
      const segX2 = font.readUInt16BE(sub + 6);
      const ends = sub + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const offsets = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = font.readUInt16BE(ends + s * 2);
        const start = font.readUInt16BE(starts + s * 2);
        const delta = font.readInt16BE(deltas + s * 2);
        const rangeOffset = font.readUInt16BE(offsets + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let gid;
          if (rangeOffset === 0) gid = (c + delta) & 0xffff;
          else {
            gid = font.readUInt16BE(offsets + s * 2 + rangeOffset + (c - start) * 2);
            if (gid !== 0) gid = (gid + delta) & 0xffff;
          }
          if (gid) glyphFor.set(c, gid);
        }
      }
    } else if (format === 12) {
      const groups = font.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const rec = sub + 16 + g * 12;
        const start = font.readUInt32BE(rec);
        const end = font.readUInt32BE(rec + 4);
        const startGid = font.readUInt32BE(rec + 8);
        for (let c = start; c <= end; c++) glyphFor.set(c, startGid + c - start);
      }
    }
  }

  return (text, size) => {
    let units = 0;
    for (const ch of text) units += glyphAdvance(glyphFor.get(ch.codePointAt(0)) || 0);
    return (units / unitsPerEm) * size;
  };
};

const fontFace = (font, family, weight) =>
  `@font-face { font-family: '${family}'; font-weight: ${weight}; src: url(data:font/ttf;base64,${font.toString("base64")}) format('truetype'); }`;

module.exports = { FAMILY, WEIGHT, fetchFont, advanceWidths, fontFace };
