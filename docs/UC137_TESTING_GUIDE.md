# UC-137 Testing Guide

Quick guide for testing all UC-137 scalability features locally.

## Prerequisites

```bash
# Make sure server and frontend are running
npm run dev  # In root directory (runs both)
```

---

## Test 1: Connection Pooling ✅

**What:** Verify database uses connection pooling with health monitoring

### Steps:

1. **Check health endpoint:**
```bash
curl http://localhost:8787/api/health
```

**Expected:** JSON response with server status (currently basic version)

2. **After integration, check for connection metrics:**
```bash
curl http://localhost:8787/api/health | jq
```

**Expected (after integration):**
```json
{
  "status": "healthy",
  "metrics": {
    "cpu": "15.23%",
    "memory": "25.00%"
  },
  "database": {
    "connections": {
      "active": 5,
      "max": 60,
      "utilization": "8.33%"
    }
  }
}
```

3. **Test in Node console:**
```bash
cd server
node
```

```javascript
// In Node REPL
const { getPooledConnectionString } = await import('./src/config/database.js');
console.log(getPooledConnectionString());
// Expected: URL with :6543 port (not :5432)
```

---

## Test 2: Caching Service ✅

**What:** Verify cache works with get/set/stats

### Steps:

1. **Test cache in Node:**
```bash
cd server
node
```

```javascript
// In Node REPL
const { serverCache, CacheKeys } = await import('./src/services/cacheService.js');

// Set a value
serverCache.set(CacheKeys.user('test123'), { name: 'John' }, 60000);
console.log('✅ Set cache');

// Get the value
const user = serverCache.get(CacheKeys.user('test123'));
console.log('User from cache:', user);
// Expected: { name: 'John' }

// Check stats
const stats = serverCache.getStats();
console.log('Cache stats:', stats);
// Expected: { hits: 1, misses: 0, hitRate: 1, totalKeys: 1, ... }

// Test cache miss
const missing = serverCache.get(CacheKeys.user('nonexistent'));
console.log('Missing:', missing);
// Expected: null

// Check updated stats
console.log('Updated stats:', serverCache.getStats());
// Expected: { hits: 1, misses: 1, hitRate: 0.5, ... }
```

2. **Test TTL expiration:**
```javascript
// Set with 2 second TTL
serverCache.set('test', { value: 123 }, 2000);

// Get immediately
console.log('Immediate:', serverCache.get('test'));
// Expected: { value: 123 }

// Wait 3 seconds
await new Promise(r => setTimeout(r, 3000));

// Try to get again
console.log('After expiry:', serverCache.get('test'));
// Expected: null (expired)
```

3. **Test LRU eviction:**
```javascript
const { createCacheService } = await import('./src/services/cacheService.js');

// Create small cache (max 2 keys)
const smallCache = createCacheService({ maxKeys: 2 });

smallCache.set('key1', 'value1');
smallCache.set('key2', 'value2');
console.log('Keys:', smallCache.keys());
// Expected: ['key1', 'key2']

// Add third key (should evict key1)
smallCache.set('key3', 'value3');
console.log('After eviction:', smallCache.keys());
// Expected: ['key2', 'key3']

console.log('Evicted key:', smallCache.get('key1'));
// Expected: null
```

---

## Test 3: Pagination ✅

**What:** Verify pagination utilities work correctly

### Steps:

1. **Test offset-based pagination:**
```bash
cd server
node
```

```javascript
const { getSupabaseRange, buildPaginatedResponse } = await import('./src/utils/pagination.js');

// Calculate range for page 1, limit 20
const { from, to } = getSupabaseRange(1, 20);
console.log('Page 1:', { from, to });
// Expected: { from: 0, to: 19 }

// Calculate range for page 2, limit 20
const page2 = getSupabaseRange(2, 20);
console.log('Page 2:', page2);
// Expected: { from: 20, to: 39 }

// Build paginated response
const data = [1, 2, 3, 4, 5];
const response = buildPaginatedResponse(data, 1, 20, 156);
console.log('Response:', JSON.stringify(response, null, 2));
// Expected: { data: [...], pagination: { page: 1, totalPages: 8, ... }}
```

2. **Test cursor-based pagination:**
```javascript
const { encodeCursor, decodeCursor } = await import('./src/utils/pagination.js');

// Encode cursor
const cursor = encodeCursor(12345, 'created_at');
console.log('Encoded cursor:', cursor);
// Expected: Base64 string

// Decode cursor
const decoded = decodeCursor(cursor);
console.log('Decoded:', decoded);
// Expected: { value: 12345, field: 'created_at' }
```

