import { Batch, PALETTE } from "./library";
import type { BuildingData } from "../world/chunks";
import { bloom } from "./vegetation";
const SHUTTERS = ["#467a75", "#59869c", "#647b4b", "#976d57"];
const FLOWERS = ["#dd6686", "#f6bc59", "#d979a5", "#f3d9a4", "#a29acb"];

export function flowerBox(
  b: Batch,
  x: number,
  y: number,
  z: number,
  width: number,
  variant: number,
) {
  b.add("softbox", "#9c664d", x, y, z, width, 0.28, 0.36);
  for (let i = 0; i < 5; i++) {
    const px = x + ((i - 2) * width) / 5;
    b.add(
      "leaf",
      i % 2 ? "#416c48" : "#668750",
      px,
      y + 0.19,
      z + 0.03,
      width / 4.7,
      0.19,
      0.24,
    );
    bloom(
      b,
      FLOWERS[variant % FLOWERS.length],
      px + 0.04,
      y + 0.37 + (i % 2) * 0.08,
      z + 0.16,
      0.15,
    );
  }
}
function window(
  b: Batch,
  x: number,
  y: number,
  z: number,
  variant: number,
  balcony: boolean,
) {
  const shutter = SHUTTERS[variant % SHUTTERS.length];
  b.add("softbox", "#f0ddba", x, y, z, 1.22, 1.72, 0.22);
  b.add("box", "#365965", x, y, z + 0.13, 0.94, 1.42, 0.07);
  b.add("box", "#d9d0ab", x, y, z + 0.19, 0.06, 1.45, 0.05);
  b.add("box", "#d9d0ab", x, y - 0.05, z + 0.19, 0.96, 0.06, 0.05);
  for (const side of [-1, 1]) {
    b.add(
      "softbox",
      shutter,
      x + side * 0.77,
      y,
      z + 0.12,
      0.37,
      1.5,
      0.12,
      0,
      side * 0.18,
    );
    for (let slat = 0; slat < 5; slat++)
      b.add(
        "box",
        "#adc3ad",
        x + side * 0.77,
        y - 0.47 + slat * 0.23,
        z + 0.2,
        0.28,
        0.025,
        0.025,
      );
  }
  b.add("box", "#e2d2ad", x, y - 0.91, z + 0.16, 1.45, 0.12, 0.42);
  if (balcony) {
    b.add("softbox", "#d9c9a5", x, y - 0.87, z + 0.49, 1.85, 0.16, 1.05);
    for (const height of [y - 0.35, y + 0.04])
      b.add("box", "#425f58", x, height, z + 1.03, 1.86, 0.05, 0.05);
    for (let i = 0; i < 7; i++)
      b.add(
        "cylinder",
        "#425f58",
        x + (i - 3) * 0.28,
        y - 0.37,
        z + 1.03,
        0.024,
        0.8,
        0.024,
      );
    flowerBox(b, x, y - 0.17, z + 1.05, 1.65, variant);
  } else if (variant % 3 !== 1)
    flowerBox(b, x, y - 0.77, z + 0.39, 1.12, variant);
}
function roof(b: Batch, data: BuildingData, h: number) {
  const w = data.width + 0.7,
    d = data.depth + 0.75;
  const shade = ["#ba6746", "#ad6048", "#ce8454", "#a95943"][data.roof];
  const rise = 1.5 + data.variant * 0.17;
  b.add("box", "#eddbb7", 0, h + 0.32, 0, w, 0.25, d);
  if (data.roof === 2) {
    b.add("softbox", "#c6b48b", 0, h + 0.55, 0, w, 0.35, d);
    for (const side of [-1, 1]) {
      b.add("box", "#e8d4ad", side * (w / 2 - 0.12), h + 0.97, 0, 0.2, 0.75, d);
      b.add("box", "#e8d4ad", 0, h + 0.97, side * (d / 2 - 0.12), w, 0.75, 0.2);
    }
    b.add("leaf", "#50724e", w * 0.25, h + 1.1, d * 0.2, 0.8, 0.7, 0.8);
    return;
  }
  if (data.roof === 1)
    b.add(
      "hip",
      shade,
      0,
      h + 0.5 + rise / 2,
      0,
      w / Math.SQRT2,
      rise,
      d / Math.SQRT2,
      0,
      Math.PI / 4,
    );
  else {
    b.add("roof", shade, 0, h + 0.46, 0, w, rise, d);
    b.add("box", "#d49066", 0, h + rise + 0.51, 0, 0.18, 0.15, d + 0.1);
    for (const side of [-1, 1])
      for (let row = 1; row < 8; row++) {
        const t = row / 8;
        b.add(
          "box",
          "#a85e45",
          (side * t * w) / 2,
          h + 0.48 + rise * (1 - t),
          0,
          0.04,
          0.035,
          d + 0.01,
        );
      }
    if (data.roof === 3) {
      b.add(
        "softbox",
        PALETTE[data.color],
        0,
        h + 1.1,
        d * 0.3,
        1.55,
        1.4,
        1.6,
      );
      b.add("roof", shade, 0, h + 1.75, d * 0.3, 1.85, 0.65, 1.8);
      b.add("arch", "#456976", 0, h + 1.2, d * 0.3 + 0.83, 0.7, 0.7, 1);
    }
  }
  b.add("box", "#ab8066", w * 0.29, h + rise * 0.72, -d * 0.2, 0.6, 1.65, 0.65);
  b.add(
    "softbox",
    "#dac8a4",
    w * 0.29,
    h + rise * 0.72 + 0.85,
    -d * 0.2,
    0.85,
    0.16,
    0.85,
  );
}

