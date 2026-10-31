import { useCallback, useEffect, useRef, useState } from 'react';
import type { Pass } from '../../shared/passes.ts';
import { useSimTime } from '../clock.ts';
import { dueReminder } from './reminder.ts';
import { formatPassTime } from './format.ts';

/**
 * Erinnert vor sichtbaren Überflügen. Folgt der Simulationsuhr, damit sich das mit Zeitraffer vorführen lässt.
 * Nutzt System-Benachrichtigungen, wenn erlaubt, und zeigt die Meldung immer zusätzlich in der App.
 */
export function usePassReminder(passes: Pass[]) {
  const now = useSimTime();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const notified = useRef(new Set<string>());

  const enable = useCallback(async (on: boolean) => {
    setEnabled(on);
    if (on && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const pass = dueReminder(passes, now, notified.current);
    if (!pass) return;
    notified.current.add(pass.start);
    const text = `ISS-Überflug ${formatPassTime(pass)}, max. ${Math.round(pass.maxElevationDeg)}° – gleich geht's los!`;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Gleich sichtbar: ISS', { body: text, icon: '/favicon.svg' });
    }
    // Eine Meldung pro Überflug, ausgelöst durch das Fortschreiten der Simulationszeit
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(text);
  }, [enabled, passes, now]);

  return { enabled, enable, message, dismiss: () => setMessage(null) };
}
