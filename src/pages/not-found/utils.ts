import { Sprite } from "pixi.js";

export function setCover(
  image: Sprite,
  container: { width: number; height: number }
) {
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

export function batteryText(battery: number) {
  const cellNumber = 12;
  const cells = Math.floor((battery / 100) * cellNumber);
  const emptyCells = cellNumber - cells;

  return battery <= 0
    ? "◻".repeat(cellNumber)
    : "◼".repeat(cells) + "◻".repeat(emptyCells);
}
