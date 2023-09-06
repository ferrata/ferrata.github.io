interface CanvasRenderingContext2D {
  dot(x: number, y: number, radius: number): void;

  circle(x: number, y: number, radius: number): void;

  polygon(coordinates: { x: number; y: number }[]): void;

  text(
    x: number,
    y: number,
    text: string,
    options?: {
      font?: string;
      fontSize?: number;
      color?: string;
      alpha?: number;
      backgroundColor?: string;
      backgroundAlpha?: number;
    }
  ): void;
}

CanvasRenderingContext2D.prototype.dot = function (
  x: number,
  y: number,
  radius: number
) {
  this.beginPath();
  this.arc(x, y, radius, 0, 2 * Math.PI);
  this.fill();
};

CanvasRenderingContext2D.prototype.circle = function (
  x: number,
  y: number,
  radius: number
) {
  this.beginPath();
  this.arc(x, y, radius, 0, 2 * Math.PI);
  this.stroke();
};

CanvasRenderingContext2D.prototype.polygon = function (
  coordinates: { x: number; y: number }[]
) {
  this.beginPath();
  this.moveTo(coordinates[0].x, coordinates[0].y);
  coordinates.slice(1).forEach((coordinate) => {
    this.lineTo(coordinate.x, coordinate.y);
  });
  this.closePath();
  this.stroke();
};

CanvasRenderingContext2D.prototype.text = function (
  x: number,
  y: number,
  text: string,
  options: {
    font?: string;
    fontSize?: number;
    color?: string;
    alpha?: number;
    backgroundColor?: string;
    backgroundAlpha?: number;
  } = {}
) {
  let { font, fontSize, color, backgroundColor } = options;
  fontSize = fontSize || 20;
  font = font || "Arial";
  color = color || "black";
  backgroundColor = backgroundColor || "white";

  this.font = `${fontSize}px ${font}`;

  // since canvas does not support multiline text, we need to do it manually
  // find the width for the longest line
  const lines = text.split("\n");
  const textWidth = Math.max(
    ...lines.map((line) => this.measureText(line).width)
  );
  const textHeight = fontSize * lines.length;

  const oldFillStyle = this.fillStyle;
  const oldAlpha = this.globalAlpha;

  // make sure the text is not drawn outside the canvas
  let effectiveX = x;
  let effectiveY = y;
  if (x + textWidth > this.canvas.width) {
    effectiveX = this.canvas.width - textWidth - 10;
  }
  if (y + textHeight > this.canvas.height) {
    effectiveY = this.canvas.height - textHeight - 10;
  }

  try {
    this.fillStyle = backgroundColor;
    this.globalAlpha = options.backgroundAlpha || 0.5;
    this.fillRect(effectiveX - 2, effectiveY, textWidth + 4, textHeight + 6);

    this.fillStyle = color;
    this.globalAlpha = options.alpha || 1;
    lines.forEach((line, index) => {
      this.fillText(
        line,
        effectiveX,
        effectiveY + fontSize! * (index + 1),
        textWidth
      );
    });
  } finally {
    this.fillStyle = oldFillStyle;
    this.globalAlpha = oldAlpha;
  }
};
