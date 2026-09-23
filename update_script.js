const fs = require("fs");
const https = require("https");

const DEVTO_API_KEY = process.env.DEVTO_API_KEY;
const DEVTO_USERNAME = process.env.DEVTO_USERNAME || "annavi11arrea1";
const README_FILE = "README.md";
const START_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:START -->";
const END_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:END -->";
const USER_AGENT = "AnnaVi11arrea1-GitHub-Actions";

if (!DEVTO_API_KEY) {
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
  const candidatePaths = [
    `/api/users/by_username?url=${encodeURIComponent(`https://dev.to/${DEVTO_USERNAME}`)}`,
    `/api/users/by_username?url=${encodeURIComponent(DEVTO_USERNAME)}`,
    `/api/users/${encodeURIComponent(DEVTO_USERNAME)}`,
  ];

  let lastError = null;

  for (const path of candidatePaths) {
    try {
      const response = await fetchJson(path);
      const payload = response && response.user ? response.user : response;

      const rawFollowersCount =
        payload?.followers_count ??
        payload?.followersCount ??
        payload?.user?.followers_count ??
        payload?.user?.followersCount;

      const followersCount = Number(rawFollowersCount);
      if (Number.isFinite(followersCount)) {
        return followersCount;
      }

      const availableKeys = payload ? Object.keys(payload).slice(0, 15).join(", ") : "<none>";
      lastError = new Error(
        `DEV.to profile response for ${DEVTO_USERNAME} did not include a valid followers_count. Available keys: ${availableKeys}. Raw payload: ${JSON.stringify(payload)}`
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Unable to determine DEV.to follower count for ${DEVTO_USERNAME}.`);
};

const updateReadme = async () => {
  const count = await getFollowersCount();
  let readmeContent = fs.readFileSync(README_FILE, "utf8");
  const newContent = `${START_MARKER}**${count}** DEV.to followers${END_MARKER}`;

  const regex = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, "g");
  readmeContent = readmeContent.replace(regex, newContent);

  fs.writeFileSync(README_FILE, readmeContent);
  console.log("README updated with new follower count:", count);
};

updateReadme().catch((error) => {
  console.error(error);
  process.exit(1);
});