---

## Test 4: Resource Monitoring ✅

**What:** Verify system metrics tracking works

### Steps:

1. **Test metrics collection:**
```bash
cd server
node
```

```javascript
const { getResourceMetrics, formatBytes, formatPercentage } = await import('./src/middleware/monitoring.js');

// Get current metrics
const metrics = getResourceMetrics();
console.log('CPU:', formatPercentage(metrics.cpu.usage));
console.log('Memory:', formatBytes(metrics.memory.used), '/', formatBytes(metrics.memory.total));
console.log('Heap:', formatBytes(metrics.process.heapUsed));
console.log('Uptime:', Math.floor(metrics.process.uptime), 'seconds');

// Expected: Realistic system metrics
```

2. **Test health status:**
```javascript
const { getResourceMetrics, getResourceStatus } = await import('./src/middleware/monitoring.js');

const metrics = getResourceMetrics();
const { status, alerts } = getResourceStatus(metrics);
console.log('Status:', status);
console.log('Alerts:', alerts);
// Expected: 'healthy' with empty alerts array (unless system is under load)
```

3. **Test formatting helpers:**
```javascript
const { formatBytes, formatPercentage } = await import('./src/middleware/monitoring.js');

console.log(formatBytes(1024));        // Expected: "1.00 KB"
console.log(formatBytes(1048576));     // Expected: "1.00 MB"
console.log(formatBytes(1073741824));  // Expected: "1.00 GB"
console.log(formatPercentage(0.7532)); // Expected: "75.32%"
```

---

## Test 5: Integration Test (After Phase 2)

**What:** Test all features working together

### Prerequisites:
- Complete Phase 2 integration (see UC137_IMPLEMENTATION_CHECKLIST.md)

### Steps:

1. **Start server with monitoring:**
```bash
# Server should log resources every 30 seconds
npm run dev:server
# Watch for: "📊 Resources: { cpu: '...', memory: '...', ... }"
```

2. **Test cached job listings:**
```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r .token)

# First request (cache miss)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/jobs
# Check server logs for: "Cache miss: jobs:..."

# Second request (cache hit)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/jobs
# Check server logs for: "Cache hit: jobs:..."
```

3. **Test paginated jobs:**
```bash
# Get page 1
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8787/api/jobs?page=1&limit=10"
# Expected: JSON with "pagination" object

# Get page 2
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8787/api/jobs?page=2&limit=10"
```

4. **Test slow request warning:**
```bash
# Trigger AI generation (slow operation)
curl -X POST http://localhost:8787/api/generate/resume \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template":"professional","targetJob":"Software Engineer"}'

# Check server logs for: "⚠️ Slow request: POST /api/generate/resume - XXXXms"
```

---

## Test 6: Load Testing 🚀

**What:** Test performance under load

### Prerequisites:
```bash
npm install -g artillery
```

### Steps:

1. **Test health endpoint:**
```bash
cd tests/load
artillery run health-check.yml
```

**Expected output:**
```
Summary:
  Scenarios launched: 1000+
  Response time (p95): < 100ms
  Response time (p99): < 200ms
  Errors: 0%
```

2. **Quick load test:**
```bash
# Hit health endpoint with 50 requests/sec for 30 seconds
artillery quick --count 50 --num 30 http://localhost:8787/api/health
```

3. **Monitor resources during test:**
```bash
# In another terminal, watch health endpoint
watch -n 1 'curl -s http://localhost:8787/api/health | jq ".metrics"'
```

**Expected:** CPU and memory increase during test, return to normal after

4. **Job listing load test** (requires test users):
```bash
# First, create test-users.csv:
echo "email,password" > test-users.csv
echo "test@example.com,password" >> test-users.csv

# Run test
artillery run job-listing.yml
```

---

## Test 7: Cache Performance Comparison 📊

**What:** Measure cache performance improvement

### Steps:

1. **Without cache (baseline):**
```bash
# Get 10 job listings without cache
time for i in {1..10}; do
  curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/jobs > /dev/null
done
```

**Record time:** ______ seconds

2. **With cache:**
```bash
# Get 10 job listings (first warms cache, rest hit cache)
time for i in {1..10}; do
  curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/jobs > /dev/null
done
```

**Record time:** ______ seconds (should be much faster!)

3. **Check cache stats:**
```bash
cd server
node -e "
const { serverCache } = await import('./src/services/cacheService.js');
const stats = serverCache.getStats();
console.log('Hit rate:', (stats.hitRate * 100).toFixed(2) + '%');
console.log('Total hits:', stats.hits);
console.log('Total misses:', stats.misses);
"
```

