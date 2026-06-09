# @serfbound/engine

`@serfbound/engine` owns deterministic simulation primitives. Product code in
this package must stay platform-free: no DOM, Canvas, WebAudio, storage, local
file APIs, desktop wrappers, native launchers, or `.NET` runtime dependency.

## Numeric Policy

The first ported numeric surface is the subset needed by
`Freeserf.Core/Random.cs` and the Phase 1 `rng.fixed-seed-sequence` fixture.

- `uint16(value)` wraps a JavaScript number to C# `UInt16` range.
- `int16(value)` interprets a wrapped 16-bit value as signed two's-complement.
- `uint32(value)` wraps a JavaScript number to unsigned 32-bit range.
- `rotateRight16(value, bits)` rotates inside a 16-bit word after wrapping the
  input.

All overflow-sensitive code must use these helpers or similarly explicit
helpers. Do not rely on implicit JavaScript number behavior for simulation
state.

## Random Policy

`FreeserfRandom` mirrors the captured behavior of `Freeserf.Random` for:

- `Random(ushort)`;
- `Random(ushort base0, ushort base1, ushort base2)`;
- `Random(string)` for 16-character strings containing digits `1` through `8`;
- `Next()`;
- `ToString()`;
- `operator ^`.

The implementation is fixture-backed by
`pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json`.
There are no intentional behavior divergences from the captured fixture.

Known fixture note: the operator-`^` fixture's `constructor.values` metadata is
not used as the initial state because the Phase 1 capture recorded that field
from a mutable list. Tests reconstruct the initial state from `leftState` and
`rightState`, then compare the fixture's `initialState` and every step.
