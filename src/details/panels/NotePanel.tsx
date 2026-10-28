import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

export function NotePanel({ noradId }: { noradId: number }) {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setNote(null);
    fetch(`/api/satellites/${noradId}`)
      .then((res) => res.json())
      .then((data: SatelliteDetails) => setNote(data.note));
  }, [noradId]);

  if (!note) return null;

  // Notizen enthalten Absätze und gelegentlich Auszeichnungen, deshalb als HTML
  const html = note
    .split('\n\n')
    .map((p) => `<p>${p}</p>`)
    .join('');

  return (
    <div className="panel-card wide">
      <h3>Wissenswertes</h3>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
