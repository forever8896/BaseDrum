import * as Tone from "tone";

// Callback types for UI updates
type StepChangeCallback = (step: number) => void;
type BeatIntensityCallback = (intensity: number) => void;

// Configuration constants
const BPM = 128;
const KICK_NOTE = "C1";
const NOTE_DURATION = "8n";
const DEFAULT_STEPS = 16;
const SUBDIVISION = "16n"; // 16th notes for steps

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
  private snare: Tone.NoiseSynth | null = null;
  private bass: Tone.Synth | null = null;
  private acid: Tone.MonoSynth | null = null;
  private lead: Tone.PolySynth | null = null;
  private kickVolume: Tone.Volume | null = null;
  private snareVolume: Tone.Volume | null = null;
  private bassVolume: Tone.Volume | null = null;
  private acidVolume: Tone.Volume | null = null;
  private leadVolume: Tone.Volume | null = null;
  private sequence: Tone.Sequence | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private onStepCallback?: StepChangeCallback;
  private onBeatIntensityCallback?: BeatIntensityCallback;
  private kickPattern: number[] = [0, 4, 8, 12]; // Default pattern
  private snarePattern: number[] = [4, 12]; // Default snare pattern
  private bassPattern: number[] = []; // Start empty - will be set when bass track is introduced
  private bassNotes: string[] = ["D1", "D1", "F1", "G1"]; // Note pattern: [D1, D1, F1, G1] repeated 2 times within 16 steps
  // Acid pattern - starts empty, will be set when acid track is introduced
  private acidPattern: { step: number; note: string | null }[] = [];
  // Lead pattern - will be derived from avatar image (64 notes from 8x8 grid)
  private leadPattern: { step: number; notes: string[] }[] = [];
  private currentSteps: number = DEFAULT_STEPS; // Current number of steps in sequence

  async initialize(
    onStepChange?: StepChangeCallback,
    onBeatIntensity?: BeatIntensityCallback
  ): Promise<void> {
    if (this.isInitialized) return;
    
    this.onStepCallback = onStepChange;
    this.onBeatIntensityCallback = onBeatIntensity;
    
    await Tone.start();
    
    this.createKickDrum();
    this.createSnare();
    this.createBass();
    this.createAcid();
    this.createLead();
    this.setupTempo();
    this.createSequence();
    
    this.isInitialized = true;
  }

  private createKickDrum(): void {
    this.kickVolume = new Tone.Volume(0).toDestination(); // Start unmuted
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
    }).connect(this.kickVolume);
  }

  private createSnare(): void {
    this.snareVolume = new Tone.Volume(-Infinity).toDestination(); // Start muted
    this.snare = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.2
      }
    }).connect(this.snareVolume);
  }

  private createBass(): void {
    this.bassVolume = new Tone.Volume(-Infinity).toDestination(); // Start muted, will be set to -8 dB when introduced
    this.bass = new Tone.Synth({
      oscillator: { type: "sawtooth" }, // Changed from sine to sawtooth
      envelope: { 
        attack: 0.01,  // Changed from 0.02 to 0.01s
        decay: 0.1,    // Changed from 0.2 to 0.1s
        sustain: 0.5,  // Changed from 0.4 to 0.5
        release: 0.4   // Changed from 0.6 to 0.4s
      }
    }).connect(this.bassVolume);
  }

  private createAcid(): void {
    this.acidVolume = new Tone.Volume(-Infinity).toDestination(); // Start muted, will be set to -10 dB when introduced
    
    this.acid = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" }, // Sawtooth wave as specified
      envelope: {
        attack: 0.01,  // As specified
        decay: 0.2,    // As specified  
        sustain: 0.3,  // As specified
        release: 0.2   // As specified
      },
      filterEnvelope: {
        attack: 0.01,      // As specified
        decay: 0.2,        // As specified
        sustain: 0.4,      // As specified
        release: 0.2,      // As specified
        baseFrequency: 200, // As specified
        octaves: 3         // As specified
      },
      filter: {
        Q: 6,              // As specified
        type: "lowpass",   // As specified
        rolloff: -24       // As specified
      }
    }).connect(this.acidVolume);
  }

  private createLead(): void {
    this.leadVolume = new Tone.Volume(-Infinity).toDestination(); // Start muted, will be set to -12 dB when introduced
    
    // Create a polyphonic pad synth for lush lead sounds
    this.lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { 
        type: "sawtooth" 
      },
      envelope: {
        attack: 0.1,   // Slow attack for pad-like sound
        decay: 0.3,    // Moderate decay
        sustain: 0.6,  // Good sustain for pad
        release: 1.0   // Long release for smooth transitions
      }
    }).connect(this.leadVolume);
    
    // Set polyphony to 8 voices for rich chords
    this.lead.maxPolyphony = 8;
  }

  private setupTempo(): void {
    Tone.Transport.bpm.value = BPM;
  }

  private createSequence(): void {
    const beatPattern = Array.from({ length: this.currentSteps }, (_, i) => i);
    this.sequence = new Tone.Sequence(
      this.handleSequenceStep.bind(this),
      beatPattern,
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
    // Trigger snare based on dynamic pattern
    if (this.snarePattern.includes(step)) {
      this.triggerSnare(time);
    }
    // Trigger bass based on dynamic pattern
    const bassIndex = this.bassPattern.indexOf(step);
    if (bassIndex !== -1) {
      // Calculate which note to play based on the 4-note repeating pattern
      const noteIndex = bassIndex % 4;
      const note = this.bassNotes[noteIndex];
      this.triggerBass(time, note);
    }
    // Trigger acid melody based on dynamic pattern
    const acidStep = this.acidPattern.find(p => p.step === step);
    if (acidStep && acidStep.note) {
      this.triggerAcid(time, acidStep.note);
    }
    // Trigger lead pad based on dynamic pattern
    const leadStep = this.leadPattern.find(p => p.step === step);
    if (leadStep && leadStep.notes && leadStep.notes.length > 0) {
      this.triggerLead(time, leadStep.notes);
    }
    // Always schedule step change callback for visual step indicator
    this.scheduleStepUpdate(time, step);
  }

  private triggerKick(time: number): void {
    this.kick?.triggerAttackRelease(KICK_NOTE, NOTE_DURATION, time);
  }

  private triggerSnare(time: number): void {
    this.snare?.triggerAttackRelease(NOTE_DURATION, time);
  }

  private triggerBass(time: number, note: string = "C1"): void {
    this.bass?.triggerAttackRelease(note, NOTE_DURATION, time, 0.9); // 0.9 velocity as specified
  }

  private triggerAcid(time: number, note: string): void {
    this.acid?.triggerAttackRelease(note, "8n", time, 0.8); // 0.8 velocity as specified
  }

  private triggerLead(time: number, notes: string[]): void {
    // Trigger polyphonic lead pad with chord or single notes
    this.lead?.triggerAttackRelease(notes, "2n", time, 0.6); // Longer duration for pad, moderate velocity
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
      // For longer sequences, show step position within the current 16-step bar
      const displayStep = this.currentSteps > 16 ? step % 16 : step;
      this.onStepCallback?.(displayStep);
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
    this.cleanupSnare();
    this.cleanupBass();
    this.cleanupAcid();
    this.cleanupLead();
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
    if (this.kickVolume) {
      this.kickVolume.dispose();
      this.kickVolume = null;
    }
  }

  private cleanupSnare(): void {
    if (this.snare) {
      this.snare.dispose();
      this.snare = null;
    }
    if (this.snareVolume) {
      this.snareVolume.dispose();
      this.snareVolume = null;
    }
  }

  private cleanupBass(): void {
    if (this.bass) {
      this.bass.dispose();
      this.bass = null;
    }
    if (this.bassVolume) {
      this.bassVolume.dispose();
      this.bassVolume = null;
    }
  }

  private cleanupAcid(): void {
    if (this.acid) {
      this.acid.dispose();
      this.acid = null;
    }
    if (this.acidVolume) {
      this.acidVolume.dispose();
      this.acidVolume = null;
    }
  }

  private cleanupLead(): void {
    if (this.lead) {
      this.lead.dispose();
      this.lead = null;
    }
    if (this.leadVolume) {
      this.leadVolume.dispose();
      this.leadVolume = null;
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

  setSnarePattern(pattern: number[]): void {
    this.snarePattern = pattern;
    console.log('Updated snare pattern:', pattern);
  }

  getSnarePattern(): number[] {
    return this.snarePattern;
  }

  setKickMuted(muted: boolean): void {
    if (this.kickVolume) {
      this.kickVolume.volume.value = muted ? -Infinity : 0;
      console.log('Kick muted:', muted);
    }
  }

  setSnareMuted(muted: boolean): void {
    if (this.snareVolume) {
      this.snareVolume.volume.value = muted ? -Infinity : 0;
      console.log('Snare muted:', muted);
    }
  }

  setBassPattern(pattern: number[]): void {
    this.bassPattern = pattern;
    // When bass pattern is set, also create a note map for the D1-F1-G1 progression
    // The notes will cycle through [D1, D1, F1, G1] for each step in the pattern
    console.log('Updated bass pattern:', pattern, 'with D1-F1-G1 note cycling');
  }

  getBassPattern(): number[] {
    return this.bassPattern;
  }

  setBassMuted(muted: boolean): void {
    if (this.bassVolume) {
      this.bassVolume.volume.value = muted ? -Infinity : -8; // Return to -8 dB when unmuted
      console.log('Bass muted:', muted);
    }
  }

  setAcidPattern(pattern: { step: number; note: string | null }[]): void {
    this.acidPattern = pattern;
    console.log('Updated acid pattern:', pattern);
  }

  // Helper method to convert a simple step pattern to acid melody with D2-F2-G2-A2-C3 notes
  setAcidPatternFromSteps(steps: number[]): void {
    const acidNotes = ["D2", "F2", "G2", "A2", "C3"];
    this.acidPattern = steps.map((step, index) => ({
      step: step,
      note: acidNotes[index % acidNotes.length]
    }));
    console.log('Created acid melody from steps:', steps, 'with notes:', this.acidPattern);
  }

  getAcidPattern(): { step: number; note: string | null }[] {
    return this.acidPattern;
  }

  setAcidMuted(muted: boolean): void {
    if (this.acidVolume) {
      this.acidVolume.volume.value = muted ? -Infinity : -10; // Return to -10 dB when unmuted
      console.log('Acid muted:', muted);
    }
  }

  setLeadPattern(pattern: { step: number; notes: string[] }[]): void {
    this.leadPattern = pattern;
    console.log('Updated lead pattern:', pattern);
  }

  getLeadPattern(): { step: number; notes: string[] }[] {
    return this.leadPattern;
  }

  setLeadMuted(muted: boolean): void {
    if (this.leadVolume) {
      this.leadVolume.volume.value = muted ? -Infinity : -12; // Return to -12 dB when unmuted
      console.log('Lead muted:', muted);
    }
  }


  // Unmute all tracks for full arrangement playback
  unmuteAllTracks(): void {
    console.log('Unmuting all tracks for full arrangement');
    this.setKickMuted(false);
    this.setSnareMuted(false);
    this.setBassMuted(false);
    this.setAcidMuted(false);
    this.setLeadMuted(false);
  }

  // Update sequence length and recreate sequence
  setSequenceLength(steps: number): void {
    this.currentSteps = steps;
    
    // Stop current sequence if playing
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }
    
    // Dispose and recreate sequence
    if (this.sequence) {
      this.sequence.dispose();
      this.sequence = null;
    }
    
    this.createSequence();
    
    // Restart if it was playing
    if (wasPlaying) {
      this.start();
    }
    
    console.log(`Updated sequence length to ${steps} steps`);
  }

  // Generate melody from wallet address
  generateAcidMelodyFromWallet(walletAddress: string): { step: number; note: string | null }[] {
    if (!walletAddress || walletAddress.length < 10) {
      return []; // Return empty if no valid wallet
    }

    // Remove '0x' prefix and take first 16 characters for 16 steps
    const hexDigits = walletAddress.slice(2, 18).toUpperCase();
    
    // Minor pentatonic scale mapping - one octave lower for better bass blend
    const noteMapping: Record<string, string | null> = {
      '0': 'C2', '1': 'Eb2', '2': 'F2', '3': 'G2', '4': 'Bb2',
      '5': 'C3', '6': 'Eb3', '7': 'F3', '8': 'G3', '9': 'Bb3',
      'A': 'C4', 'B': 'Eb4', 'C': 'F4',
      'D': null, 'E': null, 'F': null  // Rests/pauses
    };

    const melody: { step: number; note: string | null }[] = [];
    
    for (let i = 0; i < Math.min(16, hexDigits.length); i++) {
      const hexChar = hexDigits[i];
      const note = noteMapping[hexChar] || null;
      
      // Only add to melody if there's a note (not a rest)
      if (note) {
        melody.push({ step: i, note });
      }
    }

    return melody;
  }
}