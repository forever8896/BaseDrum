"use client";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { SimpleAudioEngine } from "@/lib/simpleAudioEngine";
import { DataFetcher, UserDataSnapshot } from "@/lib/data-fetcher";
import { SongData, validateSongData } from "@/lib/songSchema-new";

// Animation and styling constants
const FLASH_TEXT_DURATION = 150;
const FLASH_TEXTS = ["base", "drum"] as const;
const BEAT_INTENSITY_SCALE_FACTOR = 0.12;
const BEAT_INTENSITY_BRIGHTNESS_FACTOR = 0.4;
const BEAT_INTENSITY_SHADOW_FACTOR = 20;
const BEAT_INTENSITY_GLOW_OPACITY = 0.9;

// CSS styles for the pulsating square
interface SquareStyle {
  transform: string;
  filter: string;
  boxShadow: string;
  transition: string;
}

type FlashText = (typeof FLASH_TEXTS)[number] | null;

// PulsatingSquare component props
interface PulsatingSquareProps {
  style: SquareStyle;
  onClick: () => void;
  flashText: FlashText;
}

// Extracted PulsatingSquare component
function PulsatingSquare({
  style,
  onClick,
  flashText,
  squareRef,
}: PulsatingSquareProps & { squareRef?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="relative" ref={squareRef}>
      <div
        className="w-48 h-48 bg-blue-600 rounded-[5%] cursor-pointer hover:bg-blue-700 transition-colors"
        style={style}
        onClick={() => {
          console.log("Square clicked, flashText:", flashText);
          onClick();
        }}
      />

      {flashText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="text-white font-black text-6xl tracking-wide"
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              textShadow: "0 0 10px rgba(0,0,0,0.5)",
              animation: "flash-in 0.15s ease-out",
            }}
          >
            {flashText}
          </div>
        </div>
      )}
    </div>
  );
}

