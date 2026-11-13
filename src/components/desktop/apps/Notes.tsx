import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';
import type { NoteSummary } from '../../../data/notes';

/** Provided by Desktop with the notes rendered at build time. */
export const NotesContext = createContext<NoteSummary[]>([]);

export default function Notes() {
  const notes = useContext(NotesContext);
  const [slug, setSlug] = useState<string | null>(null);
  const note = notes.find((n) => n.slug === slug);

  if (note) {
    return (
      <article class="note-read">
        <div class="note-bar">
          <button class="link-btn" onClick={() => setSlug(null)}>← All notes</button>
          <a class="link-btn" href={`/notes/${note.slug}`} target="_blank" rel="noopener">Open as page ↗</a>
        </div>
        <p class="note-meta">
          {note.kind === 'report' && <span class="kicker">Report · </span>}
          {note.draft && <span class="draft-pill">Draft</span>}
          {note.date} · {note.minutes} min read
        </p>
        <h1 class="note-title">{note.title}</h1>
        {/* HTML is rendered from my own Markdown at build time. */}
        <div class="prose" dangerouslySetInnerHTML={{ __html: note.html }} />
      </article>
    );
  }

  return (
    <div class="app-pane">
      <div class="pane-head">
        <div>
          <h2 class="pane-title">Notes</h2>
          <p class="muted small">Posts and reports on what I build, what I learn, and baseball data.</p>
        </div>
        <a class="link-btn" href="/notes">View all ↗</a>
      </div>
      {notes.length === 0 ? (
        <p class="muted">Nothing published yet.</p>
      ) : (
        <ol class="note-items">
          {notes.map((n) => (
            <li>
              <button class="note-item" onClick={() => setSlug(n.slug)}>
                <span class="note-meta">
                  {n.kind === 'report' && <span class="kicker">Report · </span>}
                  {n.draft && <span class="draft-pill">Draft</span>}
                  {n.date} · {n.minutes} min
                </span>
                <strong>{n.title}</strong>
                {n.summary && <span class="muted small">{n.summary}</span>}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
