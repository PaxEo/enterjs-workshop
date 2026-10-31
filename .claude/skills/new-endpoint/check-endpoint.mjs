// Prüft einen Router auf die Projektkonventionen. Aufruf: node .claude/skills/new-endpoint/check-endpoint.mjs <name>
import { existsSync, readFileSync } from 'node:fs';

const name = process.argv[2];
if (!name) {
  console.error('Aufruf: check-endpoint.mjs <router-name>, z. B. satellites');
  process.exit(1);
}

const routeFile = `server/routes/${name}.ts`;
const testFile = `server/routes/${name}.test.ts`;
const problems = [];

if (!existsSync(routeFile)) problems.push(`${routeFile} fehlt`);
if (!existsSync(testFile)) problems.push(`${testFile} fehlt`);

if (existsSync(routeFile)) {
  const route = readFileSync(routeFile, 'utf8');
  const handlers = (route.match(/Router\.(get|post|put|patch|delete)\(/g) ?? []).length;
  const parses = (route.match(/\.safeParse\(/g) ?? []).length;
  if (parses < handlers) problems.push(`${handlers} Handler, aber nur ${parses}× safeParse – jede Eingabe validieren`);
  if (!route.includes('status(400)')) problems.push('kein 400 für ungültige Eingaben');
  if (/fetch\(|celestrak/i.test(route)) problems.push('Router ruft externe Daten ab – nur server/data.ts verwenden');

  const paths = [...route.matchAll(/Router\.\w+\('([^']+)'/g)].map((m) => m[1]);
  const firstParam = paths.findIndex((p) => p.includes('/:'));
  const lateFixed = paths.slice(firstParam + 1).filter((p) => firstParam >= 0 && !p.includes(':'));
  if (lateFixed.length) problems.push(`feste Pfade nach Parameter-Pfad registriert: ${lateFixed.join(', ')}`);
}

const app = readFileSync('server/app.ts', 'utf8');
if (!app.includes(`routes/${name}.ts`)) problems.push(`Router nicht in server/app.ts eingebunden`);

if (existsSync(testFile)) {
  const test = readFileSync(testFile, 'utf8');
  if (!test.includes('.expect(400)')) problems.push('Tests prüfen keinen 400-Fall');
}

if (problems.length) {
  console.log(`✗ ${name}`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ ${name} entspricht den Konventionen`);
