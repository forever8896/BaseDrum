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
import { TrackData } from "@/lib/songSchema-new";

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
}: PulsatingSquareProps & { squareRef?: React.RefObject<HTMLDivElement> }) {
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
  kickPattern,
  clapPattern,
  showClapTrack,
}: {
  currentStep: number;
  kickPattern: number[];
  clapPattern?: number[];
  showClapTrack?: boolean;
}) {
  const steps = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 gap-2">
      {/* Kick track */}
      <div
        className="flex gap-1 w-full max-w-full"
        style={{ gap: "min(0.5rem, calc((100vw - 2rem) / 32))" }}
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

      {/* Clap track */}
      {showClapTrack && clapPattern && (
        <div
          className="flex gap-1 w-full max-w-full"
          style={{ gap: "min(0.5rem, calc((100vw - 2rem) / 32))" }}
        >
          {steps.map((step) => {
            const hasClap = clapPattern.includes(step);
            const isCurrentStep = step === currentStep % 16;

            return (
              <div
                key={step}
                className={`rounded-[5%] cursor-pointer transition-all opacity-0 animate-fade-in ${
                  hasClap
                    ? "hover:brightness-110"
                    : "hover:bg-opacity-30"
                } ${isCurrentStep ? "ring-2 ring-white" : ""}`}
                style={{
                  animationDelay: `${step * 50}ms`,
                  animationFillMode: "forwards",
                  width: "min(2rem, calc((100vw - 2rem) / 20))",
                  height: "min(2rem, calc((100vw - 2rem) / 20))",
                  flexShrink: 0,
                  backgroundColor: hasClap ? "#ffd12f" : "rgba(255, 209, 47, 0.2)",
                }}
              />
            );
          })}
        </div>
      )}
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
  const [kickTrackData, setKickTrackData] = useState<TrackData | null>(null);
  const [kickPattern, setKickPattern] = useState<number[]>([0, 4, 8, 12]); // Default pattern
  
  // Clap track state
  const [showClapTrack, setShowClapTrack] = useState(false);
  const [clapPattern, setClapPattern] = useState<number[]>([4, 12]); // Basic clap on beats 2 and 4
  const [showNextButton, setShowNextButton] = useState(false);
  
  // Progression state - tracks which stage we're at
  const [progressionStage, setProgressionStage] = useState<'kick-educational' | 'kick-personal' | 'clap-educational' | 'clap-personal' | 'complete'>('kick-educational');

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
    (followerCount: number): number[] => {
      if (followerCount === 0) {
        return [4, 12]; // Standard clap on beats 2 and 4
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

  const createKickTrackData = useCallback((pattern: number[]): TrackData => {
    return {
      pattern: pattern,
      velocity: new Array(pattern.length).fill(1.0),
      muted: false,
      volume: -6, // Same as defaultSong.json kick volume
    };
  }, []);

  // Mock data for testing heavy user patterns (remove in production)
  const createMockHeavyUserData = (): UserDataSnapshot => ({
    farcaster: {
      fid: 12345,
      username: "techno_dev",
      displayName: "Techno Developer",
      followerCount: 1250,
      followingCount: 500,
      verifications: ["0x1234..."],
    },
    context: {
      entryPoint: "launcher" as const,
      platformType: "desktop" as const,
      added: true,
    },
    wallet: {
      address: address || "0x1234567890123456789012345678901234567890",
      isConnected: true,
      balance: "2.5",
      chainId: 8453,
    },
    onchain: {
      transactionCount: 247, // Heavy user with complex pattern
      firstTransactionDate: new Date("2023-06-15"),
      lastActivityDate: new Date(),
      tokenCount: 15,
      nftCount: 8,
      defiProtocols: ["Uniswap", "Aave", "Compound"],
      userType: "power_user",
      activityLevel: "high",
    },
    prices: {
      eth: 2500,
      btc: 45000,
      fetchedAt: new Date(),
    },
    timestamp: new Date(),
  });

  const fetchUserData = async () => {
    if (!address) return;

    setIsLoadingData(true);
    try {
      console.log("Fetching user data for personalized track generation...");

      // Use mock data for testing (remove in production)
      const snapshot = createMockHeavyUserData();
      // For real data, use: const snapshot = await dataFetcher.fetchUserSnapshot(context, address);
      setUserSnapshot(snapshot);

      // Generate kick pattern based on transaction count
      const txCount = snapshot.onchain.transactionCount || 0;
      const generatedPattern = generateKickPattern(txCount);
      setKickPattern(generatedPattern);

      // Create track data structure
      const trackData = createKickTrackData(generatedPattern);
      setKickTrackData(trackData);

      console.log(
        `Generated kick pattern for ${txCount} transactions:`,
        generatedPattern,
      );

      // Update audio engine with new pattern if initialized
      if (audioEngineRef.current) {
        audioEngineRef.current.setKickPattern(generatedPattern);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Use default pattern on error
      const defaultPattern = [0, 4, 8, 12];
      setKickPattern(defaultPattern);
      setKickTrackData(createKickTrackData(defaultPattern));

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
      return "No onchain transactions found - you're keeping the standard 4/4 kick. Welcome to web3!";
    } else if (txCount <= 25) {
      return `With ${txCount} transactions, we're giving you an extra kick!`;
    } else if (txCount <= 100) {
      return `${txCount} transactions show you're active - upgrading to a double-hit kick pattern!`;
    } else {
      return `${txCount} transactions make you a power user - you get the most complex syncopated kick!`;
    }
  }, [userSnapshot]);

  const getPersonalClapMessage = useCallback((): string => {
    if (!userSnapshot) {
      return "You're keeping the standard clap on beats 2 and 4";
    }
    const followerCount = userSnapshot.farcaster.followerCount || 0;
    if (followerCount === 0) {
      return "You're keeping the standard clap on beats 2 and 4";
    } else if (followerCount <= 50) {
      return `${followerCount} followers give you an anticipation clap!`;
    } else if (followerCount <= 200) {
      return `${followerCount} followers unlock syncopated clap patterns!`;
    } else {
      return `${followerCount} followers make you an influencer - you get complex rhythm claps!`;
    }
  }, [userSnapshot]);

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
              setKickPattern(personalizedPattern);
              if (audioEngineRef.current) {
                audioEngineRef.current.setKickPattern(personalizedPattern);
              }
              console.log("✨ Pattern upgraded from basic to personalized!", personalizedPattern);
            }, 500); // 500ms after personal text appears for dramatic effect
          }
          
          // Show Next button for clap progression
          setTimeout(() => {
            setShowNextButton(true);
            setProgressionStage('clap-educational');
          }, 2000);
        }, 300);
      }, 300);
    } else if (progressionStage === 'clap-educational') {
      // Start clap track progression
      setProgressionStage('clap-personal');
      setTimeout(() => {
        // 1. Change title and start with basic clap pattern
        setShowClapTrack(true);
        const basicClapPattern = [4, 12]; // Basic clap on beats 2 and 4
        setClapPattern(basicClapPattern);
        audioEngineRef.current?.setClapPattern(basicClapPattern);
        // Unmute the clap track now that we're introducing it
        audioEngineRef.current?.setClapMuted(false);
        
        // 2. Show educational text
        setTimeout(() => {
          setSequencerTextVisible(false);
          setTimeout(() => {
            setSequencerText("The clap adds rhythm and drive to your track");
            setSequencerTextVisible(true);
            
            // Show Next button for clap personalization
            setTimeout(() => {
              setShowNextButton(true);
            }, 2000);
          }, 300);
        }, 500);
      }, 300);
    } else if (progressionStage === 'clap-personal') {
      // Show personal clap message and upgrade pattern
      setProgressionStage('complete');
      setTimeout(() => {
        setSequencerTextVisible(false);
        setTimeout(() => {
          const personalClapText = getPersonalClapMessage();
          setSequencerText(personalClapText);
          setSequencerTextVisible(true);
          
          // Upgrade clap pattern based on user data - but only if earned
          const basicClapPattern = [4, 12]; // Basic clap
          const userFollowerCount = userSnapshot?.farcaster.followerCount || 0;
          const personalizedClapPattern = generateClapPattern(userFollowerCount);
          
          // Only upgrade if it's different from basic
          if (JSON.stringify(personalizedClapPattern) !== JSON.stringify(basicClapPattern)) {
            setTimeout(() => {
              setClapPattern(personalizedClapPattern);
              audioEngineRef.current?.setClapPattern(personalizedClapPattern);
            }, 500);
          }
        }, 300);
      }, 300);
    }
  }, [progressionStage, generateKickPattern, getPersonalKickMessage, generateClapPattern, getPersonalClapMessage, userSnapshot]);

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
      setKickPattern(basicPattern);
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
  }, [handleStepChange, showSequencer, kickPattern]);

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
                    showClapTrack ? 'text-[#ffd12f]' : 'text-blue-600'
                  }`}>
                    {showClapTrack ? 'Now let\'s add a clap' : 'It starts with a kick'}
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
                      kickPattern={kickPattern}
                      clapPattern={clapPattern}
                      showClapTrack={showClapTrack}
                    />
                  )}

                  {/* Next Button */}
                  {showNextButton && progressionStage !== 'complete' && (
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                      <button
                        onClick={handleNextClick}
                        className="w-full bg-blue-600 text-white font-bold py-4 hover:bg-blue-700 transition-all duration-200 font-[var(--font-orbitron)] text-lg tracking-wide shadow-lg"
                        style={{
                          boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        {progressionStage === 'kick-educational' || progressionStage === 'clap-educational' ? 'Customize' : 'Next'}
                      </button>
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
