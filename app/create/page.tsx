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
import { SimpleAudioEngine } from "@/lib/simpleAudioEngine";

// Animation and styling constants
const FLASH_TEXT_DURATION = 150;
const FLASH_TEXTS = ['base', 'drum'] as const;
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

type FlashText = typeof FLASH_TEXTS[number] | null;

// PulsatingSquare component props
interface PulsatingSquareProps {
  style: SquareStyle;
  onClick: () => void;
  flashText: FlashText;
}

// Extracted PulsatingSquare component
function PulsatingSquare({ style, onClick, flashText }: PulsatingSquareProps) {
  return (
    <div className="relative">
      <div 
        className="w-48 h-48 bg-blue-600 rounded-[5%] cursor-pointer hover:bg-blue-700 transition-colors"
        style={style}
        onClick={onClick}
      />
      
      {flashText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div 
            className="text-white font-black text-6xl tracking-wide"
            style={{ 
              fontFamily: 'Helvetica, Arial, sans-serif',
              textShadow: '0 0 10px rgba(0,0,0,0.5)',
              animation: 'flash-in 0.15s ease-out'
            }}
          >
            {flashText}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatePage() {
  const { isConnected } = useAccount();
  const audioEngineRef = useRef<SimpleAudioEngine | null>(null);
  const beatCountRef = useRef(0);
  
  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [showFlashText, setShowFlashText] = useState<FlashText>(null);

  // Cleanup audio engine on unmount
  useEffect(() => {
    return () => {
      audioEngineRef.current?.dispose();
    };
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    beatCountRef.current += 1;
    
    const beatCount = beatCountRef.current;
    if (beatCount <= FLASH_TEXTS.length) {
      const flashText = FLASH_TEXTS[beatCount - 1];
      setShowFlashText(flashText);
      setTimeout(() => setShowFlashText(null), FLASH_TEXT_DURATION);
    }
  }, []);

  const getSquareStyle = useCallback((): SquareStyle => {
    const baseScale = 1;
    
    if (beatIntensity > 0) {
      const pulseScale = baseScale * (1 + (beatIntensity * BEAT_INTENSITY_SCALE_FACTOR));
      const brightness = 1 + (beatIntensity * BEAT_INTENSITY_BRIGHTNESS_FACTOR);
      const shadowIntensity = beatIntensity * BEAT_INTENSITY_SHADOW_FACTOR;
      const glowOpacity = beatIntensity * BEAT_INTENSITY_GLOW_OPACITY;
      
      return {
        transform: `scale(${pulseScale})`,
        filter: `brightness(${brightness})`,
        boxShadow: `0 0 ${shadowIntensity}px rgba(59, 130, 246, ${glowOpacity})`,
        transition: 'transform 0.1s ease-out, filter 0.1s ease-out, box-shadow 0.1s ease-out'
      };
    }
    
    return {
      transform: `scale(${baseScale})`,
      filter: 'brightness(1)',
      boxShadow: '0 0 0px rgba(59, 130, 246, 0)',
      transition: 'transform 0.2s ease-out, filter 0.2s ease-out, box-shadow 0.2s ease-out'
    };
  }, [beatIntensity]);

  const handleSquareClick = useCallback(async () => {
    try {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new SimpleAudioEngine();
        await audioEngineRef.current.initialize(handleStepChange, setBeatIntensity);
        beatCountRef.current = 0;
      }

      await audioEngineRef.current.play();
    } catch (error) {
      console.error('Failed to start audio:', error);
    }
  }, [handleStepChange]);

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
            >
              Connect Wallet
            </ConnectWallet>
          </Wallet>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <PulsatingSquare
              style={getSquareStyle()}
              onClick={handleSquareClick}
              flashText={showFlashText}
            />
          </div>
        )}
      </div>
    </div>
  );
}