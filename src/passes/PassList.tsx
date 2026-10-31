import { useEffect, useState } from 'react';
import type { PassesResponse } from '../../shared/api-types.ts';
import type { Observer } from '../../shared/orbit.ts';
import type { Pass } from '../../shared/passes.ts';
import { fetchPasses } from '../api.ts';
import { useClock, useSimTime } from '../clock.ts';
import { formatCountdown, formatPassTime, nextVisiblePass } from './format.ts';
import { usePassReminder } from './usePassReminder.ts';

interface Props {
  observer: Observer & { label: string };
  onJump: (pass: Pass) => void;
}

const NO_PASSES: Pass[] = [];

export function PassList({ observer, onJump }: Props) {
  const clock = useClock();
  const now = useSimTime();
  const [result, setResult] = useState<PassesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyVisible, setOnlyVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPasses(observer.lat, observer.lon, 7)
      .then((r) => !cancelled && setResult(r))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [observer.lat, observer.lon]);

  // Eine Minute vor dem sichtbaren Abschnitt landen, sonst vor dem Überflug selbst
  const jump = (pass: Pass) => {
    const target = pass.visible?.start ?? pass.start;
    clock.jumpTo(new Date(new Date(target).getTime() - 60_000));
    onJump(pass);
  };

  const reminder = usePassReminder(result?.passes ?? NO_PASSES);
  const next = result && nextVisiblePass(result.passes, now);
  const shown = result?.passes.filter((p) => !onlyVisible || p.visible) ?? [];

  return (
    <section aria-label="ISS-Überflüge">
      <h2>ISS über {observer.label}</h2>
      {error && <p className="warn">{error}</p>}
      {!result && !error && <p className="muted">Berechne Überflüge …</p>}
      {result && (
        <>
          <p className="countdown" data-testid="countdown">
            {next
              ? `Nächster sichtbarer Überflug ${formatCountdown(new Date(next.visible!.start).getTime() - now.getTime())}`
              : 'In den nächsten 7 Tagen kein sichtbarer Überflug'}
          </p>
          <label className="row">
            <input type="checkbox" checked={onlyVisible} onChange={(e) => setOnlyVisible(e.target.checked)} />
            <span>Nur sichtbare</span>
          </label>
          <label className="row">
            <input type="checkbox" checked={reminder.enabled} onChange={(e) => reminder.enable(e.target.checked)} />
            <span>10 min vorher erinnern</span>
          </label>
          {reminder.message && (
            <div className="toast" role="status">
              <span>{reminder.message}</span>
              <button onClick={reminder.dismiss} aria-label="Erinnerung schließen">
                ×
              </button>
            </div>
          )}
          <ul className="passes">
            {shown.map((p) => (
              <li key={p.start}>
                <button className={p.visible ? 'visible' : ''} onClick={() => jump(p)}>
                  <span>{formatPassTime(p)}</span>
                  <span className="muted">{Math.round(p.maxElevationDeg)}°</span>
                  {p.visible && <span className="badge">sichtbar</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
