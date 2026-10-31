// Statusline für Claude Code: Modell, Kontextfüllstand und Branch.
// Claude Code übergibt den Sitzungszustand als JSON auf stdin.
import { execSync } from 'node:child_process';

const input = JSON.parse(await new Response(process.stdin).text());
const model = input.model?.display_name ?? 'Claude';
let branch = '';
try {
  branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: input.workspace?.current_dir }).trim();
} catch {
  // kein Git-Repository
}
console.log(`🛰  ${model}${branch ? ` · ${branch}` : ''}`);
