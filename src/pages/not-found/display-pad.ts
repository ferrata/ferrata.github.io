import {
  Text,
  TextMetrics,
  Graphics,
  TextStyle,
  Container,
  ITextStyle,
} from "pixi.js";

export class DisplayPad {
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
