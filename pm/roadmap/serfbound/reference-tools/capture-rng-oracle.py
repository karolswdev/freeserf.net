#!/usr/bin/env python3
"""Emit the data-free RNG oracle fixture for Serfbound Phase 1.

This is temporary reference tooling. It mirrors `Freeserf.Core/Random.cs` so
later browser-native code can compare against a stable JSON fixture without
depending on .NET or original game assets.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT = ROOT / "pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json"
RANDOM_SOURCE = ROOT / "Freeserf.Core/Random.cs"


def word(value: int) -> int:
    return value & 0xFFFF


def last_source_commit(path: Path) -> str:
    relative_path = path.relative_to(ROOT)
    result = subprocess.run(
        ["git", "log", "-n", "1", "--format=%H", "--", str(relative_path)],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip()


class FreeserfRandom:
    def __init__(self, state: list[int]):
        self.state = [word(value) for value in state]

    @classmethod
    def from_word(cls, value: int) -> "FreeserfRandom":
        return cls([value, value, value])

    @classmethod
    def from_bases(cls, base0: int, base1: int, base2: int) -> "FreeserfRandom":
        return cls([base0, base1, base2])

    @classmethod
    def from_string(cls, value: str) -> "FreeserfRandom":
        encoded = value.encode("ascii")
        if len(encoded) != 16:
            raise ValueError("Freeserf.Random(string) oracle seeds must be 16 ASCII characters")

        tmp = 0
        for index in range(15, -1, -1):
            tmp <<= 3
            tmp |= (encoded[index] - ord("0") - 1) & 0xFF

        return cls([tmp & 0xFFFF, (tmp >> 16) & 0xFFFF, (tmp >> 32) & 0xFFFF])

    def copy(self) -> "FreeserfRandom":
        return FreeserfRandom(self.state)

    def next(self) -> int:
        random = self.state
        result = word((random[0] + random[1]) ^ random[2])
        random[2] = word(random[2] + random[1])
        random[1] = word(random[1] ^ random[2])
        random[1] = word((random[1] >> 1) | (random[1] << 15))
        random[2] = word((random[2] >> 1) | (random[2] << 15))
        random[0] = result
        return result

    def to_string(self) -> str:
        tmp = self.state[0]
        tmp |= self.state[1] << 16
        tmp |= self.state[2] << 32

        chars = []
        for _ in range(16):
            chars.append(chr((tmp & 0x07) + ord("1")))
            tmp >>= 3
        return "".join(chars)

    def xor(self, other: "FreeserfRandom") -> "FreeserfRandom":
        return FreeserfRandom(
            [
                self.state[0] ^ other.state[0],
                self.state[1] ^ other.state[1],
                self.state[2] ^ other.state[2],
            ]
        )


def sequence(case_id: str, constructor: dict[str, object], rng: FreeserfRandom, steps: int) -> dict[str, object]:
    rows = []
    for step in range(steps):
        before = list(rng.state)
        next_value = rng.next()
        rows.append(
            {
                "step": step + 1,
                "before": before,
                "next": next_value,
                "after": list(rng.state),
                "toStringAfter": rng.to_string(),
            }
        )

    return {
        "id": case_id,
        "constructor": constructor,
        "initialState": rows[0]["before"],
        "initialToString": FreeserfRandom(rows[0]["before"]).to_string(),
        "steps": rows,
    }


def build_fixture() -> dict[str, object]:
    source_text = RANDOM_SOURCE.read_bytes()
    case_a = FreeserfRandom.from_bases(0x0001, 0x8000, 0xFFFF)
    case_b = FreeserfRandom.from_string("1234567812345678")
    xor_case = case_a.copy().xor(case_b.copy())

    return {
        "schemaVersion": 1,
        "targetId": "rng.fixed-seed-sequence",
        "dataRequirement": "data-free / CI-safe",
        "source": {
            "file": "Freeserf.Core/Random.cs",
            "sha256": hashlib.sha256(source_text).hexdigest(),
            "lastCommit": last_source_commit(RANDOM_SOURCE),
            "methods": [
                "Freeserf.Random(ushort)",
                "Freeserf.Random(string)",
                "Freeserf.Random(ushort base0, ushort base1, ushort base2)",
                "Freeserf.Random.Next()",
                "Freeserf.Random.ToString()",
                "Freeserf.Random.operator ^",
            ],
        },
        "generation": {
            "command": "python3 pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py --output pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json",
            "tool": "pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py",
            "notes": "Temporary Phase 1 reference tooling; not product code and not imported by browser runtime.",
        },
        "cases": [
            sequence(
                "word-seed-0000",
                {"kind": "Random(ushort)", "value": 0},
                FreeserfRandom.from_word(0),
                8,
            ),
            sequence(
                "word-seed-0001",
                {"kind": "Random(ushort)", "value": 1},
                FreeserfRandom.from_word(1),
                8,
            ),
            sequence(
                "word-seed-ffff",
                {"kind": "Random(ushort)", "value": 65535},
                FreeserfRandom.from_word(0xFFFF),
                8,
            ),
            sequence(
                "base-triplet-edge",
                {"kind": "Random(ushort, ushort, ushort)", "values": [0x0001, 0x8000, 0xFFFF]},
                case_a.copy(),
                8,
            ),
            sequence(
                "string-seed-1234567812345678",
                {"kind": "Random(string)", "value": "1234567812345678"},
                case_b.copy(),
                8,
            ),
            sequence(
                "xor-base-triplet-with-string",
                {
                    "kind": "Random.operator ^",
                    "leftState": case_a.state,
                    "rightState": case_b.state,
                    "values": xor_case.state,
                },
                xor_case,
                8,
            ),
        ],
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
