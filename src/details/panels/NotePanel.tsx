import { useSatelliteDetails } from '../useSatelliteDetails.ts';

/** Entfernt Auszeichnungen aus Fremdtexten. Gerendert wird ausschließlich als Text. */
function toPlainParagraphs(note: string): string[] {
  const doc = new DOMParser().parseFromString(note, 'text/html');
  // Versteckte Elemente gehören nicht zur sichtbaren Notiz, sie sind ein bekannter Injection-Trick
  doc.querySelectorAll('.sr-only, [hidden], [style*="display:none"], [style*="display: none"]').forEach((el) => el.remove());
  return (doc.body.textContent ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function NotePanel({ noradId }: { noradId: number }) {
  const { data } = useSatelliteDetails(noradId);
  if (!data?.note) return null;

  return (
    <div className="panel-card wide">
      <h3>Wissenswertes</h3>
      {toPlainParagraphs(data.note).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
