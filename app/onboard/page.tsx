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
import { 
  PatternGenerator, 
  GROOVE_TEMPLATES, 
  PRESET_CONFIGS,
  type PatternConfig,
  type MusicalConfig,
  type KeyType,
  type ScaleType
} from "@/lib/patternGenerator";
// import { convertDetroitToSongData } from "@/lib/songSchema-new";

// Converter function for Detroit pattern data to current SongData format
function convertDetroitToSongData(detroitData: {
  tracks: any;
  style: { name: string; description: string; tempo: number; key: string; scale: string; };
  effects: { filterCutoff: number; reverbWet: number; };
  volumes: Record<string, number>;
}): SongData {
  const { tracks, style, effects, volumes } = detroitData;
  
  // Calculate total bars and steps from the generated tracks
  const maxSteps = Math.max(
    ...Object.values(tracks).map((track: any) => 
      track?.pattern ? Math.max(...track.pattern) + 1 : 0
    )
  );
  const totalBars = Math.max(8, Math.min(128, Math.ceil(maxSteps / 16)));
  const totalSteps = Math.max(16, Math.min(2048, maxSteps));
  
  // Convert tracks to current format
  const convertedTracks: Record<string, any> = {};
  const validTrackNames = ['kick', 'hihat', 'hihat909', 'bass', 'lead', 'snare', 'rumble', 'ride', 'clap', 'acid', 'pulse'];
  
  Object.entries(tracks).forEach(([trackName, track]: [string, any]) => {
    if (validTrackNames.includes(trackName) && track && track.pattern && track.pattern.length > 0) {
      convertedTracks[trackName] = {
        pattern: track.pattern,
        notes: track.notes,
        velocity: track.velocity || Array(totalSteps).fill(0.7),
        ghostNotes: track.ghostNotes,
        muted: false,
        volume: volumes[trackName] ?? -10
      };
    }
  });
  
  return {
    metadata: {
      title: `${style.name} - Detroit Generation`,
      artist: "BaseDrum",
      version: "1.0",
      created: new Date().toISOString(),
      bpm: Math.max(60, Math.min(200, style.tempo)),
      bars: totalBars,
      steps: totalSteps,
      format: "basedrum-v1"
    },
    effects: {
      filter: {
        cutoff: Math.max(0, Math.min(1, (effects.filterCutoff - 20) / (20000 - 20))),
        type: "lowpass",
        startFreq: effects.filterCutoff,
        endFreq: effects.filterCutoff
      },
      reverb: {
        wet: Math.max(0, Math.min(1, effects.reverbWet)),
        roomSize: 0.7,
        decay: 2.0
      }
    },
    tracks: convertedTracks
  };
}

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
  const generatedSongRef = useRef<SongData | null>(null);
  const patternGeneratorRef = useRef<PatternGenerator | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [showFlashText, setShowFlashText] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageTitle, setStageTitle] = useState('');
  const [stageText, setStageText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [leftGauge, setLeftGauge] = useState(0);
  const [rightGauge, setRightGauge] = useState(0);
  const beatCountRef = useRef(0);
  const muteStatesRef = useRef({
    kick: true, // Mute kick initially, pulse will handle the beat
    hihat909: true,
    hihat: true,
    bass: true,
    lead: true,
    snare: true,
    rumble: true,
    ride: true,
    clap: true,
    acid: true,
    pulse: false, // Unmute pulse for initial beat
  });

  // Initialize pattern generator
  useEffect(() => {
    if (!patternGeneratorRef.current) {
      patternGeneratorRef.current = new PatternGenerator(Math.floor(Math.random() * 1000000));
    }
  }, []);

  function createSimplePulse(): SongData {
    // Create simple pulse pattern for stage 0 and 1
    const pulsePattern = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60];
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
        pulse: {
          pattern: pulsePattern,
          velocity: Array(64).fill(0.9),
          muted: false,
          volume: -6
        }
      }
    };
  }

  // Fetch user data for music generation
  const fetchUserDataForMusic = useCallback(async (): Promise<UserDataSnapshot | null> => {
    if (!address) return null;
    
    try {
      const dataFetcher = new DataFetcher();
      // For now, we'll create mock context data - in real implementation this would come from Farcaster
      const mockContext = {
        user: {
          fid: 12345,
          username: 'user',
          followerCount: Math.floor(Math.random() * 1000),
          followingCount: Math.floor(Math.random() * 500)
        }
      };
      
      const userData = await dataFetcher.fetchUserSnapshot(mockContext, address);
      console.log('Fetched user data for music generation:', userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  }, [address]);

  // Generate simplified track based on user blockchain data
  const generateFullTrack = useCallback(async (): Promise<SongData> => {
    const userData = await fetchUserDataForMusic();
    
    // Use the new simplified music generator
    const { SimplifiedMusicGenerator } = await import('@/lib/simplified-music-generator');
    
    const config = SimplifiedMusicGenerator.generateFromUserData(userData);
    const songData = SimplifiedMusicGenerator.configToSongData(config);
    
    console.log("Generated simplified track based on user data:", songData);
    console.log("Generation explanations:", SimplifiedMusicGenerator.getGenerationExplanations(config));
    
    return songData;
  }, [fetchUserDataForMusic]);

  const pulsePattern = useMemo(() => [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60], []);
  const isPulseStep = useCallback((step: number): boolean => {
    // Check if current step matches pulse pattern (quarter notes)
    return pulsePattern.includes(step % 64);
  }, [pulsePattern]);

  // Stage configuration
  const stages = useMemo(() => [
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
  ], []);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    
    // Check for beat hits based on current stage
    let isBeatStep = false;
    
    if (currentStage <= 1) {
      // Stages 0-1: Use simple pulse pattern
      isBeatStep = isPulseStep(step);
    } else if (generatedSongRef.current) {
      // Stages 2+: Use generated track patterns for beat detection
      const songData = generatedSongRef.current;
      isBeatStep = songData.tracks.kick?.pattern.includes(step) || 
                   songData.tracks.pulse?.pattern.includes(step) ||
                   false;
    }
    
    if (isBeatStep) {
      beatCountRef.current += 1;
      
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
  }, [beatCountRef, currentStage, stages, isPulseStep, generatedSongRef]);

  const startAudio = useCallback(async () => {
    if (audioEngineRef.current && !audioStarted) {
      try {
        await audioEngineRef.current.play();
        setAudioStarted(true);
        beatCountRef.current = 0;
        setShowButton(false);
        setCurrentStage(0);
        setStageTitle('');
        setStageText('');
      } catch (error) {
        console.error("Failed to start audio:", error);
      }
    }
  }, [audioEngineRef, audioStarted]);

  // Initialize stage from URL parameter
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam) {
      const stageNumber = parseInt(stageParam, 10);
      if (stageNumber >= 0 && stageNumber < stages.length) {
        setCurrentStage(stageNumber);
        setStageTitle(stages[stageNumber].title);
        setStageText(stages[stageNumber].text);
        
        // If not on initial stage, show button
        if (stageNumber > 0) {
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
  }, [searchParams, isConnected, audioStarted, stages, startAudio]);

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
  }, [handleStepChange]);

  const progressToNextStage = async () => {
    // Handle final stage "Play track" button
    if (currentStage === stages.length - 1) {
      // We're at the final stage - "Play track" should activate the full generated track
      if (generatedSongRef.current && audioEngineRef.current) {
        console.log("Activating full generated track...");
        
        // Seamlessly switch to generated song
        songDataRef.current = generatedSongRef.current;
        
        // Update the sequence length to match the new song (512 steps instead of 64)
        audioEngineRef.current.updateSequenceLength();
        
        // Debug: Check what's actually in the generated tracks
        console.log("Generated track details:");
        Object.entries(generatedSongRef.current.tracks).forEach(([trackName, track]) => {
          console.log(`${trackName}:`, {
            pattern: track.pattern,
            patternLength: track.pattern?.length,
            volume: track.volume,
            muted: track.muted
          });
        });
        
        // Enable all tracks from generated song
        Object.keys(generatedSongRef.current.tracks).forEach(trackName => {
          if (muteStatesRef.current.hasOwnProperty(trackName)) {
            (muteStatesRef.current as any)[trackName] = false;
          }
        });
        
        // Keep pulse enabled since the generated track has its own pulse that sounds like the onboard one
        // muteStatesRef.current.pulse = true; // REMOVED - let the generated pulse play
        
        console.log("Full track activated with tracks:", Object.keys(generatedSongRef.current.tracks));
        console.log("Mute states after activation:", { ...muteStatesRef.current });
        const engineState = audioEngineRef.current.getState();
        console.log("Audio engine state:", {
          isPlaying: engineState.isPlaying,
          currentStep: engineState.currentStep
        });
        
        // Ensure audio engine is still playing after track switch
        if (audioEngineRef.current && !engineState.isPlaying) {
          console.log("Audio engine stopped, restarting...");
          try {
            await audioEngineRef.current.play();
            const newState = audioEngineRef.current.getState();
            console.log("Audio engine restarted successfully, new state:", newState);
          } catch (error) {
            console.error("Failed to restart audio engine:", error);
          }
        } else if (engineState.isPlaying) {
          console.log("Audio engine is already playing, track should switch seamlessly");
        }
        
        // Force a step change callback to verify the new track is being read
        setTimeout(() => {
          const currentState = audioEngineRef.current?.getState();
          console.log("Current song tracks after 1 second:", Object.keys(songDataRef.current.tracks));
          console.log("Sample patterns:", {
            kick: songDataRef.current.tracks.kick?.pattern?.slice(0, 5),
            pulse: songDataRef.current.tracks.pulse?.pattern?.slice(0, 5)
          });
          console.log("Audio engine state after 1 second:", {
            isPlaying: currentState?.isPlaying,
            currentStep: currentState?.currentStep
          });
          console.log("Mute states after 1 second:", { ...muteStatesRef.current });
        }, 1000);
      } else {
        console.error("No generated track available or audio engine not ready");
      }
      return;
    }

    if (currentStage < stages.length - 1) {
      const nextStage = currentStage + 1;
      setIsTransitioning(true);
      
      // Update URL without triggering page reload
      const url = new URL(window.location.href);
      url.searchParams.set('stage', nextStage.toString());
      window.history.pushState({}, '', url.toString());
      
      // Handle stage-specific transitions - keep music playing throughout
      if (nextStage === 1) {
        // Stage 0 -> 1: Keep square large and dancing, continue pulse
        setShowButton(false);
        
        // Ensure pulse continues playing (should already be unmuted)
        muteStatesRef.current.pulse = false;
        muteStatesRef.current.kick = true;
        
        // Ensure audio engine stays playing
        if (audioEngineRef.current && !audioEngineRef.current.getState().isPlaying) {
          audioEngineRef.current.play().catch(console.error);
        }
      } else if (nextStage === 2) {
        // Stage 1 -> 2: Start generating full track while keeping pulse playing
        setIsGenerating(true);
        setShowButton(false);
        
        // Keep pulse playing during generation
        muteStatesRef.current.pulse = false;
        
        // Ensure audio engine stays playing during generation
        if (audioEngineRef.current && !audioEngineRef.current.getState().isPlaying) {
          audioEngineRef.current.play().catch(console.error);
        }
        
        try {
          // Generate full track in background while pulse continues
          const fullTrack = await generateFullTrack();
          generatedSongRef.current = fullTrack;
          console.log("Generated full track:", fullTrack);
          console.log("Generated track keys:", Object.keys(fullTrack.tracks));
          console.log("Sample track patterns:", {
            kick: fullTrack.tracks.kick?.pattern?.slice(0, 10),
            bass: fullTrack.tracks.bass?.pattern?.slice(0, 10)
          });
        } catch (error) {
          console.error("Failed to generate track:", error);
        } finally {
          setIsGenerating(false);
        }
      } else if (nextStage === 3) {
        // Stage 2 -> 3: Prepare for full track transition (actual switch happens on "Play track" click)
        // Keep pulse playing until user clicks "Play track"
        muteStatesRef.current.pulse = false;
        
        // Ensure audio engine stays playing
        if (audioEngineRef.current && !audioEngineRef.current.getState().isPlaying) {
          audioEngineRef.current.play().catch(console.error);
        }
      }
      
      // Fade out current content (audio continues playing)
      setTimeout(() => {
        // Update stage content (no audio interruption)
        setCurrentStage(nextStage);
        setStageTitle(stages[nextStage].title);
        setStageText(stages[nextStage].text);
        
        // Fade in new content
        setTimeout(() => {
          setIsTransitioning(false);
          if (!isGenerating) {
            setShowButton(true);
          }
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
    // Keep square large and dancing throughout all stages for visual continuity
    const baseScale = 1;
    
    // Square pulses with beat on ALL stages - continuous heartbeat
    let shouldPulse = false;
    
    if (audioStarted && beatIntensity > 0) {
      // Get the current playing track data
      const currentSong = songDataRef.current;
      
      if (currentStage <= 2) {
        // Stages 0-2: Use pulse pattern (simple quarter notes)
        shouldPulse = isPulseStep(currentStep);
      } else if (currentStage === 3 && generatedSongRef.current) {
        // Stage 3: Use generated track patterns for more complex rhythm
        const songData = generatedSongRef.current;
        const hasKickHit = songData.tracks.kick?.pattern.includes(currentStep);
        const hasPulseHit = songData.tracks.pulse?.pattern.includes(currentStep);
        const hasSnareHit = songData.tracks.snare?.pattern.includes(currentStep);
        // Pulse on any strong beat element
        shouldPulse = hasKickHit || hasPulseHit || hasSnareHit;
      }
    }
    
    if (shouldPulse) {
      const pulsScale = baseScale * (1 + (beatIntensity * 0.12)); // Slightly more pronounced pulse
      const brightness = 1 + (beatIntensity * 0.4);
      const shadowIntensity = beatIntensity * 20; // Strong glow for large square
      
      return {
        transform: `scale(${pulsScale})`,
        filter: `brightness(${brightness})`,
        boxShadow: `0 0 ${shadowIntensity}px rgba(59, 130, 246, ${beatIntensity * 0.9})`,
        transition: 'transform 0.1s ease-out, filter 0.1s ease-out, box-shadow 0.1s ease-out'
      };
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
            >
              Connect Wallet
            </ConnectWallet>
          </Wallet>
        ) : (
          <>
            {/* Stage Title & Text - Transitioning Content */}
            <div className={`stage-content ${isTransitioning ? 'transitioning' : ''} absolute top-0 left-0 right-0 flex flex-col items-center pt-20 px-6 z-10`}>
              {currentStage > 0 && (
                <div className="flex flex-col items-center space-y-6">
                  <h1 className="stage-title text-5xl text-center max-w-md text-blue-400">
                    {stageTitle}
                  </h1>
                  <p className={`stage-text text-xl text-center text-gray-200 max-w-lg leading-relaxed ${isGenerating ? 'generating' : ''}`}>
                    {isGenerating ? 'Generating your unique Detroit techno track...' : stageText}
                  </p>
                </div>
              )}
            </div>

            {/* Central Pulsating Square - Always Visible, Never Transitions */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="relative">
                <div 
                  className="w-48 h-48 bg-blue-600 rounded-[5%] cursor-pointer hover:bg-blue-700 transition-colors"
                  style={getSquareStyle()}
                  onClick={currentStage === 0 ? () => startAudio() : undefined}
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
            
            {/* Dynamic Button - Fixed Position */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
              <button 
                className="bg-transparent border-2 border-blue-600 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold font-exo disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  opacity: showButton && !isGenerating ? 1 : 0,
                  transition: 'opacity 200ms ease-in, background-color 200ms'
                }}
                onClick={handleCreateTrack}
                disabled={isGenerating}
              >
                {stages[currentStage]?.buttonText}
              </button>
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