**Expected:** Hit rate > 60% after warm-up

---

## Test 8: Database Connection Pool 💾

**What:** Verify connection pooling prevents exhaustion

### Steps:

1. **Check pool configuration:**
```bash
cd server
node -e "
const { getDatabaseConfig } = await import('./src/config/database.js');
const config = getDatabaseConfig();
console.log('Max connections:', config.maxConnections);
console.log('Connection timeout:', config.connectionTimeout);
console.log('Pooled URL:', config.pooledUrl.includes(':6543') ? '✅ Using PgBouncer' : '❌ Not using pooling');
"
```

2. **Simulate concurrent connections:**
```bash
# Make 20 concurrent requests
seq 1 20 | xargs -P 20 -I {} curl -s http://localhost:8787/api/health > /dev/null
echo "✅ Completed 20 concurrent requests"
```

**Expected:** All requests succeed without connection errors

---

## Test 9: Memory Leak Detection 🔍

**What:** Verify no memory leaks during extended use

### Steps:

1. **Monitor memory over time:**
```bash
cd server
node -e "
const { getResourceMetrics, formatBytes } = await import('./src/middleware/monitoring.js');

setInterval(() => {
  const metrics = getResourceMetrics();
  console.log(new Date().toISOString(), 
    'Heap:', formatBytes(metrics.process.heapUsed),
    'RSS:', formatBytes(metrics.process.rss));
}, 5000);
" &
```

2. **Generate load:**
```bash
# Run for 5 minutes
artillery quick --count 10 --num 300 http://localhost:8787/api/health
```

3. **Check memory:**
- Heap should stay relatively stable
- Small increases are normal (garbage collection cycles)
- Large continuous increases = potential memory leak

---

## Troubleshooting

### Issue: "Module not found" errors
**Solution:**
```bash
cd server
npm install
```

### Issue: Cache doesn't work
**Solution:**
- Verify integration completed (Phase 2.3 in checklist)
- Check server logs for cache hit/miss messages
- Ensure `serverCache` is imported in route handlers

### Issue: Health endpoint returns 404
**Solution:**
```bash
# Verify server is running
curl http://localhost:8787/api/health
# Check if server started on correct port
```

### Issue: Load tests fail
**Solution:**
```bash
# Install Artillery globally
npm install -g artillery

# Verify server is running
curl http://localhost:8787/api/health

# Check Artillery config syntax
artillery run --help
```

### Issue: High memory usage warnings
**Expected:** Normal under load testing
**Action if persistent:**
- Check for memory leaks with Chrome DevTools profiler
- Review cache size limits
- Verify cleanup tasks are running

---

## Success Criteria

UC-137 testing is successful when:

- ✅ All Node REPL tests pass without errors
- ✅ Cache hit rate > 60% after warm-up
- ✅ Health endpoint returns detailed metrics
- ✅ Load tests complete without errors
- ✅ Response times meet targets (p95 < 500ms)
- ✅ Resource usage stays below thresholds (< 80% memory, < 70% CPU)
- ✅ No memory leaks during extended testing
- ✅ Pagination returns correct page counts
- ✅ Connection pooling prevents exhaustion

---

## Next Steps After Testing

1. **Document results** in `UC137_IMPLEMENTATION_CHECKLIST.md`
2. **Fix any issues** found during testing
3. **Run full test suite** (unit + integration + load)
4. **Deploy to staging** for 24-hour monitoring
5. **Deploy to production** during low-traffic period

---

## Quick Test Commands Reference

```bash
# Test all features (Node REPL)
cd server && node

# Test cache
const { serverCache } = await import('./src/services/cacheService.js');
serverCache.set('test', {data: 123}, 60000);
console.log(serverCache.get('test'));
console.log(serverCache.getStats());

# Test pagination
const { getSupabaseRange } = await import('./src/utils/pagination.js');
console.log(getSupabaseRange(2, 20));

# Test monitoring
const { getResourceMetrics } = await import('./src/middleware/monitoring.js');
console.log(getResourceMetrics());

# Test connection config
const { getDatabaseConfig } = await import('./src/config/database.js');
console.log(getDatabaseConfig());

# Load test
cd tests/load && artillery run health-check.yml

# Quick load test
artillery quick --count 10 --num 60 http://localhost:8787/api/health
```

---

**Ready to test?** Start with Test 1-4 (individual features), then move to Test 5-6 (integration) after Phase 2 is complete!
