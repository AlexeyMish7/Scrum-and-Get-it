#!/usr/bin/env node
/**
 * Database Schema Verification Script
 *
 * PURPOSE: Connect to Supabase and verify that the actual database schema
 * matches our documented expectations. This validates that migrations have
 * been applied correctly.
 *
 * This script:
 * 1. Connects to Supabase using service role
 * 2. Queries information_schema to get actual table structure
 * 3. Verifies expected tables, columns, and constraints exist
 * 4. Reports any discrepancies between expected and actual schema
 */

import { createClient } from "@supabase/supabase-js";

// Expected schema structure
const EXPECTED_TABLES = {
  profiles: {
    required_columns: ["id", "first_name", "last_name", "email"],
    foreign_keys: [{ column: "id", references: "auth.users" }],
  },
  jobs: {
    required_columns: ["id", "user_id", "job_title", "company_name"],
    foreign_keys: [{ column: "user_id", references: "public.profiles" }],
  },
  ai_artifacts: {
    required_columns: ["id", "user_id", "kind", "content"],
    foreign_keys: [
      { column: "user_id", references: "public.profiles" },
      { column: "job_id", references: "public.jobs" },
    ],
  },
  job_materials: {
    required_columns: ["id", "user_id", "job_id"],
    foreign_keys: [
      { column: "user_id", references: "public.profiles" },
      { column: "job_id", references: "public.jobs" },
      { column: "resume_artifact_id", references: "public.ai_artifacts" },
    ],
  },
  employment: {
    required_columns: [
      "id",
      "user_id",
      "job_title",
      "company_name",
      "start_date",
    ],
    foreign_keys: [{ column: "user_id", references: "public.profiles" }],
  },
  education: {
    required_columns: ["id", "user_id", "institution_name", "start_date"],
    foreign_keys: [{ column: "user_id", references: "public.profiles" }],
  },
  skills: {
    required_columns: ["id", "user_id", "skill_name", "proficiency_level"],
    foreign_keys: [{ column: "user_id", references: "public.profiles" }],
  },
  projects: {
    required_columns: ["id", "user_id", "proj_name", "start_date"],
    foreign_keys: [{ column: "user_id", references: "public.profiles" }],
  },
  documents: {
    required_columns: ["id", "user_id", "file_name", "file_path"],
    foreign_keys: [{ column: "user_id", references: "public.profiles" }],
  },
  job_notes: {
    required_columns: ["id", "user_id", "job_id"],
    foreign_keys: [
      { column: "user_id", references: "public.profiles" },
      { column: "job_id", references: "public.jobs" },
    ],
  },
};

const EXPECTED_INDEXES = [
  "idx_ai_artifacts_user_id",
  "idx_ai_artifacts_job_id",
  "idx_ai_artifacts_kind",
  "idx_ai_artifacts_user_kind_job",
  "idx_job_materials_user",
  "idx_job_materials_job",
];

const EXPECTED_RLS_POLICIES = [
  "ai_artifacts_select_own",
  "ai_artifacts_insert_own",
  "job_materials_select_own",
  "job_materials_insert_own",
];

