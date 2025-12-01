/**
 * COMPANY RESEARCH PROMPT BUILDER
 *
 * WHAT: Constructs AI prompts for comprehensive company research
 * WHY: Users need accurate, up-to-date company information for tailored applications
 *
 * Prompt Strategy:
 * - Request factual, verifiable company information
 * - Include recent news, products, culture indicators
 * - Structure output as JSON for easy parsing
 * - Emphasize accuracy over speculation
 *
 * Inputs:
 * - companyName: string (required)
 * - industry?: string (optional, from job posting)
 * - jobDescription?: string (optional, may contain company context)
 *
 * Output: Structured JSON with company profile, news, culture, products
 */

export interface CompanyResearchPromptData {
  companyName: string;
  industry?: string | null;
  jobDescription?: string | null;
}

/**
 * Build AI prompt for company research
 *
 * Flow:
 * 1. Set role as research analyst
 * 2. Define task: comprehensive company intelligence gathering
 * 3. Specify output format (structured JSON)
 * 4. Include verification instructions (factual accuracy)
 *
 * Error handling: Returns valid prompt even with minimal inputs
 */
export function buildCompanyResearchPrompt(
  data: CompanyResearchPromptData
): string {
  const { companyName, industry, jobDescription } = data;

  // Extract additional context from job description if available
  const contextClues = jobDescription
    ? `\n\nAdditional context from job posting:\n${jobDescription.slice(
        0,
        500
      )}`
    : "";

  const industryContext = industry
    ? `\nKnown industry: ${industry}`
    : "\nIndustry: Please determine from research";

  return `You are a professional company research analyst helping a job seeker prepare for applications and interviews.

TASK: Research and compile comprehensive information about ${companyName}.${industryContext}${contextClues}

Provide accurate, factual information in the following JSON structure:

{
  "companyName": "${companyName}",
  "industry": "primary industry",
  "size": "EXACTLY one of: 1-10 | 11-50 | 51-200 | 201-500 | 501-1000 | 1001-5000 | 5001-10000 | 10000+",
  "location": "headquarters city, state/country",
  "founded": year_founded_as_number,
  "website": "official website URL",
  "mission": "company mission statement (1-2 sentences)",
  "description": "brief company overview (2-3 sentences)",
  "news": [
    {
      "title": "news headline",
      "summary": "1-2 sentence summary",
      "date": "YYYY-MM-DD or recent timeframe",
      "category": "funding|product|expansion|hiring|award|general",
      "url": "source URL if available"
    }
  ],
  "culture": {
    "type": "corporate|startup|creative|hybrid",
    "remotePolicy": "on-site|hybrid|remote-first|fully-remote",
    "values": ["value1", "value2", "value3"],
    "perks": ["perk1", "perk2", "perk3"]
  },
  "leadership": [
    {
      "name": "full name",
      "title": "role/position",
      "bio": "brief background (1 sentence)"
    }
  ],
  "products": ["main product/service 1", "product 2", "product 3"],
  "rating": {
    "glassdoor": 3.8,
    "source": "Glassdoor 2024 (if available)",
    "reviewCount": 1200
  }
}

RESEARCH PRIORITIES:
1. Verify company exists and gather basic facts (name, industry, size, location, founding year)
   - For size, use EXACTLY one of: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10000+
   - DO NOT use "1000+" - use either "501-1000", "1001-5000", "5001-10000", or "10000+" depending on actual employee count
2. Find official mission statement and company description from their website
3. Search for recent news (last 6 months) - prioritize funding, product launches, expansions
4. Identify company culture type and remote work policy
5. List 3-5 core company values (from "About Us" or careers page)
6. Find CEO/founder and 1-2 key executives with brief backgrounds
7. List 3-5 main products or services
8. Look for Glassdoor or similar employee ratings (if publicly available)
9. Identify likely interviewers and interviewer roles for the typical hiring process (e.g., "Engineering Manager", "Senior Product Manager", "Recruiter"). When specific names are publicly available (team pages, LinkedIn, or job posting), include them.
10. Provide a concise competitive landscape: list 3-5 direct competitors and include a 1-2 sentence market positioning summary (how the company compares to competitors).
11. Generate 4-8 tailored talking points a candidate can use in interviews (achievement-focused, tied to company priorities).
12. Generate 4-8 intelligent interview questions the candidate can ask (specific to the company, product, or strategy).

ACCURACY GUIDELINES:
- Use only factual, verifiable information
- If specific data is unavailable, use "unknown" or null rather than guessing
- For news items, prefer recent (last 3-6 months) and significant announcements
- Include source attribution where possible
- Date format: YYYY-MM-DD for specific dates, or "Q1 2024" / "November 2024" for approximate

RESPONSE FORMAT:
- Return ONLY the JSON object, no additional commentary
- Ensure all JSON is valid and parseable
- Use null for unavailable data rather than omitting fields
- Keep descriptions concise and professional

Research ${companyName} now and provide the structured JSON response.`;
}

// Note: Preferred additional fields (optional) that improve interview prep
// If available, include these keys in the top-level JSON: 
// "potentialInterviewers": [ { "role": "Hiring Manager | Team Lead | Recruiter", "name": "Full Name or null" } ],
// "competitors": [ { "name": "Competitor Name", "note": "1-2 sentence competitive note" } ],
// "marketPositioning": "Short 1-2 sentence summary of company's position in market vs competitors",
// "talkingPoints": [ "short talking point 1", "talking point 2" ],
// "interviewQuestions": [ "intelligent question 1", "question 2" ]

/**
 * Validate company research AI response
 *
 * WHAT: Checks if AI response contains required company fields
 * WHY: Ensure downstream parsing won't fail on malformed data
 *
 * Returns: true if response is valid, false otherwise
 */
export function validateCompanyResearchResponse(response: any): boolean {
  if (!response || typeof response !== "object") return false;

  // Just need company name - everything else is optional
  const hasName =
    typeof response.companyName === "string" ||
    typeof response.company_name === "string" ||
    typeof response.name === "string";

  return hasName;
}
