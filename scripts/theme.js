// Cosmic palette shared by every generated SVG (pulled from the fairy + city-cat reference art).
const COLORS = {
  void: "#0b0820",
  night: "#150f3a",
  indigo: "#2a1a6e",
  violet: "#7b4dff",
  magenta: "#ff2bd6",
  pink: "#ff6ec7",
  cyan: "#22e4ff",
  sky: "#5ab8ff",
  star: "#f4f1ff",
  muted: "#b9b3e6",
};

const FONT = "'Segoe UI', 'Helvetica Neue', Verdana, Arial, sans-serif";

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// GitHub renders README SVGs through <img>, so web fonts can't load and text can't be measured.
// This is a rough per-character width estimate for bold sans text, good enough to size pills.
const textWidth = (text, fontSize) => {
  let units = 0;
  for (const ch of String(text)) {
    if (/[0-9]/.test(ch)) units += 0.62;
    else if (/[,.\s]/.test(ch)) units += 0.32;
    else if (/[A-Z]/.test(ch)) units += 0.72;
    else units += 0.58;
  }
  return Math.ceil(units * fontSize);
};

module.exports = { COLORS, FONT, escapeXml, textWidth };
