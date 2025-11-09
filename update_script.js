
const fs = require("fs");
const https = require("https");

const API_KEY = process.env.DEVTO_API_KEY;
const README_FILE = "README.md";
const START_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:START -->";
const END_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:END -->";

const getFollowersCount = () => {
  const options = {
    hostname: "dev.to",
    port: 443,
    path: "/api/followers/all",
    method: "GET",
    headers: {
      "api-key": API_KEY,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const followers = JSON.parse(data);
          // The API returns a list of followers, so we count the array length
          resolve(followers.length); 
        } catch (e) {
          reject(new Error("Failed to parse API response"));
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

