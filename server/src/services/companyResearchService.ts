/**
 * COMPANY RESEARCH SERVICE
 *
 * WHAT: Fetches and aggregates company information for cover letter personalization
 * WHY: Users need company context to write compelling, personalized cover letters
 *
 * Features:
 * - Company profile (name, industry, size, location, mission) → stored in companies table
 * - Recent news and announcements (funding, product launches, expansion) → cached for 7 days
 * - Company culture indicators (startup vs corporate, remote-friendly, values) → companies table
 * - Key executives and leadership team → companies table
 * - Products/services overview → companies table
 * - DUAL STORAGE: Persistent data in companies table, volatile data (news) in cache
 *
 * Data Storage Strategy:
 * 1. companies table: Static company info (name, industry, size, location, mission, culture, products)
 * 2. company_research_cache table: Volatile data (news, recent events, funding, leadership changes)
 * 3. Cache TTL: 7 days for volatile data (news becomes stale)
 * 4. Shared across all users to reduce API costs
 *
 * Data Sources (in order of priority):
 * 1. Database (companies table + company_research_cache)
 * 2. AI-generated research (via companyResearch prompt) - saved to both tables
 * 3. Fallback mock data if AI fails
 *
 * Inputs:
 * - companyName: string (required)
 * - industry?: string (optional, from job posting)
 * - jobDescription?: string (optional, may contain company info)
 * - userId?: string (optional, for logging only - data is shared)
 *
 * Outputs:
 * - CompanyResearch object with persistent + volatile data combined
 */

import { logInfo, logWarn, logError } from "../../utils/logger.js";
import { scrapeWithBrowser } from "./scraper.js";
import { generate } from "./aiClient.js";

// Helper to get supabase client with proper error handling
async function getSupabaseAdmin() {
  const { default: supabase } = await import("./supabaseAdmin.js");
  if (!supabase) {
    throw new Error(
      "Database not configured - server environment variables missing"
    );
  }
  return supabase;
}

// ========== INTERFACES ==========

export interface CompanyResearch {
  companyName: string;
  industry: string | null;
  size: string | null; // "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
  location: string | null; // Headquarters location
  founded: number | null; // Year founded
  website: string | null;

  mission: string | null; // Company mission statement
  description: string | null; // Brief company description

  news: CompanyNews[];
  culture: CompanyCulture;
  leadership: CompanyLeader[];
  products: string[]; // List of main products/services

  lastUpdated: string; // ISO timestamp
  source: "mock" | "api" | "user-provided" | "cached" | "database"; // Data source
}

export interface CompanyNews {
  title: string;
  summary: string;
  date: string; // ISO date
  category:
    | "funding"
    | "product"
    | "expansion"
    | "hiring"
    | "award"
    | "general";
  url?: string;
}

export interface CompanyCulture {
  type: "corporate" | "startup" | "creative" | "hybrid";
  remotePolicy: "on-site" | "hybrid" | "remote-first" | "fully-remote" | null;
  values: string[]; // ["innovation", "collaboration", "diversity", etc.]
  perks: string[]; // ["flexible hours", "health insurance", "401k", etc.]
}

export interface CompanyLeader {
  name: string;
  title: string;
  bio?: string;
}

// ========== MOCK DATA SERVICE ==========

/**
 * Generate mock company research data
 *
 * WHAT: Creates realistic company profiles for development/testing
 * WHY: Avoid external API calls and costs during MVP phase
 *
 * Logic:
 * - Uses company name to deterministically generate profile
 * - Industry keyword matching for realistic data
 * - Randomized but consistent news, culture, leadership
 *
 * TODO: Replace with real API calls in production
 */
