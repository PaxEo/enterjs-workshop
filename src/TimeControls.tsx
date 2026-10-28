import { useState } from 'react';
import { useClock, useSimTime } from './clock.ts';

const SPEEDS = [1, 10, 60, 600];

export function TimeControls() {
  const clock = useClock();
  const now = useSimTime();
  const [speed, setSpeed] = useState(clock.speed);

  const changeSpeed = (factor: number) => {
    clock.setSpeed(factor);
    setSpeed(factor);
  };

  return (
    <section>
      <h2>Zeit</h2>
      <div className="buttons">
        {SPEEDS.map((f) => (
          <button key={f} className={f === speed ? 'active' : ''} onClick={() => changeSpeed(f)}>
            {f}×
          </button>
        ))}
        <button onClick={() => clock.jumpTo(new Date())}>Jetzt</button>
      </div>
      <div className="muted" data-testid="sim-time">
        {now.toLocaleString('de-DE')}
      </div>
    </section>
  );
}
