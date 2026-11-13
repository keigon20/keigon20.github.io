import { useEffect, useMemo, useState } from 'preact/hooks';

// Data comes from Setly's `publicConcerts` Cloud Function (only non-hidden events).
// The URL is public, so a default is baked in; PUBLIC_SETLY_CONCERTS_URL can override it (e.g. for staging).
const URL =
  (import.meta.env.PUBLIC_SETLY_CONCERTS_URL as string | undefined) ||
  'https://us-central1-setly-59268.cloudfunctions.net/publicConcerts';

interface Concert {
  id: string;
  title: string;
  artists: string[];
  venue: string;
  festivalName: string | null;
  date: string | null;
  notes: string;
  imageUrl: string | null;
  overallRating: number | null;
  soundRating: number | null;
  crowdRating: number | null;
  setlistRating: number | null;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unknown';

const headline = (c: Concert) => (c.artists.length ? c.artists.join(' · ') : c.title);

export default function Concerts() {
  const [items, setItems] = useState<Concert[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!URL) { setError('Concert feed not connected yet.'); return; }
    fetch(URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setItems(d.concerts ?? []))
      .catch(() => setError('Couldn’t load concerts right now.'));
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!items || !needle) return items ?? [];
    return items.filter((c) =>
      [c.title, c.venue, c.festivalName ?? '', ...c.artists].some((s) => s.toLowerCase().includes(needle)),
    );
  }, [items, q]);

  const stats = useMemo(() => {
    if (!items?.length) return null;
    const artists = new Set(items.flatMap((c) => c.artists.map((a) => a.toLowerCase())));
    const venues = new Map<string, number>();
    items.forEach((c) => c.venue && venues.set(c.venue, (venues.get(c.venue) ?? 0) + 1));
    const topVenue = [...venues.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { shows: items.length, artists: artists.size, topVenue };
  }, [items]);

  return (
    <div class="app-pane">
      <div class="pane-head">
        <div>
          <h2 class="pane-title">Concerts</h2>
          <p class="muted small">
            {stats ? `${stats.shows} shows · ${stats.artists} artists${stats.topVenue ? ` · most at ${stats.topVenue}` : ''}` : 'Logged in Setly, my concert journal app.'}
          </p>
        </div>
        {items && items.length > 0 && (
          <input class="search" type="search" placeholder="Search artists, venues" aria-label="Search concerts" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        )}
      </div>

      {error ? (
        <p class="muted">{error}</p>
      ) : !items ? (
        <p class="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p class="muted">{q ? 'No matches.' : 'No concerts yet.'}</p>
      ) : (
        <ol class="tickets">
          {shown.map((c) => {
            const expanded = open === c.id;
            const hasMore = Boolean(c.notes || c.soundRating || c.crowdRating || c.setlistRating);
            return (
              <li class="ticket">
                {c.imageUrl ? <img class="ticket-img" src={c.imageUrl} alt="" loading="lazy" /> : <div class="ticket-img ph" aria-hidden="true">♪</div>}
                <div class="ticket-main">
                  <span class="muted small">{fmtDate(c.date)}{c.festivalName && <> · <span class="badge">{c.festivalName}</span></>}</span>
                  <strong>{headline(c)}</strong>
                  <span class="muted small">{c.venue}</span>
                  {expanded && (
                    <div class="ticket-more">
                      {(c.soundRating || c.crowdRating || c.setlistRating) && (
                        <p class="small muted">
                          {[['Sound', c.soundRating], ['Crowd', c.crowdRating], ['Setlist', c.setlistRating]]
                            .filter(([, v]) => v != null)
                            .map(([k, v]) => `${k} ${v}/5`)
                            .join(' · ')}
                        </p>
                      )}
                      {c.notes && <p class="small">{c.notes}</p>}
                    </div>
                  )}
                </div>
                <div class="ticket-side">
                  {c.overallRating != null && <span class="score-pill" aria-label={`Rated ${c.overallRating} out of 10`}>{c.overallRating.toFixed(1)}</span>}
                  {hasMore && (
                    <button class="link-btn" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : c.id)}>
                      {expanded ? 'Less' : 'More'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p class="muted small foot">Synced from <strong>Setly</strong>, my concert journal app.</p>
    </div>
  );
}
