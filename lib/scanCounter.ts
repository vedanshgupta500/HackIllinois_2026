// In-memory counter seeded with a realistic starting number.
// Resets on process restart — appropriate for a hackathon demo.
const SEED = 31847;

let sessionCount = 0;

export function incrementScanCount(): void {
  sessionCount++;
}

export function getScanCount(): number {
  return SEED + sessionCount;
}
