import * as Tone from "tone";
import { SongData } from "./songData";

export interface AudioEngineState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentStep: number;
  beatIntensity: number;
}

export interface AudioEngineCallbacks {
  onStepChange: (step: number) => void;
  onBeatIntensity: (intensity: number) => void;
}

interface MuteStates {
  kick: boolean;
  hihat909: boolean;
  hihat: boolean;
  bass: boolean;
  lead: boolean;
  snare: boolean;
  rumble: boolean;
  ride: boolean;
  clap: boolean;
  acid: boolean;
}

interface SynthCollection {
  kick?: Tone.MembraneSynth;
  hihat?: Tone.NoiseSynth;
  bass?: Tone.Synth;
  lead?: Tone.Synth;
  snare?: Tone.NoiseSynth;
  rumble?: Tone.Oscillator;
  rumbleEnv?: Tone.AmplitudeEnvelope;
  ride?: Tone.NoiseSynth;
  clap?: Tone.NoiseSynth;
  acid?: Tone.MonoSynth;
  hihat909Env?: Tone.AmplitudeEnvelope;
  hihat909Osc1?: Tone.Oscillator;
  hihat909Osc2?: Tone.Oscillator;
  hihat909Osc3?: Tone.Oscillator;
  hihat909Noise?: Tone.Noise;
}

export class BaseDrumAudioEngine {
  private synths: SynthCollection | null = null;
  private sequence: Tone.Sequence | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private songDataRef: React.MutableRefObject<SongData> | null = null;
  private muteStatesRef: React.MutableRefObject<MuteStates> | null = null;
  private callbacks: AudioEngineCallbacks;
  
  private state: AudioEngineState = {
    isPlaying: false,
    isLoaded: false,
    currentStep: 0,
    beatIntensity: 0
  };

  constructor(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public async initialize(
    songDataRef: React.MutableRefObject<SongData>,
    muteStatesRef: React.MutableRefObject<MuteStates>
  ): Promise<void> {
    this.songDataRef = songDataRef;
    this.muteStatesRef = muteStatesRef;

    // Create effects chain - START COMPLETELY NEUTRAL
    this.filter = new Tone.Filter({
      frequency: 20000, // Essentially bypassed (no filtering)
      type: "lowpass",
      rolloff: -24,
    });

    this.reverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.0, // Completely dry (no reverb)
    });

    await this.reverb.ready;

    // Connect effects chain: instruments -> filter -> reverb -> destination
    this.filter.connect(this.reverb);
    this.reverb.toDestination();

    // Initialize synthesizers
    this.createSynthesizers();

    // Create sequence
    this.createSequence();

