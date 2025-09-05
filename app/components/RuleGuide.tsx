"use client";

import React from "react";

export interface MusicalConcept {
  id: number;
  title: string;
  essence: string;
  color: string;
  unlocked: boolean;
  explored: boolean;
  icon: string;
  visualHint: string;
}

// SVG Icon Components
// const PulseIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <circle cx="6" cy="12" r="2" fill="currentColor"/>
//     <circle cx="12" cy="12" r="2" fill="currentColor"/>
//     <circle cx="18" cy="12" r="2" fill="currentColor"/>
//   </svg>
// );

// const SyncopationIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <circle cx="4" cy="12" r="2" fill="currentColor"/>
//     <circle cx="10" cy="8" r="1.5" fill="currentColor" opacity="0.6"/>
//     <circle cx="14" cy="16" r="1.5" fill="currentColor" opacity="0.6"/>
//     <circle cx="20" cy="12" r="2" fill="currentColor"/>
//   </svg>
// );

// const KickIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <rect x="4" y="16" width="3" height="6" rx="1" fill="currentColor"/>
//     <rect x="10" y="10" width="3" height="12" rx="1" fill="currentColor"/>
//     <rect x="16" y="14" width="3" height="8" rx="1" fill="currentColor"/>
//   </svg>
// );

// const BassIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <path d="M2 12c0 0 4-4 8-4s8 4 8 4-4 4-8 4-8-4-8-4z" fill="currentColor" opacity="0.3"/>
//     <path d="M6 12c0 0 2-2 4-2s4 2 4 2-2 2-4 2-4-2-4-2z" fill="currentColor"/>
//   </svg>
// );

// const DrumMachineIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
//     <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
//     <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
//     <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
//     <rect x="6" y="13" width="4" height="2" fill="currentColor" opacity="0.6"/>
//     <rect x="14" y="13" width="4" height="2" fill="currentColor" opacity="0.6"/>
//   </svg>
// );

// const LayersIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
//     <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
//     <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
//   </svg>
// );

// const PolyrhythmIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
//     <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
//     <circle cx="12" cy="12" r="2" fill="currentColor"/>
//     <line x1="12" y1="4" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
//     <line x1="20" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
//     <line x1="12" y1="20" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
//   </svg>
// );

// const FilterIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <path d="M2 6h20l-8 8v6l-4-2v-4L2 6z" fill="currentColor"/>
//     <path d="M8 14l8-8" stroke="white" strokeWidth="1" opacity="0.8"/>
//   </svg>
// );

// const TensionIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <path d="M3 12h4l2-6 4 12 2-6 4-6 2 6h3" stroke="currentColor" strokeWidth="2" fill="none"/>
//     <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
//   </svg>
// );

// const SparkleIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
//     <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill="currentColor"/>
//     <path d="M20 4l0.5 1.5L22 6l-1.5 0.5L20 8l-0.5-1.5L18 6l1.5-0.5L20 4z" fill="currentColor" opacity="0.6"/>
//     <path d="M6 18l0.5 1.5L8 20l-1.5 0.5L6 22l-0.5-1.5L4 20l1.5-0.5L6 18z" fill="currentColor" opacity="0.6"/>
//   </svg>
// );

// const iconComponents = {
//   1: PulseIcon,
//   2: SyncopationIcon,
//   3: KickIcon,
//   4: BassIcon,
//   5: DrumMachineIcon,
//   6: LayersIcon,
//   7: PolyrhythmIcon,
//   8: FilterIcon,
//   9: TensionIcon,
//   10: SparkleIcon,
// };

const MUSICAL_CONCEPTS: MusicalConcept[] = [
  {
    id: 1,
    title: "The Pulse",
    essence: "steady heartbeat",
    color: "#ff6b6b",
    unlocked: true,
    explored: false,
    icon: "💓",
    visualHint: "tap your foot"
  },
  {
    id: 2,
    title: "Syncopation", 
    essence: "rhythmic surprise",
    color: "#4ecdc4",
    unlocked: true,
    explored: false,
    icon: "⚡",
    visualHint: "off-beat accent"
  },
  {
    id: 3,
    title: "Kick Power",
    essence: "foundation energy",
    color: "#45b7d1",
    unlocked: true,
    explored: false,
    icon: "🥁",
    visualHint: "four on floor"
  },
  {
    id: 4,
    title: "Low Rumble",
    essence: "bass foundation",
    color: "#96ceb4",
    unlocked: true,
    explored: false,
    icon: "🌊",
    visualHint: "feel the vibration"
  },
  {
    id: 5,
    title: "909 Flavor",
    essence: "classic textures",
    color: "#feca57",
    unlocked: false,
    explored: false,
    icon: "🎛️",
    visualHint: "iconic sounds"
  },
  {
    id: 6,
    title: "Layer Magic",
    essence: "sound conversation",
    color: "#ff9ff3",
    unlocked: false,
    explored: false,
    icon: "🎭",
    visualHint: "elements interact"
  },
  {
    id: 7,
    title: "Poly Rhythm",
    essence: "dancing cycles",
    color: "#54a0ff",
    unlocked: false,
    explored: false,
    icon: "🌀",
    visualHint: "3 against 4"
  },
  {
    id: 8,
    title: "Filter Flow",
    essence: "sculpting sound",
    color: "#5f27cd",
    unlocked: false,
    explored: false,
    icon: "🎚️",
    visualHint: "frequency sweep"
  },
  {
    id: 9,
    title: "Groove Tease",
    essence: "tension & release",
    color: "#00d2d3",
    unlocked: false,
    explored: false,
    icon: "🎢",
    visualHint: "hold back, then give"
  },
  {
    id: 10,
    title: "Your Voice",
    essence: "personal expression",
    color: "#ff6348",
    unlocked: false,
    explored: false,
    icon: "✨",
    visualHint: "make it yours"
  },
];

