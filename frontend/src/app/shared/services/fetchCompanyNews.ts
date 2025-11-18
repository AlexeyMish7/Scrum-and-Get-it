/**
 * COMPANY NEWS SERVICE
 *
 * Purpose:
 * - Fetch recent company news from external API (NewsData.io)
 * - Support for AI company research feature
 * - Cached on backend to reduce API costs
 *
 * Connection:
 * - Called from useCompanyResearch hook (AI workspace)
 * - Used in company research AI generation flow
 *
 * API: NewsData.io or Google News RSS
 * - Free tier: 200 requests/day
 */

// /* eslint-disable @typescript-eslint/no-explicit-any */

// /**
//  * Fetch live company news using Google News RSS (no API key required)
//  * Converts RSS feed → JSON via rss2json.com (free public converter)
//  */
// export async function fetchCompanyNews(companyName: string) {
//   const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=en-US&gl=US&ceid=US:en`;
//   const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

//   try {
//     const response = await fetch(endpoint);
//     if (!response.ok) throw new Error("Failed to fetch company news");

//     const data = await response.json();
//     if (!data.items) return [];

//     // Convert feed items → consistent CompanyNewsItem format
//     return data.items.slice(0, 8).map((item: any) => ({
//       title: item.title,
//       category: "general",
//       date: new Date(item.pubDate).toISOString().split("T")[0],
//       source: item.author || new URL(item.link).hostname.replace("www.", ""),
//       relevance: 0.9, // static for now, can compute via keyword match later
//       summary: item.description?.replace(/<[^>]+>/g, "") || "",
//       link: item.link,
//     }));
//   } catch (err) {
//     console.error("Error fetching company news:", err);
//     return [];
//   }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Fetch live company news using Google News RSS (no API key required)
 * Converts RSS feed → JSON via rss2json.com (free)
 */
export async function fetchCompanyNews(companyName: string) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    companyName
  )}&hl=en-US&gl=US&ceid=US:en`;
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
    rssUrl
  )}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch company news");

    const data = await response.json();
    if (!data.items) return [];

    const lowerCompany = companyName.toLowerCase();

    // Helper: detect rough category from keywords
    const detectCategory = (title: string, summary: string) => {
      const text = `${title} ${summary}`.toLowerCase();
      if (
        text.includes("earnings") ||
        text.includes("revenue") ||
        text.includes("profit")
      )
        return "Finance";
      if (
        text.includes("product") ||
        text.includes("launch") ||
        text.includes("release")
      )
        return "Product";
      if (text.includes("acquisition") || text.includes("merger"))
        return "Business";
      if (
        text.includes("ai") ||
        text.includes("software") ||
        text.includes("technology")
      )
        return "Technology";
      if (text.includes("lawsuit") || text.includes("regulation"))
        return "Legal";
      return "General";
    };

    // Helper: compute a basic relevance score
    const computeRelevance = (title: string, summary: string) => {
      const text = `${title} ${summary}`.toLowerCase();
      const matchCount = (text.match(new RegExp(lowerCompany, "g")) || [])
        .length;
      // Title match is more important
      const titleWeight = title.toLowerCase().includes(lowerCompany) ? 0.6 : 0;
      const summaryWeight = Math.min(matchCount * 0.1, 0.4);
      return Math.min(1, titleWeight + summaryWeight);
    };

    const uniqueLinks = new Set<string>();

    return data.items
      .filter((item: any) => {
        if (uniqueLinks.has(item.link)) return false;
        uniqueLinks.add(item.link);
        // Must mention company at least once to count
        return (
          item.title.toLowerCase().includes(lowerCompany) ||
          item.description.toLowerCase().includes(lowerCompany)
        );
      })
      .slice(0, 10)
      .map((item: any) => {
        const summary = item.description?.replace(/<[^>]+>/g, "") || "";
        return {
          title: item.title,
          category: detectCategory(item.title, summary),
          date: new Date(item.pubDate).toISOString().split("T")[0],
          source:
            item.author || new URL(item.link).hostname.replace("www.", ""),
          relevance: computeRelevance(item.title, summary),
          summary,
          link: item.link,
        };
      });
  } catch (err) {
    console.error("Error fetching company news:", err);
    return [];
  }
}
