import * as Tone from 'tone';
import { soundBank, SoundPreset } from './sound-bank';

interface Track {
  id: string;
  name: string;
  steps: boolean[];
  volume: number;
  effects: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface AudioTrack {
  id: string;
  preset: SoundPreset;
  synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth;
  volume: Tone.Volume;
  effects: Record<string, Tone.ToneAudioNode>;
}

export class AudioEngine {
  private tracks: Map<string, AudioTrack> = new Map();
  private sequence: Tone.Sequence | null = null;
  private isInitialized = false;
  private currentStep = 0;
  private onStepCallback?: (step: number) => void;

  async initialize() {
    if (this.isInitialized) return;
    
    await Tone.start();
    console.log('Audio engine initialized');
    this.isInitialized = true;
  }

  setStepCallback(callback: (step: number) => void) {
    this.onStepCallback = callback;
  }

  createTrack(trackId: string, ruleId: number, presetId?: string): AudioTrack {
    if (this.tracks.has(trackId)) {
      return this.tracks.get(trackId)!;
    }

    // Get preset from sound bank
    const preset = presetId 
      ? soundBank.getPreset(presetId) 
      : soundBank.getDefaultPresetForRule(ruleId);

    if (!preset) {
      throw new Error(`No preset found for track ${trackId}`);
    }

    // Create synth from preset
    const synth = soundBank.createSynth(preset.synth);
    
    // Create volume control with preset volume
    const volume = new Tone.Volume(this.volumeToDb(preset.volume)).toDestination();
    
    // Create effects from preset
    const effects: Record<string, Tone.ToneAudioNode> = {};
    preset.effects.forEach((effectConfig, index) => {
      const effect = soundBank.createEffect(effectConfig);
      effects[effectConfig.type + index] = effect;
    });

    // Connect audio chain: synth → effects → volume
    let audioNode: Tone.ToneAudioNode = synth;
    Object.values(effects).forEach(effect => {
      audioNode = audioNode.connect(effect);
    });
    audioNode.connect(volume);

    const track: AudioTrack = { id: trackId, preset, synth, volume, effects };
    this.tracks.set(trackId, track);
    return track;
  }

  // Change the sound preset for a track
  changeTrackPreset(trackId: string, presetId: string) {
    const existingTrack = this.tracks.get(trackId);
    if (!existingTrack) return;

    // Dispose old synth and effects
    existingTrack.synth.dispose();
    Object.values(existingTrack.effects).forEach(effect => effect.dispose());

    // Get new preset
    const preset = soundBank.getPreset(presetId);
    if (!preset) return;

    // Create new synth and effects
    const synth = soundBank.createSynth(preset.synth);
    const effects: Record<string, Tone.ToneAudioNode> = {};
    
    preset.effects.forEach((effectConfig, index) => {
      const effect = soundBank.createEffect(effectConfig);
      effects[effectConfig.type + index] = effect;
    });

    // Reconnect audio chain
    let audioNode: Tone.ToneAudioNode = synth;
    Object.values(effects).forEach(effect => {
      audioNode = audioNode.connect(effect);
    });
    audioNode.connect(existingTrack.volume);

    // Update track
    existingTrack.preset = preset;
    existingTrack.synth = synth;
    existingTrack.effects = effects;
    
    // Update volume to preset default
    this.updateTrackVolume(trackId, preset.volume);
  }

  updateTrackVolume(trackId: string, volume: number) {
    const track = this.tracks.get(trackId);
    if (track) {
      track.volume.volume.value = this.volumeToDb(volume);
    }
  }

  updateTrackEffect(trackId: string, effectName: string, value: number) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    // Find effect by name (may need to match partial names)
    const effectKey = Object.keys(track.effects).find(key => key.includes(effectName));
    if (!effectKey) return;

    const effect = track.effects[effectKey];
    
    // Apply effect parameter updates based on effect type
    if (effect instanceof Tone.Filter) {
      if (effectName.includes('filter')) {
        effect.frequency.value = 200 + (value * 8000); // 200Hz to 8.2kHz
      } else if (effectName.includes('lowEnd')) {
        effect.frequency.value = 60 + (value * 200); // 60Hz to 260Hz for bass filtering
      } else if (effectName.includes('lowpass')) {
        effect.frequency.value = 60 + (value * 200); // 60Hz to 260Hz
      } else if (effectName.includes('highpass')) {
        effect.frequency.value = 4000 + (value * 8000); // 4kHz to 12kHz
      }
    } else if (effect instanceof Tone.Distortion) {
      if (effectName.includes('rumble')) {
        effect.distortion = value * 0.5; // Gentler distortion for rumble
      } else {
        effect.distortion = value;
      }
    } else if (effect instanceof Tone.Compressor) {
      effect.ratio.value = 1 + (value * 10); // 1:1 to 11:1
    } else if (effect instanceof Tone.Reverb) {
      effect.wet.value = value;
    } else if (effect instanceof Tone.Chorus) {
      effect.depth = value;
    } else if (effect instanceof Tone.PingPongDelay) {
      effect.feedback.value = value * 0.8; // Max 0.8 to avoid runaway feedback
    } else if (effect instanceof Tone.AutoFilter) {
      effect.frequency.value = 0.5 + (value * 4); // 0.5Hz to 4.5Hz
    }
  }

  startSequence(getTracksCallback: () => Track[], tempo: number, onStep: (step: number) => void) { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.stopSequence();
    
    this.onStepCallback = onStep;
    
    // Convert BPM to Tone.js time notation
    const subdivision = '16n'; // 16th notes
    
    this.sequence = new Tone.Sequence((time, step) => {
      this.currentStep = step;
      this.onStepCallback?.(step);
      
      // Get fresh track data on each step
      const currentTracks = getTracksCallback();
      
      // Play sounds for active steps
      currentTracks.forEach(track => {
        if (track.steps[step]) {
          const audioTrack = this.tracks.get(track.id);
          if (audioTrack) {
            const preset = audioTrack.preset;
            const frequency = preset.synth.frequency || 'C4';
            const duration = preset.synth.duration || '8n';
            
            if (audioTrack.synth instanceof Tone.NoiseSynth) {
              audioTrack.synth.triggerAttackRelease(duration, time);
            } else {
              audioTrack.synth.triggerAttackRelease(frequency, duration, time);
            }
          }
        }
      });
    }, Array.from({length: 16}, (_, i) => i), subdivision);

    // Set tempo
    Tone.Transport.bpm.value = tempo;
    
    // Start the sequence
    this.sequence.start(0);
    Tone.Transport.start();
  }

  stopSequence() {
    if (this.sequence) {
      this.sequence.stop();
      this.sequence.dispose();
      this.sequence = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }

  setTempo(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  // Get available presets for a rule
  getAvailablePresets(ruleId: number) {
    return soundBank.getPresetsForRule(ruleId);
  }

  // Get all sound categories
  getSoundCategories() {
    const allPresets = soundBank.getAllPresets();
    const categories = new Set(allPresets.map(p => p.category));
    return Array.from(categories);
  }

  private volumeToDb(volume: number): number {
    // Convert 0-1 to decibels (-60 to 0)
    return volume === 0 ? -60 : (volume - 1) * 60;
  }

  dispose() {
    this.stopSequence();
    this.tracks.forEach(track => {
      track.synth.dispose();
      track.volume.dispose();
      Object.values(track.effects).forEach(effect => effect.dispose());
    });
    this.tracks.clear();
  }
}

// Singleton instance
export const audioEngine = new AudioEngine(); 