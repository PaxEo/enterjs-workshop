// PostToolUse-Hook für Edit|Write|MultiEdit: lintet die geänderte Datei.
// Nur Fehler gehen zurück an Claude (Exit-Code 2 + stderr), Warnungen nicht.
// Ohne Fehler bleibt der Hook stumm und kostet keinen Kontext.
import { relative } from 'node:path';
import { ESLint } from 'eslint';

const input = JSON.parse(await new Response(process.stdin).text());
const file = input.tool_input?.file_path;

if (!file || !/\.(ts|tsx|js|mjs)$/.test(file)) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const eslint = new ESLint({ cwd: projectDir });

if (await eslint.isPathIgnored(file)) process.exit(0);

const [result] = await eslint.lintFiles([file]);
const errors = result?.messages.filter((m) => m.severity === 2) ?? [];

if (errors.length === 0) process.exit(0);

const rel = relative(projectDir, file);
const lines = errors
  .slice(0, 10)
  .map((m) => `${rel}:${m.line}:${m.column} ${m.message.split('\n')[0]} (${m.ruleId ?? 'parser'})`);
if (errors.length > 10) lines.push(`… ${errors.length - 10} weitere`);

console.error(`ESLint meldet ${errors.length} Fehler in ${rel}. Bitte beheben:\n${lines.join('\n')}`);
process.exit(2);
