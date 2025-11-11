/**
 * COMPANY RESEARCH SERVICE
 *
 * WHAT: Fetches and aggregates company information for cover letter personalization
 * WHY: Users need company context to write compelling, personalized cover letters
 *
 * Features:
 * - Company profile (name, industry, size, location, mission)
 * - Recent news and announcements (funding, product launches, expansion)
 * - Company culture indicators (startup vs corporate, remote-friendly, values)
 * - Key executives and leadership team
 * - Products/services overview
 *
 * Data Sources (in order of priority):
 * 1. User-provided job description (scraped from job posting)
 * 2. Mock data service (for MVP - replaces external API calls)
 * 3. TODO: Future integrations (Clearbit, LinkedIn, Crunchbase, news APIs)
 *
 * Inputs:
 * - companyName: string (required)
 * - industry?: string (optional, from job posting)
 * - jobDescription?: string (optional, may contain company info)
 *
 * Outputs:
 * - CompanyResearch object with profile, news, culture, leadership
 * - Stored in cover_letter_drafts.company_research jsonb field
 */

import { logInfo, logWarn, logError } from "../../utils/logger.js";

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
  source: "mock" | "api" | "user-provided"; // Data source
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
 * Fetch company research data
 *
 * Flow:
 * 1. Validate inputs
 * 2. Check cache (TODO: implement Redis/memory cache)
 * 3. Generate mock data (or call external API in production)
 * 4. Return CompanyResearch object
 *
 * Error Handling:
 * - Invalid company name → return null
 * - API failure → fallback to basic mock data
 * - Network timeout → return cached data if available
 */
export async function fetchCompanyResearch(
  companyName: string,
  industry?: string | null,
  jobDescription?: string | null
): Promise<CompanyResearch | null> {
  try {
    // Validate inputs
    if (!companyName || companyName.trim().length === 0) {
      logWarn("Invalid company name", { companyName });
      return null;
    }

    logInfo("Fetching company research", {
      companyName,
      industry: industry || "unknown",
    });

    // TODO: Check cache first
    // const cached = await getFromCache(`company:${companyName}`);
    // if (cached) return cached;

    // TODO: In production, call external APIs here
    // const research = await callClearbitAPI(companyName) || await callLinkedInAPI(companyName);

    // For MVP, use mock data
    const research = generateMockCompanyResearch(
      companyName,
      industry,
      jobDescription
    );

    // TODO: Cache the result
    // await saveToCache(`company:${companyName}`, research, 86400); // 24 hour TTL

    logInfo("Company research fetched successfully", {
      companyName,
      newsCount: research.news.length,
      source: research.source,
    });

    return research;
  } catch (err) {
    logError("Failed to fetch company research", err, { companyName });

    // Fallback to minimal mock data
    return {
      companyName,
      industry: industry || null,
      size: null,
      location: null,
      founded: null,
      website: null,
      mission: null,
      description: `${companyName} is a company in the ${
        industry || "industry"
      }.`,
      news: [],
      culture: {
        type: "corporate",
        remotePolicy: null,
        values: [],
        perks: [],
      },
      leadership: [],
      products: [],
      lastUpdated: new Date().toISOString(),
      source: "mock",
    };
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
