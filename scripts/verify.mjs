// Führt alle Prüfungen aus und gibt nur Fehler aus, möglichst knapp.
// Das ist Absicht: Jede Zeile Ausgabe landet im Kontextfenster von Claude Code.
// Aufruf: npm run verify                 (typecheck, lint, test)
//         npm run verify -- test         (nur ausgewählte Prüfungen)
//         npm run verify -- test e2e     (inkl. Playwright, braucht Chrome)
import { spawnSync } from 'node:child_process';

const MAX_LINES = 30;

const run = (cmd) =>
  spawnSync(cmd, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0' } });

const lines = (text) => text.split('\n').map((l) => l.trimEnd()).filter(Boolean);

const checks = {
  typecheck() {
    const r = run('npx tsc --noEmit --pretty false');
    return { ok: r.status === 0, output: lines(r.stdout + r.stderr) };
  },
  lint() {
    const r = run('npx eslint . --quiet --format json');
    let results;
    try {
      results = JSON.parse(r.stdout);
    } catch {
      return { ok: r.status === 0, output: lines(r.stdout + r.stderr) };
    }
    const output = results.flatMap((file) =>
      file.messages.map(
        (m) => `${file.filePath.replace(process.cwd(), '.')}:${m.line}:${m.column} ${m.message.split('\n')[0]} (${m.ruleId})`,
      ),
    );
    return { ok: r.status === 0, output };
  },
  test() {
    const r = run('npx vitest run --reporter=json');
    const start = r.stdout.indexOf('{');
    let report;
    try {
      report = JSON.parse(r.stdout.slice(start));
    } catch {
      return { ok: r.status === 0, output: lines(r.stdout + r.stderr) };
    }
    const output = [];
    for (const file of report.testResults) {
      if (file.status === 'failed' && !file.assertionResults.some((a) => a.status === 'failed')) {
        output.push(`${file.name.replace(process.cwd(), '.')}: ${lines(file.message ?? 'Datei fehlgeschlagen')[0]}`);
      }
      for (const a of file.assertionResults.filter((a) => a.status === 'failed')) {
        output.push(`${a.fullName}`);
        output.push(`    ${lines(a.failureMessages?.[0] ?? '')[0] ?? ''}`);
      }
    }
    output.push(`${report.numPassedTests} bestanden, ${report.numFailedTests} fehlgeschlagen`);
    return { ok: r.status === 0, output };
  },
  // Langsam und braucht einen Browser: nur auf ausdrücklichen Wunsch (`npm run verify -- e2e`)
  e2e() {
    const r = run('npx playwright test --reporter=line');
    const output = lines(r.stdout + r.stderr).filter((l) => /^\s*(\d+\) |Error:|Expected|Received|\d+ (passed|failed|flaky))/.test(l));
    return { ok: r.status === 0, output };
  },
};
const OPT_IN = ['e2e'];

const only = process.argv.slice(2);
let failed = 0;

for (const [name, check] of Object.entries(checks)) {
  if (only.length ? !only.includes(name) : OPT_IN.includes(name)) continue;
  const { ok, output } = check();
  if (ok) {
    console.log(`✓ ${name}`);
    continue;
  }
  failed++;
  console.log(`✗ ${name}`);
  console.log(output.slice(0, MAX_LINES).join('\n'));
  if (output.length > MAX_LINES) console.log(`… ${output.length - MAX_LINES} weitere Zeilen gekürzt`);
}

process.exit(failed ? 1 : 0);
