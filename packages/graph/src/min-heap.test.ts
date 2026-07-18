import { describe, expect, it } from 'vitest';
import { MinHeap } from './min-heap';

describe('MinHeap', () => {
  it('is empty on construction', () => {
    const heap = new MinHeap<number>((n) => n);
    expect(heap.isEmpty()).toBe(true);
    expect(heap.size).toBe(0);
    expect(heap.pop()).toBeUndefined();
  });

  it('pops items in ascending priority order', () => {
    const heap = new MinHeap<number>((n) => n);
    const values = [5, 3, 8, 1, 9, 2, 7, 4, 6, 0];
    for (const v of values) heap.push(v);

    const popped: number[] = [];
    while (!heap.isEmpty()) popped.push(heap.pop()!);

    expect(popped).toEqual([...values].sort((a, b) => a - b));
  });

  it('handles duplicate priorities', () => {
    const heap = new MinHeap<number>((n) => n);
    for (const v of [3, 1, 3, 1, 2]) heap.push(v);

    const popped: number[] = [];
    while (!heap.isEmpty()) popped.push(heap.pop()!);

    expect(popped).toEqual([1, 1, 2, 3, 3]);
  });

  it('orders arbitrary items by a custom priority function', () => {
    interface Task {
      name: string;
      cost: number;
    }
    const heap = new MinHeap<Task>((t) => t.cost);
    heap.push({ name: 'c', cost: 30 });
    heap.push({ name: 'a', cost: 10 });
    heap.push({ name: 'b', cost: 20 });

    expect(heap.pop()?.name).toBe('a');
    expect(heap.pop()?.name).toBe('b');
    expect(heap.pop()?.name).toBe('c');
  });

  it('reports size accurately as items are pushed and popped', () => {
    const heap = new MinHeap<number>((n) => n);
    heap.push(1);
    heap.push(2);
    expect(heap.size).toBe(2);
    heap.pop();
    expect(heap.size).toBe(1);
    heap.pop();
    expect(heap.size).toBe(0);
  });

  it('correctly heapifies a larger random sequence', () => {
    const heap = new MinHeap<number>((n) => n);
    const values = Array.from({ length: 200 }, () => Math.floor(Math.random() * 1000));
    for (const v of values) heap.push(v);

    const popped: number[] = [];
    while (!heap.isEmpty()) popped.push(heap.pop()!);

    expect(popped).toEqual([...values].sort((a, b) => a - b));
  });
});
