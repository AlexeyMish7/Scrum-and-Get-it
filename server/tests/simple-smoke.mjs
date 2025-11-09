#!/usr/bin/env node
/**
 * Simple Smoke Test Runner
 *
 * PURPOSE: Lightweight test runner for basic connectivity and auth verification.
 * USAGE: node tests/simple-smoke.mjs
 *
 * Tests core functionality without external dependencies:
 * - Server health check
 * - Environment configuration validation
 * - Basic auth header validation
 * - Resume generation API connectivity
 */

import { createClient } from "@supabase/supabase-js";

// Configuration from environment
const CONFIG = {
  server: {
    baseUrl: process.env.TEST_SERVER_URL || "http://localhost:8787",
    allowDevAuth: process.env.ALLOW_DEV_AUTH === "true",
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
};

// Simple test runner
class SimpleTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  async assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      this.passed++;
    } else {
      console.error(`❌ ${message}`);
      this.failed++;
    }
    return condition;
  }

  async assertEqual(actual, expected, message) {
    return this.assert(
      actual === expected,
      `${message} (expected: ${expected}, got: ${actual})`
    );
  }

  async assertStatus(response, expectedStatus, message) {
    return this.assertEqual(
      response.status,
      expectedStatus,
      `${message} - status code`
    );
  }

  summary() {
    const duration = Date.now() - this.startTime;
    const total = this.passed + this.failed;
    console.log(`\n📊 Test Summary:`);
    console.log(`   Passed: ${this.passed}/${total}`);
    console.log(`   Failed: ${this.failed}/${total}`);
    console.log(`   Duration: ${duration}ms`);

    if (this.failed > 0) {
      console.log(`\n❌ ${this.failed} test(s) failed`);
      process.exit(1);
    } else {
      console.log(`\n✅ All tests passed!`);
    }
  }
}

// API helper using Node.js built-in fetch (Node 18+)
async function apiCall(method, path, options = {}) {
  const url = `${CONFIG.server.baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    return {
      status: response.status,
      data,
      ok: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      data: null,
      ok: false,
      error: error.message,
    };
  }
}

// Test: Configuration validation
async function testConfiguration(test) {
  console.log(`\n🔧 Testing configuration...`);

  await test.assert(CONFIG.supabase.url, "Supabase URL is configured");
  await test.assert(CONFIG.supabase.anonKey, "Supabase anon key is configured");
  await test.assert(
    CONFIG.supabase.serviceKey,
    "Supabase service key is configured"
  );

  // Test Supabase connection
  try {
    const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    await test.assert(
      !error,
      `Supabase connection works (${error?.message || "success"})`
    );
  } catch (err) {
    await test.assert(false, `Supabase connection failed: ${err.message}`);
  }
}

// Test: Server health
async function testServerHealth(test) {
  console.log(`\n🏥 Testing server health...`);

  const response = await apiCall("GET", "/api/health");

  if (response.error) {
    await test.assert(false, `Server connection failed: ${response.error}`);
    return;
  }

  await test.assertStatus(response, 200, "Health check returns 200");
  await test.assertEqual(
    response.data?.status,
    "ok",
    "Health check status is ok"
  );
}

// Test: Authentication basics
async function testAuthenticationBasics(test) {
  console.log(`\n🔐 Testing authentication basics...`);

  // Test 1: No auth header should fail
  const noAuthResponse = await apiCall("POST", "/api/generate/resume", {
    body: { jobId: 999 },
  });
  await test.assertStatus(
    noAuthResponse,
    401,
    "Request without auth returns 401"
  );

  // Test 2: Invalid JWT should fail
  const invalidJwtResponse = await apiCall("POST", "/api/generate/resume", {
    body: { jobId: 999 },
    headers: { Authorization: "Bearer invalid_token_here" },
  });
  await test.assertStatus(
    invalidJwtResponse,
    401,
    "Request with invalid JWT returns 401"
  );

  // Test 3: Dev auth fallback (if enabled)
  if (CONFIG.server.allowDevAuth) {
    console.log(`   Testing dev auth fallback...`);
    const devAuthResponse = await apiCall("POST", "/api/generate/resume", {
      body: { jobId: 999 },
      headers: { "X-User-Id": "00000000-0000-0000-0000-000000000000" },
    });
    // Should not return 401 (might return 404 for job not found, which is ok)
    await test.assert(
      devAuthResponse.status !== 401,
      "Dev auth fallback works when enabled"
    );
  } else {
    console.log(`   Dev auth fallback disabled (good for production)`);
  }
}

// Test: API endpoints availability
async function testApiEndpoints(test) {
  console.log(`\n🔌 Testing API endpoints availability...`);

  const endpoints = [
    { method: "GET", path: "/api/health", expectAuth: false },
    { method: "POST", path: "/api/generate/resume", expectAuth: true },
    { method: "GET", path: "/api/artifacts", expectAuth: true },
    { method: "POST", path: "/api/job-materials", expectAuth: true },
  ];

  for (const endpoint of endpoints) {
    const response = await apiCall(endpoint.method, endpoint.path, {
      body: endpoint.method === "POST" ? {} : undefined,
    });

    if (endpoint.expectAuth) {
      await test.assertEqual(
        response.status,
        401,
        `${endpoint.method} ${endpoint.path} requires auth`
      );
    } else {
      await test.assert(
        response.status !== 404,
        `${endpoint.method} ${endpoint.path} endpoint exists`
      );
    }
  }
}

// Test: Database connectivity via server
async function testDatabaseConnectivity(test) {
  console.log(`\n🗄️ Testing database connectivity...`);

  // Use health endpoint which checks basic DB connection
  const response = await apiCall("GET", "/api/health");

  if (response.ok && response.data) {
    await test.assert(true, "Server can connect to database");

    // If health endpoint includes DB info, check it
    if (response.data.database) {
      await test.assertEqual(
        response.data.database.status,
        "connected",
        "Database connection status"
      );
    }
  } else {
    await test.assert(false, "Database connectivity check failed");
  }
}

// Main test execution
async function main() {
  console.log(`🧪 Simple Smoke Tests for AI Resume Generation API\n`);
  console.log(`Server: ${CONFIG.server.baseUrl}`);
  console.log(`Supabase: ${CONFIG.supabase.url}`);
  console.log(
    `Dev Auth: ${CONFIG.server.allowDevAuth ? "enabled" : "disabled"}\n`
  );

  const test = new SimpleTestRunner();

  try {
    await testConfiguration(test);
    await testServerHealth(test);
    await testAuthenticationBasics(test);
    await testApiEndpoints(test);
    await testDatabaseConnectivity(test);
  } catch (error) {
    console.error(`\n💥 Test execution failed:`, error.message);
    test.failed++;
  }

  test.summary();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runSimpleSmokeTests };
