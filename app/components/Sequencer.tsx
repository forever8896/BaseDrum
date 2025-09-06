"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { audioEngine } from "../../lib/audio-engine";
import { ThemeSwitcher } from "./ThemeProvider";
import { RuleGuide, MUSICAL_CONCEPTS, MusicalConcept } from "./RuleGuide";
import { DataDisplay } from "./DataDisplay";
import { DataFetcher, UserDataSnapshot } from "../../lib/data-fetcher";

interface Rule {
  id: number;
  name: string;
  description: string;
  instruction: string;
  color: string;
  unlocked: boolean;
  completed: boolean;
}

interface Track {
  id: string;
  name: string;
  steps: boolean[];
  volume: number;
  effects: Record<string, number>;
}

const TECHNO_RULES: Rule[] = [
  {
    id: 1,
    name: "The Pulse",
    description: "down up down up down up down up",
    instruction: "Start with the basic pulse - the foundation of all techno",
    color: "#ff6b6b",
    unlocked: true,
    completed: false,
  },
  {
    id: 2,
    name: "Syncopation", 
    description: "patterns that pull against the main pulse",
    instruction: "Add syncopation - make them want to shake their body",
    color: "#4ecdc4",
    unlocked: false,
    completed: false,
  },
  {
    id: 3,
    name: "Kicks",
    description: "four on the floor or playful",
    instruction: "Add your kicks - go hard or go deep",
    color: "#45b7d1",
    unlocked: false,
    completed: false,
  },
  {
    id: 4,
    name: "Fill the Lows",
    description: "give your kick something to bounce off",
    instruction: "Add rumble, toms, or bass to fill the low end",
    color: "#96ceb4",
    unlocked: false,
    completed: false,
  },
  {
    id: 5,
    name: "909 Elements",
    description: "classic drum machine textures",
    instruction: "Add that classic 909 flavor",
    color: "#feca57",
    unlocked: false,
    completed: false,
  },
  {
    id: 6,
    name: "Combine Elements",
    description: "bring it all together",
    instruction: "Combine all elements to have a good time",
    color: "#ff9ff3",
    unlocked: false,
    completed: false,
  },
  {
    id: 7,
    name: "Poly Meter",
    description: "phrases too long or too short",
    instruction: "Break the grid - add polyrhythmic elements",
    color: "#54a0ff",
    unlocked: false,
    completed: false,
  },
  {
    id: 8,
    name: "Fullness & Filters",
    description: "fill things, filter things, build things",
    instruction: "Play with fullness - build then bring back to emptiness",
    color: "#5f27cd",
    unlocked: false,
    completed: false,
  },
  {
    id: 9,
    name: "Hold Back & Tease",
    description: "don't be afraid to hold back",
    instruction: "Articulate the groove - this is physical music",
    color: "#00d2d3",
    unlocked: false,
    completed: false,
  },
  {
    id: 10,
    name: "Remember to Dance",
    description: "pulses and syncopations over time",
    instruction: "Dance - our existence is pulses and syncopations",
    color: "#ff6348",
    unlocked: false,
    completed: false,
  },
];

