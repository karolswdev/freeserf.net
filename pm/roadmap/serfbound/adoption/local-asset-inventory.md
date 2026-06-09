# Serfbound Local Asset Inventory

**Last updated:** 2026-06-09.
**Status:** local-only inventory; asset files are ignored by Git.

## Purpose

Record which locally supplied original data files are available for Serfbound
verification without committing or redistributing them.

This file may be committed because it contains metadata only. The assets it
describes stay under ignored `serfbound-local-data/`.

## Current Local Source

| Field | Value |
|---|---|
| Source label | `Serf-City-Life-is-Feudal_DOS_EN` |
| User-provided context | Previously purchased by the user |
| Local path | `serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/` |
| Git status | Ignored by `.gitignore` via `serfbound-local-data/` |
| Platform/content | DOS, English/US |
| Loader-relevant data file | `SPAU.PA` |
| Existing loader support | `Freeserf.Core/Data/DataSourceDos.cs` lists `SPAU.PA` as a supported default DOS data filename |

The parent folder name `TheSettlersDemo` is currently misleading for this
subfolder. The files inspected here are a fuller English DOS source set named
`Serf-City-Life-is-Feudal_DOS_EN`, not just the earlier public demo zip.

## Key Files Observed

| File | Size | Why it matters |
|---|---:|---|
| `SPAU.PA` | 1.2M | Primary DOS resource archive for graphics/sound/music loading. |
| `SERF.EXE` | 653K | Original DOS executable; useful for provenance/reference only, not a Serfbound runtime input. |
| `README.TXT` | 8.7K | Included notes about world size, SVGA mode, two-player controls, and sound setup. |
| `SERFTITL.LBM` | 61K | Title image asset; may help verify image conversion/parsing assumptions. |
| `ADLINTRO.XMI` | 5.9K | DOS XMI intro music candidate. |
| `MPUINTRO.XMI` | 6.2K | DOS XMI intro music candidate. |
| `SOUND.INI` | 76K | Sound setup/config data. |

Additional local files include DOS sound driver `.ADV`/`.DLL` files, setup
executables, batch files, sample instrument data, and `UNIVBE.EXE`. These are
not expected to be used directly by the browser product, but they may help
explain original DOS packaging.

## Checksums

Use these to confirm the local verification source has not changed.

```text
4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2  SPAU.PA
e9962dcb2a123748dbdaa8fb3788af088f25d24c52eaf08eb257d36bde942b9e  README.TXT
7875382e2c496f24b62c0c25f564c0f39cc56cf517cfa0cf32780b0ff68cb9cd  SERF.EXE
```

## Serfbound Implications

- Phase 4 can be DOS-first and target `SPAU.PA` as the first real local archive.
- Browser import should support selecting at least one `.PA` file directly, with
  directory import considered for better player ergonomics.
- CI must not require this source. Tests that need it should be local/manual or
  skipped unless an explicit local path is configured.
- The browser product must parse/import the data itself. It must not execute
  `SERF.EXE`, use DOS drivers, require DOSBox, or depend on a desktop companion.

## Commands Used

```bash
find serfbound-local-data/sources -maxdepth 4 -type f -print | sort
shasum -a 256 \
  serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA \
  serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/README.TXT \
  serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SERF.EXE
git status --short --ignored serfbound-local-data/sources
```
