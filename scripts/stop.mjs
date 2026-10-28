// Beendet Prozesse, die noch auf den Ports des Projekts lauschen.
// Nötig vor allem unter Windows: Wird `npm run dev` hart beendet, laufen Vite und API oft weiter.
import { execSync } from 'node:child_process';

const PORTS = [3001, 5173];

function pidsOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
      return out
        .split('\n')
        .filter((line) => line.includes('LISTENING') && new RegExp(`[:.]${port}\\s`).test(line))
        .map((line) => line.trim().split(/\s+/).at(-1));
    }
    return execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).split('\n');
  } catch {
    return [];
  }
}

let stopped = 0;
for (const port of PORTS) {
  for (const pid of new Set(pidsOnPort(port).filter(Boolean))) {
    try {
      if (process.platform === 'win32') execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      else process.kill(Number(pid), 'SIGTERM');
      console.log(`Port ${port}: Prozess ${pid} beendet`);
      stopped++;
    } catch {
      console.log(`Port ${port}: Prozess ${pid} konnte nicht beendet werden`);
    }
  }
}
if (!stopped) console.log('Keine laufenden Server gefunden.');