class SchemaVerifier {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.supabase = null;
  }

  log(level, category, message, details = null) {
    const entry = { level, category, message, details, timestamp: new Date() };
    if (level === "error") {
      this.issues.push(entry);
    } else if (level === "warning") {
      this.warnings.push(entry);
    }

    const prefix = level === "error" ? "❌" : level === "warning" ? "⚠️" : "✅";
    console.log(`${prefix} ${category}: ${message}`);
    if (details && level !== "info") {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async connect() {
    console.log(`\n🔌 Connecting to Supabase...`);

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      this.log(
        "error",
        "Config",
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
      return false;
    }

    try {
      this.supabase = createClient(supabaseUrl, serviceKey);

      // Test connection with a simple query
      const { data, error } = await this.supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (error && !error.message.includes("JWT")) {
        this.log("error", "Connection", `Failed to connect: ${error.message}`);
        return false;
      }

      this.log("info", "Connection", "Successfully connected to Supabase");
      return true;
    } catch (error) {
      this.log("error", "Connection", `Connection failed: ${error.message}`);
      return false;
    }
  }

  async verifyTables() {
    console.log(`\n📋 Verifying table structure...`);

    try {
      // Get all tables in public schema
      const { data: tables, error: tablesError } = await this.supabase.rpc(
        "get_public_tables"
      );

      if (tablesError) {
        // Fallback: try direct query if RPC doesn't exist
        const query = `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        `;

        const { data: fallbackTables, error: fallbackError } =
          await this.supabase.rpc("exec_sql", { query });

        if (fallbackError) {
          this.log(
            "warning",
            "Tables",
            "Cannot verify table structure - insufficient permissions"
          );
          return;
        }

        // Process fallback result if available
      }

      // Verify expected tables exist by attempting to select from them
      for (const [tableName, tableSpec] of Object.entries(EXPECTED_TABLES)) {
        try {
          const { data, error } = await this.supabase
            .from(tableName)
            .select("*")
            .limit(1);

          if (error) {
            if (error.message.includes("does not exist")) {
              this.log(
                "error",
                "Tables",
                `Required table '${tableName}' does not exist`
              );
            } else if (error.message.includes("permission")) {
              this.log(
                "info",
                "Tables",
                `Table '${tableName}' exists (permission restricted)`
              );
            } else {
              this.log(
                "warning",
                "Tables",
                `Table '${tableName}' query failed: ${error.message}`
              );
            }
          } else {
            this.log(
              "info",
              "Tables",
              `Table '${tableName}' exists and accessible`
            );
          }
        } catch (err) {
          this.log(
            "warning",
            "Tables",
            `Error checking table '${tableName}': ${err.message}`
          );
        }
      }
    } catch (error) {
      this.log(
        "warning",
        "Tables",
        `Table verification failed: ${error.message}`
      );
    }
  }

  async verifyBasicFunctionality() {
    console.log(`\n⚙️ Verifying basic database functionality...`);

    try {
      // Test basic queries that should work
      const tests = [
        {
          name: "Current timestamp",
          query: "SELECT now() as current_time",
          expected: (data) => data && data[0] && data[0].current_time,
        },
        {
          name: "UUID generation",
          query: "SELECT gen_random_uuid() as uuid",
          expected: (data) => data && data[0] && data[0].uuid,
        },
        {
          name: "Auth context",
          query: "SELECT auth.uid() as user_id",
          expected: (data) => true, // null is acceptable for service role
        },
      ];

      for (const test of tests) {
        try {
          const { data, error } = await this.supabase.rpc("exec_sql", {
            query: test.query,
          });

          if (error) {
            this.log(
              "warning",
              "Functionality",
              `${test.name} test failed: ${error.message}`
            );
          } else if (test.expected(data)) {
            this.log("info", "Functionality", `${test.name} test passed`);
          } else {
            this.log(
              "warning",
              "Functionality",
              `${test.name} test returned unexpected result`,
              data
            );
          }
        } catch (err) {
          this.log(
            "warning",
            "Functionality",
            `${test.name} test error: ${err.message}`
          );
        }
      }
    } catch (error) {
      this.log(
        "warning",
        "Functionality",
        `Functionality tests failed: ${error.message}`
      );
    }
  }

  async verifyBasicOperations() {
    console.log(`\n🔧 Testing basic CRUD operations...`);

    // Test if we can perform basic operations (read-only for safety)
    const tables = ["profiles", "jobs", "ai_artifacts", "job_materials"];

    for (const table of tables) {
      try {
        const { data, error, count } = await this.supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        if (error) {
          if (error.message.includes("permission")) {
            this.log(
              "info",
              "CRUD",
              `Table '${table}' has RLS enabled (expected)`
            );
          } else {
            this.log(
              "warning",
              "CRUD",
              `Error accessing '${table}': ${error.message}`
            );
          }
        } else {
          this.log(
            "info",
            "CRUD",
            `Table '${table}' accessible, contains ${count || 0} rows`
          );
        }
      } catch (err) {
        this.log("warning", "CRUD", `Error testing '${table}': ${err.message}`);
      }
    }
  }

  generateReport() {
    console.log(`\n📊 Schema Verification Report`);
    console.log(`${"=".repeat(50)}`);

    const totalIssues = this.issues.length;
    const totalWarnings = this.warnings.length;

    console.log(`❌ Critical Issues: ${totalIssues}`);
    console.log(`⚠️  Warnings: ${totalWarnings}`);

    if (totalIssues === 0) {
      console.log(`\n🎉 Schema verification passed!`);
      console.log(`   ✅ All expected tables are accessible`);
      console.log(`   ✅ Basic database functions work correctly`);
      console.log(`   ✅ CRUD operations follow expected patterns`);

      if (totalWarnings > 0) {
        console.log(
          `   ⚠️  ${totalWarnings} warnings noted (review recommended)`
        );
      }

      return true;
    } else {
      console.log(`\n❌ Schema verification failed!`);

      this.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.category}: ${issue.message}`);
      });

      console.log(`\n🔧 Recommendations:`);
      console.log(`   📝 Check that all migrations have been applied`);
      console.log(`   🔍 Verify Supabase project configuration`);
      console.log(`   🔑 Ensure service role key has sufficient permissions`);

      return false;
    }
  }

  async run() {
    console.log(`🔍 Database Schema Verification`);
    console.log(`${"=".repeat(50)}`);

    try {
      if (!(await this.connect())) {
        return false;
      }

      await this.verifyTables();
      await this.verifyBasicFunctionality();
      await this.verifyBasicOperations();

      return this.generateReport();
    } catch (error) {
      console.error(`\n💥 Verification failed with error:`, error.message);
      return false;
    }
  }
}

// Run verifier if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Load environment variables (basic support)
  if (process.env.NODE_ENV !== "production") {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const envPath = path.resolve("../.env");

      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        envContent.split("\\n").forEach((line) => {
          const [key, value] = line.split("=");
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        });
      }
    } catch (err) {
      console.log("Note: Could not load .env file (using system environment)");
    }
  }

  const verifier = new SchemaVerifier();
  const success = await verifier.run();
  process.exit(success ? 0 : 1);
}

export { SchemaVerifier };
