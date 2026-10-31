// Fan-out-Migration: ein headless Claude-Code-Lauf pro Legacy-Panel, begrenzt parallel.
// Ob eine Migration geklappt hat, entscheidet nicht Claudes Antwort, sondern die Prüfung danach.
//
// Aufruf:
//   node scripts/migrate-panels.mjs --dry-run          zeigt nur, welche Dateien betroffen sind
//   node scripts/migrate-panels.mjs --limit 2          migriert die ersten zwei (für die Live-Demo)
//   node scripts/migrate-panels.mjs --concurrency 4    alle, vier Läufe gleichzeitig
//
// Ergebnis: migration-report.json mit Status, Dauer, Kosten und Prüfergebnis pro Datei.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const PANEL_DIR = 'src/details/panels';
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};
const dryRun = args.includes('--dry-run');
const limit = flag('limit', Infinity);
const concurrency = flag('concurrency', 3);
// Zum Testen des Skripts ohne echte Läufe lässt sich ein anderes Programm einsetzen
const claudeBin = process.env.CLAUDE_BIN ?? 'claude';

// 1. Kandidaten finden: Panels mit eigenem fetch oder als Klassenkomponente
const isLegacy = (source) => /\bfetch\(/.test(source) || /extends Component\b/.test(source);
const candidates = readdirSync(PANEL_DIR)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => join(PANEL_DIR, f).replaceAll('\\', '/'))
  .filter((file) => isLegacy(readFileSync(file, 'utf8')))
  .slice(0, limit);

console.log(`${candidates.length} Panel(s) im alten Muster${dryRun ? ' (Probelauf)' : ''}:`);
for (const c of candidates) console.log(`  ${c}`);
if (dryRun || candidates.length === 0) process.exit(0);

const template = readFileSync('scripts/migrate-panel.prompt.md', 'utf8');

// Der Auftrag liegt in einer Datei statt im Argument: Mehrzeilige Argumente überleben
// die Windows-Shell nicht zuverlässig.
const TASK_DIR = '.claude/tmp';
mkdirSync(TASK_DIR, { recursive: true });
const quote = (arg) => `"${arg.replaceAll('"', '\\"')}"`;

// 2. Ein Lauf pro Datei: eng begrenzte Werkzeuge, Rundenlimit, JSON-Ausgabe für Kosten und Dauer
function migrate(file) {
  const taskFile = `${TASK_DIR}/migrate-${basename(file, '.tsx')}.md`;
  writeFileSync(taskFile, template.replaceAll('{{FILE}}', file));
  const claudeArgs = [
    '-p',
    `Führe den Auftrag in ${taskFile} aus.`,
    '--output-format',
    'json',
    '--max-turns',
    '15',
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    'Read',
    'Grep',
    'Glob',
    'Edit',
    `Bash(npx eslint ${file})`,
    'Bash(npx tsc --noEmit)',
  ];
  const started = Date.now();
  return new Promise((resolve) => {
    // Windows braucht die Shell, weil `claude` dort oft ein .cmd-Wrapper ist
    const child =
      process.platform === 'win32'
        ? spawn(`${claudeBin} ${claudeArgs.map(quote).join(' ')}`, { shell: true })
        : spawn(claudeBin, claudeArgs);
    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.on('close', (code) => {
      let meta = {};
      try {
        meta = JSON.parse(stdout);
      } catch {
        // Keine JSON-Antwort, z. B. bei Abbruch
      }
      resolve({
        file,
        exitCode: code,
        claudeSays: String(meta.result ?? '').trim().split('\n').at(-1) ?? '',
        costUsd: meta.total_cost_usd ?? null,
        turns: meta.num_turns ?? null,
        durationS: Math.round((Date.now() - started) / 1000),
      });
    });
  });
}

// 3. Unabhängige Prüfung pro Datei: Ist das alte Muster weg, ist die Datei lint-sauber?
function check(file) {
  const stillLegacy = isLegacy(readFileSync(file, 'utf8'));
  const lint = spawnSync(`npx eslint --quiet ${file}`, { shell: true, encoding: 'utf8' });
  return { stillLegacy, lintOk: lint.status === 0 };
}

const queue = [...candidates];
const results = [];
async function worker() {
  for (let file = queue.shift(); file; file = queue.shift()) {
    console.log(`→ ${file}`);
    const run = await migrate(file);
    const verdict = check(file);
    const ok = run.exitCode === 0 && !verdict.stillLegacy && verdict.lintOk;
    results.push({ ...run, ...verdict, ok });
    console.log(`${ok ? '✓' : '✗'} ${file} (${run.durationS} s${run.costUsd ? `, $${run.costUsd.toFixed(3)}` : ''})`);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));

// 4. Gesamtprüfung: Typen und Tests über das ganze Projekt, erst nach allen Läufen sinnvoll
const verify = spawnSync('node scripts/verify.mjs', { shell: true, encoding: 'utf8' });

const report = {
  date: new Date().toISOString(),
  ok: results.filter((r) => r.ok).length,
  failed: results.filter((r) => !r.ok).length,
  totalCostUsd: results.reduce((sum, r) => sum + (r.costUsd ?? 0), 0),
  verifyOk: verify.status === 0,
  verifyOutput: verify.stdout.trim(),
  results,
};
writeFileSync('migration-report.json', JSON.stringify(report, null, 2));

console.log(`\n${report.ok} erfolgreich, ${report.failed} fehlgeschlagen, Kosten ca. $${report.totalCostUsd.toFixed(2)}`);
console.log(report.verifyOk ? '✓ verify' : `✗ verify\n${report.verifyOutput}`);
console.log('Details: migration-report.json');
process.exit(report.failed || !report.verifyOk ? 1 : 0);
