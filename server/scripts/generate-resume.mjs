#!/usr/bin/env node
/**
 * Call the local AI orchestrator POST /api/generate/resume endpoint.
 *
 * Usage examples:
 *   # default values
 *   node scripts/generate-resume.mjs
 *
 *   # custom user id and job id
 *   node scripts/generate-resume.mjs --userId=11111111-1111-1111-1111-111111111111 --jobId=42
 *
 *   # custom base URL
 *   node scripts/generate-resume.mjs --baseUrl=http://localhost:3000
 *
 * The script uses fetch and prints the response JSON.
 */

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  userId: "00000000-0000-0000-0000-000000000000",
  jobId: 123,
  baseUrl: "http://localhost:8787",
};

for (const arg of args) {
  const match = arg.match(/^--(\w+)=(.+)$/);
  if (match) {
    const [, key, value] = match;
    if (key === "jobId") {
      options[key] = parseInt(value, 10);
    } else {
      options[key] = value;
    }
  }
}

const { userId, jobId, baseUrl } = options;

const headers = {
  "Content-Type": "application/json",
  "X-User-Id": userId,
};

const body = JSON.stringify({ jobId });

const url = `${baseUrl}/api/generate/resume`;

console.log(`Posting to ${url} with UserId=${userId} JobId=${jobId}`);

try {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `\x1b[31mRequest failed with status ${response.status}:\x1b[0m`
    );
    console.error(errorText);
    process.exit(1);
  }

  const data = await response.json();
  console.log("\x1b[32mResponse:\x1b[0m\n");
  console.log(JSON.stringify(data, null, 2));
} catch (err) {
  console.error(`\x1b[31mRequest failed: ${err.message}\x1b[0m`);
  process.exit(1);
}
