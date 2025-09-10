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
import { SongData, TrackData, validateSongData } from "@/lib/songSchema";
import { MintSongButtonTransaction } from "@/app/components/MintSongButtonTransaction";

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
            className="text-white font-black text-6xl tracking-wide font-orbitron"
            style={{
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
  showLeadTrack,
}: {
  currentStep: number;
  songData: SongData;
  showSnareTrack?: boolean;
  showBassTrack?: boolean;
  showAcidTrack?: boolean;
  showLeadTrack?: boolean;
}) {
  const steps = Array.from({ length: 16 }, (_, i) => i);
  
  // Extract patterns from songData
  const kickPattern = songData.tracks.kick?.pattern || [];
  const snarePattern = songData.tracks.snare?.pattern || [];
  const bassPattern = songData.tracks.bass?.pattern || [];
  const acidPattern = songData.tracks.acid?.pattern || [];
  const acidNotes = songData.tracks.acid?.notes || [];
  const leadPattern = songData.tracks.lead?.pattern || [];
  const leadNotes = songData.tracks.lead?.notes || [];

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

      {/* Lead track */}
      {showLeadTrack && leadPattern && (
        <div
          className="flex gap-1 justify-center"
          style={{ gap: "min(0.5rem, calc((100vw - 160px) / 32))" }}
        >
          {steps.map((step) => {
            const hasLead = leadPattern.includes(step) && leadNotes[step];
            const isCurrentStep = step === currentStep % 16;

            return (
              <div
                key={step}
                className={`rounded-[5%] cursor-pointer transition-all opacity-0 animate-fade-in ${
                  hasLead
                    ? "hover:brightness-110"
                    : "hover:bg-opacity-30"
                } ${isCurrentStep ? "ring-2 ring-white" : ""}`}
                style={{
                  animationDelay: `${step * 50}ms`,
                  animationFillMode: "forwards",
                  width: "min(2rem, calc((100vw - 2rem) / 20))",
                  height: "min(2rem, calc((100vw - 2rem) / 20))",
                  flexShrink: 0,
                  backgroundColor: hasLead ? "#fc401f" : "rgba(252, 64, 31, 0.2)",
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
        },
        lead: {
          pattern: [],
          notes: [],
          muted: true, // Start muted
          volume: -12
        }
      }
    };
  });
  
  // UI progression state
  const [showSnareTrack, setShowSnareTrack] = useState(false);
  const [showBassTrack, setShowBassTrack] = useState(false);
  const [showAcidTrack, setShowAcidTrack] = useState(false);
  const [showLeadTrack, setShowLeadTrack] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  
  // Progression state - tracks which stage we're at
  const [progressionStage, setProgressionStage] = useState<'kick-educational' | 'kick-personal' | 'snare-educational' | 'snare-personal' | 'bass-educational' | 'bass-personal' | 'acid-educational' | 'acid-personal' | 'lead-educational' | 'lead-personal' | 'complete' | 'ai-processing' | 'ai-ready'>('kick-educational');
  
  // AI processing state
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isPlayingAIVersion, setIsPlayingAIVersion] = useState(false);
  
  // Mint state
  const [showMintButton, setShowMintButton] = useState(false);
  const [mintResult, setMintResult] = useState<{ tokenId: string; shareableURL: string; transactionURL: string } | null>(null);
  
  // Avatar analysis modal state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarAnalysisStage, setAvatarAnalysisStage] = useState<'original' | 'quantizing' | 'analyzing' | 'complete'>('original');

  // Demo mode toggle - determines whether to use Jesse's demo address or user's actual address
  const [isJesse, setIsJesse] = useState(false); // Default to demo mode

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

  // Download song data as JSON file
  const handleDownloadJson = useCallback(() => {
    const jsonString = exportSongData();
    if (!jsonString) {
      console.error('Failed to export song data for download');
      return;
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${songData.metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📥 Song JSON downloaded:', link.download);
  }, [exportSongData, songData.metadata.title]);

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
  }, [isConnected, address, userSnapshot, isLoadingData]);

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

  const generateClapPattern = useCallback(
    (ethPrice: number): number[] => {
      if (ethPrice < 2000) {
        return [4, 12]; // Standard clap on beats 2 and 4 - bear market
      } else if (ethPrice <= 3000) {
        return [4, 12, 14]; // Add anticipation - recovery
      } else if (ethPrice <= 4000) {
        return [4, 6, 12]; // Add syncopation - bull market
      } else {
        return [2, 4, 6, 12, 14]; // Complex rhythm - moon time
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

  const fetchUserData = async () => {
    if (!address) return;

    setIsLoadingData(true);
    try {
      console.log("Fetching user data for personalized track generation...");

      // Use demo address or actual user address based on isJesse flag
      const demoAddress = "0x2211d1D0020DAEA8039E46Cf1367962070d77DA9";
      const addressToUse = isJesse ? demoAddress : address;
      
      console.log('🎛️ Demo mode settings:');
      console.log('  isJesse flag:', isJesse);
      console.log('  Demo address:', demoAddress);
      console.log('  Connected address:', address);
      console.log('  Address being used:', addressToUse);
      
      const snapshot = await dataFetcher.fetchUserSnapshot(context, addressToUse);
      console.log('🔍 Full snapshot for address', addressToUse + ':', JSON.stringify(snapshot, null, 2));
      console.log('🔍 Onchain data specifically:', snapshot.onchain);
      console.log('🔍 Transaction count:', snapshot.onchain.transactionCount);
      console.log('🔍 Token count:', snapshot.onchain.tokenCount);
      console.log('🔍 Wallet balance:', snapshot.wallet.balance);
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
      return "You're keeping the standard clap on beats 2 and 4";
    }
    const ethPrice = userSnapshot.prices.eth || 0;
    
    // Debug logging
    console.log('Generating clap message with ETH price:', {
      ethPrice,
      pricesData: userSnapshot.prices,
    });
    
    if (ethPrice < 2000) {
      return `Because RedStone says ETH is at $${ethPrice.toFixed(0)} (bear market), you get the standard clap pattern`;
    } else if (ethPrice <= 3000) {
      return `Because RedStone says ETH is at $${ethPrice.toFixed(0)} (recovery mode), you get an anticipation clap pattern!`;
    } else if (ethPrice <= 4000) {
      return `Because RedStone says ETH is at $${ethPrice.toFixed(0)} (bull market), you get syncopated clap patterns!`;
    } else {
      return `Because RedStone says ETH is at $${ethPrice.toFixed(0)} (moon time), you get complex euphoric clap rhythms!`;
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
    // Use demo address or actual user address based on isJesse flag
    const demoAddress = "0x2211d1D0020DAEA8039E46Cf1367962070d77DA9";
    const addressToUse = isJesse ? demoAddress : (address || demoAddress);
    const shortAddress = `${addressToUse.slice(0, 6)}...${addressToUse.slice(-4)}`;
    const hexSection = addressToUse.slice(2, 18); // First 16 hex chars after 0x
    return `We've used your unique wallet address ${shortAddress} to map each hex character (${hexSection}) to a minor scale, with D/E/F creating musical rests.`;
  }, [address, isJesse]);
  
  // Avatar analysis functions
  const analyzeAvatarColors = useCallback(async (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }
        
        // Set canvas to 8x8 for quantization
        canvas.width = 8;
        canvas.height = 8;
        
        // Draw the image scaled to 8x8
        ctx.drawImage(img, 0, 0, 8, 8);
        
        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, 8, 8);
        const data = imageData.data;
        
        // Convert each pixel to a hex color
        const colors: string[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colors.push(hex);
        }
        
        resolve(colors);
      };
      img.src = imageUrl;
    });
  }, []);
  
  const colorToNote = useCallback((color: string): string | null => {
    // Convert hex color to hue, saturation, and brightness
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const brightness = max;
    const saturation = max === 0 ? 0 : delta / max;
    
    // LESS IS MORE: Only generate notes for colors with sufficient brightness and saturation
    // This creates more musical spacing and prevents muddy harmonies
    if (brightness < 0.3 || saturation < 0.2) {
      return null; // Return null for dull/dark colors - creates musical rests
    }
    
    let hue = 0;
    if (delta !== 0) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
    
    // Map to D minor pentatonic to match the bass (D, F, G) and acid (C minor pentatonic)
    // D minor pentatonic: D, F, G, A, C - harmonically compatible with both bass and acid
    // Using octave 3 to sit nicely between bass (octave 1) and acid (octaves 2-4)
    const dMinorPentatonicNotes = ['D3', 'F3', 'G3', 'A3', 'C4'];
    const noteIndex = Math.floor((hue / 360) * dMinorPentatonicNotes.length);
    return dMinorPentatonicNotes[noteIndex];
  }, []);
  
  const startAvatarAnalysis = useCallback(async () => {
    setShowAvatarModal(true);
    setAvatarAnalysisStage('original');
    
    // After 2 seconds, start quantizing
    setTimeout(() => {
      setAvatarAnalysisStage('quantizing');
      
      // After 2 seconds, start analyzing
      setTimeout(async () => {
        setAvatarAnalysisStage('analyzing');
        
        // Analyze the avatar colors
        const colors = await analyzeAvatarColors('/jesse.png');
        const notes = colors.map(colorToNote);
        
        // Create lead pattern from avatar analysis - LESS IS MORE approach
        const avatarLeadPattern: number[] = [];
        const avatarLeadNotes = new Array(16).fill("");
        
        // Filter out null notes and create more musical spacing
        const validNotes = notes.filter(note => note !== null);
        
        if (validNotes.length === 0) {
          // If no valid notes, create a simple, minimal pattern using D and G (matching bass key)
          avatarLeadPattern.push(0, 8);
          avatarLeadNotes[0] = "D3";
          avatarLeadNotes[8] = "G3";
        } else {
          // LESS IS MORE: Use only 2-4 notes maximum for a sparse, musical lead
          // Focus on key strong beats for maximum musical impact
          const musicalPositions = [0, 8, 4, 12]; // Priority order: downbeat, halfway, then quarters
          
          // Take only the first 3-4 valid notes maximum
          const notesToUse = validNotes.slice(0, Math.min(3, validNotes.length));
          
          // Place notes only on the most important beats
          for (let i = 0; i < notesToUse.length; i++) {
            const position = musicalPositions[i];
            avatarLeadPattern.push(position);
            avatarLeadNotes[position] = notesToUse[i];
          }
          
          // Sort pattern array to be in chronological order
          avatarLeadPattern.sort((a, b) => a - b);
        }
        
        // Update song data with avatar-generated pattern
        updateSongData(current => ({
          ...current,
          tracks: {
            ...current.tracks,
            lead: {
              ...current.tracks.lead,
              pattern: avatarLeadPattern,
              notes: avatarLeadNotes,
            }
          }
        }));
        
        // Update audio engine
        if (audioEngineRef.current) {
          const leadMelodyData = avatarLeadPattern.map(step => ({
            step,
            notes: avatarLeadNotes[step] ? [avatarLeadNotes[step]] : []
          }));
          audioEngineRef.current.setLeadPattern(leadMelodyData);
          audioEngineRef.current.setLeadMuted(false); // Unmute the lead track
          
          console.log('🎵 Avatar lead pattern generated:', {
            totalColors: colors.length,
            validNotes: validNotes.length,
            finalPattern: leadMelodyData,
            musicalSpacing: 'Strong beats prioritized for musical results'
          });
        }
        
        setTimeout(() => {
          setAvatarAnalysisStage('complete');
          
          // Close modal after showing complete stage
          setTimeout(() => {
            setShowAvatarModal(false);
          }, 2000);
        }, 2000);
      }, 2000);
    }, 2000);
  }, [analyzeAvatarColors, colorToNote, updateSongData]);

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
      console.log('AI-enhanced song received:', {
        title: validatedImprovedSong.metadata.title,
        bars: validatedImprovedSong.metadata.bars,
        steps: validatedImprovedSong.metadata.steps,
        trackNames: Object.keys(validatedImprovedSong.tracks),
        kickPatternLength: validatedImprovedSong.tracks.kick?.pattern.length,
        bassPatternLength: validatedImprovedSong.tracks.bass?.pattern.length
      });
      setSongData(validatedImprovedSong);
      
      // Update audio engine with improved patterns
      if (audioEngineRef.current) {
        console.log('Loading AI-enhanced track with', validatedImprovedSong.metadata.steps, 'steps');
        
        // Set sequence length for the new track
        audioEngineRef.current.setSequenceLength(validatedImprovedSong.metadata.steps);
        
        // Unmute all tracks for full arrangement
        audioEngineRef.current.unmuteAllTracks();
        
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
      setIsPlayingAIVersion(true); // Hide sequencer for full track playback
      setProgressionStage('complete');
      setSequencerTextVisible(false);
      setTimeout(() => {
        setSequencerText(`🎵 Your track has been expanded to a full ${validatedImprovedSong.metadata.bars}-bar techno journey! Playing the complete arrangement with buildups and drops. Ready to mint? 🎵`);
        setSequencerTextVisible(true);
        
        // Show mint button after a delay
        setTimeout(() => {
          setShowMintButton(true);
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

  const handleMintSuccess = useCallback((tokenId: string) => {
    console.log('🎉 Song minted successfully!', tokenId);
    const result = {
      tokenId: tokenId,
      shareableURL: `https://base.org/app/basedrum?play=${tokenId}`,
      transactionURL: `https://sepolia.basescan.org/token/0x20585aCAD03AC611BeE6Ed70E6EF6D0E9A5AD18c?a=${tokenId}`
    };
    setMintResult(result);
    setShowMintButton(false);
    
    // Update sequencer text to show success
    setSequencerTextVisible(false);
    setTimeout(() => {
      setSequencerText(`🎉 Your song is now minted as NFT #${tokenId}! Share it with the world.`);
      setSequencerTextVisible(true);
    }, 300);
  }, []);

  const handleMintError = useCallback((error: string) => {
    console.error('❌ Mint failed:', error);
    // Show error in sequencer text
    setSequencerTextVisible(false);
    setTimeout(() => {
      setSequencerText(`❌ Minting failed: ${error}. Please try again.`);
      setSequencerTextVisible(true);
    }, 300);
  }, []);

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
          
          // Upgrade clap pattern based on ETH price - market sentiment drives rhythm
          const basicClapPattern = [4, 12]; // Basic clap
          const ethPrice = userSnapshot?.prices.eth || 0;
          const personalizedClapPattern = generateClapPattern(ethPrice);
          
          // Only upgrade if it's different from basic
          if (JSON.stringify(personalizedClapPattern) !== JSON.stringify(basicClapPattern)) {
            setTimeout(() => {
              updateSongData(current => ({
                ...current,
                tracks: {
                  ...current.tracks,
                  snare: {
                    ...current.tracks.snare,
                    pattern: personalizedClapPattern
                  }
                }
              }));
              audioEngineRef.current?.setSnarePattern(personalizedClapPattern);
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
          // Use demo address or actual user address based on isJesse flag
          const demoAddress = "0x2211d1D0020DAEA8039E46Cf1367962070d77DA9";
          const addressToUse = isJesse ? demoAddress : address;
          console.log('Generating acid melody from wallet address:', addressToUse);
          const generatedMelody = audioEngineRef.current.generateAcidMelodyFromWallet(addressToUse);
          
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
      // Show personal acid message, then transition to lead track
      setProgressionStage('lead-educational');
      setTimeout(() => {
        setSequencerTextVisible(false);
        setTimeout(() => {
          const personalAcidText = getPersonalAcidMessage();
          setSequencerText(personalAcidText);
          setSequencerTextVisible(true);
          
          // Show Next button for lead progression
          setTimeout(() => {
            setShowNextButton(true);
          }, 3000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'lead-educational') {
      // Start avatar analysis FIRST - before showing any lead track UI
      setProgressionStage('lead-personal');
      setTimeout(() => {
        // 1. Show educational text about the lead track
        setSequencerTextVisible(false);
        setTimeout(() => {
          setSequencerText("The lead adds harmony and emotional depth. Let's create yours from your avatar...");
          setSequencerTextVisible(true);
          
          // 2. Start avatar analysis modal after 2 seconds
          setTimeout(async () => {
            await startAvatarAnalysis();
            
            // 3. After modal completes (8 seconds), THEN show the visual and audio result
            setTimeout(() => {
              // Show the lead track visualization
              setShowLeadTrack(true);
              
              // Update sequencer text to show the result
              setSequencerTextVisible(false);
              setTimeout(() => {
                setSequencerText("🎵 Your avatar's colors have been mapped to musical harmony! 🎵");
                setSequencerTextVisible(true);
                
                // Show Next button for completion
                setTimeout(() => {
                  setShowNextButton(true);
                }, 2000);
              }, 300);
            }, 8000); // Wait for full avatar analysis (8 seconds)
          }, 2000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'lead-personal') {
      // Lead track completion - transition to complete
      setProgressionStage('complete');
      setTimeout(() => {
        setSequencerTextVisible(false);
        setTimeout(() => {
          setSequencerText("🎵 Your personalized techno track is complete! Ready to mint as an NFT? 🎵");
          setSequencerTextVisible(true);
          
          // Show mint button
          setTimeout(() => {
            setShowMintButton(true);
          }, 1000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'ai-ready') {
      // User clicked Next to send to AI producer
      sendToAIProducer();
    }
  }, [progressionStage, generateKickPattern, getPersonalKickMessage, generateClapPattern, getPersonalSnareMessage, generateBassPattern, getPersonalBassMessage, getPersonalAcidMessage, userSnapshot, address, exportSongData, sendToAIProducer]);

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
        setSequencerText("The kick drum is the heartbeat of our track");
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
    console.log("isTransitioning:", isTransitioning);

    try {
      // Prevent clicks if already showing sequencer or transitioning
      if (showSequencer || isTransitioning) {
        console.log("Sequencer already active or transitioning, ignoring click");
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
  }, [handleStepChange, showSequencer, isTransitioning]);

  return (
    <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden font-exo">
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

        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-scan {
          animation: scan 2s linear infinite;
        }

        .slow-spin {
          animation: spin 8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
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

        {/* Download button - only shows when track is complete */}
        {(progressionStage === 'complete' || isPlayingAIVersion) && (
          <button
            onClick={handleDownloadJson}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-orbitron text-sm transition-colors flex items-center gap-2 z-10"
            title="Download song data as JSON"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              <path d="M12,19L8,15H10.5V12H13.5V15H16L12,19Z" />
            </svg>
            Download JSON
          </button>
        )}
      </header>

      <div className="flex-1 flex items-center justify-center relative z-10">
        {!isConnected ? (
          <Wallet className="z-10">
            <ConnectWallet className="bg-[var(--app-accent)] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-opacity-80 transition-colors min-w-48 font-orbitron">
              Connect Wallet
            </ConnectWallet>
          </Wallet>
        ) : (
          <>
            {showSequencer ? (
              <>
                {/* Title */}
                <div className="absolute top-24 left-0 right-0 flex justify-center z-20">
                  <h1 className={`text-3xl font-bold font-orbitron tracking-wide ${
                    isPlayingAIVersion ? 'text-green-400' : showLeadTrack ? 'text-[#fc401f]' : showAcidTrack ? 'text-[#fea8cd]' : showBassTrack ? 'text-[#b6f569]' : showSnareTrack ? 'text-[#ffd12f]' : 'text-blue-600'
                  }`}>
                    {isPlayingAIVersion ? 'Your Complete Techno Track' : showLeadTrack ? 'Your avatar\'s harmony' : showAcidTrack ? 'Your wallet\'s melody' : showBassTrack ? 'Finally, let\'s add bass' : showSnareTrack ? 'Now let\'s add a snare' : 'It starts with a kick'}
                  </h1>
                </div>

                {/* Sequencer Text */}
                <div className="absolute bottom-32 left-0 right-0 flex justify-center z-20 px-8">
                  <div
                    className={`text-white text-lg font-bold font-orbitron tracking-wide text-center transition-opacity duration-300 ${
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
                    <div className="text-white text-lg font-orbitron">
                      Analyzing your onchain activity...
                    </div>
                  ) : isPlayingAIVersion ? (
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎵</div>
                      <div className="text-xl text-gray-300 font-orbitron">Playing full 32-bar arrangement</div>
                      <div className="text-sm text-gray-500 mt-2 font-exo">Listen to your complete techno journey</div>
                    </div>
                  ) : (
                    <DrumSequencer
                      currentStep={currentStep}
                      songData={songData}
                      showSnareTrack={showSnareTrack}
                      showBassTrack={showBassTrack}
                      showAcidTrack={showAcidTrack}
                      showLeadTrack={showLeadTrack}
                    />
                  )}

                  {/* Next Button */}
                  {showNextButton && progressionStage !== 'complete' && progressionStage !== 'ai-processing' && (
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                      <button
                        onClick={handleNextClick}
                        className="w-full bg-blue-600 text-white font-bold py-4 hover:bg-blue-700 transition-all duration-200 font-orbitron text-lg tracking-wide shadow-lg"
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
                      <div className="w-full bg-blue-600 text-white font-bold py-4 font-orbitron text-lg tracking-wide shadow-lg flex items-center justify-center"
                           style={{
                             boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                           }}>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Processing...
                      </div>
                    </div>
                  )}

                  {/* Mint Button */}
                  {showMintButton && progressionStage === 'complete' && (
                    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4">
                      <MintSongButtonTransaction
                        songData={songData}
                        creatorFid={userSnapshot?.farcaster.fid || 0}
                        onSuccess={handleMintSuccess}
                        onError={handleMintError}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Mint Result - Show share links */}
                  {mintResult && (
                    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4">
                      <div className="bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-center font-orbitron">
                        <p className="mb-2">🎉 NFT #{mintResult.tokenId} Minted!</p>
                        <div className="flex gap-4 justify-center">
                          <a 
                            href={mintResult.shareableURL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-orbitron"
                          >
                            🎵 Share Song
                          </a>
                          <a 
                            href={mintResult.transactionURL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-orbitron"
                          >
                            📄 View Transaction
                          </a>
                        </div>
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
                    className={`text-white text-lg font-bold font-orbitron tracking-wide text-center transition-opacity duration-300 ${
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
      
      {/* Avatar Analysis Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-purple-500/20 shadow-2xl animate-fade-in"
               style={{
                 boxShadow: '0 0 100px rgba(168, 85, 247, 0.2), 0 0 50px rgba(59, 130, 246, 0.1)',
                 animation: 'fadeIn 0.3s ease-out, pulse 4s ease-in-out infinite'
               }}>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 font-orbitron tracking-wider">
              Avatar → Melody
            </h2>
            
            {avatarAnalysisStage === 'original' && (
              <div className="space-y-4">
                <div className="text-gray-300 text-lg font-exo animate-pulse">
                  Scanning your avatar...
                </div>
                <div className="relative mx-auto w-48 h-48">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl animate-spin slow-spin opacity-20 blur-xl"></div>
                  <img 
                    src="/jesse.png" 
                    alt="Avatar" 
                    className="relative w-48 h-48 mx-auto rounded-xl border-2 border-white/20 shadow-2xl"
                    style={{
                      filter: 'contrast(1.1) saturate(1.2)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 60px rgba(59, 130, 246, 0.3)'
                    }}
                  />
                  {/* Scanning beam effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan opacity-60"></div>
                  </div>
                </div>
              </div>
            )}
            
            {avatarAnalysisStage === 'quantizing' && (
              <div className="space-y-4">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-lg font-bold">
                  Pixelating reality → 8×8 matrix
                </div>
                <div className="relative w-48 h-48 mx-auto">
                  {/* Glowing border effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 animate-pulse"></div>
                  
                  {/* Avatar image as background */}
                  <img 
                    src="/jesse.png" 
                    alt="Avatar" 
                    className="absolute inset-0 w-full h-full rounded-xl z-0"
                    style={{ filter: 'brightness(0.7)' }}
                  />
                  
                  {/* Overlay grid with glitch effect */}
                  <div className="absolute inset-0 grid grid-cols-8 gap-0 rounded-xl overflow-hidden z-10">
                    {Array.from({ length: 64 }).map((_, i) => {
                      const row = Math.floor(i / 8);
                      const col = i % 8;
                      // Diagonal wave pattern
                      const delay = (row + col) * 30;
                      const isEven = (row + col) % 2 === 0;
                      
                      return (
                        <div 
                          key={i}
                          className={`border ${isEven ? 'border-cyan-400/40' : 'border-purple-400/40'} backdrop-blur-md animate-fade-in hover:scale-110 transition-transform`}
                          style={{ 
                            animationDelay: `${delay}ms`,
                            animationFillMode: 'backwards',
                            background: `linear-gradient(135deg, rgba(59, 130, 246, ${0.2 + Math.random() * 0.2}) 0%, rgba(168, 85, 247, ${0.2 + Math.random() * 0.2}) 100%)`,
                            aspectRatio: '1',
                            boxShadow: 'inset 0 0 10px rgba(255,255,255,0.1)'
                          }}
                        >
                          <div className="w-full h-full opacity-0 hover:opacity-100 bg-white/10 transition-opacity"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-xs text-gray-500 animate-pulse">
                  ▓▓▓░░░ Processing pixels ░░░▓▓▓
                </div>
              </div>
            )}
            
            {avatarAnalysisStage === 'analyzing' && (
              <div className="space-y-4">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 text-lg font-bold animate-pulse">
                  🎵 Extracting harmonic essence 🎵
                </div>
                <div className="text-xs text-gray-400 mb-2 font-mono">
                  <span className="text-green-400">▸</span> FILTER: brightness {'>'} 30% && saturation {'>'} 20%
                </div>
                <div className="relative w-48 h-48 mx-auto">
                  {/* Rotating glow effect behind */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl blur-md opacity-40 animate-spin slow-spin"></div>
                  
                  {/* Keep avatar visible but dimmed */}
                  <img 
                    src="/jesse.png" 
                    alt="Avatar" 
                    className="absolute inset-0 w-full h-full rounded-xl opacity-20 z-0"
                    style={{ filter: 'blur(2px)' }}
                  />
                  
                  {/* Quantized color overlay with musical indicators */}
                  <div className="absolute inset-0 grid grid-cols-8 gap-0 rounded-xl overflow-hidden z-10">
                    {Array.from({ length: 64 }).map((_, i) => {
                      const hue = (i * 137.5) % 360;
                      const brightness = 0.2 + (i % 3) * 0.3;
                      const saturation = 0.1 + (i % 4) * 0.3;
                      const isMusical = brightness > 0.3 && saturation > 0.2;
                      const color = `hsl(${hue}, ${saturation * 100}%, ${brightness * 100}%)`;
                      
                      // Radial wave from center
                      const row = Math.floor(i / 8);
                      const col = i % 8;
                      const centerDist = Math.sqrt(Math.pow(row - 3.5, 2) + Math.pow(col - 3.5, 2));
                      const delay = centerDist * 80;
                      
                      return (
                        <div 
                          key={i}
                          className={`relative flex items-center justify-center text-xs font-bold animate-fade-in ${
                            isMusical ? 'scale-100' : 'scale-75'
                          }`}
                          style={{ 
                            animationDelay: `${delay}ms`,
                            animationFillMode: 'backwards',
                            aspectRatio: '1',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isMusical ? (
                            <>
                              <div className="absolute inset-0 rounded-lg" 
                                   style={{ 
                                     backgroundColor: color,
                                     boxShadow: `0 0 20px ${color}, inset 0 0 10px rgba(255,255,255,0.3)`,
                                     transform: 'scale(0.9)'
                                   }}>
                              </div>
                              <span className="relative text-white font-black text-lg animate-bounce z-20" 
                                    style={{ 
                                      animationDelay: `${delay + 200}ms`,
                                      textShadow: '0 0 10px rgba(255,255,255,0.8)'
                                    }}>
                                ♪
                              </span>
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gray-800/20 rounded backdrop-blur-sm"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded font-mono">
                    PASS: {Array.from({ length: 64 }).filter((_, i) => {
                      const brightness = 0.2 + (i % 3) * 0.3;
                      const saturation = 0.1 + (i % 4) * 0.3;
                      return brightness > 0.3 && saturation > 0.2;
                    }).length} colors
                  </span>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded font-mono">
                    SKIP: {64 - Array.from({ length: 64 }).filter((_, i) => {
                      const brightness = 0.2 + (i % 3) * 0.3;
                      const saturation = 0.1 + (i % 4) * 0.3;
                      return brightness > 0.3 && saturation > 0.2;
                    }).length} colors
                  </span>
                </div>
              </div>
            )}
            
            {avatarAnalysisStage === 'complete' && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg blur opacity-40 animate-pulse"></div>
                  <div className="relative bg-black/50 rounded-lg p-4 border border-green-400/50">
                    <div className="text-green-400 text-2xl font-black mb-2 flex items-center justify-center gap-2">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>✨</span>
                      <span>SUCCESS</span>
                      <span className="animate-bounce" style={{ animationDelay: '200ms' }}>✨</span>
                    </div>
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 font-bold">
                      Avatar melody extracted!
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-purple-500/20 rounded p-2 border border-purple-400/30">
                    <div className="text-purple-400 font-mono">SCALE</div>
                    <div className="text-white font-bold">D minor</div>
                  </div>
                  <div className="bg-blue-500/20 rounded p-2 border border-blue-400/30">
                    <div className="text-blue-400 font-mono">NOTES</div>
                    <div className="text-white font-bold">≤ 3</div>
                  </div>
                  <div className="bg-pink-500/20 rounded p-2 border border-pink-400/30">
                    <div className="text-pink-400 font-mono">VIBE</div>
                    <div className="text-white font-bold">Minimal</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
