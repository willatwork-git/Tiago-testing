// Maze layout, parsing and tile queries.
//   #  wall      .  pellet      o  power cell
//   -  Glitch gate (only Glitches leaving or returning home may pass)
//   space  empty floor (tunnel, house interior)
// Rows must all be the same width. Open cells on the left/right edge wrap around.

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Order matters: it's the tie-break when two directions are equally good.
export const DIR_LIST = [DIRS.up, DIRS.left, DIRS.down, DIRS.right];

const LAYOUT = [
  '#####################',
  '#.........#.........#',
  '#o###.###.#.###.###o#',
  '#...................#',
  '#.###.#.#####.#.###.#',
  '#.....#...#...#.....#',
  '#####.###.#.###.#####',
  '#####.#.......#.#####',
  '#####.#.##-##.#.#####',
  '     .#.#   #.#.     ',
  '#####.#.#####.#.#####',
  '#####.#.......#.#####',
  '#####.###.#.###.#####',
  '#.........#.........#',
  '#.###.###.#.###.###.#',
  '#o.................o#',
  '###.#.#.#####.#.#.###',
  '#...#...#...#...#...#',
  '#.#####.#.#.#.#####.#',
  '#...................#',
  '#####################',
];

const SPAWN = {
  player: { x: 10, y: 15 },
  door: { x: 10, y: 7 }, // tile just above the gate
  centre: { x: 10, y: 9 }, // middle of the house
  house: [{ x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }],
};

export class Maze {
  constructor(layout = LAYOUT, spawn = SPAWN) {
    this.rows = layout.length;
    this.cols = layout[0].length;
    for (const [i, row] of layout.entries()) {
      if (row.length !== this.cols) throw new Error(`Maze row ${i} is ${row.length} wide, expected ${this.cols}`);
    }
    this.tiles = layout.map((row) => row.split(''));
    this.spawn = spawn;

    // The player starts on a clear tile.
    this.tiles[spawn.player.y][spawn.player.x] = ' ';

    this.pellets = 0;
    this.gates = [];
    this.tiles.forEach((row, y) => row.forEach((t, x) => {
      if (t === '.' || t === 'o') this.pellets++;
      if (t === '-') this.gates.push({ x, y });
    }));

    this.tunnel = this.findTunnels();
    this.homeField = this.distanceField(spawn.centre, true);
    this.doorField = this.distanceField(spawn.door, true);
  }

  wrapX(x) {
    return ((x % this.cols) + this.cols) % this.cols;
  }

  /** Tile at (x, y), wrapping horizontally. Off the top/bottom counts as wall. */
  get(x, y) {
    if (y < 0 || y >= this.rows) return '#';
    return this.tiles[y][this.wrapX(x)];
  }

  /** Tile at (x, y) with no wrapping — anything off the board is wall. For drawing. */
  rawTile(x, y) {
    if (y < 0 || y >= this.rows || x < 0 || x >= this.cols) return '#';
    return this.tiles[y][x];
  }

  passable(x, y, canUseGate = false) {
    const t = this.get(x, y);
    if (t === '#') return false;
    if (t === '-') return canUseGate;
    return true;
  }

  isTunnel(x, y) {
    return this.tunnel.has(`${this.wrapX(x)},${y}`);
  }

  /** Eat whatever is on (x, y). Returns '.', 'o' or null. */
  eat(x, y) {
    const t = this.get(x, y);
    if (t !== '.' && t !== 'o') return null;
    this.tiles[y][this.wrapX(x)] = ' ';
    this.pellets--;
    return t;
  }

  // Empty run of tiles from each open board edge inwards.
  findTunnels() {
    const set = new Set();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols && this.tiles[y][x] === ' '; x++) set.add(`${x},${y}`);
      for (let x = this.cols - 1; x >= 0 && this.tiles[y][x] === ' '; x--) set.add(`${x},${y}`);
    }
    return set;
  }

  /** Breadth-first step count from every tile to `target`. Infinity where unreachable. */
  distanceField(target, canUseGate) {
    const field = Array.from({ length: this.rows }, () => new Array(this.cols).fill(Infinity));
    field[target.y][target.x] = 0;
    const queue = [[target.x, target.y]];
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      for (const d of DIR_LIST) {
        const nx = this.wrapX(x + d.x);
        const ny = y + d.y;
        if (!this.passable(nx, ny, canUseGate) || field[ny][nx] !== Infinity) continue;
        field[ny][nx] = field[y][x] + 1;
        queue.push([nx, ny]);
      }
    }
    return field;
  }
}