export function Sequencer({ className = "" }: { className?: string }) {
  const { context } = useMiniKit();
  const { address } = useAccount();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [rules, setRules] = useState<Rule[]>(TECHNO_RULES);
  const [currentRule, setCurrentRule] = useState(1);
  const [musicalConcepts, setMusicalConcepts] = useState<MusicalConcept[]>(MUSICAL_CONCEPTS);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [userSnapshot, setUserSnapshot] = useState<UserDataSnapshot | null>(null);
  const [musicInterpretation, setMusicInterpretation] = useState<Record<string, string | number> | null>(null);
  const [showDataDisplay, setShowDataDisplay] = useState(false);
  const [dataFetcher] = useState(() => new DataFetcher());
  // const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tracks based on rules
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "pulse",
      name: "Pulse",
      steps: new Array(16).fill(false),
      volume: 0.8,
      effects: {},
    },
  ]);

  const tracksRef = useRef(tracks);
  const currentRuleRef = useRef(currentRule);

  // const activeRule = rules.find(r => r.id === currentRule);
  // const currentTrack = tracks.find(t => t.id === getRuleTrackId(currentRule));
  const canProgressToNext = currentRule < 10;
  // const canGoBack = currentRule > 1;

  // Get tracks that should be visible (created tracks up to current rule)
  const visibleTracks = tracks.filter(track => {
    const trackRule = rules.find(r => getRuleTrackId(r.id) === track.id);
    return trackRule && trackRule.id <= currentRule;
  });

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioEngine.initialize();
        setAudioInitialized(true);
        
        // Create initial track
        audioEngine.createTrack("pulse", 1);
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

  // Keep refs updated with current state
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    currentRuleRef.current = currentRule;
  }, [currentRule]);

  const toggleStep = async (trackId: string, stepIndex: number) => {
    // Toggle the step
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, steps: track.steps.map((step, i) => i === stepIndex ? !step : step) }
        : track
    ));

    // Fetch and display user data when step is clicked
    await fetchUserData();
  };

  const fetchUserData = async () => {
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
  };

  function getRuleTrackId(ruleId: number): string {
    const trackMap: Record<number, string> = {
      1: "pulse",
      2: "syncopation", 
      3: "kicks",
      4: "bass",
      5: "drums909",
      6: "combined",
      7: "polymeter",
      8: "filters",
      9: "groove",
      10: "dance"
    };
    return trackMap[ruleId] || "pulse";
  }

  const progressToNextRule = async () => {
    if (!canProgressToNext) return;

    setIsTransitioning(true);
    
    // Mark current rule as completed
    setRules(prev => prev.map(rule => 
      rule.id === currentRule ? { ...rule, completed: true } : rule
    ));

    // Mark current concept as explored
    setMusicalConcepts(prev => prev.map(concept => 
      concept.id === currentRule ? { ...concept, explored: true } : concept
    ));

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));

    // Move to next rule
    const nextRuleId = currentRule + 1;
    setCurrentRule(nextRuleId);

    // Unlock next rule and add its track
    setRules(prev => prev.map(rule => 
      rule.id === nextRuleId ? { ...rule, unlocked: true } : rule
    ));

    // Unlock next concept
    setMusicalConcepts(prev => prev.map(concept => 
      concept.id === nextRuleId ? { ...concept, unlocked: true } : concept
    ));

    addTrackForRule(nextRuleId);

    // Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTransitioning(false);
  };

  // const goToPreviousRule = async () => {
  //   if (!canGoBack) return;

  //   setIsTransitioning(true);
  //   await new Promise(resolve => setTimeout(resolve, 300));
  //   
  //   setCurrentRule(currentRule - 1);
  //   
  //   await new Promise(resolve => setTimeout(resolve, 500));
  //   setIsTransitioning(false);
  // };

  const addTrackForRule = (ruleId: number) => {
    const trackId = getRuleTrackId(ruleId);
    const trackNames: Record<string, string> = {
      syncopation: "Syncopation",
      kicks: "Kicks", 
      bass: "Bass/Rumble",
      drums909: "909 Drums",
      combined: "Combined",
      polymeter: "Poly Meter",
      filters: "Filters",
      groove: "Groove",
      dance: "Dance"
    };

    if (!tracks.find(t => t.id === trackId)) {
      const newTrack: Track = {
        id: trackId,
        name: trackNames[trackId] || `Rule ${ruleId}`,
        steps: new Array(16).fill(false),
        volume: 0.8,
        effects: getRuleEffects(ruleId),
      };
      setTracks(prev => [...prev, newTrack]);

      // Create audio track
      if (audioInitialized) {
        audioEngine.createTrack(trackId, ruleId);
      }
    }
  };

  const getRuleEffects = (ruleId: number): Record<string, number> => {
    const effectsMap: Record<number, Record<string, number>> = {
      2: { syncopation: 0.5 },
      3: { punch: 0.7, drive: 0.6 },
      4: { lowEnd: 0.8, rumble: 0.5 },
      5: { classic: 0.6, vintage: 0.7 },
      8: { filter: 0.5, resonance: 0.3, fullness: 0.6 },
      9: { groove: 0.7, swing: 0.4 },
    };
    return effectsMap[ruleId] || {};
  };

  const initializeAudio = async () => {
    if (!audioInitialized) {
      try {
        await audioEngine.initialize();
        setAudioInitialized(true);
        
        // Create audio tracks for all visible tracks
        visibleTracks.forEach(track => {
          const ruleId = rules.find(r => getRuleTrackId(r.id) === track.id)?.id || 1;
          audioEngine.createTrack(track.id, ruleId);
          audioEngine.updateTrackVolume(track.id, track.volume);
          
          // Apply effects
          Object.entries(track.effects).forEach(([effect, value]) => {
            audioEngine.updateTrackEffect(track.id, effect, value);
          });
        });
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    }
  };

  const togglePlayback = async () => {
    // Initialize audio on first play
    if (!audioInitialized) {
      await initializeAudio();
    }

    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  const play = () => {
    if (!audioInitialized) return;

    setIsPlaying(true);
    setCurrentStep(0);
    
    // Use audio engine for playback with callback to get real-time track data
    audioEngine.startSequence(() => {
      // Get the absolute current state from refs (real-time)
      const currentTracks = [...tracksRef.current];
      const currentRuleValue = currentRuleRef.current;
      
      return currentTracks.filter(track => {
        const trackRule = rules.find(r => getRuleTrackId(r.id) === track.id);
        return trackRule && trackRule.id <= currentRuleValue;
      });
    }, tempo, (step: number) => {
      setCurrentStep(step);
    });
  };

  const stop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    
    if (audioInitialized) {
      audioEngine.stopSequence();
    }
  };

  const updateTrackVolume = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
    
    if (audioInitialized) {
      audioEngine.updateTrackVolume(trackId, volume);
    }
  };

  const updateTrackEffect = (trackId: string, effect: string, value: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, effects: { ...track.effects, [effect]: value } }
        : track
    ));
    
    if (audioInitialized) {
      audioEngine.updateTrackEffect(trackId, effect, value);
    }
  };

  const clearCurrentTrack = () => {
    const trackId = getRuleTrackId(currentRule);
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, steps: new Array(16).fill(false) }
        : track
    ));
  };

  const handleConceptChange = (conceptId: number) => {
    setCurrentRule(conceptId);
    
    // Unlock this concept if it's not already
    setMusicalConcepts(prev => prev.map(concept => 
      concept.id === conceptId ? { ...concept, unlocked: true } : concept
    ));
    
    // Unlock corresponding rule
    setRules(prev => prev.map(rule => 
      rule.id === conceptId ? { ...rule, unlocked: true } : rule
    ));
    
    // Ensure track exists for this concept
    addTrackForRule(conceptId);
  };

  const handleMarkExplored = (conceptId: number) => {
    setMusicalConcepts(prev => prev.map(concept => 
      concept.id === conceptId ? { ...concept, explored: true } : concept
    ));
  };

  return (
    <div className={`w-full max-w-5xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-end mb-4">
          <ThemeSwitcher />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-[var(--app-foreground)] mb-3 tracking-tight">
            basedr<svg 
              className="inline-block w-6 h-6 mx-1" 
              viewBox="0 0 16 16" 
              style={{ marginBottom: '2px' }}
            >
              <rect 
                width="16" 
                height="16" 
                rx="1.6" 
                fill="var(--app-accent)"
              />
            </svg>m
          </h1>
          <p className="text-[var(--app-foreground-muted)] mb-4 text-base">
            learn the 10 rules of techno
          </p>
          {!audioInitialized && (
            <p className="text-xs text-[var(--app-foreground-muted)]">
              click play to initialize audio
            </p>
          )}
        </div>
      </div>

      {/* Musical Concept Guide */}
      <RuleGuide 
        currentConcept={currentRule}
        onConceptChange={handleConceptChange}
        concepts={musicalConcepts}
        onMarkExplored={handleMarkExplored}
        onProgressToNext={progressToNextRule}
        className="mb-8"
      />

      {/* Controls */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="flex items-center gap-4">
          <label className="text-[var(--app-foreground)] font-medium text-sm">
            tempo
          </label>
          <input
            type="range"
            min="60"
            max="200"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-32 h-2 slider focus-base"
          />
          <span className="text-[var(--app-foreground)] font-mono text-sm min-w-[3rem]">
            {tempo}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={togglePlayback}
            className={`btn-base px-6 py-2 text-sm font-medium ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "btn-primary"
            }`}
          >
            {isPlaying ? "stop" : "play"}
          </button>
          <button
            onClick={clearCurrentTrack}
            className="btn-base btn-secondary px-4 py-2 text-sm"
          >
            clear
          </button>
          <button
            onClick={fetchUserData}
            className="btn-base px-4 py-2 text-sm font-medium bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)]"
          >
            show data
          </button>
        </div>
      </div>

      {/* Step Numbers */}
      <div className="flex mb-3 pl-24">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className="flex-1 text-center text-xs text-[var(--app-foreground-muted)] font-mono"
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* All Visible Tracks */}
      <div className="space-y-4">
        {visibleTracks.map((track) => {
          const rule = rules.find(r => getRuleTrackId(r.id) === track.id);
          const isCurrentTrack = track.id === getRuleTrackId(currentRule);
          
          return (
            <div 
              key={track.id}
              className={`transition-all duration-500 ${
                isTransitioning ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'
              } ${
                isCurrentTrack ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className="w-20 text-right pr-4">
                  <div 
                    className={`text-sm font-medium ${isCurrentTrack ? 'font-semibold' : ''}`}
                    style={{ color: rule?.color || 'var(--app-foreground)' }}
                  >
                    {track.name.toLowerCase()}
                  </div>
                  {rule && (
                    <div className="text-xs text-[var(--app-foreground-muted)]">
                      rule {rule.id}
                      {rule.completed && " ✓"}
                    </div>
                  )}
                </div>
                
                {/* Volume Control */}
                <div className="w-16 mr-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={track.volume}
                    onChange={(e) => updateTrackVolume(track.id, Number(e.target.value))}
                    className="w-full h-1 slider-small focus-base"
                  />
                </div>

                {/* Step Grid */}
                <div className="flex-1 relative">
                  <div className="relative card-base p-4">
                    {/* Steps */}
                    <div className="flex gap-1">
                      {track.steps.map((active, stepIndex) => (
                        <button
                          key={stepIndex}
                          onClick={() => toggleStep(track.id, stepIndex)}
                          disabled={!isCurrentTrack}
                          className={`flex-1 h-8 step-button ${
                            active ? "shadow-sm" : ""
                          } ${
                            currentStep === stepIndex && isPlaying
                              ? "ring-2 ring-red-500 ring-opacity-80"
                              : ""
                          } ${
                            !isCurrentTrack ? "cursor-default opacity-70" : "focus-base"
                          }`}
                          style={{
                            backgroundColor: active 
                              ? rule?.color || 'var(--app-accent)'
                              : 'var(--app-background)',
                            borderColor: rule?.color || 'var(--app-card-border)',
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-sm mx-auto my-auto transition-all duration-150"
                            style={{
                              backgroundColor: active 
                                ? 'white' 
                                : rule?.color || 'var(--app-foreground-muted)',
                              opacity: active ? 1 : 0.4
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Effects Controls for Current Track */}
              {isCurrentTrack && Object.keys(track.effects).length > 0 && (
                <div className="ml-24 mb-3">
                  <div className="flex gap-6 text-sm">
                    {Object.entries(track.effects).map(([effect, value]) => (
                      <div key={effect} className="flex items-center gap-3">
                        <label className="text-[var(--app-foreground-muted)] font-medium min-w-[4rem] text-xs">
                          {effect}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={value}
                          onChange={(e) => updateTrackEffect(track.id, effect, Number(e.target.value))}
                          className="w-20 h-1 slider-small focus-base"
                        />
                        <span className="text-[var(--app-foreground-muted)] font-mono w-8 text-xs">
                          {Math.round(value * 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>



      {/* Data Display */}
      {showDataDisplay && (
        <div className="mt-8">
          <DataDisplay 
            snapshot={userSnapshot}
            musicInterpretation={musicInterpretation}
            onClose={() => setShowDataDisplay(false)}
          />
        </div>
      )}

      {/* Track Summary */}
      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--app-foreground-muted)]">
          tracks: {visibleTracks.length}/10 • 
          steps: {visibleTracks.reduce((sum, track) => sum + track.steps.filter(Boolean).length, 0)}
          {audioInitialized && " • audio ready"}
          {userSnapshot && " • data captured"}
        </p>
      </div>
    </div>
  );
}

export default Sequencer; 