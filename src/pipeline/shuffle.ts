/** In-place Fisher–Yates shuffle. */
export function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = items[i];
    const u = items[j];
    if (t !== undefined && u !== undefined) {
      items[i] = u;
      items[j] = t;
    }
  }
}
