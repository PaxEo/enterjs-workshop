import { GROUPS, type GroupId } from '../../shared/groups.ts';
import type { GroupStatus } from '../useSatellites.ts';

interface Props {
  active: readonly GroupId[];
  counts: Partial<Record<GroupId, number>>;
  status: (id: GroupId) => GroupStatus | undefined;
  onToggle: (id: GroupId) => void;
}

/** Umschaltbare Chips für die CelesTrak-Gruppen, Reihenfolge wie in GROUPS */
export function GroupFilter({ active, counts, status, onToggle }: Props) {
  return (
    <section aria-labelledby="group-filter-title">
      <h2 id="group-filter-title">Gruppen</h2>
      <div className="buttons chips">
        {GROUPS.map((g) => {
          const on = active.includes(g.id);
          const state = on ? status(g.id) : undefined;
          const classes = ['chip', on && 'active', state === 'loading' && 'loading', state === 'error' && 'error'];
          return (
            <button
              key={g.id}
              type="button"
              className={classes.filter(Boolean).join(' ')}
              aria-pressed={on}
              aria-busy={state === 'loading' || undefined}
              title={state === 'error' ? 'Laden fehlgeschlagen – abwählen und erneut aktivieren' : undefined}
              onClick={() => onToggle(g.id)}
            >
              {g.label}
              {counts[g.id] !== undefined && <span className="muted"> {counts[g.id]!.toLocaleString('de-DE')}</span>}
              {state === 'loading' && <span className="muted"> …</span>}
              {state === 'error' && <span aria-hidden="true"> ⚠</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
