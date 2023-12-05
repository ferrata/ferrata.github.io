import dumbbellNebula from "../../assets/dumbbell-nebula.jpg";
import godzillaNebula from "../../assets/godzilla-nebula.jpg";
import horseheadNebula from "../../assets/horsehead-nebula.jpg";
import planetaryNebula from "../../assets/planetary-nebula.jpg";
import swanNebula from "../../assets/swan-nebula.jpg";
import blackHole from "../../assets/black-hole.jpg";

export type Background = {
  entity: string;
  constellation: string;
  closestSystem: string;
  resource: string;
};

export function randomBackground(): Background {
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
