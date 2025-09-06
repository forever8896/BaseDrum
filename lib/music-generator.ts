import { UserDataSnapshot } from './data-fetcher';

export interface MusicalPattern {
  steps: boolean[];
  intensity: number; // 0-1
  complexity: number; // 0-1
  variation: number; // 0-1
}

export interface GeneratedTrack {
  id: string;
  name: string;
  pattern: boolean[];
  presetId: string;
  volume: number;
  effects: Record<string, number>;
  reason: string;
  musicalRole: 'foundation' | 'rhythm' | 'harmony' | 'lead' | 'texture';
}

export interface MusicalConstraints {
  tempo: number;
  key: string;
  mode: 'major' | 'minor' | 'dorian' | 'mixolydian';
  density: number; // 0-1, how busy the track should be
  energy: number; // 0-1, how energetic
  complexity: number; // 0-1, how complex rhythmically
}

export class MusicGenerator {
  // Predefined good-sounding pattern templates organized by musical role
  private static readonly PATTERN_TEMPLATES = {
    foundation: {
      // Kick drum patterns - the backbone
      fourOnFloor: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      offbeat: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      broken: [true, false, false, true, false, false, false, false, true, false, false, false, false, false, false, false],
      syncopated: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false],
    },
    rhythm: {
      // Hi-hat and percussion patterns
      steady: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      rolling: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      syncopated: [false, false, true, false, false, true, false, false, false, false, true, false, false, true, false, false],
      sparse: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
    harmony: {
      // Bass patterns that complement the foundation
      root: [true, false, false, true, false, false, false, false, true, false, false, true, false, false, false, false],
      walking: [true, false, false, false, false, true, false, false, true, false, false, false, false, true, false, false],
      pulsing: [true, false, true, false, false, false, false, false, true, false, true, false, false, false, false, false],
      minimal: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    lead: {
      // Melodic elements
      sparse: [true, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
      call: [true, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false],
      response: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, true, false],
      minimal: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    },
    texture: {
      // Snares, claps, and textural elements
      backbeat: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      shuffle: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
      ghost: [false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      accent: [false, false, false, false, true, false, false, false, false, false, true, false, true, false, false, false],
    }
  };

  // Musical scales and intervals for harmonic generation
  private static readonly SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
  };

  // Probability matrices for pattern variation
  private static readonly VARIATION_WEIGHTS = {
    conservative: { add: 0.1, remove: 0.1, shift: 0.05 },
    moderate: { add: 0.2, remove: 0.2, shift: 0.1 },
    adventurous: { add: 0.3, remove: 0.25, shift: 0.15 },
  };

  /**
   * Generate a complete track set based on user data
   */
  static generateTracks(userData: UserDataSnapshot | null): GeneratedTrack[] {
    const constraints = this.extractMusicalConstraints(userData);
    const seed = this.createSeed(userData);
    
    console.log('Generated musical constraints:', constraints);
    console.log('Using seed:', seed);

    // Generate tracks in order of musical importance
    const tracks: GeneratedTrack[] = [];

    // 1. Foundation (Kick) - Always present, drives everything
    tracks.push(this.generateFoundationTrack(constraints, seed, userData));

    // 2. Rhythm (Hi-hat) - Adds rhythmic interest
    if (constraints.density > 0.3) {
      tracks.push(this.generateRhythmTrack(constraints, seed, userData));
    }

    // 3. Harmony (Bass) - Harmonic foundation
    if (constraints.energy > 0.4) {
      tracks.push(this.generateHarmonyTrack(constraints, seed, userData));
    }

    // 4. Texture (Snare/Clap) - Adds groove and accent
    if (constraints.complexity > 0.5) {
      tracks.push(this.generateTextureTrack(constraints, seed, userData));
    }

    // 5. Lead (Melodic) - Top layer for interest
    if (constraints.density > 0.7) {
      tracks.push(this.generateLeadTrack(constraints, seed, userData));
    }

    return tracks;
  }

  /**
   * Extract musical constraints from user onchain data
   */
  private static extractMusicalConstraints(userData: UserDataSnapshot | null): MusicalConstraints {
    if (!userData) {
      return {
        tempo: 140,
        key: 'C',
        mode: 'minor',
        density: 0.6,
        energy: 0.7,
        complexity: 0.5,
      };
    }

    // Map user data to musical parameters with sensible ranges
    const farcaster = userData.farcaster;
    const onchain = userData.onchain;
    const wallet = userData.wallet;

    // Tempo: 120-160 BPM based on activity level
    const followerCount = farcaster.followerCount || 0;
    const followingCount = farcaster.followingCount || 0;
    const activityLevel = Math.min(followerCount + followingCount, 1000) / 1000;
    const tempo = Math.round(120 + (activityLevel * 40)); // 120-160 BPM

    // Density: How busy the track is (based on transaction count)
    const transactionCount = onchain.transactionCount || 0;
    const onchainActivity = Math.min(transactionCount, 1000) / 1000;
    const density = Math.min(onchainActivity, 1);

    // Energy: How intense the track is (based on wallet balance and token diversity)
    const balance = parseFloat(wallet.balance || '0');
    const wealth = Math.min(balance, 10) / 10; // Cap at 10 ETH equivalent
    const tokenCount = onchain.tokenCount || 0;
    const tokenActivity = Math.min(tokenCount, 20) / 20;
    const energy = Math.min((wealth + tokenActivity) / 2, 1);

    // Complexity: Rhythmic complexity (based on token diversity and NFT activity)
    const tokenDiversity = Math.min(tokenCount, 20) / 20;
    const nftActivity = Math.min(onchain.nftCount || 0, 50) / 50;
    const complexity = Math.min((tokenDiversity + nftActivity) / 2, 1);

    // Musical key based on user address hash
    const address = wallet.address || 'default';
    const addressSeed = this.hashString(address) % 12;
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const key = keys[addressSeed];

    // Mode based on overall vibe
    const isPositive = followerCount > followingCount; // More followers = major
    const mode = isPositive ? 'major' : 'minor';

    return {
      tempo,
      key,
      mode,
      density: Math.max(0.3, density), // Minimum density for musicality
      energy: Math.max(0.4, energy), // Minimum energy for interest
      complexity: Math.max(0.2, complexity), // Some complexity for groove
    };
  }

  /**
   * Create a deterministic seed from user data for reproducible randomness
   */
  private static createSeed(userData: UserDataSnapshot | null): number {
    if (!userData) return 12345;
    
    const address = userData.wallet.address || 'default';
    const followerCount = userData.farcaster.followerCount || 0;
    const transactionCount = userData.onchain.transactionCount || 0;
    
    const seedString = address + followerCount + transactionCount;
    
    return this.hashString(seedString) % 10000;
  }

  /**
   * Generate foundation track (kick drum)
   */
  private static generateFoundationTrack(
    constraints: MusicalConstraints, 
    seed: number, 
    userData: UserDataSnapshot | null
  ): GeneratedTrack {
    const rng = this.createSeededRNG(seed);
    const templates = this.PATTERN_TEMPLATES.foundation;
    
    // Choose pattern based on energy level
    let basePattern: boolean[];
    if (constraints.energy > 0.8) {
      basePattern = [...templates.fourOnFloor]; // High energy = steady kicks
    } else if (constraints.energy > 0.6) {
      basePattern = [...templates.broken]; // Medium energy = broken beat
    } else if (constraints.energy > 0.4) {
      basePattern = [...templates.syncopated]; // Lower energy = syncopated
    } else {
      basePattern = [...templates.offbeat]; // Minimal energy = offbeat
    }

    // Apply controlled variation
    const pattern = this.applyPatternVariation(basePattern, constraints.complexity, rng);

    const followerCount = userData?.farcaster.followerCount || 0;
    const reason = `Your ${followerCount} followers create`;

    return {
      id: 'kick',
      name: 'Foundation Kick',
      pattern,
      presetId: 'pulse-kick',
      volume: 0.8 + (constraints.energy * 0.2), // 0.8-1.0
      effects: {},
      reason,
      musicalRole: 'foundation'
    };
  }

  /**
   * Generate rhythm track (hi-hat)
   */
  private static generateRhythmTrack(
    constraints: MusicalConstraints, 
    seed: number, 
    userData: UserDataSnapshot | null
  ): GeneratedTrack {
    const rng = this.createSeededRNG(seed + 1);
    const templates = this.PATTERN_TEMPLATES.rhythm;
    
    let basePattern: boolean[];
    if (constraints.complexity > 0.7) {
      basePattern = [...templates.rolling];
    } else if (constraints.complexity > 0.5) {
      basePattern = [...templates.syncopated];
    } else if (constraints.complexity > 0.3) {
      basePattern = [...templates.steady];
    } else {
      basePattern = [...templates.sparse];
    }

    const pattern = this.applyPatternVariation(basePattern, constraints.complexity * 0.7, rng);

    const followingCount = userData?.farcaster.followingCount || 0;
    const reason = `Your ${followingCount} connections add`;

    return {
      id: 'hihat',
      name: 'Rhythmic Hi-Hat',
      pattern,
      presetId: 'synco-hihat',
      volume: 0.5 + (constraints.density * 0.3), // 0.5-0.8
      effects: {},
      reason,
      musicalRole: 'rhythm'
    };
  }

  /**
   * Generate harmony track (bass)
   */
  private static generateHarmonyTrack(
    constraints: MusicalConstraints, 
    seed: number, 
    userData: UserDataSnapshot | null
  ): GeneratedTrack {
    const rng = this.createSeededRNG(seed + 2);
    const templates = this.PATTERN_TEMPLATES.harmony;
    
    let basePattern: boolean[];
    if (constraints.energy > 0.8) {
      basePattern = [...templates.walking];
    } else if (constraints.energy > 0.6) {
      basePattern = [...templates.pulsing];
    } else if (constraints.energy > 0.4) {
      basePattern = [...templates.root];
    } else {
      basePattern = [...templates.minimal];
    }

    const pattern = this.applyPatternVariation(basePattern, constraints.complexity * 0.6, rng);

    const ethBalance = parseFloat(userData?.wallet.balance || '0');
    const reason = `Your ${ethBalance.toFixed(2)} ETH balance unlocks`;

    return {
      id: 'bass',
      name: 'Harmonic Bass',
      pattern,
      presetId: 'sub-bass',
      volume: 0.7 + (constraints.energy * 0.2), // 0.7-0.9
      effects: { 
        lowEnd: 0.7 + (constraints.energy * 0.3), 
        rumble: constraints.complexity * 0.4 
      },
      reason,
      musicalRole: 'harmony'
    };
  }

  /**
   * Generate texture track (snare/clap)
   */
  private static generateTextureTrack(
    constraints: MusicalConstraints, 
    seed: number, 
    userData: UserDataSnapshot | null
  ): GeneratedTrack {
    const rng = this.createSeededRNG(seed + 3);
    const templates = this.PATTERN_TEMPLATES.texture;
    
    let basePattern: boolean[];
    if (constraints.complexity > 0.8) {
      basePattern = [...templates.shuffle];
    } else if (constraints.complexity > 0.6) {
      basePattern = [...templates.accent];
    } else if (constraints.complexity > 0.4) {
      basePattern = [...templates.backbeat];
    } else {
      basePattern = [...templates.ghost];
    }

    const pattern = this.applyPatternVariation(basePattern, constraints.complexity * 0.5, rng);

    const transactionCount = userData?.onchain.transactionCount || 0;
    const reason = `Your ${transactionCount} transactions add`;

    return {
      id: 'snare',
      name: 'Groove Snare',
      pattern,
      presetId: '909-snare',
      volume: 0.6 + (constraints.energy * 0.2), // 0.6-0.8
      effects: {},
      reason,
      musicalRole: 'texture'
    };
  }

  /**
   * Generate lead track (melodic)
   */
  private static generateLeadTrack(
    constraints: MusicalConstraints, 
    seed: number, 
    userData: UserDataSnapshot | null
  ): GeneratedTrack {
    const rng = this.createSeededRNG(seed + 4);
    const templates = this.PATTERN_TEMPLATES.lead;
    
    let basePattern: boolean[];
    if (constraints.density > 0.9) {
      basePattern = [...templates.call];
    } else if (constraints.density > 0.8) {
      basePattern = [...templates.response];
    } else if (constraints.density > 0.7) {
      basePattern = [...templates.sparse];
    } else {
      basePattern = [...templates.minimal];
    }

    const pattern = this.applyPatternVariation(basePattern, constraints.complexity * 0.4, rng);

    const nftCount = userData?.onchain.nftCount || 0;
    const reason = `Your ${nftCount} NFTs create`;

    return {
      id: 'lead',
      name: 'Melodic Lead',
      pattern,
      presetId: 'filter-lead',
      volume: 0.4 + (constraints.density * 0.3), // 0.4-0.7
      effects: { 
        filter: 0.5 + (constraints.complexity * 0.5), 
        resonance: constraints.energy * 0.6 
      },
      reason,
      musicalRole: 'lead'
    };
  }

  /**
   * Apply controlled variation to a base pattern
   */
  private static applyPatternVariation(
    basePattern: boolean[], 
    complexityFactor: number, 
    rng: () => number
  ): boolean[] {
    const pattern = [...basePattern];
    const weights = complexityFactor > 0.7 
      ? this.VARIATION_WEIGHTS.adventurous
      : complexityFactor > 0.4 
      ? this.VARIATION_WEIGHTS.moderate 
      : this.VARIATION_WEIGHTS.conservative;

    // Add some beats (sparingly)
    for (let i = 0; i < pattern.length; i++) {
      if (!pattern[i] && rng() < weights.add) {
        // Only add beats that don't conflict with strong downbeats
        if (i % 4 !== 0) {
          pattern[i] = true;
        }
      }
    }

    // Remove some beats (very sparingly)
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] && rng() < weights.remove) {
        // Never remove downbeats (every 4th step)
        if (i % 4 !== 0) {
          pattern[i] = false;
        }
      }
    }

    return pattern;
  }

  /**
   * Create a seeded random number generator
   */
  private static createSeededRNG(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Simple string hash function
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
} 