// Erzeugt einen Changelog-Eintrag aus den Commits seit dem letzten Tag, headless mit Claude Code.
// Claude liefert strukturiertes JSON. Das Skript prüft es mit Zod, statt der Antwort blind zu vertrauen.
//
// Aufruf: npm run ai:changelog [-- <von-ref>]
import { execSync, spawnSync } from 'node:child_process';
import { z } from 'zod';

const from = process.argv[2] ?? execSync('git describe --tags --abbrev=0 HEAD^', { encoding: 'utf8' }).trim();
const log = execSync(`git log --no-merges --format=%h%x09%s%n%b ${from}..HEAD`, { encoding: 'utf8' }).trim();

if (!log) {
  console.log(`Keine Commits seit ${from}.`);
  process.exit(0);
}

const Changelog = z.object({
  summary: z.string().min(10).max(300),
  features: z.array(z.string()),
  fixes: z.array(z.string()),
  internal: z.array(z.string()),
});

const prompt = `Erstelle aus den folgenden Git-Commits einen Changelog-Eintrag für Nutzerinnen und Nutzer des Satelliten-Trackers.
Antworte ausschließlich mit JSON in genau dieser Form, ohne Markdown-Codeblock:
{"summary": "ein Satz", "features": ["…"], "fixes": ["…"], "internal": ["…"]}
Deutsch, je Punkt höchstens ein Satz, keine Commit-Hashes.

Commits seit ${from}:
${log}`;

// Alles Nötige steht im Prompt, eine Runde reicht. Ohne --allowedTools darf der Lauf keine Werkzeuge nutzen.
const claudeBin = process.env.CLAUDE_BIN ?? 'claude';
const result = spawnSync(`${claudeBin} -p --output-format json --max-turns 1`, {
  input: prompt,
  encoding: 'utf8',
  shell: true,
});
if (result.status !== 0) {
  console.error(`claude ist mit Code ${result.status} beendet worden:\n${result.stderr}`);
  process.exit(1);
}

const envelope = JSON.parse(result.stdout);
const raw = String(envelope.result ?? '').replace(/^```(?:json)?\s*|\s*```$/g, '');
const parsed = Changelog.safeParse(JSON.parse(raw));
if (!parsed.success) {
  console.error(`Antwort entspricht nicht dem erwarteten Format:\n${z.prettifyError(parsed.error)}\n\n${raw}`);
  process.exit(1);
}

const { summary, features, fixes, internal } = parsed.data;
const section = (title, items) => (items.length ? `\n### ${title}\n\n${items.map((i) => `- ${i}`).join('\n')}\n` : '');
console.log(`## Seit ${from}\n\n${summary}\n${section('Neu', features)}${section('Behoben', fixes)}${section('Intern', internal)}`);
console.error(`(Kosten: $${Number(envelope.total_cost_usd ?? 0).toFixed(4)})`);
