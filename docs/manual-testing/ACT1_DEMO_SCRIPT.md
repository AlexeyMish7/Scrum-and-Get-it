# Act 1 Demo Script

## 1.1 Production Environment & CI/CD (UC-129, UC-132)

### Demo 1: SSL & Production URL

1. Open: `https://scrum-and-get-it-fjyi.vercel.app`
2. Click 🔒 padlock → "Connection is secure" → "Certificate is valid"
3. Open DevTools (F12) → Console → Confirm no CORS errors

### Demo 2: GitHub Actions

1. Open: `https://github.com/AlexeyMish7/Scrum-and-Get-it/actions`
2. Click "CI" → Click a green ✅ run
3. Click "Tests" job → Expand "Run server tests" (350 passed)
4. Expand "Run frontend tests" (228 passed)

---

## 1.2 Monitoring & Performance (UC-133, UC-134)

### Demo 3: Sentry Error Tracking

1. Open: `https://sentry.io` → Your project issues

**Trigger Backend Error (PowerShell):**

```powershell
$headers = @{ "Authorization" = "Bearer YOUR_MONITORING_TEST_TOKEN" }
Invoke-RestMethod -Uri "https://YOUR-BACKEND.onrender.com/api/monitoring/test-error" -Method POST -Headers $headers
```

**Trigger Frontend Error (Browser Console on production site):**

```javascript
throw new Error("UC-134");
```

2. Refresh Sentry → Show both errors with stack traces

### Demo 4: Uptime Monitoring

Open: `https://YOUR-BACKEND.onrender.com/api/health`

Shows: `{ "status": "ok", "uptime_sec": ... }`

### Demo 5: Lighthouse Report

1. Open: `tests/scrum-and-get-it-fjyi.vercel.app-20251216T040939.html`
2. Scores: Performance 88 | Accessibility 95 | Best Practices 100 | SEO 83

---

## Quick URLs

| Resource       | URL                                                           |
| -------------- | ------------------------------------------------------------- |
| Production     | https://scrum-and-get-it-fjyi.vercel.app                      |
| GitHub Actions | https://github.com/AlexeyMish7/Scrum-and-Get-it/actions       |
| Sentry         | https://sentry.io                                             |
| Lighthouse     | `tests/scrum-and-get-it-fjyi.vercel.app-20251216T040939.html` |
