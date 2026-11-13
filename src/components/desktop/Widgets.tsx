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

// Placeholder: will fetch /api/ducks (NHL stats) via a Pages Function.
function DucksWidget() {
  return (
    <section class="widget" aria-label="Anaheim Ducks score">
      <p class="w-label">🏒 Ducks</p>
      <div class="score">
        <span>ANA</span><b>–</b><span>–</span>
      </div>
      <p class="w-sub">Live score coming soon</p>
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
