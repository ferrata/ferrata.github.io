import { useState, useRef, useEffect } from "react";

export type Interference = {
  value: number;
  timeMilliseconds: number;
};

function randomInterference(): Interference {
  return {
    value: Math.random() > 0.2 ? Math.random() * 30 : 0,
    timeMilliseconds: Math.max(Math.random() * 5000, 200),
  };
}

export function useInterference() {
  const [interference, setInterference] = useState<Interference>(
    randomInterference()
  );
  const prevTimeMilliseconds = useRef<number>(0);

  useEffect(() => {
    const tick = 100;

    const interval = setInterval(() => {
      if (prevTimeMilliseconds.current <= 0) {
        const newInterference = randomInterference();
        prevTimeMilliseconds.current = newInterference.timeMilliseconds;
        setInterference(newInterference);
      }

      prevTimeMilliseconds.current = prevTimeMilliseconds.current - tick;
    }, tick);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return interference;
}
