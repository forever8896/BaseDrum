import { UserDataSnapshot } from './data-fetcher';
import { SongData } from './songData';

export interface SimplifiedMusicConfig {
  pulse: {
    pattern: number[];
    velocity: number[];
  };
  syncopation: {
    pattern: number[];
    velocity: number[];
    reason: string;
  };
  bass: {
    pattern: number[];
    notes: string[];
    velocity: number[];
    reason: string;
  };
  kicks: {
    pattern: number[];
    velocity: number[];
    reason: string;
  };
  hihat: {
    pattern: number[];
    velocity: number[];
    reason: string;
  };
  lead: {
    pattern: number[];
    notes: string[];
    velocity: number[];
    reason: string;
  };
  tempo: number;
  effects: {
    filter: number;
    reverb: number;
  };
}

export class SimplifiedMusicGenerator {
  
  /**
   * Generate complete music configuration from user data
   */
  static generateFromUserData(userData: UserDataSnapshot | null): SimplifiedMusicConfig {
    if (!userData) {
      return this.generateDefaultConfig();
    }

    const config: SimplifiedMusicConfig = {
      pulse: this.generatePulse(),
      syncopation: this.generateSyncopation(userData),
      bass: this.generateBass(userData),
      kicks: this.generateKicks(userData),
      hihat: this.generateHihat(userData),
      lead: this.generateLead(userData),
      tempo: this.generateTempo(userData),
      effects: this.generateEffects(userData)
    };

    return config;
  }

  /**
   * Convert simplified config to SongData format
   */
  static configToSongData(config: SimplifiedMusicConfig): SongData {
    return {
      metadata: {
        title: "Generated Track",
        artist: "BaseDrum",
        version: "1.0",
        created: new Date().toISOString(),
        bpm: config.tempo,
        bars: 4,
        steps: 64,
        format: "basedrum-v1"
      },
      effects: {
        filter: {
          cutoff: config.effects.filter,
          type: "lowpass",
          startFreq: 20000 - (config.effects.filter * 19000),
          endFreq: 20000 - (config.effects.filter * 19000)
        },
        reverb: {
          wet: config.effects.reverb,
          roomSize: 0.7,
          decay: 2.0
        }
      },
      tracks: {
        pulse: {
          pattern: config.pulse.pattern,
          velocity: this.expandVelocityArray(config.pulse.velocity, 64),
          muted: false,
          volume: -6
        },
        clap: {
          pattern: config.syncopation.pattern,
          velocity: this.expandVelocityArray(config.syncopation.velocity, 64),
          muted: false,
          volume: -12
        },
        bass: {
          pattern: config.bass.pattern,
          notes: config.bass.notes,
          velocity: this.expandVelocityArray(config.bass.velocity, 64),
          muted: false,
          volume: -10
        },
        kick: {
          pattern: config.kicks.pattern,
          velocity: this.expandVelocityArray(config.kicks.velocity, 64),
          muted: false,
          volume: -6
        },
        hihat909: {
          pattern: config.hihat.pattern,
          velocity: this.expandVelocityArray(config.hihat.velocity, 64),
          muted: false,
          volume: -18
        },
        lead: {
          pattern: config.lead.pattern,
          notes: config.lead.notes,
          velocity: this.expandVelocityArray(config.lead.velocity, 64),
          muted: false,
          volume: -8
        }
      }
    };
  }

  /**
   * Generate foundational pulse - always the same quarter note pattern
   */
  private static generatePulse() {
    return {
      pattern: [0, 16, 32, 48], // Quarter notes across 4 bars (16 steps per bar)
      velocity: new Array(4).fill(0.8)
    };
  }

  /**
   * Generate syncopation based on follower count
   */
  private static generateSyncopation(userData: UserDataSnapshot) {
    const followers = userData.farcaster.followerCount || 0;
    const pattern: number[] = [];
    const velocity: number[] = [];
    
    // More followers = more syncopated claps
    const density = Math.min(followers / 1000, 1); // Normalize to 0-1
    
    // Basic syncopated positions (off-beat) - 4 bars only
    const syncoPositions = [6, 22, 38, 54]; // Off-beat positions in 4 bars
    
    syncoPositions.forEach(pos => {
      if (Math.random() < 0.5 + density * 0.5) {
        pattern.push(pos);
        velocity.push(0.6 + density * 0.2);
      }
    });

    return {
      pattern,
      velocity,
      reason: `Your ${followers} followers create syncopated rhythms`
    };
  }

