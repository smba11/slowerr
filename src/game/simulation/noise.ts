/** Stable value noise with C2 interpolation: identical across chunk boundaries. */
export function lattice(seed: number, cell: number): number {
  let h = Math.imul(cell | 0, 374761393) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967295) * 2 - 1;
}
export function smooth(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function noise1(
  seed: number,
  x: number,
): { value: number; derivative: number } {
  const cell = Math.floor(x),
    t = x - cell;
  const a = lattice(seed, cell),
    difference = lattice(seed, cell + 1) - a;
  return {
    value: a + difference * smooth(t),
    derivative: difference * 30 * t * t * (t - 1) * (t - 1),
  };
}
export function noise2(seed: number, x: number, z: number): number {
  const row = Math.floor(z),
    t = smooth(z - row);
  const a = noise1(seed ^ Math.imul(row, 19349663), x).value;
  const b = noise1(seed ^ Math.imul(row + 1, 19349663), x).value;
  return a + (b - a) * t;
}
export function blendRange(value: number, low: number, high: number): number {
  return smooth(Math.max(0, Math.min(1, (value - low) / (high - low))));
}
