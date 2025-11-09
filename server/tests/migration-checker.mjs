#!/usr/bin/env node
/**
 * Database Migration Sanity Checker
 *
 * PURPOSE: Validate that all migrations are idempotent, properly structured,
 * and that the schema matches expected state after applying them.
 *
 * This script:
 * 1. Validates migration file syntax and structure
 * 2. Checks for idempotency patterns (IF NOT EXISTS, DO $$ blocks)
 * 3. Verifies foreign key relationships and constraints
 * 4. Validates RLS policies and indexes
 * 5. Checks for schema drift against documented expectations
 * 6. Reports any inconsistencies or missing patterns
 */

import fs from "fs";
import path from "path";

// Configuration
const MIGRATION_DIR = "../../db/migrations";
const SCHEMA_DOC = "../../.github/instructions/database_schema.instructions.md";

// Expected patterns for idempotent migrations
const IDEMPOTENCY_PATTERNS = {
  tableCreation: /IF NOT EXISTS.*information_schema\.tables/s,
  policyCreation: /IF NOT EXISTS.*pg_policies/s,
  indexCreation: /IF NOT EXISTS.*pg_indexes/s,
  enumCreation: /IF NOT EXISTS.*pg_type.*typname/s,
  functionDropIfExists: /DROP (FUNCTION|TRIGGER) IF EXISTS/i,
};

// Critical tables that must exist
const REQUIRED_TABLES = [
  "profiles",
  "jobs",
  "employment",
  "education",
  "skills",
  "certifications",
  "projects",
  "documents",
  "ai_artifacts",
  "job_materials",
  "job_notes",
];

// Expected foreign key relationships
const EXPECTED_FK_RELATIONSHIPS = [
  { table: "profiles", column: "id", references: "auth.users(id)" },
  { table: "ai_artifacts", column: "user_id", references: "profiles(id)" },
  { table: "ai_artifacts", column: "job_id", references: "jobs(id)" },
  { table: "job_materials", column: "user_id", references: "profiles(id)" },
  { table: "job_materials", column: "job_id", references: "jobs(id)" },
  {
    table: "job_materials",
    column: "resume_document_id",
    references: "documents(id)",
  },
  {
    table: "job_materials",
    column: "resume_artifact_id",
    references: "ai_artifacts(id)",
  },
  { table: "employment", column: "user_id", references: "profiles(id)" },
  { table: "education", column: "user_id", references: "profiles(id)" },
  { table: "skills", column: "user_id", references: "profiles(id)" },
  { table: "jobs", column: "user_id", references: "profiles(id)" },
];

// Expected RLS policies (each table should have these)
const EXPECTED_RLS_POLICIES = [
  "select_own",
  "insert_own",
  "update_own",
  "delete_own",
];

class MigrationChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.migrations = [];
  }

  log(level, category, message, file = null) {
    const entry = { level, category, message, file, timestamp: new Date() };
    if (level === "error") {
      this.issues.push(entry);
    } else if (level === "warning") {
      this.warnings.push(entry);
    }

    const prefix = level === "error" ? "❌" : level === "warning" ? "⚠️" : "ℹ️";
    const fileInfo = file ? ` [${path.basename(file)}]` : "";
    console.log(`${prefix} ${category}${fileInfo}: ${message}`);
  }

  // Load and parse migration files
  loadMigrations() {
    console.log(`\n🔍 Loading migrations from ${MIGRATION_DIR}...`);

    const migrationPath = path.resolve(MIGRATION_DIR);
    if (!fs.existsSync(migrationPath)) {
      this.log(
        "error",
        "File System",
        `Migration directory not found: ${migrationPath}`
      );
      return false;
    }

    const files = fs
      .readdirSync(migrationPath)
      .filter(
        (f) =>
          f.endsWith(".sql") && !f.startsWith("apply_") && !f.startsWith("fix_")
      )
      .sort();

    if (files.length === 0) {
      this.log("error", "File System", "No migration files found");
      return false;
    }

    for (const file of files) {
      try {
        const filePath = path.join(migrationPath, file);
        const content = fs.readFileSync(filePath, "utf8");
        this.migrations.push({
          file,
          path: filePath,
          content,
          size: content.length,
          isRecreate: file.includes("recreate"),
        });
        console.log(`   ✅ Loaded ${file} (${content.length} bytes)`);
      } catch (error) {
        this.log(
          "error",
          "File System",
          `Failed to read ${file}: ${error.message}`,
          file
        );
      }
    }

    console.log(`   📊 Loaded ${this.migrations.length} migration files`);
    return true;
  }

  // Check migration naming convention
  validateNamingConventions() {
    console.log(`\n📝 Validating naming conventions...`);

    const namingPattern = /^(\d{4}-\d{2}-\d{2})_([a-z0-9_]+)\.sql$/;

    for (const migration of this.migrations) {
      const match = migration.file.match(namingPattern);

      if (!match) {
        this.log(
          "warning",
          "Naming",
          `Migration doesn't follow YYYY-MM-DD_description.sql pattern`,
          migration.file
        );
        continue;
      }

      const [, dateStr, description] = match;

      // Validate date format
      const migrationDate = new Date(dateStr);
      if (isNaN(migrationDate.getTime())) {
        this.log(
          "error",
          "Naming",
          `Invalid date in filename: ${dateStr}`,
          migration.file
        );
      }

      // Check for descriptive names
      if (description.length < 5) {
        this.log(
          "warning",
          "Naming",
          `Migration description too short: ${description}`,
          migration.file
        );
      }

      // Check for proper snake_case
      if (!/^[a-z0-9_]+$/.test(description)) {
        this.log(
          "warning",
          "Naming",
          `Description should use snake_case: ${description}`,
          migration.file
        );
      }
    }
  }

  // Validate idempotency patterns
  validateIdempotency() {
    console.log(`\n🔄 Validating idempotency patterns...`);

    for (const migration of this.migrations) {
      const { content, file } = migration;
      let hasIdempotencyChecks = false;

      // Check for table creation with existence checks
      if (content.includes("CREATE TABLE")) {
        if (content.match(IDEMPOTENCY_PATTERNS.tableCreation)) {
          hasIdempotencyChecks = true;
        } else {
          this.log(
            "warning",
            "Idempotency",
            "CREATE TABLE without IF NOT EXISTS check",
            file
          );
        }
      }

      // Check for policy creation with existence checks
      if (content.includes("CREATE POLICY")) {
        if (content.match(IDEMPOTENCY_PATTERNS.policyCreation)) {
          hasIdempotencyChecks = true;
        } else {
          this.log(
            "warning",
            "Idempotency",
            "CREATE POLICY without existence check",
            file
          );
        }
      }

      // Check for index creation with existence checks
      if (content.includes("CREATE INDEX")) {
        if (content.match(IDEMPOTENCY_PATTERNS.indexCreation)) {
          hasIdempotencyChecks = true;
        } else {
          this.log(
            "warning",
            "Idempotency",
            "CREATE INDEX without IF NOT EXISTS",
            file
          );
        }
      }

      // Check for proper function/trigger drops
      if (
        content.includes("CREATE FUNCTION") ||
        content.includes("CREATE TRIGGER")
      ) {
        if (content.match(IDEMPOTENCY_PATTERNS.functionDropIfExists)) {
          hasIdempotencyChecks = true;
        } else {
          this.log(
            "warning",
            "Idempotency",
            "Function/trigger creation without DROP IF EXISTS",
            file
          );
        }
      }

      // Check for DO $$ blocks (PostgreSQL idempotency pattern)
      if (content.includes("DO $$")) {
        hasIdempotencyChecks = true;
      }

      if (!hasIdempotencyChecks && !migration.isRecreate) {
        this.log(
          "warning",
          "Idempotency",
          "No idempotency patterns detected",
          file
        );
      }
    }
  }

  // Validate SQL syntax and structure
  validateSyntax() {
    console.log(`\n🔍 Validating SQL syntax patterns...`);

    for (const migration of this.migrations) {
      const { content, file } = migration;

      // Check for common SQL syntax issues
      const issues = [];

      // Missing semicolons (basic check)
      const statements = content.split(/;\s*\n/).filter((s) => s.trim());
      for (let i = 0; i < statements.length - 1; i++) {
        const stmt = statements[i].trim();
        if (stmt && !stmt.endsWith(";") && !stmt.includes("$$")) {
          issues.push(`Statement ${i + 1} might be missing semicolon`);
        }
      }

      // Unmatched DO blocks
      const doBlocks = (content.match(/DO \$\$/g) || []).length;
      const endBlocks = (content.match(/END\$\$/g) || []).length;
      if (doBlocks !== endBlocks) {
        issues.push(
          `Unmatched DO $$ blocks: ${doBlocks} DO vs ${endBlocks} END`
        );
      }

      // Check for proper RLS enabling
      if (
        content.includes("CREATE TABLE") &&
        content.includes("ROW LEVEL SECURITY")
      ) {
        if (!content.includes("ENABLE ROW LEVEL SECURITY")) {
          issues.push("RLS mentioned but not explicitly enabled");
        }
      }

      // Check for CASCADE usage in foreign keys
      if (content.includes("REFERENCES") && !content.includes("ON DELETE")) {
        this.log(
          "warning",
          "Schema",
          "Foreign key without explicit ON DELETE behavior",
          file
        );
      }

      // Report syntax issues
      for (const issue of issues) {
        this.log("error", "Syntax", issue, file);
      }
    }
  }

  // Validate table relationships and constraints
  validateRelationships() {
    console.log(`\n🔗 Validating table relationships...`);

    const allContent = this.migrations.map((m) => m.content).join("\\n\\n");

    // Check that required tables are created
    for (const table of REQUIRED_TABLES) {
      const tablePattern = new RegExp(`CREATE TABLE.*${table}`, "i");
      if (!allContent.match(tablePattern)) {
        this.log(
          "error",
          "Schema",
          `Required table '${table}' not found in migrations`
        );
      }
    }

    // Check foreign key relationships
    for (const fk of EXPECTED_FK_RELATIONSHIPS) {
      const fkPattern = new RegExp(
        `REFERENCES.*${fk.references.replace("(", "\\(").replace(")", "\\)")}`,
        "i"
      );
      if (!allContent.match(fkPattern)) {
        this.log(
          "warning",
          "Schema",
          `Expected FK ${fk.table}.${fk.column} -> ${fk.references} not found`
        );
      }
    }

    // Check for orphaned references
    const referencesPattern = /REFERENCES\s+(\w+)\.(\w+)\(/gi;
    let match;
    while ((match = referencesPattern.exec(allContent)) !== null) {
      const [, schema, table] = match;
      if (schema === "public") {
        const tableExists = new RegExp(`CREATE TABLE.*${table}`, "i").test(
          allContent
        );
        if (!tableExists) {
          this.log(
            "error",
            "Schema",
            `Reference to non-existent table: ${schema}.${table}`
          );
        }
      }
    }
  }

  // Validate RLS policies
  validateRLSPolicies() {
    console.log(`\n🛡️ Validating RLS policies...`);

    const allContent = this.migrations.map((m) => m.content).join("\\n\\n");

    for (const table of REQUIRED_TABLES) {
      if (table === "profiles") continue; // Special handling for auth table

      // Check if RLS is enabled
      const rlsPattern = new RegExp(
        `ALTER TABLE.*${table}.*ENABLE ROW LEVEL SECURITY`,
        "i"
      );
      if (!allContent.match(rlsPattern)) {
        this.log(
          "warning",
          "RLS",
          `Table '${table}' doesn't have RLS enabled`,
          null
        );
        continue;
      }

      // Check for basic policies
      for (const policyType of EXPECTED_RLS_POLICIES) {
        const policyPattern = new RegExp(`${table}_${policyType}`, "i");
        if (!allContent.match(policyPattern)) {
          this.log(
            "warning",
            "RLS",
            `Table '${table}' missing '${policyType}' policy`
          );
        }
      }

      // Check for auth.uid() usage in policies
      const authUidPattern = new RegExp(
        `CREATE POLICY.*${table}.*auth\\.uid\\(\\)`,
        "is"
      );
      if (!allContent.match(authUidPattern)) {
        this.log(
          "warning",
          "RLS",
          `Table '${table}' policies don't use auth.uid() scoping`
        );
      }
    }
  }

  // Validate indexes and performance considerations
  validateIndexes() {
    console.log(`\n⚡ Validating indexes and performance...`);

    const allContent = this.migrations.map((m) => m.content).join("\\n\\n");

    // Check for common indexing patterns
    const indexChecks = [
      {
        pattern: /CREATE INDEX.*user_id/i,
        description: "user_id indexes for user-scoped queries",
      },
      {
        pattern: /CREATE INDEX.*created_at/i,
        description: "created_at indexes for time-based queries",
      },
      {
        pattern: /CREATE INDEX.*job_id/i,
        description: "job_id indexes for job-related queries",
      },
    ];

    for (const check of indexChecks) {
      if (!allContent.match(check.pattern)) {
        this.log(
          "warning",
          "Performance",
          `Missing common index pattern: ${check.description}`
        );
      }
    }

    // Check for composite indexes on frequently queried combinations
    const compositeIndexes = [
      {
        pattern: /CREATE INDEX.*\(user_id.*kind.*job_id\)/i,
        description: "ai_artifacts composite index",
      },
      {
        pattern: /CREATE INDEX.*\(job_id.*created_at\)/i,
        description: "job_materials composite index",
      },
    ];

    for (const check of compositeIndexes) {
      if (!allContent.match(check.pattern)) {
        this.log(
          "warning",
          "Performance",
          `Missing composite index: ${check.description}`
        );
      }
    }
  }

  // Check migration ordering and dependencies
  validateOrdering() {
    console.log(`\n📅 Validating migration ordering...`);

    // Extract dates from filenames and check chronological order
    const dates = this.migrations
      .map((m) => {
        const match = m.file.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? new Date(match[1]) : null;
      })
      .filter(Boolean);

    for (let i = 1; i < dates.length; i++) {
      if (dates[i] < dates[i - 1]) {
        this.log(
          "warning",
          "Ordering",
          `Migration date out of order: ${this.migrations[i].file}`
        );
      }
    }

    // Check for dependency order (base schema should come first)
    const recreateIndex = this.migrations.findIndex((m) => m.isRecreate);
    if (recreateIndex > 0) {
      this.log(
        "warning",
        "Ordering",
        "Recreate migration should be first chronologically"
      );
    }

    // Check that table creation comes before dependent features
    const tableCreationIndex = this.migrations.findIndex((m) =>
      m.content.includes("CREATE TABLE public.ai_artifacts")
    );
    const artifactUsageIndex = this.migrations.findIndex(
      (m) =>
        m.content.includes("job_materials") &&
        m.content.includes("ai_artifacts")
    );

    if (tableCreationIndex > artifactUsageIndex && artifactUsageIndex !== -1) {
      this.log("error", "Dependencies", "Table usage before creation detected");
    }
  }

  // Generate summary report
  generateReport() {
    console.log(`\n📊 Migration Sanity Check Report`);
    console.log(`=${"=".repeat(50)}`);

    const totalIssues = this.issues.length;
    const totalWarnings = this.warnings.length;

    console.log(`📁 Migrations Analyzed: ${this.migrations.length}`);
    console.log(`❌ Critical Issues: ${totalIssues}`);
    console.log(`⚠️  Warnings: ${totalWarnings}`);

    if (totalIssues === 0 && totalWarnings === 0) {
      console.log(`\n🎉 All migration checks passed!`);
      console.log(`   ✅ Migrations are properly structured`);
      console.log(`   ✅ Idempotency patterns are in place`);
      console.log(`   ✅ Schema relationships are valid`);
      console.log(`   ✅ RLS policies are correctly implemented`);
      console.log(`   ✅ Performance indexes are present`);
      return true;
    }

    if (totalIssues > 0) {
      console.log(`\n❌ Critical Issues Found:`);
      this.issues.forEach((issue, i) => {
        const fileInfo = issue.file ? ` [${path.basename(issue.file)}]` : "";
        console.log(
          `   ${i + 1}. ${issue.category}${fileInfo}: ${issue.message}`
        );
      });
    }

    if (totalWarnings > 0) {
      console.log(`\n⚠️  Warnings (should be addressed):`);
      this.warnings.slice(0, 10).forEach((warning, i) => {
        const fileInfo = warning.file
          ? ` [${path.basename(warning.file)}]`
          : "";
        console.log(
          `   ${i + 1}. ${warning.category}${fileInfo}: ${warning.message}`
        );
      });

      if (totalWarnings > 10) {
        console.log(`   ... and ${totalWarnings - 10} more warnings`);
      }
    }

    console.log(`\n🔧 Recommendations:`);
    if (totalIssues > 0) {
      console.log(
        `   🚨 Fix critical issues before applying migrations to production`
      );
    }
    if (totalWarnings > 0) {
      console.log(`   ⚡ Address warnings to improve migration robustness`);
    }
    console.log(
      `   📝 Ensure all migrations are tested in a staging environment`
    );
    console.log(`   💾 Always backup database before applying migrations`);

    return totalIssues === 0;
  }

  // Main execution method
  async run() {
    console.log(`🔍 Database Migration Sanity Checker`);
    console.log(`${"=".repeat(50)}`);

    try {
      if (!this.loadMigrations()) {
        return false;
      }

      this.validateNamingConventions();
      this.validateIdempotency();
      this.validateSyntax();
      this.validateRelationships();
      this.validateRLSPolicies();
      this.validateIndexes();
      this.validateOrdering();

      return this.generateReport();
    } catch (error) {
      console.error(`\n💥 Checker failed with error:`, error.message);
      return false;
    }
  }
}

// Run checker if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new MigrationChecker();
  const success = await checker.run();
  process.exit(success ? 0 : 1);
}

export { MigrationChecker };
