import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GroupId } from '../shared/groups.ts';
import type { Satellite } from '../shared/orbit.ts';
import {
  hasLargeGroup,
  parseGroupsParam,
  selectionAfterChange,
  serializeGroupsParam,
  unionSatellites,
} from './groupFilter.ts';
import { GroupFilter } from './satellites/GroupFilter.tsx';

const sat = (noradId: number) => ({ noradId, name: `SAT ${noradId}` }) as Satellite;
const DEFAULTS: GroupId[] = ['stations', 'visual'];

describe('parseGroupsParam', () => {
  it('nutzt die Standardgruppen, wenn der Parameter fehlt', () => {
    expect(parseGroupsParam('', DEFAULTS)).toEqual(['stations', 'visual']);
    expect(parseGroupsParam('?foo=1', DEFAULTS)).toEqual(['stations', 'visual']);
  });

  it('liefert bei leerem Parameter eine leere Auswahl', () => {
    expect(parseGroupsParam('?groups=', DEFAULTS)).toEqual([]);
  });

  it('ignoriert unbekannte IDs und fasst Duplikate zusammen', () => {
    expect(parseGroupsParam('?groups=stations,foo,stations', DEFAULTS)).toEqual(['stations']);
  });

  it('liefert bei nur unbekannten IDs eine leere Auswahl statt des Standards', () => {
    expect(parseGroupsParam('?groups=foo', DEFAULTS)).toEqual([]);
  });

  it('sortiert in die Reihenfolge von GROUPS', () => {
    expect(parseGroupsParam('?groups=active,weather,stations', DEFAULTS)).toEqual(['stations', 'weather', 'active']);
  });
});

describe('serializeGroupsParam', () => {
  it('schreibt kommagetrennt in GROUPS-Reihenfolge', () => {
    expect(serializeGroupsParam('', ['weather', 'stations'])).toBe('?groups=stations,weather');
  });

  it('schreibt eine leere Auswahl als leeren Parameter', () => {
    expect(serializeGroupsParam('', [])).toBe('?groups=');
  });

  it('lässt andere Parameter stehen und ersetzt den alten Wert', () => {
    expect(serializeGroupsParam('?debug=1&groups=foo', ['gps-ops'])).toBe('?debug=1&groups=gps-ops');
  });

  it('ergibt beim erneuten Einlesen dieselbe Auswahl', () => {
    const groups: GroupId[] = ['visual', 'starlink'];
    expect(parseGroupsParam(serializeGroupsParam('', groups), DEFAULTS)).toEqual(groups);
  });
});

describe('unionSatellites', () => {
  const loaded = { stations: [sat(1), sat(2)], visual: [sat(2), sat(3)], weather: [sat(4)] };

  it('vereinigt nur die aktiven Gruppen und zeigt jeden Satelliten einmal', () => {
    const ids = unionSatellites(['stations', 'visual'], loaded).map((s) => s.noradId);
    expect(ids.sort()).toEqual([1, 2, 3]);
  });

  it('ignoriert aktive, noch nicht geladene Gruppen', () => {
    expect(unionSatellites(['gps-ops'], loaded)).toEqual([]);
  });

  it('liefert bei leerer Auswahl nichts', () => {
    expect(unionSatellites([], loaded)).toEqual([]);
  });
});

describe('selectionAfterChange', () => {
  const loaded = { stations: [sat(25544), sat(1)], visual: [sat(25544), sat(2)] };

  it('hebt die Auswahl auf, wenn der Satellit in keiner aktiven Gruppe mehr liegt', () => {
    expect(selectionAfterChange(1, ['visual'], loaded)).toBeNull();
  });

  it('behält die Auswahl, wenn eine andere aktive Gruppe den Satelliten enthält', () => {
    expect(selectionAfterChange(25544, ['visual'], loaded)).toBe(25544);
  });

  it('hebt die Auswahl bei leerer Gruppenwahl auf', () => {
    expect(selectionAfterChange(25544, [], loaded)).toBeNull();
  });

  it('bleibt ohne Auswahl bei null', () => {
    expect(selectionAfterChange(null, ['stations'], loaded)).toBeNull();
  });
});

describe('hasLargeGroup', () => {
  const counts = { stations: 21, starlink: 11124, active: 16755 };

  it('erkennt große Gruppen ab dem Schwellwert', () => {
    expect(hasLargeGroup(['stations', 'starlink'], counts)).toBe(true);
    expect(hasLargeGroup(['active'], counts)).toBe(true);
  });

  it('meldet nichts ohne große Gruppe oder ohne bekannte Anzahl', () => {
    expect(hasLargeGroup(['stations'], counts)).toBe(false);
    expect(hasLargeGroup(['starlink'], {})).toBe(false);
  });
});

describe('GroupFilter', () => {
  const render = (active: GroupId[], status: (id: GroupId) => 'loading' | 'loaded' | 'error' | undefined) =>
    renderToStaticMarkup(
      createElement(GroupFilter, { active, counts: { stations: 21, starlink: 11124 }, status, onToggle: () => {} }),
    );

  it('zeigt alle Gruppen in GROUPS-Reihenfolge mit aria-pressed und Anzahl', () => {
    const html = render(['stations'], () => 'loaded');
    expect(html.match(/<button/g)).toHaveLength(6);
    expect(html.indexOf('Raumstationen')).toBeLessThan(html.indexOf('Alle aktiven'));
    expect(html).toMatch(/aria-pressed="true"[^>]*>Raumstationen<span class="muted"> 21</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Starlink<span class="muted"> 11\.124</);
  });

  it('markiert ladende und fehlgeschlagene aktive Gruppen', () => {
    const html = render(['stations', 'weather'], (id) => (id === 'stations' ? 'loading' : 'error'));
    expect(html).toMatch(/class="chip active loading"[^>]*aria-busy="true"/);
    expect(html).toContain('class="chip active error"');
  });
});