  /**
   * Generate bass pattern based on transaction count
   */
  private static generateBass(userData: UserDataSnapshot) {
    const txCount = userData.onchain.transactionCount || 0;
    const walletBalance = parseFloat(userData.wallet.balance || '0');
    
    const pattern: number[] = [];
    const notes: string[] = [];
    const velocity: number[] = [];
    
    // More transactions = more bass movement
    const activity = Math.min(txCount / 100, 1); // Normalize
    const wealth = Math.min(walletBalance / 10, 1); // Normalize to 10 ETH max
    
    // Base bass notes - C minor scale
    const bassNotes = ['C2', 'D2', 'Eb2', 'F2', 'G2', 'Ab2', 'Bb2'];
    
    // Basic bass positions - 4 bars (64 steps)
    const basePositions = [0, 8, 16, 24, 32, 40, 48, 56]; // 8th note positions
    
    basePositions.forEach((pos, index) => {
      // Higher activity = more bass hits
      if (Math.random() < 0.3 + activity * 0.6) {
        pattern.push(pos);
        
        // Choose bass note based on position and wealth
        const noteIndex = Math.floor((index + wealth * 3) % bassNotes.length);
        notes.push(bassNotes[noteIndex]);
        
        // Wealthy wallets = stronger bass
        velocity.push(0.6 + wealth * 0.3);
      }
    });

    return {
      pattern,
      notes,
      velocity,
      reason: `Your ${txCount} transactions and ${walletBalance.toFixed(2)} ETH drive the bass`
    };
  }

  /**
   * Generate kick pattern based on wallet age and activity
   */
  private static generateKicks(userData: UserDataSnapshot) {
    const txCount = userData.onchain.transactionCount || 0;
    const pattern: number[] = [];
    const velocity: number[] = [];
    
    // Basic four-on-the-floor positions - 4 bars (64 steps)
    const kickPositions = [0, 16, 32, 48]; // Quarter notes
    
    // Activity affects kick presence and strength
    const activity = Math.min(txCount / 50, 1);
    
    kickPositions.forEach(pos => {
      // Always have some kicks, more activity = guaranteed kicks
      if (Math.random() < 0.7 + activity * 0.3) {
        pattern.push(pos);
        velocity.push(0.8 + activity * 0.2);
      }
    });

    return {
      pattern,
      velocity,
      reason: `Your ${txCount} transactions power the kicks`
    };
  }

  /**
   * Generate hihat pattern based on social activity
   */
  private static generateHihat(userData: UserDataSnapshot) {
    const following = userData.farcaster.followingCount || 0;
    const followers = userData.farcaster.followerCount || 0;
    
    const pattern: number[] = [];
    const velocity: number[] = [];
    
    // Social activity affects hihat density
    const socialActivity = Math.min((following + followers) / 500, 1);
    
    // 16th note hihat positions - 4 bars (64 steps)
    for (let i = 0; i < 64; i += 4) {
      // Off-beat emphasis
      if (i % 16 === 4 || i % 16 === 12) {
        if (Math.random() < 0.8 + socialActivity * 0.2) {
          pattern.push(i);
          velocity.push(0.5 + socialActivity * 0.2);
        }
      }
      // Fill in with social activity
      else if (Math.random() < socialActivity * 0.4) {
        pattern.push(i);
        velocity.push(0.3 + socialActivity * 0.2);
      }
    }

    return {
      pattern,
      velocity,
      reason: `Your ${followers} followers and ${following} following create the hihat groove`
    };
  }

