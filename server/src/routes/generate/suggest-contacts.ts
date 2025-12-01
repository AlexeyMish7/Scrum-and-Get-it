import { IncomingMessage, ServerResponse } from "http";
import { generate } from "../../services/aiClient.js";
import * as cheerio from "cheerio"; // scraping helpers
// fetch is available in modern Node runtimes; if not, install node-fetch

async function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// Scrape team members from a company page
async function scrapeTeamPage(url: string) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 ContactDiscoveryBot" },
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const people: any[] = [];

    // Adjust selectors per site structure later
    $(".team-member, .person, .bio-card").each((_, el) => {
      const name = $(el).find("h3, .name").first().text().trim();
      const title = $(el).find("p, .title").first().text().trim();
      const linkedin = $(el)
        .find('a[href*="linkedin"]')
        ?.attr("href")
        ?.trim();

      if (name) {
        people.push({
          name,
          title,
          linkedin: linkedin || "",
          source: url,
          reason: "Public team page contact",
        });
      }
    });

    return people;
  } catch (_) {
    return [];
  }
}

export async function handleSuggestContacts(
  req: IncomingMessage,
  res: ServerResponse,
  _url?: URL,
  _reqId?: string,
  _userId?: string
) {
  try {
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};

    const jobTitle = payload.jobTitle ?? "";
    const companyName = payload.companyName ?? "";
    const alumniSchool = payload.alumniSchool ?? ""; // NEW ✨
    const teamPageUrl = payload.teamPageUrl ?? ""; // NEW ✨

    let realPeople: any[] = [];

    // Scrape team page if provided
    if (teamPageUrl) {
      const scraped = await scrapeTeamPage(teamPageUrl);
      if (scraped.length) realPeople.push(...scraped);
    }

    // Ask AI for alumni networking strategies
    const aiPrompt = `
The user is applying for a job:

Role: ${jobTitle}
Company: ${companyName}
School: ${alumniSchool}

You MUST return valid JSON only:
{
 "suggestions": [...]
}

Rules:
• DO NOT invent names
• If alumni not publicly listed, provide Google search queries like:
  "${alumniSchool} alumni ${companyName} ${jobTitle} LinkedIn"
`;

    const aiResp = await generate(
      "suggest_contacts_v2",
      aiPrompt,
      { temperature: 0.2 }
    );

    let aiJson = {};
    try {
      aiJson = JSON.parse(
        aiResp.text.replace(/```json/g, "").replace(/```/g, "").trim()
      );
    } catch (_) {}

    const combined = {
      real_people: realPeople.slice(0, 8), // from scraper
      ...aiJson, // networking strategies
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(combined));
  } catch (err: any) {
    console.error("SuggestContacts error", err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

export const post = handleSuggestContacts;
export default handleSuggestContacts;
