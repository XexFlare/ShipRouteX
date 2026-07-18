/**
 * A binary min-heap, ordered by a caller-supplied priority function.
 *
 * Generic and dependency-free — used by `findShortestPath` as Dijkstra's
 * priority queue (pop the unvisited node with the smallest known distance in
 * `O(log n)` instead of scanning every unvisited node in `O(n)`), but has no
 * knowledge of graphs, nodes, or routing itself.
 */
export class MinHeap<T> {
  private readonly items: T[] = [];
  private readonly priorityOf: (item: T) => number;

  constructor(priorityOf: (item: T) => number) {
    this.priorityOf = priorityOf;
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  /** Removes and returns the item with the smallest priority, or undefined if empty. */
  pop(): T | undefined {
    const top = this.items[0];
    if (top === undefined) return undefined;

    const last = this.items.pop();
    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      this.bubbleDown(0);
    }

    return top;
  }

  private bubbleUp(index: number): void {
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.priorityOf(this.items[i]!) >= this.priorityOf(this.items[parent]!)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  private bubbleDown(index: number): void {
    let i = index;
    const length = this.items.length;

    for (;;) {
      const left = i * 2 + 1;
      const right = i * 2 + 2;
      let smallest = i;

      if (
        left < length &&
        this.priorityOf(this.items[left]!) < this.priorityOf(this.items[smallest]!)
      ) {
        smallest = left;
      }
      if (
        right < length &&
        this.priorityOf(this.items[right]!) < this.priorityOf(this.items[smallest]!)
      ) {
        smallest = right;
      }
      if (smallest === i) break;

      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(a: number, b: number): void {
    const temp = this.items[a]!;
    this.items[a] = this.items[b]!;
    this.items[b] = temp;
  }
}
