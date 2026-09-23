
const fs = require("fs");
const https = require("https");

const DEVTO_USERNAME = process.env.DEVTO_USERNAME || "annavi11arrea1";
const README_FILE = "README.md";
const START_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:START -->";
const END_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:END -->";

const getFollowersCount = () => {
  const options = {
    hostname: "dev.to",
    port: 443,
    path: `/api/users/by_username?url=${encodeURIComponent(DEVTO_USERNAME)}`,
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API Error: Status Code ${res.statusCode}. Response: ${data}`));
          return;
        }
        try {
          const user = JSON.parse(data);
          const followersCount = Number(user.followers_count);
          if (!Number.isFinite(followersCount)) {
            reject(new Error(`Invalid followers_count in API response: ${data}`));
            return;
          }
          resolve(followersCount);
        } catch (e) {
          reject(new Error(`Failed to parse API response. Response data: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
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

updateReadme().catch(console.error);
