import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTowerBroadcast,
  faVolumeHigh,
  faVolumeXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Container, Sprite, Texture } from "pixi.js";
import { Stage, useApp } from "@pixi/react";
import { CRTFilter, CRTFilterOptions } from "pixi-filters";
import useSound from "use-sound";

import useNoise from "../hooks/useNoise";

import dumbbellNebula from "../assets/dumbbell-nebula.jpg";
import godzillaNebula from "../assets/godzilla-nebula.jpg";
import horseheadNebula from "../assets/horsehead-nebula.jpg";
import planetaryNebula from "../assets/planetary-nebula.jpg";
import swanNebula from "../assets/swan-nebula.jpg";
import sasa from "../assets/sasa.png";
import sasaLogo from "../assets/sasa-logo.png";
import houston from "../assets/houston.ogg";

function randomBackground() {
  const backgrounds = [
    dumbbellNebula,
    godzillaNebula,
    horseheadNebula,
    planetaryNebula,
    swanNebula,
  ];

  const index = Math.floor(Math.random() * backgrounds.length);

  return backgrounds[index];
}

type Interference = {
  value: number;
  timeMilliseconds: number;
};

class CRTFilterWithInterference extends CRTFilter {
  constructor(options?: Partial<CRTFilterOptions>) {
    super(options);

    this.vignetting = 0;
  }

  public tick(deltaTime: number) {
    this.seed = Math.random();
    this.noise = Math.random() * 0.2;

    this.time += 0.01 * deltaTime;
  }
}

function resize() {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    return;
  }

  canvas.style.width = `${window.innerWidth - 1}px`;
  canvas.style.height = `${window.innerHeight - 1}px`;
}

function randomInterference(): Interference {
  return {
    value: Math.random() > 0.2 ? Math.random() * 30 : 0,
    timeMilliseconds: Math.max(Math.random() * 1000, 100),
  };
}

function useInterference() {
  const [interference, setInterference] = useState<Interference>(
    randomInterference()
  );
  const prevTimeMilliseconds = useRef<number>(0);

  useEffect(() => {
    const tick = 1;

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

function PixiScene() {
  const app = useApp();
  const [filter, _] = useState<CRTFilterWithInterference>(
    new CRTFilterWithInterference()
  );
  const { soundOn, setOptions } = useNoise();
  const interference = useInterference();

  useEffect(() => {
    app.stage.filters = [filter];

    app.stage.removeChildren();

    const background = new Sprite(Texture.from(randomBackground()));
    app.stage.addChild(background);

    background.scale.set(0.7);
    background.anchor.set(0.5);
    background.x = app.screen.width / 2;
    background.y = app.screen.height / 2;

    const sasaContainer = new Container();
    app.stage.addChild(sasaContainer);

    const texture = Texture.from(sasa);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sasaContainer.addChild(sprite);

    sasaContainer.x = -app.screen.width / 4;
    sasaContainer.y = app.screen.height / 2;

    app.ticker.add((delta) => {
      background.x = app.screen.width / 2;
      background.y = app.screen.height / 2;

      sasaContainer.rotation -= 0.01 * delta;
      sasaContainer.position.x += 1 * delta;

      if (sasaContainer.position.x > app.screen.width + sasaContainer.width) {
        sasaContainer.position.x = -sasaContainer.width;
      }

      filter.tick(delta);
    });

    app.resizeTo = window;
  }, [app]);

  useEffect(() => {
    filter.enabled = interference.value > 0;
    filter.lineWidth = interference.value;
  }, [app, filter, interference]);

  useEffect(() => {
    const minFrequency = 1000;
    const maxFrequency = 42000;
    const frequency = Math.max(
      Math.min(
        interference.value > 0
          ? Math.floor(maxFrequency / interference.value)
          : minFrequency,
        maxFrequency
      ),
      minFrequency
    );

    const noiseType =
      Math.random() > 0.5 ? "white" : Math.random() > 0.5 ? "brown" : "pink";

    setOptions({
      type: noiseType,
      frequency: 0,
      baseFrequency: frequency,
      octaves: 0,
    });
  }, [soundOn, interference]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <></>;
}

export const NotFound = () => {
  const { soundOn, setSoundOn } = useNoise();
  const [callForHelp] = useSound(houston);

  // return <button onClick={play}>Boop!</button>;  }

  return (
    <div
      className="app"
      role="main"
      style={{
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <PixiScene />
      </Stage>
      <header
        className="app-header absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0)",
          color: "#171717",
        }}
      >
        <img
          src={sasaLogo}
          alt="SASA Logo"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: "120px",
            height: "auto",
            opacity: 0.7,
          }}
        />
        <code className="text-5xl bg-white bg-opacity-40 backdrop-blur-[10px] rounded-lg">
          404 Not Found
        </code>
        <br />

        <div className="max-w-md bg-white bg-opacity-40 backdrop-blur-[10px] p-6 rounded-lg">
          it seems like you are looking for the{" "}
          <code>{window.location.pathname}</code> page, but it is not there...
          <br />
          <br />
          maybe Sasha broke something 🤔
        </div>

        <div
          className="bg-white bg-opacity-40 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            color: soundOn ? "#ffffff" : "#171717",
          }}
        >
          <button
            className="cursor-pointer text-2xl"
            onClick={() => setSoundOn(!soundOn)}
          >
            <div id="sound-muted" className={soundOn ? "hidden" : ""}>
              <FontAwesomeIcon icon={faVolumeXmark} />
            </div>
            <div id="sound-unmuted" className={soundOn ? "" : "hidden"}>
              <FontAwesomeIcon icon={faVolumeHigh} />
            </div>
          </button>
        </div>

        <div
          className="bg-white bg-opacity-40 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: soundOn ? "#ffffff" : "#171717",
          }}
        >
          <button
            className="cursor-pointer text-2xl"
            onClick={() => soundOn && callForHelp()}
          >
            <FontAwesomeIcon icon={faTowerBroadcast} />
          </button>
        </div>
      </header>
    </div>
  );
};
