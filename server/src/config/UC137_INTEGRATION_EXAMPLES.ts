/**
 * UC-137 INTEGRATION GUIDE
 * 
 * This file provides examples for integrating UC-137 scalability features
 * into the existing server codebase.
 * 
 * DO NOT import this file - it's documentation with code examples.
 */

// =============================================================================
// STEP 1: Integrate Connection Pooling with supabaseAdmin.ts
// =============================================================================

/**
 * BEFORE (server/src/services/supabaseAdmin.ts):
 * 
 * export const supabaseAdmin = createClient(
 *   SUPABASE_URL!,
 *   SUPABASE_SERVICE_ROLE_KEY!,
 *   {
 *     auth: { persistSession: false },
 *     db: { schema: 'public' }
 *   }
 * );
 */

/**
 * AFTER (with connection pooling):
 * 
 * import { getPooledConnectionString } from '../config/database.js';
 * 
 * export const supabaseAdmin = createClient(
 *   getPooledConnectionString(), // Use pooled URL with :6543 port
 *   SUPABASE_SERVICE_ROLE_KEY!,
 *   {
 *     auth: { persistSession: false },
 *     db: { schema: 'public' }
 *   }
 * );
 */

// =============================================================================
// STEP 2: Add Resource Monitoring Middleware to server.ts
// =============================================================================

/**
 * Location: server/src/server.ts
 * 
 * Add to handleRequest() function (around line 343):
 */

// BEFORE handleRequest function starts, add this:
/*
import { getResourceMetrics, RequestMetrics } from './middleware/monitoring.js';

let lastResourceLog = Date.now();
const RESOURCE_LOG_INTERVAL = 30000; // 30 seconds
*/

// Inside handleRequest(), after counters.requests_total++:
/*
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  counters.requests_total++;
  
  // UC-137: Track request performance
  const startTime = Date.now();
  const memoryBefore = process.memoryUsage().heapUsed;
  
  const ctx = createRequestContext(req);
  
  // ... rest of handler ...
  
  // UC-137: Log slow requests and resource metrics
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = memoryAfter - memoryBefore;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${method} ${pathname} - ${duration}ms`);
    }
    
    // Log high memory usage (> 10MB delta)
    if (Math.abs(memoryDelta) > 10 * 1024 * 1024) {
      console.warn(`⚠️ High memory: ${method} ${pathname} - ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Periodic resource logging (every 30 seconds)
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
  
  // ... rest of handler continues ...
}
*/

// =============================================================================
// STEP 3: Add Health Check Endpoint with Detailed Metrics
// =============================================================================

/**
 * Location: server/src/routes/health.ts (or server.ts if integrated)
 * 
 * Replace existing handleHealth with enhanced version:
 */

/*
import { getResourceMetrics, getResourceStatus, formatBytes, formatPercentage } from '../middleware/monitoring.js';
import { getConnectionHealthStatus } from '../config/database.js';

async function handleHealthEnhanced(
  url: URL,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  { startedAt, counters }: any
) {
  // Get resource metrics
  const metrics = getResourceMetrics();
  const { status, alerts } = getResourceStatus(metrics);
  
  // Get database connection health
  let dbHealth;
  try {
    dbHealth = getConnectionHealthStatus();
  } catch (err) {
    console.warn('Failed to get DB connection health:', err);
  }
  
  const response = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    server: {
      requests_total: counters.requests_total,
      generate_total: counters.generate_total,
      generate_success: counters.generate_success,
      generate_fail: counters.generate_fail,
    },
    metrics: {
      cpu: {
        usage: formatPercentage(metrics.cpu.usage),
        loadAverage: metrics.cpu.loadAverage.map(avg => avg.toFixed(2)),
      },
      memory: {
        used: formatBytes(metrics.memory.used),
        total: formatBytes(metrics.memory.total),
        percentage: formatPercentage(metrics.memory.percentage),
      },
      process: {
        heapUsed: formatBytes(metrics.process.heapUsed),
        heapTotal: formatBytes(metrics.process.heapTotal),
      },
    },
    database: dbHealth ? {
      connections: {
        active: dbHealth.activeConnections,
        idle: dbHealth.idleConnections,
        max: dbHealth.maxConnections,
        utilization: formatPercentage(dbHealth.utilization),
        status: dbHealth.status,
      },
    } : undefined,
    alerts,
  };
  
  // Return 503 if critical, 200 otherwise
  const statusCode = status === 'critical' ? 503 : 200;
  jsonReply(req, res, statusCode, response);
}
*/

// =============================================================================
// STEP 4: Add Caching to Frequently Accessed Routes
// =============================================================================

/**
 * Example: Cache job listings
 * Location: server/src/routes/jobs.ts or wherever jobs are fetched
 */

