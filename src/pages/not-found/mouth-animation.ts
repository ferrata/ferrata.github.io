import { AnimatedSprite, BaseTexture, Spritesheet, Texture } from "pixi.js";

import sasaMouthSprites from "../../assets/sasa-mouth-sprites.png";

const atlasData = {
  frames: {
    "-": {
      frame: { x: 50, y: 30, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    a: {
      frame: { x: 0, y: 0, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    o: {
      frame: { x: 25, y: 0, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    s: {
      frame: { x: 50, y: 0, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    e: {
      frame: { x: 0, y: 15, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    f: {
      frame: { x: 25, y: 15, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    m: {
      frame: { x: 50, y: 15, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    t: {
      frame: { x: 0, y: 30, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
    p: {
      frame: { x: 25, y: 30, w: 25, h: 15 },
      sourceSize: { w: 25, h: 15 },
      spriteSourceSize: { x: 0, y: 0, w: 25, h: 15 },
    },
  },
  meta: {
    image: sasaMouthSprites,
    format: "RGBA8888",
    size: { w: 74, h: 45 },
    scale: "1",
  },
  animations: {
    houston: "-feostommmaeefaafaapaoopteemm--".split(""),
  },
};

export async function createMouthAnimation() {
  const spritesheet = new Spritesheet(
    BaseTexture.from(atlasData.meta.image),
    atlasData
  );

  await spritesheet.parse();
  return new MouthAnimation(spritesheet.animations.houston);
}

export class MouthAnimation extends AnimatedSprite {
  private lastFrame = 0;

  public get isOpen(): boolean {
    return this.lastFrame > 0;
  }

  constructor(frames: Texture[]) {
    super(frames);
    this.loop = false;
  }

  public startSpeaking(): MouthAnimation {
    this.play();
    return this;
  }

  public stopSpeaking(): MouthAnimation {
    this.gotoAndStop(this.lastFrame);
    return this;
  }

  public setClosed(): MouthAnimation {
    this.gotoAndStop((this.lastFrame = 0));
    return this;
  }

  public setOpen(): MouthAnimation {
    this.gotoAndStop((this.lastFrame = 6));
    return this;
  }

  public setScale(scale: number): MouthAnimation {
    this.scale.set(scale);
    return this;
  }

  public setPosition(x: number, y: number): MouthAnimation {
    this.position.set(x, y);
    return this;
  }

  public setRotation(rotation: number): MouthAnimation {
    this.rotation = rotation;
    return this;
  }

  public setAnimationSpeed(speed: number): MouthAnimation {
    this.animationSpeed = speed;
    return this;
  }
}
