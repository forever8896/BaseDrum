
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
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BaseDrumAudioEngine } from "@/lib/audioEngine";
import { SongData } from "@/lib/songData";
import { DataFetcher, UserDataSnapshot } from "@/lib/data-fetcher";
import { DataDrivenMusicGenerator, GeneratedMusic, MusicExplanation } from "@/lib/data-driven-music-generator";


interface GaugeProps {
  value: number;
  onChange: (value: number) => void;
  position: "left" | "right";
}

function CircularGauge({ value, onChange, position }: GaugeProps) {
  const handleGaugeInteraction = (event: React.MouseEvent | React.TouchEvent, targetElement?: HTMLElement) => {
    const target = targetElement || event.currentTarget as HTMLElement;
    if (!target || !target.getBoundingClientRect) return;

    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - centerX;
    const y = clientY - centerY;

    // Calculate angle in radians, then convert to degrees
    let angle = Math.atan2(y, x) * (180 / Math.PI);

    // Normalize angle to 0-360 range
    angle = (angle + 360) % 360;

    // Simple quarter circle mapping - start from bottom and go up in the visible quarter
    let gaugeValue;

    if (position === "left") {
      // Left gauge: Horizontal mirror of right gauge
      // When right uses 180°-270°, left should use 270°-360°
      if (angle >= 270 && angle <= 360) {
        gaugeValue = (360 - angle) / 90;  // 360° → 0%, 270° → 100% (reversed because mirrored)
      } else if (angle >= 0 && angle <= 90) {
        gaugeValue = (90 - angle) / 90;  // 0° → 100%, 90° → 0% (reversed because mirrored)
      } else {
        gaugeValue = 0;
      }
    } else {
      // Right gauge: top-left quarter (180° to 270°)
      // Map 180° to 0% and 270° to 100% (inverted to match visual expectation)
      if (angle >= 180 && angle <= 270) {
        gaugeValue = (angle - 180) / 90;
      } else {
        gaugeValue = 0;
      }
    }

    onChange(gaugeValue);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const targetElement = event.currentTarget as HTMLElement;
    handleGaugeInteraction(event, targetElement);

    const handleMouseMove = (e: MouseEvent) => {
      handleGaugeInteraction(e as any, targetElement);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    const targetElement = event.currentTarget as HTMLElement;
    handleGaugeInteraction(event, targetElement);

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleGaugeInteraction(e as any, targetElement);
    };
    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const positionClasses =
    position === "left"
      ? "bottom-0 left-0 translate-x-[-50%] translate-y-[50%]"
      : "bottom-0 right-0 translate-x-[50%] translate-y-[50%]";

  // SVG circle parameters
  const size = 288; // 72 * 4 (w-72 = 288px)
  const center = size / 2;
  const radius = 108; // Distance from center to middle of the thick ring
  const strokeWidth = 48; // 24 * 2 (border-24 equivalent)
  const circumference = 2 * Math.PI * radius;
  const quarterCircumference = circumference / 4; // Only quarter of the circle

  return (
    <>
      {/* Gauge Container */}
      <div className={`absolute w-72 h-72 transform ${positionClasses}`}>
        {/* SVG Gauge */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Ghost ring - always visible full circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#4b5563"
            strokeWidth={strokeWidth}
            opacity="0.8"
            filter="drop-shadow(0 0 8px rgba(75, 85, 99, 0.5))"
          />

          {/* Active gauge ring - only quarter circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${quarterCircumference} ${circumference}`}
            strokeDashoffset={
              position === "left" 
                ? quarterCircumference * (1 - value)  // Left: exact same as right
                : quarterCircumference * (1 - value)  // Right: keep current direction
            }
            strokeLinecap="round"
            transform={
              position === "left"
                ? `rotate(180 ${center} ${center}) scale(-1, 1) translate(-${size}, 0)`  // Left: mirror horizontally
                : `rotate(180 ${center} ${center})`  // Right: bottom-left quarter  
            }
            style={{
              transition: "stroke-dashoffset 0.1s ease-out",
            }}
          />
        </svg>

        {/* Transparent interaction overlay */}
        <div
          className="absolute inset-0 w-full h-full cursor-pointer bg-transparent z-20"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        ></div>
      </div>
    </>
  );
}

function OnboardPageContent() {
  const { isConnected, address } = useAccount();
  const searchParams = useSearchParams();
  const audioEngineRef = useRef<BaseDrumAudioEngine | null>(null);
  const songDataRef = useRef<SongData>(createSimplePulse());
  const generatedConfigRef = useRef<SimplifiedMusicConfig | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [showFlashText, setShowFlashText] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [layerReason, setLayerReason] = useState('');
  const [isLayerTransitioning, setIsLayerTransitioning] = useState(false);
  const [leftGauge, setLeftGauge] = useState(0);
  const [rightGauge, setRightGauge] = useState(0);
  const [userDataSnapshot, setUserDataSnapshot] = useState<UserDataSnapshot | null>(null);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic | null>(null);
  const beatCountRef = useRef(0);
  const barsCountRef = useRef(0);
  const muteStatesRef = useRef({
    kick: false,     // Enable kick from data
    hihat909: false, // Enable hi-hat from data
    bass: false,     // Enable bass from data
    clap: false,     // Enable snare/clap from data
    lead: false,     // Enable lead from data
    pulse: true,     // Disable pulse initially
  });

  // Fetch user data on wallet connection
  useEffect(() => {
    const fetchUserData = async () => {
      if (!address || userDataSnapshot) return;
      
      try {
        const dataFetcher = new DataFetcher();
        
        // Get real context from MiniKit/Farcaster if available
        let realContext = null;
        
        // Try to get MiniKit context
        if (typeof window !== 'undefined' && (window as any).MiniKit) {
          try {
            const miniKit = (window as any).MiniKit;
            realContext = miniKit.context;
            console.log('Got real MiniKit context:', realContext);
          } catch (e) {
            console.log('MiniKit not available:', e);
          }
        }
        
        // Fetch user data with real context (null if not available)
        const userData = await dataFetcher.fetchUserSnapshot(realContext, address);
        setUserDataSnapshot(userData);
        
        // Generate music from user data
        const music = DataDrivenMusicGenerator.generateMusic(userData);
        setGeneratedMusic(music);
        
        // Convert to song data for audio engine
        const songData = DataDrivenMusicGenerator.musicToSongData(music);
        generatedConfigRef.current = songData;
        
        console.log('User data fetched (no mocks):', userData);
        console.log('Generated music:', music);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        
        // Generate default music on error
        const music = DataDrivenMusicGenerator.generateMusic(null);
        setGeneratedMusic(music);
        const songData = DataDrivenMusicGenerator.musicToSongData(music);
        generatedConfigRef.current = songData;
      }
    };

    if (isConnected && address) {
      fetchUserData();
    }
  }, [isConnected, address, userDataSnapshot]);

  function createSimplePulse(): SongData {
    // Create simple pulse pattern - 4 bars, 4 steps per bar = 16 steps
    const pulsePattern = [0, 4, 8, 12]; // Quarter note pulse
    return {
      metadata: {
        title: "Onboard Pulse",
        artist: "BaseDrum",
        version: "1.0",
        created: new Date().toISOString(),
        bpm: 140,
        bars: 4,
        steps: 16,
        format: "basedrum-v1"
      },
      effects: {
        filter: {
          cutoff: 0.0,
          type: "lowpass",
          startFreq: 20000,
          endFreq: 20000
        },
        reverb: {
          wet: 0.0,
          roomSize: 0.5,
          decay: 1.5
        }
      },
      tracks: {
        pulse: {
          pattern: pulsePattern,
          velocity: Array(16).fill(0.9),
          muted: false,
          volume: -6
        }
      }
    };
  }

  // Add the next layer to the music based on user data
  const addNextLayer = useCallback(() => {
    if (!generatedConfigRef.current || !audioEngineRef.current) return;

    const config = generatedConfigRef.current;
    const layerOrder = ['syncopation', 'bass', 'kicks', 'hihat', 'lead'];
    
    if (currentLayer < layerOrder.length) {
      const layerName = layerOrder[currentLayer];
      setIsLayerTransitioning(true);
      
      // Show the reason for this layer
      let reason = '';
      let trackName = '';
      
      switch (layerName) {
        case 'syncopation':
          reason = config.syncopation.reason;
          trackName = 'clap';
          muteStatesRef.current.clap = false;
          break;
        case 'bass':
          reason = config.bass.reason;
          trackName = 'bass';
          muteStatesRef.current.bass = false;
          break;
        case 'kicks':
          reason = config.kicks.reason;
          trackName = 'kick';
          muteStatesRef.current.kick = false;
          break;
        case 'hihat':
          reason = config.hihat.reason;
          trackName = 'hihat909';
          muteStatesRef.current.hihat909 = false;
          break;
        case 'lead':
          reason = config.lead.reason;
          trackName = 'lead';
          muteStatesRef.current.lead = false;
          break;
      }
      
      setLayerReason(reason);
      setCurrentLayer(prev => prev + 1);
      
      console.log(`Added layer ${currentLayer + 1}: ${layerName} - ${reason}`);
      
      // Clear the transition after showing the reason
      setTimeout(() => {
        setIsLayerTransitioning(false);
        setTimeout(() => {
          setLayerReason('');
        }, 2000); // Show reason for 2 seconds
      }, 500);
    }
  }, [currentLayer, generatedConfigRef, audioEngineRef]);

  const pulsePattern = useMemo(() => [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60], []);
  const isPulseStep = useCallback((step: number): boolean => {
    // Check if current step matches pulse pattern (quarter notes)
    return pulsePattern.includes(step % 64);
  }, [pulsePattern]);


  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    
    // Check for pulse beats
    const isBeatStep = isPulseStep(step);
    
    if (isBeatStep) {
      beatCountRef.current += 1;
      
      // Count bars (4 beats = 1 bar in our pulse pattern)
      if (beatCountRef.current % 4 === 0) {
        barsCountRef.current += 1;
        
        // DISABLED layering for now - just keep pulse playing
        // if (barsCountRef.current > 1 && (barsCountRef.current - 1) % 4 === 0 && currentLayer < 5) {
        //   addNextLayer();
        // }
      }
      
      // Show flash text on first beats
      if (beatCountRef.current === 1) {
        setShowFlashText("base");
        setTimeout(() => setShowFlashText(null), 150);
      } else if (beatCountRef.current === 2) {
        setShowFlashText("drum");
        setTimeout(() => setShowFlashText(null), 150);
      }
      
      // Show initial button after 4 beats
      if (beatCountRef.current === 4) {
        setShowButton(true);
      }
    }
  }, [isPulseStep, addNextLayer, currentLayer]);

  const startAudio = useCallback(async () => {
    if (audioEngineRef.current && !audioStarted && generatedConfigRef.current) {
      try {
        // Use the generated song data directly
        songDataRef.current = generatedConfigRef.current;
        
        // Initialize with generated data and start playing
        await audioEngineRef.current.initialize(songDataRef, muteStatesRef);
        await audioEngineRef.current.play();
        
        setAudioStarted(true);
        beatCountRef.current = 0;
        barsCountRef.current = 0;
        
        console.log("Audio started with generated song data:", generatedConfigRef.current);
      } catch (error) {
        console.error("Failed to start audio:", error);
      }
    }
  }, [audioEngineRef, audioStarted, generatedConfigRef]);

  // Show button when user data is loaded
  useEffect(() => {
    if (generatedConfigRef.current && !audioStarted) {
      setShowButton(true);
    }
  }, [generatedConfigRef.current, audioStarted]);

  useEffect(() => {
    const initAudio = async () => {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new BaseDrumAudioEngine({
          onStepChange: handleStepChange,
          onBeatIntensity: setBeatIntensity,
        });
        
        await audioEngineRef.current.initialize(songDataRef, muteStatesRef);
        audioEngineRef.current.setBPM(140); // Keep original fast BPM
      }
    };

    initAudio();
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
        audioEngineRef.current = null;
      }
    };
  }, [handleStepChange]);


  const handleFilterChange = (value: number) => {
    setLeftGauge(value);
    if (audioEngineRef.current) {
      audioEngineRef.current.setFilterValue(value);
    }
  };

  const handleReverbChange = (value: number) => {
    setRightGauge(value);
    if (audioEngineRef.current) {
      audioEngineRef.current.setReverbValue(value);
    }
  };

  const getSquareStyle = () => {
    const baseScale = 1;
    
    // Square pulses with beat intensity
    let shouldPulse = false;
    
    if (audioStarted && beatIntensity > 0) {
      shouldPulse = isPulseStep(currentStep);
      
      // Add extra intensity when more layers are active
      const layerBonus = currentLayer * 0.02; // Each layer adds 2% more intensity
      
      if (shouldPulse) {
        const pulsScale = baseScale * (1 + (beatIntensity * 0.12) + layerBonus);
        const brightness = 1 + (beatIntensity * 0.4) + layerBonus;
        const shadowIntensity = beatIntensity * 20 + (currentLayer * 5);
        
        return {
          transform: `scale(${pulsScale})`,
          filter: `brightness(${brightness})`,
          boxShadow: `0 0 ${shadowIntensity}px rgba(59, 130, 246, ${beatIntensity * 0.9})`,
          transition: 'transform 0.1s ease-out, filter 0.1s ease-out, box-shadow 0.1s ease-out'
        };
      }
    }
    
    return {
      transform: `scale(${baseScale})`,
      filter: 'brightness(1)',
      boxShadow: '0 0 0px rgba(59, 130, 246, 0)',
      transition: 'transform 0.2s ease-out, filter 0.2s ease-out, box-shadow 0.2s ease-out'
    };
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <style jsx>{`
        @keyframes flash-in {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-out-down {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        .stage-content {
          transition: opacity 300ms ease-in-out;
        }
        
        .stage-content.transitioning {
          opacity: 0;
        }
        
        .stage-content.transitioning .stage-title,
        .stage-content.transitioning .stage-text {
          animation: fade-out-down 200ms ease-in forwards;
        }
        
        .stage-title {
          animation: fade-in-up 800ms ease-out forwards;
          font-family: var(--font-orbitron), monospace;
          font-weight: 900;
        }
        
        .stage-text {
          animation: fade-in-up 800ms ease-out 300ms forwards;
          opacity: 0;
          font-family: var(--font-exo-2), sans-serif;
          font-weight: 400;
        }
        
        .generating {
          animation: pulse 1.5s ease-in-out infinite;
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
            <ConnectWallet 
              className="bg-[var(--app-accent)] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-opacity-80 transition-colors min-w-48"
            >
              Connect Wallet
            </ConnectWallet>
          </Wallet>
        ) : (
          <>
            {/* User Data Display */}
            <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-20 px-6 z-10">
              {userDataSnapshot && generatedMusic && (
                <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg max-w-4xl max-h-96 overflow-y-auto">
                  <h2 className="text-xl text-blue-400 font-bold mb-4">Your Data → Music</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Your Data */}
                    <div>
                      <h3 className="text-lg text-blue-300 font-semibold mb-3">Your Blockchain Data</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Transactions:</strong> {userDataSnapshot.onchain.transactionCount || 0}</div>
                        <div><strong>Followers:</strong> {userDataSnapshot.farcaster.followerCount || 0}</div>
                        <div><strong>Following:</strong> {userDataSnapshot.farcaster.followingCount || 0}</div>
                        <div><strong>Wallet Balance:</strong> {userDataSnapshot.wallet.balance || '0 ETH'}</div>
                        <div><strong>Token Count:</strong> {userDataSnapshot.onchain.tokenCount || 0}</div>
                        <div><strong>NFT Count:</strong> {userDataSnapshot.onchain.nftCount || 0}</div>
                        <div><strong>ETH Price:</strong> ${userDataSnapshot.prices.eth || 'N/A'}</div>
                      </div>
                    </div>
                    
                    {/* Right: Musical Explanations */}
                    <div>
                      <h3 className="text-lg text-blue-300 font-semibold mb-3">How Your Data Becomes Music</h3>
                      <div className="space-y-3">
                        {generatedMusic.explanations.map((explanation, index) => (
                          <div key={index} className="border-l-2 border-blue-500 pl-3">
                            <div className="font-semibold text-blue-300">{explanation.element}</div>
                            <div className="text-sm text-gray-300">{explanation.reason}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              <strong>Data:</strong> {explanation.dataUsed}
                            </div>
                            <div className="text-xs text-gray-400">
                              <strong>Effect:</strong> {explanation.musicalEffect}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Music Pattern Preview */}
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <h3 className="text-lg text-blue-300 font-semibold mb-3">Generated Pattern (4 bars, 140 BPM)</h3>
                    <div className="grid grid-cols-5 gap-4 text-xs">
                      <div>
                        <strong>Kick:</strong> {generatedMusic.patterns.kick.filter(Boolean).length} hits
                      </div>
                      <div>
                        <strong>Hi-Hat:</strong> {generatedMusic.patterns.hihat.filter(Boolean).length} hits
                      </div>
                      <div>
                        <strong>Snare:</strong> {generatedMusic.patterns.snare.filter(Boolean).length} hits
                      </div>
                      <div>
                        <strong>Bass:</strong> {generatedMusic.patterns.bass.filter(n => n > 0).length} notes
                      </div>
                      <div>
                        <strong>Lead:</strong> {generatedMusic.patterns.lead.filter(n => n > 0).length} notes
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!userDataSnapshot && isConnected && (
                <div className="text-gray-400 text-center">
                  <div className="animate-pulse">Fetching your blockchain data...</div>
                </div>
              )}
            </div>

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <button 
                className="w-48 h-48 bg-blue-600 hover:bg-blue-700 rounded-[5%] flex items-center justify-center transition-colors disabled:opacity-50"
                onClick={startAudio}
                disabled={!generatedConfigRef.current || audioStarted}
              >
                <div className="text-white font-black text-4xl">
                  {audioStarted ? 'PLAYING' : generatedConfigRef.current ? 'PLAY' : 'LOADING'}
                </div>
              </button>
            </div>
            
            {/* Data Status */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
              <div className="text-center text-gray-400">
                {userDataSnapshot ? (
                  <div>✅ Data fetched successfully</div>
                ) : isConnected ? (
                  <div className="animate-pulse">🔄 Fetching your data...</div>
                ) : (
                  <div>👆 Connect wallet to see your data</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <OnboardPageContent />
    </Suspense>
  );
}