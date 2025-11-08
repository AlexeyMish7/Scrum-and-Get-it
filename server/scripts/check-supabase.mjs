import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadDotEnvIfNeeded() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return { url, key };

  // try to read server/.env
  // Try common locations: server/.env (repo root) or .env in CWD
  const serverEnvPath = path.resolve(process.cwd(), "server", ".env");
  const rootEnvPath = path.resolve(process.cwd(), ".env");
  const envPath = fs.existsSync(serverEnvPath)
    ? serverEnvPath
    : fs.existsSync(rootEnvPath)
    ? rootEnvPath
    : serverEnvPath;
  if (!fs.existsSync(envPath)) {
    return { url: url ?? null, key: key ?? null };
  }
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);
  const map = {};
  for (const line of lines) {
    const m = line.match(/^\s*([^=\s]+)=(.*)$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2] ?? "";
    // strip surrounding quotes
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map[k] = v;
  }
  return {
    url: process.env.SUPABASE_URL ?? map.SUPABASE_URL ?? null,
    key:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      map.SUPABASE_SERVICE_ROLE_KEY ??
      null,
  };
}

const { url, key } = loadDotEnvIfNeeded();

if (!url || !key) {
  console.error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env or server/.env"
  );
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

try {
  const res = await supabase
    .from("ai_artifacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (res.error) {
    console.error("Query error:", res.error);
    process.exit(1);
  }

  console.log("Latest ai_artifacts rows:");
  console.log(JSON.stringify(res.data, null, 2));
  process.exit(0);
} catch (err) {
  console.error("Unexpected error:", err);
  process.exit(1);
}
