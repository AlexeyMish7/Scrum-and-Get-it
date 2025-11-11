/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useAuth } from "@shared/context/AuthContext";
import aiGeneration from "@workspaces/ai/services/aiGeneration";
import aiArtifacts from "@shared/services/aiArtifacts";
import { fetchCompanyNews } from "@shared/services/fetchCompanyNews";

/**
 * Company Research Hook - UC-063, UC-064
 * 
 * Features:
 * - AI-powered company research with news aggregation
 * - Gather company background, mission, products
 * - Find recent news and updates
 * - Generate competitive landscape insights
 * - Save research artifacts for future reference
 */

export interface CompanyNewsItem {
  title: string;
  category: string;
  date: string;
  source: string;
  relevance: number;
  summary: string;
  link?: string;
}

export interface CompanyResearchData {
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  mission?: string;
  description?: string;
  products?: string[];
  recentNews?: CompanyNewsItem[];
  competitiveLandscape?: string;
  rating?: number | { glassdoor?: number; source?: string; reviewCount?: number };
}

export function useCompanyResearch() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchData, setResearchData] = useState<CompanyResearchData | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const runResearch = async (companyName: string, jobId?: number) => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }
    
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResearchData(null);
    setRawResponse(null);

    try {
      // Call AI endpoint for company research
      const response = await aiGeneration.generateCompanyResearch(userId, companyName, jobId);

      console.log("🏢 Company Research - Raw Response:", response);

      // Parse the response
      let parsedData: CompanyResearchData = { name: companyName };
      
      const content = (response as any).content || response;
      
      if (content) {
        
        // Extract company info from various possible formats
        parsedData = {
          name: content.name || content.company_name || content.companyName || companyName,
          industry: content.industry,
          size: content.size || content.employee_count,
          location: content.location || content.headquarters,
          website: content.website || content.url,
          mission: content.mission || content.mission_statement,
          description: content.description || content.summary || content.overview,
          products: content.products || content.top_products || content.services || [],
          recentNews: [],
          competitiveLandscape: content.competitive_landscape || content.competitors,
          rating: content.rating,
        };

        // Parse news items
        if (Array.isArray(content.news) || Array.isArray(content.recent_news)) {
          const newsArray = content.news || content.recent_news || [];
          parsedData.recentNews = newsArray.map((item: any) => ({
            title: item.title || item.headline || "Untitled",
            category: item.category || item.type || "General",
            date: item.date || item.published_at || new Date().toISOString().split('T')[0],
            source: item.source || item.publisher || "Unknown",
            relevance: item.relevance || item.score || 0.5,
            summary: item.summary || item.description || "",
            link: item.link || item.url,
          }));
        }

        try {
          const liveNews = await fetchCompanyNews(companyName);
          if (liveNews.length > 0) {
            parsedData.recentNews = [...(parsedData.recentNews || []), ...liveNews];
          }
        } catch (newsErr) {
          console.warn("Could not fetch live news:", newsErr);
        }

        // Handle text-based response
        if (typeof content.text === "string" && !parsedData.description) {
          parsedData.description = content.text;
        }
      }

      console.log("📊 Parsed Company Data:", parsedData);

      setResearchData(parsedData);
      setRawResponse(response);
    } catch (e: any) {
      console.error("Company research failed", e);
      setError(e?.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const saveArtifact = async (opts: { title?: string; jobId?: number }) => {
    if (!userId || !researchData) {
      return { error: { message: "Not authenticated or no research data" } };
    }

    try {
      const res = await aiArtifacts.insertAiArtifact(userId, {
        kind: "company_research",
        title: opts.title ?? `Research: ${researchData.name}`,
        job_id: opts.jobId,
        prompt: undefined,
        model: undefined,
        content: {
          name: researchData.name,
          industry: researchData.industry,
          size: researchData.size,
          mission: researchData.mission,
          top_products: researchData.products,
          recent_news: researchData.recentNews,
          trust_level: "needs_review" as const,
        },
        metadata: { raw: rawResponse },
      });
      return res;
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  };

  return {
    isLoading,
    error,
    researchData,
    rawResponse,
    runResearch,
    saveArtifact,
  };
}

export default useCompanyResearch;