    this.state.isLoaded = true;
  }

  private createSynthesizers(): void {
    if (!this.filter) return;

    // Kick drum
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
    }).connect(this.filter);

    // Open hi-hat with metallic character
    const hihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.002,
        decay: 0.03,
        sustain: 0.2,
        release: 0.15, // Longer for open hat
      },
    });

    // Add high-pass filter for metallic sound
    const hihatFilter = new Tone.Filter({
      frequency: 5000,
      type: "highpass",
      rolloff: -12,
    });

    hihat.connect(hihatFilter);
    hihatFilter.connect(this.filter);

    // Authentic TR-909 hi-hat using multiple oscillators + noise
    const hihat909Osc1 = new Tone.Oscillator(320, "square");
    const hihat909Osc2 = new Tone.Oscillator(800, "square");
    const hihat909Osc3 = new Tone.Oscillator(540, "square");
    const hihat909Noise = new Tone.Noise("white");

    // 909 envelope - sharp attack, quick decay
    const hihat909Env = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.01,
    });

    // Mix the oscillators and noise - MUCH LOUDER
    const hihat909Mixer = new Tone.Gain(2.0);

    // High-pass filter for metallic character
    const hihat909Filter = new Tone.Filter({
      frequency: 7000,
      type: "highpass",
      rolloff: -24,
    });

    // Connect 909 hihat
    hihat909Osc1.connect(hihat909Mixer);
    hihat909Osc2.connect(hihat909Mixer);
    hihat909Osc3.connect(hihat909Mixer);
    hihat909Noise.connect(hihat909Mixer);

    hihat909Mixer.connect(hihat909Env);
    hihat909Env.connect(hihat909Filter);
    hihat909Filter.connect(this.filter);

    // Start the 909 oscillators and noise
    hihat909Osc1.start();
    hihat909Osc2.start();
    hihat909Osc3.start();
    hihat909Noise.start();

    // Bass synth
    const bass = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4 },
    }).connect(this.filter);

    // Lead synth
    const lead = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.7 },
    }).connect(this.filter);

    // Snare drum - classic 808/909 style with noise and tone
    const snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.0,
        release: 0.1,
      },
    });

    // Add a filter for snare character
    const snareFilter = new Tone.Filter({
      frequency: 2000,
      type: "bandpass",
      Q: 2,
    });

    snare.connect(snareFilter);
    snareFilter.connect(this.filter);

    // RUMBLE BASS - Rule 4: Deep sub-bass foundation
    const rumble = new Tone.Oscillator({
      frequency: "E0", // Super low sub-bass
      type: "sine",
    });

    const rumbleEnv = new Tone.AmplitudeEnvelope({
      attack: 0.05,
      decay: 0.1,
      sustain: 0.8,
      release: 2,
    });

    const rumbleFilter = new Tone.Filter({
      frequency: 100,
      type: "lowpass",
      rolloff: -24,
    });

    rumble.connect(rumbleEnv);
    rumbleEnv.connect(rumbleFilter);
    rumbleFilter.connect(this.filter);

    // RIDE CYMBAL - Subtle high-frequency rhythm
    const ride = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.002,
        decay: 0.2,
        sustain: 0.05,
        release: 0.15,
      },
    });

    const rideFilter = new Tone.Filter({
      frequency: 4000,
      type: "highpass",
      rolloff: -12,
    });

    ride.connect(rideFilter);
    rideFilter.connect(this.filter);

    // CLAP - For syncopation and groove
    const clap = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.005,
        decay: 0.03,
        sustain: 0,
        release: 0.01,
      },
    });

    const clapFilter = new Tone.Filter({
      frequency: 1500,
      type: "bandpass",
      Q: 1,
    });

    const clapReverb = new Tone.Reverb({
      decay: 0.5,
      wet: 0.2,
    });

    clap.connect(clapFilter);
    clapFilter.connect(clapReverb);
    clapReverb.connect(this.filter);

    // ACID LINE - Classic 303-style acid synth
    const acid = new Tone.MonoSynth({
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.2,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.4,
        release: 0.2,
        baseFrequency: 200,
        octaves: 3,
      },
      filter: {
        Q: 6,
        type: "lowpass",
        rolloff: -24,
      },
    }).connect(this.filter);

    // Start continuous oscillators
    rumble.start();

    // Store all synthesizers
    this.synths = {
      kick,
      hihat,
      bass,
      lead,
      snare,
      rumble,
      rumbleEnv,
      ride,
      clap,
      acid,
      hihat909Env,
      hihat909Osc1,
      hihat909Osc2,
      hihat909Osc3,
      hihat909Noise,
    };
  }

  private createSequence(): void {
    if (!this.synths || !this.songDataRef || !this.muteStatesRef) return;

    // Create the sequence callback
    const sequenceCallback = (time: number, step: number) => {
      // Update step counter for visualization
      Tone.Draw.schedule(() => {
        this.state.currentStep = step;
        this.callbacks.onStepChange(step);
      }, time);

      // Beat detection for particle effects
      let beatHit = false;
      const currentSong = this.songDataRef!.current;

      if (!this.synths) return;

      // KICK
      if (!this.muteStatesRef!.current.kick && currentSong.tracks.kick && currentSong.tracks.kick.volume > -50) {
        const track = currentSong.tracks.kick;
        if (track.pattern.includes(step)) {
          const velocity = track.velocity?.[step] || 1.0;
          this.synths.kick?.triggerAttackRelease("C1", "8n", time, velocity);
          beatHit = true;
        } else if (track.ghostNotes?.includes(step)) {
          this.synths.kick?.triggerAttackRelease("C1", "16n", time, 0.3);
        }
      }

      // HIHAT 909
      if (!this.muteStatesRef!.current.hihat909 && currentSong.tracks.hihat909 && currentSong.tracks.hihat909.volume > -50) {
        const track = currentSong.tracks.hihat909;
        if (track.pattern.includes(step)) {
          const velocity = track.velocity?.[step] || 0.8;
          this.synths.hihat909Env?.triggerAttackRelease("16n", time, velocity);
        }
      }

      // OPEN HIHAT
      if (!this.muteStatesRef!.current.hihat && currentSong.tracks.hihat && currentSong.tracks.hihat.volume > -50) {
        const track = currentSong.tracks.hihat;
        if (track.pattern.includes(step)) {
          const velocity = track.velocity?.[step] || 0.5;
          this.synths.hihat?.triggerAttackRelease("8n", time, velocity);
        }
      }

      // SNARE
      if (!this.muteStatesRef!.current.snare && currentSong.tracks.snare && currentSong.tracks.snare.volume > -50) {
        const track = currentSong.tracks.snare;
        if (track.pattern.includes(step)) {
          const velocity = track.velocity?.[step] || 0.9;
          this.synths.snare?.triggerAttackRelease("8n", time, velocity);
          beatHit = true;
        }
      }

      // BASS
      if (!this.muteStatesRef!.current.bass && currentSong.tracks.bass && currentSong.tracks.bass.volume > -50) {
        const track = currentSong.tracks.bass;
        const patternIndex = track.pattern.indexOf(step);
        if (patternIndex !== -1) {
          const note = track.notes?.[patternIndex] || "A1";
          const velocity = track.velocity?.[step] || 0.9;
          this.synths.bass?.triggerAttackRelease(note, "4n", time, velocity);
        }
      }

      // LEAD
      if (!this.muteStatesRef!.current.lead && currentSong.tracks.lead && currentSong.tracks.lead.volume > -50) {
        const track = currentSong.tracks.lead;
        const patternIndex = track.pattern.indexOf(step);
        if (patternIndex !== -1) {
          const note = track.notes?.[patternIndex] || "A3";
          const velocity = track.velocity?.[step] || 0.6;
          this.synths.lead?.triggerAttackRelease(note, "8n", time, velocity);
        }
      }

      // RUMBLE
      if (!this.muteStatesRef!.current.rumble && currentSong.tracks.rumble && currentSong.tracks.rumble.volume > -50) {
        const track = currentSong.tracks.rumble;
        if (track.pattern.includes(step)) {
          const velocity = track.velocity?.[step] || 0.4;
          this.synths.rumbleEnv?.triggerAttackRelease("2n", time, velocity);
        }
      }

      // RIDE
      if (!this.muteStatesRef!.current.ride && currentSong.tracks.ride && currentSong.tracks.ride.volume > -50) {
        const track = currentSong.tracks.ride;
        if (track.pattern.includes(step)) {
          const velocity = track.velocity?.[step] || 0.6;
          this.synths.ride?.triggerAttackRelease("16n", time, velocity);
        }
      }

      // CLAP
      if (!this.muteStatesRef!.current.clap && currentSong.tracks.clap && currentSong.tracks.clap.volume > -50) {
        const track = currentSong.tracks.clap;
        if (track.pattern.includes(step)) {
          const velocity = track.velocity?.[step] || 0.7;
          this.synths.clap?.triggerAttackRelease("16n", time + 0.015, velocity);
        }
      }

      // ACID
      if (!this.muteStatesRef!.current.acid && currentSong.tracks.acid && currentSong.tracks.acid.volume > -50) {
        const track = currentSong.tracks.acid;
        const patternIndex = track.pattern.indexOf(step);
        if (patternIndex !== -1) {
          const note = track.notes?.[patternIndex] || "A2";
          const velocity = track.velocity?.[step] || 0.8;
          this.synths.acid?.triggerAttackRelease(note, "8n", time, velocity);
        }
      }

      // Update beat intensity for particle effects
      if (beatHit) {
        Tone.Draw.schedule(() => {
          this.state.beatIntensity = 1;
          this.callbacks.onBeatIntensity(1);
          // Decay the intensity over time
          setTimeout(() => {
            this.state.beatIntensity = 0.7;
            this.callbacks.onBeatIntensity(0.7);
          }, 50);
          setTimeout(() => {
            this.state.beatIntensity = 0.4;
            this.callbacks.onBeatIntensity(0.4);
          }, 100);
          setTimeout(() => {
            this.state.beatIntensity = 0.1;
            this.callbacks.onBeatIntensity(0.1);
          }, 150);
          setTimeout(() => {
            this.state.beatIntensity = 0;
            this.callbacks.onBeatIntensity(0);
          }, 200);
        }, time);
      }
    };

    this.sequence = new Tone.Sequence(
      sequenceCallback,
      Array.from({ length: 128 }, (_, i) => i),
      "16n"
    );

    this.sequence.loop = true;
  }

  public async play(): Promise<void> {
    if (!this.state.isLoaded || !this.sequence) return;

    if (Tone.Transport.state !== "started") {
      await Tone.start();
      Tone.Transport.bpm.value = 128;
    }

    if (this.state.isPlaying) {
      // Pause - stop transport but keep sequence position
      Tone.Transport.pause();
      this.state.isPlaying = false;
    } else {
      // Resume/Start - continue from current position
      Tone.Transport.start();
      if (this.sequence.state !== "started") {
        this.sequence.start(0);
      }
      this.state.isPlaying = true;
    }
  }

  public pause(): void {
    if (this.state.isPlaying) {
      Tone.Transport.pause();
      this.state.isPlaying = false;
    }
  }

  public stop(): void {
    Tone.Transport.stop();
    this.state.isPlaying = false;
    this.state.currentStep = 0;
    this.callbacks.onStepChange(0);
  }

  public setFilterValue(value: number): void {
    if (this.filter) {
      // Map 0-1 to 20000Hz-350Hz (0 = no processing, 1 = heavy filter)
      const frequency = 20000 - value * 19650;
      this.filter.frequency.rampTo(frequency, 0.1);
    }
  }

  public setReverbValue(value: number): void {
    if (this.reverb) {
      // Map 0-1 to 0-0.5 wet amount (0 = no processing, 1 = prominent reverb)
      const wetAmount = value * 0.5;
      this.reverb.wet.rampTo(wetAmount, 0.1);
    }
  }

  public setBPM(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  public getState(): AudioEngineState {
    return { ...this.state };
  }

  public dispose(): void {
    if (this.sequence) {
      this.sequence.dispose();
      this.sequence = null;
    }

    if (this.synths) {
      Object.values(this.synths).forEach((synth: Tone.ToneAudioNode | undefined) => {
        if (synth && 'dispose' in synth && typeof synth.dispose === 'function') {
          synth.dispose();
        }
      });
      
      if (this.synths.rumble) {
        this.synths.rumble.stop();
      }
      
      // Stop 909 components
      if (this.synths.hihat909Osc1) this.synths.hihat909Osc1.stop();
      if (this.synths.hihat909Osc2) this.synths.hihat909Osc2.stop();
      if (this.synths.hihat909Osc3) this.synths.hihat909Osc3.stop();
      if (this.synths.hihat909Noise) this.synths.hihat909Noise.stop();
      
      this.synths = null;
    }

    if (this.filter) {
      this.filter.dispose();
      this.filter = null;
    }

    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }

    this.state.isLoaded = false;
  }
}