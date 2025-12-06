/**
 * BROWSER PERFORMANCE MEASUREMENT SCRIPT
 *
 * Run this in the browser console to measure actual performance metrics.
 * Copy-paste into DevTools Console while on the profile dashboard.
 *
 * Usage:
 * 1. Open the app in browser
 * 2. Open DevTools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 * 5. Follow the prompts
 */

(async function runPerformanceTest() {
  console.clear();
  console.log("🚀 FlowATS Performance Test Suite");
  console.log("═".repeat(50));

  const results = {
    timestamp: new Date().toISOString(),
    metrics: {},
  };

  // 1. Measure current page load metrics
  console.log("\n📊 Collecting Performance Metrics...\n");

  // Navigation Timing
  const navTiming = performance.getEntriesByType("navigation")[0];
  if (navTiming) {
    results.metrics.pageLoad = {
      dnsLookup: Math.round(
        navTiming.domainLookupEnd - navTiming.domainLookupStart
      ),
      tcpConnect: Math.round(navTiming.connectEnd - navTiming.connectStart),
      ttfb: Math.round(navTiming.responseStart - navTiming.requestStart),
      domContentLoaded: Math.round(
        navTiming.domContentLoadedEventEnd - navTiming.startTime
      ),
      fullLoad: Math.round(navTiming.loadEventEnd - navTiming.startTime),
    };
  }

  // Resource Timing (API calls)
  const resources = performance.getEntriesByType("resource");
  const apiCalls = resources.filter(
    (r) => r.name.includes("/rest/v1/") || r.name.includes("supabase")
  );

  results.metrics.apiCalls = {
    count: apiCalls.length,
    totalTime: Math.round(apiCalls.reduce((sum, r) => sum + r.duration, 0)),
    avgTime: Math.round(
      apiCalls.reduce((sum, r) => sum + r.duration, 0) / (apiCalls.length || 1)
    ),
    calls: apiCalls.map((r) => ({
      url: r.name.split("?")[0].split("/").slice(-2).join("/"),
      duration: Math.round(r.duration),
    })),
  };

  // Memory (if available)
  if (performance.memory) {
    results.metrics.memory = {
      usedJSHeapSize: Math.round(
        performance.memory.usedJSHeapSize / 1024 / 1024
      ),
      totalJSHeapSize: Math.round(
        performance.memory.totalJSHeapSize / 1024 / 1024
      ),
    };
  }

  // React Query Cache (if available)
  const queryClient = window.__REACT_QUERY_DEVTOOLS_GLOBAL_STORE__?.queryClient;
  if (queryClient) {
    const cache = queryClient.getQueryCache().getAll();
    results.metrics.reactQueryCache = {
      totalQueries: cache.length,
      freshQueries: cache.filter((q) => q.state.status === "success").length,
      staleQueries: cache.filter((q) => q.isStale()).length,
      queries: cache.map((q) => ({
        key: q.queryKey.join("/"),
        status: q.state.status,
        dataUpdatedAt: q.state.dataUpdatedAt,
      })),
    };
  }

  // Print results
  console.log("═".repeat(50));
  console.log("📈 PERFORMANCE RESULTS");
  console.log("═".repeat(50));

  if (results.metrics.pageLoad) {
    console.log("\n⏱️  Page Load Timing:");
    console.log(
      `   DNS Lookup:        ${results.metrics.pageLoad.dnsLookup}ms`
    );
    console.log(
      `   TCP Connect:       ${results.metrics.pageLoad.tcpConnect}ms`
    );
    console.log(`   Time to First Byte: ${results.metrics.pageLoad.ttfb}ms`);
    console.log(
      `   DOM Content Loaded: ${results.metrics.pageLoad.domContentLoaded}ms`
    );
    console.log(`   Full Page Load:    ${results.metrics.pageLoad.fullLoad}ms`);
  }

  console.log("\n🌐 API Calls:");
  console.log(`   Total Calls:  ${results.metrics.apiCalls.count}`);
  console.log(`   Total Time:   ${results.metrics.apiCalls.totalTime}ms`);
  console.log(`   Average Time: ${results.metrics.apiCalls.avgTime}ms`);
  if (results.metrics.apiCalls.calls.length > 0) {
    console.log("   Breakdown:");
    results.metrics.apiCalls.calls.forEach((c) => {
      console.log(`     - ${c.url}: ${c.duration}ms`);
    });
  }

  if (results.metrics.memory) {
    console.log("\n💾 Memory Usage:");
    console.log(`   Used Heap:  ${results.metrics.memory.usedJSHeapSize}MB`);
    console.log(`   Total Heap: ${results.metrics.memory.totalJSHeapSize}MB`);
  }

  if (results.metrics.reactQueryCache) {
    console.log("\n🗄️  React Query Cache:");
    console.log(
      `   Total Queries: ${results.metrics.reactQueryCache.totalQueries}`
    );
    console.log(
      `   Fresh Queries: ${results.metrics.reactQueryCache.freshQueries}`
    );
    console.log(
      `   Stale Queries: ${results.metrics.reactQueryCache.staleQueries}`
    );
  }

  console.log("\n" + "═".repeat(50));
  console.log("📋 Copy this JSON for comparison:");
  console.log("═".repeat(50));
  console.log(JSON.stringify(results, null, 2));

  // Store in localStorage for later comparison
  const history = JSON.parse(
    localStorage.getItem("flowats_perf_history") || "[]"
  );
  history.push(results);
  localStorage.setItem(
    "flowats_perf_history",
    JSON.stringify(history.slice(-10))
  );

  console.log("\n✅ Results saved to localStorage (last 10 runs kept)");
  console.log(
    '   Run: localStorage.getItem("flowats_perf_history") to see history'
  );

  return results;
})();
