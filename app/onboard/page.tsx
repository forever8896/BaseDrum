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