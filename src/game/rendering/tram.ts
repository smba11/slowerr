import * as THREE from "three";
import { AssetLibrary, Batch } from "./library";
export function createTram(assets: AssetLibrary): THREE.Group {
  const b = new Batch(assets);
  b.add("box", "#54665c", 0, 0.52, 0, 2.15, 0.5, 5.4);
  b.add("box", "#c58235", 0, 1.25, 0, 2.25, 1.15, 5.55);
  b.add("box", "#e9b54f", 0, 1.8, 0, 2.3, 0.9, 5.65);
  b.add("box", "#f4e4bd", 0, 3.34, 0, 2.4, 0.23, 5.8);
  b.add("box", "#64796a", 0, 3.55, 0, 2.55, 0.22, 5.9);
  b.add("box", "#f4e4bd", 0, 2.65, 0, 2.25, 1.45, 5.45);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const z = (i - 2) * 1.03;
      b.add("box", "#779b96", side * 1.14, 2.65, z, 0.04, 1.15, 0.85);
      b.add("box", "#d6a852", side * 1.18, 2.65, z + 0.46, 0.05, 1.3, 0.09);
    }
    b.add("box", "#f5e4bb", side * 1.17, 2.0, 0, 0.06, 0.1, 5.6);
    for (const z of [-1.7, 1.7])
      b.add(
        "cylinder",
        "#3b4d46",
        side * 1.04,
        0.48,
        z,
        0.42,
        0.22,
        0.42,
        0,
        0,
        Math.PI / 2,
      );
  }
  for (const end of [-1, 1]) {
    b.add("box", "#e9b54f", 0, 1.6, end * 2.84, 2.3, 1.3, 0.2);
    for (const x of [-0.72, 0, 0.72]) {
      b.add("box", "#688d88", x, 2.64, end * 2.74, 0.58, 1.12, 0.06);
      b.add("box", "#d4a04c", x + 0.34, 2.65, end * 2.8, 0.07, 1.35, 0.1);
    }
    b.add("box", "#f2e2bc", 0, 3.05, end * 2.84, 1.1, 0.28, 0.07);
    for (const x of [-0.77, 0.77]) {
      b.add(
        "cylinder",
        "#bba06d",
        x,
        1.55,
        end * 2.99,
        0.18,
        0.12,
        0.18,
        Math.PI / 2,
      );
      b.add("sphere", "#fff0bc", x, 1.55, end * 3.05, 0.13, 0.13, 0.08);
    }
    b.add("box", "#784f39", 0, 0.8, end * 2.99, 1.65, 0.19, 0.25);
    b.add(
      "cylinder",
      "#536258",
      0,
      1.23,
      end * 2.99,
      0.23,
      0.1,
      0.23,
      Math.PI / 2,
    );
  }
  // Diamond-shaped trolley pole and contact shoe.
  for (const side of [-1, 1]) {
    b.add("box", "#586b5b", 0, 4.35, side * 0.65, 0.06, 1.9, 0.06, side * 0.65);
    b.add(
      "box",
      "#586b5b",
      0,
      5.75,
      side * 0.65,
      0.06,
      1.9,
      0.06,
      -side * 0.65,
    );
  }
  b.add("box", "#586b5b", 0, 6.62, 0, 1.1, 0.08, 0.22);
  const tram = b.finish();
  tram.name = "Amberline tram";
  // Crisp route number, drawn locally; no external fonts or images.
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f2e2bc";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#526458";
  ctx.font = "bold 31px serif";
  ctx.textAlign = "center";
  ctx.fillText("07 · AMBERLINE", 128, 43);
  const texture = new THREE.CanvasTexture(canvas);
  assets.textures.push(texture);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), material);
  sign.position.set(0, 3.07, -2.9);
  sign.rotation.y = Math.PI;
  tram.add(sign);
  sign.userData.uniqueGeometry = true;
  sign.userData.uniqueMaterial = true;
  return tram;
}