  /**
   * Generate lead melody based on NFT and token diversity
   */
  private static generateLead(userData: UserDataSnapshot) {
    const nftCount = userData.onchain.nftCount || 0;
    const tokenCount = userData.onchain.tokenCount || 0;
    
    const pattern: number[] = [];
    const notes: string[] = [];
    const velocity: number[] = [];
    
    // Diversity affects melodic complexity
    const diversity = Math.min((nftCount + tokenCount) / 20, 1);
    
    // C minor pentatonic scale for lead
    const leadNotes = ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'];
    
    // Melodic positions - 8th notes, 4 bars (64 steps)
    const melodicPositions = [4, 12, 20, 28, 36, 44, 52, 60];
    
    melodicPositions.forEach((pos, index) => {
      // Higher diversity = more melodic activity
      if (Math.random() < diversity * 0.8 + 0.1) {
        pattern.push(pos);
        
        // Choose notes based on position and diversity
        const noteIndex = Math.floor((index * diversity + nftCount * 0.1) % leadNotes.length);
        notes.push(leadNotes[noteIndex]);
        
        velocity.push(0.5 + diversity * 0.3);
      }
    });

    return {
      pattern,
      notes,
      velocity,
      reason: `Your ${nftCount} NFTs and ${tokenCount} tokens create melodies`
    };
  }

  /**
   * Generate tempo based on overall activity
   */
  private static generateTempo(userData: UserDataSnapshot): number {
    // Always use 140 BPM to match the original pulse tempo
    return 140;
  }

  /**
   * Generate effects based on crypto prices and portfolio
   */
  private static generateEffects(userData: UserDataSnapshot) {
    const ethPrice = userData.prices.eth || 3000;
    const btcPrice = userData.prices.btc || 60000;
    const balance = parseFloat(userData.wallet.balance || '0');
    
    // Higher prices = more filtering (bullish = excitement)
    const priceEffect = Math.min((ethPrice + btcPrice/20) / 5000, 1);
    
    // Larger balance = more reverb (space/depth)
    const wealthEffect = Math.min(balance / 5, 1);
    
    return {
      filter: priceEffect * 0.5, // Moderate filtering
      reverb: wealthEffect * 0.3  // Subtle reverb
    };
  }

  /**
   * Generate default configuration for users without data
   */
  private static generateDefaultConfig(): SimplifiedMusicConfig {
    return {
      pulse: this.generatePulse(),
      syncopation: {
        pattern: [6, 22, 38, 54], // 4 bars only
        velocity: [0.6, 0.6, 0.6, 0.6],
        reason: "Default syncopation pattern"
      },
      bass: {
        pattern: [0, 16, 32, 48], // 4 bars only
        notes: ['C2', 'C2', 'C2', 'C2'],
        velocity: [0.7, 0.7, 0.7, 0.7],
        reason: "Default bass pattern"
      },
      kicks: {
        pattern: [0, 16, 32, 48], // 4 bars only
        velocity: [0.8, 0.8, 0.8, 0.8],
        reason: "Default kick pattern"
      },
      hihat: {
        pattern: [4, 12, 20, 28, 36, 44, 52, 60], // 4 bars only
        velocity: new Array(8).fill(0.5),
        reason: "Default hihat pattern"
      },
      lead: {
        pattern: [8, 24, 40, 56], // 4 bars only
        notes: ['C4', 'Eb4', 'F4', 'G4'],
        velocity: new Array(4).fill(0.6),
        reason: "Default lead pattern"
      },
      tempo: 140,
      effects: {
        filter: 0.0,
        reverb: 0.0
      }
    };
  }

  /**
   * Expand velocity array to match pattern length
   */
  private static expandVelocityArray(velocities: number[], targetLength: number): number[] {
    const expanded = new Array(targetLength).fill(0.7);
    // For now, just fill with default - real implementation would map velocities to steps
    return expanded;
  }

  /**
   * Get user-friendly explanations for generated music
   */
  static getGenerationExplanations(config: SimplifiedMusicConfig): string[] {
    return [
      config.syncopation.reason,
      config.bass.reason,
      config.kicks.reason,
      config.hihat.reason,
      config.lead.reason,
      `Tempo set to ${config.tempo} BPM based on your activity level`
    ];
  }
}