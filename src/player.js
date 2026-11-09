import { Mover, isOpposite } from './entity.js';
import { DIRS } from './maze.js';

export class Player extends Mover {
  constructor(spawn) {
    super(spawn.x, spawn.y, DIRS.left);
    this.want = DIRS.left; // buffered direction: taken at the first tile where it's possible
    this.mouth = 0; // chomp animation phase
    this.dashTime = 0; // > 0 while dashing
    this.dashCooldown = 0; // > 0 while recharging
  }

  update(dt, maze, speed, onTile) {
    const want = this.want;

    // Reversing is always allowed, even mid-tile — it's what makes dodging feel fair.
    if (this.prog > 0 && isOpposite(want, this.dir)) this.reverse(maze);

    this.advance(speed * dt, maze, () => {
      if (maze.passable(this.tx + want.x, this.ty + want.y)) return want;
      if (maze.passable(this.tx + this.dir.x, this.ty + this.dir.y)) return this.dir;
      return null; // face the wall and wait
    }, () => onTile(this.tx, this.ty));

    if (this.moving) this.mouth += dt * 14;
  }
}
