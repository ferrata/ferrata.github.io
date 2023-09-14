import { useEffect, useState } from "react";
import shasa from "../assets/shasa.png";
import dumbbellNebula from "../assets/dumbbell-nebula.jpg";
import godzillaNebula from "../assets/godzilla-nebula.jpg";
import horseheadNebula from "../assets/horsehead-nebula.jpg";
import planetaryNebula from "../assets/planetary-nebula.jpg";
import swanNebula from "../assets/swan-nebula.jpg";

type ShasaState = {
  x: number;
  y: number;
  rotation: number;
  beaconOn: boolean;
};

const SpaceScene = ({ zIndex = 0 }) => {
  const [ref, setRef] = useState<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement>(new Image());
  const [position, setPosition] = useState<ShasaState>({
    x: Math.random() * 100,
    y: Math.random() * 100,
    rotation: Math.random() * 360,
    beaconOn: false,
  });

  useEffect(() => {
    const context = ref?.getContext("2d");

    if (!context) {
      return;
    }

    context.canvas.width = window.innerWidth;
    context.canvas.height = window.innerHeight;

    const resizeObserver = new ResizeObserver(() => {
      context.canvas.width = Math.round(
        context.canvas.clientWidth * devicePixelRatio
      );
      context.canvas.height = Math.round(
        context.canvas.clientHeight * devicePixelRatio
      );
    });

    resizeObserver.observe(context.canvas);

    const image = new Image();
    image.src = shasa;
    image.onload = () => {
      setImage(image);
    };

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  useEffect(() => {
    const context = ref?.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.save();

    context.translate(context.canvas.width / 2, context.canvas.height / 2);
    context.scale(0.5, 0.5);
    context.rotate((position.rotation * Math.PI) / 180);
    context.drawImage(image, position.x, position.y);

    if (position.beaconOn) {
      const beaconCoordinates = {
        x: position.x + 198,
        y: position.y + 26,
      };

      context.beginPath();
      context.arc(beaconCoordinates.x, beaconCoordinates.y, 15, 0, 2 * Math.PI);
      context.fillStyle = "red";
      context.fill();
    }

    context.restore();

    const coordinates = [
      { x: position.x, y: position.y },
      { x: position.x + image.width, y: position.y },
      { x: position.x, y: position.y + image.height },
      { x: position.x + image.width, y: position.y + image.height },
    ];

    const isOutside = coordinates.every(
      (coordinate) =>
        (coordinate.x < 0 || coordinate.x > context.canvas.width) &&
        (coordinate.y < 0 || coordinate.y > context.canvas.height)
    );

    if (isOutside) {
      if (position.x > context.canvas.width) {
        setPosition((prev) => ({
          ...prev,
          x: -context.canvas.width - image.width,
        }));
      } else if (position.x < -context.canvas.width - image.width) {
        setPosition((prev) => ({
          ...prev,
          x: context.canvas.width,
        }));
      } else if (position.y > context.canvas.height) {
        setPosition((prev) => ({
          ...prev,
          y: -context.canvas.height - image.height,
        }));
      } else if (position.y < -context.canvas.height - image.height) {
        setPosition((prev) => ({
          ...prev,
          y: context.canvas.height,
        }));
      }
    }
  }, [position]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => ({
        ...prev,
        x: prev.x + 1,
        y: prev.y - 1,
        rotation: prev.rotation - 0.05,
      }));
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [ref]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => ({
        ...prev,
        beaconOn: !prev.beaconOn,
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [ref]);

  return (
    <canvas
      className="space-scene absolute top-0 left-0"
      style={{
        zIndex: zIndex,
        filter: "brightness(0.7)",
        width: "100%",
        height: "100%",
      }}
      ref={setRef}
    />
  );
};

const randomBackground = () => {
  const backgrounds = [
    dumbbellNebula,
    godzillaNebula,
    horseheadNebula,
    planetaryNebula,
    swanNebula,
  ];
  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  return backgrounds[randomIndex];
};

export const NotFound = () => {
  return (
    <div
      className="app"
      role="main"
      style={{
        backgroundImage: `url('${randomBackground()}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <header
        className="app-header"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <SpaceScene {...{ zIndex: 0 }} />
        <code className="text-5xl" style={{ zIndex: 1 }}>
          404 Not Found
        </code>
        <br />
        <p className="w-6/12" style={{ zIndex: 1 }}>
          it seems like you are looking for the{" "}
          <code>{window.location.pathname}</code> page, but it is not there...
          <br />
          <br />
          maybe Sasha broke something 🤔
        </p>
      </header>
    </div>
  );
};
