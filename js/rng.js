function mulberry32(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let temp = Math.imul(state ^ (state >>> 15), 1 | state);
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp;
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function seedToHex(seed) {
  return (seed >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function hexToSeed(hex) {
  const parsed = parseInt(hex, 16);
  return Number.isNaN(parsed) ? null : parsed >>> 0;
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function randInt(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}
