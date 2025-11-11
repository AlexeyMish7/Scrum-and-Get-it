/**
 * Smoke Tests for AI Resume Generation API
 *
 * PURPOSE: Validate end-to-end functionality after auth security fix.
 * SCOPE: Test critical paths with mocked AI responses for deterministic results.
 *
 * Test scenarios:
 * 1. Health check endpoint
 * 2. Auth validation (both JWT and fallback modes)
 * 3. Resume generation with mock AI
 * 4. Artifact persistence verification
 * 5. Job materials linking
 * 6. Cross-user access prevention (RLS)
 */

import { createClient } from "@supabase/supabase-js";

// Test configuration
const CONFIG = {
  server: {
    baseUrl: process.env.TEST_SERVER_URL || "http://localhost:8787",
    allowDevAuth: process.env.ALLOW_DEV_AUTH === "true",
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  },
  test: {
    timeoutMs: 10000,
    retries: 3,
  },
};

// Test users for multi-user scenarios
const TEST_USERS = {
  alice: {
    email: "alice.test@example.com",
    password: "test123456",
    id: "", // Will be populated after signup
    token: "", // Will be populated after login
  },
  bob: {
    email: "bob.test@example.com",
    password: "test123456",
    id: "",
    token: "",
  },
};

// Create Supabase clients
const supabaseAdmin = createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.serviceKey
);
const supabaseClient = createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);

/**
 * Test utilities
 */
class TestRunner {
  passed: number;
  failed: number;
  startTime: number;

  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  async assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ ${message}`);
      this.passed++;
    } else {
      console.error(`❌ ${message}`);
      this.failed++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  async assertEqual(actual: any, expected: any, message: string) {
    await this.assert(
      actual === expected,
      `${message} (expected: ${expected}, got: ${actual})`
    );
  }

  async assertNotNull(value: any, message: string) {
    await this.assert(value != null, `${message} (value was null/undefined)`);
  }

  async assertStatus(response: any, expectedStatus: number, message: string) {
    await this.assertEqual(
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

/**
 * API call helpers
 */
async function apiCall(
  method: string,
  path: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    expectedStatus?: number;
  } = {}
) {
  const url = `${CONFIG.server.baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Ignore JSON parse errors
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
    ok: response.ok,
  };
}

/**
 * Setup test users and authentication
 */
async function setupTestUsers(test: TestRunner) {
  console.log(`\n🔧 Setting up test users...`);

  for (const [name, user] of Object.entries(TEST_USERS)) {
    // Try to sign up (will fail if user exists, which is fine)
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: user.email,
        password: user.password,
      });

      if (data.user) {
        user.id = data.user.id;
        console.log(`   Created user ${name}: ${user.id}`);
      }
    } catch (err) {
      // User probably already exists
    }

    // Sign in to get session token
    const { data: signInData, error: signInError } =
      await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

    if (signInError) {
      console.error(`   Failed to sign in ${name}:`, signInError.message);
      continue;
    }

    user.id = signInData.user!.id;
    user.token = signInData.session!.access_token;
    console.log(`   Signed in user ${name}: ${user.id}`);

    // Create/update profile
    await supabaseClient.from("profiles").upsert({
      id: user.id,
      first_name: name.charAt(0).toUpperCase() + name.slice(1),
      last_name: "Test",
      email: user.email,
      full_name: `${name.charAt(0).toUpperCase() + name.slice(1)} Test`,
    });

    // Add sample skills
    await supabaseClient.from("skills").upsert([
      {
        user_id: user.id,
        skill_name: "JavaScript",
        proficiency_level: "expert",
        skill_category: "Technical",
      },
      {
        user_id: user.id,
        skill_name: "React",
        proficiency_level: "advanced",
        skill_category: "Technical",
      },
    ]);

    // Add sample employment
    await supabaseClient.from("employment").upsert({
      user_id: user.id,
      job_title: "Software Engineer",
      company_name: "Test Company",
      location: "Remote",
      start_date: "2023-01-01",
      current_position: true,
      job_description: "Building awesome software with modern technologies.",
    });

    // Add sample job
    const { data: jobData } = await supabaseClient
      .from("jobs")
      .upsert({
        user_id: user.id,
        job_title: "Senior Developer",
        company_name: "Target Company",
        job_description:
          "Looking for an experienced developer to join our team.",
        job_status: "interested",
      })
      .select("id")
      .single();

    if (jobData) {
      (user as any).testJobId = jobData.id;
      console.log(`   Created test job for ${name}: ${jobData.id}`);
    }
  }

  await test.assertNotNull(
    TEST_USERS.alice.token,
    "Alice has valid session token"
  );
  await test.assertNotNull(TEST_USERS.bob.token, "Bob has valid session token");
}

