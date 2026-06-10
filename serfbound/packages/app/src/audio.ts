import { sfxSampleRate } from "@serfbound/assets";

// The browser audio service: decoded DOS clips play through WebAudio,
// gated on the first user gesture (autoplay policy), with persistent
// volume/mute settings layered on in SB-17-03.

export type SerfboundAudioState = "idle" | "locked" | "unlocked" | "unavailable";

export class SerfboundAudioService {
  #context: AudioContext | undefined;
  #clips = new Map<number, Int16Array>();
  state: SerfboundAudioState = "idle";
  // Observable playback facts for tests and evidence.
  lastSfx: number | null = null;
  playedCount = 0;
  sfxVolume = 1;
  sfxMuted = false;

  loadClips(clips: ReadonlyMap<number, Int16Array>): void {
    this.#clips = new Map(clips);
    if (this.state === "idle" && this.#clips.size > 0) {
      this.state = "locked";
    }
  }

  get clipCount(): number {
    return this.#clips.size;
  }

  // Autoplay policy: the context is created (and resumed) only from a
  // user gesture; environments without WebAudio degrade silently.
  unlock(): void {
    if (this.state === "unlocked" || this.state === "unavailable") {
      return;
    }

    const contextConstructor = (globalThis as { AudioContext?: typeof AudioContext })
      .AudioContext;
    if (contextConstructor === undefined) {
      this.state = "unavailable";
      return;
    }

    try {
      this.#context ??= new contextConstructor();
      if (this.#context.state === "suspended") {
        void this.#context.resume();
      }

      this.state = "unlocked";
    } catch {
      this.state = "unavailable";
    }
  }

  playSfx(sfxId: number): boolean {
    const clip = this.#clips.get(sfxId);
    if (clip === undefined || this.sfxMuted) {
      return false;
    }

    // Playback facts update even when the context cannot run (CI), so the
    // event mapping stays observable everywhere.
    this.lastSfx = sfxId;
    this.playedCount += 1;

    if (this.state !== "unlocked" || this.#context === undefined) {
      return false;
    }

    try {
      const buffer = this.#context.createBuffer(1, clip.length, sfxSampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < clip.length; index += 1) {
        channel[index] = (clip[index]! / 0x8000) * this.sfxVolume;
      }

      const source = this.#context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.#context.destination);
      source.start();
      return true;
    } catch {
      return false;
    }
  }
}
