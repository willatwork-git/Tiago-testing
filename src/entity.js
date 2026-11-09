// Shared tile-to-tile movement for the player and the Glitches.
//
// A Mover sits on tile (tx, ty) and travels `prog` (0..1) of the way towards
// the neighbouring tile in `dir`. Decisions are only made at tile centres
// (prog === 0), which keeps everyone perfectly on the grid.

export const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;
export const flip = (d) => ({ x: -d.x, y: -d.y });

export class Mover {
  constructor(x, y, dir) {
    this.tx = x;
    this.ty = y;
    this.dir = dir;
    this.prog = 0;
    this.moving = true;
  }

  // Position in tile units, for drawing and collision.
  get x() { return this.tx + this.dir.x * this.prog; }
  get y() { return this.ty + this.dir.y * this.prog; }

  /** Turn round mid-tile: the tile we were heading to becomes our origin. */
  reverse(maze) {
    if (this.prog === 0) {
      this.dir = flip(this.dir);
      return;
    }
    this.tx = maze.wrapX(this.tx + this.dir.x);
    this.ty += this.dir.y;
    this.dir = flip(this.dir);
    this.prog = 1 - this.prog;
  }

  /**
   * Travel `dist` tiles. At each tile centre, `choose()` returns the next
   * direction (or null to stop); `arrive()` fires on reaching a new tile.
   */
  advance(dist, maze, choose, arrive) {
    for (let guard = 0; dist > 1e-9 && guard < 8; guard++) {
      if (this.prog === 0) {
        const d = choose();
        if (!d) {
          this.moving = false;
          return;
        }
        this.dir = d;
        this.moving = true;
      }
      const step = Math.min(dist, 1 - this.prog);
      this.prog += step;
      dist -= step;
      if (this.prog >= 1 - 1e-9) {
        this.tx = maze.wrapX(this.tx + this.dir.x);
        this.ty += this.dir.y;
        this.prog = 0;
        arrive?.();
      }
    }
  }
}