// Drum sequencer component
function DrumSequencer({
  currentStep,
  songData,
  showSnareTrack,
  showBassTrack,
  showAcidTrack,
}: {
  currentStep: number;
  songData: SongData;
  showSnareTrack?: boolean;
  showBassTrack?: boolean;
  showAcidTrack?: boolean;
}) {
  const steps = Array.from({ length: 16 }, (_, i) => i);
  
  // Extract patterns from songData
  const kickPattern = songData.tracks.kick?.pattern || [];
  const snarePattern = songData.tracks.snare?.pattern || [];
  const bassPattern = songData.tracks.bass?.pattern || [];
  const acidPattern = songData.tracks.acid?.pattern || [];
  const acidNotes = songData.tracks.acid?.notes || [];

  return (
    <div className="w-full px-10">
      <div className="flex flex-col items-center justify-center w-full gap-2">
        {/* Kick track */}
      <div
        className="flex gap-1 justify-center"
        style={{ gap: "min(0.5rem, calc((100vw - 160px) / 32))" }}
      >
        {steps.map((step) => {
          const hasKick = kickPattern.includes(step);
          const isCurrentStep = step === currentStep % 16; // Cycle through 16 steps

          return (
            <div
              key={step}
              className={`rounded-[5%] cursor-pointer transition-all opacity-0 animate-fade-in ${
                hasKick
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-600 bg-opacity-20 hover:bg-opacity-30"
              } ${isCurrentStep ? "ring-2 ring-white" : ""}`}
              style={{
                animationDelay: `${step * 50}ms`,
                animationFillMode: "forwards",
                width: "min(2rem, calc((100vw - 2rem) / 20))",
                height: "min(2rem, calc((100vw - 2rem) / 20))",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Snare track */}
      {showSnareTrack && snarePattern && (
        <div
          className="flex gap-1 justify-center"
          style={{ gap: "min(0.5rem, calc((100vw - 160px) / 32))" }}
        >
          {steps.map((step) => {
            const hasSnare = snarePattern.includes(step);
            const isCurrentStep = step === currentStep % 16;

            return (
              <div
                key={step}
                className={`rounded-[5%] cursor-pointer transition-all opacity-0 animate-fade-in ${
                  hasSnare
                    ? "hover:brightness-110"
                    : "hover:bg-opacity-30"
                } ${isCurrentStep ? "ring-2 ring-white" : ""}`}
                style={{
                  animationDelay: `${step * 50}ms`,
                  animationFillMode: "forwards",
                  width: "min(2rem, calc((100vw - 2rem) / 20))",
                  height: "min(2rem, calc((100vw - 2rem) / 20))",
                  flexShrink: 0,
                  backgroundColor: hasSnare ? "#ffd12f" : "rgba(255, 209, 47, 0.2)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Bass track */}
      {showBassTrack && bassPattern && (
        <div
          className="flex gap-1 justify-center"
          style={{ gap: "min(0.5rem, calc((100vw - 160px) / 32))" }}
        >
          {steps.map((step) => {
            const hasBass = bassPattern.includes(step);
            const isCurrentStep = step === currentStep % 16;

            return (
              <div
                key={step}
                className={`rounded-[5%] cursor-pointer transition-all opacity-0 animate-fade-in ${
                  hasBass
                    ? "hover:brightness-110"
                    : "hover:bg-opacity-30"
                } ${isCurrentStep ? "ring-2 ring-white" : ""}`}
                style={{
                  animationDelay: `${step * 50}ms`,
                  animationFillMode: "forwards",
                  width: "min(2rem, calc((100vw - 2rem) / 20))",
                  height: "min(2rem, calc((100vw - 2rem) / 20))",
                  flexShrink: 0,
                  backgroundColor: hasBass ? "#b6f569" : "rgba(182, 245, 105, 0.2)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Acid track */}
      {showAcidTrack && acidPattern && (
        <div
          className="flex gap-1 justify-center"
          style={{ gap: "min(0.5rem, calc((100vw - 160px) / 32))" }}
        >
          {steps.map((step) => {
            const hasAcid = acidPattern.includes(step) && acidNotes[step];
            const isCurrentStep = step === currentStep % 16;

            return (
              <div
                key={step}
                className={`rounded-[5%] cursor-pointer transition-all opacity-0 animate-fade-in ${
                  hasAcid
                    ? "hover:brightness-110"
                    : "hover:bg-opacity-30"
                } ${isCurrentStep ? "ring-2 ring-white" : ""}`}
                style={{
                  animationDelay: `${step * 50}ms`,
                  animationFillMode: "forwards",
                  width: "min(2rem, calc((100vw - 2rem) / 20))",
                  height: "min(2rem, calc((100vw - 2rem) / 20))",
                  flexShrink: 0,
                  backgroundColor: hasAcid ? "#fea8cd" : "rgba(254, 168, 205, 0.2)",
                }}
              />
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  const { isConnected, address } = useAccount();
  const { context } = useMiniKit();
  const audioEngineRef = useRef<SimpleAudioEngine | null>(null);
  const beatCountRef = useRef(0);
  const [dataFetcher] = useState(() => new DataFetcher());

  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [showFlashText, setShowFlashText] = useState<FlashText>(null);
  const [bottomText, setBottomText] = useState("");
  const [bottomTextVisible, setBottomTextVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSequencer, setShowSequencer] = useState(false);
  const [sequencerText, setSequencerText] = useState("");
  const [sequencerTextVisible, setSequencerTextVisible] = useState(false);
  const squareRef = useRef<HTMLDivElement>(null);

  // Data and track state
  const [userSnapshot, setUserSnapshot] = useState<UserDataSnapshot | null>(
    null,
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Unified song data in schema format
  const [songData, setSongData] = useState<SongData>(() => {
    // Initialize with default song structure
    return {
      metadata: {
        title: "Your Onchain Beat",
        artist: "BaseDrum",
        version: "1.0.0",
        created: new Date().toISOString(),
        bpm: 128,
        bars: 1,
        steps: 16,
        format: "basedrum-v1"
      },
      effects: {
        filter: {
          cutoff: 0.8,
          type: "lowpass",
          startFreq: 800,
          endFreq: 800
        },
        reverb: {
          wet: 0.3,
          roomSize: 0.7,
          decay: 2.0
        }
      },
      tracks: {
        kick: {
          pattern: [0, 4, 8, 12], // Default 4/4 pattern
          muted: false,
          volume: -6
        },
        snare: {
          pattern: [4, 12], // Basic snare on beats 2 and 4
          muted: true, // Start muted
          volume: -8
        },
        bass: {
          pattern: [0, 2, 8, 10], // Simple bass pattern
          muted: true, // Start muted
          volume: -6
        },
        acid: {
          pattern: [],
          notes: [],
          muted: true, // Start muted
          volume: -16
        }
      }
    };
  });
  
  // UI progression state
  const [showSnareTrack, setShowSnareTrack] = useState(false);
  const [showBassTrack, setShowBassTrack] = useState(false);
  const [showAcidTrack, setShowAcidTrack] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  
  // Progression state - tracks which stage we're at
  const [progressionStage, setProgressionStage] = useState<'kick-educational' | 'kick-personal' | 'snare-educational' | 'snare-personal' | 'bass-educational' | 'bass-personal' | 'acid-educational' | 'acid-personal' | 'ai-ready' | 'ai-processing' | 'complete'>('kick-educational');
  
  // AI processing state
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Export song data function (for demonstration)
  const exportSongData = useCallback(() => {
    try {
      const exportData = {
        ...songData,
        metadata: {
          ...songData.metadata,
          title: `${songData.metadata.title} - ${new Date().toLocaleTimeString()}`
        }
      };
      const validated = validateSongData(exportData);
      const jsonString = JSON.stringify(validated, null, 2);
      console.log('📁 Exportable Song Data (basedrum-v1 format):', jsonString);
      return jsonString;
    } catch (error) {
      console.error('❌ Export validation failed:', error);
      return null;
    }
  }, [songData]);

  // Cleanup audio engine on unmount
  useEffect(() => {
    return () => {
      audioEngineRef.current?.dispose();
    };
  }, []);

  // Fetch user data when wallet connects
  useEffect(() => {
    if (isConnected && address && !userSnapshot && !isLoadingData) {
      fetchUserData();
    }
  }, [isConnected, address, userSnapshot, isLoadingData, fetchUserData]);

  // Helper function to update song data safely with validation
  const updateSongData = useCallback((updater: (current: SongData) => SongData) => {
    setSongData(current => {
      try {
        const updated = updater(current);
        // Validate the updated song data
        const validated = validateSongData(updated);
        console.log('✅ Song data validated successfully:', {
          title: validated.metadata.title,
          tracks: Object.keys(validated.tracks),
          totalSteps: Object.values(validated.tracks).reduce((sum, track) => sum + track.pattern.length, 0)
        });
        return validated;
      } catch (error) {
        console.error('❌ Song data validation failed:', error);
        return current; // Return current data if validation fails
      }
    });
  }, []);

  const generateKickPattern = useCallback(
    (transactionCount: number): number[] => {
      if (transactionCount === 0) {
        return [0, 4, 8, 12]; // Standard four-on-floor
      } else if (transactionCount <= 25) {
        return [0, 3, 4, 8, 12]; // Add anticipation kick
      } else if (transactionCount <= 100) {
        return [0, 2, 4, 8, 10, 12]; // Double hits
      } else {
        return [0, 1, 4, 6, 8, 9, 12, 14]; // Complex syncopation
      }
    },
    [],
  );

  const generateSnarePattern = useCallback(
    (followerCount: number): number[] => {
      if (followerCount === 0) {
        return [4, 12]; // Standard snare on beats 2 and 4
      } else if (followerCount <= 50) {
        return [4, 12, 14]; // Add anticipation
      } else if (followerCount <= 200) {
        return [4, 6, 12]; // Add syncopation
      } else {
        return [2, 4, 6, 12, 14]; // Complex rhythm for influencers
      }
    },
    [],
  );

  const generateBassPattern = useCallback(
    (tokenCount: number): number[] => {
      if (tokenCount === 0 || tokenCount <= 5) {
        return [0, 2, 8, 10]; // Simple bass on root notes
      } else if (tokenCount <= 10) {
        return [0, 2, 4, 8, 10, 12]; // Add more hits
      } else if (tokenCount <= 20) {
        return [0, 1, 2, 8, 9, 10]; // Add syncopation
      } else {
        return [0, 1, 2, 4, 6, 8, 9, 10, 12, 14]; // Complex bass line for portfolio diversity
      }
    },
    [],
  );

  const createKickTrackData = useCallback((pattern: number[]): TrackData => {
    return {
      pattern: pattern,
      velocity: new Array(pattern.length).fill(1.0),
      muted: false,
      volume: -6, // Same as defaultSong.json kick volume
    };
  }, []);

  // Test function to make client-side API calls visible in network tab
  const testNeynarAPI = async () => {
    try {
      console.log("Testing Neynar API from client...");
      
      // First, test our test endpoint
      const testResponse = await fetch('/api/test-neynar?fid=12152');
      const testData = await testResponse.json();
      console.log("Test API response:", testData);
      
      // Also test the farcaster-data endpoint
      if (context && typeof context === 'object') {
        const ctx = context as Record<string, unknown>;
        if (ctx.user && typeof ctx.user === 'object') {
          const user = ctx.user as Record<string, unknown>;
          if (typeof user.fid === 'number') {
            console.log("Testing with user FID:", user.fid);
            const farcasterResponse = await fetch(`/api/farcaster-data?fid=${user.fid}`);
            const farcasterData = await farcasterResponse.json();
            console.log("Farcaster API response:", farcasterData);
          }
        }
      }
    } catch (error) {
      console.error("Test API call failed:", error);
    }
  };

  const fetchUserData = async () => {
    if (!address) return;

    setIsLoadingData(true);
    try {
      console.log("Fetching user data for personalized track generation...");
      console.log("MiniKit context:", context);
      console.log("Connected address:", address);
      
      // Debug the context structure
      if (context && typeof context === 'object') {
        const ctx = context as Record<string, unknown>;
        console.log("Context keys:", Object.keys(ctx));
        console.log("Context.user:", ctx.user);
        if (ctx.user && typeof ctx.user === 'object') {
          const user = ctx.user as Record<string, unknown>;
          console.log("User keys:", Object.keys(user));
          console.log("User FID:", user.fid);
          console.log("User follower count:", user.followerCount);
        }
      }

      // Use the actual DataFetcher to get real user data
      const snapshot = await dataFetcher.fetchUserSnapshot(context, address);
      setUserSnapshot(snapshot);

      // Generate kick pattern based on actual transaction count
      const txCount = snapshot.onchain.transactionCount || 0;
      const generatedPattern = generateKickPattern(txCount);
      
      // Update song data with new kick pattern
      updateSongData(current => ({
        ...current,
        tracks: {
          ...current.tracks,
          kick: {
            ...current.tracks.kick,
            pattern: generatedPattern
          }
        }
      }));

      console.log(
        `Generated kick pattern for ${txCount} transactions:`,
        generatedPattern,
      );
      console.log("User snapshot:", snapshot);

      // Update audio engine with new pattern if initialized
      if (audioEngineRef.current) {
        audioEngineRef.current.setKickPattern(generatedPattern);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Use default pattern on error
      const defaultPattern = [0, 4, 8, 12];
      updateSongData(current => ({
        ...current,
        tracks: {
          ...current.tracks,
          kick: {
            ...current.tracks.kick,
            pattern: defaultPattern
          }
        }
      }));

      // Update audio engine with default pattern if initialized
      if (audioEngineRef.current) {
        audioEngineRef.current.setKickPattern(defaultPattern);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const getPersonalKickMessage = useCallback((): string => {
    if (!userSnapshot) {
      return "You're keeping the standard 4/4 kick pattern";
    }

    const txCount = userSnapshot.onchain.transactionCount || 0;

    if (txCount === 0) {
      return "Because you have no onchain transactions, you're keeping the standard 4/4 kick. Welcome to web3!";
    } else if (txCount <= 25) {
      return `Because you have made ${txCount} transactions, you get an extra anticipation kick!`;
    } else if (txCount <= 100) {
      return `Because you have made ${txCount} transactions, you get an upgraded double-hit kick pattern!`;
    } else {
      return `Because you have made ${txCount} transactions, you get the most complex syncopated kick!`;
    }
  }, [userSnapshot]);

  const getPersonalSnareMessage = useCallback((): string => {
    if (!userSnapshot) {
      return "You're keeping the standard snare on beats 2 and 4";
    }
    const followerCount = userSnapshot.farcaster.followerCount || 0;
    
    // Debug logging
    console.log('Generating clap message with data:', {
      followerCount,
      farcasterData: userSnapshot.farcaster,
      hasFollowerCount: userSnapshot.farcaster.followerCount !== undefined
    });
    
    if (followerCount === 0) {
      return "Because you have no followers yet, you're keeping the standard snare on beats 2 and 4";
    } else if (followerCount <= 50) {
      return `Because you have ${followerCount} followers, you get an anticipation snare pattern!`;
    } else if (followerCount <= 200) {
      return `Because you have ${followerCount} followers, you get syncopated snare patterns!`;
    } else {
      return `Because you have ${followerCount} followers, you get complex influencer-level rhythm snares!`;
    }
  }, [userSnapshot]);

  const getPersonalBassMessage = useCallback((): string => {
    if (!userSnapshot) {
      return "You're keeping the simple bass line";
    }
    const tokenCount = userSnapshot.onchain.tokenCount || 0;
    if (tokenCount === 0 || tokenCount <= 5) {
      return `Because you hold ${tokenCount} tokens, you're keeping the simple bass foundation`;
    } else if (tokenCount <= 10) {
      return `Because you hold ${tokenCount} tokens in your portfolio, you get more bass hits!`;
    } else if (tokenCount <= 20) {
      return `Because you hold ${tokenCount} diverse tokens, you get an upgraded syncopated bass line!`;
    } else {
      return `Because you hold ${tokenCount} tokens, you get the most complex DeFi native bass line!`;
    }
  }, [userSnapshot]);

  const getPersonalAcidMessage = useCallback((): string => {
    if (!address) {
      return "Your wallet creates a unique acid melody";
    }
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const hexSection = address.slice(2, 18); // First 16 hex chars after 0x
    return `Because your wallet address is ${shortAddress}, you get a completely unique acid melody! Each hex character (${hexSection}) maps to notes in a minor scale, with D/E/F creating musical rests.`;
  }, [address]);

  const sendToAIProducer = useCallback(async () => {
    try {
      setIsAIProcessing(true);
      setProgressionStage('ai-processing');
      setSequencerTextVisible(false);
      setTimeout(() => {
        setSequencerText("AI producer is enhancing your track...");
        setSequencerTextVisible(true);
      }, 300);

      const response = await fetch('/api/improve-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songData),
      });

      if (!response.ok) {
        throw new Error('Failed to improve song');
      }

      const improvedSongData = await response.json();
      
      // Validate the improved song data
      const validatedImprovedSong = validateSongData(improvedSongData);
      
      // Update the song data with the improved version
      setSongData(validatedImprovedSong);
      
      // Update audio engine with improved patterns
      if (audioEngineRef.current) {
        // Update all tracks with improved patterns
        if (validatedImprovedSong.tracks.kick) {
          audioEngineRef.current.setKickPattern(validatedImprovedSong.tracks.kick.pattern);
        }
        if (validatedImprovedSong.tracks.snare) {
          audioEngineRef.current.setSnarePattern(validatedImprovedSong.tracks.snare.pattern);
        }
        if (validatedImprovedSong.tracks.bass) {
          audioEngineRef.current.setBassPattern(validatedImprovedSong.tracks.bass.pattern);
        }
        if (validatedImprovedSong.tracks.acid) {
          // Convert pattern + notes back to melody format for audio engine
          const melodyData = validatedImprovedSong.tracks.acid.pattern.map(step => ({
            step,
            note: validatedImprovedSong.tracks.acid.notes?.[step] || null
          }));
          audioEngineRef.current.setAcidPattern(melodyData);
        }
      }

      // Show completion message
      setIsAIProcessing(false);
      setProgressionStage('complete');
      setSequencerTextVisible(false);
      setTimeout(() => {
        setSequencerText("🎵 Your personalized techno track has been enhanced by AI! 🎵");
        setSequencerTextVisible(true);
        
        // Export final song data
        setTimeout(() => {
          exportSongData();
        }, 2000);
      }, 300);

    } catch (error) {
      console.error('Failed to improve song:', error);
      setIsAIProcessing(false);
      setProgressionStage('complete');
      setSequencerTextVisible(false);
      setTimeout(() => {
        setSequencerText("Something went wrong with the AI producer. Playing your original track.");
        setSequencerTextVisible(true);
        exportSongData();
      }, 300);
    }
  }, [songData, validateSongData, exportSongData]);

  const handleNextClick = useCallback(() => {
    console.log('Next button clicked, current stage:', progressionStage);
    setShowNextButton(false);
    
    if (progressionStage === 'kick-educational') {
      // Move from kick educational to kick personal
      setProgressionStage('kick-personal');
      setTimeout(() => {
        setSequencerTextVisible(false);
        setTimeout(() => {
          const personalText = getPersonalKickMessage();
          setSequencerText(personalText);
          setSequencerTextVisible(true);
          
          // NOW upgrade to their actual pattern - dramatic transformation!
          const basicPattern = [0, 4, 8, 12];
          const userTxCount = userSnapshot?.onchain.transactionCount || 0;
          const personalizedPattern = generateKickPattern(userTxCount);
          
          // Only upgrade if it's different from basic
          if (JSON.stringify(personalizedPattern) !== JSON.stringify(basicPattern)) {
            setTimeout(() => {
              updateSongData(current => ({
                ...current,
                tracks: {
                  ...current.tracks,
                  kick: {
                    ...current.tracks.kick,
                    pattern: personalizedPattern
                  }
                }
              }));
              if (audioEngineRef.current) {
                audioEngineRef.current.setKickPattern(personalizedPattern);
              }
              console.log("✨ Pattern upgraded from basic to personalized!", personalizedPattern);
            }, 500); // 500ms after personal text appears for dramatic effect
          }
          
          // Show Next button for snare progression
          setTimeout(() => {
            setShowNextButton(true);
            setProgressionStage('snare-educational');
          }, 2000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'snare-educational') {
      // Start snare track progression
      setProgressionStage('snare-personal');
      setTimeout(() => {
        // 1. Change title and start with basic snare pattern
        setShowSnareTrack(true);
        const basicSnarePattern = [4, 12]; // Basic snare on beats 2 and 4
        updateSongData(current => ({
          ...current,
          tracks: {
            ...current.tracks,
            snare: {
              ...current.tracks.snare,
              pattern: basicSnarePattern,
              muted: false // Unmute the snare track now that we're introducing it
            }
          }
        }));
        audioEngineRef.current?.setSnarePattern(basicSnarePattern);
        audioEngineRef.current?.setSnareMuted(false);
        
        // 2. Show educational text
        setTimeout(() => {
          setSequencerTextVisible(false);
          setTimeout(() => {
            setSequencerText("The snare adds rhythm and drive to your track");
            setSequencerTextVisible(true);
            
            // Show Next button for snare personalization
            setTimeout(() => {
              setShowNextButton(true);
            }, 2000);
          }, 300);
        }, 500);
      }, 300);
    } else if (progressionStage === 'snare-personal') {
      // Show personal snare message and upgrade pattern
      setProgressionStage('bass-educational');
      setTimeout(() => {
        setSequencerTextVisible(false);
        setTimeout(() => {
          const personalSnareText = getPersonalSnareMessage();
          setSequencerText(personalSnareText);
          setSequencerTextVisible(true);
          
          // Upgrade snare pattern based on user data - but only if earned
          const basicSnarePattern = [4, 12]; // Basic snare
          const userFollowerCount = userSnapshot?.farcaster.followerCount || 0;
          const personalizedSnarePattern = generateSnarePattern(userFollowerCount);
          
          // Only upgrade if it's different from basic
          if (JSON.stringify(personalizedSnarePattern) !== JSON.stringify(basicSnarePattern)) {
            setTimeout(() => {
              updateSongData(current => ({
                ...current,
                tracks: {
                  ...current.tracks,
                  snare: {
                    ...current.tracks.snare,
                    pattern: personalizedSnarePattern
                  }
                }
              }));
              audioEngineRef.current?.setSnarePattern(personalizedSnarePattern);
            }, 500);
          }
          
          // Show Next button for bass progression
          setTimeout(() => {
            setShowNextButton(true);
          }, 2000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'bass-educational') {
      // Start bass track progression
      setProgressionStage('bass-personal');
      setTimeout(() => {
        // 1. Change title and start with basic bass pattern
        setShowBassTrack(true);
        const basicBassPattern = [0, 2, 8, 10]; // Simple bass pattern
        updateSongData(current => ({
          ...current,
          tracks: {
            ...current.tracks,
            bass: {
              ...current.tracks.bass,
              pattern: basicBassPattern,
              muted: false // Unmute the bass track now that we're introducing it
            }
          }
        }));
        audioEngineRef.current?.setBassPattern(basicBassPattern);
        audioEngineRef.current?.setBassMuted(false);
        
        // 2. Show educational text
        setTimeout(() => {
          setSequencerTextVisible(false);
          setTimeout(() => {
            setSequencerText("The bass provides the foundation and groove");
            setSequencerTextVisible(true);
            
            // Show Next button for bass personalization
            setTimeout(() => {
              setShowNextButton(true);
            }, 2000);
          }, 300);
        }, 500);
      }, 300);
    } else if (progressionStage === 'bass-personal') {
      // Show personal bass message and upgrade pattern
      setProgressionStage('acid-educational');
      setTimeout(() => {
        setSequencerTextVisible(false);
        setTimeout(() => {
          const personalBassText = getPersonalBassMessage();
          setSequencerText(personalBassText);
          setSequencerTextVisible(true);
          
          // Upgrade bass pattern based on user data - but only if earned
          const basicBassPattern = [0, 2, 8, 10]; // Basic bass
          const userTokenCount = userSnapshot?.onchain.tokenCount || 0;
          const personalizedBassPattern = generateBassPattern(userTokenCount);
          
          // Only upgrade if it's different from basic
          if (JSON.stringify(personalizedBassPattern) !== JSON.stringify(basicBassPattern)) {
            setTimeout(() => {
              updateSongData(current => ({
                ...current,
                tracks: {
                  ...current.tracks,
                  bass: {
                    ...current.tracks.bass,
                    pattern: personalizedBassPattern
                  }
                }
              }));
              audioEngineRef.current?.setBassPattern(personalizedBassPattern);
            }, 500);
          }
          
          // Show Next button for acid progression
          setTimeout(() => {
            setShowNextButton(true);
          }, 2000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'acid-educational') {
      // Start acid track progression
      setProgressionStage('acid-personal');
      setTimeout(() => {
        // 1. Change title and show acid track
        setShowAcidTrack(true);
        
        // 2. Generate melody from connected wallet address
        if (address && audioEngineRef.current) {
          console.log('Generating acid melody from wallet address:', address);
          const generatedMelody = audioEngineRef.current.generateAcidMelodyFromWallet(address);
          
          // Convert melody format to schema format
          const acidSteps: number[] = [];
          const acidNotes: string[] = new Array(16).fill("");
          
          generatedMelody.forEach(({ step, note }) => {
            if (note) {
              acidSteps.push(step);
              acidNotes[step] = note;
            }
          });
          
          updateSongData(current => ({
            ...current,
            tracks: {
              ...current.tracks,
              acid: {
                ...current.tracks.acid,
                pattern: acidSteps,
                notes: acidNotes,
                muted: false // Unmute the acid track now that we're introducing it
              }
            }
          }));
          
          audioEngineRef.current.setAcidPattern(generatedMelody);
          audioEngineRef.current.setAcidMuted(false);
          console.log('Generated acid melody:', generatedMelody);
        }
        
        // 3. Show educational text
        setTimeout(() => {
          setSequencerTextVisible(false);
          setTimeout(() => {
            setSequencerText("The acid melody adds character and soul");
            setSequencerTextVisible(true);
            
            // Show Next button for acid personalization
            setTimeout(() => {
              setShowNextButton(true);
            }, 2000);
          }, 300);
        }, 500);
      }, 300);
    } else if (progressionStage === 'acid-personal') {
      // Show personal acid message, then transition to AI ready stage
      setProgressionStage('ai-ready');
      setTimeout(() => {
        setSequencerTextVisible(false);
        setTimeout(() => {
          const personalAcidText = getPersonalAcidMessage();
          setSequencerText(personalAcidText);
          setSequencerTextVisible(true);
          
          // After showing personal message, show AI producer message
          setTimeout(() => {
            setSequencerTextVisible(false);
            setTimeout(() => {
              setSequencerText("Ok we've got the basics down. Let's send this to our AI producer");
              setSequencerTextVisible(true);
              
              // Show Next button for AI producer step
              setTimeout(() => {
                setShowNextButton(true);
              }, 1000);
            }, 300);
          }, 3000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'ai-ready') {
      // User clicked Next to send to AI producer
      sendToAIProducer();
    }
  }, [progressionStage, generateKickPattern, getPersonalKickMessage, generateSnarePattern, getPersonalSnareMessage, generateBassPattern, getPersonalBassMessage, getPersonalAcidMessage, userSnapshot, address, exportSongData, sendToAIProducer]);

  const animateSquareTransition = useCallback(() => {
    console.log("Animation triggered - simple transition");

    // Hide flash text and bottom text immediately
    setShowFlashText(null);
    setBottomTextVisible(false);

    // Start transition state
    setIsTransitioning(true);

    // After 300ms, show the sequencer and start text sequence
    setTimeout(() => {
      setShowSequencer(true);

      // ALWAYS start with basic pattern first
      const basicPattern = [0, 4, 8, 12];
      updateSongData(current => ({
        ...current,
        tracks: {
          ...current.tracks,
          kick: {
            ...current.tracks.kick,
            pattern: basicPattern
          }
        }
      }));
      if (audioEngineRef.current) {
        audioEngineRef.current.setKickPattern(basicPattern);
      }

      // Start sequencer text sequence
      setTimeout(() => {
        setSequencerText("The kick drum is the heartbeat of techno");
        setSequencerTextVisible(true);
        // Show Next button after educational text appears
        setTimeout(() => {
          setShowNextButton(true);
        }, 1000);
      }, 500); // 500ms after sequencer appears

    }, 300);
  }, [getPersonalKickMessage, userSnapshot, generateKickPattern]);

  const handleStepChange = useCallback(
    (step: number) => {
      setCurrentStep(step);

      // Only count quarter note beats (every 4 steps) for the animation timing
      if (step % 4 === 0) {
        beatCountRef.current += 1;

        const beatCount = beatCountRef.current;

        // Flash "base" and "drum" on first two beats
        if (beatCount <= FLASH_TEXTS.length) {
          const flashText = FLASH_TEXTS[beatCount - 1];
          setShowFlashText(flashText);
          setTimeout(() => setShowFlashText(null), FLASH_TEXT_DURATION);
        }

        // Show bottom text sequence
        if (beatCount === 5) {
          setBottomText("Every account has a beat");
          setBottomTextVisible(true);
        } else if (beatCount === 9) {
          setBottomTextVisible(false);
          setTimeout(() => {
            setBottomText("Let's create yours");
            setBottomTextVisible(true);
          }, 300);
        } else if (beatCount === 13) {
          setBottomTextVisible(false);
          // Immediate transition after "Let's create yours" fades out
          console.log("Automatic transition triggered at beat 13");

          // DON'T stop audio - keep the beat going!
          // Just trigger the visual transition
          animateSquareTransition();
        }
      }
    },
    [animateSquareTransition],
  );

  const getSquareStyle = useCallback((): SquareStyle => {
    const baseScale = 1;

    if (beatIntensity > 0) {
      const pulseScale =
        baseScale * (1 + beatIntensity * BEAT_INTENSITY_SCALE_FACTOR);
      const brightness = 1 + beatIntensity * BEAT_INTENSITY_BRIGHTNESS_FACTOR;
      const shadowIntensity = beatIntensity * BEAT_INTENSITY_SHADOW_FACTOR;
      const glowOpacity = beatIntensity * BEAT_INTENSITY_GLOW_OPACITY;

      return {
        transform: `scale(${pulseScale})`,
        filter: `brightness(${brightness})`,
        boxShadow: `0 0 ${shadowIntensity}px rgba(59, 130, 246, ${glowOpacity})`,
        transition:
          "transform 0.1s ease-out, filter 0.1s ease-out, box-shadow 0.1s ease-out",
      };
    }

    return {
      transform: `scale(${baseScale})`,
      filter: "brightness(1)",
      boxShadow: "0 0 0px rgba(59, 130, 246, 0)",
      transition:
        "transform 0.2s ease-out, filter 0.2s ease-out, box-shadow 0.2s ease-out",
    };
  }, [beatIntensity]);

  const handleSquareClick = useCallback(async () => {
    console.log("handleSquareClick called");
    console.log("showSequencer:", showSequencer);

    try {
      // If already showing sequencer, do nothing
      if (showSequencer) {
        console.log("Already showing sequencer, returning");
        return;
      }

      console.log("Normal audio initialization flow");

      if (!audioEngineRef.current) {
        audioEngineRef.current = new SimpleAudioEngine();
        await audioEngineRef.current.initialize(
          handleStepChange,
          setBeatIntensity,
        );
        // Always start with basic pattern, ignore state
        const basicKickPattern = [0, 4, 8, 12];
        audioEngineRef.current.setKickPattern(basicKickPattern);
        beatCountRef.current = 0;
      }

      await audioEngineRef.current.play();
    } catch (error) {
      console.error("Failed to start audio:", error);
    }
  }, [handleStepChange, showSequencer]);

  return (
    <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <style jsx>{`
        @keyframes flash-in {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>

      <header className="flex justify-between items-center p-6 h-11 flex-shrink-0 relative z-20">
        {isConnected && (
          <Wallet className="z-10">
            <ConnectWallet>
              <Name className="text-inherit" />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
                <EthBalance />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        )}
      </header>

      <div className="flex-1 flex items-center justify-center relative z-10">
        {!isConnected ? (
          <Wallet className="z-10">
            <ConnectWallet className="bg-[var(--app-accent)] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-opacity-80 transition-colors min-w-48">
              Connect Wallet
            </ConnectWallet>
          </Wallet>
        ) : (
          <>
            {showSequencer ? (
              <>
                {/* Title */}
                <div className="absolute top-24 left-0 right-0 flex justify-center z-20">
                  <h1 className={`text-3xl font-bold font-[var(--font-orbitron)] tracking-wide ${
                    showAcidTrack ? 'text-[#fea8cd]' : showBassTrack ? 'text-[#b6f569]' : showSnareTrack ? 'text-[#ffd12f]' : 'text-blue-600'
                  }`}>
                    {showAcidTrack ? 'Your wallet\'s melody' : showBassTrack ? 'Finally, let\'s add bass' : showSnareTrack ? 'Now let\'s add a snare' : 'It starts with a kick'}
                  </h1>
                </div>

                {/* Sequencer Text */}
                <div className="absolute bottom-32 left-0 right-0 flex justify-center z-20 px-8">
                  <div
                    className={`text-white text-lg font-bold font-[var(--font-orbitron)] tracking-wide text-center transition-opacity duration-300 ${
                      sequencerTextVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      textShadow:
                        "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                      textWrap: "balance",
                    }}
                  >
                    {sequencerText}
                  </div>
                </div>

                {/* Sequencer */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  {isLoadingData ? (
                    <div className="text-white text-lg font-[var(--font-orbitron)]">
                      Analyzing your onchain activity...
                    </div>
                  ) : (
                    <DrumSequencer
                      currentStep={currentStep}
                      songData={songData}
                      showSnareTrack={showSnareTrack}
                      showBassTrack={showBassTrack}
                      showAcidTrack={showAcidTrack}
                    />
                  )}

                  {/* Next Button */}
                  {showNextButton && progressionStage !== 'complete' && progressionStage !== 'ai-processing' && (
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                      <button
                        onClick={handleNextClick}
                        className="w-full bg-blue-600 text-white font-bold py-4 hover:bg-blue-700 transition-all duration-200 font-[var(--font-orbitron)] text-lg tracking-wide shadow-lg"
                        style={{
                          boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        {progressionStage === 'ai-ready' ? 'Send to AI Producer' : 'Next'}
                      </button>
                    </div>
                  )}

                  {/* AI Processing Spinner */}
                  {isAIProcessing && (
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                      <div className="w-full bg-blue-600 text-white font-bold py-4 font-[var(--font-orbitron)] text-lg tracking-wide shadow-lg flex items-center justify-center"
                           style={{
                             boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                           }}>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Processing...
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div
                    className={`transition-transform duration-300 ease-in-out ${
                      isTransitioning ? "scale-[0.1]" : "scale-100"
                    }`}
                  >
                    <PulsatingSquare
                      style={getSquareStyle()}
                      onClick={handleSquareClick}
                      flashText={showFlashText}
                      squareRef={squareRef}
                    />
                  </div>
                </div>

                {/* Bottom text */}
                <div className="absolute bottom-16 left-0 right-0 flex justify-center z-10 px-8">
                  <div
                    className={`text-white text-lg font-bold font-[var(--font-orbitron)] tracking-wide text-center transition-opacity duration-300 ${
                      bottomTextVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      textShadow:
                        "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                      textWrap: "balance",
                    }}
                  >
                    {bottomText}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
