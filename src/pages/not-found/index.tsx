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
  Container,
  Graphics,
  Sprite,
  Texture,
  Assets,
  Application,
  ICanvas,
} from "pixi.js";
import { Stage, useApp } from "@pixi/react";
import useSound from "use-sound";

import useNoise from "../../hooks/use-noise";

import sasa from "../../assets/sasa.png";
import sasaLogo from "../../assets/sasa-logo.png";
import houston from "../../assets/houston.ogg";

import { Background, randomBackground } from "./background";
import { batteryText, setCover } from "./utils";
import { MouthAnimation, createMouthAnimation } from "./mouth-animation";
import { ButtonCode, isControlButton } from "./buttons";
import { useInterference } from "./interference";
import { Velocity, useSasa } from "./sasa";
import { DisplayPad } from "./display-pad";
import { DisplayMode, nextDisplayMode } from "./display-mode";
import { CRTFilter, CRTFilterOptions } from "pixi-filters";

const velocityDeltas = {
  x: 0.1,
  y: 0.1,
  angular: 0.001,
} as const;

const initialVelocity: Velocity = {
  x: 0.5,
  y: 0,
  angular: velocityDeltas.angular,
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

type SceneProps = {
  transmitting: boolean;
  velocity: Velocity;
  battery: number;
  showStats: boolean;
  speaking: boolean;
};

function Scene({
  transmitting,
  velocity,
  battery,
  showStats,
  speaking,
}: SceneProps) {
  const app = useApp();

  const [filter, _] = useState(new CRTFilterWithInterference());
  const sasaGraphics = useRef<Graphics>();
  const sasaContainer = useRef<Container>();
  const sasaVelocity = useRef<Velocity>(initialVelocity);
  const [background, setBackground] = useState<Background>();
  const backgroundSprite = useRef<Sprite>();
  const sasaMouth = useRef<MouthAnimation>();
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

      const mouth = (await createMouthAnimation())
        .setScale(1.5)
        .setPosition(-70, -72)
        .setRotation(-30 * (Math.PI / 180))
        .setAnimationSpeed(0.4);

      container.addChild((sasaMouth.current = mouth));

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
    const sasa = sasaMouth?.current;

    if (sasa === undefined) {
      return;
    }

    if (speaking) {
      sasa.startSpeaking();
    } else {
      sasa.stopSpeaking();
    }
  }, [app, speaking]);

  useEffect(() => {
    const sasa = sasaContainer?.current;
    const mouth = sasaMouth?.current;

    if (sasa === undefined || mouth === undefined) {
      return;
    }

    sasa.rotation += velocity.angular;
    sasa.position.x += velocity.x;
    sasa.position.y += velocity.y;

    sasaVelocity.current = velocity;

    if (!mouth.isOpen && Math.abs(velocity.angular) > 0.05) {
      mouth.setOpen();
    } else if (mouth.isOpen && Math.abs(velocity.angular) < 0.05) {
      mouth.setClosed();
    }
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
      "battery",
      `  source: PV cells`,
      `  status: ${batteryText(battery)}`,
      `          ${battery.toFixed(1)}% ${battery < 100 ? "(charging)" : ""}`,
    ].join("\n");

    statsPad.current.setText(statsText);
  }, [app, showStats, velocity, battery, background]);

  useEffect(() => {
    const resize = () =>
      app.renderer.resize(window.innerWidth, window.innerHeight);

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
  const [mode, setMode] = useState<DisplayMode>("message");
  const [callForHelp] = useSound(houston);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const {
    transmitting,
    setTransmitting,
    velocity,
    setVelocity,
    battery,
    setBattery,
  } = useSasa(initialVelocity);
  const [buttonsDown, setButtonsDown] = useState<ButtonCode[]>([]);
  const timeouts = useRef<Map<ButtonCode, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      setBattery((prev) => Math.min(100, prev + 0.1));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  function toggleMode() {
    setMode((prev) => nextDisplayMode(prev));
  }

  function transmit(fn: () => void) {
    if (battery <= 0) {
      return;
    }

    setBattery((prev) => Math.max(0, prev - 0.1));

    setTransmitting(true);
    fn();
    setTimeout(() => {
      setTransmitting(false);
    }, 1000);
  }

  function sendSOS() {
    transmit(() => {
      if (soundOn) {
        setSpeaking(true);
        setTimeout(() => {
          setSpeaking(false);
        }, 1000);
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
    if (battery <= 0) {
      return;
    }

    const code = event.code as ButtonCode;

    if (code !== undefined) {
      event.preventDefault();
      setButtonsDown((prev) => [...prev, code]);
    }
  }

  function handleKeyUp(event: KeyboardEvent<HTMLDivElement>): void {
    setButtonsDown((prev) => prev.filter((code) => code !== event.code));
  }

  function handleButtonDownStart(code: ButtonCode, interval: number): void {
    if (battery <= 0) {
      return;
    }

    if (timeouts.current.has(code)) {
      return;
    }

    setButtonsDown((prev) => [...prev, code]);

    if (isControlButton(code)) {
      timeouts.current.set(
        code,
        setInterval(() => {
          setButtonsDown((prev) => [...prev, code]);
        }, interval)
      );
    }
  }

  function handleButtonDownEnd(code: ButtonCode): void {
    if (timeouts.current.has(code)) {
      clearInterval(timeouts.current.get(code));
      timeouts.current.delete(code);
    }

    setButtonsDown((prev) => prev.filter((prevCode) => prevCode !== code));
  }

  function handleMouseDown(code: ButtonCode): void {
    handleButtonDownStart(code, 250);
  }

  function handleMouseUp(code: ButtonCode): void {
    handleButtonDownEnd(code);
  }

  function handleTouchStart(
    event: TouchEvent<HTMLButtonElement>,
    code: ButtonCode
  ): void {
    event.preventDefault();
    handleButtonDownStart(code, 200);
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLButtonElement>,
    code: ButtonCode
  ): void {
    event.preventDefault();
    handleButtonDownEnd(code);
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
      <Stage
        style={{ position: "fixed" }}
        width={window.innerWidth}
        height={window.innerHeight}
      >
        <Scene
          transmitting={transmitting}
          velocity={velocity}
          battery={battery}
          showStats={mode === "stats"}
          speaking={speaking}
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
