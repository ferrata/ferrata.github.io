import { KeyboardEvent, TouchEvent, useEffect, useRef, useState } from "react";
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
import {
  Text,
  TextMetrics,
  TextStyle,
  Container,
  Graphics,
  Sprite,
  Texture,
  ITextStyle,
  Assets,
  Application,
  ICanvas,
} from "pixi.js";
import { Stage, useApp } from "@pixi/react";
import { CRTFilter, CRTFilterOptions } from "pixi-filters";
import useSound from "use-sound";

import useNoise from "../hooks/useNoise";

import dumbbellNebula from "../assets/dumbbell-nebula.jpg";
import godzillaNebula from "../assets/godzilla-nebula.jpg";
import horseheadNebula from "../assets/horsehead-nebula.jpg";
import planetaryNebula from "../assets/planetary-nebula.jpg";
import swanNebula from "../assets/swan-nebula.jpg";
import blackHole from "../assets/black-hole.jpg";
import sasa from "../assets/sasa.png";
import sasaLogo from "../assets/sasa-logo.png";
import houston from "../assets/houston.ogg";
// import { useEffectAsync } from "../hooks/useEffectAsync";

type Background = {
  entity: string;
  constellation: string;
  closestSystem: string;
  resource: string;
};

function randomBackground(): Background {
  const backgrounds = [
    {
      entity: "Dumbbell Nebula",
      constellation: "Vulpecula",
      closestSystem: "M27",
      resource: dumbbellNebula,
    },
    {
      entity: "Godzilla Nebula",
      constellation: "Orion",
      closestSystem: "IC 2118",
      resource: godzillaNebula,
    },
    {
      entity: "Horsehead Nebula",
      constellation: "Orion",
      closestSystem: "IC 434",
      resource: horseheadNebula,
    },
    {
      entity: "Planetary Nebula",
      constellation: "Aquarius",
      closestSystem: "NGC 7009",
      resource: planetaryNebula,
    },
    {
      entity: "Swan Nebula",
      constellation: "Sagittarius",
      closestSystem: "M17",
      resource: swanNebula,
    },
    {
      entity: "Black Hole",
      constellation: "Virgo",
      closestSystem: "M87",
      resource: blackHole,
    },
  ] as Background[];

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

const velocityDeltas = {
  x: 0.1,
  y: 0.1,
  angular: 0.001,
} as const;

function useSasa() {
  const [velocity, setVelocity] = useState<Velocity>(initialVelocity);

  const [transmitting, setTransmitting] = useState<boolean>(false);
  return [transmitting, setTransmitting, velocity, setVelocity] as const;
}

type PixiSceneProps = {
  transmitting: boolean;
  velocity: Velocity;
  showStats: boolean;
};

class DisplayPad {
  private borderWidth = 10;
  private graphics: Graphics;
  private text: Text;
  private style: TextStyle;

  public get width(): number {
    return this.graphics.width;
  }

  public get height(): number {
    return this.graphics.height;
  }

  constructor(
    parent: Container,
    styleOptions: Partial<ITextStyle> = {
      fontFamily: "Monaco, monospace",
      fontSize: window.innerWidth > 768 ? 16 : 12,
      fill: "white",
      stroke: "gray",
      align: "left",
    }
  ) {
    this.graphics = new Graphics();
    parent.addChild(this.graphics);

    this.style = new TextStyle(styleOptions);
    this.text = new Text("", this.style);
    parent.addChild(this.text);

    this.setPosition(0, 0);
  }

  public setPosition(x: number, y: number): DisplayPad {
    this.graphics.position.set(x, y);
    this.text.position.set(x + this.borderWidth, y + this.borderWidth);

    return this;
  }

  public clear(): DisplayPad {
    this.graphics.clear();
    this.text.text = "";

    return this;
  }

  public setText(text: string): DisplayPad {
    const logMetrics = TextMetrics.measureText(text, this.style);

    this.graphics
      .clear()
      .beginFill(0x000000, 0.5)
      .drawRect(
        0,
        0,
        logMetrics.width + this.borderWidth * 2,
        logMetrics.height + this.borderWidth * 2
      )
      .endFill();

    this.text.text = text;

    return this;
  }
}

const initialVelocity: Velocity = {
  x: 0.5,
  y: 0,
  angular: velocityDeltas.angular,
};

function setCover(image: Sprite, container: { width: number; height: number }) {
  const imageRatio = image.height / image.width;
  const screenRatio = container.height / container.width;
  if (screenRatio > imageRatio) {
    image.height = container.height;
    image.width = container.height / imageRatio;
  } else {
    image.width = container.width;
    image.height = container.width * imageRatio;
  }
  image.x = container.width / 2;
  image.y = container.height / 2;
}

function standbyScreen(
  app: Application<ICanvas>,
  filter: CRTFilterWithInterference
) {
  app.stage.filters = [filter];

  app.stage.removeChildren();

  const screen = new Sprite(Texture.WHITE);
  screen.tint = 0x161616;
  screen.width = app.screen.width;
  screen.height = app.screen.height;
  app.stage.addChild(screen);

  const timer = setInterval(() => filter.tick(100), 100);

  return () => {
    app.stage.removeChildren();
    timer && clearInterval(timer);
  };
}

function PixiScene({ transmitting, velocity, showStats }: PixiSceneProps) {
  const app = useApp();
  app.resizeTo = window;

  const [filter, _] = useState<CRTFilterWithInterference>(
    new CRTFilterWithInterference()
  );
  const sasaGraphics = useRef<Graphics>();
  const sasaContainer = useRef<Container>();
  const sasaVelocity = useRef<Velocity>(initialVelocity);
  const [background, setBackground] = useState<Background>();
  const backgroundSprite = useRef<Sprite>();
  const statsPad = useRef<DisplayPad>();
  const { soundOn, setOptions } = useNoise();
  const interference = useInterference();

  useEffect(() => {
    async function loadAssets() {
      const cleanupStandbyScreen = standbyScreen(app, filter);

      const currentBackground = randomBackground();
      const backgroundAsset = await Assets.load(currentBackground.resource);

      await new Promise((resolve) => setTimeout(resolve, 3000));
      cleanupStandbyScreen();

      backgroundSprite.current = Sprite.from(backgroundAsset);
      app.stage.addChild(backgroundSprite.current);

      backgroundSprite.current.anchor.set(0.5);
      setCover(backgroundSprite.current, app.screen);

      const container = (sasaContainer.current = new Container());
      app.stage.addChild(container);

      const sprite = new Sprite(Texture.from(sasa));
      sprite.anchor.set(0.5);
      container.addChild(sprite);

      container.addChild((sasaGraphics.current = new Graphics()));

      statsPad.current = new DisplayPad(app.stage);

      app.stage.filters = [filter];

      setBackground(currentBackground);
    }

    loadAssets();
  }, []);

  useEffect(() => {
    if (background === undefined || sasaContainer.current === undefined) {
      return;
    }
    const container = sasaContainer.current;
    const containerWidth = Math.max(370, container.width);

    const isBlackHole = background.entity === "Black Hole";

    container.scale.set(isBlackHole ? 0.01 : 1);
    container.x = isBlackHole ? app.screen.width / 4 : -containerWidth;
    container.y = app.screen.height / 2;

    let sasaAppeared = !isBlackHole;

    app.ticker.add((delta) => {
      filter.tick(delta);

      if (backgroundSprite.current !== undefined) {
        setCover(backgroundSprite.current, app.screen);
      }

      if (!sasaAppeared && container.scale.x < 1) {
        container.scale.set(container.scale.x + 0.05 * delta);

        if (container.scale.x >= 1) {
          sasaAppeared = true;
        }
      }

      container.rotation += sasaVelocity.current.angular * delta;
      container.position.x += sasaVelocity.current.x * delta;
      container.position.y += sasaVelocity.current.y * delta;

      if (container.position.x > app.screen.width + containerWidth) {
        container.position.x = -containerWidth;
      }

      if (container.position.x < -containerWidth) {
        container.position.x = app.screen.width + containerWidth;
      }

      if (container.position.y > app.screen.height + container.height) {
        container.position.y = -container.height;
      }

      if (container.position.y < -container.height) {
        container.position.y = app.screen.height + container.height;
      }
    });
  }, [background]);

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
    if (statsPad.current === undefined || background === undefined) {
      return;
    }

    statsPad.current.clear();

    if (!showStats) {
      return;
    }

    const location = background;

    const statsText = [
      "location",
      `  constellation: ${location.constellation}`,
      `  closest entity: ${location.entity}`,
      `  closest system: ${location.closestSystem}`,
      "velocity",
      `  x: ${velocity.x.toFixed(2)}`,
      `  y: ${velocity.y.toFixed(2)}`,
      `  ω: ${velocity.angular.toFixed(3)}`,
    ].join("\n");

    statsPad.current.setText(statsText);
  }, [app, showStats, velocity, background]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <></>;
}