interface RuleGuideProps {
  currentConcept: number;
  onConceptChange: (conceptId: number) => void;
  concepts: MusicalConcept[];
  onMarkExplored: (conceptId: number) => void;
  onProgressToNext?: () => void;
  className?: string;
}

export function RuleGuide({ 
  currentConcept, 
  onConceptChange, 
  concepts, 
  onMarkExplored,
  onProgressToNext,
  className = "" 
}: RuleGuideProps) {
  const activeConcept = concepts.find(c => c.id === currentConcept) || concepts[0];
  const canProgressToNext = currentConcept < concepts.length;
  const canGoBack = currentConcept > 1;

  const progressToNext = () => {
    if (!canProgressToNext) return;
    if (onProgressToNext) {
      onProgressToNext();
    } else {
      onMarkExplored(currentConcept);
      onConceptChange(currentConcept + 1);
    }
  };

  const goToPrevious = () => {
    if (!canGoBack) return;
    onConceptChange(currentConcept - 1);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Visual Progress */}
      <div className="flex justify-center gap-3 mb-8">
        {concepts.map((concept) => (
          <button
            key={concept.id}
            onClick={() => concept.unlocked && onConceptChange(concept.id)}
            className={`w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center text-lg ${
              concept.id === currentConcept
                ? 'scale-110 shadow-lg'
                : concept.explored
                ? 'opacity-60 hover:opacity-80'
                : concept.unlocked
                ? 'opacity-40 hover:opacity-60'
                : 'opacity-20'
            }`}
            style={{
              backgroundColor: concept.id === currentConcept ? concept.color : 
                              concept.explored ? concept.color : 
                              concept.unlocked ? `${concept.color}40` : 
                              `${concept.color}20`,
              color: concept.id === currentConcept ? 'white' : concept.color
            }}
            disabled={!concept.unlocked}
          >
            <span className="text-lg">{concept.icon}</span>
          </button>
        ))}
      </div>

      {/* Current Concept */}
      <div 
        className="text-center mb-8 p-8 rounded-2xl transition-all duration-500"
        style={{ 
          backgroundColor: `${activeConcept.color}08`,
          border: `2px solid ${activeConcept.color}20`
        }}
      >
        {/* Icon & Title */}
        <div className="mb-6">
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg text-3xl"
            style={{ backgroundColor: activeConcept.color }}
          >
            {activeConcept.icon}
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: activeConcept.color }}>
            {activeConcept.title}
          </h2>
          <p className="text-[var(--app-foreground-muted)] text-lg">
            {activeConcept.essence}
          </p>
        </div>

        {/* Visual Hint */}
        <div className="mb-8">
          <div 
            className="inline-block px-4 py-2 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: `${activeConcept.color}15`,
              color: activeConcept.color
            }}
          >
            {activeConcept.visualHint}
          </div>
        </div>

        {/* Simple Navigation */}
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button
            onClick={goToPrevious}
            disabled={!canGoBack}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              canGoBack 
                ? 'bg-[var(--app-background)] hover:bg-[var(--app-background-hover)] text-[var(--app-foreground)]' 
                : 'opacity-30 cursor-not-allowed text-[var(--app-foreground-muted)]'
            }`}
          >
            ←
          </button>

          <div className="text-center">
            <div className="text-xs text-[var(--app-foreground-muted)] mb-1">
              {currentConcept} of {concepts.length}
            </div>
            <div className="text-sm text-[var(--app-foreground-muted)]">
              try it below ↓
            </div>
          </div>

          <button
            onClick={progressToNext}
            disabled={!canProgressToNext}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all font-medium ${
              canProgressToNext
                ? 'text-white shadow-lg hover:scale-105'
                : 'opacity-30 cursor-not-allowed bg-[var(--app-background)] text-[var(--app-foreground-muted)]'
            }`}
            style={{
              backgroundColor: canProgressToNext ? activeConcept.color : undefined
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export { MUSICAL_CONCEPTS }; 