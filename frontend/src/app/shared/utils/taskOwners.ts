// Map Sprint 2 Use Case IDs to their owners.
// NOTE: Replace "TBD" with real names from your ownership doc.
// Keeping this in one place makes it easy to update without touching page mappings.

export const taskOwners: Record<string, string> = {
  // Nihaal — Jobs Core UX
  "UC-036": "Nihaal",
  "UC-037": "Nihaal",
  "UC-038": "Nihaal",
  "UC-039": "Nihaal",
  "UC-040": "Nihaal",
  "UC-041": "Nihaal",
  "UC-045": "Nihaal",

  // Alexey — AI + Supabase Orchestrator
  "UC-042": "Alexey",
  "UC-047": "Alexey",
  "UC-049": "Alexey",
  "UC-050": "Alexey",
  "UC-056": "Alexey",
  "UC-059": "Alexey",
  "UC-063": "Alexey",
  "UC-065": "Alexey",
  "UC-066": "Alexey",

  // Aliya — Materials & Versions
  "UC-046": "Aliya",
  "UC-051": "Aliya",
  "UC-052": "Aliya",
  "UC-053": "Aliya",
  "UC-054": "Aliya",
  "UC-061": "Aliya",
  "UC-062": "Aliya",

  // Nafisa — AI UI Flows
  "UC-048": "Nafisa",
  "UC-055": "Nafisa",
  "UC-057": "Nafisa",
  "UC-058": "Nafisa",
  "UC-060": "Nafisa",
  "UC-069": "Nafisa",
  "UC-070": "Nafisa",

  // Jane — Analytics & Research Surfaces
  "UC-043": "Jane",
  "UC-044": "Jane",
  "UC-064": "Jane",
  "UC-067": "Jane",
  "UC-068": "Jane",
  "UC-071": "Jane",
  "UC-072": "Jane",
};

export function ownerFor(uc: string): string | undefined {
  return taskOwners[uc];
}
