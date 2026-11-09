// Borough Brawl's saved best score and mute setting.

import { createStore } from '../shared/store.js';

const { read, write } = createStore('boroughBrawl.'); // (was nebulaKnockout. — prototype scores don't carry over)

export function loadBest() {
  const v = read('best', 0);
  return Number.isFinite(v) ? v : 0;
}

export function saveBest(score) {
  write('best', score);
}

export const loadMuted = () => read('muted', false) === true;
export const saveMuted = (muted) => write('muted', muted);
