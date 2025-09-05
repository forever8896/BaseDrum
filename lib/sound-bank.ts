import * as Tone from 'tone';

export interface SynthConfig {
  type: 'membrane' | 'metal' | 'noise' | 'synth' | 'sample';
  params: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  frequency?: string;
  note?: string;
  duration?: string;
}

export interface EffectConfig {
  type: string;
  params: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  wetness?: number;
}

export interface SoundPreset {
  id: string;
  name: string;
  category: 'kick' | 'snare' | 'hihat' | 'bass' | 'lead' | 'percussion' | 'fx';
  synth: SynthConfig;
  effects: EffectConfig[];
  volume: number;
  description?: string;
}

export class SoundBank {
  private presets: Map<string, SoundPreset> = new Map();

  constructor() {
    this.initializeDefaultPresets();
  }

  private initializeDefaultPresets() {
    // Kick Drums
    this.addPreset({
      id: 'pulse-kick',
      name: 'Pulse Kick',
      category: 'kick',
      synth: {
        type: 'membrane',
        params: {
          pitchDecay: 0.05,
          octaves: 4,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
        },
        frequency: 'C1',
        duration: '8n'
      },
      effects: [],
      volume: 0.8
    });

    this.addPreset({
      id: 'punchy-kick',
      name: 'Punchy Kick',
      category: 'kick',
      synth: {
        type: 'membrane',
        params: {
          pitchDecay: 0.02,
          octaves: 6,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.8 }
        },
        frequency: 'C1',
        duration: '8n'
      },
      effects: [
        { type: 'compressor', params: { threshold: -30, ratio: 3 }, wetness: 1 },
        { type: 'distortion', params: { distortion: 0.4 }, wetness: 0.6 }
      ],
      volume: 0.9
    });

    // Hi-Hats
    this.addPreset({
      id: 'synco-hihat',
      name: 'Syncopation Hi-Hat',
      category: 'hihat',
      synth: {
        type: 'metal',
        params: {
          envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5
        },
        frequency: 'C6',
        duration: '16n'
      },
      effects: [
        { type: 'filter', params: { frequency: 8000, type: 'highpass' }, wetness: 0.7 }
      ],
      volume: 0.6
    });

    this.addPreset({
      id: 'open-hihat',
      name: 'Open Hi-Hat',
      category: 'hihat',
      synth: {
        type: 'metal',
        params: {
          envelope: { attack: 0.001, decay: 0.4, release: 0.1 },
          harmonicity: 3.1,
          modulationIndex: 16,
          resonance: 2000,
          octaves: 1
        },
        frequency: 'C5',
        duration: '8n'
      },
      effects: [],
      volume: 0.5
    });

