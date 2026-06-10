import type { DosPaArchive } from "./dos-sprites.js";

// XMI music parsing, ported exactly from Freeserf.Core/Audio/XMI.cs:
// FORM/XDIR/INFO + CAT/XMID + FORM/XMID/TIMB/EVNT chunks, interval bytes,
// note-on events carrying their duration as a variable-length quantity
// (split into on/off pairs), tempo metas, and a stable time sort.

export const xmiArchiveBase = 3990;
const xmiTicksPerSecond = 120; // reference freq

export type XmiEvent =
  | { readonly kind: "noteOn"; readonly channel: number; readonly note: number; readonly velocity: number; readonly time: number }
  | { readonly kind: "noteOff"; readonly channel: number; readonly note: number; readonly time: number }
  | { readonly kind: "tempo"; readonly tempo: number; readonly time: number }
  | { readonly kind: "controller"; readonly channel: number; readonly controller: number; readonly value: number; readonly time: number }
  | { readonly kind: "instrument"; readonly channel: number; readonly program: number; readonly time: number };

class ByteReader {
  readonly data: Uint8Array;
  offset = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  readable(): boolean {
    return this.offset < this.data.length;
  }

  peekByte(): number {
    return this.data[this.offset]!;
  }

  popByte(): number {
    const value = this.data[this.offset]!;
    this.offset += 1;
    return value;
  }

  pop(count: number): void {
    this.offset += count;
  }

  popUint32(): number {
    const view = new DataView(this.data.buffer, this.data.byteOffset + this.offset, 4);
    this.offset += 4;
    return view.getUint32(0, true);
  }

  popUint16(): number {
    const view = new DataView(this.data.buffer, this.data.byteOffset + this.offset, 2);
    this.offset += 2;
    return view.getUint16(0, true);
  }

  tag(): string {
    return String.fromCharCode(
      this.data[this.offset]!,
      this.data[this.offset + 1]!,
      this.data[this.offset + 2]!,
      this.data[this.offset + 3]!,
    );
  }
}

// Parse one XMI track into time-sorted events (times in milliseconds).
export function parseXmi(bytes: Uint8Array): XmiEvent[] | null {
  const reader = new ByteReader(bytes);
  let tempo = 500000;
  let currentTime = 0;
  const events: XmiEvent[] = [];

  const ticksPerQuarternote = (): number => Math.floor((xmiTicksPerSecond * tempo) / 1000000);
  const ticksToTime = (ticks: number): number =>
    ((ticks / ticksPerQuarternote()) * tempo) / 1000;

  const expect = (tag: string): boolean => {
    if (reader.tag() !== tag) {
      return false;
    }

    reader.pop(4);
    return true;
  };

  if (!expect("FORM")) return null;
  reader.popUint32();
  if (!expect("XDIR")) return null;
  if (!expect("INFO")) return null;
  reader.popUint32();
  const numTracks = reader.popUint16();
  if (numTracks !== 1) return null;
  if (!expect("CAT ")) return null;
  reader.popUint32();
  if (!expect("XMID")) return null;
  if (!expect("FORM")) return null;
  reader.popUint32();
  if (!expect("XMID")) return null;
  if (!expect("TIMB")) return null;
  reader.popUint32();
  const timbreCount = reader.popUint16();
  reader.pop(timbreCount * 2);
  if (!expect("EVNT")) return null;
  reader.popUint32();

  const parseDeltaTime = (): number => {
    let deltaTime = 0;
    let value = reader.popByte();
    while ((value & 0x80) !== 0) {
      deltaTime = (deltaTime << 7) | (value & 0x7f);
      value = reader.popByte();
    }

    return (deltaTime << 7) | (value & 0x7f);
  };

  while (reader.readable()) {
    const status = reader.peekByte();

    if (status === 0xff) {
      reader.pop(1);
      const type = reader.popByte();
      const length = reader.popByte();
      if (type === 0x51 && length === 3) {
        const high = reader.popByte();
        const mid = reader.popByte();
        const low = reader.popByte();
        tempo = (high << 16) | (mid << 8) | low;
        events.push({ kind: "tempo", tempo, time: currentTime });
      } else {
        reader.pop(length);
      }

      continue;
    }

    const channel = status & 0xf;
    const eventType = status >> 4;

    if (eventType < 0x8) {
      // Interval byte: plain tick delay.
      const ticks = reader.popByte();
      currentTime += ticksToTime(ticks);
      continue;
    }

    reader.pop(1);

    switch (eventType) {
      case 0x9: {
        const note = reader.popByte();
        const velocity = reader.popByte();
        const length = parseDeltaTime();
        if (velocity !== 0) {
          events.push({ kind: "noteOn", channel, note, velocity, time: currentTime });
          events.push({
            kind: "noteOff",
            channel,
            note,
            time: currentTime + ticksToTime(length),
          });
        }

        break;
      }
      case 0xb: {
        const controller = reader.popByte() & 0x7f;
        const value = reader.popByte() & 0x7f;
        if (controller < 120) {
          events.push({ kind: "controller", channel, controller, value, time: currentTime });
        }

        break;
      }
      case 0x8:
      case 0xa:
      case 0xe:
        reader.pop(2);
        break;
      case 0xc:
        events.push({ kind: "instrument", channel, program: reader.popByte(), time: currentTime });
        break;
      case 0xd:
        reader.pop(1);
        break;
      default:
        return null;
    }
  }

  // Stable sort by start time (the reference keeps insertion order on ties).
  return events
    .map((event, index) => ({ event, index }))
    .sort((left, right) =>
      left.event.time === right.event.time
        ? left.index - right.index
        : left.event.time - right.event.time,
    )
    .map((entry) => entry.event);
}

export function parseXmiTrack(archive: DosPaArchive, trackId: number): XmiEvent[] | null {
  const data = archive.getEntryBytes(xmiArchiveBase + trackId);
  if (data === null || data.length === 0) {
    return null;
  }

  return parseXmi(data);
}