function generateMockCompanyResearch(
  companyName: string,
  industry?: string | null,
  jobDescription?: string | null
): CompanyResearch {
  const lowerName = companyName.toLowerCase();
  const lowerIndustry = (industry || "").toLowerCase();
  const description = jobDescription || "";

  // Detect company type from name/industry keywords
  const isStartup =
    lowerName.includes("startup") ||
    lowerName.includes("labs") ||
    description.includes("fast-paced") ||
    description.includes("early stage");

  const isTech =
    lowerIndustry.includes("tech") ||
    lowerIndustry.includes("software") ||
    lowerIndustry.includes("ai") ||
    description.includes("SaaS") ||
    description.includes("cloud");

  const isCreative =
    lowerIndustry.includes("design") ||
    lowerIndustry.includes("marketing") ||
    lowerIndustry.includes("agency") ||
    description.includes("creative");

  // Determine size based on keywords
  let size = "51-200"; // Default
  if (lowerName.includes("inc") || lowerName.includes("corporation"))
    size = "1000+";
  else if (isStartup) size = "11-50";
  else if (lowerName.includes("enterprise")) size = "501-1000";

  // Determine culture type
  let cultureType: CompanyCulture["type"] = "corporate";
  if (isStartup) cultureType = "startup";
  else if (isCreative) cultureType = "creative";
  else if (isTech && !lowerName.includes("corp")) cultureType = "hybrid";

  // Generate realistic news items
  const newsItems: CompanyNews[] = [
    {
      title: `${companyName} Announces Q4 Growth`,
      summary: `${companyName} reported strong quarterly results with ${
        isStartup ? "200%" : "15%"
      } year-over-year growth.`,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      category: "general",
    },
  ];

  if (isStartup) {
    newsItems.push({
      title: `${companyName} Secures Series A Funding`,
      summary: `The company raised $15M in Series A funding to expand operations and hire top talent.`,
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      category: "funding",
    });
  }

  if (isTech) {
    newsItems.push({
      title: `${companyName} Launches New AI-Powered Platform`,
      summary: `The company unveiled its latest product featuring advanced machine learning capabilities.`,
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      category: "product",
    });
  }

  // Generate culture details
  const culture: CompanyCulture = {
    type: cultureType,
    remotePolicy: isStartup ? "remote-first" : isTech ? "hybrid" : "on-site",
    values: isStartup
      ? ["Innovation", "Agility", "Ownership", "Growth mindset"]
      : isTech
      ? ["Excellence", "Collaboration", "Customer focus", "Innovation"]
      : ["Integrity", "Teamwork", "Quality", "Professional development"],
    perks: isStartup
      ? ["Flexible hours", "Unlimited PTO", "Equity options", "Learning budget"]
      : [
          "Health insurance",
          "401k matching",
          "Professional development",
          "Paid time off",
        ],
  };

  // Generate leadership
  const leadership: CompanyLeader[] = [
    {
      name: "Jane Smith",
      title: "CEO & Founder",
      bio: `Jane founded ${companyName} with a vision to transform the ${
        industry || "industry"
      }.`,
    },
    {
      name: "John Doe",
      title: "CTO",
      bio: `John leads the engineering team with 15+ years of experience in ${
        isTech ? "software architecture" : "technology leadership"
      }.`,
    },
  ];

  // Generate products/services
  const products = isTech
    ? ["Cloud Platform", "Analytics Dashboard", "API Services", "Mobile App"]
    : isCreative
    ? [
        "Brand Strategy",
        "Digital Marketing",
        "Content Creation",
        "Design Services",
      ]
    : ["Enterprise Solutions", "Consulting Services", "Training Programs"];

  return {
    companyName,
    industry:
      industry ||
      (isTech
        ? "Technology"
        : isCreative
        ? "Creative Services"
        : "Professional Services"),
    size,
    location: isStartup ? "San Francisco, CA" : "New York, NY",
    founded: isStartup ? 2020 : 2010,
    website: `https://www.${lowerName.replace(/\s+/g, "")}.com`,
    mission: isStartup
      ? `To revolutionize ${
          industry || "the industry"
        } through innovative technology and exceptional service.`
      : `Empowering businesses to achieve their goals through ${
          industry || "professional"
        } excellence.`,
    description: `${companyName} is a ${
      cultureType === "startup" ? "fast-growing" : "leading"
    } ${
      industry || "company"
    } focused on delivering exceptional results for clients worldwide.`,
    news: newsItems,
    culture,
    leadership,
    products,
    lastUpdated: new Date().toISOString(),
    source: "mock",
  };
}

// ========== PUBLIC API ==========

/**
 * Normalize company name for cache lookups
 *
 * Removes common suffixes and normalizes whitespace for consistent caching
 * Example: "Google Inc." → "google"
 */
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(
      /\s+(inc\.?|llc\.?|corp\.?|corporation|limited|ltd\.?|co\.?)$/i,
      ""
    );
}

