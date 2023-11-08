import { Application, Container, Sprite, Texture } from "pixi.js";
import { Stage, useApp } from "@pixi/react";
import { CRTFilter, CRTFilterOptions } from "pixi-filters";
import { useEffect } from "react";

import dumbbellNebula from "../assets/dumbbell-nebula.jpg";
import godzillaNebula from "../assets/godzilla-nebula.jpg";
import horseheadNebula from "../assets/horsehead-nebula.jpg";
import planetaryNebula from "../assets/planetary-nebula.jpg";
import swanNebula from "../assets/swan-nebula.jpg";
import sasa from "../assets/sasa.png";
import sasaLogo from "../assets/sasa-logo.png";

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
  time: number;
};

class CRTFilterWithInterference extends CRTFilter {
  interference: Interference = this.randomInterference();

  constructor(options?: Partial<CRTFilterOptions>) {
    super(options);

    this.vignetting = 0;
  }

  public tick(deltaTime: number) {
    this.time += 0.01 * deltaTime;
    this.noise = Math.random() * 0.2;
    this.seed = Math.random();

    this.enabled = this.interference.value > 0;
    this.lineWidth = this.interference.value;

    if (this.interference.time > 0) {
      this.interference.time -= 0.1 * deltaTime;
    }

    if (this.interference.time <= 0) {
      this.interference = {
        ...this.randomInterference(),
      };
    }
  }

  randomInterference(): Interference {
    return {
      value: Math.random() > 0.2 ? Math.random() * 30 : 0,
      time: Math.max(Math.random() * 10, 2),
    };
  }
}

function run(app: Application, filter: CRTFilterWithInterference) {
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
    sasaContainer.rotation -= 0.01 * delta;
    sasaContainer.position.x += 1 * delta;

    if (sasaContainer.position.x > app.screen.width + sasaContainer.width) {
      sasaContainer.position.x = -sasaContainer.width;
    }

    filter.tick(delta);
  });
}

function resize() {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    return;
  }

  canvas.style.width = `${window.innerWidth - 1}px`;
  canvas.style.height = `${window.innerHeight - 1}px`;
}

function PixiApp() {
  let app = useApp();

  useEffect(() => {
    const filter = new CRTFilterWithInterference();
    app.stage.filters = [filter];

    app.stage.removeChildren();

    try {
      run(app, filter);
    } catch (err) {
      console.error(err);
    }

    app.resizeTo = window;
  }, [app]);

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
        <PixiApp />
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
      </header>
    </div>
  );
};
