const fs = require("fs");
const path = require("path");

const BASE_URL = "https://slaythespire2.gg";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\[b\]/g, "")
    .replace(/\[\/b\]/g, "")
    .replace(/\[gold\]/g, "")
    .replace(/\[\/gold\]/g, "")
    .replace(/\[blue\]/g, "")
    .replace(/\[\/blue\]/g, "")
    .replace(/\[green\]/g, "")
    .replace(/\[\/green\]/g, "")
    .replace(/\[red\]/g, "")
    .replace(/\[\/red\]/g, "")
    .replace(/\[purple\]/g, "")
    .replace(/\[\/purple\]/g, "")
    .replace(/\[orange\]/g, "")
    .replace(/\[\/orange\]/g, "")
    .replace(/\[aqua\]/g, "")
    .replace(/\[\/aqua\]/g, "")
    .replace(/\[jitter\]/g, "")
    .replace(/\[\/jitter\]/g, "")
    .replace(/\[sine\]/g, "")
    .replace(/\[\/sine\]/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function scrapeEvents() {
  console.log("Fetching events...");
  const html = await fetchPage(`${BASE_URL}/events`);

  const events = {};

  // Find the events JSON array in the page
  // Pattern: "events":[{...},{...},...] in escaped format
  const eventsArrayMatch = html.match(/\\"events\\":\[(\{\\"id\\".*?)\],\\"cards\\"/);
  
  if (eventsArrayMatch) {
    try {
      // Unescape the JSON
      let jsonStr = '[' + eventsArrayMatch[1] + ']';
      jsonStr = jsonStr
        .replace(/\\\\"/g, '\\"')  // Handle double-escaped quotes
        .replace(/\\"/g, '"')       // Unescape quotes
        .replace(/\\\\/g, '\\');    // Unescape backslashes
      
      const eventsArray = JSON.parse(jsonStr);
      
      for (const event of eventsArray) {
        const options = (event.options || []).map(opt => ({
          id: opt.id,
          title: opt.title,
          description: cleanText(opt.description),
        }));

        events[event.title.toLowerCase()] = {
          slug: event.id,
          key: event.key,
          name: event.title,
          description: cleanText(event.descriptionPlain || event.description),
          options,
          image: event.image,
        };
      }
      console.log(`Parsed ${eventsArray.length} events from JSON array`);
    } catch (err) {
      console.error("Failed to parse JSON array:", err.message);
    }
  }

  // Fallback: extract basic event info using simple patterns
  if (Object.keys(events).length === 0) {
    console.log("Using fallback regex extraction...");
    
    // Find all event headers first
    const headerRegex = /\{\\"id\\":\\"([a-z0-9-]+)\\",\\"key\\":\\"([A-Z_]+)\\",\\"title\\":\\"([^"]+)\\"/g;
    const eventHeaders = [];
    let match;
    while ((match = headerRegex.exec(html)) !== null) {
      eventHeaders.push({
        id: match[1],
        key: match[2],
        title: match[3],
      });
    }

    // For each event, try to extract more details
    for (const header of eventHeaders) {
      // Try to find the description and options for this event
      const descPattern = new RegExp(
        `\\{\\\\"id\\\\":\\\\"${header.id}\\\\"[^}]*\\\\"descriptionPlain\\\\":\\\\"([^"]*)\\\\"`,
        's'
      );
      const descMatch = html.match(descPattern);
      
      events[header.title.toLowerCase()] = {
        slug: header.id,
        key: header.key,
        name: header.title,
        description: descMatch ? cleanText(descMatch[1]) : "",
        options: [],
        image: `/assets/events/${header.id.replace(/-/g, '_')}.png`,
      };
    }
  }

  console.log(`Found ${Object.keys(events).length} events`);

  const outPath = path.join(__dirname, "..", "data", "events.json");
  fs.writeFileSync(outPath, JSON.stringify(events, null, 2) + "\n");
  console.log(`Written to ${outPath}`);
}

scrapeEvents().catch(console.error);
