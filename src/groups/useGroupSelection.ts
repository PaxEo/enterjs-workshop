import { useCallback, useState } from 'react';
import type { GroupId } from '../../shared/groups.ts';
import { DEFAULT_GROUPS } from '../config.ts';
import { parseGroupsParam, toGroupsParam } from './groupParams.ts';

/** Gruppenauswahl, synchron gehalten mit dem URL-Parameter `groups` */
export function useGroupSelection() {
  const [selected, setSelected] = useState<GroupId[]>(
    () => parseGroupsParam(window.location.search) ?? DEFAULT_GROUPS,
  );

  const update = useCallback((groups: GroupId[]) => {
    setSelected(groups);
    const search = toGroupsParam(window.location.search, groups);
    window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
  }, []);

  return [selected, update] as const;
}
