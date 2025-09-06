"use client";

import {
  useMiniKit,
  useAddFrame,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { DataDisplay } from "./components/DataDisplay";
import { DataFetcher, UserDataSnapshot } from "../lib/data-fetcher";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { isConnected, address } = useAccount();
  const [frameAdded, setFrameAdded] = useState(false);
  const [musicLayers, setMusicLayers] = useState<string[]>([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [showSoundwaves, setShowSoundwaves] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userSnapshot, setUserSnapshot] = useState<UserDataSnapshot | null>(null);
  const [musicInterpretation, setMusicInterpretation] = useState<Record<string, any> | null>(null);
  const [showDataDisplay, setShowDataDisplay] = useState(false);
  const [dataFetcher] = useState(() => new DataFetcher());

  const addFrame = useAddFrame();

  // Mock data that represents what we'd get from onchain/Farcaster analysis
  const mockMusicLayers = [
    {
      id: 'kick',
      reason: "Since you have 127 followers on Farcaster",
      instrument: "Kick Drum"
    },
    {
      id: 'hihat',
      reason: "Your 45 following connections add",
      instrument: "Hi-Hat"
    },
    {
      id: 'bass',
      reason: "Your 2.5 ETH balance unlocks",
      instrument: "Sub Bass"
    },
    {
      id: 'lead',
      reason: "Your DeFi activity adds",
      instrument: "Filter Lead"
    }
  ];

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);



  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <button
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] text-sm font-medium hover:text-[var(--app-accent-hover)] transition-colors"
        >
          + Save Frame
        </button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[var(--app-accent)] animate-fade-out">
          <span>✓</span>
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  const currentLayerData = currentLayer < mockMusicLayers.length ? mockMusicLayers[currentLayer] : null;
  const isComplete = currentLayer >= mockMusicLayers.length;

  const fetchUserData = useCallback(async () => {
    try {
      console.log('Fetching user data...');
      console.log('Context:', context);
      console.log('Address:', address);

      const snapshot = await dataFetcher.fetchUserSnapshot(context, address);
      setUserSnapshot(snapshot);

      const interpretation = DataFetcher.interpretDataForMusic(snapshot);
      setMusicInterpretation(interpretation);

      console.log('Data snapshot:', snapshot);
      console.log('Music interpretation:', interpretation);

      // Show the data display
      setShowDataDisplay(true);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }, [context, address, dataFetcher]);

  const handleDrumClick = useCallback(async () => {
    if (!isComplete && !isGenerating) {
      // First, fetch user data
      await fetchUserData();
      
      setIsGenerating(true);
      setHasStarted(true);
      setShowSoundwaves(true);
      
      // Automatically progress through all layers with 140 BPM timing
      const bpm = 140;
      const beatInterval = (60 / bpm) * 1000; // Convert BPM to milliseconds (428ms per beat)
      
      mockMusicLayers.forEach((layer, index) => {
        setTimeout(() => {
          setCurrentLayer(index + 1);
          setMusicLayers(prev => [...prev, layer.id]);
          console.log(`Adding layer: ${layer.instrument}`);
          
          // Stop generation when all layers are complete
          if (index === mockMusicLayers.length - 1) {
            setTimeout(() => {
              setIsGenerating(false);
              setShowSoundwaves(false);
            }, beatInterval);
          }
        }, index * beatInterval * 2); // 2 beats per layer (856ms between layers)
      });
    }
  }, [isComplete, isGenerating, mockMusicLayers, fetchUserData]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme bg-[var(--app-background)]">
      <div className="w-full max-w-6xl mx-auto px-4 py-3 flex flex-col min-h-screen">
        <header className="flex justify-between items-center mb-6 h-11">
          <div>
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
          </div>
          <div>{saveFrameButton}</div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative">
          
          {/* Upper Area - Layer Information (only shows after first click) */}
          {hasStarted && (
            <div className="absolute top-0 left-0 right-0 flex items-start justify-center pt-8">
              {currentLayerData && (
                <div className="text-center animate-fade-in">
                  <h3 className="text-2xl font-semibold mb-2 text-[var(--app-accent)]">
                    {currentLayerData.instrument}
                  </h3>
                  <p className="text-lg text-[var(--app-foreground-muted)]">
                    {currentLayerData.reason}
                  </p>
                </div>
              )}
              
              {isComplete && (
                <div className="text-center animate-fade-in">
                  <h3 className="text-2xl font-semibold mb-2 text-[var(--app-accent)]">
                    Your Track is Complete
                  </h3>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setMusicLayers([]);
                        setCurrentLayer(0);
                        setHasStarted(false);
                        setShowDataDisplay(false);
                      }}
                      className="bg-[var(--app-accent)] text-white px-6 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                    >
                      Generate Again
                    </button>
                    <button
                      onClick={fetchUserData}
                      className="bg-[var(--app-card-background)] text-[var(--app-foreground)] px-6 py-2 rounded-lg hover:bg-opacity-80 transition-colors border border-[var(--app-card-border)]"
                    >
                      Show Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Display */}
          {showDataDisplay && (
            <div className="absolute top-20 left-4 right-4 z-20">
              <DataDisplay 
                snapshot={userSnapshot}
                musicInterpretation={musicInterpretation}
                onClose={() => setShowDataDisplay(false)}
              />
            </div>
          )}

          {/* Lower Third - Connect Wallet or Drum in thumb-friendly position */}
          <div className="flex-1 flex items-end justify-center pb-16">
            <div className="relative">
              {!isConnected ? (
                /* Connect Wallet Button */
                <Wallet className="z-10">
                  <ConnectWallet className="bg-[var(--app-accent)] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-opacity-80 transition-colors min-w-48">
                    Connect Wallet
                  </ConnectWallet>
                </Wallet>
              ) : (
                <>
                  {/* Soundwaves Animation */}
                  {showSoundwaves && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-64 h-64 border-2 border-[var(--app-accent)] rounded-full animate-ping opacity-75"
                          style={{
                            animation: 'ping 856ms cubic-bezier(0, 0, 0.2, 1) infinite'
                          }}
                        ></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-80 h-80 border border-[var(--app-accent)] rounded-full animate-ping opacity-50" 
                          style={{
                            animation: 'ping 856ms cubic-bezier(0, 0, 0.2, 1) infinite',
                            animationDelay: '214ms'
                          }}
                        ></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-96 h-96 border border-[var(--app-accent)] rounded-full animate-ping opacity-25" 
                          style={{
                            animation: 'ping 856ms cubic-bezier(0, 0, 0.2, 1) infinite',
                            animationDelay: '428ms'
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                  
                  {/* Drum */}
                  <button
                    onClick={handleDrumClick}
                    disabled={isComplete || isGenerating}
                    className={`relative z-10 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      isComplete 
                        ? 'opacity-50 cursor-not-allowed' 
                        : isGenerating
                        ? 'cursor-not-allowed'
                        : 'hover:drop-shadow-lg cursor-pointer'
                    }`}
                  >
                    <Image
                      src="/drum.svg"
                      alt="Drum"
                      width={180}
                      height={180}
                      className={`filter drop-shadow-md ${
                        isGenerating ? 'animate-drum-shake' : ''
                      }`}
                      style={{
                        animation: isGenerating 
                          ? 'drum-shake 428ms infinite, drum-pulse 856ms infinite' 
                          : undefined
                      }}
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
