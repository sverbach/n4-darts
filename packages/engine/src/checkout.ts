// Checkout hints: the route to finish from a remaining score with the darts left in a visit.

import type { OutRule, Segment } from "./x01.ts";

const BULL: Segment = { number: 25, multiplier: 2 };
const OUTER_BULL: Segment = { number: 25, multiplier: 1 };

const numbers = Array.from({ length: 20 }, (_, i) => 20 - i);
/** Every field a dart can score in, biggest number first. */
const fields: Segment[] = [
  ...numbers.map((number) => ({ number, multiplier: 1 }) as const),
  ...numbers.map((number) => ({ number, multiplier: 2 }) as const),
  ...numbers.map((number) => ({ number, multiplier: 3 }) as const),
  OUTER_BULL,
  BULL,
];

const points = (s: Segment) => s.number * s.multiplier;
const isBull = (s: Segment) => s.number === 25 && s.multiplier === 2;

/** The doubles players like to finish on, best first; other doubles come after, the bullseye last. */
const GOOD_DOUBLES = [20, 16, 8, 18, 12, 10, 4, 2];

/** How good a field is to finish on (lower is better), or null if the out rule doesn't allow it. */
function lastRank(s: Segment, outRule: OutRule): number | null {
  if (outRule === "straight") return 0;
  if (isBull(s)) return 100;
  if (s.multiplier === 2) {
    const good = GOOD_DOUBLES.indexOf(s.number);
    return good >= 0 ? good : 20 + (20 - s.number);
  }
  if (s.multiplier === 3 && outRule === "master") return 50 + (20 - s.number);
  return null;
}

/** How awkward a field is to set up with (lower is better): big singles, then trebles, then the rest. */
function setupCost(s: Segment): number {
  if (isBull(s)) return 10;
  if (s.number === 25) return 2;
  return { 1: 0, 2: 3, 3: 1 }[s.multiplier as 1 | 2 | 3];
}

interface Candidate {
  route: Segment[];
  key: number[];
}

/** Compares routes: fewest darts, no bull or doubles to set up, a good last field, easy setup, big darts first. */
function better(a: Candidate, b: Candidate): boolean {
  const length = Math.max(a.key.length, b.key.length);
  for (let i = 0; i < length; i++) {
    const diff = (a.key[i] ?? 0) - (b.key[i] ?? 0);
    if (diff !== 0) return diff < 0;
  }
  return false;
}

function candidate(setup: Segment[], last: Segment, rank: number, outRule: OutRule): Candidate {
  const route = [...setup, last];
  // With straight out the last dart is just another dart, so it counts as setup.
  const scored = outRule === "straight" ? route : setup;
  const cost = scored.reduce((sum, s) => sum + setupCost(s), 0);
  // Setting up on the bull or a double is as hard as finishing, so avoid it where possible.
  const bullSetup = setup.some(isBull) ? 1 : 0;
  const doubleSetups = setup.filter((s) => s.multiplier === 2).length;
  return {
    route,
    key: [route.length, bullSetup, doubleSetups, rank, cost, ...route.map((s) => -points(s))],
  };
}

/** All ways to score exactly `total` with `count` darts, biggest dart first. */
function setups(total: number, count: number, maxIndex = fields.length - 1): Segment[][] {
  if (count === 0) return total === 0 ? [[]] : [];
  const out: Segment[][] = [];
  for (let i = 0; i <= maxIndex; i++) {
    const field = fields[i] as Segment;
    const rest = total - points(field);
    if (rest < 0) continue;
    // Each combination once: later darts are never bigger than earlier ones.
    for (const tail of setups(rest, count - 1, i)) out.push([field, ...tail]);
  }
  return out.map((route) => route.sort((a, b) => points(b) - points(a)));
}

const cache = new Map<string, Segment[] | null>();

/**
 * The best route to finish `remaining` with `dartsLeft` darts under `outRule`, or null if it
 * can't be finished this visit.
 */
export function checkoutRoute(
  remaining: number,
  dartsLeft: number,
  outRule: OutRule,
): Segment[] | null {
  const cacheKey = `${remaining}:${dartsLeft}:${outRule}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  let best: Candidate | null = null;
  for (let darts = 1; darts <= Math.min(dartsLeft, 3) && !best; darts++) {
    for (const last of fields) {
      const rank = lastRank(last, outRule);
      const setupTotal = remaining - points(last);
      if (rank === null || setupTotal < 0) continue;
      for (const setup of setups(setupTotal, darts - 1)) {
        const next = candidate(setup, last, rank, outRule);
        if (!best || better(next, best)) best = next;
      }
    }
  }
  const route = best?.route ?? null;
  cache.set(cacheKey, route);
  return route;
}
