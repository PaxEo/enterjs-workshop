// Eigener MCP-Server: macht die Bahnlogik dieses Projekts für Claude als Werkzeug verfügbar.
// Damit beantwortet Claude „Wann sehe ich die ISS heute über Köln?“ mit dem Code, den wir selbst gebaut haben,
// statt zu raten oder im Web zu suchen.
//
// Transport: stdio. Wichtig: Nichts auf stdout schreiben außer dem Protokoll, Logs gehen nach stderr.
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { deriveOrbit } from '../shared/details.ts';
import { ISS_NORAD_ID } from '../shared/groups.ts';
import { subPointAt, toSatellite } from '../shared/orbit.ts';
import { predictPasses } from '../shared/passes.ts';
import { satelliteIndex } from '../server/data.ts';

const server = new McpServer({ name: 'sat-tracker', version: '1.0.0' });

const findSatellite = (noradId: number) => {
  const entry = satelliteIndex().get(noradId);
  const sat = entry && toSatellite(entry.omm);
  return entry && sat ? { entry, sat } : null;
};

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const failure = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

server.registerTool(
  'next_passes',
  {
    title: 'Nächste Überflüge',
    description:
      'Berechnet die Überflüge eines Satelliten (Standard: ISS) über einem Standort. ' +
      'Liefert Beginn, Höchststand, Ende (UTC, ISO-8601), maximale Elevation in Grad und den mit bloßem Auge sichtbaren Abschnitt.',
    inputSchema: {
      lat: z.number().min(-90).max(90).describe('Breitengrad des Beobachters in Grad'),
      lon: z.number().min(-180).max(180).describe('Längengrad des Beobachters in Grad'),
      noradId: z.number().int().positive().default(ISS_NORAD_ID).describe('NORAD-ID, Standard 25544 (ISS)'),
      days: z.number().int().min(1).max(10).default(3).describe('Zeitraum in Tagen ab jetzt'),
      onlyVisible: z.boolean().default(true).describe('Nur mit bloßem Auge sichtbare Überflüge'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ lat, lon, noradId, days, onlyVisible }) => {
    const found = findSatellite(noradId);
    if (!found) return failure(`Satellit ${noradId} ist im Datenbestand nicht vorhanden.`);
    const passes = predictPasses(found.sat, { lat, lon }, new Date(), { days });
    return text({
      satellite: found.sat.name,
      observer: { lat, lon },
      dataEpoch: deriveOrbit(found.entry.omm).epoch,
      passes: onlyVisible ? passes.filter((p) => p.visible) : passes,
    });
  },
);

server.registerTool(
  'find_satellite',
  {
    title: 'Satellit suchen',
    description: 'Sucht Satelliten nach Namen oder NORAD-ID im lokalen CelesTrak-Snapshot.',
    inputSchema: {
      query: z.string().trim().min(2).max(50),
      limit: z.number().int().min(1).max(20).default(10),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ query, limit }) => {
    const needle = query.toLowerCase();
    const results = [...satelliteIndex().entries()]
      .filter(([id, { omm }]) => String(omm.OBJECT_NAME).toLowerCase().includes(needle) || String(id) === query)
      .slice(0, limit)
      .map(([noradId, { omm, groups }]) => ({ noradId, name: String(omm.OBJECT_NAME), groups }));
    return text(results);
  },
);

// Ressource pro Satellit: in Claude Code per @-Erwähnung einbindbar
server.registerResource(
  'satellite',
  new ResourceTemplate('satellite://{noradId}', { list: undefined }),
  {
    title: 'Satellit',
    description: 'Bahnparameter und aktuelle Position eines Satelliten',
    mimeType: 'application/json',
  },
  async (uri, { noradId }) => {
    const found = findSatellite(Number(noradId));
    if (!found) throw new Error(`Satellit ${noradId} nicht gefunden`);
    const body = {
      noradId: Number(noradId),
      name: found.sat.name,
      orbit: deriveOrbit(found.entry.omm),
      positionNow: subPointAt(found.sat, new Date()),
    };
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(body, null, 2) }] };
  },
);

await server.connect(new StdioServerTransport());
console.error('sat-tracker MCP-Server läuft (stdio)');