export function building(b: Batch, data: BuildingData) {
  const { width: w, depth: d, floors, variant } = data,
    h = floors * 2.75;
  b.add("softbox", "#b5aa8b", 0, 0.04, 0, w + 0.45, 0.7, d + 0.4);
  b.add("softbox", PALETTE[data.color], 0, h / 2 + 0.4, 0, w, h, d);
  b.add("box", "#ddc8a6", 0, 0.52, d / 2 + 0.05, w, 0.45, 0.15);
  roof(b, data, h);
  const columns = w < 6.5 ? 2 : 3;
  for (let floor = 0; floor < floors; floor++) {
    const y = floor * 2.75 + 1.95;
    if (floor > 0 && variant % 2 === 0)
      b.add("box", "#e5d2ae", 0, y - 1.27, d / 2 + 0.05, w, 0.12, 0.15);
    for (let col = 0; col < columns; col++) {
      if (floor === 0 && col === Math.floor(columns / 2)) continue;
      const x = ((col - (columns - 1) / 2) * w) / (columns + 0.4);
      window(
        b,
        x,
        y,
        d / 2 + 0.06,
        variant + col,
        floor === 1 && col === variant % columns,
      );
    }
    for (const side of [-1, 1]) {
      b.add("box", "#e6d6b3", side * (w / 2 + 0.03), y, 0, 0.14, 1.5, 1.1);
      b.add("box", "#557d85", side * (w / 2 + 0.12), y, 0, 0.06, 1.25, 0.85);
    }
  }
  const doorX = columns === 2 ? -w * 0.08 : 0;
  b.add("arch", "#e4d2b2", doorX, 1.55, d / 2 + 0.12, 1.55, 2.1, 1);
  b.add("arch", SHUTTERS[variant % 4], doorX, 1.53, d / 2 + 0.28, 1.23, 1.9, 1);
  b.add(
    "sphere",
    "#d5ac5a",
    doorX + 0.35,
    1.25,
    d / 2 + 0.46,
    0.065,
    0.065,
    0.065,
  );
  b.add("box", "#ddd1b2", doorX, 0.16, d / 2 + 0.4, 1.8, 0.25, 0.85);
  if (data.shop) {
    const awning = variant % 2 ? "#5b8c9b" : "#62865c";
    for (let i = 0; i < 10; i++) {
      const x = ((i - 4.5) * w) / 11;
      b.add(
        "box",
        i % 2 ? "#f5e4bc" : awning,
        x,
        2.75,
        d / 2 + 0.85,
        w / 11,
        0.13,
        1.75,
        -0.2,
      );
      b.add(
        "softbox",
        i % 2 ? "#f5e4bc" : awning,
        x,
        2.46,
        d / 2 + 1.7,
        w / 11,
        0.32,
        0.12,
      );
    }
    b.add("softbox", "#e6d5ad", 0, 3.3, d / 2 + 0.22, w * 0.65, 0.45, 0.16);
  }
  if (data.garden) {
    // Cascading bougainvillea climbs one side of the facade.
    const x = (variant % 2 ? 1 : -1) * (w / 2 - 0.32);
    for (let i = 0; i < 5; i++) {
      const y = 1.2 + i * 0.93;
      b.add(
        "leaf",
        i % 2 ? "#3e704a" : "#5b8650",
        x + Math.sin(i * 1.7) * 0.3,
        y,
        d / 2 + 0.22,
        0.7,
        0.8,
        0.42,
      );
      for (let petal = 0; petal < 5; petal++)
        bloom(
          b,
          FLOWERS[variant % 5],
          x + Math.sin(i * 2 + petal) * 0.59,
          y + Math.cos(petal) * 0.35,
          d / 2 + 0.55,
          0.18,
        );
    }
    for (const side of [-1, 1]) {
      b.add(
        "cylinder",
        "#ab7354",
        side * (w * 0.35),
        0.35,
        d / 2 + 0.85,
        0.42,
        0.7,
        0.42,
      );
      b.add(
        "leaf",
        "#4c784d",
        side * (w * 0.35),
        0.97,
        d / 2 + 0.85,
        0.64,
        0.7,
        0.6,
      );
      for (let flower = 0; flower < 5; flower++)
        bloom(
          b,
          FLOWERS[variant % 5],
          side * (w * 0.35) + Math.sin(flower * 2.4) * 0.38,
          1.35 + Math.cos(flower) * 0.15,
          d / 2 + 0.86 + Math.cos(flower * 2.4) * 0.3,
          0.17,
        );
    }
  }
}
