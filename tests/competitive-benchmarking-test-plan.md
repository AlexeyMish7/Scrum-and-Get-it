# Competitive Benchmarking Testing Guide

## Prerequisites
- Supabase project running
- Backend server running on localhost:8787
- Frontend running on localhost:5173
- At least 1 authenticated user account

---

## Step 1: Deploy Database Migrations

### 1.1 Open Supabase SQL Editor
Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

### 1.2 Run Schema Migration
Copy and paste the entire contents of:
```
db/migrations/2025-11-30_add_competitive_benchmarking.sql
```

Click **Run**. Should see:
- ✅ 4 tables created
- ✅ 5 industry standards inserted
- ✅ 5 career progression patterns inserted

### 1.3 Run Compute Function Migration
Copy and paste the entire contents of:
```
db/migrations/2025-11-30_add_peer_benchmark_compute_function.sql
```

Click **Run**. Should see:
- ✅ 2 functions created (compute_peer_benchmarks, compute_all_peer_benchmarks)

### 1.4 Verify Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'peer_benchmarks',
  'industry_standards',
  'career_progression_patterns',
  'user_competitive_position'
);
```

Expected: 4 rows returned

---

## Step 2: Verify Seeded Data

### 2.1 Check Industry Standards
```sql
SELECT industry, confidence_level 
FROM industry_standards;
```

Expected: 5 industries (Software, Finance, Healthcare, Education, Marketing)

### 2.2 Check Career Progression Patterns
```sql
SELECT from_title, to_title, industry, success_rate 
FROM career_progression_patterns;
```

Expected: 5 career paths

---

## Step 3: Create Test User Data

You need at least 5 users with jobs to test peer benchmarks. Here's a quick way to verify or add test data:

### 3.1 Check Current User Count
```sql
SELECT 
  p.industry,
  p.experience_level,
  COUNT(DISTINCT p.id) as user_count,
  COUNT(j.id) as total_jobs
FROM profiles p
LEFT JOIN jobs j ON j.user_id = p.id
WHERE p.industry IS NOT NULL 
  AND p.experience_level IS NOT NULL
GROUP BY p.industry, p.experience_level
ORDER BY user_count DESC;
```

### 3.2 If Needed: Add Test Jobs for Your User
**Via Frontend:**
1. Navigate to http://localhost:5173/jobs
2. Click "Add Job"
3. Fill in details:
   - Company name
   - Job title
   - Status: Applied / Interview / Offer
   - Required skills
   - Salary range (optional)
4. Create 5-10 test jobs with different statuses

**Via SQL (Quick Test):**
```sql
-- Get your user ID first
SELECT id, email FROM profiles WHERE email = 'your-email@example.com';

