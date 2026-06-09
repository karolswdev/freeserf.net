#!/usr/bin/env python3
"""Emit the data-free map geometry oracle fixture for Serfbound Phase 1.

This is temporary reference tooling. It mirrors selected integer behavior from
`MapGeometry.cs` and `CoordinateSpace.cs` so later browser-native code can
compare against stable JSON facts without depending on .NET or original assets.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT = ROOT / "pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json"
SOURCE_FILES = [
    "Freeserf.Core/MapGeometry.cs",
    "Freeserf.Core/CoordinateSpace.cs",
    "Freeserf.Core/Map.cs",
    "Freeserf.Core/Render/RenderMap.cs",
]
TILE_WIDTH = 32
TILE_HEIGHT = 20
DIRECTIONS = ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"]


def last_source_commit(path: str) -> str:
    result = subprocess.run(
        ["git", "log", "-n", "1", "--format=%H", "--", path],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip()


def source_metadata() -> list[dict[str, str]]:
    metadata = []
    for source in SOURCE_FILES:
        data = (ROOT / source).read_bytes()
        metadata.append(
            {
                "path": source,
                "sha256": hashlib.sha256(data).hexdigest(),
                "lastCommit": last_source_commit(source),
            }
        )
    return metadata


def direction_value(direction: str) -> int:
    return DIRECTIONS.index(direction)


def turn(direction: str, times: int) -> str:
    value = (direction_value(direction) + times) % 6
    return DIRECTIONS[value]


def reverse(direction: str) -> str:
    return turn(direction, 3)


def direction_cycle_cw(start: str = "Right", length: int = 6) -> list[str]:
    return [turn(start, offset) for offset in range(length)]


def direction_cycle_ccw(start: str = "Up", length: int = 6) -> list[str]:
    start_value = direction_value(start)
    return [DIRECTIONS[(start_value - offset) % 6] for offset in range(length)]


def direction_cycle_without(direction: str) -> list[str]:
    return direction_cycle_cw(turn(direction, 1), 5)


@dataclass(frozen=True)
class Position:
    x: int
    y: int


class Geometry:
    def __init__(self, size: int):
        if size > 23:
            raise ValueError("MapGeometry.Size above 23 cannot fit MapPos into 32 bits")
        self.size = size
        self.column_size = 5 + size // 2
        self.row_size = 5 + (size - 1) // 2
        self.columns = 1 << self.column_size
        self.rows = 1 << self.row_size
        self.column_mask = self.columns - 1
        self.row_mask = self.rows - 1
        self.row_shift = self.column_size
        self.directions = {
            "Right": 1 & self.column_mask,
            "Left": (-1) & self.column_mask,
            "Down": (1 & self.row_mask) << self.row_shift,
            "Up": ((-1) & self.row_mask) << self.row_shift,
        }
        self.directions["DownRight"] = self.directions["Right"] | self.directions["Down"]
        self.directions["UpLeft"] = self.directions["Left"] | self.directions["Up"]
        self.column_row_factor = 4 if size % 2 == 0 else 2

    def position_column(self, position: int) -> int:
        return position & self.column_mask

    def position_row(self, position: int) -> int:
        return (position >> self.row_shift) & self.row_mask

    def position(self, column: int, row: int) -> int:
        return (row << self.row_shift) | column

    def position_add(self, position: int, column_delta: int, row_delta: int) -> int:
        column = (self.columns + self.position_column(position) + column_delta) & self.column_mask
        row = (self.rows + self.position_row(position) + row_delta) & self.row_mask
        return self.position(column, row)

    def position_add_offset(self, position: int, offset: int) -> int:
        column = (self.position_column(position) + self.position_column(offset)) & self.column_mask
        row = (self.position_row(position) + self.position_row(offset)) & self.row_mask
        return self.position(column, row)

    def distance_x(self, left: int, right: int) -> int:
        return self.columns // 2 - ((self.columns // 2 + self.position_column(left) - self.position_column(right)) & self.column_mask)

    def distance_y(self, left: int, right: int) -> int:
        return self.rows // 2 - ((self.rows // 2 + self.position_row(left) - self.position_row(right)) & self.row_mask)

    def move(self, position: int, direction: str) -> int:
        return self.position_add_offset(position, self.directions[direction])

    def move_right_n(self, position: int, count: int) -> int:
        return self.position_add_offset(position, self.directions["Right"] * count)

    def move_down_n(self, position: int, count: int) -> int:
        return self.position_add_offset(position, self.directions["Down"] * count)

    def height(self, position: int) -> int:
        column = self.position_column(position)
        row = self.position_row(position)
        return (column * 3 + row * 5 + self.size) % 32

    def normalize_map_position(self, x: int, y: int) -> Position:
        map_width = self.columns * TILE_WIDTH
        map_height = self.rows * TILE_HEIGHT
        while y < 0:
            x -= map_width // self.column_row_factor
            y += map_height
        while y >= map_height:
            x += map_width // self.column_row_factor
            y -= map_height
        while x < 0:
            x += map_width
        while x >= map_width:
            x -= map_width
        return Position(x, y)

    def tile_space_to_map_space(self, position: int) -> Position:
        column = self.position_column(position)
        row = self.position_row(position)
        x = column * TILE_WIDTH - row * TILE_WIDTH // 2
        y = row * TILE_HEIGHT
        y -= 4 * self.height(position)
        return self.normalize_map_position(x, y)

    def map_space_to_view_space(self, x: int, y: int, scroll_x: int = 0, scroll_y: int = 0) -> Position:
        map_width = self.columns * TILE_WIDTH
        map_height = self.rows * TILE_HEIGHT
        x -= scroll_x * TILE_WIDTH
        y -= scroll_y * TILE_HEIGHT
        while y < 0:
            x -= map_width // self.column_row_factor
            y += map_height
        while y >= map_height:
            x += map_width // self.column_row_factor
            y -= map_height
        while x < 0:
            x += map_width
        while x >= map_width:
            x -= map_width
        return Position(x, y)

    def view_space_to_map_space(self, x: int, y: int, scroll_x: int = 0, scroll_y: int = 0) -> Position:
        map_width = self.columns * TILE_WIDTH
        map_height = self.rows * TILE_HEIGHT
        x += scroll_x * TILE_WIDTH
        y += scroll_y * TILE_HEIGHT
        while y < 0:
            x += (self.column_row_factor - 1) * map_width // self.column_row_factor
            y += map_height
        while y >= map_height:
            x -= (self.column_row_factor - 1) * map_width // self.column_row_factor
            y -= map_height
        while x < 0:
            x += map_width
        while x >= map_width:
            x -= map_width
        return Position(x, y)

    def squared_distance_to_map_position(self, position: int, x: int, y: int) -> int:
        map_width = self.columns * TILE_WIDTH
        map_height = self.rows * TILE_HEIGHT
        map_position = self.tile_space_to_map_space(position)
        map_x = map_position.x
        distance_x = abs(x - map_x)
        distance_y = abs(y - map_position.y)
        if distance_y > map_height // 2:
            distance_y = map_height - distance_y
            map_x += map_width // self.column_row_factor
            map_x -= map_width
            distance_x = abs(x - map_x)
        if distance_x > map_width // 2:
            distance_x = map_width - distance_x
        return distance_x * distance_x + distance_y * distance_y

    def first_spiral_positions(self, position: int) -> list[int]:
        offsets = [(0, 0), (1, 0), (1, 1), (0, 1), (-1, 0), (-1, -1), (0, -1)]
        return [self.position_add(position, column_delta, row_delta) for column_delta, row_delta in offsets]

    def map_space_to_tile_space(self, x: int, y: int, scroll_y: int = 0) -> int:
        normalized = self.normalize_map_position(x, y)
        x = normalized.x
        y = normalized.y
        row = (y // TILE_HEIGHT) % self.rows
        column = ((x + row * TILE_WIDTH // 2) // TILE_WIDTH) % self.columns
        position = self.position(column, row)
        map_position = self.tile_space_to_map_space(position)
        down = scroll_y % 2 == 0
        if map_position.y > y:
            map_position = Position(map_position.x, map_position.y - self.rows * TILE_HEIGHT)
        while map_position.y < y:
            height = self.height(position)
            position = self.move(position, "Down" if down else "DownRight")
            map_position = Position(
                map_position.x,
                map_position.y + TILE_HEIGHT - (self.height(position) - height) * 4,
            )
            down = not down
        candidates = self.first_spiral_positions(position)
        return sorted(candidates, key=lambda tile: (self.squared_distance_to_map_position(tile, x, y), tile))[0]


def position_record(geometry: Geometry, position: int) -> dict[str, int]:
    return {
        "position": position,
        "column": geometry.position_column(position),
        "row": geometry.position_row(position),
    }


def point_record(point: Position) -> dict[str, int]:
    return {"x": point.x, "y": point.y}


def geometry_case(size: int) -> dict[str, Any]:
    geometry = Geometry(size)
    positions = [
        geometry.position(0, 0),
        geometry.position(1, 1),
        geometry.position(geometry.columns - 1, geometry.rows - 1),
        geometry.position(geometry.columns - 2, 0),
        geometry.position(0, geometry.rows - 2),
        geometry.position(geometry.columns // 2, geometry.rows // 2),
    ]
    movement_rows = []
    for position in positions:
        moves = {direction: position_record(geometry, geometry.move(position, direction)) for direction in DIRECTIONS}
        movement_rows.append(
            {
                "start": position_record(geometry, position),
                "moves": moves,
                "moveRightN3": position_record(geometry, geometry.move_right_n(position, 3)),
                "moveDownN3": position_record(geometry, geometry.move_down_n(position, 3)),
            }
        )

    distance_pairs = [
        (geometry.position(0, 0), geometry.position(1, 1)),
        (geometry.position(0, 0), geometry.position(geometry.columns - 1, geometry.rows - 1)),
        (geometry.position(geometry.columns - 2, 0), geometry.position(1, geometry.rows - 1)),
        (geometry.position(geometry.columns // 2, geometry.rows // 2), geometry.position(0, 0)),
    ]

    projection_positions = [
        geometry.position(0, 0),
        geometry.position(2, 3),
        geometry.position(geometry.columns - 1, geometry.rows - 1),
        geometry.position(geometry.columns // 2, geometry.rows // 2),
    ]
    projection_rows = []
    for position in projection_positions:
        map_point = geometry.tile_space_to_map_space(position)
        view_point = geometry.map_space_to_view_space(map_point.x, map_point.y, scroll_x=1, scroll_y=2)
        round_trip = geometry.view_space_to_map_space(view_point.x, view_point.y, scroll_x=1, scroll_y=2)
        projection_rows.append(
            {
                "tile": position_record(geometry, position),
                "syntheticHeight": geometry.height(position),
                "tileToMap": point_record(map_point),
                "mapToViewScroll1x2": point_record(view_point),
                "viewToMapScroll1x2": point_record(round_trip),
            }
        )

    tile_lookup_rows = []
    for x, y, scroll_y in [(0, 0, 0), (64, 40, 0), (-16, -8, 0), (geometry.columns * TILE_WIDTH + 3, 25, 1)]:
        map_point = geometry.view_space_to_map_space(x, y, scroll_x=0, scroll_y=scroll_y)
        tile = geometry.map_space_to_tile_space(map_point.x, map_point.y, scroll_y=scroll_y)
        tile_lookup_rows.append(
            {
                "viewInput": {"x": x, "y": y, "scrollY": scroll_y},
                "mapSpace": point_record(map_point),
                "tile": position_record(geometry, tile),
            }
        )

    return {
        "size": size,
        "dimensions": {
            "columnSize": geometry.column_size,
            "rowSize": geometry.row_size,
            "columns": geometry.columns,
            "rows": geometry.rows,
            "columnMask": geometry.column_mask,
            "rowMask": geometry.row_mask,
            "rowShift": geometry.row_shift,
            "tileCount": geometry.columns * geometry.rows,
            "columnRowFactor": geometry.column_row_factor,
        },
        "directionOffsets": geometry.directions,
        "positionSamples": [position_record(geometry, position) for position in positions],
        "movementSamples": movement_rows,
        "distanceSamples": [
            {
                "left": position_record(geometry, left),
                "right": position_record(geometry, right),
                "distanceX": geometry.distance_x(left, right),
                "distanceY": geometry.distance_y(left, right),
            }
            for left, right in distance_pairs
        ],
        "projectionSamples": projection_rows,
        "viewToTileSamples": tile_lookup_rows,
    }


def build_fixture() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "targetId": "map.geometry-facts",
        "dataRequirement": "data-free / CI-safe",
        "source": {
            "files": source_metadata(),
            "methods": [
                "DirectionExtensions.Turn()",
                "DirectionExtensions.Reverse()",
                "DirectionCycleCW.CreateDefault()",
                "DirectionCycleCW.CreateWithout()",
                "DirectionCycleCCW.CreateDefault()",
                "MapGeometry.PositionColumn()",
                "MapGeometry.PositionRow()",
                "MapGeometry.Position()",
                "MapGeometry.PositionAdd()",
                "MapGeometry.DistanceX()",
                "MapGeometry.DistanceY()",
                "MapGeometry.Move()",
                "MapGeometry.MoveRightN()",
                "MapGeometry.MoveDownN()",
                "CoordinateSpace.TileSpaceToMapSpace()",
                "CoordinateSpace.MapSpaceToViewSpace()",
                "CoordinateSpace.ViewSpaceToMapSpace()",
                "CoordinateSpace.MapSpaceToTileSpace()",
                "CoordinateSpace.ViewSpaceToTileSpace()",
                "RenderMap.TILE_WIDTH",
                "RenderMap.TILE_HEIGHT",
            ],
        },
        "generation": {
            "command": "python3 pm/roadmap/serfbound/reference-tools/capture-map-geometry-oracle.py --output pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json",
            "tool": "pm/roadmap/serfbound/reference-tools/capture-map-geometry-oracle.py",
            "notes": "Temporary Phase 1 source-derived reference tooling; not product code and not imported by browser runtime.",
        },
        "renderConstants": {
            "tileWidth": TILE_WIDTH,
            "tileHeight": TILE_HEIGHT,
        },
        "directionFacts": {
            "values": {direction: direction_value(direction) for direction in DIRECTIONS},
            "turnSamples": [
                {"direction": direction, "times": times, "result": turn(direction, times)}
                for direction in DIRECTIONS
                for times in [-7, -1, 0, 1, 3, 8]
            ],
            "reverse": {direction: reverse(direction) for direction in DIRECTIONS},
            "cycleCWDefault": direction_cycle_cw(),
            "cycleCCWDefault": direction_cycle_ccw(),
            "cycleCWWithoutDown": direction_cycle_without("Down"),
        },
        "heightModel": {
            "kind": "synthetic",
            "formula": "(column * 3 + row * 5 + size) % 32",
            "reason": "CoordinateSpace projection requires map heights; Phase 1 keeps this data-free.",
        },
        "cases": [geometry_case(3), geometry_case(4)],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    output = args.output
    if not output.is_absolute():
        output = ROOT / output

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(build_fixture(), indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