    // Snares
    this.addPreset({
      id: '909-snare',
      name: '909 Snare',
      category: 'snare',
      synth: {
        type: 'noise',
        params: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.03 }
        },
        duration: '8n'
      },
      effects: [
        { type: 'filter', params: { frequency: 2000, type: 'bandpass' }, wetness: 0.8 },
        { type: 'chorus', params: { frequency: 4, delayTime: 2.5, depth: 0.5 }, wetness: 0.3 }
      ],
      volume: 0.7
    });

    // Bass
    this.addPreset({
      id: 'sub-bass',
      name: 'Sub Bass',
      category: 'bass',
      synth: {
        type: 'synth',
        params: {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.6 }
        },
        frequency: 'C1',
        duration: '8n'
      },
      effects: [
        { type: 'lowEnd', params: { frequency: 200, type: 'lowpass' }, wetness: 1 },
        { type: 'rumble', params: { distortion: 0.1 }, wetness: 0.3 }
      ],
      volume: 0.9
    });

    this.addPreset({
      id: 'rumble-bass',
      name: 'Rumble Bass',
      category: 'bass',
      synth: {
        type: 'membrane',
        params: {
          pitchDecay: 0.1,
          octaves: 3,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 0.8 }
        },
        frequency: 'C1',
        duration: '8n'
      },
      effects: [
        { type: 'filter', params: { frequency: 150, type: 'lowpass' }, wetness: 1 }
      ],
      volume: 0.8
    });

    // Percussion
    this.addPreset({
      id: 'poly-tom',
      name: 'Poly Tom',
      category: 'percussion',
      synth: {
        type: 'membrane',
        params: {
          pitchDecay: 0.08,
          octaves: 2,
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.5 }
        },
        frequency: 'C2',
        duration: '8n'
      },
      effects: [],
      volume: 0.6
    });

    this.addPreset({
      id: 'ride-cymbal',
      name: 'Ride Cymbal',
      category: 'percussion',
      synth: {
        type: 'metal',
        params: {
          envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
          harmonicity: 2.1,
          modulationIndex: 8,
          resonance: 1000,
          octaves: 0.5
        },
        frequency: 'C4',
        duration: '4n'
      },
      effects: [
        { type: 'delay', params: { delayTime: '8n', feedback: 0.2 }, wetness: 0.4 },
        { type: 'chorus', params: { frequency: 2, delayTime: 1, depth: 0.3 }, wetness: 0.2 }
      ],
      volume: 0.5
    });

    // Lead/Filters
    this.addPreset({
      id: 'filter-lead',
      name: 'Filter Lead',
      category: 'lead',
      synth: {
        type: 'synth',
        params: {
          oscillator: { type: 'square' },
          envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
        },
        frequency: 'C3',
        duration: '2n'
      },
      effects: [
        { type: 'autofilter', params: { frequency: 1/8, baseFrequency: 150, octaves: 1 }, wetness: 1 },
        { type: 'filter', params: { frequency: 800, type: 'lowpass' }, wetness: 0.7 },
        { type: 'reverb', params: { roomSize: 0.8 }, wetness: 0.4 }
      ],
      volume: 0.6
    });

    this.addPreset({
      id: 'dance-lead',
      name: 'Dance Lead',
      category: 'lead',
      synth: {
        type: 'synth',
        params: {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 1.2 }
        },
        frequency: 'C4',
        duration: '1n'
      },
      effects: [],
      volume: 0.7
    });
  }

  addPreset(preset: SoundPreset) {
    this.presets.set(preset.id, preset);
  }

  getPreset(id: string): SoundPreset | undefined {
    return this.presets.get(id);
  }

  getPresetsByCategory(category: SoundPreset['category']): SoundPreset[] {
    return Array.from(this.presets.values()).filter(p => p.category === category);
  }

  getAllPresets(): SoundPreset[] {
    return Array.from(this.presets.values());
  }

  getPresetsForRule(ruleId: number): SoundPreset[] {
    // Map rules to appropriate sound categories
    const ruleCategoryMap: Record<number, SoundPreset['category'][]> = {
      1: ['kick'],
      2: ['hihat'],
      3: ['kick'],
      4: ['bass'],
      5: ['snare'],
      6: ['hihat', 'percussion'],
      7: ['percussion'],
      8: ['lead'],
      9: ['percussion'],
      10: ['lead']
    };

    const categories = ruleCategoryMap[ruleId] || ['percussion'];
    return categories.flatMap(cat => this.getPresetsByCategory(cat));
  }

  // Get the default preset for a rule (current behavior)
  getDefaultPresetForRule(ruleId: number): SoundPreset | undefined {
    const presetMap: Record<number, string> = {
      1: 'pulse-kick',
      2: 'synco-hihat', 
      3: 'punchy-kick',
      4: 'sub-bass',
      5: '909-snare',
      6: 'open-hihat',
      7: 'poly-tom',
      8: 'filter-lead',
      9: 'ride-cymbal',
      10: 'dance-lead'
    };

    return this.getPreset(presetMap[ruleId] || 'pulse-kick');
  }

  createSynth(config: SynthConfig): Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth {
    switch (config.type) {
      case 'membrane':
        return new Tone.MembraneSynth(config.params);
      case 'metal':
        return new Tone.MetalSynth(config.params);
      case 'noise':
        return new Tone.NoiseSynth(config.params);
      case 'synth':
        return new Tone.Synth(config.params);
      default:
        return new Tone.Synth();
    }
  }

  createEffect(config: EffectConfig): Tone.ToneAudioNode {
    const { type, params } = config;
    
    switch (type) {
      case 'filter':
        return new Tone.Filter(params.frequency, params.type);
      case 'lowEnd':
        return new Tone.Filter(params.frequency, params.type);
      case 'rumble':
        return new Tone.Distortion(params.distortion);
      case 'distortion':
        return new Tone.Distortion(params.distortion);
      case 'compressor':
        return new Tone.Compressor(params.threshold, params.ratio);
      case 'reverb':
        return new Tone.Reverb(params.roomSize);
      case 'chorus':
        return new Tone.Chorus(params.frequency, params.delayTime, params.depth);
      case 'delay':
        return new Tone.PingPongDelay(params.delayTime, params.feedback);
      case 'autofilter':
        return new Tone.AutoFilter(params.frequency, params.baseFrequency, params.octaves);
      default:
        return new Tone.Gain(1);
    }
  }
}

export const soundBank = new SoundBank(); 