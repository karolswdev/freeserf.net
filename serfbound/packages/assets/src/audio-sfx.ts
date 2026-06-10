import type { DosPaArchive } from "./dos-sprites.js";

// DOS sound effects, ported from Freeserf.Core/Audio/SFX.cs and the Bass
// WavePlayer: sound entries live at archive index 3900 + id, hold raw
// 8-bit unsigned PCM, and convert to 16-bit at level -32 (DOS sounds),
// played mono at 8000 Hz.

export const sfxArchiveBase = 3900;
export const sfxSampleRate = 8000;
export const dosSfxLevel = -32;

// Audio.TypeSfx, exact reference clip ids.
export const sfxType = {
  message: 1,
  accepted: 2,
  notAccepted: 4,
  pathScrolling: 6,
  click: 8,
  fight01: 10,
  fight02: 14,
  fight03: 18,
  fight04: 22,
  resourceFound: 26,
  pickBlow: 28,
  metalHammering: 30,
  axeBlow: 32,
  treeFall: 34,
  woodHammering: 36,
  elevator: 38,
  hammerBlow: 40,
  sawing: 42,
  millGrinding: 43,
  backswordBlow: 44,
  geologistSampling: 46,
  planting: 48,
  digging: 50,
  mowing: 52,
  fishingRodReel: 54,
  hmpf: 58,
  pigOink: 60,
  goldBoils: 62,
  rowing: 64,
  crush: 66,
  serfDying: 69,
  birdChirp0: 70,
  birdChirp1: 74,
  ahhh: 76,
  birdChirp2: 78,
  birdChirp3: 82,
  burning: 84,
  waves: 86,
  windBlowing: 88,
} as const;

export type SfxTypeValue = (typeof sfxType)[keyof typeof sfxType];

// SFX.ConvertToWav, exact port: every byte shifts by the level and scales
// by 0xFF into a wrapped 16-bit sample.
export function convertSfxToPcm16(data: Uint8Array, level = dosSfxLevel): Int16Array {
  const samples = new Int16Array(data.length);
  for (let index = 0; index < data.length; index += 1) {
    const value = (data[index]! + level) * 0xff;
    samples[index] = (value << 16) >> 16;
  }

  return samples;
}

export function decodeSfxSamples(
  archive: DosPaArchive,
  sfxId: number,
  level = dosSfxLevel,
): Int16Array | null {
  const data = archive.getEntryBytes(sfxArchiveBase + sfxId);
  if (data === null || data.length === 0) {
    return null;
  }

  return convertSfxToPcm16(data, level);
}
