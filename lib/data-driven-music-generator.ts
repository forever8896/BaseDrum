import { UserDataSnapshot } from './data-fetcher';

export interface MusicExplanation {
  element: string;
  reason: string;
  dataUsed: string;
  musicalEffect: string;
}

export interface GeneratedMusic {
  // 4 bars, 4 steps per bar = 16 steps total  
  // Each step represents a quarter note at 140 BPM
  patterns: {
    kick: boolean[];      // 16 steps
    hihat: boolean[];     // 16 steps  
    snare: boolean[];     // 16 steps
    bass: number[];       // 16 steps (0 = silence, 1-7 = note indices)
    lead: number[];       // 16 steps (0 = silence, 1-6 = note indices)
  };
  
  // Musical parameters
  tempo: 140;  // Fixed at 140 BPM
  bars: 4;
  stepsPerBar: 4;
  totalSteps: 16;
  
  // Note mappings
  bassNotes: string[];   // C minor scale notes for bass
  leadNotes: string[];   // C minor pentatonic for lead
  
  // Explanations for each element
  explanations: MusicExplanation[];
}

export class DataDrivenMusicGenerator {
  
  /**
   * Generate music from user's blockchain and social data
   */
  static generateMusic(userData: UserDataSnapshot | null): GeneratedMusic {
    const music: GeneratedMusic = {
      patterns: {
        kick: new Array(16).fill(false),
        hihat: new Array(16).fill(false),
        snare: new Array(16).fill(false),
        bass: new Array(16).fill(0),
        lead: new Array(16).fill(0)
      },
      tempo: 140,
      bars: 4,
      stepsPerBar: 4,
      totalSteps: 16,
      bassNotes: ['C2', 'D2', 'Eb2', 'F2', 'G2', 'Ab2', 'Bb2'],
      leadNotes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'],
      explanations: []
    };

    if (!userData) {
      return this.generateDefaultMusic(music);
    }

    // Extract key data points
    const txCount = userData.onchain.transactionCount || 0;
    const followers = userData.farcaster.followerCount || 0;
    const following = userData.farcaster.followingCount || 0;
    const balance = parseFloat(userData.wallet.balance || '0');
    const tokenCount = userData.onchain.tokenCount || 0;
    const nftCount = userData.onchain.nftCount || 0;
    const ethPrice = userData.prices.eth || 3000;

    // Generate each musical element based on data
    this.generateKickPattern(music, txCount);
    this.generateHihatPattern(music, followers, following);
    this.generateSnarePattern(music, balance);
    this.generateBassPattern(music, txCount, balance);
    this.generateLeadPattern(music, tokenCount, nftCount, ethPrice);

    return music;
  }

  /**
   * Generate kick drum pattern based on transaction count
   */
  private static generateKickPattern(music: GeneratedMusic, txCount: number) {
    // Base pattern: Four on the floor (steps 0, 4, 8, 12) - every quarter note
    const baseKicks = [0, 4, 8, 12];
    
    // Activity level determines additional kicks
    const activityLevel = Math.min(txCount / 10, 1); // 0-1 scale
    
    baseKicks.forEach(step => {
      music.patterns.kick[step] = true;
    });

    // Add syncopated kicks based on activity (on off-beats)
    if (activityLevel > 0.5) {
      // Add kicks on off-beats (steps 2, 6, 10, 14)
      const syncoKicks = [2, 6, 10, 14];
      syncoKicks.forEach(step => {
        if (Math.random() < activityLevel * 0.5) {
          music.patterns.kick[step] = true;
        }
      });
    }

    music.explanations.push({
      element: 'Kick Drum',
      reason: `Your ${txCount} transactions create the foundation`,
      dataUsed: `${txCount} onchain transactions`,
      musicalEffect: activityLevel > 0.3 ? 
        'Strong four-on-floor with syncopated accents' : 
        'Classic four-on-floor pattern'
    });
  }

  /**
   * Generate hi-hat pattern based on social activity
   */
  private static generateHihatPattern(music: GeneratedMusic, followers: number, following: number) {
    const socialActivity = Math.min((followers + following) / 20, 1); // 0-1 scale
    
    // Base hi-hat on off-beats (steps 1, 3, 5, 7, 9, 11, 13, 15) - between kicks
    const offBeats = [1, 3, 5, 7, 9, 11, 13, 15];
    
    offBeats.forEach(step => {
      if (Math.random() < 0.7 + socialActivity * 0.3) {
        music.patterns.hihat[step] = true;
      }
    });

    // Add more hi-hats based on social activity
    if (socialActivity > 0.3) {
      // Add additional hits on even steps that don't conflict with kicks
      const additionalHits = [2, 6, 10, 14];
      additionalHits.forEach(step => {
        if (!music.patterns.kick[step] && Math.random() < socialActivity * 0.6) {
          music.patterns.hihat[step] = true;
        }
      });
    }

    music.explanations.push({
      element: 'Hi-Hat',
      reason: `Your ${followers} followers and ${following} following drive the groove`,
      dataUsed: `${followers + following} total social connections`,
      musicalEffect: socialActivity > 0.2 ? 
        'Off-beat groove with 16th note fills' : 
        'Simple off-beat pattern'
    });
  }

