#!/usr/bin/env python3
"""Emit local/manual SPAU.PA catalog metadata for Serfbound Phase 1.

This tool reads user-provided local data from ignored `serfbound-local-data/`
and writes metadata only. It never writes raw archive entries, sprites, sounds,
music, palettes, or any other original asset payload.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_INPUT = (
    ROOT
    / "serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA"
)
DEFAULT_OUTPUT = ROOT / "serfbound-local-data/reference-output/spau-catalog-metadata.json"
EXPECTED_SPAU_SHA256 = "4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2"

DOS_RESOURCES = [
    {"name": "none", "type": "Unknown", "count": 0, "dosIndex": 0, "dosPalette": 0, "spriteType": "Unknown"},
    {"name": "art_landscape", "type": "Sprite", "count": 1, "dosIndex": 1, "dosPalette": 3997, "spriteType": "Solid"},
    {"name": "animation", "type": "Animation", "count": 200, "dosIndex": 2, "dosPalette": 0, "spriteType": "Unknown"},
    {"name": "serf_shadow", "type": "Sprite", "count": 1, "dosIndex": 4, "dosPalette": 3, "spriteType": "Overlay"},
    {"name": "dotted_lines", "type": "Sprite", "count": 7, "dosIndex": 5, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "art_flag", "type": "Sprite", "count": 7, "dosIndex": 15, "dosPalette": 3997, "spriteType": "Solid"},
    {"name": "art_box", "type": "Sprite", "count": 14, "dosIndex": 25, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "credits_bg", "type": "Sprite", "count": 1, "dosIndex": 40, "dosPalette": 3998, "spriteType": "Solid"},
    {"name": "logo", "type": "Sprite", "count": 1, "dosIndex": 41, "dosPalette": 3998, "spriteType": "Solid"},
    {"name": "symbol", "type": "Sprite", "count": 16, "dosIndex": 42, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "map_mask_up", "type": "Sprite", "count": 81, "dosIndex": 60, "dosPalette": 3, "spriteType": "Mask"},
    {"name": "map_mask_down", "type": "Sprite", "count": 81, "dosIndex": 141, "dosPalette": 3, "spriteType": "Mask"},
    {"name": "path_mask", "type": "Sprite", "count": 27, "dosIndex": 230, "dosPalette": 3, "spriteType": "Mask"},
    {"name": "map_ground", "type": "Sprite", "count": 33, "dosIndex": 260, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "path_ground", "type": "Sprite", "count": 10, "dosIndex": 300, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "game_object", "type": "Sprite", "count": 279, "dosIndex": 321, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "frame_top", "type": "Sprite", "count": 4, "dosIndex": 600, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "map_border", "type": "Sprite", "count": 10, "dosIndex": 610, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "map_waves", "type": "Sprite", "count": 16, "dosIndex": 630, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "frame_popup", "type": "Sprite", "count": 4, "dosIndex": 660, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "indicator", "type": "Sprite", "count": 8, "dosIndex": 670, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "font", "type": "Sprite", "count": 44, "dosIndex": 750, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "font_shadow", "type": "Sprite", "count": 44, "dosIndex": 810, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "icon", "type": "Sprite", "count": 318, "dosIndex": 870, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "map_object", "type": "Sprite", "count": 194, "dosIndex": 1250, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "map_shadow", "type": "Sprite", "count": 194, "dosIndex": 1500, "dosPalette": 3, "spriteType": "Overlay"},
    {"name": "panel_button", "type": "Sprite", "count": 25, "dosIndex": 1750, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "frame_bottom", "type": "Sprite", "count": 26, "dosIndex": 1780, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "serf_torso", "type": "Sprite", "count": 541, "dosIndex": 2500, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "serf_head", "type": "Sprite", "count": 630, "dosIndex": 3150, "dosPalette": 3, "spriteType": "Transparent"},
    {"name": "frame_split", "type": "Sprite", "count": 3, "dosIndex": 3880, "dosPalette": 3, "spriteType": "Solid"},
    {"name": "sound", "type": "Sound", "count": 90, "dosIndex": 3900, "dosPalette": 0, "spriteType": "Unknown"},
    {"name": "music", "type": "Music", "count": 7, "dosIndex": 3990, "dosPalette": 0, "spriteType": "Unknown"},
    {"name": "cursor", "type": "Sprite", "count": 1, "dosIndex": 3999, "dosPalette": 3, "spriteType": "Transparent"},
]

FIXUP_TARGETS = (
    [(3450 + 6 * i + j, 3450 + 6 * i) for i in range(48) for j in range(1, 6)]
    + [(3765 + i, 3762 + i) for i in range(3)]
    + [(1363 + i, 1352) for i in range(6)]
    + [(1613 + i, 1602) for i in range(6)]
)


def relative(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stable_sha256(value: Any) -> str:
    data = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256_bytes(data)


def last_source_commit(path: str) -> str:
    result = subprocess.run(
        ["git", "log", "-n", "1", "--format=%H", "--", path],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip()


def read_u32_le(data: bytes, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 4], "little")


def parse_entries(data: bytes) -> dict[str, Any]:
    declared_size = read_u32_le(data, 0)
    entry_count = read_u32_le(data, 4)
    table_start = 8
    table_size = entry_count * 8
    table_end = table_start + table_size

    raw_entries = []
    entries = [{"index": 0, "offset": 0, "size": 0, "defined": False, "source": "synthetic-whole-file-placeholder"}]
    for index in range(entry_count):
        table_offset = table_start + index * 8
        size = read_u32_le(data, table_offset)
        offset = read_u32_le(data, table_offset + 4)
        entry = {
            "index": index + 1,
            "offset": offset,
            "size": size,
            "defined": offset != 0,
            "source": "catalog",
        }
        raw_entries.append(entry)
        entries.append(dict(entry))

    for target, source in FIXUP_TARGETS:
        if target < len(entries) and source < len(entries):
            fixed = dict(entries[source])
            fixed["index"] = target
            fixed["source"] = f"fixup:{source}"
            entries[target] = fixed

    return {
        "declaredSize": declared_size,
        "entryCount": entry_count,
        "tableStart": table_start,
        "tableSize": table_size,
        "tableEnd": table_end,
        "entries": entries,
        "rawEntries": raw_entries,
    }


def summarize_entries(data_size: int, entries: list[dict[str, Any]]) -> dict[str, Any]:
    defined = [entry for entry in entries if entry["defined"]]
    invalid = [
        entry
        for entry in defined
        if entry["offset"] < 0 or entry["size"] < 0 or entry["offset"] + entry["size"] > data_size
    ]
    offsets = sorted((entry["offset"], entry["offset"] + entry["size"], entry["index"]) for entry in defined)
    overlaps = []
    for previous, current in zip(offsets, offsets[1:]):
        if current[0] < previous[1]:
            overlaps.append({"leftIndex": previous[2], "rightIndex": current[2]})

    sizes = [entry["size"] for entry in defined]
    return {
        "totalWithPlaceholder": len(entries),
        "defined": len(defined),
        "undefined": len(entries) - len(defined),
        "invalidBounds": invalid[:20],
        "invalidBoundsCount": len(invalid),
        "overlapSamples": overlaps[:20],
        "overlapCount": len(overlaps),
        "largestEntries": sorted(
            ({"index": entry["index"], "offset": entry["offset"], "size": entry["size"]} for entry in defined),
            key=lambda entry: (-entry["size"], entry["index"]),
        )[:12],
        "sizeStats": {
            "min": min(sizes) if sizes else 0,
            "max": max(sizes) if sizes else 0,
            "totalDeclaredPayloadBytes": sum(sizes),
        },
    }


def entry_defined(entries: list[dict[str, Any]], index: int) -> bool:
    return 0 <= index < len(entries) and bool(entries[index]["defined"])


def resource_catalog(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for resource in DOS_RESOURCES:
        start = resource["dosIndex"]
        count = resource["count"]
        indexes = list(range(start, start + count))
        available = [index for index in indexes if entry_defined(entries, index)]
        palette_index = resource["dosPalette"]
        rows.append(
            {
                **resource,
                "firstArchiveIndex": start if count else None,
                "lastArchiveIndex": start + count - 1 if count else None,
                "availableCount": len(available),
                "missingCount": count - len(available),
                "firstAvailableIndex": available[0] if available else None,
                "lastAvailableIndex": available[-1] if available else None,
                "paletteAvailable": entry_defined(entries, palette_index) if palette_index else None,
            }
        )
    return rows


def selected_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    indexes = [1, 2, 3, 4, 5, 60, 321, 750, 1250, 2500, 3150, 3880, 3900, 3990, 3997, 3998, 3999]
    return [
        {
            "index": index,
            "offset": entries[index]["offset"],
            "size": entries[index]["size"],
            "defined": entries[index]["defined"],
            "source": entries[index]["source"],
        }
        for index in indexes
        if index < len(entries)
    ]


def build_present(path: Path, output: Path) -> dict[str, Any]:
    data = path.read_bytes()
    parsed = parse_entries(data)
    entries = parsed["entries"]
    catalog_rows = resource_catalog(entries)
    entry_metadata = [
        {"index": entry["index"], "offset": entry["offset"], "size": entry["size"], "defined": entry["defined"], "source": entry["source"]}
        for entry in entries
    ]
    resource_metadata = [
        {
            "name": row["name"],
            "type": row["type"],
            "count": row["count"],
            "dosIndex": row["dosIndex"],
            "availableCount": row["availableCount"],
            "missingCount": row["missingCount"],
            "paletteAvailable": row["paletteAvailable"],
        }
        for row in catalog_rows
    ]

    return {
        "schemaVersion": 1,
        "targetId": "dos.spau-catalog-metadata",
        "status": "present",
        "dataRequirement": "local/manual SPAU.PA",
        "source": {
            "label": "Serf-City-Life-is-Feudal_DOS_EN",
            "path": relative(path),
            "fileName": path.name,
            "size": len(data),
            "sha256": sha256_bytes(data),
            "expectedSha256": EXPECTED_SPAU_SHA256,
            "checksumMatchesInventory": sha256_bytes(data) == EXPECTED_SPAU_SHA256,
        },
        "generation": {
            "command": "python3 pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py",
            "tool": "pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py",
            "output": relative(output),
            "notes": "Local/manual metadata only; output is ignored and contains no raw original asset payload.",
        },
        "referenceSources": {
            "files": [
                {
                    "path": "Freeserf.Core/Data/DataSourceDos.cs",
                    "lastCommit": last_source_commit("Freeserf.Core/Data/DataSourceDos.cs"),
                },
                {
                    "path": "Freeserf.Core/Data/Data.cs",
                    "lastCommit": last_source_commit("Freeserf.Core/Data/Data.cs"),
                },
                {
                    "path": "pm/roadmap/serfbound/adoption/local-asset-inventory.md",
                    "lastCommit": last_source_commit("pm/roadmap/serfbound/adoption/local-asset-inventory.md"),
                },
            ],
            "methods": [
                "DataSourceDos.Check()",
                "DataSourceDos.Load()",
                "DataSourceDos.GetSpriteParts()",
                "DataSourceDos.GetSound()",
                "DataSourceDos.GetMusic()",
                "DataSourceDos.GetObject()",
                "Data.GetResourceName()",
                "Data.GetResourceCount()",
                "Data.GetResourceType()",
            ],
        },
        "archive": {
            "format": "DOS PA catalog, little-endian uint32 metadata",
            "header": {
                "declaredSize": parsed["declaredSize"],
                "declaredSizeMatchesFileSize": parsed["declaredSize"] == len(data),
                "entryCount": parsed["entryCount"],
                "tableStart": parsed["tableStart"],
                "tableSize": parsed["tableSize"],
                "tableEnd": parsed["tableEnd"],
            },
            "entrySummary": summarize_entries(len(data), entries),
            "selectedEntries": selected_entries(entries),
            "fixupSummary": {
                "count": len(FIXUP_TARGETS),
                "samples": [{"target": target, "source": source} for target, source in FIXUP_TARGETS[:12]],
            },
            "metadataChecksums": {
                "entriesSha256": stable_sha256(entry_metadata),
                "resourcesSha256": stable_sha256(resource_metadata),
            },
        },
        "resources": catalog_rows,
        "safety": {
            "containsRawPayload": False,
            "payloadPolicy": "Only offsets, sizes, counts, names, source identities, and checksums of metadata are written.",
            "gitPolicy": "`serfbound-local-data/` is ignored; this file must not be committed.",
        },
    }


def build_skipped(path: Path, output: Path) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "targetId": "dos.spau-catalog-metadata",
        "status": "skipped",
        "dataRequirement": "local/manual SPAU.PA",
        "source": {
            "path": relative(path),
            "fileName": path.name,
            "expectedSha256": EXPECTED_SPAU_SHA256,
        },
        "generation": {
            "command": "python3 pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py",
            "tool": "pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py",
            "output": relative(output),
            "notes": "Skipped because local user-provided SPAU.PA was not found. This is expected in CI.",
        },
        "safety": {
            "containsRawPayload": False,
            "gitPolicy": "CI must remain useful without `serfbound-local-data/`.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", type=Path, default=None)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    input_path = args.path or Path(os.environ.get("SERFBOUND_SPAU_PATH", DEFAULT_INPUT))
    if not input_path.is_absolute():
        input_path = ROOT / input_path

    output = args.output
    if not output.is_absolute():
        output = ROOT / output

    payload = build_present(input_path, output) if input_path.is_file() else build_skipped(input_path, output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(f"{payload['status']}: {relative(output)}")


if __name__ == "__main__":
    main()