type DisplayMode = "message" | "stats" | "none";

type ControlButtonCode =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "KeyA"
  | "KeyD";

type ButtonCode = ControlButtonCode | "KeyS" | "KeyM" | "KeyV";

function isControlButton(code: ButtonCode): code is ControlButtonCode {
  return (
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "KeyA" ||
    code === "KeyD"
  );
}

export const NotFound = () => {
  const { soundOn, setSoundOn } = useNoise();
  const [mode, setMode] = useState<DisplayMode>("message");
  const [callForHelp] = useSound(houston);
  const [transmitting, setTransmitting, velocity, setVelocity] = useSasa();
  const [buttonsDown, setButtonsDown] = useState<ButtonCode[]>([]);
  const timeouts = useRef<Map<ButtonCode, NodeJS.Timeout>>(new Map());

  function toggleMode() {
    setMode((prev) => {
      switch (prev) {
        case "message":
          return "stats";
        case "stats":
          return "none";
        case "none":
          return "message";
      }
    });
  }

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
      setVelocity((prev) => {
        return {
          ...prev,
          x: prev.x + value,
        };
      });
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

  useEffect(() => {
    const bindings: Map<ButtonCode, () => void> = new Map([
      ["ArrowUp", () => changeVelocityY(-velocityDeltas.y)],
      ["ArrowDown", () => changeVelocityY(velocityDeltas.y)],
      ["ArrowLeft", () => changeVelocityX(-velocityDeltas.x)],
      ["ArrowRight", () => changeVelocityX(velocityDeltas.x)],
      ["KeyA", () => changeVelocityAngular(-velocityDeltas.angular)],
      ["KeyD", () => changeVelocityAngular(velocityDeltas.angular)],
      ["KeyS", () => sendSOS()],
      ["KeyM", () => toggleMode()],
      ["KeyV", () => setSoundOn(!soundOn)],
    ]);

    buttonsDown.forEach((code) => {
      const fn = bindings.get(code);
      if (fn !== undefined) {
        fn();
      }
    });
  }, [buttonsDown]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const code = event.code as ButtonCode;

    if (code !== undefined) {
      event.preventDefault();
      setButtonsDown((prev) => [...prev, code]);
    }
  }

  function handleKeyUp(event: KeyboardEvent<HTMLDivElement>): void {
    setButtonsDown((prev) => prev.filter((code) => code !== event.code));
  }

  function handleMouseDown(code: ButtonCode): void {
    if (isControlButton(code)) {
      timeouts.current.set(
        code,
        setInterval(() => {
          setButtonsDown((prev) => [...prev, code]);
        }, 100)
      );
    } else {
      setButtonsDown((prev) => [...prev, code]);
    }
  }

  function handleMouseUp(code: ButtonCode): void {
    setButtonsDown((prev) => prev.filter((prevCode) => prevCode !== code));
    if (timeouts.current.has(code)) {
      clearInterval(timeouts.current.get(code));
      timeouts.current.delete(code);
    }
  }

  function handleTouchStart(
    event: TouchEvent<HTMLButtonElement>,
    code: ButtonCode
  ): void {
    event.preventDefault();

    if (timeouts.current.has(code)) {
      return;
    }

    setButtonsDown((prev) => [...prev, code]);

    if (isControlButton(code)) {
      timeouts.current.set(
        code,
        setInterval(() => {
          setButtonsDown((prev) => [...prev, code]);
        }, 200)
      );
    }
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLButtonElement>,
    code: ButtonCode
  ): void {
    event.preventDefault();

    if (timeouts.current.has(code)) {
      clearInterval(timeouts.current.get(code));
      timeouts.current.delete(code);
    }

    setButtonsDown((prev) => prev.filter((prevCode) => prevCode !== code));
  }

  function dynamicStyle(code: ButtonCode) {
    return buttonsDown.includes(code) ? { backgroundColor: "#171717" } : {};
  }

  return (
    <div
      className="app "
      role="main"
      style={{
        overflow: "hidden",
        backgroundColor: "black",
      }}
      onKeyDown={(e) => handleKeyDown(e)}
      onKeyUp={(e) => handleKeyUp(e)}
      tabIndex={0}
    >
      <Stage>
        <PixiScene
          transmitting={transmitting}
          velocity={velocity}
          showStats={mode === "stats"}
        />
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

        {mode === "message" && (
          <>
            <code className="text-5xl bg-white bg-opacity-40 backdrop-blur-[10px] rounded-lg">
              404 NotFound
            </code>
            <br />

            <div className="max-w-fit m-8 bg-white bg-opacity-40 backdrop-blur-[10px] p-6 rounded-lg">
              it seems like you are looking
              <br />
              for the <code>{window.location.pathname}</code> page,
              <br />
              but it is not there...
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
          <button
            className="cursor-pointer text-2xl"
            onMouseDown={() => handleMouseDown("KeyM")}
            onMouseUp={() => handleMouseUp("KeyM")}
            title="Toggle message (M)"
          >
            <div
              className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
              style={{ color: mode !== "none" ? "#ffffff" : "#171717" }}
            >
              <FontAwesomeIcon icon={faWindowRestore} />
            </div>
          </button>

          <button
            className="cursor-pointer text-2xl"
            onMouseDown={() => handleMouseDown("KeyS")}
            onMouseUp={() => handleMouseUp("KeyS")}
            title="Send S.O.S. (S)"
          >
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <FontAwesomeIcon icon={faTowerBroadcast} />
            </div>
          </button>

          <button
            className="cursor-pointer text-2xl"
            onMouseDown={() => handleMouseDown("KeyV")}
            onMouseUp={() => handleMouseUp("KeyV")}
            title="Toggle sound (V)"
          >
            <div className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center">
              <FontAwesomeIcon icon={soundOn ? faVolumeHigh : faVolumeXmark} />
            </div>
          </button>
        </div>

        <div className="flex flex-col space-y-3 justify-center items-center absolute left-3 bottom-3 text-white">
          <div className="flex flex-row space-x-3 justify-center items-center">
            <button
              className="cursor-pointer text-2xl"
              onMouseDown={() => handleMouseDown("KeyA")}
              onMouseUp={() => handleMouseUp("KeyA")}
              onMouseLeave={() => handleMouseUp("KeyA")}
              onTouchStart={(e) => handleTouchStart(e, "KeyA")}
              onTouchEnd={(e) => handleTouchEnd(e, "KeyA")}
              onTouchCancel={(e) => handleTouchEnd(e, "KeyA")}
              title={`Change angular velocity by -${velocityDeltas.angular} (A)`}
            >
              <div
                className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
                style={dynamicStyle("KeyA")}
              >
                <FontAwesomeIcon icon={faRotateLeft} />
              </div>
            </button>
            <button
              className="cursor-pointer text-2xl"
              onMouseDown={() => handleMouseDown("ArrowUp")}
              onMouseUp={() => handleMouseUp("ArrowUp")}
              onMouseLeave={() => handleMouseUp("ArrowUp")}
              onTouchStart={(e) => handleTouchStart(e, "ArrowUp")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowUp")}
              onTouchCancel={(e) => handleTouchEnd(e, "ArrowUp")}
              title={`Change Y velocity by -${velocityDeltas.y} (Up)`}
            >
              <div
                className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
                style={dynamicStyle("ArrowUp")}
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </div>
            </button>
            <button
              className="cursor-pointer text-2xl"
              onMouseDown={() => handleMouseDown("KeyD")}
              onMouseUp={() => handleMouseUp("KeyD")}
              onMouseLeave={() => handleMouseUp("KeyD")}
              onTouchStart={(e) => handleTouchStart(e, "KeyD")}
              onTouchEnd={(e) => handleTouchEnd(e, "KeyD")}
              onTouchCancel={(e) => handleTouchEnd(e, "KeyD")}
              title={`Change angular velocity by ${velocityDeltas.angular} (D)`}
            >
              <div
                className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
                style={dynamicStyle("KeyD")}
              >
                <FontAwesomeIcon icon={faRotateRight} />
              </div>
            </button>
          </div>
          <div className="flex flex-row space-x-3 justify-center items-center">
            <button
              className="cursor-pointer text-2xl"
              onMouseDown={() => handleMouseDown("ArrowLeft")}
              onMouseUp={() => handleMouseUp("ArrowLeft")}
              onMouseLeave={() => handleMouseUp("ArrowLeft")}
              onTouchStart={(e) => handleTouchStart(e, "ArrowLeft")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowLeft")}
              onTouchCancel={(e) => handleTouchEnd(e, "ArrowLeft")}
              title={`Change X velocity by -${velocityDeltas.x} (Left)`}
            >
              <div
                className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
                style={dynamicStyle("ArrowLeft")}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </div>
            </button>
            <button
              className="cursor-pointer text-2xl"
              onMouseDown={() => handleMouseDown("ArrowDown")}
              onMouseUp={() => handleMouseUp("ArrowDown")}
              onMouseLeave={() => handleMouseUp("ArrowDown")}
              onTouchStart={(e) => handleTouchStart(e, "ArrowDown")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowDown")}
              onTouchCancel={(e) => handleTouchEnd(e, "ArrowDown")}
              title={`Change Y velocity by ${velocityDeltas.y} (Down)`}
            >
              <div
                className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
                style={dynamicStyle("ArrowDown")}
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </div>
            </button>
            <button
              className="cursor-pointer text-2xl"
              onMouseDown={() => handleMouseDown("ArrowRight")}
              onMouseUp={() => handleMouseUp("ArrowRight")}
              onMouseLeave={() => handleMouseUp("ArrowRight")}
              onTouchStart={(e) => handleTouchStart(e, "ArrowRight")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowRight")}
              onTouchCancel={(e) => handleTouchEnd(e, "ArrowRight")}
              title={`Change X velocity by ${velocityDeltas.x} (Right)`}
            >
              <div
                className="bg-white bg-opacity-40 hover:bg-opacity-50 backdrop-blur-[10px] rounded-full w-16 h-16 flex justify-center items-center"
                style={dynamicStyle("ArrowRight")}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </div>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};
