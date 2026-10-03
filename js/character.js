function buildHalfMask(rand, innerWidth, innerHeight, density) {
  const halfWidth = innerWidth / 2;
  const mask = [];
  for (let row = 0; row < innerHeight; row++) {
    mask.push(new Array(halfWidth).fill(0));
  }
  for (let row = 0; row < innerHeight; row++) {
    const rowT = row / (innerHeight - 1);
    const rowBias = 1 - Math.abs(rowT - 0.5) * 0.9;
    for (let col = 0; col < halfWidth; col++) {
      const centerBias = 0.55 + 0.75 * (col / (halfWidth - 1));
      if (rand() < density * rowBias * centerBias) {
        mask[row][col] = 1;
      }
    }
  }
  return mask;
}

function neighborCount(mask, row, col) {
  const height = mask.length;
  const halfWidth = mask[0].length;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      let c = col + dc;
      if (r < 0 || r >= height) continue;
      if (c >= halfWidth) c = halfWidth - 1;
      if (c < 0) continue;
      count += mask[r][c];
    }
  }
  return count;
}

function smooth(mask) {
  return mask.map((rowCells, row) =>
    rowCells.map((cell, col) => {
      const neighbors = neighborCount(mask, row, col);
      if (neighbors >= 5) return 1;
      if (neighbors <= 1) return 0;
      return cell;
    })
  );
}

function largestComponent(mask) {
  const height = mask.length;
  const width = mask[0].length;
  const labels = mask.map((rowCells) => rowCells.map(() => 0));
  let bestLabel = 0;
  let bestSize = 0;
  let nextLabel = 1;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (!mask[row][col] || labels[row][col]) continue;
      const queue = [[row, col]];
      labels[row][col] = nextLabel;
      let size = 0;
      while (queue.length) {
        const [r, c] = queue.pop();
        size++;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
          if (!mask[nr][nc] || labels[nr][nc]) continue;
          labels[nr][nc] = nextLabel;
          queue.push([nr, nc]);
        }
      }
      if (size > bestSize) {
        bestSize = size;
        bestLabel = nextLabel;
      }
      nextLabel++;
    }
  }
  return mask.map((rowCells, row) =>
    rowCells.map((cell, col) => (labels[row][col] === bestLabel ? 1 : 0))
  );
}

function mirrorMask(halfMask, innerWidth) {
  return halfMask.map((rowCells) => {
    const full = new Array(innerWidth).fill(0);
    for (let col = 0; col < rowCells.length; col++) {
      full[col] = rowCells[col];
      full[innerWidth - 1 - col] = rowCells[col];
    }
    return full;
  });
}

function shade(fullMask, palette, innerHeight) {
  let topRow = innerHeight;
  let bottomRow = 0;
  for (let row = 0; row < fullMask.length; row++) {
    if (fullMask[row].some((cell) => cell)) {
      topRow = Math.min(topRow, row);
      bottomRow = Math.max(bottomRow, row);
    }
  }
  const splitRow = topRow + Math.round((bottomRow - topRow) * 0.55);
  return fullMask.map((rowCells, row) =>
    rowCells.map((cell, col) => {
      if (!cell) return null;
      const ramp = row > splitRow ? palette.secondary : palette.primary;
      const emptyAbove = row === 0 || !fullMask[row - 1][col];
      const emptyBelow = row === fullMask.length - 1 || !fullMask[row + 1][col];
      if (emptyAbove) return ramp[2];
      if (emptyBelow) return ramp[0];
      return ramp[1];
    })
  );
}

function addOutline(grid, fullMask, outlineColor) {
  const height = fullMask.length;
  const width = fullMask[0].length;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (fullMask[row][col]) continue;
      const touching = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => {
        const r = row + dr;
        const c = col + dc;
        return r >= 0 && r < height && c >= 0 && c < width && fullMask[r][c];
      });
      if (touching) grid[row][col] = outlineColor;
    }
  }
}

function addEyes(grid, fullMask, rand, palette) {
  const height = fullMask.length;
  const width = fullMask[0].length;
  let topRow = -1;
  for (let row = 0; row < height && topRow < 0; row++) {
    if (fullMask[row].some((cell) => cell)) topRow = row;
  }
  if (topRow < 0) return;
  const candidates = [];
  const maxRow = Math.min(height - 1, topRow + Math.max(3, Math.round(height * 0.25)));
  for (let row = topRow + 1; row <= maxRow; row++) {
    let first = -1;
    let last = -1;
    for (let col = 0; col < width; col++) {
      if (fullMask[row][col]) {
        if (first < 0) first = col;
        last = col;
      }
    }
    if (first >= 0 && last - first >= 3) candidates.push({ row, first, last });
  }
  if (!candidates.length) return;
  const spot = candidates[Math.floor(rand() * Math.min(candidates.length, 3))];
  const inset = Math.max(1, Math.round((spot.last - spot.first) * 0.28));
  const leftEye = spot.first + inset;
  const rightEye = spot.last - inset;
  if (leftEye >= rightEye) return;
  for (const col of [leftEye, rightEye]) {
    const base = grid[spot.row][col];
    if (!base) continue;
    grid[spot.row][col] = luminance(base) > 0.45 ? palette.outline : '#f2f0e8';
  }
}

function generateCharacter(options) {
  const { size, paletteId, density, outline, eyes, seed } = options;
  const rand = mulberry32(seed);
  const palette =
    CHARACTER_PALETTES.find((entry) => entry.id === paletteId) ||
    CHARACTER_PALETTES[Math.floor(rand() * CHARACTER_PALETTES.length)];
  const innerWidth = size - 2;
  const innerHeight = size - 2;

  let halfMask;
  let attempts = 0;
  do {
    halfMask = buildHalfMask(rand, innerWidth, innerHeight, density + attempts * 0.08);
    halfMask = smooth(smooth(halfMask));
    halfMask = largestComponent(halfMask);
    attempts++;
  } while (attempts < 5 && !halfMask.some((rowCells) => rowCells.some((cell) => cell)));
  const fullMask = mirrorMask(halfMask, innerWidth);
  const innerGrid = shade(fullMask, palette, innerHeight);
  if (outline) addOutline(innerGrid, fullMask, palette.outline);
  if (eyes) addEyes(innerGrid, fullMask, rand, palette);

  const grid = [];
  for (let row = 0; row < size; row++) {
    const cells = new Array(size).fill(null);
    if (row >= 1 && row <= size - 2) {
      for (let col = 1; col <= size - 2; col++) {
        cells[col] = innerGrid[row - 1][col - 1];
      }
    }
    grid.push(cells);
  }
  return grid;
}
