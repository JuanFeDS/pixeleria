const canvas = document.getElementById('preview');
const frame = document.getElementById('canvas-frame');
const dims = document.getElementById('dims');
const seedInput = document.getElementById('seed');
const historyEl = document.getElementById('history');

const state = {
  mode: 'personaje',
  seed: randomSeed(),
  grid: null,
};

const history = [];
const HISTORY_LIMIT = 14;

function fillPaletteSelect() {
  const select = document.getElementById('char-palette');
  for (const palette of CHARACTER_PALETTES) {
    const option = document.createElement('option');
    option.value = palette.id;
    option.textContent = palette.name;
    select.appendChild(option);
  }
}

function readOptions() {
  if (state.mode === 'personaje') {
    return {
      size: Number(document.getElementById('char-size').value),
      paletteId: document.getElementById('char-palette').value,
      density: Number(document.getElementById('char-density').value) / 100,
      outline: document.getElementById('char-outline').checked,
      eyes: document.getElementById('char-eyes').checked,
      seed: state.seed,
    };
  }
  const [width, height] = document.getElementById('land-size').value.split('x').map(Number);
  return {
    width,
    height,
    themeId: document.getElementById('land-theme').value,
    layers: Number(document.getElementById('land-layers').value),
    foreground: document.getElementById('land-foreground').value,
    clouds: document.getElementById('land-clouds').checked,
    treeDensity: Number(document.getElementById('land-trees').value),
    seed: state.seed,
  };
}

function applyOptions(mode, options) {
  if (mode === 'personaje') {
    document.getElementById('char-size').value = String(options.size);
    document.getElementById('char-palette').value = options.paletteId;
    document.getElementById('char-density').value = String(Math.round(options.density * 100));
    document.getElementById('char-outline').checked = options.outline;
    document.getElementById('char-eyes').checked = options.eyes;
  } else {
    document.getElementById('land-size').value = `${options.width}x${options.height}`;
    document.getElementById('land-theme').value = options.themeId;
    document.getElementById('land-layers').value = String(options.layers);
    document.getElementById('land-foreground').value = options.foreground;
    document.getElementById('land-clouds').checked = options.clouds;
    document.getElementById('land-trees').value = String(options.treeDensity);
  }
  syncOutputs();
}

function syncOutputs() {
  document.getElementById('char-density-value').textContent =
    document.getElementById('char-density').value;
  document.getElementById('land-layers-value').textContent =
    document.getElementById('land-layers').value;
  document.getElementById('land-trees-value').textContent =
    document.getElementById('land-trees').value;
  const isPradera = document.getElementById('land-foreground').value === 'pradera';
  document.getElementById('land-trees-label').hidden = !isPradera;
}

function generate({ recordHistory = true } = {}) {
  const options = readOptions();
  state.grid =
    state.mode === 'personaje' ? generateCharacter(options) : generateLandscape(options);

  canvas.style.animation = 'none';
  void canvas.offsetWidth;
  canvas.style.animation = '';
  drawGrid(state.grid, canvas);
  fitCanvas(canvas, frame);

  dims.textContent = `${canvas.width} × ${canvas.height} px · semilla ${seedToHex(state.seed)}`;
  seedInput.value = seedToHex(state.seed);
  if (recordHistory) pushHistory(options);
}

function pushHistory(options) {
  const entry = { mode: state.mode, options, grid: state.grid };
  history.unshift(entry);
  if (history.length > HISTORY_LIMIT) history.pop();
  renderHistory();
}

function renderHistory() {
  historyEl.innerHTML = '';
  history.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = `${entry.mode} · ${seedToHex(entry.options.seed)}`;
    if (index === 0) button.classList.add('current');
    const thumb = document.createElement('canvas');
    drawGrid(entry.grid, thumb);
    button.appendChild(thumb);
    button.addEventListener('click', () => restore(entry));
    historyEl.appendChild(button);
  });
}

function restore(entry) {
  setMode(entry.mode, { regenerate: false });
  state.seed = entry.options.seed;
  applyOptions(entry.mode, entry.options);
  generate({ recordHistory: false });
}

function setMode(mode, { regenerate = true } = {}) {
  state.mode = mode;
  document.body.dataset.mode = mode;
  document.querySelectorAll('[data-mode-btn]').forEach((button) => {
    button.classList.toggle('active', button.dataset.modeBtn === mode);
  });
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== mode;
  });
  if (regenerate) generate();
}

function bindControls() {
  document.querySelectorAll('[data-mode-btn]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.modeBtn));
  });

  const controlIds = [
    'char-size', 'char-palette', 'char-density', 'char-outline', 'char-eyes',
    'land-size', 'land-theme', 'land-layers', 'land-foreground', 'land-clouds', 'land-trees',
  ];
  for (const id of controlIds) {
    document.getElementById(id).addEventListener('input', () => {
      syncOutputs();
      generate();
    });
  }

  document.getElementById('reroll').addEventListener('click', () => {
    state.seed = randomSeed();
    generate();
  });

  document.getElementById('generate').addEventListener('click', () => {
    state.seed = randomSeed();
    generate();
  });

  seedInput.addEventListener('change', () => {
    const parsed = hexToSeed(seedInput.value.trim());
    if (parsed === null) {
      seedInput.value = seedToHex(state.seed);
      return;
    }
    state.seed = parsed;
    generate();
  });

  document.getElementById('download').addEventListener('click', () => {
    if (!state.grid) return;
    const scale = Number(document.getElementById('export-scale').value);
    exportPng(state.grid, scale, `pixeleria-${state.mode}-${seedToHex(state.seed)}.png`);
  });

  window.addEventListener('resize', () => {
    if (state.grid) fitCanvas(canvas, frame);
  });
}

fillPaletteSelect();
bindControls();
syncOutputs();
if (location.hash === '#paisaje') {
  setMode('paisaje');
} else {
  generate();
}
