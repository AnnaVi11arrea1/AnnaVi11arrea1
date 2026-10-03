const fs = require("fs");
const https = require("https");
const path = require("path");
const { COLORS, FONT, escapeXml, textWidth } = require("./theme");

const DEVTO_API_KEY = process.env.DEVTO_API_KEY;
const DEVTO_USERNAME = process.env.DEVTO_USERNAME || "annavi11arrea1";
// Lets the badge be re-rendered locally (e.g. for a design preview) without hitting the API.
const COUNT_OVERRIDE = process.env.FOLLOWERS_COUNT;
const BADGE_FILE = path.join(__dirname, "..", "assets", "devto-followers.svg");
const USER_AGENT = "AnnaVi11arrea1-GitHub-Actions";

if (!DEVTO_API_KEY && !COUNT_OVERRIDE) {
  throw new Error("Missing required DEVTO_API_KEY environment variable.");
}

const parseResponsePreview = (data) => {
  const trimmed = data.trim();
  return trimmed ? trimmed.slice(0, 500) : "<empty>";
};

const fetchJson = (path) => {
  const options = {
    hostname: "dev.to",
    port: 443,
    path,
    method: "GET",
    headers: {
      "api-key": DEVTO_API_KEY,
      Accept: "application/vnd.forem.api-v1+json",
      "User-Agent": USER_AGENT,
    },
    timeout: 15000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          const preview = parseResponsePreview(data);
          reject(
            new Error(
              `DEV.to API request failed (${res.statusCode} ${res.statusMessage || "Unknown"}). Response preview: ${preview}`
            )
          );
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse API response. Response data: ${data}`));
        }
      });
    });

    req.on("timeout", () => req.destroy(new Error("DEV.to API request timed out.")));
    req.on("error", reject);
    req.end();
  });
};

const getFollowersCount = async () => {
  const perPage = 1000;
  let page = 1;
  let totalCount = 0;

  while (true) {
    const followers = await fetchJson(
      `/api/followers/users?page=${page}&per_page=${perPage}`
    );

    if (!Array.isArray(followers)) {
      throw new Error("DEV.to followers endpoint returned an invalid response.");
    }

    totalCount += followers.length;

    if (followers.length < perPage) {
      return totalCount;
    }

    page += 1;
  }
};

// A two-segment pill: DEV logo + label on the night sky, count on a magenta → cyan glow.
const renderBadge = (count) => {
  const value = Number(count).toLocaleString("en-US");
  const label = "FOLLOWERS";
  const height = 40;
  const logoWidth = 44;
  const labelWidth = textWidth(label, 13) + 28;
  const valueWidth = textWidth(value, 17) + 36;
  const leftWidth = logoWidth + labelWidth;
  const width = leftWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 8}" height="${height + 8}" viewBox="-4 -4 ${width + 8} ${height + 8}" role="img" aria-label="DEV.to followers: ${escapeXml(value)}">
  <title>DEV.to followers: ${escapeXml(value)}</title>
  <defs>
    <linearGradient id="value" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${COLORS.magenta}"/>
      <stop offset="1" stop-color="${COLORS.violet}"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${COLORS.cyan}"/>
      <stop offset="0.5" stop-color="${COLORS.violet}"/>
      <stop offset="1" stop-color="${COLORS.magenta}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="pill"><rect width="${width}" height="${height}" rx="${height / 2}"/></clipPath>
    <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" rx="${height / 2}" fill="none" stroke="url(#edge)" stroke-width="3" filter="url(#glow)" opacity="0.9"/>
  <g clip-path="url(#pill)">
    <rect width="${leftWidth}" height="${height}" fill="${COLORS.night}"/>
    <rect x="${leftWidth}" width="${valueWidth}" height="${height}" fill="url(#value)"/>
    <rect width="${width}" height="${height}" fill="url(#shine)"/>
  </g>
  <rect width="${width}" height="${height}" rx="${height / 2}" fill="none" stroke="url(#edge)" stroke-width="1.5"/>
  <rect x="14" y="10" width="30" height="20" rx="4" fill="${COLORS.star}"/>
  <text x="29" y="24.5" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="800" fill="${COLORS.void}">DEV</text>
  <text x="${logoWidth + labelWidth / 2}" y="25" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="700" letter-spacing="1.5" fill="${COLORS.cyan}">${label}</text>
  <text x="${leftWidth + valueWidth / 2}" y="26.5" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="800" fill="#fff">${escapeXml(value)}</text>
</svg>
`;
};

const updateBadge = async () => {
  const count = COUNT_OVERRIDE ? Number(COUNT_OVERRIDE) : await getFollowersCount();
  fs.mkdirSync(path.dirname(BADGE_FILE), { recursive: true });
  fs.writeFileSync(BADGE_FILE, renderBadge(count));
  console.log("Follower badge updated with count:", count);
};

updateBadge().catch((error) => {
  console.error(error);
  process.exit(1);
});
