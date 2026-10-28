import { useMemo, useState } from 'react';
import type { Satellite } from '../../shared/orbit.ts';

interface Props {
  satellites: Satellite[];
  selectedId: number | null;
  onSelect: (noradId: number) => void;
}

const MAX_ITEMS = 200;

export function SatelliteList({ satellites, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return satellites
      .filter((s) => !q || s.name.toLowerCase().includes(q) || String(s.noradId) === q)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [satellites, query]);

  return (
    <section>
      <h2>Satelliten ({satellites.length})</h2>
      <input
        type="search"
        placeholder="Name oder NORAD-ID"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Satelliten filtern"
      />
      <ul className="sat-list">
        {filtered.slice(0, MAX_ITEMS).map((s) => (
          <li key={s.noradId}>
            <button className={s.noradId === selectedId ? 'active' : ''} onClick={() => onSelect(s.noradId)}>
              {s.name}
              <span className="muted">{s.noradId}</span>
            </button>
          </li>
        ))}
      </ul>
      {filtered.length > MAX_ITEMS && (
        <p className="muted">… und {filtered.length - MAX_ITEMS} weitere. Suche eingrenzen.</p>
      )}
    </section>
  );
}
