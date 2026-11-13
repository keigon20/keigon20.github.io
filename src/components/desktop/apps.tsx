import type { ComponentChildren } from 'preact';
import { projects, site } from '../../data/projects';
import { work, education, clubs } from '../../data/resume';

export type AppId = 'welcome' | 'projects' | 'notes' | 'baseball' | 'concerts' | 'music' | 'resume' | 'mail';

export interface AppDef {
  id: AppId;
  title: string;
  glyph: string;
  gradient: string;
  /** Shown in the dock and on the mobile home screen. */
  dock: boolean;
  width: number;
  height: number;
  Content: (p: { open: (id: AppId) => void }) => ComponentChildren;
}

const Soon = ({ what }: { what: string }) => (
  <div class="soon-pane">
    <p class="soon-title">Coming soon</p>
    <p>{what}</p>
  </div>
);

export const apps: AppDef[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    glyph: '👋',
    gradient: 'linear-gradient(160deg,#fbbf24,#f97316)',
    dock: true,
    width: 600,
    height: 430,
    Content: ({ open }) => (
      <div class="welcome">
        <p class="eyebrow">{site.name}</p>
        <h1>I make software and apps.</h1>
        <p class="lede">
          Computer Science graduate building mobile apps and data tools, from a social concert journal to a golf handicap tracker.
          This site is my desktop. Open an app to look around.
        </p>
        <div class="chips">
          {projects.map((p) => (
            <button class="chip" onClick={() => open('projects')} style={`--g:${p.gradient}`}>
              <span class="chip-dot" aria-hidden="true" />
              {p.name}
            </button>
          ))}
        </div>
        <div class="row">
          <button class="btn primary" onClick={() => open('projects')}>See my projects</button>
          <button class="btn" onClick={() => open('mail')}>Get in touch</button>
          <a class="btn" href="/classic">Classic site</a>
        </div>
      </div>
    ),
  },
  {
    id: 'projects',
    title: 'Projects',
    glyph: '📁',
    gradient: 'linear-gradient(160deg,#60a5fa,#2563eb)',
    dock: true,
    width: 680,
    height: 480,
    Content: () => (
      <div class="grid-pane">
        {projects.map((p) => (
          <article class="proj">
            <div class="proj-art" style={`background:${p.gradient}`} aria-hidden="true">{p.name[0]}</div>
            <div>
              <p class="kicker">{p.kicker}</p>
              <h2>{p.name}</h2>
              <p class="muted">{p.description}</p>
              <ul class="tags">{p.tags.map((t) => <li>{t}</li>)}</ul>
              <span class="muted small">Case study coming soon</span>
            </div>
          </article>
        ))}
      </div>
    ),
  },
  {
    id: 'notes',
    title: 'Notes',
    glyph: '📝',
    gradient: 'linear-gradient(160deg,#fde047,#facc15)',
    dock: true,
    width: 560,
    height: 400,
    Content: () => <Soon what="Blog posts and reports will live here: what I build, what I learn, and baseball data write-ups." />,
  },
  {
    id: 'baseball',
    title: 'Baseball',
    glyph: '⚾',
    gradient: 'linear-gradient(160deg,#f87171,#b91c1c)',
    dock: true,
    width: 600,
    height: 420,
    Content: () => <Soon what="Angels analytics: dashboards and experiments built with SQL and R." />,
  },
  {
    id: 'concerts',
    title: 'Concerts',
    glyph: '🎟️',
    gradient: 'linear-gradient(160deg,#a78bfa,#7c3aed)',
    dock: true,
    width: 600,
    height: 420,
    Content: () => <Soon what="Every show I've been to as a sortable timeline: Zedd, Kygo, Morgan Wallen, Fly By Midnight and more." />,
  },
  {
    id: 'music',
    title: 'Music',
    glyph: '🎵',
    gradient: 'linear-gradient(160deg,#fb7185,#e11d48)',
    dock: true,
    width: 520,
    height: 380,
    Content: () => <Soon what="Recently played from Spotify now, and my own MP3 streaming service (with a login) later." />,
  },
  {
    id: 'resume',
    title: 'Résumé',
    glyph: '📄',
    gradient: 'linear-gradient(160deg,#94a3b8,#475569)',
    dock: true,
    width: 640,
    height: 520,
    Content: () => (
      <div class="doc">
        <h2>Work</h2>
        {work.map((w) => (
          <div class="entry">
            <div class="entry-top"><strong>{w.role}</strong> <span class="muted">· {w.org}</span><span class="date">{w.dates}</span></div>
            <ul>{w.bullets.map((b) => <li>{b}</li>)}</ul>
          </div>
        ))}
        <h2>Education</h2>
        <div class="entry">
          <div class="entry-top"><strong>{education.degree}</strong> <span class="muted">· {education.school}</span><span class="date">{education.date}</span></div>
          <ul>{education.bullets.map((b) => <li>{b}</li>)}</ul>
        </div>
        <h2>Clubs</h2>
        {clubs.map((c) => (
          <div class="entry">
            <div class="entry-top"><strong>{c.role}</strong> <span class="muted">· {c.name}</span><span class="date">{c.dates}</span></div>
            <p class="muted">{c.blurb}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'mail',
    title: 'Mail',
    glyph: '✉️',
    gradient: 'linear-gradient(160deg,#38bdf8,#0284c7)',
    dock: true,
    width: 460,
    height: 300,
    Content: () => (
      <div class="welcome">
        <h1 class="small-h">Let’s build something.</h1>
        <p class="lede">Open to full-time roles and collaborations.</p>
        <div class="row"><a class="btn primary" href={`mailto:${site.email}`}>{site.email}</a></div>
      </div>
    ),
  },
];

export const appById = (id: string) => apps.find((a) => a.id === id);
