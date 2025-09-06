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
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BaseDrumAudioEngine } from "@/lib/audioEngine";
import { SongData } from "@/lib/songData";

interface GaugeProps {
  value: number;
  onChange: (value: number) => void;
  position: "left" | "right";
}

function CircularGauge({ value, onChange, position }: GaugeProps) {
  const handleGaugeInteraction = (event: React.MouseEvent | React.TouchEvent, targetElement?: HTMLElement) => {
    const target = targetElement || event.currentTarget;
    if (!target || !target.getBoundingClientRect) return;

    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX =
      event.clientX || (event.touches && event.touches[0].clientX);
    const clientY =
      event.clientY || (event.touches && event.touches[0].clientY);

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
    const targetElement = event.currentTarget;
    handleGaugeInteraction(event, targetElement);

    const handleMouseMove = (e: MouseEvent) => {
      handleGaugeInteraction(e, targetElement);
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
    const targetElement = event.currentTarget;
    handleGaugeInteraction(event, targetElement);

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleGaugeInteraction(e, targetElement);
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

export default function OnboardPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const audioEngineRef = useRef<BaseDrumAudioEngine | null>(null);
  const songDataRef = useRef<SongData>(createSimplePulse());
  const [audioStarted, setAudioStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [showFlashText, setShowFlashText] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [squareShrank, setSquareShrank] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageTitle, setStageTitle] = useState('');
  const [stageText, setStageText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [leftGauge, setLeftGauge] = useState(0);
  const [rightGauge, setRightGauge] = useState(0);
  const beatCountRef = useRef(0);
  const muteStatesRef = useRef({
    kick: false,
    hihat909: true,
    hihat: true,
    bass: true,
    lead: true,
    snare: true,
    rumble: true,
    ride: true,
    clap: true,
    acid: true,
  });

  function createSimplePulse(): SongData {
    const kickPattern = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60];
    return {
      metadata: {
        title: "Onboard Pulse",
        artist: "BaseDrum",
        version: "1.0",
        created: new Date().toISOString(),
        bpm: 140,
        bars: 4,
        steps: 64,
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
        kick: {
          pattern: kickPattern,
          velocity: Array(64).fill(0.9),
          muted: false,
          volume: -3
        }
      }
    };
  }

  const kickPattern = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60];
  const isKickStep = (step: number): boolean => kickPattern.includes(step);

  // Stage configuration
  const stages = [
    { 
      title: '', 
      text: '', 
      buttonText: 'Create my track',
      showFlash: true 
    },
    { 
      title: 'Lesson 1', 
      text: 'Is the pulse. It goes bam bam bam bam.', 
      buttonText: 'Continue',
      showFlash: false 
    },
    { 
      title: 'Building your rhythm', 
      text: 'Mapping your transactions to beats...', 
      buttonText: 'Next',
      showFlash: false 
    },
    { 
      title: 'Your track is ready', 
      text: 'BaseDrum has composed your unique sound', 
      buttonText: 'Play track',
      showFlash: false 
    }
  ];

  // Initialize stage from URL parameter
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam) {
      const stageNumber = parseInt(stageParam, 10);
      if (stageNumber >= 0 && stageNumber < stages.length) {
        setCurrentStage(stageNumber);
        setStageTitle(stages[stageNumber].title);
        setStageText(stages[stageNumber].text);
        
        // If not on initial stage, square should be shrunk and button visible
        if (stageNumber > 0) {
          setSquareShrank(true);
          setShowButton(true);
          
          // Auto-start audio if connected and not already playing
          if (isConnected && !audioStarted && audioEngineRef.current) {
            setTimeout(() => {
              startAudio();
            }, 500); // Small delay to ensure everything is initialized
          }
        }
      }
    }
  }, [searchParams, isConnected, audioStarted]);

  useEffect(() => {
    const initAudio = async () => {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new BaseDrumAudioEngine({
          onStepChange: handleStepChange,
          onBeatIntensity: setBeatIntensity,
        });
        
        await audioEngineRef.current.initialize(songDataRef, muteStatesRef);
        audioEngineRef.current.setBPM(140);
      }
    };

    initAudio();
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
        audioEngineRef.current = null;
      }
    };
  }, []);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    
    if (isKickStep(step)) {
      beatCountRef.current += 1;
      // Note: beatCountRef continues counting across all stages - music never stops
      
      // Only show flash text on stage 0 (initial stage)
      if (currentStage === 0 && stages[0].showFlash) {
        if (beatCountRef.current === 1) {
          setShowFlashText("base");
          setTimeout(() => setShowFlashText(null), 150);
        } else if (beatCountRef.current === 2) {
          setShowFlashText("drum");
          setTimeout(() => setShowFlashText(null), 150);
        }
      }
      
      // Show initial button after 4 beats (only on stage 0)
      if (beatCountRef.current === 4 && currentStage === 0) {
        setShowButton(true);
      }
    }
  };

  const startAudio = async () => {
    if (audioEngineRef.current && !audioStarted) {
      try {
        await audioEngineRef.current.play();
        setAudioStarted(true);
        beatCountRef.current = 0;
        setShowButton(false);
        setSquareShrank(false);
        setCurrentStage(0);
        setStageTitle('');
        setStageText('');
      } catch (error) {
        console.error("Failed to start audio:", error);
      }
    }
  };

  const progressToNextStage = () => {
    if (currentStage < stages.length - 1) {
      const nextStage = currentStage + 1;
      setIsTransitioning(true);
      
      // Update URL without triggering page reload
      const url = new URL(window.location.href);
      url.searchParams.set('stage', nextStage.toString());
      window.history.pushState({}, '', url.toString());
      
      // Fade out current content (audio continues playing)
      setTimeout(() => {
        if (currentStage === 0) {
          // First stage transition: shrink square and hide button temporarily
          setSquareShrank(true);
          setShowButton(false);
        }
        
        // Update stage content (no audio interruption)
        setCurrentStage(nextStage);
        setStageTitle(stages[nextStage].title);
        setStageText(stages[nextStage].text);
        
        // Fade in new content
        setTimeout(() => {
          setIsTransitioning(false);
          setShowButton(true);
        }, 300);
      }, 200);
    }
  };

  const handleCreateTrack = () => {
    progressToNextStage();
  };

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
    const baseScale = squareShrank ? 0.3 : 1;
    
    // Square pulses with beat on ALL stages - continuous heartbeat
    if (isKickStep(currentStep) && beatIntensity > 0 && audioStarted) {
      const pulsScale = baseScale * (1 + (beatIntensity * 0.08));
      const brightness = 1 + (beatIntensity * 0.3);
      const shadowIntensity = beatIntensity * (squareShrank ? 8 : 15); // Adjust glow for size
      
      return {
        transform: `scale(${pulsScale})`,
        filter: `brightness(${brightness})`,
        boxShadow: `0 0 ${shadowIntensity}px rgba(59, 130, 246, ${beatIntensity * 0.8})`,
        transition: squareShrank ? 
          'transform 0.1s ease-out, filter 0.1s ease-out, box-shadow 0.1s ease-out' : 
          'transform 0.1s ease-out, filter 0.1s ease-out, box-shadow 0.1s ease-out'
      };
    }
    
    return {
      transform: `scale(${baseScale})`,
      filter: 'brightness(1)',
      boxShadow: '0 0 0px rgba(59, 130, 246, 0)',
      transition: squareShrank ? 
        'transform 0.3s ease-out' : 
        'transform 0.2s ease-out, filter 0.2s ease-out, box-shadow 0.2s ease-out'
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

      {/* Speaker Gauges - Only show from lesson 1 onwards */}
      {currentStage >= 1 && (
        <>
          {/* Left gauge - Filter */}
          <div 
            className="transition-opacity duration-500 ease-in-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
            }}
          >
            <CircularGauge
              value={leftGauge}
              onChange={handleFilterChange}
              position="left"
            />
          </div>

          {/* Right gauge - Reverb */}
          <div 
            className="transition-opacity duration-500 ease-in-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
            }}
          >
            <CircularGauge
              value={rightGauge}
              onChange={handleReverbChange}
              position="right"
            />
          </div>
        </>
      )}

      <div className="flex-1 flex items-center justify-center relative z-10">
        {!isConnected ? (
          <Wallet className="z-10">
            <ConnectWallet 
              className="bg-[var(--app-accent)] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-opacity-80 transition-colors min-w-48"
              onClick={startAudio}
            >
              Connect Wallet
            </ConnectWallet>
          </Wallet>
        ) : (
          <div className={`stage-content ${isTransitioning ? 'transitioning' : ''} flex flex-col items-center justify-between h-full w-full py-12 relative`}>
            {/* Stage Title & Text - only show after stage 0 */}
            {currentStage > 0 && (
              <div className="flex flex-col items-center space-y-6 mt-16 px-6">
                <h1 className="stage-title text-5xl text-center max-w-md text-blue-400">
                  {stageTitle}
                </h1>
                <p className="stage-text text-xl text-center text-gray-200 max-w-lg leading-relaxed">
                  {stageText}
                </p>
              </div>
            )}
            
            {/* Central Pulsating Square - Always Present */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <div 
                  className="w-48 h-48 bg-blue-600 rounded-[5%] cursor-pointer hover:bg-blue-700 transition-colors"
                  style={getSquareStyle()}
                  onClick={currentStage === 0 ? startAudio : undefined}
                />
                
                {/* Flash Text - Only Stage 0 */}
                {showFlashText && currentStage === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div 
                      className="text-white font-black text-6xl tracking-wide"
                      style={{ 
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        textShadow: '0 0 10px rgba(0,0,0,0.5)',
                        animation: 'flash-in 0.15s ease-out'
                      }}
                    >
                      {showFlashText}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dynamic Button */}
            <button 
              className="bg-transparent border-2 border-blue-600 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold mb-10 font-exo"
              style={{ 
                opacity: showButton ? 1 : 0,
                transition: 'opacity 200ms ease-in, background-color 200ms'
              }}
              onClick={handleCreateTrack}
            >
              {stages[currentStage]?.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}