// Stop-Hook: Claude darf erst aufhören, wenn `npm run verify` grün ist.
// Läuft nur, wenn Code geändert wurde. `stop_hook_active` verhindert eine Endlosschleife:
// Ist Claude schon einmal wegen dieses Hooks weitergelaufen, lassen wir es beim zweiten Mal stoppen.
import { execSync, spawnSync } from 'node:child_process';

const input = JSON.parse(await new Response(process.stdin).text());
if (input.stop_hook_active) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();

const changed = execSync('git status --porcelain -- src server shared scripts', {
  cwd: projectDir,
  encoding: 'utf8',
}).trim();
if (!changed) process.exit(0);

const result = spawnSync('node scripts/verify.mjs', {
  cwd: projectDir,
  shell: true,
  encoding: 'utf8',
});
if (result.status === 0) process.exit(0);

console.log(
  JSON.stringify({
    decision: 'block',
    reason: `npm run verify ist nicht grün. Bitte beheben, bevor du fertig meldest:\n${result.stdout.trim()}`,
  }),
);
