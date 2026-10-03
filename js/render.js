function drawGrid(grid, canvas) {
  const height = grid.length;
  const width = grid[0].length;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = grid[y][x];
      if (!color) continue;
      const [r, g, b] = hexToRgb(color);
      const offset = (y * width + x) * 4;
      image.data[offset] = r;
      image.data[offset + 1] = g;
      image.data[offset + 2] = b;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
}

function fitCanvas(canvas, container) {
  const availableWidth = container.clientWidth - 32;
  const availableHeight = container.clientHeight - 32;
  const scale = Math.max(
    1,
    Math.floor(Math.min(availableWidth / canvas.width, availableHeight / canvas.height))
  );
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  return scale;
}

function exportPng(grid, scale, filename) {
  const source = document.createElement('canvas');
  drawGrid(grid, source);
  const target = document.createElement('canvas');
  target.width = source.width * scale;
  target.height = source.height * scale;
  const context = target.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, target.width, target.height);
  const link = document.createElement('a');
  link.href = target.toDataURL('image/png');
  link.download = filename;
  link.click();
}
