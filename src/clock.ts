import { createContext, useContext, useEffect, useState } from 'react';

// Simulationsuhr mit Zeitraffer, unabhängig vom React-Rendering.
export class SimClock {
  private baseSim = Date.now();
  private baseReal = performance.now();
  private speedFactor = 1;

  now(): Date {
    return new Date(this.baseSim + (performance.now() - this.baseReal) * this.speedFactor);
  }

  get speed() {
    return this.speedFactor;
  }

  setSpeed(factor: number) {
    this.rebase(this.now().getTime());
    this.speedFactor = factor;
  }

  jumpTo(date: Date) {
    this.rebase(date.getTime());
  }

  private rebase(simMs: number) {
    this.baseSim = simMs;
    this.baseReal = performance.now();
  }
}

export const ClockContext = createContext<SimClock>(new SimClock());

export const useClock = () => useContext(ClockContext);

/** Aktuelle Simulationszeit, aktualisiert im angegebenen Intervall */
export function useSimTime(intervalMs = 1000): Date {
  const clock = useClock();
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(clock.now()), intervalMs);
    return () => clearInterval(timer);
  }, [clock, intervalMs]);
  return now;
}
