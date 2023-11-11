import { useRef, useState, useEffect } from "react";
import * as Tone from "tone";

type NoiseType = "white" | "brown" | "pink";

type NoiseOptions = {
  type: NoiseType;
  frequency: number;
  baseFrequency: number;
  octaves: number;
};

export default function useNoise() {
  const filter = useRef<Tone.AutoFilter | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const [options, setOptions] = useState<NoiseOptions>({
    type: "white",
    frequency: 0,
    baseFrequency: 0,
    octaves: 0,
  });

  useEffect(() => {
    const noise = new Tone.Noise({
      type: options.type,
      volume: -50,
    });

    filter.current = new Tone.AutoFilter({
      frequency: options.frequency,
      baseFrequency: options.baseFrequency,
      octaves: options.octaves,
    })
      .toDestination()
      .start();

    noise.connect(filter.current).start();

    return () => {
      noise.dispose();
      filter.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!options) {
      return;
    }

    filter.current?.set({
      frequency: options.frequency,
      baseFrequency: options.baseFrequency,
      octaves: options.octaves,
    });
  }, [options]);

  useEffect(() => {
    if (soundOn) {
      Tone.start().catch((err) => {
        console.log(err);
      });

      Tone.Destination.mute = false;
    } else {
      Tone.Destination.mute = true;
    }
  }, [soundOn]);

  return { soundOn, setSoundOn, setOptions };
}
