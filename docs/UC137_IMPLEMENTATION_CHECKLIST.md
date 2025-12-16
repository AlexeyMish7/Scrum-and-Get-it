# UC-137 Implementation Checklist

**User Story:** As a system administrator, I want to ensure the application can scale efficiently so that it can handle increased user load and maintain performance.

**Status:** 🟡 Phase 1 Complete - Integration Pending

---

## Phase 1: Foundation ✅ COMPLETE

Infrastructure files created with all UC-137 features:

- ✅ **Connection Pooling** (`server/src/config/database.ts`)
  - PgBouncer integration
  - Health monitoring interfaces
  - Environment-based configuration
  - Free tier limits (60 connections)
  - Best practices documentation

- ✅ **Caching Service** (`server/src/services/cacheService.ts`)
  - In-memory cache with LRU eviction
  - TTL-based expiration
  - Namespace support (user:*, job:*, etc.)
  - Cache statistics (hit rate, evictions)
  - Size-based eviction
  - Periodic cleanup task

- ✅ **Pagination Utilities** (`server/src/utils/pagination.ts`)
  - Offset-based pagination (page/limit)
  - Cursor-based pagination (for large datasets)
  - Supabase integration helpers
  - Standardized response format
  - Performance comparison documentation

- ✅ **Resource Monitoring** (`server/src/middleware/monitoring.ts`)
  - CPU, memory, load average tracking
  - Request performance metrics
  - Health check endpoint
  - Alert thresholds (warning/critical)
  - Background monitoring task

- ✅ **Load Testing** (`tests/load/`)
  - Artillery configuration files
  - Test scenarios (health, jobs, auth)
  - README with instructions
  - CI/CD integration examples

- ✅ **Documentation** (`docs/UC137_SCALABILITY_PERFORMANCE.md`)
  - Complete implementation guide
  - Usage examples for all features
  - Scaling strategies
  - Performance benchmarks
  - Migration path to production

---

## Phase 2: Integration ⏳ PENDING

Integrate UC-137 features into existing codebase:

### 2.1 Database Connection Pooling

- [ ] **Update `server/src/services/supabaseAdmin.ts`**
  ```typescript
  import { getPooledConnectionString } from '../config/database.js';
  
  export const supabaseAdmin = createClient(
    getPooledConnectionString(), // ← Change this line
    SUPABASE_SERVICE_ROLE_KEY!,
    // ... rest of config
  );
  ```
  **File:** `server/src/services/supabaseAdmin.ts` (around line 20)
  **Risk:** Low (just changes connection URL to use :6543 port)

- [ ] **Add environment variables to `.env`**
  ```bash
  DB_MAX_CONNECTIONS=60
  DB_CONNECTION_TIMEOUT=30000
  DB_IDLE_TIMEOUT=600000
  ```
  **File:** `.env` (server root)
  **Risk:** None (has defaults)

### 2.2 Resource Monitoring

