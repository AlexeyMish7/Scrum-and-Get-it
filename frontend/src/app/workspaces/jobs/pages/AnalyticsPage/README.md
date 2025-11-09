# Analytics helpers (local)

This folder contains small, additive utilities and a compact benchmark card used by the Jobs Analytics page.

Files added:

- `analyticsHelpers.ts` — helper functions and lightweight static industry benchmarks. Exports:
  - `JobRecord` (type)
  - `computeSuccessRates(jobs, groupBy)`
  - `computeAvgResponseDays(jobs, groupBy)`
  - `compareToBenchmarks(successRates, benchmarks)`
  - `formatPercent(v)`

- `BenchmarkCard.tsx` — small MUI `Paper` component that presents a comparison between your offer rates and the static `industryBenchmarks` defined in `analyticsHelpers.ts`.

How to use from `AnalyticsPage.tsx` (example, no changes in the existing page required):

```ts
import BenchmarkCard from './BenchmarkCard';
import { JobRecord } from './analyticsHelpers';

// inside the page render where `jobs` is available
// <BenchmarkCard jobs={jobs as JobRecord[]} />
```

Notes:
- These are intentionally client-side helpers with conservative static benchmarks. For production-grade benchmarking, the server should supply aggregated, privacy-preserving industry averages.
- No existing files were modified; these are additive and optional.
