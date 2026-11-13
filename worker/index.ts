// Worker entry: answers /api/* and hands every other request to the static Astro build.
// Only paths listed in wrangler.jsonc `assets.run_worker_first` reach this script.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}
interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

// ---------------------------------------------------------------------------
// /api/ducks: Anaheim Ducks live score, last result and next game.
// The NHL API sends no CORS headers, so the browser can't call it directly.
// ---------------------------------------------------------------------------
const NHL_SCOREBOARD = 'https://api-web.nhle.com/v1/scoreboard/ANA/now';
const LIVE = new Set(['LIVE', 'CRIT']);
const DONE = new Set(['OFF', 'FINAL', 'OVER']);

interface NhlTeam { abbrev: string; score?: number }
interface NhlGame {
  id: number;
  gameState: string;
  startTimeUTC: string;
  awayTeam: NhlTeam;
  homeTeam: NhlTeam;
  periodDescriptor?: { number?: number; periodType?: string };
  clock?: { timeRemaining?: string; inIntermission?: boolean };
  gameOutcome?: { lastPeriodType?: string };
}

const slim = (g: NhlGame) => ({
  id: g.id,
  state: LIVE.has(g.gameState) ? 'live' : DONE.has(g.gameState) ? 'final' : 'upcoming',
  start: g.startTimeUTC,
  away: { abbrev: g.awayTeam.abbrev, score: g.awayTeam.score ?? null },
  home: { abbrev: g.homeTeam.abbrev, score: g.homeTeam.score ?? null },
  period: g.periodDescriptor?.number ?? null,
  periodType: g.periodDescriptor?.periodType ?? null, // REG | OT | SO
  clock: g.clock?.timeRemaining ?? null,
  intermission: Boolean(g.clock?.inIntermission),
  outcome: g.gameOutcome?.lastPeriodType ?? null,
});

const json = (body: unknown, status: number, cacheControl: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cacheControl },
  });

const NHL_STANDINGS = 'https://api-web.nhle.com/v1/standings/now';
const DIVISION = 'P'; // Pacific

interface NhlStanding {
  divisionAbbrev: string;
  divisionSequence: number;
  teamAbbrev: { default: string };
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  streakCode?: string;
  streakCount?: number;
}

/** YYYY-MM-DD in Pacific time, so "today" matches the Ducks' local day. */
const pacificDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

async function nhl<T>(url: string, cacheTtl: number): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // Also cache the upstream response at Cloudflare's edge.
    cf: { cacheTtl, cacheEverything: true },
  } as RequestInit);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function ducks(ctx: Ctx): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  // Bump the version whenever the response shape changes, so stale cached shapes aren't served.
  const key = new Request('https://cache.internal/api/ducks?v=3');
  const hit = await cache.match(key);
  if (hit) return hit;

  // Standings failing shouldn't take the score down with it (and vice versa).
  const [board, table] = await Promise.allSettled([
    nhl<{ gamesByDate?: { games?: NhlGame[] }[] }>(NHL_SCOREBOARD, 15),
    nhl<{ standings?: NhlStanding[] }>(NHL_STANDINGS, 300),
  ]);
  if (board.status === 'rejected' && table.status === 'rejected') {
    return json({ error: 'NHL API unavailable' }, 502, 'no-store');
  }

  // Which game to show: live > finished today > next upcoming (which may be later today).
  const games = board.status === 'fulfilled' ? (board.value.gamesByDate ?? []).flatMap((d) => d.games ?? []) : [];
  const today = pacificDate(new Date());
  const live = games.find((g) => LIVE.has(g.gameState));
  const finalToday = [...games].reverse().find((g) => DONE.has(g.gameState) && pacificDate(new Date(g.startTimeUTC)) === today);
  const next = games.find((g) => !LIVE.has(g.gameState) && !DONE.has(g.gameState));
  const mode = live ? 'live' : finalToday ? 'final' : next ? 'next' : 'none';
  const game = live ?? finalToday ?? next ?? null;

  const standings =
    table.status === 'fulfilled'
      ? (table.value.standings ?? [])
          .filter((t) => t.divisionAbbrev === DIVISION)
          .sort((a, b) => a.divisionSequence - b.divisionSequence)
          .map((t) => ({
            rank: t.divisionSequence,
            abbrev: t.teamAbbrev.default,
            gp: t.gamesPlayed,
            record: `${t.wins}-${t.losses}-${t.otLosses}`,
            pts: t.points,
            streak: t.streakCode && t.streakCount ? `${t.streakCode}${t.streakCount}` : null,
          }))
      : [];

  // Cache briefly while live. Otherwise up to 5 min, but never past puck drop, so the switch to live isn't hidden.
  let ttl = 300;
  if (live) ttl = 20;
  else if (mode === 'next' && next) ttl = Math.min(300, Math.max(20, Math.floor((Date.parse(next.startTimeUTC) - Date.now()) / 1000)));
  const out = json(
    { mode, game: game ? slim(game) : null, today, standings, division: 'Pacific' },
    200,
    `public, max-age=${ttl}`,
  );
  ctx.waitUntil(cache.put(key, out.clone()));
  return out;
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/ducks') return await ducks(ctx);
    } catch (err) {
      console.error('[api]', pathname, err);
      return json({ error: 'Something went wrong' }, 500, 'no-store');
    }
    if (pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404, 'no-store');
    return env.ASSETS.fetch(request);
  },
};
