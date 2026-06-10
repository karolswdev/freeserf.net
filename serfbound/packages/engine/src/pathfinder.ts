import type { Direction } from "./index.js";
import type { SerfboundGameWorld } from "./game-world.js";

// A* road pathfinder ported from Freeserf.Core/Pathfinder.cs. The reference
// searches from the end position toward the start and unwinds the parent
// chain into a road starting at `start`. The reference aborts on a wall-clock
// limit; this port uses a deterministic node-expansion cap instead (recorded
// divergence — wall-clock aborts are not reproducible).

const walkCost = [255, 319, 383, 447, 511] as const;
const directionOrder: readonly Direction[] = ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"];
const reverseOf: Record<Direction, Direction> = {
  Right: "Left",
  DownRight: "UpLeft",
  Down: "Up",
  Left: "Right",
  UpLeft: "DownRight",
  Up: "Down",
};

const maxExpandedNodes = 100_000;

type SearchNode = {
  parent: SearchNode | null;
  gScore: number;
  fScore: number;
  position: number;
  direction: Direction;
};

export type FoundRoad = {
  readonly start: number;
  readonly directions: readonly Direction[];
  readonly cost: number;
};

function heuristicCost(world: SerfboundGameWorld, start: number, end: number): number {
  const heightDifference = Math.abs(world.heights[start]! - world.heights[end]!);
  const distance = mapDistance(world, start, end);
  return distance > 0
    ? distance * walkCost[Math.min(Math.trunc(heightDifference / distance), 4)]!
    : 0;
}

function actualCost(world: SerfboundGameWorld, position: number, direction: Direction): number {
  const otherPosition = world.move(position, direction);
  const heightDifference = Math.abs(world.heights[position]! - world.heights[otherPosition]!);
  return walkCost[Math.min(heightDifference, 4)]!;
}

function mapDistance(world: SerfboundGameWorld, position1: number, position2: number): number {
  const geometry = world.geometry;
  const columns = geometry.columns;
  const rows = geometry.rows;
  const column1 = position1 & geometry.columnMask;
  const column2 = position2 & geometry.columnMask;
  const row1 = (position1 >>> geometry.rowShift) & geometry.rowMask;
  const row2 = (position2 >>> geometry.rowShift) & geometry.rowMask;
  const distanceColumn =
    Math.trunc(columns / 2) - ((Math.trunc(columns / 2) + column1 - column2) & geometry.columnMask);
  const distanceRow =
    Math.trunc(rows / 2) - ((Math.trunc(rows / 2) + row1 - row2) & geometry.rowMask);

  if ((distanceColumn > 0 && distanceRow > 0) || (distanceColumn < 0 && distanceRow < 0)) {
    return Math.max(Math.abs(distanceColumn), Math.abs(distanceRow));
  }

  return Math.abs(distanceColumn) + Math.abs(distanceRow);
}

class NodeHeap {
  readonly #nodes: SearchNode[] = [];

  get size(): number {
    return this.#nodes.length;
  }

  push(node: SearchNode): void {
    this.#nodes.push(node);
    let index = this.#nodes.length - 1;
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.#nodes[parentIndex]!.fScore <= this.#nodes[index]!.fScore) {
        break;
      }

      [this.#nodes[parentIndex], this.#nodes[index]] = [this.#nodes[index]!, this.#nodes[parentIndex]!];
      index = parentIndex;
    }
  }

  pop(): SearchNode {
    const top = this.#nodes[0]!;
    const last = this.#nodes.pop()!;
    if (this.#nodes.length > 0) {
      this.#nodes[0] = last;
      let index = 0;
      for (;;) {
        const left = 2 * index + 1;
        const right = left + 1;
        let smallest = index;
        if (left < this.#nodes.length && this.#nodes[left]!.fScore < this.#nodes[smallest]!.fScore) {
          smallest = left;
        }
        if (right < this.#nodes.length && this.#nodes[right]!.fScore < this.#nodes[smallest]!.fScore) {
          smallest = right;
        }
        if (smallest === index) {
          break;
        }

        [this.#nodes[smallest], this.#nodes[index]] = [this.#nodes[index]!, this.#nodes[smallest]!];
        index = smallest;
      }
    }

    return top;
  }

  find(position: number): SearchNode | undefined {
    return this.#nodes.find((node) => node.position === position);
  }

  reheapify(): void {
    const nodes = this.#nodes.splice(0);
    for (const node of nodes) {
      this.push(node);
    }
  }
}

export function findShortestRoad(
  world: SerfboundGameWorld,
  start: number,
  end: number,
  options: { readonly maxLength?: number; readonly endThere?: boolean } = {},
): FoundRoad | null {
  const maxLength = options.maxLength ?? 256;
  const endThere = options.endThere ?? false;
  if (maxLength < 1 || start === end) {
    return null;
  }

  const open = new NodeHeap();
  const closed = new Set<number>();
  const maxCost = maxLength * 511;
  let expanded = 0;

  open.push({
    parent: null,
    gScore: 0,
    fScore: heuristicCost(world, start, end),
    position: end,
    direction: "Right",
  });

  while (open.size !== 0) {
    expanded += 1;
    if (expanded > maxExpandedNodes) {
      return null;
    }

    const node = open.pop();

    if (node.position === start) {
      const directions: Direction[] = [];
      let current: SearchNode | null = node;
      while (current.parent !== null) {
        directions.push(reverseOf[current.direction]);
        current = current.parent;
      }

      return { start, directions, cost: node.gScore };
    }

    closed.add(node.position);

    for (const direction of directionOrder) {
      const newPosition = world.move(node.position, direction);
      const cost = actualCost(world, node.position, direction);

      if (node.gScore + cost > maxCost) {
        continue;
      }

      if (
        !world.isRoadSegmentValid(node.position, direction, endThere && node.position === end) ||
        (world.objectAt(newPosition) === 1 && newPosition !== start) // 1 = flag
      ) {
        continue;
      }

      if (closed.has(newPosition)) {
        continue;
      }

      const existing = open.find(newPosition);
      if (existing !== undefined) {
        if (existing.gScore > node.gScore + cost) {
          existing.gScore = node.gScore + cost;
          existing.fScore = existing.gScore + heuristicCost(world, newPosition, start);
          existing.parent = node;
          existing.direction = direction;
          open.reheapify();
        }

        continue;
      }

      open.push({
        parent: node,
        gScore: node.gScore + cost,
        fScore: node.gScore + cost + heuristicCost(world, newPosition, start),
        position: newPosition,
        direction,
      });
    }
  }

  return null;
}
