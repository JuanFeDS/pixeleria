function heightline(rand, width, amplitude, roughness) {
  let points = [rand() * amplitude, rand() * amplitude];
  let spread = amplitude;
  while (points.length < width) {
    const next = [];
    for (let i = 0; i < points.length - 1; i++) {
      next.push(points[i]);
      next.push((points[i] + points[i + 1]) / 2 + (rand() * 2 - 1) * spread);
    }
    next.push(points[points.length - 1]);
    spread *= roughness;
    points = next;
  }
  const line = new Array(width);
  for (let x = 0; x < width; x++) {
    line[x] = points[Math.round((x * (points.length - 1)) / (width - 1))];
  }
  return line;
}

function paintSky(grid, theme, width, horizonY) {
  for (let y = 0; y < horizonY; y++) {
    const t = y / (horizonY - 1);
    for (let x = 0; x < width; x++) {
      grid[y][x] = theme.sky[ditherIndex(t, theme.sky.length, x, y, 0.5)];
    }
  }
}

function paintStars(grid, rand, width, skyLimit) {
  for (let y = 0; y < skyLimit; y++) {
    for (let x = 0; x < width; x++) {
      if (rand() < 0.008) {
        grid[y][x] = rand() < 0.3 ? '#ffffff' : '#aab3cc';
      }
    }
  }
}

function paintDisc(grid, centerX, centerY, radius, color, width, maxY) {
  for (let y = Math.floor(centerY - radius); y <= centerY + radius; y++) {
    for (let x = Math.floor(centerX - radius); x <= centerX + radius; x++) {
      if (x < 0 || x >= width || y < 0 || y >= maxY) continue;
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= radius * radius) grid[y][x] = color;
    }
  }
}

function paintMoon(grid, rand, theme, width, horizonY) {
  const radius = Math.max(3, Math.round(horizonY * 0.14));
  const centerX = randInt(rand, radius + 2, width - radius - 3);
  const centerY = randInt(rand, radius + 1, Math.round(horizonY * 0.45));
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x < 0 || x >= width || y < 0 || y >= horizonY) continue;
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy > radius * radius) continue;
      const hx = x - (centerX + radius * 0.45);
      const hy = y - (centerY - radius * 0.25);
      const inHollow = hx * hx + hy * hy <= radius * radius * 0.8;
      if (!inHollow) grid[y][x] = theme.sun;
    }
  }
  return centerX;
}

function paintSun(grid, rand, theme, width, horizonY) {
  const radius = Math.max(3, Math.round(horizonY * 0.16));
  const centerX = randInt(rand, radius + 2, width - radius - 3);
  const centerY = randInt(rand, radius + 1, Math.round(horizonY * 0.6));
  paintDisc(grid, centerX, centerY, radius, theme.sun, width, horizonY);
  return centerX;
}

function paintClouds(grid, rand, theme, width, horizonY) {
  const count = randInt(rand, 2, 4);
  for (let n = 0; n < count; n++) {
    const length = randInt(rand, Math.round(width * 0.1), Math.round(width * 0.28));
    const startX = randInt(rand, 0, width - length - 1);
    const baseY = randInt(rand, 2, Math.round(horizonY * 0.55));
    const rows = randInt(rand, 2, 3);
    for (let row = 0; row < rows; row++) {
      const shrink = row * randInt(rand, 2, 4);
      const y = baseY - row;
      if (y < 0) continue;
      for (let x = startX + shrink; x < startX + length - shrink; x++) {
        if (x >= 0 && x < width) grid[y][x] = theme.cloud;
      }
    }
  }
}

function paintMountains(grid, rand, theme, width, horizonY, layers) {
  const skyHorizon = theme.sky[theme.sky.length - 1];
  for (let layer = 0; layer < layers; layer++) {
    const depth = (layer + 1) / layers;
    const color = mix(skyHorizon, theme.mountainDark, 0.3 + depth * 0.7);
    const peakTop = horizonY * (0.3 + 0.45 * depth);
    const amplitude = horizonY * (0.1 + 0.15 * depth);
    const line = heightline(rand, width, amplitude, 0.55);
    for (let x = 0; x < width; x++) {
      const top = Math.round(peakTop + line[x]);
      for (let y = Math.max(0, top); y < horizonY; y++) {
        grid[y][x] = color;
      }
    }
  }
}

