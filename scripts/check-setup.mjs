// Prüft, ob alles für den Workshop bereit ist. Aufruf: npm run check-setup
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

const results = [];
const check = (label, fn) => {
  try {
    const detail = fn();
    results.push({ ok: true, label, detail });
  } catch (err) {
    results.push({ ok: false, label, detail: err.message });
  }
};
const run = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

check('Node.js ≥ 22', () => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) throw new Error(`gefunden: ${process.version}`);
  return process.version;
});
check('Git', () => run('git --version'));
check('Claude Code', () => {
  try {
    return run('claude --version');
  } catch {
    throw new Error('nicht gefunden – siehe https://docs.claude.com/claude-code');
  }
});
check('Abhängigkeiten installiert', () => {
  if (!existsSync('node_modules/.package-lock.json')) throw new Error('bitte `npm install` ausführen');
  return 'ok';
});
check('Bahndaten vorhanden', () => {
  if (!existsSync('data/stations.json')) throw new Error('data/ fehlt – Repo vollständig klonen');
  return 'ok';
});
check('.env angelegt', () => {
  if (existsSync('.env')) return 'vorhanden';
  copyFileSync('.env.example', '.env');
  return 'aus .env.example erstellt';
});

for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.label}${r.detail ? ` – ${r.detail}` : ''}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} Punkt(e) offen.` : '\nAlles bereit. Weiter mit `npm run dev` und `npm run verify`.');
process.exit(failed ? 1 : 0);