- [ ] **Add monitoring to `server.ts`**
  
  Add imports at top of file:
  ```typescript
  import { getResourceMetrics, formatBytes, formatPercentage } from './middleware/monitoring.js';
  ```
  **Location:** After existing imports (around line 55)
  
  Add tracking variables:
  ```typescript
  let lastResourceLog = Date.now();
  const RESOURCE_LOG_INTERVAL = 30000; // 30 seconds
  ```
  **Location:** After `counters` declaration (around line 235)
  
  Add monitoring to `handleRequest()`:
  ```typescript
  // Track request performance
  const startTime = Date.now();
  const memoryBefore = process.memoryUsage().heapUsed;
  
  // ... existing handler code ...
  
  // Log metrics on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = memoryAfter - memoryBefore;
    
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${method} ${pathname} - ${duration}ms`);
    }
    
    if (Math.abs(memoryDelta) > 10 * 1024 * 1024) {
      console.warn(`⚠️ High memory: ${method} ${pathname} - ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Periodic resource logging
    const now = Date.now();
    if (now - lastResourceLog > RESOURCE_LOG_INTERVAL) {
      const metrics = getResourceMetrics();
      console.log('📊 Resources:', {
        cpu: `${(metrics.cpu.usage * 100).toFixed(2)}%`,
        memory: `${(metrics.memory.percentage * 100).toFixed(2)}%`,
        heap: `${(metrics.process.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        uptime: `${Math.floor(metrics.process.uptime / 60)}m`,
      });
      lastResourceLog = now;
    }
  });
  ```
  **Location:** Inside `handleRequest()` function (after `counters.requests_total++`)
  **File:** `server/src/server.ts` (around line 345)
  **Risk:** Low (only adds logging, doesn't change logic)

- [ ] **Enhance health endpoint**
  
  Update `handleHealth()` function or add new `handleHealthEnhanced()`:
  ```typescript
  import { getResourceMetrics, getResourceStatus } from './middleware/monitoring.js';
  import { getConnectionHealthStatus } from './config/database.js';
  
  // Add metrics to health response
  const metrics = getResourceMetrics();
  const { status, alerts } = getResourceStatus(metrics);
  
  // Add to response object
  const response = {
    status,
    // ... existing fields ...
    metrics: {
      cpu: formatPercentage(metrics.cpu.usage),
      memory: formatPercentage(metrics.memory.percentage),
      heap: formatBytes(metrics.process.heapUsed),
    },
    alerts,
  };
  ```
  **Location:** In `handleHealth()` function
  **File:** `server/src/routes/health.ts` or `server.ts` (search for "handleHealth")
  **Risk:** Low (adds data to response, doesn't break existing format)

### 2.3 Caching Layer

- [ ] **Add caching to job listings endpoint**
  
  Find the job listing route handler and add:
  ```typescript
  import { serverCache, CacheKeys } from '../services/cacheService.js';
  
  async function getJobsHandler() {
    const cacheKey = CacheKeys.jobs(userId);
    
    let jobs = serverCache.get(cacheKey);
    
    if (!jobs) {
      // Existing database query
      const { data } = await supabaseAdmin.from('jobs').select('*');
      jobs = data;
      
      // Cache for 5 minutes
      serverCache.set(cacheKey, jobs, 5 * 60 * 1000);
    }
    
    return jobs;
  }
  ```
  **Location:** Find job listing route in `server.ts` (search for `"/api/jobs"`)
  **Risk:** Medium (changes data flow, test thoroughly)

- [ ] **Add cache invalidation on job updates**
  
  Find job create/update handlers and add:
  ```typescript
  // After successful update
  serverCache.delete(CacheKeys.jobs(userId));
  ```
  **Location:** Job create/update routes
  **Risk:** Low (only invalidates cache, doesn't affect logic)

- [ ] **Start cache cleanup task**
  
  Add to server startup:
  ```typescript
  import { startCacheCleanup } from './services/cacheService.js';
  
  // Start cleanup task
  startCacheCleanup(300000); // Every 5 minutes
  ```
  **Location:** In `dev.mjs` or wherever server starts (after `server.listen()`)
  **File:** `dev.mjs` or `server.ts` init code
  **Risk:** None (background task, doesn't affect requests)

### 2.4 Pagination

- [ ] **Add pagination to job listing endpoint**
  
  ```typescript
  import { parsePaginationParams, validatePaginationParams, getSupabaseRange, buildPaginatedResponse } from '../utils/pagination.js';
  
  async function handleGetJobs(url: URL, req, res) {
    // Parse pagination
    const params = parsePaginationParams({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
    });
    
    const { page, limit } = validatePaginationParams(params);
    const { from, to } = getSupabaseRange(page, limit);
    
    // Get total count
    const { count } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Get paginated data
    const { data } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    // Return paginated response
    const response = buildPaginatedResponse(data, page, limit, count);
    jsonReply(req, res, 200, response);
  }
  ```
  **Location:** Job listing route handler
  **File:** `server.ts` (search for job listing route)
  **Risk:** Medium (changes response format, may need frontend updates)

- [ ] **Update frontend to handle pagination**
  
  Frontend needs to:
  - Parse `pagination` object from API response
  - Show page controls (next/previous)
  - Handle `page` and `limit` query params
  
  **File:** `frontend/src/app/workspaces/job_pipeline/` (job listing component)
  **Risk:** High (requires frontend changes, must coordinate)

### 2.5 Background Tasks

- [ ] **Start monitoring task on server startup**
  
  ```typescript
  import { startResourceMonitoring } from './middleware/monitoring.js';
  
  // Start monitoring (logs every 30 seconds)
  startResourceMonitoring(30000);
  ```
  **Location:** `dev.mjs` or server init
  **Risk:** None (optional logging)

---

## Phase 3: Testing ⏳ PENDING

### 3.1 Manual Testing

- [ ] **Test connection pooling**
  ```bash
  curl http://localhost:8787/api/health
  # Verify connection metrics in response
  ```

- [ ] **Test caching**
  ```bash
  curl -H "Authorization: Bearer TOKEN" http://localhost:8787/api/jobs
  # First call: Check logs for "Cache miss"
  # Second call: Check logs for "Cache hit"
  ```

- [ ] **Test pagination**
  ```bash
  curl -H "Authorization: Bearer TOKEN" "http://localhost:8787/api/jobs?page=1&limit=20"
  # Verify pagination object in response
  ```

- [ ] **Test monitoring**
  - Watch console logs for resource metrics every 30 seconds
  - Create many jobs to trigger slow request warnings
  - Check `/api/health` endpoint for detailed metrics

### 3.2 Load Testing

- [ ] **Install Artillery**
  ```bash
  npm install -g artillery
  ```

- [ ] **Run health check test**
  ```bash
  cd tests/load
  artillery run health-check.yml
  ```
  **Target:** p95 < 100ms, p99 < 200ms, 0% errors

- [ ] **Run job listing test**
  ```bash
  artillery run job-listing.yml
  ```
  **Target:** p95 < 500ms, p99 < 1s, < 1% errors

- [ ] **Create test users CSV**
  ```bash
  # Create tests/load/test-users.csv with format:
  # email,password
  # test1@example.com,password123
  # test2@example.com,password123
  ```

- [ ] **Document load test results**
  - Record response times (p50, p95, p99)
  - Note any errors or failures
  - Identify bottlenecks
  - Save report for future comparison

### 3.3 Performance Benchmarking

- [ ] **Measure response times BEFORE UC-137**
  - GET /api/jobs: ___ms
  - POST /api/jobs: ___ms
  - GET /api/health: ___ms
  - POST /api/ai/resume: ___ms

- [ ] **Measure response times AFTER UC-137**
  - GET /api/jobs: ___ms (expect faster with caching)
  - POST /api/jobs: ___ms (similar)
  - GET /api/health: ___ms (similar)
  - POST /api/ai/resume: ___ms (expect faster with caching)

- [ ] **Measure cache hit rate**
  - Use `serverCache.getStats()` to check hit rate
  - Target: > 60% hit rate after warm-up

- [ ] **Measure resource usage**
  - Memory usage under load
  - CPU usage under load
  - Connection pool utilization
  - Target: < 80% memory, < 70% CPU

---

## Phase 4: Documentation ✅ COMPLETE

- ✅ **UC-137 implementation guide** (`docs/UC137_SCALABILITY_PERFORMANCE.md`)
- ✅ **Integration examples** (`server/src/config/UC137_INTEGRATION_EXAMPLES.ts`)
- ✅ **Load testing guide** (`tests/load/README.md`)
- ✅ **This checklist** (`docs/UC137_IMPLEMENTATION_CHECKLIST.md`)

---

## Phase 5: Deployment ⏳ PENDING

### 5.1 Pre-Deployment

- [ ] **Review all changes**
  - Code review with team
  - Test on staging environment
  - Monitor for any regressions

- [ ] **Update environment variables**
  - Add UC-137 vars to `.env.production`
  - Verify Supabase PgBouncer URL
  - Set appropriate cache limits

- [ ] **Database preparation**
  - Verify all indexes exist (from migrations)
  - Check connection pool capacity
  - Monitor current load

### 5.2 Deployment

- [ ] **Deploy to staging**
  - Run full test suite
  - Run load tests
  - Monitor for 24 hours

- [ ] **Deploy to production**
  - Deploy during low-traffic period
  - Monitor health endpoint
  - Watch error rates
  - Check resource metrics

### 5.3 Post-Deployment

- [ ] **Monitor for 7 days**
  - Response times
  - Error rates
  - Resource usage
  - Cache hit rates

- [ ] **Adjust configurations**
  - Tune cache TTLs if needed
  - Adjust connection pool limits
  - Update pagination defaults

- [ ] **Document lessons learned**
  - What worked well
  - What needed adjustment
  - Future optimizations

---

## Rollback Plan 🔴

If issues occur, rollback in reverse order:

1. **Remove pagination** (highest risk)
   - Revert route handlers to use simple `.limit()`
   - May need frontend hotfix

2. **Disable caching**
   - Comment out `serverCache.get()` calls
   - Fetch directly from database

3. **Remove monitoring**
   - Comment out `res.on('finish')` handler
   - Remove background tasks

4. **Revert connection pooling** (lowest risk)
   - Change `supabaseAdmin.ts` back to non-pooled URL

All rollbacks can be done without database changes or migrations.

---

## Success Criteria ✅

UC-137 is complete when:

- [x] All foundation files created and tested
- [ ] Integration complete and working
- [ ] Load tests pass performance targets
- [ ] Documentation updated
- [ ] Deployed to production
- [ ] Monitoring shows improved performance
- [ ] No increase in error rates
- [ ] Cache hit rate > 60%
- [ ] Resource usage < 80% under load

---

## Notes

- All UC-137 features are **additive** - they don't delete existing code
- Integration can be done incrementally (phase 2.1 → 2.2 → 2.3 → 2.4)
- Each integration step can be tested independently
- Rollback is easy - just remove new code
- Free tier friendly - no external services required
- Clear migration path to production infrastructure

---

## Next Steps

**Immediate (Today):**
1. Review this checklist with team
2. Create git branch: `feat/uc-137-integration`
3. Start with Phase 2.1 (connection pooling) - lowest risk

**This Week:**
1. Complete Phase 2 (integration)
2. Complete Phase 3 (testing)
3. Deploy to staging

**Next Week:**
1. Monitor staging
2. Deploy to production
3. Monitor production

**Estimated Time:** 2-3 days for full integration and testing