/**
 * Test: Health Check
 */
async function testHealthCheck(test: TestRunner) {
  console.log(`\n🏥 Testing health check...`);

  const response = await apiCall("GET", "/api/health");
  await test.assertStatus(response, 200, "Health check returns 200");
  await test.assertNotNull(
    response.data?.status,
    "Health check has status field"
  );
  await test.assertEqual(
    response.data?.status,
    "ok",
    "Health check status is ok"
  );
}

/**
 * Test: Authentication (JWT and fallback)
 */
async function testAuthentication(test: TestRunner) {
  console.log(`\n🔐 Testing authentication...`);

  // Test 1: No auth header should fail
  const noAuthResponse = await apiCall("POST", "/api/generate/resume", {
    body: { jobId: 1 },
  });
  await test.assertStatus(
    noAuthResponse,
    401,
    "Request without auth returns 401"
  );

  // Test 2: Invalid JWT should fail
  const invalidJwtResponse = await apiCall("POST", "/api/generate/resume", {
    body: { jobId: 1 },
    headers: { Authorization: "Bearer invalid_token_here" },
  });
  await test.assertStatus(
    invalidJwtResponse,
    401,
    "Request with invalid JWT returns 401"
  );

  // Test 3: Valid JWT should work (if user has test job)
  if (TEST_USERS.alice.token && (TEST_USERS.alice as any).testJobId) {
    const validJwtResponse = await apiCall("POST", "/api/generate/resume", {
      body: { jobId: (TEST_USERS.alice as any).testJobId },
      headers: { Authorization: `Bearer ${TEST_USERS.alice.token}` },
    });
    // Should not return 401 (might return other errors like job not found, which is ok)
    await test.assert(
      validJwtResponse.status !== 401,
      "Valid JWT does not return 401"
    );
  }

  // Test 4: Dev auth fallback (if enabled)
  if (CONFIG.server.allowDevAuth) {
    console.log(`   Testing dev auth fallback...`);
    const devAuthResponse = await apiCall("POST", "/api/generate/resume", {
      body: { jobId: (TEST_USERS.alice as any).testJobId || 999 },
      headers: { "X-User-Id": TEST_USERS.alice.id },
    });
    await test.assert(
      devAuthResponse.status !== 401,
      "Dev auth fallback works when enabled"
    );
  }
}

/**
 * Test: Resume Generation (Mock Mode)
 */
async function testResumeGeneration(test: TestRunner) {
  console.log(`\n📄 Testing resume generation...`);

  const jobId = (TEST_USERS.alice as any).testJobId;
  if (!jobId) {
    console.log(`   Skipping - no test job available`);
    return;
  }

  const response = await apiCall("POST", "/api/generate/resume", {
    body: {
      jobId,
      options: { tone: "professional", focus: "technical" },
    },
    headers: { Authorization: `Bearer ${TEST_USERS.alice.token}` },
  });

  // Should succeed (200 or 201)
  await test.assert(
    [200, 201].includes(response.status),
    `Resume generation succeeds (got ${response.status})`
  );

  if (response.ok) {
    await test.assertNotNull(response.data?.id, "Response has artifact ID");
    await test.assertNotNull(response.data?.kind, "Response has artifact kind");
    await test.assertEqual(
      response.data?.kind,
      "resume",
      "Artifact kind is resume"
    );
    await test.assertNotNull(response.data?.content, "Response has content");

    // Store artifact ID for later tests
    (TEST_USERS.alice as any).testArtifactId = response.data.id;
    console.log(`   Generated artifact: ${response.data.id}`);
  }
}

/**
 * Test: Artifact Retrieval
 */
async function testArtifactRetrieval(test: TestRunner) {
  console.log(`\n📋 Testing artifact retrieval...`);

  const artifactId = (TEST_USERS.alice as any).testArtifactId;
  if (!artifactId) {
    console.log(`   Skipping - no test artifact available`);
    return;
  }

  // Test listing artifacts
  const listResponse = await apiCall(
    "GET",
    "/api/artifacts?kind=resume&limit=5",
    {
      headers: { Authorization: `Bearer ${TEST_USERS.alice.token}` },
    }
  );
  await test.assertStatus(listResponse, 200, "Artifact listing succeeds");
  await test.assertNotNull(
    listResponse.data?.items,
    "List response has items array"
  );

  // Test getting specific artifact
  const getResponse = await apiCall("GET", `/api/artifacts/${artifactId}`, {
    headers: { Authorization: `Bearer ${TEST_USERS.alice.token}` },
  });
  await test.assertStatus(getResponse, 200, "Artifact retrieval succeeds");
  await test.assertNotNull(
    getResponse.data?.artifact,
    "Get response has artifact"
  );
  await test.assertEqual(
    getResponse.data?.artifact?.id,
    artifactId,
    "Retrieved artifact has correct ID"
  );
}

