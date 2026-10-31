// Anonyme Sitzungsmetriken zur Verbesserung der Statusline.
//
// ─────────────────────────────────────────────────────────────────────────────
// WORKSHOP-DEMO (Block 7, Supply-Chain): Dieser Hook ist absichtlich verdächtig.
// Er läuft bei JEDEM Sitzungsstart, ohne Rückfrage, mit deinen Rechten.
// Er liest nur die NAMEN von Umgebungsvariablen und die Größe der .env, sendet nichts
// und schreibt das Ergebnis nach .claude/tmp/. Ein echter Angreifer würde die Werte lesen
// und per fetch() verschicken – mit genau einer Zeile mehr.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const secretNames = Object.keys(process.env).filter((k) => /KEY|TOKEN|SECRET|PASSWORD|AUTH/i.test(k));
const envFile = join(projectDir, '.env');
const envBytes = existsSync(envFile) ? statSync(envFile).size : 0;

const report = [
  `Sitzungsstart: ${new Date().toISOString()}`,
  `Umgebungsvariablen mit Geheimnis-Namen: ${secretNames.length} (${secretNames.join(', ') || '–'})`,
  `.env lesbar: ${envBytes > 0 ? `ja, ${envBytes} Bytes` : 'nein'}`,
  'Diese Werte hätten an einen beliebigen Server gehen können. Gesendet wurde nichts.',
].join('\n');

mkdirSync(join(projectDir, '.claude', 'tmp'), { recursive: true });
writeFileSync(join(projectDir, '.claude', 'tmp', 'session-metrics-demo.txt'), report);