/**
 * Get company research from database (combines companies table + cache)
 *
 * Queries companies table for persistent data + company_research_cache for volatile data.
 * Returns combined result if found.
 */
async function getCompanyFromDatabase(
  companyName: string
): Promise<CompanyResearch | null> {
  try {
    const supabase = await getSupabaseAdmin();
    // Use database function to get combined data
    const { data, error } = await supabase.rpc("get_company_research", {
      p_company_name: companyName,
    });

    if (error) {
      logWarn("Error querying company research", {
        error: error.message,
        companyName,
      });
      return null;
    }

    if (!data) {
      logInfo("Company not found in database", { companyName });
      return null;
    }

    // Transform database format to CompanyResearch interface
    const research: CompanyResearch = {
      companyName: data.companyName || companyName,
      industry: data.industry || null,
      size: data.size || null,
      location: data.location || null,
      founded: data.founded || null,
      website: data.website || null,
      mission: data.companyData?.mission || null,
      description: data.description || null,
      news: data.news || [],
      culture: data.companyData?.culture || {
        type: "corporate",
        remotePolicy: null,
        values: [],
        perks: [],
      },
      leadership: data.companyData?.leadership || [],
      products: data.companyData?.products || [],
      lastUpdated: data.cacheHit
        ? new Date().toISOString()
        : new Date().toISOString(),
      source: data.cacheHit ? "cached" : "database",
    };

    logInfo("Company research retrieved from database", {
      companyName,
      cacheHit: data.cacheHit || false,
    });

    return research;
  } catch (err) {
    logError("Failed to get company from database", err, { companyName });
    return null;
  }
}

/**
 * Save company research to database
 *
 * Saves persistent data to companies table and volatile data (news) to cache.
 * Uses database functions for proper normalization and upsert logic.
 */
async function saveCompanyToDatabase(research: CompanyResearch): Promise<void> {
  try {
    const supabase = await getSupabaseAdmin();

    // Normalize company size to match database constraint
    // AI sometimes returns "1000+" but database expects "10000+"
    let normalizedSize = research.size;
    if (normalizedSize === "1000+" || normalizedSize === "1,000+") {
      normalizedSize = "10000+";
    }

    // Step 1: Upsert company base info into companies table
    const { data: companyId, error: companyError } = await supabase.rpc(
      "upsert_company_info",
      {
        p_company_name: research.companyName,
        p_industry: research.industry,
        p_size: normalizedSize, // Use normalized size
        p_location: research.location,
        p_founded_year: research.founded,
        p_website: research.website,
        p_description: research.description,
        p_company_data: {
          mission: research.mission, // Mission goes in JSONB now
          culture: research.culture,
          leadership: research.leadership,
          products: research.products,
        },
        p_source: "ai",
      }
    );

    if (companyError) {
      logError("Failed to save company base info", companyError, {
        companyName: research.companyName,
      });
      return;
    }

    logInfo("Saved company base info to database", {
      companyName: research.companyName,
      companyId,
    });

    // Step 2: Save volatile research data (news, events) to cache
    const { error: cacheError } = await supabase.rpc("save_company_research", {
      p_company_id: companyId,
      p_research_data: {
        news: research.news,
        recentEvents: [],
        fundingRounds: [],
        leadershipChanges: [],
        quarterlyHighlights: [],
      },
      p_metadata: {
        model: "gpt-4",
        source: research.source,
        cached_at: new Date().toISOString(),
      },
    });

    if (cacheError) {
      logError("Failed to save research cache (non-blocking)", cacheError, {
        companyName: research.companyName,
        companyId,
      });
      // Don't throw - base company info already saved
    } else {
      logInfo("Saved volatile research data to cache", {
        companyName: research.companyName,
        companyId,
      });
    }
  } catch (err) {
    logError("Exception saving company to database", err, {
      companyName: research.companyName,
    });
  }
}

/**
 * Generate company research using AI and web scraping
 *
 * Flow:
 * 1. Search Google for recent news about the company
 * 2. Scrape company website for official information
 * 3. Use AI to analyze and structure the data
 * 4. Return comprehensive CompanyResearch object or null if not found
 *
 * Data sources:
 * - Company website (official info, mission, products)
 * - Google News search (recent announcements, funding, hiring)
 * - AI analysis (structure, validate, fill gaps)
 */
