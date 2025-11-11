#!/usr/bin/env node
/**
 * Simple Migration Validator
 *
 * PURPOSE: Quick validation of migration files for basic issues
 */

import fs from "fs";
import path from "path";

console.log("🔍 Simple Migration Validator Starting...");

const migrationDir = path.resolve("../../db/migrations");
console.log(`Looking for migrations in: ${migrationDir}`);

try {
  if (!fs.existsSync(migrationDir)) {
    console.error(`❌ Migration directory not found: ${migrationDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`📁 Found ${files.length} SQL files:`);
  files.forEach((f) => console.log(`   - ${f}`));

  let issues = 0;
  let warnings = 0;

  console.log(`\n🔍 Validating migration files...`);

  for (const file of files) {
    const filePath = path.join(migrationDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    console.log(`\n📄 ${file}:`);
    console.log(`   Size: ${content.length} bytes`);

    // Basic validations
    if (!content.trim()) {
      console.log(`   ❌ File is empty`);
      issues++;
      continue;
    }

    // Check for idempotency patterns
    const hasDoBlock = content.includes("DO $$");
    const hasIfNotExists = content.includes("IF NOT EXISTS");
    const hasDropIfExists =
      content.includes("DROP") && content.includes("IF EXISTS");

    if (hasDoBlock || hasIfNotExists || hasDropIfExists) {
      console.log(`   ✅ Has idempotency patterns`);
    } else {
      console.log(`   ⚠️  No clear idempotency patterns`);
      warnings++;
    }

    // Check for RLS
    if (
      content.includes("CREATE TABLE") &&
      content.includes("ROW LEVEL SECURITY")
    ) {
      console.log(`   ✅ Includes RLS setup`);
    } else if (content.includes("CREATE TABLE")) {
      console.log(`   ⚠️  Creates tables but no RLS detected`);
      warnings++;
    }

    // Check for foreign keys
    if (content.includes("REFERENCES")) {
      console.log(`   ✅ Has foreign key relationships`);
    }

    // Check for indexes
    if (content.includes("CREATE INDEX")) {
      console.log(`   ✅ Creates indexes`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${files.length}`);
  console.log(`   Issues: ${issues}`);
  console.log(`   Warnings: ${warnings}`);

  if (issues === 0) {
    console.log(`\n🎉 No critical issues found!`);
    if (warnings > 0) {
      console.log(`   ⚠️  ${warnings} warnings to review`);
    }
  } else {
    console.log(`\n❌ ${issues} critical issues need attention`);
  }
} catch (error) {
  console.error(`💥 Error: ${error.message}`);
  process.exit(1);
}

console.log("\n✅ Migration validation complete");
