// Inventory port from Freeserf.Core/Inventory.cs: castle/stock resource
// holdings, the initial-supplies preset templates with the reference
// interpolation, and serf stocking.

export const resourceType = {
  fish: 0,
  pig: 1,
  meat: 2,
  wheat: 3,
  flour: 4,
  bread: 5,
  lumber: 6,
  plank: 7,
  boat: 8,
  stone: 9,
  ironOre: 10,
  steel: 11,
  coal: 12,
  goldOre: 13,
  goldBar: 14,
  shovel: 15,
  hammer: 16,
  rod: 17,
  cleaver: 18,
  scythe: 19,
  axe: 20,
  saw: 21,
  pick: 22,
  pincer: 23,
  sword: 24,
  shield: 25,
} as const;

export const resourceTypeCount = 26;

// Inventory.SuppliesTemplates (5 rows x 26 resources).
const suppliesTemplates: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0, 0, 0, 7, 0, 2, 0, 0, 0, 0, 0, 1, 6, 1, 0, 0, 1, 2, 3, 0, 10, 10],
  [2, 1, 1, 3, 2, 1, 0, 25, 1, 8, 4, 3, 8, 2, 1, 3, 12, 2, 1, 1, 2, 3, 4, 1, 30, 30],
  [3, 2, 2, 10, 3, 1, 0, 40, 2, 20, 12, 8, 20, 4, 2, 5, 20, 3, 1, 2, 3, 4, 6, 2, 60, 60],
  [8, 4, 6, 20, 7, 5, 3, 80, 5, 40, 20, 40, 50, 8, 4, 10, 30, 5, 2, 4, 6, 6, 12, 4, 100, 100],
  [30, 10, 30, 50, 10, 30, 10, 200, 10, 100, 30, 150, 100, 10, 5, 20, 50, 10, 5, 10, 20, 20, 50, 10, 200, 200],
];

// Inventory.ApplySuppliesPreset: interpolate between template rows with the
// reference fixed-point math.
export function suppliesPresetResources(supplies: number): Uint32Array {
  let template1: readonly number[];
  let template2: readonly number[];
  let remainder = supplies;

  if (supplies < 10) {
    template1 = suppliesTemplates[0]!;
    template2 = suppliesTemplates[1]!;
  } else if (supplies < 20) {
    template1 = suppliesTemplates[1]!;
    template2 = suppliesTemplates[2]!;
    remainder -= 10;
  } else if (supplies < 30) {
    template1 = suppliesTemplates[2]!;
    template2 = suppliesTemplates[3]!;
    remainder -= 20;
  } else if (supplies < 40) {
    template1 = suppliesTemplates[3]!;
    template2 = suppliesTemplates[4]!;
    remainder -= 30;
  } else {
    template1 = suppliesTemplates[4]!;
    template2 = suppliesTemplates[4]!;
    remainder -= 40;
  }

  const resources = new Uint32Array(resourceTypeCount);
  for (let index = 0; index < resourceTypeCount; index += 1) {
    let t1 = template1[index]!;
    const n = (template2[index]! - t1) * remainder * 6554;
    if (n >= 0x8000) {
      t1 += 1;
    }

    resources[index] = t1 + (n >> 16);
  }

  return resources;
}

export type WorldInventory = {
  readonly index: number;
  readonly player: number;
  readonly buildingIndex: number;
  readonly flagIndex: number;
  readonly resources: Uint32Array;
  // Generic serf pool waiting inside (professions arrive with the chains).
  genericSerfs: number;
  // Knights waiting inside, recruited from generic serfs with weapons
  // (the reference Inventory serf-type counts, condensed to the pool).
  knights: number;
  // Outbound resources waiting for a free slot on the inventory flag
  // (the reference schedules these through MoveResourceOut).
  readonly pendingOut: { resource: number; destinationFlagIndex: number }[];
};

export function createInventory(
  index: number,
  player: number,
  buildingIndex: number,
  flagIndex: number,
  initialSupplies: number,
): WorldInventory {
  return {
    index,
    player,
    buildingIndex,
    flagIndex,
    resources: suppliesPresetResources(initialSupplies),
    // Castle serf stocking, condensed: a base crew plus one per supply level
    // (the reference seeds serfs through GameInitBox player settings).
    genericSerfs: 5 + initialSupplies,
    knights: 0,
    pendingOut: [],
  };
}

// Inventory.PromoteSerfToKnight: a generic serf plus one sword and one
// shield become a knight of the lowest rank.
export function inventoryPromoteSerfToKnight(inventory: WorldInventory): boolean {
  if (
    inventory.genericSerfs <= 0 ||
    (inventory.resources[resourceType.sword] ?? 0) === 0 ||
    (inventory.resources[resourceType.shield] ?? 0) === 0
  ) {
    return false;
  }

  inventory.resources[resourceType.sword] = inventory.resources[resourceType.sword]! - 1;
  inventory.resources[resourceType.shield] = inventory.resources[resourceType.shield]! - 1;
  inventory.genericSerfs -= 1;
  inventory.knights += 1;
  return true;
}

export function inventoryTakeResource(inventory: WorldInventory, resource: number): boolean {
  if ((inventory.resources[resource] ?? 0) <= 0) {
    return false;
  }

  inventory.resources[resource] = inventory.resources[resource]! - 1;
  return true;
}

export function inventoryStoreResource(inventory: WorldInventory, resource: number): void {
  inventory.resources[resource] = (inventory.resources[resource] ?? 0) + 1;
}

export function inventoryTakeSerf(inventory: WorldInventory): boolean {
  if (inventory.genericSerfs <= 0) {
    return false;
  }

  inventory.genericSerfs -= 1;
  return true;
}
