export type EngineBoundary = {
  readonly name: "@serfbound/engine";
  readonly allowsBrowserGlobals: false;
  readonly consumesOracleFixtures: true;
};

export const engineBoundary: EngineBoundary = {
  name: "@serfbound/engine",
  allowsBrowserGlobals: false,
  consumesOracleFixtures: true,
};

export type RandomState = readonly [number, number, number];

export function uint16(value: number): number {
  return value & 0xffff;
}

export function int16(value: number): number {
  const word = uint16(value);
  return word >= 0x8000 ? word - 0x10000 : word;
}

export function uint32(value: number): number {
  return value >>> 0;
}

export function rotateRight16(value: number, bits: number): number {
  const word = uint16(value);
  const shift = bits & 0x0f;
  return uint16((word >>> shift) | (word << ((16 - shift) & 0x0f)));
}

export class FreeserfRandom {
  static fromWord(value: number): FreeserfRandom {
    return new FreeserfRandom([value, value, value]);
  }

  static fromState(base0: number, base1: number, base2: number): FreeserfRandom {
    return new FreeserfRandom([base0, base1, base2]);
  }

  static fromStringSeed(value: string): FreeserfRandom {
    if (!/^[1-8]{16}$/.test(value)) {
      throw new Error("Freeserf random string seeds must contain 16 digits from 1 to 8.");
    }

    let packed = 0n;
    for (let index = 15; index >= 0; index -= 1) {
      const charCode = value.charCodeAt(index);
      packed <<= 3n;
      packed |= BigInt(charCode - "0".charCodeAt(0) - 1);
    }

    return new FreeserfRandom([
      Number(packed & 0xffffn),
      Number((packed >> 16n) & 0xffffn),
      Number((packed >> 32n) & 0xffffn),
    ]);
  }

  static xor(left: FreeserfRandom, right: FreeserfRandom): FreeserfRandom {
    const leftState = left.state;
    const rightState = right.state;
    return new FreeserfRandom([
      leftState[0] ^ rightState[0],
      leftState[1] ^ rightState[1],
      leftState[2] ^ rightState[2],
    ]);
  }

  readonly #state: [number, number, number];

  private constructor(state: RandomState) {
    this.#state = [uint16(state[0]), uint16(state[1]), uint16(state[2])];
  }

  get state(): RandomState {
    return [...this.#state] as RandomState;
  }

  clone(): FreeserfRandom {
    return new FreeserfRandom(this.#state);
  }

  next(): number {
    const state = this.#state;
    const result = uint16((state[0] + state[1]) ^ state[2]);
    state[2] = uint16(state[2] + state[1]);
    state[1] = uint16(state[1] ^ state[2]);
    state[1] = rotateRight16(state[1], 1);
    state[2] = rotateRight16(state[2], 1);
    state[0] = result;

    return result;
  }

  toString(): string {
    let packed =
      BigInt(this.#state[0]) |
      (BigInt(this.#state[1]) << 16n) |
      (BigInt(this.#state[2]) << 32n);
    let value = "";

    for (let index = 0; index < 16; index += 1) {
      value += String.fromCharCode(Number(packed & 0x07n) + "1".charCodeAt(0));
      packed >>= 3n;
    }

    return value;
  }
}
