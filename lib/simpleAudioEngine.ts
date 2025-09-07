import * as Tone from "tone";

// Callback types for UI updates
type StepChangeCallback = (step: number) => void;
type BeatIntensityCallback = (intensity: number) => void;

// Configuration constants
const BPM = 128;
const KICK_NOTE = "C1";
const NOTE_DURATION = "8n";
const BEAT_PATTERN = Array.from({ length: 16 }, (_, i) => i); // All 16 steps
const SUBDIVISION = "16n"; // 16th notes for 16 steps

// Beat intensity decay timing (in milliseconds)
const BEAT_INTENSITY_DECAY = [
  { intensity: 1, delay: 0 },
  { intensity: 0.7, delay: 50 },
  { intensity: 0.4, delay: 100 },
  { intensity: 0.1, delay: 150 },
  { intensity: 0, delay: 200 },
] as const;

export class SimpleAudioEngine {
  private kick: Tone.MembraneSynth | null = null;
  private sequence: Tone.Sequence | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private onStepCallback?: StepChangeCallback;
  private onBeatIntensityCallback?: BeatIntensityCallback;
  private kickPattern: number[] = [0, 4, 8, 12]; // Default pattern

  async initialize(
    onStepChange?: StepChangeCallback,
    onBeatIntensity?: BeatIntensityCallback
  ): Promise<void> {
    if (this.isInitialized) return;
    
    this.onStepCallback = onStepChange;
    this.onBeatIntensityCallback = onBeatIntensity;
    
    await Tone.start();
    
    this.createKickDrum();
    this.setupTempo();
    this.createSequence();
    
    this.isInitialized = true;
  }

  private createKickDrum(): void {
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { 
        attack: 0.001, 
        decay: 0.4, 
        sustain: 0.01, 
        release: 1.4 
      },
    }).toDestination();
  }

  private setupTempo(): void {
    Tone.Transport.bpm.value = BPM;
  }

  private createSequence(): void {
    this.sequence = new Tone.Sequence(
      this.handleSequenceStep.bind(this),
      BEAT_PATTERN,
      SUBDIVISION
    );
    this.sequence.loop = true;
  }

  private handleSequenceStep(time: number, step: number): void {
    // Trigger kick based on dynamic pattern
    if (this.kickPattern.includes(step)) {
      this.triggerKick(time);
      // Only schedule beat intensity decay on kick hits
      this.scheduleKickUIUpdates(time);
    }
    // Always schedule step change callback for visual step indicator
    this.scheduleStepUpdate(time, step);
  }

  private triggerKick(time: number): void {
    this.kick?.triggerAttackRelease(KICK_NOTE, NOTE_DURATION, time);
  }

  private scheduleKickUIUpdates(time: number): void {
    // Schedule beat intensity decay only on kick hits
    Tone.Draw.schedule(() => {
      this.scheduleBeatIntensityDecay();
    }, time);
  }

  private scheduleStepUpdate(time: number, step: number): void {
    // Schedule step change callback for all steps
    Tone.Draw.schedule(() => {
      this.onStepCallback?.(step);
    }, time);
  }

  private scheduleBeatIntensityDecay(): void {
    BEAT_INTENSITY_DECAY.forEach(({ intensity, delay }) => {
      setTimeout(() => {
        this.onBeatIntensityCallback?.(intensity);
      }, delay);
    });
  }

  async play(): Promise<void> {
    if (!this.isInitialized || !this.sequence) {
      throw new Error('Audio engine not initialized');
    }

    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  private start(): void {
    if (!this.sequence) return;
    
    this.sequence.start(0);
    Tone.Transport.start();
    this.isPlaying = true;
  }

  stop(): void {
    this.sequence?.stop();
    Tone.Transport.stop();
    this.isPlaying = false;
  }

  dispose(): void {
    this.stop();
    this.cleanupSequence();
    this.cleanupKick();
    this.reset();
  }

  private cleanupSequence(): void {
    if (this.sequence) {
      this.sequence.dispose();
      this.sequence = null;
    }
  }

  private cleanupKick(): void {
    if (this.kick) {
      this.kick.dispose();
      this.kick = null;
    }
  }

  private reset(): void {
    this.isInitialized = false;
    this.isPlaying = false;
    this.onStepCallback = undefined;
    this.onBeatIntensityCallback = undefined;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setKickPattern(pattern: number[]): void {
    this.kickPattern = pattern;
    console.log('Updated kick pattern:', pattern);
  }

  getKickPattern(): number[] {
    return this.kickPattern;
  }
}