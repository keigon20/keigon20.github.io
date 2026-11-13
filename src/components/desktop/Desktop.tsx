import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { apps, appById, type AppId } from './apps';
import Widgets from './Widgets';
import './desktop.css';

interface Win { id: AppId; x: number; y: number; z: number; min: boolean; max: boolean }

const MOBILE = '(max-width: 760px)';

export default function Desktop() {
  const [wins, setWins] = useState<Win[]>([{ id: 'welcome', x: 140, y: 70, z: 10, min: false, max: false }]);
  const [focused, setFocused] = useState<AppId | null>('welcome');
  const [time, setTime] = useState('');
  const z = useRef(10);
  const drag = useRef<{ id: AppId; dx: number; dy: number } | null>(null);

  const bump = () => ++z.current;

  const open = (id: AppId) => {
    const nz = bump();
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) return ws.map((w) => (w.id === id ? { ...w, min: false, z: nz } : w));
      const n = ws.length;
      return [...ws, { id, x: 90 + n * 30, y: 60 + n * 26, z: nz, min: false, max: false }];
    });
    setFocused(id);
    try { history.replaceState(null, '', `#${id}`); } catch { /* ignore */ }
  };

  const focus = (id: AppId) => {
    if (focused === id) return;
    const nz = bump();
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: nz } : w)));
    setFocused(id);
  };

  const close = (id: AppId) => {
    setWins((ws) => {
      const rest = ws.filter((w) => w.id !== id);
      const top = rest.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0];
      setFocused(top ? top.id : null);
      return rest;
    });
    try { history.replaceState(null, '', location.pathname); } catch { /* ignore */ }
  };

  const minimize = (id: AppId) => {
    setWins((ws) => {
      const next = ws.map((w) => (w.id === id ? { ...w, min: true } : w));
      const top = next.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0];
      setFocused(top ? top.id : null);
      return next;
    });
  };

  const toggleMax = (id: AppId) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, max: !w.max } : w)));

  // Open an app from the URL hash on first load (deep links like /#baseball).
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id && id !== 'welcome' && appById(id)) open(id as AppId);
  }, []);

  // Clock in the menu bar.
  useEffect(() => {
    const tick = () =>
      setTime(new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }).format(new Date()));
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  // Escape closes the focused window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && focused) close(focused); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused]);

  // Move keyboard focus into a window when it becomes active (unless focus is already inside it).
  useEffect(() => {
    if (!focused) return;
    const el = document.querySelector<HTMLElement>(`[data-win="${focused}"]`);
    if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
  }, [focused, wins.length]);

  const startDrag = (e: JSX.TargetedPointerEvent<HTMLElement>, w: Win) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (matchMedia(MOBILE).matches || w.max) return;
    focus(w.id);
    drag.current = { id: w.id, dx: e.clientX - w.x, dy: e.clientY - w.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: JSX.TargetedPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.min(Math.max(e.clientX - d.dx, -200), window.innerWidth - 120);
    const y = Math.min(Math.max(e.clientY - d.dy, 30), window.innerHeight - 60);
    setWins((ws) => ws.map((w) => (w.id === d.id ? { ...w, x, y } : w)));
  };

  const endDrag = () => { drag.current = null; };

  const activeTitle = focused ? appById(focused)?.title : 'Desktop';

  return (
    <div class="desk">
      <header class="menubar">
        <div class="mb-left">
          <a class="mb-brand" href="/" aria-label="Keigo Noguchi desktop"><span class="mb-dot" aria-hidden="true" />Keigo</a>
          <span class="mb-app">{activeTitle}</span>
        </div>
        <div class="mb-right">
          <a href="/classic">Classic site</a>
          <time>{time}</time>
        </div>
      </header>

      <main class="stage" id="main">
        <Widgets />

        {/* Mobile home screen: app icons (hidden on desktop) */}
        <nav class="home" aria-label="Apps">
          {apps.map((a) => (
            <button class="home-icon" onClick={() => open(a.id)}>
              <span class="icon" style={`background:${a.gradient}`} aria-hidden="true">{a.glyph}</span>
              <span class="home-label">{a.title}</span>
            </button>
          ))}
        </nav>

        {wins.map((w) => {
          const app = appById(w.id)!;
          const cls = ['win', w.max && 'max', w.min && 'min', focused === w.id && 'focus'].filter(Boolean).join(' ');
          return (
            <section
              key={w.id}
              class={cls}
              data-win={w.id}
              role="dialog"
              aria-label={app.title}
              aria-hidden={w.min ? 'true' : undefined}
              tabIndex={-1}
              style={{ left: `${w.x}px`, top: `${w.y}px`, width: `${app.width}px`, height: `${app.height}px`, zIndex: w.z }}
              onPointerDown={() => focus(w.id)}
            >
              <header class="titlebar" onPointerDown={(e) => startDrag(e, w)} onPointerMove={moveDrag} onPointerUp={endDrag} onDblClick={() => toggleMax(w.id)}>
                <div class="lights">
                  <button class="light close" aria-label={`Close ${app.title}`} onClick={() => close(w.id)} />
                  <button class="light mini" aria-label={`Minimize ${app.title}`} onClick={() => minimize(w.id)} />
                  <button class="light zoom" aria-label={`Zoom ${app.title}`} onClick={() => toggleMax(w.id)} />
                </div>
                <h2 class="win-title">{app.title}</h2>
              </header>
              <div class="win-body"><app.Content open={open} /></div>
            </section>
          );
        })}
      </main>

      <nav class="dock" aria-label="Dock">
        {apps.filter((a) => a.dock).map((a) => {
          const w = wins.find((x) => x.id === a.id);
          return (
            <button class="dock-item" data-label={a.title} aria-label={`Open ${a.title}`} onClick={() => open(a.id)}>
              <span class="icon" style={`background:${a.gradient}`} aria-hidden="true">{a.glyph}</span>
              <span class={`dock-dot ${w ? 'on' : ''}`} aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      <noscript>
        <p class="noscript">This desktop needs JavaScript. <a href="/classic">View the classic site</a>.</p>
      </noscript>
    </div>
  );
}
