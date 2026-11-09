// localStorage, wrapped so a private window or blocked storage never breaks a game.
// Each game gets its own key prefix.

export function createStore(prefix) {
  return {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(prefix + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Storage unavailable: the game still works, it just won't remember.
      }
    },
  };
}