  /**
   * Generate snare pattern based on wallet balance
   */
  private static generateSnarePattern(music: GeneratedMusic, balance: number) {
    const wealth = Math.min(balance / 5, 1); // 0-1 scale (5 ETH max)
    
    // Base snare on beats 2 and 4 (steps 2, 10) - backbeat pattern
    const backbeats = [2, 10];
    
    backbeats.forEach(step => {
      music.patterns.snare[step] = true;
    });

    // Wealthy wallets get additional snare hits
    if (wealth > 0.3) {
      // Add snares on beats 1 and 3 of bars 2 and 4 (steps 6, 14)
      const additionalSnares = [6, 14];
      additionalSnares.forEach(step => {
        if (Math.random() < wealth * 0.8) {
          music.patterns.snare[step] = true;
        }
      });
    }

    // Very wealthy wallets get fills
    if (wealth > 0.7) {
      // Add fills on last beat of bars (steps 3, 7, 11, 15)
      const fillPositions = [3, 7, 11, 15];
      fillPositions.forEach(step => {
        if (Math.random() < wealth * 0.4) {
          music.patterns.snare[step] = true;
        }
      });
    }

    music.explanations.push({
      element: 'Snare/Clap',
      reason: `Your ${balance.toFixed(3)} ETH balance adds punch to the backbeat`,
      dataUsed: `${balance.toFixed(3)} ETH wallet balance`,
      musicalEffect: wealth > 0.5 ? 
        'Backbeat with ghost notes and fills' : 
        wealth > 0.2 ? 'Backbeat with ghost notes' : 
        'Clean backbeat on 2 and 4'
    });
  }

  /**
   * Generate bass pattern based on transactions and balance
   */
  private static generateBassPattern(music: GeneratedMusic, txCount: number, balance: number) {
    const activity = Math.min(txCount / 10, 1);
    const wealth = Math.min(balance / 3, 1);
    
    // Bass notes: 1=C, 2=D, 3=Eb, 4=F, 5=G, 6=Ab, 7=Bb
    // Simple progression: C - F - C - F (steps 0, 4, 8, 12)
    const bassPattern = [1, 4, 1, 4]; // C-F-C-F
    
    // More active wallets get more bass notes
    const density = Math.max(0.5, activity); // At least half the bass notes
    
    for (let i = 0; i < 4; i++) {
      const step = i * 4; // Steps 0, 4, 8, 12
      if (Math.random() < density) {
        music.patterns.bass[step] = bassPattern[i];
      }
    }

    // Wealthy wallets get additional bass notes
    if (wealth > 0.4) {
      const additionalSteps = [1, 5, 9, 13]; // Between main beats
      additionalSteps.forEach((step, index) => {
        if (Math.random() < wealth * 0.6) {
          music.patterns.bass[step] = bassPattern[index] || 1;
        }
      });
    }

    music.explanations.push({
      element: 'Bass',
      reason: `Your ${txCount} transactions and ${balance.toFixed(3)} ETH create harmonic movement`,
      dataUsed: `${txCount} transactions + ${balance.toFixed(3)} ETH balance`,
      musicalEffect: wealth > 0.4 ? 
        'Walking bassline with chord progressions' : 
        'Root-focused bass pattern following C minor harmony'
    });
  }

