import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faRotateLeft,
  faRotateRight,
  faTowerBroadcast,
  faVolumeHigh,
  faVolumeXmark,
  faWindowRestore,
} from "@fortawesome/free-solid-svg-icons";
import { Container, Graphics, Sprite, Texture } from "pixi.js";
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
    timeMilliseconds: Math.max(Math.random() * 5000, 200),
  };
}

function useInterference() {
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

type Velocity = {
  x: number;
  y: number;
  angular: number;
};

function useSasa() {
  const [velocity, setVelocity] = useState<Velocity>({
    x: 1,
    y: 0,
    angular: 0.01,
  });

  const [transmitting, setTransmitting] = useState<boolean>(false);
  return [transmitting, setTransmitting, velocity, setVelocity] as const;
}

type PixiSceneProps = {
  transmitting: boolean;
  velocity: Velocity;
};

const zeroVelocity: Velocity = {
  x: 0,
  y: 0,
  angular: 0,
};

function PixiScene({ transmitting, velocity }: PixiSceneProps) {
  const app = useApp();
  const [filter, _] = useState<CRTFilterWithInterference>(
    new CRTFilterWithInterference()
  );
  const sasaGraphics = useRef<Graphics>();
  const sasaContainer = useRef<Container>();
  const sasaVelocity = useRef<Velocity>(zeroVelocity);
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

    const container = (sasaContainer.current = new Container());
    app.stage.addChild(container);

    const sprite = new Sprite(Texture.from(sasa));
    sprite.anchor.set(0.5);
    container.addChild(sprite);

    container.addChild((sasaGraphics.current = new Graphics()));

    container.x = -app.screen.width / 4;
    container.y = app.screen.height / 2;

    app.ticker.add((delta) => {
      background.x = app.screen.width / 2;
      background.y = app.screen.height / 2;

      container.rotation += sasaVelocity.current.angular * delta;
      container.position.x += sasaVelocity.current.x * delta;
      container.position.y += sasaVelocity.current.y * delta;

      if (container.position.x > app.screen.width + container.width) {
        container.position.x = -container.width;
      }

      if (container.position.x < -container.width) {
        container.position.x = app.screen.width + container.width;
      }

      if (container.position.y > app.screen.height + container.height) {
        container.position.y = -container.height;
      }

      if (container.position.y < -container.height) {
        container.position.y = app.screen.height + container.height;
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
    const sasa = sasaGraphics?.current;

    if (sasa === undefined) {
      return;
    }

    sasa?.clear();

    if (transmitting) {
      sasa.beginFill(0xff0000, 0.8);
      sasa.drawCircle(-85, -275, 8);
      sasa.endFill();
    }
  }, [app, transmitting]);

  useEffect(() => {
    const sasa = sasaContainer?.current;

    if (sasa === undefined) {
      return;
    }

    sasa.rotation += velocity.angular;
    sasa.position.x += velocity.x;
    sasa.position.y += velocity.y;

    sasaVelocity.current = velocity;
  }, [app, velocity]);

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
  const [messageVisible, setMessageVisible] = useState<boolean>(true);
  const [callForHelp] = useSound(houston);
  const [transmitting, setTransmitting, velocity, setVelocity] = useSasa();

  function transmit(fn: () => void) {
    setTransmitting(true);
    fn();
    setTimeout(() => {
      setTransmitting(false);
    }, 1000);
  }

  function sendSOS() {
    transmit(() => {
      if (soundOn) {
        callForHelp();
      }
    });
  }

  function changeVelocityX(value: number) {
    transmit(() => {
      setVelocity((prev) => ({
        ...prev,
        x: prev.x + value,
      }));
    });
  }

  function changeVelocityY(value: number) {
    transmit(() => {
      setVelocity((prev) => ({
        ...prev,
        y: prev.y + value,
      }));
    });
  }

  function changeVelocityAngular(value: number) {
    transmit(() => {
      setVelocity((prev) => ({
        ...prev,
        angular: prev.angular + value,
      }));
    });
  }

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
        <PixiScene transmitting={transmitting} velocity={velocity} />
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

        {messageVisible && (
          <>
            <code className="text-5xl bg-white bg-opacity-40 backdrop-blur-[10px] rounded-lg">
              404 Not Found
            </code>
            <br />

            <div className="max-w-md bg-white bg-opacity-40 backdrop-blur-[10px] p-6 rounded-lg">
              it seems like you are looking for the{" "}
              <code>{window.location.pathname}</code> page, but it is not
              there...
              <br />
              <br />
              maybe Sasha broke something 🤔
            </div>
          </>
        )}

        <div
          className="flex flex-col space-y-3 justify-center items-center absolute right-3 bottom-3"
          style={{ color: soundOn ? "#ffffff" : "#171717" }}
        >
          <div
            className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
            style={{ color: messageVisible ? "#ffffff" : "#171717" }}
          >
            <button
              className="cursor-pointer text-2xl"
              onClick={() => setMessageVisible(!messageVisible)}
              title="Toggle message"
            >
              <FontAwesomeIcon icon={faWindowRestore} />
            </button>
          </div>

          <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
            <button
              className="cursor-pointer text-2xl"
              onClick={() => sendSOS()}
              title="S.O.S."
            >
              <FontAwesomeIcon icon={faTowerBroadcast} />
            </button>
          </div>

          <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
            <button
              className="cursor-pointer text-2xl"
              onClick={() => setSoundOn(!soundOn)}
              title="Toggle sound"
            >
              <div id="sound-muted" className={soundOn ? "hidden" : ""}>
                <FontAwesomeIcon icon={faVolumeXmark} />
              </div>
              <div id="sound-unmuted" className={soundOn ? "" : "hidden"}>
                <FontAwesomeIcon icon={faVolumeHigh} />
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-3 justify-center items-center absolute left-3 bottom-3 text-white">
          <div className="flex flex-row space-x-3 justify-center items-center">
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <button
                className="cursor-pointer text-2xl"
                onClick={() => changeVelocityAngular(-0.01)}
                title="Change angular velocity by -0.01"
              >
                <FontAwesomeIcon icon={faRotateLeft} />
              </button>
            </div>
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <button
                className="cursor-pointer text-2xl"
                onClick={() => changeVelocityY(-1)}
                title="Change Y velocity by -1"
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </button>
            </div>
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <button
                className="cursor-pointer text-2xl"
                onClick={() => changeVelocityAngular(0.01)}
                title="Change angular velocity by 0.01"
              >
                <FontAwesomeIcon icon={faRotateRight} />
              </button>
            </div>
          </div>
          <div className="flex flex-row space-x-3 justify-center items-center">
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <button
                className="cursor-pointer text-2xl"
                onClick={() => changeVelocityX(-1)}
                title="Change X velocity by -1"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <button
                className="cursor-pointer text-2xl"
                onClick={() => changeVelocityY(1)}
                title="Change Y velocity by 1"
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
            </div>
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <button
                className="cursor-pointer text-2xl"
                onClick={() => changeVelocityX(1)}
                title="Change X velocity by 1"
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