function paintWater(grid, rand, theme, width, height, horizonY, lightX) {
  const ramp = theme.sky.map((color) => mix(color, '#060a14', 0.45)).reverse();
  for (let y = horizonY; y < height; y++) {
    const t = (y - horizonY) / Math.max(1, height - 1 - horizonY);
    for (let x = 0; x < width; x++) {
      grid[y][x] = ramp[ditherIndex(t, ramp.length, x, y, 0.35)];
    }
  }
  const sparkle = mix(theme.sun, '#ffffff', 0.2);
  for (let y = horizonY; y < height; y++) {
    const fade = 1 - (y - horizonY) / Math.max(1, height - horizonY);
    if (rand() < 0.75 * fade + 0.1) {
      const runLength = randInt(rand, 1, 3);
      const runX = lightX + randInt(rand, -2, 2) - Math.floor(runLength / 2);
      for (let x = runX; x < runX + runLength; x++) {
        if (x >= 0 && x < width) grid[y][x] = sparkle;
      }
    }
    if (rand() < 0.25 * fade) {
      const streakX = randInt(rand, 0, width - 5);
      const streakLength = randInt(rand, 2, 5);
      const streakColor = mix(grid[y][streakX], theme.sun, 0.3);
      for (let x = streakX; x < streakX + streakLength; x++) {
        grid[y][x] = streakColor;
      }
    }
  }
}

function paintGround(grid, rand, theme, width, height, horizonY, treeDensity) {
  const contour = heightline(rand, width, 1.5, 0.6);
  const groundTop = new Array(width);
  for (let x = 0; x < width; x++) {
    groundTop[x] = horizonY - Math.max(0, Math.min(3, Math.round(Math.abs(contour[x]))));
  }
  for (let x = 0; x < width; x++) {
    for (let y = groundTop[x]; y < height; y++) {
      const t = (y - horizonY) / Math.max(1, height - 1 - horizonY);
      const index = ditherIndex(1 - t, theme.ground.length, x, y, 0.6);
      grid[y][x] = theme.ground[index];
    }
  }
  const treeCount = Math.round((width / 16) * treeDensity);
  for (let n = 0; n < treeCount; n++) {
    const treeX = randInt(rand, 1, width - 2);
    const baseY = randInt(rand, Math.min(groundTop[treeX] + 1, height - 2), height - 2);
    const depth = (baseY - horizonY) / Math.max(1, height - horizonY);
    const treeHeight = 3 + Math.round(depth * 5) + randInt(rand, 0, 1);
    for (let row = 0; row < treeHeight; row++) {
      const y = baseY - row;
      if (y < 0 || y >= height) continue;
      const halfSpan = Math.max(0, Math.floor((treeHeight - 1 - row) / 3));
      for (let x = treeX - halfSpan; x <= treeX + halfSpan; x++) {
        if (x >= 0 && x < width) grid[y][x] = theme.tree;
      }
    }
  }
}

function generateLandscape(options) {
  const { width, height, themeId, layers, foreground, clouds, treeDensity, seed } = options;
  const rand = mulberry32(seed);
  const theme = LANDSCAPE_THEMES[themeId];
  const horizonY = Math.round(height * (foreground === 'agua' ? 0.6 : 0.68));

  const grid = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(null));
  }

  paintSky(grid, theme, width, horizonY);
  if (theme.stars) paintStars(grid, rand, width, Math.round(horizonY * 0.75));
  const lightX = theme.moon
    ? paintMoon(grid, rand, theme, width, horizonY)
    : paintSun(grid, rand, theme, width, horizonY);
  if (clouds) paintClouds(grid, rand, theme, width, horizonY);
  paintMountains(grid, rand, theme, width, horizonY, layers);

  if (foreground === 'agua') {
    paintWater(grid, rand, theme, width, height, horizonY, lightX);
  } else {
    paintGround(grid, rand, theme, width, height, horizonY, treeDensity);
  }
  return grid;
}
