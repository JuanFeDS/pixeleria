function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(rgb) {
  return '#' + rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('');
}

function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex([
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function ditherIndex(t, steps, x, y, strength = 0.9) {
  const threshold = (BAYER4[y % 4][x % 4] + 0.5) / 16 - 0.5;
  const index = Math.round(t * (steps - 1) + threshold * strength);
  return Math.max(0, Math.min(steps - 1, index));
}
