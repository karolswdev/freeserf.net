#!/usr/bin/env python3
"""Emit the data-free classic map generator oracle fixture for Serfbound Phase 11.

This is temporary reference tooling. It mirrors `Freeserf.Core/MapGenerator.cs`
(ClassicMissionMapGenerator: Midpoints + preserveBugs, default water level 20,
max lake area 14, terrain spikyness 0x9999) together with the map geometry and
spiral-pattern helpers from `Freeserf.Core/Map.cs`/`MapGeometry.cs`, so the
browser-native TypeScript port can be compared against a stable JSON fixture
without depending on .NET or original game assets.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT = ROOT / "pm/roadmap/serfbound/reference-fixtures/ci/map-generator-classic.json"
GENERATOR_SOURCE = ROOT / "Freeserf.Core/MapGenerator.cs"

U16 = 0xFFFF
U32 = 0xFFFFFFFF

# Direction enum order: Right, DownRight, Down, Left, UpLeft, Up
RIGHT, DOWN_RIGHT, DOWN, LEFT, UP_LEFT, UP = range(6)

# Terrain values
WATER0, WATER1, WATER2, WATER3 = 0, 1, 2, 3
GRASS0, GRASS1, GRASS2, GRASS3 = 4, 5, 6, 7
DESERT0, DESERT1, DESERT2 = 8, 9, 10
TUNDRA0, TUNDRA1, TUNDRA2 = 11, 12, 13
SNOW0, SNOW1 = 14, 15

# Map.Object values used by the generator
OBJ_NONE = 0
OBJ_TREE0 = 8
OBJ_PINE0 = 16
OBJ_PALM0 = 24
OBJ_WATER_TREE0 = 28
OBJ_STONE0 = 72
OBJ_SANDSTONE0 = 80
OBJ_CROSS = 82
OBJ_STUB = 83
OBJ_STONE = 84
OBJ_CADAVER0 = 86
OBJ_WATER_STONE0 = 88
OBJ_CACTUS0 = 90
OBJ_DEAD_TREE = 92

# Minerals
MIN_NONE, MIN_GOLD, MIN_IRON, MIN_COAL, MIN_STONE = 0, 1, 2, 3, 4

# Space values
SPACE_OPEN, SPACE_FILLED, SPACE_SEMIPASSABLE, SPACE_IMPASSABLE = 0, 1, 2, 3

# Map.MapSpaceFromObject (Map.cs), index = object value 0..127.
MAP_SPACE_FROM_OBJECT = [SPACE_OPEN] * 128
MAP_SPACE_FROM_OBJECT[1] = SPACE_FILLED  # Flag
MAP_SPACE_FROM_OBJECT[2] = SPACE_IMPASSABLE  # SmallBuilding
MAP_SPACE_FROM_OBJECT[3] = SPACE_IMPASSABLE  # LargeBuilding
MAP_SPACE_FROM_OBJECT[4] = SPACE_IMPASSABLE  # Castle
for _o in range(8, 28):  # Tree0..Palm3
    MAP_SPACE_FROM_OBJECT[_o] = SPACE_FILLED
for _o in range(28, 32):  # WaterTree0..3
    MAP_SPACE_FROM_OBJECT[_o] = SPACE_IMPASSABLE
for _o in range(72, 82):  # Stone0..Sandstone1
    MAP_SPACE_FROM_OBJECT[_o] = SPACE_IMPASSABLE
MAP_SPACE_FROM_OBJECT[82] = SPACE_FILLED  # Cross
MAP_SPACE_FROM_OBJECT[83] = SPACE_OPEN  # Stub
MAP_SPACE_FROM_OBJECT[84] = SPACE_OPEN  # Stone
MAP_SPACE_FROM_OBJECT[85] = SPACE_OPEN  # Sandstone3
MAP_SPACE_FROM_OBJECT[86] = SPACE_OPEN  # Cadaver0
MAP_SPACE_FROM_OBJECT[87] = SPACE_OPEN  # Cadaver1
MAP_SPACE_FROM_OBJECT[88] = SPACE_IMPASSABLE  # WaterStone0
MAP_SPACE_FROM_OBJECT[89] = SPACE_IMPASSABLE  # WaterStone1
MAP_SPACE_FROM_OBJECT[90] = SPACE_FILLED  # Cactus0
MAP_SPACE_FROM_OBJECT[91] = SPACE_FILLED  # Cactus1
MAP_SPACE_FROM_OBJECT[92] = SPACE_FILLED  # DeadTree
for _o in range(93, 97):  # FelledPine0..3
    MAP_SPACE_FROM_OBJECT[_o] = SPACE_FILLED
MAP_SPACE_FROM_OBJECT[97] = SPACE_OPEN  # FelledPine4
for _o in range(98, 102):  # FelledTree0..3
    MAP_SPACE_FROM_OBJECT[_o] = SPACE_FILLED
MAP_SPACE_FROM_OBJECT[102] = SPACE_OPEN  # FelledTree4
MAP_SPACE_FROM_OBJECT[103] = SPACE_FILLED  # NewPine
MAP_SPACE_FROM_OBJECT[104] = SPACE_FILLED  # NewTree
for _o in range(105, 111):  # Seeds0..5
    MAP_SPACE_FROM_OBJECT[_o] = SPACE_SEMIPASSABLE


class FreeserfRandom:
    """Mirrors Freeserf.Random word-state RNG."""

    def __init__(self, s0: int, s1: int, s2: int):
        self.state = [s0 & U16, s1 & U16, s2 & U16]

    def next(self) -> int:
        random = self.state
        result = ((random[0] + random[1]) ^ random[2]) & U16
        random[2] = (random[2] + random[1]) & U16
        random[1] ^= random[2]
        random[1] = ((random[1] >> 1) | (random[1] << 15)) & U16
        random[2] = ((random[2] >> 1) | (random[2] << 15)) & U16
        random[0] = result
        return result

    def xor(self, other: "FreeserfRandom") -> "FreeserfRandom":
        return FreeserfRandom(
            self.state[0] ^ other.state[0],
            self.state[1] ^ other.state[1],
            self.state[2] ^ other.state[2],
        )


class MapGeometry:
    """Mirrors Freeserf.MapGeometry."""

    def __init__(self, size: int):
        self.size = size
        self.column_size = 5 + size // 2
        self.row_size = 5 + (size - 1) // 2
        self.columns = 1 << self.column_size
        self.rows = 1 << self.row_size
        self.column_mask = self.columns - 1
        self.row_mask = self.rows - 1
        self.row_shift = self.column_size
        self.tile_count = self.columns * self.rows

        self.directions = [0] * 6
        self.directions[RIGHT] = 1 & self.column_mask
        self.directions[LEFT] = -1 & self.column_mask
        self.directions[DOWN] = (1 & self.row_mask) << self.row_shift
        self.directions[UP] = (-1 & self.row_mask) << self.row_shift
        self.directions[DOWN_RIGHT] = self.directions[RIGHT] | self.directions[DOWN]
        self.directions[UP_LEFT] = self.directions[LEFT] | self.directions[UP]

    def position(self, column: int, row: int) -> int:
        return (row << self.row_shift) | column

    def position_column(self, position: int) -> int:
        return position & self.column_mask

    def position_row(self, position: int) -> int:
        return (position >> self.row_shift) & self.row_mask

    def position_add_offset(self, position: int, offset: int) -> int:
        offset &= U32
        return self.position(
            (self.position_column(position) + self.position_column(offset)) & self.column_mask,
            (self.position_row(position) + self.position_row(offset)) & self.row_mask,
        )

    def move(self, position: int, direction: int) -> int:
        return self.position_add_offset(position, self.directions[direction])

    def move_right(self, position: int) -> int:
        return self.move(position, RIGHT)

    def move_down(self, position: int) -> int:
        return self.move(position, DOWN)

    def move_down_right(self, position: int) -> int:
        return self.move(position, DOWN_RIGHT)

    def move_left(self, position: int) -> int:
        return self.move(position, LEFT)

    def move_up(self, position: int) -> int:
        return self.move(position, UP)

    def move_up_left(self, position: int) -> int:
        return self.move(position, UP_LEFT)

    def move_right_n(self, position: int, count: int) -> int:
        return self.position_add_offset(position, (self.directions[RIGHT] * count) & U32)

    def move_down_n(self, position: int, count: int) -> int:
        return self.position_add_offset(position, (self.directions[DOWN] * count) & U32)


SPIRAL_PATTERN_BASE = [
    0, 0,
    1, 0, 2, 1, 2, 0, 3, 1, 3, 2, 3, 0, 4, 2, 4, 1, 4, 3, 4, 0,
    5, 2, 5, 3, 5, 1, 5, 4, 5, 0, 6, 3, 6, 2, 6, 4, 6, 1, 6, 5,
    6, 0, 7, 3, 7, 4, 7, 2, 7, 5, 7, 1, 7, 6, 7, 0, 8, 4, 8, 3,
    8, 5, 8, 2, 8, 6, 8, 1, 8, 7, 8, 0, 9, 4, 9, 5, 9, 3, 9, 6,
    9, 2, 9, 7, 9, 1, 9, 0, 16, 0, 16, 8, 24, 0, 24, 8, 24, 16,
]

SPIRAL_MATRIX = [
    1, 0, 0, 1,
    1, 1, -1, 0,
    0, 1, -1, -1,
    -1, 0, 0, -1,
    -1, -1, 1, 0,
    0, -1, 1, 1,
]


def build_spiral_pattern() -> list[int]:
    """Mirrors Map.InitSpiralPattern: 2 + 49 ring entries * 6 rotations."""
    pattern = [0] * (2 + 49 * 12)
    pattern[0] = 0
    pattern[1] = 0
    for i in range(49):
        x = SPIRAL_PATTERN_BASE[2 + 2 * i]
        y = SPIRAL_PATTERN_BASE[2 + 2 * i + 1]
        for j in range(6):
            pattern[2 + 12 * i + 2 * j] = x * SPIRAL_MATRIX[4 * j + 0] + y * SPIRAL_MATRIX[4 * j + 2]
            pattern[2 + 12 * i + 2 * j + 1] = x * SPIRAL_MATRIX[4 * j + 1] + y * SPIRAL_MATRIX[4 * j + 3]
    return pattern


class GeneratorMap:
    """The minimal Map surface the generator uses (geometry + spiral pattern)."""

    def __init__(self, size: int):
        self.geometry = MapGeometry(size)
        self.region_count = (self.geometry.columns >> 5) * (self.geometry.rows >> 5)
        spiral = build_spiral_pattern()
        self.spiral_pos_pattern = [
            self.geometry.position(
                spiral[2 * i] & self.geometry.column_mask,
                spiral[2 * i + 1] & self.geometry.row_mask,
            )
            for i in range(295)
        ]

    def position_add_spirally(self, position: int, offset: int) -> int:
        return self.geometry.position_add_offset(position, self.spiral_pos_pattern[offset])

    def get_random_coordinate(self, random: FreeserfRandom) -> int:
        column = random.next() & self.geometry.column_mask
        row = random.next() & self.geometry.row_mask
        return self.geometry.position(column, row)


def direction_cycle_cw(start: int, count: int = 6):
    for offset in range(count):
        yield (start + offset) % 6


class Tile:
    __slots__ = ("height", "type_up", "type_down", "obj", "mineral", "resource_amount")

    def __init__(self):
        self.height = 0
        self.type_up = WATER0
        self.type_down = WATER0
        self.obj = OBJ_NONE
        self.mineral = MIN_NONE
        self.resource_amount = 0


class ClassicMapGenerator:
    """Mirrors Freeserf.ClassicMapGenerator with Midpoints + preserveBugs."""

    def __init__(self, game_map: GeneratorMap, random: FreeserfRandom,
                 max_lake_area: int = 14, water_level: int = 20,
                 terrain_spikyness: int = 0x9999):
        self.map = game_map
        self.geom = game_map.geometry
        self.random = random
        self.max_lake_area = max_lake_area
        self.water_level = water_level
        self.terrain_spikyness = terrain_spikyness
        self.preserve_bugs = True
        self.tiles = [Tile() for _ in range(self.geom.tile_count)]
        self.tags = [0] * self.geom.tile_count

    # --- helpers -----------------------------------------------------------
    def random_int(self) -> int:
        return self.random.next()

    def pos_add_spirally_random(self, position: int, mask: int) -> int:
        return self.map.position_add_spirally(position, self.random_int() & mask)

    def is_water_tile(self, position: int) -> bool:
        tile = self.tiles[position]
        return tile.type_down <= WATER3 and tile.type_up <= WATER3

    def is_in_water(self, position: int) -> bool:
        return (
            self.is_water_tile(position)
            and self.is_water_tile(self.geom.move_up_left(position))
            and self.tiles[self.geom.move_left(position)].type_down <= WATER3
            and self.tiles[self.geom.move_up(position)].type_up <= WATER3
        )

    # --- generation stages -------------------------------------------------
    def generate(self):
        self.random = self.random.xor(FreeserfRandom(0x5A5A, 0xA5A5, 0xC3C3))
        self.random_int()
        self.random_int()

        self.init_heights_squares()
        self.init_heights_midpoints()
        self.clamp_heights()
        self.create_water_bodies()
        self.heights_rebase()
        self.init_types()
        self.remove_islands()
        self.heights_rescale()
        self.change_shore_water_type()
        self.change_shore_grass_type()
        self.create_deserts()
        self.create_objects()
        self.create_mineral_deposits()
        self.clean_up()

    def init_heights_squares(self):
        for y in range(0, self.geom.rows, 16):
            for x in range(0, self.geom.columns, 16):
                rndl = self.random_int() & 0xFF
                self.tiles[self.geom.position(x, y)].height = min(rndl, 250)

    def calc_height_displacement(self, avg: int, base: int, offset: int) -> int:
        height = ((self.random_int() * base) >> 16) - offset + avg
        return max(0, min(height, 250))

    def init_heights_midpoints(self):
        random_value = self.random_int()
        r1 = 0x80 + (random_value & 0x7F)
        r2 = (r1 * self.terrain_spikyness) >> 16

        i = 8
        while i > 0:
            for y in range(0, self.geom.rows, 2 * i):
                for x in range(0, self.geom.columns, 2 * i):
                    position = self.geom.position(x, y)
                    height = self.tiles[position].height

                    position_right = self.geom.move_right_n(position, 2 * i)
                    position_mid_right = self.geom.move_right_n(position, i)
                    height_right = self.tiles[position_right].height

                    if self.preserve_bugs:
                        # Preserved original quirk: the first midpoint keeps the
                        # upper random bits in heightRight.
                        if x == 0 and y == 0 and i == 8:
                            height_right |= random_value & 0xFF00

                    self.tiles[position_mid_right].height = self.calc_height_displacement(
                        (height + height_right) // 2, r1, r2)

                    position_down = self.geom.move_down_n(position, 2 * i)
                    position_mid_down = self.geom.move_down_n(position, i)
                    height_down = self.tiles[position_down].height
                    self.tiles[position_mid_down].height = self.calc_height_displacement(
                        (height + height_down) // 2, r1, r2)

                    position_down_right = self.geom.move_right_n(self.geom.move_down_n(position, 2 * i), 2 * i)
                    position_mid_down_right = self.geom.move_right_n(self.geom.move_down_n(position, i), i)
                    height_down_right = self.tiles[position_down_right].height
                    self.tiles[position_mid_down_right].height = self.calc_height_displacement(
                        (height + height_down_right) // 2, r1, r2)
            r1 >>= 1
            r2 >>= 1
            i >>= 1

    def adjust_map_height(self, height1: int, height2: int, position: int) -> bool:
        if abs(height1 - height2) > 32:
            self.tiles[position].height = height1 + (32 if height1 < height2 else -32)
            return True
        return False

    def clamp_heights(self):
        changed = True
        while changed:
            changed = False
            for position in range(self.geom.tile_count):
                height = self.tiles[position].height

                position_down = self.geom.move_down(position)
                changed |= self.adjust_map_height(height, self.tiles[position_down].height, position_down)

                position_down_right = self.geom.move_down_right(position)
                changed |= self.adjust_map_height(height, self.tiles[position_down_right].height, position_down_right)

                position_right = self.geom.move_right(position)
                changed |= self.adjust_map_height(height, self.tiles[position_right].height, position_right)

    def expand_water_position(self, position: int) -> bool:
        expanding = False
        for direction in direction_cycle_cw(RIGHT):
            new_position = self.geom.move(position, direction)
            height = self.tiles[new_position].height
            if self.water_level < height < 254:
                return False
            if height == 255:
                expanding = True

        if expanding:
            self.tiles[position].height = 255
            for direction in direction_cycle_cw(RIGHT):
                new_position = self.geom.move(position, direction)
                if self.tiles[new_position].height != 255:
                    self.tiles[new_position].height = 254

        return expanding

    def expand_water_body(self, position: int):
        for direction in direction_cycle_cw(RIGHT):
            new_position = self.geom.move(position, direction)
            if self.tiles[new_position].height > self.water_level:
                self.tiles[position].height = 0
                return

        self.tiles[position].height = 255
        for direction in direction_cycle_cw(RIGHT):
            new_position = self.geom.move(position, direction)
            self.tiles[new_position].height = 254

        for i in range(self.max_lake_area):
            expanded = False
            new_position = self.geom.move_right_n(position, i + 1)
            for direction in direction_cycle_cw(DOWN, 6):
                for _ in range(i + 1):
                    expanded |= self.expand_water_position(new_position)
                    new_position = self.geom.move(new_position, direction)
            if not expanded:
                break

        self.tiles[position].height -= 2
        for i in range(self.max_lake_area + 1):
            new_position = self.geom.move_right_n(position, i + 1)
            for direction in direction_cycle_cw(DOWN, 6):
                for _ in range(i + 1):
                    if self.tiles[new_position].height > 253:
                        self.tiles[new_position].height -= 2
                    new_position = self.geom.move(new_position, direction)

    def create_water_bodies(self):
        for height in range(self.water_level + 1):
            for position in range(self.geom.tile_count):
                if self.tiles[position].height == height:
                    self.expand_water_body(position)

        for position in range(self.geom.tile_count):
            height = self.tiles[position].height
            if height == 0:
                self.tiles[position].height = self.water_level + 1
            elif height == 252:
                self.tiles[position].height = self.water_level
            elif height == 253:
                self.tiles[position].height = self.water_level - 1
                self.tiles[position].mineral = MIN_NONE
                self.tiles[position].resource_amount = self.random_int() & 7  # Fish

    def heights_rebase(self):
        base = self.water_level - 1
        for position in range(self.geom.tile_count):
            self.tiles[position].height -= base

    @staticmethod
    def calc_map_type(h_sum: int) -> int:
        if h_sum < 3:
            return WATER0
        if h_sum < 384:
            return GRASS1
        if h_sum < 416:
            return GRASS2
        if h_sum < 448:
            return TUNDRA0
        if h_sum < 480:
            return TUNDRA1
        if h_sum < 528:
            return TUNDRA2
        if h_sum < 560:
            return SNOW0
        return SNOW1

    def init_types(self):
        for position in range(self.geom.tile_count):
            h1 = self.tiles[position].height
            h2 = self.tiles[self.geom.move_right(position)].height
            h3 = self.tiles[self.geom.move_down_right(position)].height
            h4 = self.tiles[self.geom.move_down(position)].height
            self.tiles[position].type_up = self.calc_map_type(h1 + h3 + h4)
            self.tiles[position].type_down = self.calc_map_type(h1 + h2 + h3)

    def remove_islands(self):
        self.tags = [0] * self.geom.tile_count

        for position in range(self.geom.tile_count):
            if self.tiles[position].height > 0 and self.tags[position] == 0:
                self.tags[position] = 1

                num = 0
                changed = True
                while changed:
                    changed = False
                    for other in range(self.geom.tile_count):
                        if self.tags[other] == 1:
                            num += 1
                            self.tags[other] = 2

                            flags = 0
                            if self.tiles[other].type_down >= GRASS0:
                                flags |= 3
                            if self.tiles[other].type_up >= GRASS0:
                                flags |= 6
                            if self.tiles[self.geom.move_left(other)].type_down >= GRASS0:
                                flags |= 0xC
                            if self.tiles[self.geom.move_up_left(other)].type_up >= GRASS0:
                                flags |= 0x18
                            if self.tiles[self.geom.move_up_left(other)].type_down >= GRASS0:
                                flags |= 0x30
                            if self.tiles[self.geom.move_up(other)].type_up >= GRASS0:
                                flags |= 0x21

                            for direction in direction_cycle_cw(RIGHT):
                                if (flags >> direction) & 1:
                                    moved = self.geom.move(other, direction)
                                    if self.tags[moved] == 0:
                                        self.tags[moved] = 1
                                        changed = True

                if 4 * num >= self.geom.tile_count:
                    break

        for position in range(self.geom.tile_count):
            if self.tiles[position].height > 0 and self.tags[position] == 0:
                self.tiles[position].height = 0
                # Preserved reference quirk: TypeUp is assigned twice; TypeDown
                # of the position itself is left unchanged.
                self.tiles[position].type_up = WATER0
                self.tiles[position].type_up = WATER0
                self.tiles[self.geom.move_left(position)].type_down = WATER0
                self.tiles[self.geom.move_up_left(position)].type_up = WATER0
                self.tiles[self.geom.move_up_left(position)].type_down = WATER0
                self.tiles[self.geom.move_up(position)].type_up = WATER0

    def heights_rescale(self):
        for position in range(self.geom.tile_count):
            self.tiles[position].height = (self.tiles[position].height + 5) >> 3

    def seed_terrain_type(self, old: int, seed: int, new: int):
        for position in range(self.geom.tile_count):
            tiles = self.tiles
            geom = self.geom

            if tiles[position].type_up == old and (
                seed == tiles[geom.move_up_left(position)].type_down
                or seed == tiles[geom.move_up_left(position)].type_up
                or seed == tiles[geom.move_up(position)].type_up
                or seed == tiles[geom.move_left(position)].type_down
                or seed == tiles[geom.move_left(position)].type_up
                or seed == tiles[position].type_down
                or seed == tiles[geom.move_right(position)].type_up
                or seed == tiles[geom.move_left(geom.move_down(position))].type_down
                or seed == tiles[geom.move_down(position)].type_down
                or seed == tiles[geom.move_down(position)].type_up
                or seed == tiles[geom.move_down_right(position)].type_down
                or seed == tiles[geom.move_down_right(position)].type_up
            ):
                tiles[position].type_up = new

            if tiles[position].type_down == old and (
                seed == tiles[geom.move_up_left(position)].type_down
                or seed == tiles[geom.move_up_left(position)].type_up
                or seed == tiles[geom.move_up(position)].type_down
                or seed == tiles[geom.move_up(position)].type_up
                or seed == tiles[geom.move_right(geom.move_up(position))].type_up
                or seed == tiles[geom.move_left(position)].type_down
                or seed == tiles[position].type_up
                or seed == tiles[geom.move_right(position)].type_down
                or seed == tiles[geom.move_right(position)].type_up
                or seed == tiles[geom.move_down(position)].type_down
                or seed == tiles[geom.move_down_right(position)].type_down
                or seed == tiles[geom.move_down_right(position)].type_up
            ):
                tiles[position].type_down = new

    def change_shore_water_type(self):
        self.seed_terrain_type(WATER0, GRASS1, WATER3)
        self.seed_terrain_type(WATER0, WATER3, WATER2)
        self.seed_terrain_type(WATER0, WATER2, WATER1)

    def change_shore_grass_type(self):
        self.seed_terrain_type(GRASS1, WATER3, GRASS0)

    def check_desert_down_triangle(self, position: int) -> bool:
        type_down = self.tiles[position].type_down
        type_up = self.tiles[position].type_up
        if type_down != GRASS1 and type_down != DESERT2:
            return False
        if type_up != GRASS1 and type_up != DESERT2:
            return False
        type_down = self.tiles[self.geom.move_left(position)].type_down
        if type_down != GRASS1 and type_down != DESERT2:
            return False
        type_down = self.tiles[self.geom.move_down(position)].type_down
        if type_down != GRASS1 and type_down != DESERT2:
            return False
        return True

    def check_desert_up_triangle(self, position: int) -> bool:
        type_down = self.tiles[position].type_down
        type_up = self.tiles[position].type_up
        if type_down != GRASS1 and type_down != DESERT2:
            return False
        if type_up != GRASS1 and type_up != DESERT2:
            return False
        type_up = self.tiles[self.geom.move_right(position)].type_up
        if type_up != GRASS1 and type_up != DESERT2:
            return False
        type_up = self.tiles[self.geom.move_up(position)].type_up
        if type_up != GRASS1 and type_up != DESERT2:
            return False
        return True

    def create_deserts(self):
        for _ in range(self.map.region_count):
            for _try in range(200):
                random_position = self.map.get_random_coordinate(self.random)

                if (self.tiles[random_position].type_up == GRASS1
                        and self.tiles[random_position].type_down == GRASS1):
                    for index in range(255, -1, -1):
                        position = self.map.position_add_spirally(random_position, index)
                        if self.check_desert_down_triangle(position):
                            self.tiles[position].type_up = DESERT2
                        if self.check_desert_up_triangle(position):
                            self.tiles[position].type_down = DESERT2
                    break

        self.seed_terrain_type(DESERT2, GRASS1, GRASS3)
        self.seed_terrain_type(DESERT2, GRASS3, DESERT0)
        self.seed_terrain_type(DESERT2, DESERT0, DESERT1)

        for position in range(self.geom.tile_count):
            type_down = self.tiles[position].type_down
            type_up = self.tiles[position].type_up
            if GRASS3 <= type_down <= DESERT1:
                self.tiles[position].type_down = GRASS1
            if GRASS3 <= type_up <= DESERT1:
                self.tiles[position].type_up = GRASS1

        self.seed_terrain_type(GRASS1, DESERT2, DESERT1)
        self.seed_terrain_type(GRASS1, DESERT1, DESERT0)
        self.seed_terrain_type(GRASS1, DESERT0, GRASS3)

    def create_crosses(self):
        for position in range(self.geom.tile_count):
            height = self.tiles[position].height
            if (height >= 26
                    and height >= self.tiles[self.geom.move_right(position)].height
                    and height >= self.tiles[self.geom.move_down_right(position)].height
                    and height >= self.tiles[self.geom.move_down(position)].height
                    and height > self.tiles[self.geom.move_left(position)].height
                    and height > self.tiles[self.geom.move_up_left(position)].height
                    and height > self.tiles[self.geom.move_up(position)].height):
                self.tiles[position].obj = OBJ_CROSS

    def create_objects(self):
        regions = self.map.region_count
        self.create_crosses()
        self.create_random_object_clusters(regions * 8, 10, 0xFF, GRASS1, GRASS2, OBJ_TREE0, 0xF)
        self.create_random_object_clusters(regions, 45, 0x3F, GRASS1, GRASS2, OBJ_TREE0, 0x7)
        self.create_random_object_clusters(regions, 30, 0x3F, GRASS0, GRASS2, OBJ_PINE0, 0x7)
        self.create_random_object_clusters(regions, 20, 0x7F, GRASS1, GRASS2, OBJ_TREE0, 0xF)
        self.create_random_object_clusters(regions, 40, 0x3F, GRASS1, GRASS2, OBJ_STONE0, 0x7)
        self.create_random_object_clusters(regions, 15, 0xFF, GRASS1, GRASS2, OBJ_STONE0, 0x7)
        self.create_random_object_clusters(regions, 2, 0xFF, GRASS1, GRASS2, OBJ_DEAD_TREE, 0)
        self.create_random_object_clusters(regions, 6, 0xFF, GRASS1, GRASS2, OBJ_SANDSTONE0, 0x1)
        self.create_random_object_clusters(regions, 50, 0x7F, WATER2, WATER3, OBJ_WATER_TREE0, 0x3)
        self.create_random_object_clusters(regions, 5, 0xFF, GRASS1, GRASS2, OBJ_STUB, 0)
        self.create_random_object_clusters(regions, 10, 0xFF, GRASS1, GRASS2, OBJ_STONE, 0x1)
        self.create_random_object_clusters(regions, 2, 0xF, DESERT2, DESERT2, OBJ_CADAVER0, 0x1)
        self.create_random_object_clusters(regions, 6, 0x7F, DESERT0, DESERT2, OBJ_CACTUS0, 0x1)
        self.create_random_object_clusters(regions, 8, 0x7F, WATER0, WATER2, OBJ_WATER_STONE0, 0x1)
        self.create_random_object_clusters(regions, 6, 0x3F, DESERT2, DESERT2, OBJ_PALM0, 0x3)

    def hexagon_types_in_range(self, position: int, type_min: int, type_max: int) -> bool:
        type_down = self.tiles[position].type_down
        type_up = self.tiles[position].type_up
        if not (type_min <= type_down <= type_max):
            return False
        if not (type_min <= type_up <= type_max):
            return False
        type_down = self.tiles[self.geom.move_left(position)].type_down
        if not (type_min <= type_down <= type_max):
            return False
        type_down = self.tiles[self.geom.move_up_left(position)].type_down
        type_up = self.tiles[self.geom.move_up_left(position)].type_up
        if not (type_min <= type_down <= type_max):
            return False
        if not (type_min <= type_up <= type_max):
            return False
        if self.preserve_bugs:
            # Preserved reference quirk: checks the down type of the up tile.
            type_down = self.tiles[self.geom.move_up(position)].type_down
            if not (type_min <= type_down <= type_max):
                return False
        else:
            type_up = self.tiles[self.geom.move_up(position)].type_up
            if not (type_min <= type_up <= type_max):
                return False
        return True

    def create_random_object_clusters(self, num_clusters: int, objects_in_cluster: int,
                                      position_mask: int, type_min: int, type_max: int,
                                      object_base: int, object_mask: int):
        for _ in range(num_clusters):
            for _try in range(100):
                random_position = self.map.get_random_coordinate(self.random)
                if self.hexagon_types_in_range(random_position, type_min, type_max):
                    for _j in range(objects_in_cluster):
                        position = self.pos_add_spirally_random(random_position, position_mask)
                        if (self.hexagon_types_in_range(position, type_min, type_max)
                                and self.tiles[position].obj == OBJ_NONE):
                            self.tiles[position].obj = object_base + (self.random_int() & object_mask)
                    break

    def expand_mineral_cluster(self, iterations: int, initial_position: int,
                               index: int, amount: int, mineral: int) -> int:
        for _ in range(iterations):
            position = self.map.position_add_spirally(initial_position, index)
            index += 1
            if (self.tiles[position].mineral == MIN_NONE
                    or self.tiles[position].resource_amount < amount):
                self.tiles[position].mineral = mineral
                self.tiles[position].resource_amount = amount
        return index

    ITERATIONS = [1, 6, 12, 18, 24, 30]

    def create_random_mineral_clusters(self, num_clusters: int, mineral: int,
                                       type_min: int, type_max: int):
        for _ in range(num_clusters):
            for _try in range(100):
                position = self.map.get_random_coordinate(self.random)
                if self.hexagon_types_in_range(position, type_min, type_max):
                    index = 0
                    count = 2 + ((self.random_int() >> 2) & 3)
                    for j in range(count):
                        amount = 4 * (count - j)
                        index = self.expand_mineral_cluster(self.ITERATIONS[j], position, index, amount, mineral)
                    break

    DEPOSITS = [(9, MIN_COAL), (4, MIN_IRON), (2, MIN_GOLD), (2, MIN_STONE)]

    def create_mineral_deposits(self):
        regions = self.map.region_count
        for mult, mineral in self.DEPOSITS:
            self.create_random_mineral_clusters(regions * mult, mineral, TUNDRA0, SNOW0)

    def clean_up(self):
        for position in range(self.geom.tile_count):
            if MAP_SPACE_FROM_OBJECT[self.tiles[position].obj] >= SPACE_IMPASSABLE:
                for direction in direction_cycle_cw(LEFT, 3):
                    other_position = self.geom.move(position, direction)
                    space = MAP_SPACE_FROM_OBJECT[self.tiles[other_position].obj]

                    check_impassable = False
                    if not (self.geom.position_column(position) == 0 and direction == LEFT) and \
                       not (direction in (UP, UP_LEFT) and self.geom.position_row(position) == 0):
                        check_impassable = space >= SPACE_IMPASSABLE

                    if self.is_in_water(other_position) or check_impassable:
                        self.tiles[position].obj = OBJ_NONE
                        break


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def last_source_commit(path: Path) -> str:
    result = subprocess.run(
        ["git", "log", "-n", "1", "--format=%H", "--", str(path.relative_to(ROOT))],
        cwd=ROOT, check=True, text=True, capture_output=True,
    )
    return result.stdout.strip()


def generate_case(size: int, seed_bases: tuple[int, int, int]) -> dict:
    game_map = GeneratorMap(size)
    random = FreeserfRandom(*seed_bases)
    generator = ClassicMapGenerator(game_map, random)
    generator.generate()

    heights = [tile.height for tile in generator.tiles]
    types_up = [tile.type_up for tile in generator.tiles]
    types_down = [tile.type_down for tile in generator.tiles]
    objects = [tile.obj for tile in generator.tiles]
    minerals = [tile.mineral for tile in generator.tiles]
    resources = [tile.resource_amount for tile in generator.tiles]

    def digest(values: list[int]) -> str:
        return hashlib.sha256(bytes(values)).hexdigest()

    return {
        "size": size,
        "columns": game_map.geometry.columns,
        "rows": game_map.geometry.rows,
        "seedBases": list(seed_bases),
        "parameters": {
            "heightGenerator": "Midpoints",
            "preserveBugs": True,
            "maxLakeArea": 14,
            "waterLevel": 20,
            "terrainSpikyness": 0x9999,
        },
        "digests": {
            "heights": digest(heights),
            "typesUp": digest(types_up),
            "typesDown": digest(types_down),
            "objects": digest(objects),
            "minerals": digest(minerals),
            "resourceAmounts": digest(resources),
        },
        "heights": heights,
        "typesUp": types_up,
        "typesDown": types_down,
        "objects": objects,
        "minerals": minerals,
        "resourceAmounts": resources,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    cases = [
        generate_case(3, (0x1234, 0x5678, 0x9ABC)),
        generate_case(3, (0xC0DE, 0xBEEF, 0x0042)),
    ]

    fixture = {
        "schemaVersion": 1,
        "targetId": "map.generator-classic",
        "dataRequirement": "data-free / CI-safe",
        "source": {
            "file": "Freeserf.Core/MapGenerator.cs",
            "lastCommit": last_source_commit(GENERATOR_SOURCE),
            "sha256": sha256_file(GENERATOR_SOURCE),
            "methods": [
                "Freeserf.ClassicMapGenerator.Generate()",
                "Freeserf.ClassicMissionMapGenerator.Init() (Midpoints, preserveBugs=true)",
                "Freeserf.Map.PositionAddSpirally / InitSpiralPattern",
                "Freeserf.Map.GetRandomCoordinate",
                "Freeserf.MapGeometry movement and PositionAdd",
            ],
        },
        "generation": {
            "tool": "pm/roadmap/serfbound/reference-tools/capture-map-generator-oracle.py",
            "command": "python3 pm/roadmap/serfbound/reference-tools/capture-map-generator-oracle.py "
                       "--output pm/roadmap/serfbound/reference-fixtures/ci/map-generator-classic.json",
            "notes": "Temporary Phase 11 reference tooling; not product code and not imported by browser runtime.",
        },
        "cases": cases,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(fixture, indent=1, sort_keys=True) + "\n")
    print(f"wrote {args.output}")
    for case in cases:
        water = sum(1 for t in case["typesUp"] if t <= WATER3)
        trees = sum(1 for o in case["objects"] if OBJ_TREE0 <= o < OBJ_TREE0 + 8)
        print(
            f"  size={case['size']} seed={case['seedBases']} waterUp={water} trees={trees} "
            f"minerals={sum(1 for m in case['minerals'] if m != 0)}"
        )


if __name__ == "__main__":
    main()
