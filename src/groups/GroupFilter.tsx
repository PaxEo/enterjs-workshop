import { useEffect, useState } from 'react';
import type { GroupInfo } from '../../shared/api-types.ts';
import type { GroupId } from '../../shared/groups.ts';
import { fetchGroups } from '../api.ts';

const LARGE_GROUP = 1000;

interface Props {
  selected: GroupId[];
  loading: GroupId[];
  onChange: (groups: GroupId[]) => void;
}

export function GroupFilter({ selected, loading, onChange }: Props) {
  const [groups, setGroups] = useState<GroupInfo[]>([]);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  const toggle = (id: GroupId) =>
    onChange(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);

  return (
    <section>
      <h2>Gruppen</h2>
      {groups.map((g) => (
        <label key={g.id} className="row">
          <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} />
          <span>{g.label}</span>
          <span className="muted">
            {loading.includes(g.id) ? 'lädt …' : g.count.toLocaleString('de-DE')}
            {g.count > LARGE_GROUP && ' · groß'}
          </span>
        </label>
      ))}
    </section>
  );
}
