// Re-export aliases used by the serf professions without widening the main
// module graph.
export { buildingType } from "./game-world.js";
export { mapObject } from "./map-generator.js";

export function isTreeObject(objectValue: number): boolean {
  // Trees, pines, palms (8..27).
  return objectValue >= 8 && objectValue <= 27;
}

export function isStoneObject(objectValue: number): boolean {
  // Stone piles 72..79.
  return objectValue >= 72 && objectValue <= 79;
}