  /**
   * Generate lead melody based on tokens, NFTs, and crypto prices
   */
  private static generateLeadPattern(music: GeneratedMusic, tokenCount: number, nftCount: number, ethPrice: number) {
    const diversity = Math.min((tokenCount + nftCount) / 10, 1);
    const priceLevel = Math.min(ethPrice / 4000, 1); // ETH price influence
    
    // Lead notes: 1=C4, 2=Eb4, 3=F4, 4=G4, 5=Bb4, 6=C5
    const pentatonicScale = [1, 2, 3, 4, 5, 6];
    
    // More diverse portfolios get more melodic activity
    const melodicDensity = diversity * 0.4; // Keep it sparse
    
    for (let bar = 0; bar < 4; bar++) {
      const barStart = bar * 16;
      
      // Add melodic phrases on weak beats
      const melodicPositions = [2, 6, 10, 14]; // Syncopated positions
      
      melodicPositions.forEach((beat, index) => {
        const step = barStart + beat;
        if (Math.random() < melodicDensity) {
          // Higher ETH price = higher notes
          const priceBonus = Math.floor(priceLevel * 2);
          let noteIndex = Math.floor(Math.random() * 4) + 1 + priceBonus; // Favor higher notes
          noteIndex = Math.min(noteIndex, 6); // Cap at highest note
          music.patterns.lead[step] = noteIndex;
        }
      });

      // Rich portfolios get call-and-response phrases
      if (diversity > 0.6) {
        if (bar % 2 === 1) { // Response bars
          const responsePositions = [1, 5, 9];
          responsePositions.forEach(beat => {
            const step = barStart + beat;
            if (Math.random() < 0.7) {
              music.patterns.lead[step] = Math.floor(Math.random() * 3) + 1; // Lower response notes
            }
          });
        }
      }
    }

    music.explanations.push({
      element: 'Lead Melody',
      reason: `Your ${tokenCount} tokens, ${nftCount} NFTs, and ETH at $${ethPrice} shape the melody`,
      dataUsed: `${tokenCount} tokens + ${nftCount} NFTs + $${ethPrice} ETH price`,
      musicalEffect: diversity > 0.6 ? 
        'Call-and-response melodic phrases in C minor pentatonic' :
        diversity > 0.3 ? 'Sparse syncopated melody' : 
        'Minimal melodic accents'
    });
  }

  /**
   * Generate default music when no user data available
   */
  private static generateDefaultMusic(music: GeneratedMusic): GeneratedMusic {
    // Simple default patterns
    
    // Basic four-on-floor kick
    [0, 16, 32, 48].forEach(step => {
      music.patterns.kick[step] = true;
    });

    // Off-beat hi-hats
    [4, 12, 20, 28, 36, 44, 52, 60].forEach(step => {
      music.patterns.hihat[step] = true;
    });

    // Backbeat snare
    [8, 24, 40, 56].forEach(step => {
      music.patterns.snare[step] = true;
    });

    // Simple bass on root
    [0, 8, 16, 24, 32, 40, 48, 56].forEach(step => {
      music.patterns.bass[step] = 1; // Root note (C)
    });

    music.explanations.push({
      element: 'Default Pattern',
      reason: 'No user data available - using default techno pattern',
      dataUsed: 'None',
      musicalEffect: 'Classic four-on-floor techno with C minor tonality'
    });

    return music;
  }

  /**
   * Convert generated music to playable format
   */
  static musicToSongData(music: GeneratedMusic) {
    // Convert patterns to step arrays
    const kickPattern: number[] = [];
    const hihatPattern: number[] = [];
    const snarePattern: number[] = [];
    const bassPattern: number[] = [];
    const leadPattern: number[] = [];
    const bassNotes: string[] = [];
    const leadNotes: string[] = [];

    for (let i = 0; i < 16; i++) {
      if (music.patterns.kick[i]) kickPattern.push(i);
      if (music.patterns.hihat[i]) hihatPattern.push(i);
      if (music.patterns.snare[i]) snarePattern.push(i);
      if (music.patterns.bass[i] > 0) {
        bassPattern.push(i);
        bassNotes.push(music.bassNotes[music.patterns.bass[i] - 1]);
      }
      if (music.patterns.lead[i] > 0) {
        leadPattern.push(i);
        leadNotes.push(music.leadNotes[music.patterns.lead[i] - 1]);
      }
    }

    return {
      metadata: {
        title: "Data-Driven Track",
        artist: "BaseDrum",
        version: "1.0",
        created: new Date().toISOString(),
        bpm: 140,
        bars: 4,
        steps: 16,
        format: "basedrum-v1"
      },
      effects: {
        filter: { cutoff: 0.0, type: "lowpass", startFreq: 20000, endFreq: 20000 },
        reverb: { wet: 0.1, roomSize: 0.7, decay: 2.0 }
      },
      tracks: {
        kick: {
          pattern: kickPattern,
          velocity: new Array(64).fill(0.8),
          muted: false,
          volume: -6
        },
        hihat909: {
          pattern: hihatPattern,
          velocity: new Array(64).fill(0.6),
          muted: false,
          volume: -18
        },
        clap: {
          pattern: snarePattern,
          velocity: new Array(64).fill(0.7),
          muted: false,
          volume: -12
        },
        bass: {
          pattern: bassPattern,
          notes: bassNotes,
          velocity: new Array(64).fill(0.7),
          muted: false,
          volume: -10
        },
        lead: {
          pattern: leadPattern,
          notes: leadNotes,
          velocity: new Array(64).fill(0.6),
          muted: false,
          volume: -8
        }
      },
      explanations: music.explanations
    };
  }
}