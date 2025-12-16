# Load Testing Configuration for FlowATS (UC-137)

This directory contains Artillery load test configurations for performance testing.

## Installation

```bash
npm install -g artillery
```

## Test Scenarios

### 1. Basic Health Check (`health-check.yml`)
Tests the health endpoint with increasing load.

```bash
artillery run tests/load/health-check.yml
```

### 2. Job Listing Flow (`job-listing.yml`)
Simulates users browsing and filtering job listings.

```bash
artillery run tests/load/job-listing.yml
```

### 3. Authentication Flow (`auth-flow.yml`)
Tests login, signup, and session management.

```bash
artillery run tests/load/auth-flow.yml
```

### 4. AI Generation (`ai-generation.yml`)
Tests AI-powered resume and cover letter generation (slow, expensive).

```bash
artillery run tests/load/ai-generation.yml
```

### 5. Full User Journey (`full-journey.yml`)
Complete workflow: signup → profile → jobs → AI generation.

```bash
artillery run tests/load/full-journey.yml
```

## Running Tests

### Quick Test (Development)
```bash
# 10 users/second for 1 minute
artillery quick --count 10 --num 60 http://localhost:8787/api/health
```

### Full Test Suite
```bash
# Run all tests
npm run test:load

# With report generation
artillery run --output report.json tests/load/full-journey.yml
artillery report report.json
```

## Environment Variables

Set the target URL before running tests:

```bash
# Local development
export ARTILLERY_TARGET=http://localhost:8787

# Staging
export ARTILLERY_TARGET=https://staging.flowats.com

# Production (use with caution!)
export ARTILLERY_TARGET=https://flowats.com
```

## Interpreting Results

### Response Times
- **< 200ms:** Excellent
- **200-500ms:** Good
- **500-1000ms:** Acceptable
- **> 1000ms:** Slow (needs optimization)

### Error Rate
- **< 0.1%:** Excellent
- **0.1-1%:** Acceptable
- **1-5%:** Concerning
- **> 5%:** Critical (fix immediately)

### Latency Percentiles
- **p50 (median):** Half of users experience this or better
- **p95:** 95% of users experience this or better
- **p99:** Slowest 1% of requests (outliers)

## UC-137 Performance Targets

| Endpoint | p50 | p95 | p99 | Error Rate |
|----------|-----|-----|-----|------------|
| Health Check | < 50ms | < 100ms | < 200ms | < 0.1% |
| Job Listing | < 200ms | < 500ms | < 1000ms | < 1% |
| Authentication | < 300ms | < 700ms | < 1500ms | < 1% |
| AI Generation | < 5s | < 10s | < 15s | < 5% |
| Profile Fetch | < 100ms | < 300ms | < 500ms | < 0.5% |

## Best Practices

1. **Start small** - Begin with low load, gradually increase
2. **Test locally first** - Find obvious issues before hitting production
3. **Monitor resources** - Watch CPU, memory, database connections
4. **Identify bottlenecks** - Use profiling tools to find slow code
5. **Test edge cases** - Large payloads, many concurrent users, timeout scenarios
6. **Document findings** - Record performance improvements over time

## Common Issues

### High Response Times
- **Cause:** Slow database queries
- **Solution:** Add indexes, use pagination, enable caching

### Memory Leaks
- **Cause:** Unclosed connections, retained objects
- **Solution:** Profile with Chrome DevTools, fix leaks

### Connection Pool Exhaustion
- **Cause:** Too many concurrent database connections
- **Solution:** Use connection pooling, limit concurrent requests

### Rate Limiting
- **Cause:** Too many requests to external APIs (OpenAI)
- **Solution:** Implement request queuing, caching

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Load Test

on:
  push:
    branches: [main, staging]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Artillery
        run: npm install -g artillery
      - name: Run Load Tests
        run: |
          artillery run tests/load/health-check.yml
          artillery run tests/load/job-listing.yml
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: load-test-report
          path: report.json
```

## Scaling Recommendations

Based on load test results:

### Current Capacity (Free Tier)
- **Concurrent Users:** ~100
- **Requests/Second:** ~50
- **Peak Load:** ~500 requests/minute

### Upgrade Triggers
- **Memory > 80%** - Upgrade server instance
- **CPU > 70%** - Enable auto-scaling
- **Error rate > 1%** - Investigate and optimize
- **p95 > 1s** - Add caching, optimize queries

### Production Scaling (Future)
- **1,000 users:** Basic plan ($50/month)
- **10,000 users:** Pro plan ($200/month)
- **100,000 users:** Enterprise plan ($1,000+/month)

## Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Load Testing Best Practices](https://www.artillery.io/docs/guides/overview/best-practices)
- [Performance Monitoring Guide](https://www.artillery.io/docs/guides/plugins/plugin-metrics-by-endpoint)
