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
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { DataDisplay } from "./components/DataDisplay";
import { DataFetcher, UserDataSnapshot } from "../lib/data-fetcher";
import { audioEngine } from "../lib/audio-engine";
import { MusicGenerator, GeneratedTrack } from "../lib/music-generator";

interface Track {
  id: string;
  name: string;
  steps: boolean[];
  volume: number;
  effects: Record<string, number>;
}

interface MusicLayer {
  id: string;
  reason: string;
  instrument: string;
  pattern: boolean[];
  presetId: string;
  volume: number;
  effects: Record<string, number>;
}

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { isConnected, address } = useAccount();
  const [frameAdded, setFrameAdded] = useState(false);

  const [currentLayer, setCurrentLayer] = useState(0);
  const [showSoundwaves, setShowSoundwaves] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo] = useState(140);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const [userSnapshot, setUserSnapshot] = useState<UserDataSnapshot | null>(null);
  const [musicInterpretation, setMusicInterpretation] = useState<Record<string, string | number> | null>(null);
  const [showDataDisplay, setShowDataDisplay] = useState(false);
  const [dataFetcher] = useState(() => new DataFetcher());

  const [tracks, setTracks] = useState<Track[]>([]);
  const tracksRef = useRef(tracks);

  const addFrame = useAddFrame();

  // Generate dynamic music layers based on user data
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);

  // Convert GeneratedTrack to MusicLayer for display
  const musicLayers = useMemo(() => 
    generatedTracks.map(track => ({
      id: track.id,
      reason: track.reason,
      instrument: track.name,
      pattern: track.pattern,
      presetId: track.presetId,
      volume: track.volume,
      effects: track.effects
    })), [generatedTracks]
  );

  // Initialize with default tracks on component mount
  useEffect(() => {
    if (generatedTracks.length === 0) {
      console.log('Generating default tracks...');
      const defaultTracks = MusicGenerator.generateTracks(null);
      setGeneratedTracks(defaultTracks);
    }
  }, [generatedTracks.length]);

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioEngine.initialize();
        setAudioInitialized(true);
        console.log('Audio engine initialized');
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initAudio();

    return () => {
      audioEngine.dispose();
    };
  }, []);

  // Update tempo in audio engine
  useEffect(() => {
    if (audioInitialized) {
      audioEngine.setTempo(tempo);
    }
  }, [tempo, audioInitialized]);

  // Keep tracks ref updated
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

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

  const currentLayerData = currentLayer < musicLayers.length ? musicLayers[currentLayer] : null;
  const isComplete = musicLayers.length > 0 && currentLayer >= musicLayers.length && !isGenerating;

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

      // Generate music tracks based on user data
      const tracks = MusicGenerator.generateTracks(snapshot);
      setGeneratedTracks(tracks);
      console.log('Generated personalized tracks:', tracks);

      // Don't automatically show data display - only show when user clicks "Show Data" button
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      
      // Don't regenerate fallback tracks if we already have default ones
      if (generatedTracks.length === 0) {
        console.log('Using fallback track generation');
        const fallbackTracks = MusicGenerator.generateTracks(null);
        setGeneratedTracks(fallbackTracks);
      }
    }
  }, [context, address, dataFetcher, generatedTracks]);

  const createTrackFromLayer = useCallback((layer: MusicLayer) => {
    const track: Track = {
      id: layer.id,
      name: layer.instrument,
      steps: [...layer.pattern],
      volume: layer.volume,
      effects: { ...layer.effects }
    };

    // Create audio track only if audio is initialized
    if (audioInitialized) {
      try {
        const ruleId = musicLayers.findIndex(l => l.id === layer.id) + 1;
        console.log(`Creating audio track: ${layer.id} with preset: ${layer.presetId}`);
        audioEngine.createTrack(layer.id, ruleId, layer.presetId);
        audioEngine.updateTrackVolume(layer.id, layer.volume);
        
        // Apply effects
        Object.entries(layer.effects).forEach(([effect, value]) => {
          console.log(`Applying effect ${effect}: ${value} to track ${layer.id}`);
          audioEngine.updateTrackEffect(layer.id, effect, value);
        });
        
        console.log(`Audio track ${layer.id} created successfully`);
      } catch (error) {
        console.error(`Failed to create audio track ${layer.id}:`, error);
      }
    } else {
      console.log(`Audio not initialized, track ${layer.id} creation deferred`);
    }

    return track;
  }, [audioInitialized, musicLayers]);

  const startPlayback = useCallback(() => {
    if (!audioInitialized || isPlaying) {
      console.log(`Cannot start playback: audioInitialized=${audioInitialized}, isPlaying=${isPlaying}`);
      return;
    }

    console.log('Starting playback with tracks:', tracksRef.current.length);
    setIsPlaying(true);
    setCurrentStep(0);
    
    // Use audio engine for playback
    audioEngine.startSequence(() => {
      const currentTracks = tracksRef.current;
      console.log('Sequence callback - current tracks:', currentTracks.map(t => ({id: t.id, activeSteps: t.steps.filter(Boolean).length})));
      return currentTracks;
    }, tempo, (step: number) => {
      setCurrentStep(step);
    });
  }, [audioInitialized, isPlaying, tempo]);

  const stopPlayback = useCallback(() => {
    if (!isPlaying) return;

    console.log('Stopping playback');
    setIsPlaying(false);
    setCurrentStep(0);
    audioEngine.stopSequence();
  }, [isPlaying]);

  const addNextLayer = useCallback((layerIndex: number) => {
    if (layerIndex >= musicLayers.length) return;

    const layer = musicLayers[layerIndex];
    console.log(`Adding layer ${layerIndex}: ${layer.instrument}`);
    
    const newTrack = createTrackFromLayer(layer);
    
    setTracks(prev => {
      const exists = prev.find(t => t.id === layer.id);
      if (exists) {
        console.log(`Track ${layer.id} already exists`);
        return prev;
      }
      console.log(`Track ${layer.id} added to state`);
      return [...prev, newTrack];
    });
  }, [musicLayers, createTrackFromLayer]);

  const initializeAudioForPlayback = useCallback(async () => {
    try {
      console.log('Initializing audio for playback...');
      setAudioError(null);
      
      await audioEngine.initialize();
      setAudioInitialized(true);
      console.log('Audio engine initialized successfully');

      // Create audio tracks for existing tracks
      tracks.forEach(track => {
        const layer = musicLayers.find(l => l.id === track.id);
        if (layer) {
          const ruleId = musicLayers.findIndex(l => l.id === layer.id) + 1;
          console.log(`Creating deferred audio track: ${layer.id}`);
          try {
            audioEngine.createTrack(layer.id, ruleId, layer.presetId);
            audioEngine.updateTrackVolume(layer.id, layer.volume);
            
            Object.entries(layer.effects).forEach(([effect, value]) => {
              audioEngine.updateTrackEffect(layer.id, effect, value);
            });
          } catch (trackError) {
            console.error(`Failed to create track ${layer.id}:`, trackError);
            setAudioError(`Failed to create track ${layer.id}`);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      setAudioError(`Audio initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [tracks, musicLayers]);

  const handleDrumClick = useCallback(async () => {
    if (isComplete || isGenerating) return;

    console.log('Drum clicked - starting music generation');

      // First, fetch user data
      await fetchUserData();
      
      setIsGenerating(true);
      setHasStarted(true);
      setShowSoundwaves(true);
      
    // Initialize audio with user interaction
    const audioReady = await initializeAudioForPlayback();
    if (!audioReady) {
      console.error('Failed to initialize audio');
      setIsGenerating(false);
      setShowSoundwaves(false);
      return;
    }

    // Start with first layer immediately
    addNextLayer(0);
    setCurrentLayer(1);
    
    // Start playback after a short delay to ensure track creation
    setTimeout(() => {
      console.log('Starting playback...');
      startPlayback();
    }, 200);
    
    // Calculate timing: 4 bars = 16 beats at 140 BPM
      const bpm = 140;
    const beatsPerBar = 4;
    const barsPerLayer = 4;
    const totalBeatsPerLayer = beatsPerBar * barsPerLayer; // 16 beats
    const beatInterval = (60 / bpm) * 1000; // ~428ms per beat
    const layerInterval = totalBeatsPerLayer * beatInterval; // ~6.85 seconds per layer
    
    console.log(`Layer interval: ${layerInterval}ms (${barsPerLayer} bars)`);
    
    // Add remaining layers every 4 bars
    if (musicLayers.length === 1) {
      // Handle single layer case - complete after one cycle
      setTimeout(() => {
        setIsGenerating(false);
        setShowSoundwaves(false);
        setCurrentLayer(musicLayers.length);
        console.log('Single layer generation complete');
      }, layerInterval);
    } else {
      // Handle multiple layers
      musicLayers.slice(1).forEach((layer, index) => {
          setTimeout(() => {
          console.log(`Adding layer ${index + 1} after ${(index + 1) * layerInterval}ms`);
          addNextLayer(index + 1);
          setCurrentLayer(index + 2);
            
            // Stop generation when all layers are complete
          if (index === musicLayers.length - 2) {
              setTimeout(() => {
                setIsGenerating(false);
                setShowSoundwaves(false);
                setCurrentLayer(musicLayers.length); // Ensure we're at the end
              console.log('Music generation complete');
            }, layerInterval);
          }
        }, (index + 1) * layerInterval);
      });
    }
  }, [isComplete, isGenerating, musicLayers, fetchUserData, addNextLayer, startPlayback, initializeAudioForPlayback]);

  const handleReset = useCallback(() => {
    stopPlayback();
    setTracks([]);
    setGeneratedTracks([]);
    setCurrentLayer(0);
    setHasStarted(false);
    setShowDataDisplay(false);
    setIsGenerating(false);
    setShowSoundwaves(false);
  }, [stopPlayback]);

  const handleTogglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, stopPlayback, startPlayback]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme bg-[var(--app-background)]">
      <div className="w-full max-w-6xl mx-auto px-4 py-3 flex flex-col flex-1">
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
                      onClick={handleReset}
                      className="bg-[var(--app-accent)] text-white px-6 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                    >
                      Generate Again
                    </button>
                    <button
                      onClick={handleTogglePlayback}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        isPlaying 
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {isPlaying ? "Stop" : "Play"}
                    </button>
                    <button
                      onClick={() => setShowDataDisplay(true)}
                      className="bg-[var(--app-card-background)] text-[var(--app-foreground)] px-6 py-2 rounded-lg hover:bg-opacity-80 transition-colors border border-[var(--app-card-border)]"
                    >
                      View Your Data
                    </button>
                  </div>
                </div>
              )}

              {/* Test Audio Button - for debugging */}
              {isConnected && !hasStarted && (
                <div className="absolute top-16 right-4">
                  <button
                    onClick={async () => {
                      console.log('Testing audio...');
                      const audioReady = await initializeAudioForPlayback();
                      if (audioReady) {
                        // Create a simple test track
                        const testTrack: Track = {
                          id: 'test-kick',
                          name: 'Test Kick',
                          steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
                          volume: 0.8,
                          effects: {}
                        };
                        setTracks([testTrack]);
                        
                        // Create audio track
                        audioEngine.createTrack('test-kick', 1, 'pulse-kick');
                        audioEngine.updateTrackVolume('test-kick', 0.8);
                        
                        // Start playback
                        setTimeout(() => {
                          startPlayback();
                        }, 100);
                      }
                    }}
                    className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                  >
                    Test Audio
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Audio Status Display */}
          {isConnected && !hasStarted && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-[var(--app-card-background)] border border-[var(--app-card-border)] rounded-lg px-4 py-2 text-center">
                <div className="text-sm text-[var(--app-foreground-muted)]">
                </div>
                {audioError && (
                  <div className="text-xs text-red-500 mt-1">
                    {audioError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Track Progress Display */}
          {hasStarted && tracks.length > 0 && (
            <div className="absolute top-32 left-4 right-4 z-10">
              <div className="bg-[var(--app-card-background)] border border-[var(--app-card-border)] rounded-lg p-4">
                <div className="text-center mb-4">
                  <h4 className="text-sm font-medium text-[var(--app-foreground-muted)]">
                    Track Progress ({tracks.length}/{musicLayers.length} layers)
                  </h4>
                  <div className="text-xs text-[var(--app-foreground-muted)] mt-1">
                    {isPlaying && `Step: ${currentStep + 1}/16 • Tempo: ${tempo} BPM`}
                    {!isPlaying && audioInitialized && "Ready to play"}
                    {!audioInitialized && "Audio not initialized"}
                  </div>
                  {audioError && (
                    <div className="text-xs text-red-500 mt-1 bg-red-50 border border-red-200 rounded p-2">
                      ⚠️ {audioError}
                    </div>
                  )}
                </div>
                
                {/* Simple step indicator */}
                {isPlaying && (
                  <div className="flex gap-1 justify-center mb-2">
                    {Array.from({ length: 16 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentStep === i 
                            ? "bg-[var(--app-accent)]" 
                            : "bg-[var(--app-card-border)]"
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Active tracks list */}
                <div className="space-y-1">
                  {tracks.map((track, index) => {
                    const layer = musicLayers.find(l => l.id === track.id);
                    const activeSteps = track.steps.filter(Boolean).length;
                    return (
                      <div key={track.id} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--app-foreground)]">
                          {index + 1}. {track.name} ({activeSteps} steps)
                        </span>
                        <span className="text-[var(--app-foreground-muted)]">
                          {layer?.reason.slice(0, 20)}...
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Debug info */}
                {tracks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--app-card-border)]">
                    <div className="text-xs text-[var(--app-foreground-muted)] space-y-1">
                      <div>Audio Engine: {audioInitialized ? '✅ Ready' : '❌ Not Ready'}</div>
                      <div>Playback: {isPlaying ? '▶️ Playing' : '⏸️ Stopped'}</div>
                      <div>Total Active Steps: {tracks.reduce((sum, track) => sum + track.steps.filter(Boolean).length, 0)}</div>
                      {userSnapshot && (
                        <div className="mt-2 pt-2 border-t border-[var(--app-card-border)]">
                          <div className="text-xs font-medium mb-1">🎵 Generated from your data:</div>
                          <div>• Followers: {userSnapshot.farcaster.followerCount || 0}</div>
                          <div>• Transactions: {userSnapshot.onchain.transactionCount || 0}</div>
                          <div>• Tokens: {userSnapshot.onchain.tokenCount || 0}</div>
                          <div>• NFTs: {userSnapshot.onchain.nftCount || 0}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
