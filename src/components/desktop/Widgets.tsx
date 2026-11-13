import { useEffect, useState } from 'preact/hooks';

function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const fmt = (tz: string) =>
    now ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(now) : '–:––';
  return (
    <section class="widget" aria-label="Clocks">
      <div class="clocks">
        <div><p class="w-label">Torrance</p><p class="w-big">{fmt('America/Los_Angeles')}</p></div>
        <div><p class="w-label">Tokyo</p><p class="w-big">{fmt('Asia/Tokyo')}</p></div>
      </div>
    </section>
  );
}

// Placeholder: will fetch /api/spotify (Cloudflare Pages Function) once the Spotify app is set up.
function NowPlayingWidget() {
  return (
    <section class="widget" aria-label="Last played song">
      <p class="w-label">♪ Last played</p>
      <div class="np">
        <div class="np-art" aria-hidden="true" />
        <div>
          <p class="w-title">Not connected yet</p>
          <p class="w-sub">Spotify coming soon</p>
        </div>
      </div>
    </section>
  );
}

// Data from /api/ducks (worker/index.ts), which proxies the NHL scoreboard.
interface DucksGame {
  state: 'live' | 'final' | 'upcoming';
  start: string;
  away: { abbrev: string; score: number | null };
  home: { abbrev: string; score: number | null };
  period: number | null;
  periodType: string | null;
  clock: string | null;
  intermission: boolean;
  outcome: string | null;
}
interface StandingRow { rank: number; abbrev: string; gp: number; record: string; pts: number; streak: string | null }
interface DucksData {
  mode: 'live' | 'final' | 'next' | 'none';
  game: DucksGame | null;
  today: string; // YYYY-MM-DD, Pacific
  standings: StandingRow[];
  division: string;
}

const MIN = 60_000;
const HOUR = 60 * MIN;

/** When to check again. Live: 30s. Before a game: sleep until puck drop (max 3h).
 *  Start time passed but not live yet (warm-ups run late): every minute. Otherwise every 3h. */
function nextPollMs(d: DucksData | null): number {
  if (!d) return 10 * MIN; // request failed; try again later
  if (d.mode === 'live') return 30_000;
  if (d.mode === 'next' && d.game) {
    const untilStart = Date.parse(d.game.start) - Date.now();
    return untilStart <= 0 ? MIN : Math.min(untilStart + 5_000, 3 * HOUR);
  }
  return 3 * HOUR;
}

const PT = 'America/Los_Angeles';
const ptTime = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: PT, ...opts }).format(new Date(iso));
const ptDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: PT });

const periodLabel = (g: DucksGame) =>
  g.periodType === 'SO' ? 'Shootout' : g.periodType === 'OT' ? 'OT' : g.period ? `P${g.period}` : '';

/** "Tonight 7:00 PM PT", "Tomorrow 5:00 PM PT" or "Sat, Nov 15 · 5:00 PM PT" */
function whenLabel(iso: string, today: string): string {
  const time = `${ptTime(iso, { hour: 'numeric', minute: '2-digit' })} PT`;
  const day = ptDate(new Date(iso));
  const tomorrow = ptDate(new Date(Date.parse(`${today}T12:00:00Z`) + 86_400_000));
  if (day === today) return `Today · ${time}`;
  if (day === tomorrow) return `Tomorrow · ${time}`;
  return `${ptTime(iso, { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}

function ScoreRow({ g }: { g: DucksGame }) {
  const team = (t: DucksGame['home']) => (
    <span class={t.abbrev === 'ANA' ? 'us' : ''}>
      {t.abbrev} <b>{t.score ?? '–'}</b>
    </span>
  );
  return <div class="score">{team(g.away)}<i aria-hidden="true">–</i>{team(g.home)}</div>;
}

function GameBlock({ d }: { d: DucksData }) {
  const g = d.game;
  if (!g || d.mode === 'none') return <p class="w-sub">No upcoming games scheduled</p>;

  if (d.mode === 'live') {
    const status = g.intermission ? `${periodLabel(g)} intermission` : `${periodLabel(g)} · ${g.clock ?? ''}`;
    return <><ScoreRow g={g} /><p class="w-sub">{status}</p></>;
  }
  if (d.mode === 'final') {
    const extra = g.outcome && g.outcome !== 'REG' ? `/${g.outcome}` : '';
    return <><ScoreRow g={g} /><p class="w-sub">Final{extra}</p></>;
  }
  const home = g.home.abbrev === 'ANA';
  return (
    <div class="next-game">
      <p class="w-title">{home ? `vs ${g.away.abbrev}` : `@ ${g.home.abbrev}`}</p>
      <p class="w-sub">{whenLabel(g.start, d.today)}</p>
    </div>
  );
}

function Standings({ rows, division }: { rows: StandingRow[]; division: string }) {
  if (!rows.length) return null;
  return (
    <table class="standings">
      <caption>{division} Division</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Team</th><th scope="col">GP</th><th scope="col">PTS</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          // Top 3 in each division make the playoffs; a line marks the cut.
          <tr class={[r.abbrev === 'ANA' && 'us', r.rank === 3 && 'cut'].filter(Boolean).join(' ')} title={`${r.record}${r.streak ? ` · ${r.streak}` : ''}`}>
            <td>{r.rank}</td><td>{r.abbrev}</td><td>{r.gp}</td><td><b>{r.pts}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DucksWidget() {
  const [data, setData] = useState<DucksData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const load = async () => {
      clearTimeout(timer);
      let d: DucksData | null = null;
      try {
        const res = await fetch('/api/ducks');
        if (!res.ok) throw new Error(String(res.status));
        d = await res.json();
        setData(d);
        setFailed(false);
      } catch {
        setFailed(true);
      }
      // Don't poll in a background tab; coming back to the tab reloads immediately.
      if (!stopped && document.visibilityState === 'visible') timer = setTimeout(load, nextPollMs(d));
    };
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    load();
    document.addEventListener('visibilitychange', onVisible);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const label = data?.mode === 'next' ? 'Next game' : data?.mode === 'final' ? 'Today' : null;

  return (
    <section class="widget" aria-label="Anaheim Ducks score and Pacific Division standings">
      <p class="w-label">
        🏒 Ducks
        {data?.mode === 'live' && <span class="live-dot">Live</span>}
        {label && <span class="w-tag">{label}</span>}
      </p>
      {data ? <GameBlock d={data} /> : <p class="w-sub">{failed ? 'Score unavailable right now' : 'Loading…'}</p>}
      {data && <Standings rows={data.standings} division={data.division} />}
    </section>
  );
}

export default function Widgets() {
  return (
    <aside class="widgets" aria-label="Widgets">
      <ClockWidget />
      <NowPlayingWidget />
      <DucksWidget />
    </aside>
  );
}