async function generateCompanyResearchWithAI(
  companyName: string,
  industry?: string | null,
  jobDescription?: string | null
): Promise<CompanyResearch | null> {
  logInfo("Generating AI-powered company research", { companyName });

  try {
    // Step 1: Search for company website and news
    const searchQuery = `${companyName} ${
      industry || ""
    } company official website news`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      searchQuery
    )}&num=10`;

    let webContent = "";
    try {
      const searchResult = await scrapeWithBrowser(searchUrl, {
        waitForSelector: "#search",
        timeout: 10000,
      });
      webContent = searchResult.content.slice(0, 15000); // Limit to avoid token overflow
      logInfo("Web scraping successful", {
        companyName,
        contentLength: webContent.length,
      });
    } catch (scrapeErr) {
      logWarn("Web scraping failed, using AI only", {
        companyName,
        error:
          scrapeErr instanceof Error ? scrapeErr.message : String(scrapeErr),
      });
    }

    // Step 2: Build AI prompt to analyze and structure the data
    const prompt = `You are a professional business analyst researching companies for job seekers.

COMPANY: ${companyName}
${industry ? `INDUSTRY: ${industry}` : ""}
${jobDescription ? `JOB CONTEXT: ${jobDescription.slice(0, 500)}` : ""}

${webContent ? `RESEARCH DATA FROM WEB:\n${webContent}\n\n` : ""}

Generate a comprehensive company research report with ACCURATE and RECENT information.

IMPORTANT: If you cannot find credible information about this company, or if it appears the company does not exist or is too obscure to research, respond with ONLY the word "NOT_FOUND" instead of making up data.

If you DO find the company, return a JSON object with this EXACT structure:
{
  "companyName": "${companyName}",
  "industry": "exact industry name or null",
  "size": "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+" or null,
  "location": "City, State/Country" or null,
  "founded": year as number or null,
  "website": "https://..." or null,
  "mission": "company mission statement" or null,
  "description": "brief company description" or null,
  "news": [
    {
      "title": "News headline",
      "summary": "Brief summary of the news",
      "date": "YYYY-MM-DD",
      "category": "funding" | "product" | "expansion" | "hiring" | "award" | "general",
      "url": "https://..." or undefined
    }
  ],
  "culture": {
    "type": "corporate" | "startup" | "creative" | "hybrid",
    "remotePolicy": "on-site" | "hybrid" | "remote-first" | "fully-remote" | null,
    "values": ["value1", "value2"],
    "perks": ["perk1", "perk2"]
  },
  "leadership": [
    {
      "name": "Full Name",
      "title": "Position",
      "bio": "Brief bio" or undefined
    }
  ],
  "products": ["product1", "product2"]
}

