// Grid and path definitions
const TILE_SIZE = 40;
const COLS = 28;
const ROWS = 18;

// Waypoints define the windy path (in tile coordinates [col, row])
const PATH_WAYPOINTS = [
  [0, 2],
  [5, 2],
  [5, 6],
  [10, 6],
  [10, 2],
  [15, 2],
  [15, 10],
  [8, 10],
  [8, 14],
  [20, 14],
  [20, 8],
  [24, 8],
  [24, 15],
  [27, 15]
];

// Build a set of path tiles from waypoints
function buildPathTiles(waypoints) {
  const tiles = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c1, r1] = waypoints[i];
    const [c2, r2] = waypoints[i + 1];
    if (c1 === c2) {
      const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
      for (let r = minR; r <= maxR; r++) tiles.add(`${c1},${r}`);
    } else {
      const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
      for (let c = minC; c <= maxC; c++) tiles.add(`${c},${r1}`);
    }
  }
  return tiles;
}

const PATH_TILES = buildPathTiles(PATH_WAYPOINTS);

function isPathTile(col, row) {
  return PATH_TILES.has(`${col},${row}`);
}

function tileToPixel(col, row) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2
  };
}

function pixelToTile(x, y) {
  return {
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE)
  };
}

// Draw the map
function drawMap(ctx, towers) {
  const occupiedTiles = new Set(towers.map(t => `${t.col},${t.row}`));

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const onPath = isPathTile(col, row);

      if (onPath) {
        ctx.fillStyle = '#2a2010';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Path texture lines
        ctx.strokeStyle = '#3a3018';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      } else {
        const occupied = occupiedTiles.has(`${col},${row}`);
        ctx.fillStyle = occupied ? '#0d1a0d' : '#0f1f0f';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Grid lines
        ctx.strokeStyle = '#1a2e1a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
  }

  // Draw path direction arrows at corners
  drawPathArrows(ctx);
}

function drawPathArrows(ctx) {
  ctx.save();
  ctx.fillStyle = '#5a4020';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [c1, r1] = PATH_WAYPOINTS[i];
    const [c2, r2] = PATH_WAYPOINTS[i + 1];
    const mx = ((c1 + c2) / 2) * TILE_SIZE + TILE_SIZE / 2;
    const my = ((r1 + r2) / 2) * TILE_SIZE + TILE_SIZE / 2;
    let arrow = '▶';
    if (c2 > c1) arrow = '▶';
    else if (c2 < c1) arrow = '◀';
    else if (r2 > r1) arrow = '▼';
    else arrow = '▲';
    ctx.fillText(arrow, mx, my);
  }
  ctx.restore();
}

// Highlight a tile on hover
function drawTileHighlight(ctx, col, row, valid) {
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  ctx.fillStyle = valid ? 'rgba(100,220,100,0.25)' : 'rgba(220,80,80,0.25)';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = valid ? '#4f4' : '#f44';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}

// Pixel path for enemy movement (world coords)
function buildWorldPath(waypoints) {
  return waypoints.map(([col, row]) => tileToPixel(col, row));
}

const WORLD_PATH = buildWorldPath(PATH_WAYPOINTS);
