import { sfxSampleRate, type XmiEvent } from "@serfbound/assets";

// The browser audio service: decoded DOS clips play through WebAudio,
// gated on the first user gesture (autoplay policy), with persistent
// volume/mute settings layered on in SB-17-03.

export type SerfboundAudioState = "idle" | "locked" | "unlocked" | "unavailable";

// Persistent audio settings (SB-17-03).
export type SerfboundAudioSettings = {
  readonly sfxVolume: number;
  readonly sfxMuted: boolean;
  readonly musicVolume: number;
  readonly musicMuted: boolean;
};

export const audioSettingsKey = "serfbound.audio-settings";

type SettingsStorage = Pick<Storage, "getItem" | "setItem">;

export function loadAudioSettings(storage: SettingsStorage): SerfboundAudioSettings | null {
  try {
    const raw = storage.getItem(audioSettingsKey);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SerfboundAudioSettings>;
    return {
      sfxVolume: typeof parsed.sfxVolume === "number" ? parsed.sfxVolume : 1,
      sfxMuted: parsed.sfxMuted === true,
      musicVolume: typeof parsed.musicVolume === "number" ? parsed.musicVolume : 1,
      musicMuted: parsed.musicMuted === true,
    };
  } catch {
    return null;
  }
}

export function saveAudioSettings(storage: SettingsStorage, settings: SerfboundAudioSettings): void {
  try {
    storage.setItem(audioSettingsKey, JSON.stringify(settings));
  } catch {
    // Quota or privacy errors leave the in-memory settings in charge.
  }
}

export class SerfboundAudioService {
  #context: AudioContext | undefined;
  #clips = new Map<number, Int16Array>();
  state: SerfboundAudioState = "idle";
  // Observable playback facts for tests and evidence.
  lastSfx: number | null = null;
  playedCount = 0;
  sfxVolume = 1;
  sfxMuted = false;
  // Music: parsed XMI events render through a WebAudio oscillator synth
  // (the recorded SB-17-02 playback decision — browser-native, no
  // bundled soundfonts; a sampled upgrade is a later evaluation).
  #musicEvents: XmiEvent[] | null = null;
  #musicNodes: { stop: () => void }[] = [];
  musicState: "silent" | "ready" | "playing" = "silent";
  musicVolume = 1;
  musicMuted = false;
  scheduledNoteCount = 0;

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

  loadMusic(events: XmiEvent[] | null): void {
    this.#musicEvents = events;
    this.musicState = events !== null && events.length > 0 ? "ready" : "silent";
  }

  get musicEventCount(): number {
    return this.#musicEvents?.length ?? 0;
  }

  stopMusic(): void {
    for (const node of this.#musicNodes) {
      node.stop();
    }

    this.#musicNodes = [];
    if (this.musicState === "playing") {
      this.musicState = "ready";
    }
  }

  // Schedule the parsed track through plain oscillators (square lead).
  playMusic(): boolean {
    if (
      this.#musicEvents === null ||
      this.#musicEvents.length === 0 ||
      this.musicMuted ||
      this.state !== "unlocked" ||
      this.#context === undefined
    ) {
      return false;
    }

    this.stopMusic();
    const base = this.#context.currentTime + 0.1;
    const pending = new Map<string, { time: number; velocity: number }>();
    let scheduled = 0;
    const noteLimit = 2000;

    try {
      for (const event of this.#musicEvents) {
        if (scheduled >= noteLimit) {
          break;
        }

        if (event.kind === "noteOn") {
          pending.set(`${event.channel}:${event.note}`, {
            time: event.time,
            velocity: event.velocity,
          });
        } else if (event.kind === "noteOff") {
          const start = pending.get(`${event.channel}:${event.note}`);
          if (start === undefined) {
            continue;
          }

          pending.delete(`${event.channel}:${event.note}`);
          const oscillator = this.#context.createOscillator();
          oscillator.type = event.channel === 9 ? "triangle" : "square";
          oscillator.frequency.value = 440 * 2 ** ((event.note - 69) / 12);
          const gain = this.#context.createGain();
          gain.gain.value = (start.velocity / 127) * this.musicVolume * 0.08;
          oscillator.connect(gain);
          gain.connect(this.#context.destination);
          oscillator.start(base + start.time / 1000);
          oscillator.stop(base + event.time / 1000);
          this.#musicNodes.push({ stop: () => oscillator.stop() });
          scheduled += 1;
        }
      }
    } catch {
      return false;
    }

    this.scheduledNoteCount = scheduled;
    this.musicState = "playing";
    return true;
  }

  settings(): SerfboundAudioSettings {
    return {
      sfxVolume: this.sfxVolume,
      sfxMuted: this.sfxMuted,
      musicVolume: this.musicVolume,
      musicMuted: this.musicMuted,
    };
  }

  applySettings(settings: SerfboundAudioSettings): void {
    this.sfxVolume = settings.sfxVolume;
    this.sfxMuted = settings.sfxMuted;
    this.musicVolume = settings.musicVolume;
    this.musicMuted = settings.musicMuted;
    if (this.musicMuted) {
      this.stopMusic();
    }
  }

  // Tab visibility: a hidden tab suspends the whole context (the original
  // pauses when unfocused); visible resumes it.
  setVisible(visible: boolean): void {
    if (this.#context === undefined || this.state !== "unlocked") {
      return;
    }

    try {
      if (visible && this.#context.state === "suspended") {
        void this.#context.resume();
      } else if (!visible && this.#context.state === "running") {
        void this.#context.suspend();
      }
    } catch {
      // Suspension is best-effort.
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
