import { Router } from 'express';
import type { GroupInfo } from '../../shared/api-types.ts';
import { GROUPS, isGroupId } from '../../shared/groups.ts';
import { loadGroup } from '../data.ts';

export const groupsRouter = Router();

groupsRouter.get('/', (_req, res) => {
  const groups: GroupInfo[] = GROUPS.map((g) => ({ ...g, count: loadGroup(g.id).length }));
  res.json(groups);
});

groupsRouter.get('/:group', (req, res) => {
  const { group } = req.params;
  if (!isGroupId(group)) {
    res.status(404).json({ error: `Unbekannte Gruppe: ${group}` });
    return;
  }
  res.json(loadGroup(group));
});
