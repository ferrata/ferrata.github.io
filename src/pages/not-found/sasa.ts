import { useState } from "react";

export type Velocity = {
  x: number;
  y: number;
  angular: number;
};

export function useSasa(initialVelocity: Velocity) {
  const [velocity, setVelocity] = useState<Velocity>(initialVelocity);
  const [transmitting, setTransmitting] = useState<boolean>(false);
  const [battery, setBattery] = useState<number>(100);
  return {
    transmitting,
    setTransmitting,
    velocity,
    setVelocity,
    battery,
    setBattery,
  } as const;
}