/**
 * Test: Job Materials Linking
 */
async function testJobMaterialsLinking(test: TestRunner) {
  console.log(`\n🔗 Testing job materials linking...`);

  const jobId = (TEST_USERS.alice as any).testJobId;
  const artifactId = (TEST_USERS.alice as any).testArtifactId;

  if (!jobId || !artifactId) {
    console.log(`   Skipping - missing test job or artifact`);
    return;
  }

  // Test linking artifact to job
  const linkResponse = await apiCall("POST", "/api/job-materials", {
    body: {
      jobId,
      resume_artifact_id: artifactId,
      metadata: { test: true },
    },
    headers: { Authorization: `Bearer ${TEST_USERS.alice.token}` },
  });
  await test.assertStatus(linkResponse, 201, "Job materials linking succeeds");
  await test.assertNotNull(
    linkResponse.data?.material,
    "Link response has material"
  );

  // Test listing job materials
  const listResponse = await apiCall(
    "GET",
    `/api/jobs/${jobId}/materials?limit=5`,
    {
      headers: { Authorization: `Bearer ${TEST_USERS.alice.token}` },
    }
  );
  await test.assertStatus(listResponse, 200, "Job materials listing succeeds");
  await test.assertNotNull(
    listResponse.data?.items,
    "Materials list has items array"
  );
}

/**
 * Test: Cross-User Access Prevention (RLS)
 */
async function testCrossUserAccess(test: TestRunner) {
  console.log(`\n🛡️ Testing cross-user access prevention...`);

  const aliceArtifactId = (TEST_USERS.alice as any).testArtifactId;
  if (!aliceArtifactId) {
    console.log(`   Skipping - no Alice artifact to test with`);
    return;
  }

  // Bob should not be able to access Alice's artifact
  const bobAccessResponse = await apiCall(
    "GET",
    `/api/artifacts/${aliceArtifactId}`,
    {
      headers: { Authorization: `Bearer ${TEST_USERS.bob.token}` },
    }
  );
  await test.assert(
    [403, 404].includes(bobAccessResponse.status),
    `Bob cannot access Alice's artifact (got ${bobAccessResponse.status})`
  );

  // Bob should not be able to link Alice's artifact to his jobs
  const bobJobId = (TEST_USERS.bob as any).testJobId;
  if (bobJobId) {
    const bobLinkResponse = await apiCall("POST", "/api/job-materials", {
      body: {
        jobId: bobJobId,
        resume_artifact_id: aliceArtifactId,
      },
      headers: { Authorization: `Bearer ${TEST_USERS.bob.token}` },
    });
    await test.assert(
      [403, 404].includes(bobLinkResponse.status),
      `Bob cannot link Alice's artifact (got ${bobLinkResponse.status})`
    );
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log(`\n🧹 Cleaning up test data...`);

  for (const [name, user] of Object.entries(TEST_USERS)) {
    if (!user.id) continue;

    try {
      // Delete in reverse FK order to avoid constraint violations
      await supabaseAdmin.from("job_materials").delete().eq("user_id", user.id);
      await supabaseAdmin.from("ai_artifacts").delete().eq("user_id", user.id);
      await supabaseAdmin.from("jobs").delete().eq("user_id", user.id);
      await supabaseAdmin.from("employment").delete().eq("user_id", user.id);
      await supabaseAdmin.from("skills").delete().eq("user_id", user.id);
      await supabaseAdmin.from("profiles").delete().eq("id", user.id);

      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(user.id);

      console.log(`   Cleaned up user ${name}`);
    } catch (err: any) {
      console.warn(`   Cleanup warning for ${name}:`, err.message);
    }
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log(`🧪 Starting API Smoke Tests\n`);
  console.log(`Server: ${CONFIG.server.baseUrl}`);
  console.log(`Supabase: ${CONFIG.supabase.url}`);
  console.log(
    `Dev Auth: ${CONFIG.server.allowDevAuth ? "enabled" : "disabled"}\n`
  );

  const test = new TestRunner();

  try {
    // Validate configuration
    if (!CONFIG.supabase.url || !CONFIG.supabase.serviceKey) {
      throw new Error(
        "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    // Run test suite
    await setupTestUsers(test);
    await testHealthCheck(test);
    await testAuthentication(test);
    await testResumeGeneration(test);
    await testArtifactRetrieval(test);
    await testJobMaterialsLinking(test);
    await testCrossUserAccess(test);
  } catch (error: any) {
    console.error(`\n💥 Test failed with error:`, error.message);
    test.failed++;
  } finally {
    await cleanup();
    test.summary();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runSmokeTests };
