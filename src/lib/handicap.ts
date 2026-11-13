// World Handicap System (USGA) Handicap Index calculation.
// Score should be the Adjusted Gross Score (net double bogey applied per hole).

export interface Round {
  id?: number;
  date: string;
  rating: number;
  slope: number;
  score: number;
  pcc?: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Score Differential = (113 / Slope) × (AGS − Course Rating − PCC), to one decimal. */
export const differential = (r: Round) => round1((113 / r.slope) * (r.score - r.rating - (r.pcc ?? 0)));

/** [how many lowest differentials to average, adjustment] for 3–20 scores. */
function rule(n: number): [number, number] {
  if (n <= 3) return [1, -2];
  if (n === 4) return [1, -1];
  if (n === 5) return [1, 0];
  if (n === 6) return [2, -1];
  if (n <= 8) return [2, 0];
  if (n <= 11) return [3, 0];
  if (n <= 14) return [4, 0];
  if (n <= 16) return [5, 0];
  if (n <= 18) return [6, 0];
  if (n === 19) return [7, 0];
  return [8, 0];
}

export interface HandicapResult {
  index: number | null;
  /** Rounds in the most recent 20, newest first, with differentials. */
  recent: (Round & { differential: number; counts: boolean })[];
  used: number;
  needed: number;
}

export function handicap(rounds: Round[]): HandicapResult {
  const recent = [...rounds]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.id ?? 0) - (a.id ?? 0))
    .slice(0, 20)
    .map((r) => ({ ...r, differential: differential(r), counts: false }));

  if (recent.length < 3) return { index: null, recent, used: 0, needed: 3 - recent.length };

  const [take, adj] = rule(recent.length);
  const lowest = [...recent].sort((a, b) => a.differential - b.differential).slice(0, take);
  lowest.forEach((r) => (r.counts = true));
  const avg = lowest.reduce((s, r) => s + r.differential, 0) / take;
  const index = Math.min(54, round1(avg + adj));
  return { index, recent, used: take, needed: 0 };
}
