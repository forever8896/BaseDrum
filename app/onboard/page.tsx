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
import { BaseDrumAudioEngine } from "@/lib/audioEngine";
import { SongData } from "@/lib/songData";

export default function OnboardPage() {
  const { isConnected } = useAccount();
  const audioEngineRef = useRef<BaseDrumAudioEngine | null>(null);
  const songDataRef = useRef<SongData>(createSimplePulse());
  const [audioStarted, setAudioStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [showFlashText, setShowFlashText] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
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
      
      if (beatCountRef.current === 1) {
        setShowFlashText("base");
        setTimeout(() => setShowFlashText(null), 150);
      } else if (beatCountRef.current === 2) {
        setShowFlashText("drum");
        setTimeout(() => setShowFlashText(null), 150);
      }
      
      if (beatCountRef.current === 4) {
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
      } catch (error) {
        console.error("Failed to start audio:", error);
      }
    }
  };

  const getSquareStyle = () => {
    if (isKickStep(currentStep) && beatIntensity > 0) {
      const scale = 1 + (beatIntensity * 0.15);
      const brightness = 1 + (beatIntensity * 0.3);
      const shadowIntensity = beatIntensity * 20;
      
      return {
        transform: `scale(${scale})`,
        filter: `brightness(${brightness})`,
        boxShadow: `0 0 ${shadowIntensity}px rgba(59, 130, 246, ${beatIntensity * 0.8})`,
        transition: 'transform 0.1s ease-out, filter 0.1s ease-out, box-shadow 0.1s ease-out'
      };
    }
    
    return {
      transform: 'scale(1)',
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
          <div className="flex flex-col items-center justify-between h-full w-full py-12 relative">
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <div 
                  className="w-48 h-48 bg-blue-600 rounded-[5%] cursor-pointer hover:bg-blue-700 transition-colors"
                  style={getSquareStyle()}
                  onClick={startAudio}
                />
                
                {showFlashText && (
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
            
            <button 
              className="bg-transparent border-2 border-blue-600 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-black mb-10"
              style={{ 
                fontFamily: 'Helvetica, Arial, sans-serif',
                opacity: showButton ? 1 : 0,
                transition: 'opacity 200ms ease-in, background-color 200ms'
              }}
              onClick={startAudio}
            >
              Create my track
            </button>
          </div>
        )}
      </div>
    </div>
  );
}