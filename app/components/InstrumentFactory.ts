import * as Tone from 'tone';

export interface InstrumentSet {
  kick: Tone.MembraneSynth;
  hihat: Tone.NoiseSynth;
  bass: Tone.Synth;
  lead: Tone.PolySynth;
  snare: Tone.NoiseSynth;
  rumble: Tone.Oscillator;
  rumbleEnv: Tone.AmplitudeEnvelope;
  ride: Tone.NoiseSynth;
  clap: Tone.NoiseSynth;
  acid: Tone.MonoSynth;
  pulse: Tone.MembraneSynth; // Rule 1: Kick-hihat hybrid pulse (down-up-down-up)
  hihat909Env: Tone.AmplitudeEnvelope;
  hihat909Osc1: Tone.Oscillator;
  hihat909Osc2: Tone.Oscillator;
  hihat909Osc3: Tone.Oscillator;
  hihat909Noise: Tone.Noise;
}

export class InstrumentFactory {
  private filter: Tone.Filter;
  private reverb: Tone.Reverb;

  constructor(filter: Tone.Filter, reverb: Tone.Reverb) {
    this.filter = filter;
    this.reverb = reverb;
  }

  createKick(): Tone.MembraneSynth {
    return new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
    }).connect(this.filter);
  }

  createHihat(): Tone.NoiseSynth {
    const hihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.002,
        decay: 0.03,
        sustain: 0.2,
        release: 0.15,
      },
    });

    const hihatFilter = new Tone.Filter({
      frequency: 5000,
      type: "highpass",
      rolloff: -12,
    });

    hihat.connect(hihatFilter);
    hihatFilter.connect(this.filter);

    return hihat;
  }

  createHihat909(): {
    hihat909Env: Tone.AmplitudeEnvelope;
    hihat909Osc1: Tone.Oscillator;
    hihat909Osc2: Tone.Oscillator;
    hihat909Osc3: Tone.Oscillator;
    hihat909Noise: Tone.Noise;
  } {
    const hihat909Osc1 = new Tone.Oscillator(320, "square");
    const hihat909Osc2 = new Tone.Oscillator(800, "square");
    const hihat909Osc3 = new Tone.Oscillator(540, "square");
    const hihat909Noise = new Tone.Noise("white");

    const hihat909Env = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.01,
    });

    const hihat909Mixer = new Tone.Gain(2.0);
    const hihat909Filter = new Tone.Filter({
      frequency: 7000,
      type: "highpass",
      rolloff: -24,
    });

    hihat909Osc1.connect(hihat909Mixer);
    hihat909Osc2.connect(hihat909Mixer);
    hihat909Osc3.connect(hihat909Mixer);
    hihat909Noise.connect(hihat909Mixer);

    hihat909Mixer.connect(hihat909Env);
    hihat909Env.connect(hihat909Filter);
    hihat909Filter.connect(this.filter);

    hihat909Osc1.start();
    hihat909Osc2.start();
    hihat909Osc3.start();
    hihat909Noise.start();

    return { hihat909Env, hihat909Osc1, hihat909Osc2, hihat909Osc3, hihat909Noise };
  }

  createBass(): Tone.Synth {
    return new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4 },
    }).connect(this.filter);
  }

  createLead(): Tone.PolySynth {
    // Create polyphonic lead for professional overlapping notes
    const lead = new Tone.PolySynth(Tone.Synth, {
      polyphony: 6, // Allow up to 6 simultaneous notes for Detroit chord progressions
      options: {
        oscillator: { type: "square" },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
      }
    });

    // Add a dedicated filter for lead processing
    const leadFilter = new Tone.Filter({
      frequency: 800,
      Q: 8,
      type: "lowpass",
      rolloff: -24
    });

    // Add dynamic filter modulation
    const leadFilterLFO = new Tone.LFO(0.5, 400, 1200);
    leadFilterLFO.connect(leadFilter.frequency);
    leadFilterLFO.start();

    // Add resonance modulation for movement
    const resLFO = new Tone.LFO(0.3, 5, 12);
    resLFO.connect(leadFilter.Q);
    resLFO.start();

    // Chain: lead -> leadFilter -> main filter
    lead.connect(leadFilter);
    leadFilter.connect(this.filter);
    
    return lead;
  }

  createSnare(): Tone.NoiseSynth {
    const snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.0,
        release: 0.1,
      },
    });

    const snareFilter = new Tone.Filter({
      frequency: 2000,
      type: "bandpass",
      Q: 2,
    });

    snare.connect(snareFilter);
    snareFilter.connect(this.filter);

    return snare;
  }

  createRumble(): { rumble: Tone.Oscillator; rumbleEnv: Tone.AmplitudeEnvelope } {
    const rumble = new Tone.Oscillator({
      frequency: "E0",
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

    rumble.start();

    return { rumble, rumbleEnv };
  }

  createRide(): Tone.NoiseSynth {
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

    return ride;
  }

  async createClap(): Promise<Tone.NoiseSynth> {
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

    await clapReverb.ready;
    clap.connect(clapFilter);
    clapFilter.connect(clapReverb);
    clapReverb.connect(this.filter);

    return clap;
  }

  createPulse(): Tone.MembraneSynth {
    // Rule 1: Kick-hihat hybrid pulse - the down-up-down-up foundation
    // This is a percussive tone that has both the body of a kick and the presence of a hihat
    const pulse = new Tone.MembraneSynth({
      pitchDecay: 0.02, // Short pitch sweep for hihat-like character
      octaves: 6,       // Wide range for both low body and high presence
      oscillator: { 
        type: "sawtooth" // Sawtooth for both low and high harmonic content
      },
      envelope: { 
        attack: 0.001,  // Very quick attack for punch
        decay: 0.08,    // Short decay for crisp pulse
        sustain: 0.05,  // Minimal sustain  
        release: 0.12   // Quick release
      },
    });

    // Multi-band processing for kick-hihat hybrid character
    const lowFilter = new Tone.Filter({
      frequency: 120,   // Low frequencies for kick body
      type: "lowpass",
      Q: 2,
    });

    const highFilter = new Tone.Filter({
      frequency: 3000,  // High frequencies for hihat presence
      type: "highpass", 
      Q: 1,
    });

    // Mix low and high content
    const lowGain = new Tone.Gain(0.7);  // More low end
    const highGain = new Tone.Gain(0.4); // Less high end
    const mixer = new Tone.Gain();

    // Signal chain
    pulse.connect(lowFilter);
    pulse.connect(highFilter);
    lowFilter.connect(lowGain);
    highFilter.connect(highGain);
    lowGain.connect(mixer);
    highGain.connect(mixer);
    mixer.connect(this.filter);

    return pulse;
  }

  createAcid(): Tone.MonoSynth {
    const acid = new Tone.MonoSynth({
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.1,
        release: 0.8,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.2,
        release: 0.4,
        baseFrequency: 150, // Lower for more dramatic sweeps
        octaves: 4, // Wider range for more dramatic effect
      },
      filter: {
        Q: 15, // Higher resonance for classic acid squelch
        type: "lowpass",
        rolloff: -24,
      },
    });

    // Add LFO for dynamic filter modulation
    const filterLFO = new Tone.LFO(0.25, 100, 800); // 0.25Hz, 100-800Hz range
    filterLFO.connect(acid.filter.frequency);
    filterLFO.start();

    // Add resonance LFO for movement
    const resLFO = new Tone.LFO(0.125, 10, 20); // Slower resonance movement
    resLFO.connect(acid.filter.Q);
    resLFO.start();

    return acid.connect(this.filter);
  }

  // Acid instrument variants with preserved effects
  createAcidVariant(variant: 'classic' | 'deep' | 'screamer' | 'liquid'): Tone.MonoSynth {
    const acidConfigs = {
      classic: {
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.8 },
        filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.4, baseFrequency: 150, octaves: 4 },
        filter: { Q: 15, type: "lowpass" as const, rolloff: -24 as const },
        lfo: { filterRate: 0.25, filterMin: 100, filterMax: 800, resRate: 0.125, resMin: 10, resMax: 20 }
      },
      deep: {
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.02, decay: 0.25, sustain: 0.3, release: 1.2 },
        filterEnvelope: { attack: 0.02, decay: 0.5, sustain: 0.4, release: 0.8, baseFrequency: 80, octaves: 3 },
        filter: { Q: 12, type: "lowpass" as const, rolloff: -24 as const },
        lfo: { filterRate: 0.125, filterMin: 60, filterMax: 400, resRate: 0.0625, resMin: 8, resMax: 16 }
      },
      screamer: {
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.6 },
        filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.3, baseFrequency: 300, octaves: 5 },
        filter: { Q: 25, type: "lowpass" as const, rolloff: -24 as const },
        lfo: { filterRate: 0.5, filterMin: 200, filterMax: 1500, resRate: 0.25, resMin: 15, resMax: 30 }
      },
      liquid: {
        oscillator: { type: "square" as const },
        envelope: { attack: 0.03, decay: 0.4, sustain: 0.6, release: 1.5 },
        filterEnvelope: { attack: 0.03, decay: 0.6, sustain: 0.5, release: 0.7, baseFrequency: 120, octaves: 3.5 },
        filter: { Q: 8, type: "lowpass" as const, rolloff: -12 as const },
        lfo: { filterRate: 0.1, filterMin: 80, filterMax: 600, resRate: 0.05, resMin: 5, resMax: 12 }
      }
    };

    const config = acidConfigs[variant];
    const acid = new Tone.MonoSynth({
      oscillator: config.oscillator,
      envelope: config.envelope,
      filterEnvelope: config.filterEnvelope,
      filter: config.filter,
    });

    // Add LFO for dynamic filter modulation
    const filterLFO = new Tone.LFO(config.lfo.filterRate, config.lfo.filterMin, config.lfo.filterMax);
    filterLFO.connect(acid.filter.frequency);
    filterLFO.start();

    // Add resonance LFO for movement
    const resLFO = new Tone.LFO(config.lfo.resRate, config.lfo.resMin, config.lfo.resMax);
    resLFO.connect(acid.filter.Q);
    resLFO.start();

    return acid.connect(this.filter);
  }

  // Detroit lead preset variants for testing
  createDetroitLeadPreset(preset: 'strings_of_life' | 'motor_city_pad' | 'underground_stab' | 'belleville_poly' | 'techno_brass'): Tone.PolySynth {
    const detroitLeadPresets = {
      strings_of_life: {
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.1, decay: 0.6, sustain: 0.9, release: 2.0 }, // Long sustain like orchestral strings
        filter: { frequency: 1200, Q: 3, type: "lowpass" as const, rolloff: -12 as const }, // Smoother, less harsh
        lfo: { filterRate: 0.3, filterMin: 800, filterMax: 1600, resRate: 0.2, resMin: 2, resMax: 4 }
      },
      motor_city_pad: {
        oscillator: { type: "square" as const },
        envelope: { attack: 0.3, decay: 0.8, sustain: 0.85, release: 3.0 }, // Slow attack like pad
        filter: { frequency: 1000, Q: 2, type: "lowpass" as const, rolloff: -12 as const }, // Very warm and smooth
        lfo: { filterRate: 0.15, filterMin: 600, filterMax: 1200, resRate: 0.1, resMin: 1, resMax: 3 }
      },
      underground_stab: {
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 1.0 }, // Quick attack, sustained
        filter: { frequency: 1300, Q: 6, type: "lowpass" as const, rolloff: -24 as const }, // Punchy but not harsh
        lfo: { filterRate: 0.8, filterMin: 800, filterMax: 1800, resRate: 0.4, resMin: 4, resMax: 8 }
      },
      belleville_poly: {
        oscillator: { type: "fatsawtooth" as const, spread: 15, count: 3 },
        envelope: { attack: 0.08, decay: 0.4, sustain: 0.75, release: 1.5 }, // Rich polyphonic character
        filter: { frequency: 1100, Q: 4, type: "lowpass" as const, rolloff: -24 as const }, // Balanced and smooth
        lfo: { filterRate: 0.5, filterMin: 700, filterMax: 1400, resRate: 0.25, resMin: 3, resMax: 6 }
      },
      techno_brass: {
        oscillator: { type: "square" as const },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.2 }, // Brass-like attack and sustain
        filter: { frequency: 1400, Q: 5, type: "lowpass" as const, rolloff: -24 as const }, // Bright but controlled
        lfo: { filterRate: 0.6, filterMin: 900, filterMax: 1800, resRate: 0.3, resMin: 3, resMax: 7 }
      }
    };

    const config = detroitLeadPresets[preset];
    // Create polyphonic lead preset - optimized to prevent glitching
    const lead = new Tone.PolySynth(Tone.Synth, {
      polyphony: 3, // Further reduced to prevent audio glitches
      options: {
        oscillator: config.oscillator,
        envelope: config.envelope,
        volume: -3 // Balanced volume per voice
      }
    });

    // Add a dedicated filter for lead processing
    const leadFilter = new Tone.Filter(config.filter);

    // Add dynamic filter modulation
    const leadFilterLFO = new Tone.LFO(config.lfo.filterRate, config.lfo.filterMin, config.lfo.filterMax);
    leadFilterLFO.connect(leadFilter.frequency);
    leadFilterLFO.start();

    // Add resonance modulation for movement
    const leadResLFO = new Tone.LFO(config.lfo.resRate, config.lfo.resMin, config.lfo.resMax);
    leadResLFO.connect(leadFilter.Q);
    leadResLFO.start();

    // Chain: lead -> leadFilter -> main filter
    lead.connect(leadFilter);
    leadFilter.connect(this.filter);
    
    return lead;
  }

  // Lead instrument variants with preserved effects  
  createLeadVariant(variant: 'classic' | 'stab' | 'pluck' | 'pad' | 'supersaw' | 'hoover' | 'wave' | 'detroit'): Tone.PolySynth {
    const leadConfigs = {
      classic: {
        oscillator: { type: "square" as const },
        envelope: { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 },
        filter: { frequency: 800, Q: 8, type: "lowpass" as const, rolloff: -24 as const },
        lfo: { filterRate: 0.5, filterMin: 400, filterMax: 1200, resRate: 0.3, resMin: 5, resMax: 12 }
      },
      stab: {
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
        filter: { frequency: 1200, Q: 12, type: "lowpass" as const, rolloff: -24 as const },
        lfo: { filterRate: 1.0, filterMin: 800, filterMax: 2000, resRate: 0.5, resMin: 8, resMax: 18 }
      },
      pluck: {
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.6 },
        filter: { frequency: 1000, Q: 6, type: "lowpass" as const, rolloff: -12 as const },
        lfo: { filterRate: 0.75, filterMin: 600, filterMax: 1400, resRate: 0.25, resMin: 4, resMax: 10 }
      },
      pad: {
        oscillator: { type: "square" as const },
        envelope: { attack: 0.3, decay: 1.0, sustain: 0.9, release: 3.0 },
        filter: { frequency: 600, Q: 4, type: "lowpass" as const, rolloff: -12 as const },
        lfo: { filterRate: 0.2, filterMin: 300, filterMax: 800, resRate: 0.1, resMin: 3, resMax: 8 }
      },
      // NEW PROFESSIONAL TECHNO VARIANTS
      supersaw: {
        oscillator: { type: "fatsawtooth" as const, spread: 25, count: 5 },
        envelope: { attack: 0.08, decay: 0.4, sustain: 0.7, release: 1.8 },
        filter: { frequency: 1200, Q: 8, type: "lowpass" as const, rolloff: -24 as const },
        lfo: { filterRate: 0.4, filterMin: 800, filterMax: 1800, resRate: 0.2, resMin: 6, resMax: 10 }
      },
      hoover: {
        oscillator: { type: "fatsquare" as const, spread: 20, count: 3 },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.2 },
        filter: { frequency: 1400, Q: 12, type: "lowpass" as const, rolloff: -24 as const },
        lfo: { filterRate: 0.6, filterMin: 900, filterMax: 2000, resRate: 0.3, resMin: 8, resMax: 15 }
      },
      wave: {
        oscillator: { type: "pulse" as const, width: 0.4 },
        envelope: { attack: 0.12, decay: 0.6, sustain: 0.7, release: 2.0 },
        filter: { frequency: 1000, Q: 6, type: "lowpass" as const, rolloff: -12 as const },
        lfo: { filterRate: 0.3, filterMin: 600, filterMax: 1400, resRate: 0.15, resMin: 4, resMax: 8 }
      },
      detroit: {
        oscillator: { type: "square" as const },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.5 }, // More sustain for string-section power
        filter: { frequency: 1600, Q: 8, type: "lowpass" as const, rolloff: -24 as const }, // Higher cutoff for presence
        lfo: { filterRate: 0.6, filterMin: 1000, filterMax: 2200, resRate: 0.3, resMin: 6, resMax: 10 } // Presence range movement
      }
    };

    const config = leadConfigs[variant];
    // Create polyphonic lead variant for professional overlapping notes
    const lead = new Tone.PolySynth(Tone.Synth, {
      polyphony: 6, // Allow up to 6 simultaneous notes for Detroit harmonies
      options: {
        oscillator: config.oscillator,
        envelope: config.envelope,
      }
    });

    // Add a dedicated filter for lead processing
    const leadFilter = new Tone.Filter(config.filter);

    // Add dynamic filter modulation
    const leadFilterLFO = new Tone.LFO(config.lfo.filterRate, config.lfo.filterMin, config.lfo.filterMax);
    leadFilterLFO.connect(leadFilter.frequency);
    leadFilterLFO.start();

    // Add resonance modulation for movement
    const resLFO = new Tone.LFO(config.lfo.resRate, config.lfo.resMin, config.lfo.resMax);
    resLFO.connect(leadFilter.Q);
    resLFO.start();

    // Add subtle chorus for professional width (for supersaw and hoover)
    if (variant === 'supersaw' || variant === 'hoover') {
      const chorus = new Tone.Chorus(4, 2.5, 0.5);
      lead.connect(chorus);
      chorus.connect(leadFilter);
    } else {
      lead.connect(leadFilter);
    }

    leadFilter.connect(this.filter);
    
    return lead;
  }

  async createAllInstruments(): Promise<InstrumentSet> {
    const kick = this.createKick();
    const hihat = this.createHihat();
    const bass = this.createBass();
    const lead = this.createLead();
    const snare = this.createSnare();
    const { rumble, rumbleEnv } = this.createRumble();
    const ride = this.createRide();
    const clap = await this.createClap();
    const pulse = this.createPulse();
    const acid = this.createAcid();
    const hihat909 = this.createHihat909();

    return {
      kick,
      hihat,
      bass,
      lead,
      snare,
      rumble,
      rumbleEnv,
      ride,
      clap,
      pulse,
      acid,
      ...hihat909,
    };
  }
}

export async function createEffectsChain(): Promise<{
  filter: Tone.Filter;
  reverb: Tone.Reverb;
}> {
  const filter = new Tone.Filter({
    frequency: 20000,
    type: "lowpass",
    rolloff: -12,
  });

  const reverb = new Tone.Reverb({
    decay: 1.5,
    wet: 0.0,
  });

  await reverb.ready;

  filter.connect(reverb);
  reverb.toDestination();

  return { filter, reverb };
} 