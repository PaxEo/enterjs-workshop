import { describe, expect, it } from 'vitest';
import { parseGroupsParam, toGroupsParam } from './groupParams.ts';

describe('parseGroupsParam', () => {
  it('liest gültige Gruppen', () => {
    expect(parseGroupsParam('?groups=stations,weather')).toEqual(['stations', 'weather']);
  });

  it('liefert null, wenn der Parameter fehlt', () => {
    expect(parseGroupsParam('?foo=bar')).toBeNull();
  });

  it('liefert eine leere Liste bei leerem Parameter', () => {
    expect(parseGroupsParam('?groups=')).toEqual([]);
  });

  it('ignoriert unbekannte Gruppen', () => {
    expect(parseGroupsParam('?groups=stations,ufos')).toEqual(['stations']);
  });

  it('entfernt Duplikate', () => {
    expect(parseGroupsParam('?groups=gps-ops,gps-ops')).toEqual(['gps-ops']);
  });
});

describe('toGroupsParam', () => {
  it('schreibt die Auswahl lesbar mit Kommas', () => {
    expect(toGroupsParam('', ['stations', 'weather'])).toBe('?groups=stations,weather');
  });

  it('behält andere Parameter', () => {
    expect(toGroupsParam('?debug=1', ['visual'])).toBe('?debug=1&groups=visual');
  });
});
