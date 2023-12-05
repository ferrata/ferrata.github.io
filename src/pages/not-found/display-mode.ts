export type DisplayMode = "message" | "stats" | "none";

export function nextDisplayMode(current: DisplayMode): DisplayMode {
  switch (current) {
    case "message":
      return "stats";
    case "stats":
      return "none";
    case "none":
      return "message";
  }
}
