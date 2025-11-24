export async function getOverview() {
  const res = await fetch("/api/analytics/overview");
  if (!res.ok) throw new Error("Failed to fetch overview");
  return res.json();
}

export async function getTrends() {
  const res = await fetch("/api/analytics/trends");
  if (!res.ok) throw new Error("Failed to fetch trends");
  return res.json();
}

export async function ingestEvent(event: any) {
  const res = await fetch("/api/analytics/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return res.json();
}
