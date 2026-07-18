import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GraphLoader, GraphValidationError } from './graph-loader';
import type { NetworkData } from './types';

function validNetwork(): NetworkData {
  return {
    resolutionKm: 20,
    nodes: [
      { id: 'a', lon: 0, lat: 0 },
      { id: 'b', lon: 1, lat: 1 },
    ],
    edges: [{ id: 'e1', from: 'a', to: 'b', distanceKm: 157, pass: 'suez' }],
  };
}

describe('GraphLoader.fromData', () => {
  it('builds a Graph from well-formed data', () => {
    const graph = GraphLoader.fromData(validNetwork());

    expect(graph.nodeCount).toBe(2);
    expect(graph.edgeCount).toBe(1);
    expect(graph.getEdge('e1')?.pass).toBe('suez');
  });

  it('rejects a duplicate node id', () => {
    const data = validNetwork();
    data.nodes.push({ id: 'a', lon: 9, lat: 9 });

    expect(() => GraphLoader.fromData(data)).toThrow(GraphValidationError);
  });

  it('rejects a duplicate edge id', () => {
    const data = validNetwork();
    data.edges.push({ id: 'e1', from: 'b', to: 'a', distanceKm: 1 });

    expect(() => GraphLoader.fromData(data)).toThrow(GraphValidationError);
  });

  it('rejects an edge referencing an unknown "from" node', () => {
    const data = validNetwork();
    data.edges[0]!.from = 'missing';

    expect(() => GraphLoader.fromData(data)).toThrow(/unknown node/);
  });

  it('rejects an edge referencing an unknown "to" node', () => {
    const data = validNetwork();
    data.edges[0]!.to = 'missing';

    expect(() => GraphLoader.fromData(data)).toThrow(/unknown node/);
  });

  it('rejects a non-positive distanceKm', () => {
    const data = validNetwork();
    data.edges[0]!.distanceKm = 0;

    expect(() => GraphLoader.fromData(data)).toThrow(/non-positive distanceKm/);
  });
});

describe('GraphLoader.fromFile', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'shiproutesx-graph-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads and parses a network file from disk', async () => {
    const filePath = path.join(dir, '20km.json');
    await writeFile(filePath, JSON.stringify(validNetwork()), 'utf-8');

    const graph = await GraphLoader.fromFile(filePath);

    expect(graph.nodeCount).toBe(2);
    expect(graph.resolutionKm).toBe(20);
  });

  it('rejects a missing file', async () => {
    await expect(GraphLoader.fromFile(path.join(dir, 'does-not-exist.json'))).rejects.toThrow(
      GraphValidationError,
    );
  });

  it('rejects invalid JSON', async () => {
    const filePath = path.join(dir, 'broken.json');
    await writeFile(filePath, '{ not valid json', 'utf-8');

    await expect(GraphLoader.fromFile(filePath)).rejects.toThrow(/parse network file/);
  });

  it('rejects a file that does not match the network schema', async () => {
    const filePath = path.join(dir, 'wrong-shape.json');
    await writeFile(filePath, JSON.stringify({ hello: 'world' }), 'utf-8');

    await expect(GraphLoader.fromFile(filePath)).rejects.toThrow(
      /does not match the expected schema/,
    );
  });
});
