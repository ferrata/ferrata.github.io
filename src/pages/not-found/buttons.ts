export type ControlButtonCode =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "KeyA"
  | "KeyD";

export type ButtonCode = ControlButtonCode | "KeyS" | "KeyM" | "KeyV";

export function isControlButton(code: ButtonCode): code is ControlButtonCode {
  return (
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "KeyA" ||
    code === "KeyD"
  );
}