-- Insert test jobs (replace YOUR_USER_ID)
INSERT INTO jobs (user_id, company_name, job_title, status, required_skills, created_at, status_changed_at)
VALUES
  ('YOUR_USER_ID', 'Tech Corp', 'Software Engineer', 'applied', '["JavaScript", "React"]', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('YOUR_USER_ID', 'StartupXYZ', 'Senior Developer', 'interview', '["Node.js", "AWS"]', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days'),
  ('YOUR_USER_ID', 'Big Tech Inc', 'Full Stack Engineer', 'rejected', '["Python", "Django"]', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days'),
  ('YOUR_USER_ID', 'Innovation Labs', 'Backend Engineer', 'offer', '["Go", "Kubernetes"]', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
  ('YOUR_USER_ID', 'Cloud Solutions', 'DevOps Engineer', 'applied', '["Docker", "CI/CD"]', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');
```

---

## Step 4: Test Peer Benchmark Computation

### 4.1 Via SQL (Manual)
```sql
-- Compute all benchmarks
SELECT compute_all_peer_benchmarks();

-- Check results
SELECT 
  industry,
  experience_level,
  sample_size,
  data_quality_score,
  avg_applications_per_month,
  avg_response_rate,
  avg_interview_rate,
  last_computed_at
FROM peer_benchmarks
ORDER BY sample_size DESC;
```

**Expected:**
- If sample_size >= 5: Benchmark computed with real data
- If sample_size < 5: Notice message about insufficient data

### 4.2 Via Backend API (Programmatic)

**Start servers:**
```powershell
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Test API with curl/Postman:**
```powershell
# Trigger computation (requires authentication)
curl -X POST http://localhost:8787/api/admin/compute-benchmarks `
  -H "Content-Type: application/json" `
  --cookie "your-auth-cookie"

# Check benchmark status
curl http://localhost:8787/api/admin/benchmark-status `
  --cookie "your-auth-cookie"
```

---

## Step 5: Test Frontend Component

### 5.1 Navigate to Analytics Page
Open: http://localhost:5173/jobs/analytics

### 5.2 Scroll to "Trends & Benchmarks" Section
Look for **"Competitive Market Positioning"** card

### 5.3 Test Card Features

**Expand Card:**
- Click the accordion to expand
- Should show loading spinner initially

**Verify 8 Sections Load:**
1. ✅ **Percentile Rankings** - Color-coded cards
2. ✅ **Peer Comparison** - Progress bars with deltas
3. ✅ **Industry Standards** - Comparison chips
4. ✅ **Career Progression** - Timeline cards
5. ✅ **Skill Gap Analysis** - Match percentage
6. ✅ **Competitive Advantages** - Recommendation cards
7. ✅ **Differentiation Strategies** - Strategy cards
8. ✅ **Market Optimization** - 4 categories (visibility, targeting, timing, quality)

**Test Actions:**
- Click "Refresh Analysis" button → Should reload data
- Click "Export JSON" button → Should download positioning-analysis.json
- Expand/collapse individual accordions → Should work smoothly

### 5.4 Check Network Tab
Open DevTools → Network tab → Filter by XHR

Should see:
```
POST http://localhost:8787/api/analytics/competitive/position
Status: 200 OK
Response: {
  percentileRankings: {...},
  peerComparison: {...},
  industryStandards: {...},
  ...
}
```

---

## Step 6: Test Admin Benchmark Dashboard

### 6.1 Add Dashboard to App (If Not Already)

**Option A: Add as admin route** (recommended)
Create: `frontend/src/app/admin/AdminPage.tsx`
```tsx
import { AdminBenchmarkDashboard } from './components/AdminBenchmarkDashboard';

export function AdminPage() {
  return <AdminBenchmarkDashboard />;
}
```

**Option B: Temporary test route**
Add to existing AnalyticsView for testing:
```tsx
import { AdminBenchmarkDashboard } from '../../../admin/components/AdminBenchmarkDashboard';

// Add below CompetitivePositioningCard
<Grid size={12}>
  <AdminBenchmarkDashboard />
</Grid>
```

### 6.2 Navigate to Dashboard
http://localhost:5173/jobs/analytics (if added to AnalyticsView)

### 6.3 Test Dashboard Features

**Check Status Overview:**
- Coverage percentage (should be 0-100%)
- Total sample size
- High quality benchmarks count
- Uncovered segments list

**Trigger Computation:**
- Click "Compute Benchmarks" button
- Should see "Computing..." state
- Wait for success message
- Status should refresh automatically

**Check Benchmark Table:**
- Should show all computed benchmarks
- Sample size with color coding (green ≥20, yellow 5-19)
- Data quality score (0.4-1.0)
- Metrics: apps/month, response rate, interview rate, offer rate
- Last computed timestamp

**Refresh Status:**
- Click "Refresh Status" button
- Should reload current benchmark data

---

## Step 7: Test Edge Cases

### 7.1 Test with Zero Peer Data
```sql
-- Clear peer benchmarks
DELETE FROM peer_benchmarks;

-- Try to fetch competitive position via API
-- Should return fallback values with sample_size = 0
```

**Frontend should show:**
- "Limited peer data available" message
- Percentile: 50 (median)
- Peer comparison shows fallback

### 7.2 Test with Missing Profile Data
```sql
-- Update profile to remove industry
UPDATE profiles SET industry = NULL WHERE id = 'YOUR_USER_ID';

-- Try to fetch competitive position
-- Should return error or generic analysis
```

### 7.3 Test Cache Expiry
```sql
-- Check cached position
SELECT generated_at, expires_at 
FROM user_competitive_position 
WHERE user_id = 'YOUR_USER_ID';

-- Manually expire cache
UPDATE user_competitive_position 
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE user_id = 'YOUR_USER_ID';

-- Refresh analysis in frontend
-- Should regenerate with new timestamp
```

### 7.4 Test Privacy Threshold
```sql
-- Check segments with < 5 users
SELECT 
  p.industry,
  p.experience_level,
  COUNT(DISTINCT p.id) as user_count
FROM profiles p
WHERE p.industry IS NOT NULL
GROUP BY p.industry, p.experience_level
HAVING COUNT(DISTINCT p.id) < 5;

-- Try to compute benchmark for small segment
SELECT compute_peer_benchmarks('YourIndustry', 'mid', NULL, NULL);

-- Should see NOTICE: "Insufficient data..."
-- No benchmark row should be created
```

---

## Step 8: Verify Data Privacy

### 8.1 Check Peer Benchmark Anonymization
```sql
-- Verify no individual user data is exposed
SELECT * FROM peer_benchmarks LIMIT 1;

-- Should only see aggregated metrics
-- No user_id, email, or identifiable information
```

### 8.2 Check RLS Policies
```sql
-- Try to insert as regular user (should fail)
INSERT INTO peer_benchmarks (industry, experience_level, sample_size)
VALUES ('Test', 'mid', 1);

-- Expected: RLS policy violation error
```

---

## Expected Results Summary

### ✅ Database Layer
- 4 tables created successfully
- 5 industry standards seeded
- 5 career progression patterns seeded
- Compute functions work without errors
- Privacy threshold (5+ users) enforced

### ✅ Backend API
- POST /api/analytics/competitive/position returns full analysis
- POST /api/admin/compute-benchmarks triggers computation
- GET /api/admin/benchmark-status shows coverage
- Fallback values returned when peer data missing
- Cache works (7-day expiry)

### ✅ Frontend
- CompetitivePositioningCard displays all 8 sections
- Loading states work correctly
- Export JSON downloads successfully
- Refresh button reloads data
- Error states handled gracefully
- AdminBenchmarkDashboard shows metrics and allows computation

### ✅ Privacy & Security
- Minimum 5 users required for peer benchmarks
- No individual user data exposed
- RLS policies prevent unauthorized access
- Authentication required for all endpoints

---

## Troubleshooting

### Issue: "No benchmarks computed"
**Solution:** Need at least 5 users with jobs in a segment
```sql
-- Check user distribution
SELECT industry, experience_level, COUNT(*) 
FROM profiles 
WHERE industry IS NOT NULL 
GROUP BY industry, experience_level;
```

### Issue: "Percentile always 50"
**Solution:** Backend using fallback due to missing peer data
- Run compute function
- Verify peer_benchmarks table has rows
- Check sample_size column > 0

### Issue: "Cannot read property of undefined"
**Solution:** Frontend expecting data structure that doesn't match
- Check browser console for errors
- Verify API response structure matches TypeScript interfaces
- Check network tab for actual response

### Issue: "RLS policy violation"
**Solution:** User not authenticated or missing permissions
- Verify Supabase auth cookie exists
- Check requireAuth middleware is working
- Verify user session is valid

---

## Performance Notes

- Compute function takes ~1-5 seconds depending on user count
- Frontend analysis request takes ~500ms-2s
- Cache reduces subsequent requests to <100ms
- Admin dashboard status fetch: ~200-500ms

---

## Next Steps After Testing

1. **Add more test users** - Need 5+ per segment for real benchmarks
2. **Schedule automated computation** - Set up Supabase cron job to run nightly
3. **Add admin role check** - Restrict admin endpoints to actual admins
4. **Monitor data quality** - Track sample sizes and quality scores over time
5. **Add user feedback** - Collect input on recommendation usefulness