CRITICAL REQUIREMENTS:
1. News must be RECENT (last 6 months) and REAL. Include dates.
2. If you can't find recent news, return empty array - don't make it up.
3. Company info must be ACCURATE - verify from official sources when possible.
4. Leadership should be current executives (CEO, CTO, etc.) - use real names if available.
5. Products should be actual offerings, not generic examples.
6. Return ONLY the JSON object, no additional text or markdown formatting.`;

    // Step 3: Call AI to generate structured research
    const aiResponse = await generate("company-research", prompt, {
      model: process.env.AI_MODEL || "gpt-4o-mini",
      maxTokens: 2000,
      temperature: 0.3, // Lower temperature for more factual responses
    });

    // Step 4: Parse AI response
    let research: CompanyResearch;
    try {
      const responseText = (aiResponse.text || "").trim();

      // Check if AI indicated company not found
      if (responseText === "NOT_FOUND" || responseText.includes("NOT_FOUND")) {
        logWarn("AI could not find credible information about company", {
          companyName,
        });
        return null;
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch =
        responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
        responseText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      const parsed = JSON.parse(jsonStr);

      research = {
        ...parsed,
        lastUpdated: new Date().toISOString(),
        source: "api" as const,
      };

      logInfo("AI research generated successfully", {
        companyName,
        newsCount: research.news.length,
        hasWebsite: !!research.website,
      });
    } catch (parseErr) {
      logError("Failed to parse AI response, company not found", parseErr, {
        companyName,
        response: (aiResponse.text || "").slice(0, 200),
      });
      return null;
    }

    return research;
  } catch (err) {
    logError("AI research generation failed, company not found", err, {
      companyName,
    });
    // Return null to indicate company not found - don't generate mock data
    return null;
  }
}

/**
 * Fetch company research data with dual storage
 *
 * Flow:
 * 1. Validate inputs
 * 2. Check database (companies table + company_research_cache)
 * 3. If found: return combined data
 * 4. If not found or cache expired: generate via AI + web scraping
 * 5. Save persistent data to companies table
 * 6. Save volatile data (news) to company_research_cache
 * 7. Return CompanyResearch object
 *
 * Storage Strategy:
 * - companies table: name, industry, size, location, mission, culture, leadership, products (persistent)
 * - company_research_cache: news, recent events, funding, quarterly reports (7-day TTL)
 *
 * Error Handling:
 * - Invalid company name → return null
 * - Database query failure → proceed to generation
 * - AI generation failure → fallback to basic mock data
 * - Save failure → log error but return data (non-blocking)
 */
export async function fetchCompanyResearch(
  companyName: string,
  industry?: string | null,
  jobDescription?: string | null,
  userId?: string
): Promise<CompanyResearch | null> {
  try {
    // Validate inputs
    if (!companyName || companyName.trim().length === 0) {
      logWarn("Invalid company name", { companyName, userId });
      return null;
    }

    const normalized = normalizeCompanyName(companyName);

    logInfo("Fetching company research", {
      companyName,
      normalized,
      industry: industry || "unknown",
      userId,
    });

    // Step 1: Check database (companies + cache)
    const existing = await getCompanyFromDatabase(companyName);
    if (existing && existing.source === "cached") {
      // Have both persistent data + fresh cache
      logInfo("Returning complete company research from database + cache", {
        companyName,
        userId,
      });
      return existing;
    } else if (existing) {
      // Have persistent data but cache expired - need to refresh volatile data
      logInfo("Company found but cache expired - regenerating volatile data", {
        companyName,
        userId,
      });
      // Continue to generation to refresh news/events
    }

    // Step 2: Cache miss or expired - generate new research
    logInfo("Generating company research", {
      companyName,
      normalized,
      userId,
    });

    // Use AI + web scraping for accurate, recent data
    const research = await generateCompanyResearchWithAI(
      companyName,
      industry,
      jobDescription
    );

    // If AI couldn't find the company, return null
    if (!research) {
      logWarn("Company not found or could not be researched", {
        companyName,
        userId,
      });
      return null;
    }

    // Step 3: Save to database (companies table + cache)
    saveCompanyToDatabase(research).catch((err) => {
      logError("Failed to save to database (non-blocking)", err, {
        companyName,
        userId,
      });
    });

    logInfo("Company research generated successfully", {
      companyName,
      newsCount: research.news.length,
      source: research.source,
      userId,
    });

    return research;
  } catch (err) {
    logError("Failed to fetch company research", err, { companyName, userId });
    // Return null to indicate company not found/error - let frontend handle it
    return null;
  }
}

/**
 * Extract company name from job title or description
 *
 * WHAT: Parse job posting text to find company name
 * WHY: User may not have company name as separate field
 *
 * Logic:
 * - Look for "at [Company]" pattern in job title
 * - Extract from "About [Company]" section
 * - Find company name in first paragraph
 *
 * Fallback: Return null if no clear company name found
 */
export function extractCompanyName(
  jobTitle?: string,
  jobDescription?: string
): string | null {
  if (!jobTitle && !jobDescription) return null;

  // Try to extract from job title (e.g., "Software Engineer at Google")
  if (jobTitle) {
    const atMatch = jobTitle.match(/\s+at\s+(.+?)(?:\s*[-|]|$)/i);
    if (atMatch && atMatch[1]) {
      return atMatch[1].trim();
    }
  }

  // Try to extract from description
  if (jobDescription) {
    // Look for "About [Company]" section
    const aboutMatch = jobDescription.match(
      /about\s+([A-Z][a-zA-Z0-9\s&,.-]+?)(?:\n|:|\.|,)/i
    );
    if (aboutMatch && aboutMatch[1]) {
      return aboutMatch[1].trim();
    }

    // Look for "[Company] is" pattern
    const isMatch = jobDescription.match(
      /^([A-Z][a-zA-Z0-9\s&,.-]+?)\s+is\s+/m
    );
    if (isMatch && isMatch[1]) {
      return isMatch[1].trim();
    }
  }

  return null;
}
