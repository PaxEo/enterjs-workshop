// PreToolUse-Hook für Edit|Write|MultiEdit.
// - fixtures/ ist immer geschützt: Referenzdaten von außen dürfen nicht „passend gemacht“ werden.
// - Bestehende Testdateien sind geschützt, solange .claude/tests-locked existiert
//   (an/aus mit `npm run tests:lock` bzw. `npm run tests:unlock`, z. B. während eines Bugfixes).
// Antwortet mit JSON statt Exit-Code, damit Claude eine Begründung bekommt.
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const input = JSON.parse(await new Response(process.stdin).text());
const file = input.tool_input?.file_path;
if (!file) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const rel = relative(projectDir, file).split(sep).join('/');

const deny = (reason) => {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
};

if (rel.startsWith('fixtures/')) {
  deny(
    `${rel} enthält externe Referenzdaten und darf nicht geändert werden. ` +
      'Wenn ein Test gegen diese Daten fehlschlägt, liegt der Fehler im Code.',
  );
}

const isTest = /\.test\.(ts|tsx)$/.test(rel);
const locked = existsSync(join(projectDir, '.claude', 'tests-locked'));
if (isTest && locked && existsSync(file)) {
  deny(
    `Tests sind gesperrt (.claude/tests-locked): ${rel} darf nicht geändert werden. ` +
      'Behebe die Ursache im Produktivcode. Neue Testdateien sind erlaubt.',
  );
}

process.exit(0);
