import { useEffect, useState } from 'react';
import { advanceTime, clampTime } from './timeline';
export function useTimeline(duration: number) {
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  useEffect(() => {
    if (!playing) return;
    let frame: number, last: number | undefined;
    const tick = (now: number) => {
      if (last !== undefined)
        setTime((t) =>
          advanceTime(t, Math.min((now - last!) / 1000, 0.25), speed, duration),
        );
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, duration]);
  useEffect(() => {
    if (time >= duration) setPlaying(false);
  }, [time, duration]);
  return {
    time,
    playing,
    speed,
    setSpeed,
    seek: (t: number) => setTime(clampTime(t, duration)),
    reset: () => {
      setTime(0);
      setPlaying(false);
    },
    toggle: () => {
      if (time >= duration) setTime(0);
      setPlaying((p) => !p);
    },
  };
}