/*
import { serverCache, CacheKeys } from '../services/cacheService.js';

async function getJobsForUser(userId: string, filters?: any) {
  const cacheKey = CacheKeys.jobs(userId, JSON.stringify(filters || {}));
  
  // Try cache first
  let jobs = serverCache.get(cacheKey);
  
  if (!jobs) {
    console.log(`Cache miss: ${cacheKey}`);
    
    // Fetch from database
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    jobs = data;
    
    // Cache for 5 minutes
    serverCache.set(cacheKey, jobs, 5 * 60 * 1000);
  } else {
    console.log(`Cache hit: ${cacheKey}`);
  }
  
  return jobs;
}
*/

/**
 * Example: Cache user profile
 */

/*
async function getUserProfile(userId: string) {
  const cacheKey = CacheKeys.profile(userId);
  
  let profile = serverCache.get(cacheKey);
  
  if (!profile) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    profile = data;
    
    // Cache profile for 15 minutes (changes less frequently)
    serverCache.set(cacheKey, profile, 15 * 60 * 1000);
  }
  
  return profile;
}
*/

/**
 * Example: Invalidate cache on updates
 */

/*
async function updateUserProfile(userId: string, updates: any) {
  // Update database
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Invalidate caches
  serverCache.delete(CacheKeys.profile(userId));
  serverCache.delete(CacheKeys.user(userId));
  
  // Also invalidate related caches if structure changed
  if (updates.skills || updates.education || updates.employment) {
    serverCache.delete(CacheKeys.skills(userId));
    serverCache.delete(CacheKeys.education(userId));
    serverCache.delete(CacheKeys.employment(userId));
  }
  
  return data;
}
*/

// =============================================================================
// STEP 5: Add Pagination to Job Listings
// =============================================================================

/**
 * Example: Paginated job listing endpoint
 */

/*
import { parsePaginationParams, getSupabaseRange, buildPaginatedResponse } from '../utils/pagination.js';

async function handleGetJobs(url: URL, req: http.IncomingMessage, res: http.ServerResponse) {
  const user = requireAuth(req); // Existing auth middleware
  
  // Parse pagination from query string
  const params = parsePaginationParams({
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
  });
  
  const { page, limit } = validatePaginationParams(params);
  const { from, to } = getSupabaseRange(page, limit);
  
  // Get total count (cache this in production!)
  const { count } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  
  // Get paginated data
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  
  const response = buildPaginatedResponse(data, page, limit, count || 0);
  jsonReply(req, res, 200, response);
}
*/

// =============================================================================
// STEP 6: Start Background Tasks in dev.mjs
// =============================================================================

/**
 * Location: dev.mjs or server start script
 * 
 * Add after server starts:
 */

/*
import { startResourceMonitoring } from './server/src/middleware/monitoring.js';
import { startCacheCleanup } from './server/src/services/cacheService.js';

// Start background tasks
startResourceMonitoring(30000);  // Log resources every 30 seconds
startCacheCleanup(300000);        // Clean expired cache every 5 minutes

console.log('✅ UC-137: Monitoring and cache cleanup tasks started');
*/

// =============================================================================
// ENVIRONMENT VARIABLES TO ADD
// =============================================================================

/*
# Add to .env file:

# UC-137: Database Connection Pooling
DB_MAX_CONNECTIONS=60
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000

# UC-137: Cache Configuration (optional, has defaults)
CACHE_MAX_SIZE_MB=100
CACHE_MAX_KEYS=10000
CACHE_DEFAULT_TTL_MS=300000

# UC-137: Monitoring (optional)
RESOURCE_LOG_INTERVAL_MS=30000
*/

// =============================================================================
// TESTING THE INTEGRATION
// =============================================================================

/*
# 1. Test connection pooling
curl http://localhost:8787/api/health

# Should return database connection info with pooling status

# 2. Test caching
curl -H "Authorization: Bearer TOKEN" http://localhost:8787/api/jobs
# First call: Cache miss (check logs)
# Second call: Cache hit (faster, check logs)

# 3. Test pagination
curl -H "Authorization: Bearer TOKEN" http://localhost:8787/api/jobs?page=2&limit=20

# 4. Monitor resources
# Watch console logs for resource metrics every 30 seconds

# 5. Run load tests
cd tests/load
artillery run health-check.yml
artillery run job-listing.yml
*/

// =============================================================================
// ROLLBACK PLAN (if issues occur)
// =============================================================================

/*
To rollback UC-137 changes:

1. Connection pooling:
   - Revert supabaseAdmin.ts to use SUPABASE_URL directly (not pooled URL)
   
2. Monitoring:
   - Remove monitoring imports from server.ts
   - Remove res.on('finish') handler
   
3. Caching:
   - Remove serverCache.get() calls
   - Fetch directly from database as before
   
4. Pagination:
   - Remove pagination params from routes
   - Use simple .limit() instead of .range()

All UC-137 features are additive and can be disabled without breaking existing functionality.
*/

export {};
