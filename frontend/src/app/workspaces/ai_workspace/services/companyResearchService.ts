/**
 * COMPANY RESEARCH SERVICE
 *
 * Fetches AI-generated company research from backend API.
 * Backend handles caching (7-day TTL, shared across all users).
 *
 * Features:
 * - Company profile (size, industry, location, mission)
 * - Recent news and announcements
 * - Company culture and values
 * - Leadership team
 * - Products and services
 *
 * Cache Strategy:
 * - Backend manages cache in company_research_cache table
 * - Shared across all users to reduce API costs
 * - Auto-regenerates after 7 days
 */

import aiClient from "@shared/services/ai/client";

interface CompanyNews {
  title: string;
  summary: string;
  date: string;
  category: string;
  url?: string;
}

interface CompanyCulture {
  type: string;
  remotePolicy: string | null;
  values: string[];
  perks: string[];
}

interface CompanyLeader {
  name: string;
  title: string;
  bio?: string;
}

export interface CompanyResearch {
  companyName: string;
  industry: string | null;
  size: string | null;
  location: string | null;
  founded: number | null;
  website: string | null;
  mission: string | null;
  description: string | null;
  news: CompanyNews[];
  culture: CompanyCulture;
  leadership: CompanyLeader[];
  products: string[];
  lastUpdated: string;
  source: string;
  // Interview prep fields (optional)
  potentialInterviewers?: Array<{ role: string; name?: string | null }>;
  competitors?: Array<{ name: string; note?: string }>;
  marketPositioning?: string | null;
  talkingPoints?: string[];
  interviewQuestions?: string[];
}

/**
 * Fetch company research from backend API
 *
 * GET /api/company/research?name=CompanyName&industry=Tech&jobDescription=...
 *
 * Backend will:
 * 1. Check cache (company_research_cache table)
 * 2. Return cached data if valid (< 7 days old)
 * 3. Generate new research via AI if cache miss
 * 4. Save to cache for future requests
 *
 * @param companyName - Company name (required)
 * @param industry - Industry (optional, for better AI results)
 * @param jobDescription - Job description (optional, for context)
 * @returns CompanyResearch object or null if not found
 */
export async function fetchCompanyResearch(
  companyName: string,
  industry?: string,
  jobDescription?: string
): Promise<CompanyResearch | null> {
  try {
    const params = new URLSearchParams({
      name: companyName,
    });

    if (industry) params.append("industry", industry);
    if (jobDescription) params.append("jobDescription", jobDescription);

    const response = await aiClient.getJson<{ data: CompanyResearch | null }>(
      `/api/company/research?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching company research:", error);
    throw error;
  }
}

/**
 * Get user's companies from employment history
 *
 * GET /api/company/user-companies
 *
 * Returns list of distinct company names from user's employment history
 * for quick-select in company research UI.
 *
 * @returns Array of company names
 */
export async function getUserCompanies(): Promise<string[]> {
  try {
    const response = await aiClient.getJson<{ data: string[] }>(
      "/api/company/user-companies"
    );

    return response.data || [];
  } catch (error) {
    console.error("Error fetching user companies:", error);
    return [];
  }
}

/**
 * Export company research service
 */
export const companyResearch = {
  fetchCompanyResearch,
  getUserCompanies,
};
