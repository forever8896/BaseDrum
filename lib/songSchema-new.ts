import { z } from 'zod';

/**
 * Zod validation schema for BaseDrum song format (basedrum-v1)
 * 
 * This schema validates the complete JSON structure for BaseDrum songs,
 * ensuring data integrity and preventing runtime errors during import/export.
 */

/**
 * Common validation patterns and constraints
 */
export const VALIDATION_CONSTRAINTS = {
  BPM_MIN: 60,
  BPM_MAX: 200,
  BARS_MIN: 1,
  BARS_MAX: 128, // Increased from 64 to support longer Detroit compositions
  STEPS_MIN: 16,
  STEPS_MAX: 2048, // Increased from 128 to support full arrangements (128 bars * 16 steps)
  STEP_MIN: 0,
  STEP_MAX: 2047, // Increased from 127 to match STEPS_MAX - 1
  VELOCITY_MIN: 0,
  VELOCITY_MAX: 1,
  FREQ_MIN: 20,
  FREQ_MAX: 20000,
  EFFECT_MIN: 0,
  EFFECT_MAX: 1,
  REVERB_DECAY_MAX: 10,
  SUPPORTED_FORMATS: ['basedrum-v1'] as const,
} as const;

// Track data validation schema
export const TrackDataSchema = z.object({
  // Pattern: Array of step numbers where instrument triggers (0-2047)
  pattern: z.array(z.number().int().min(VALIDATION_CONSTRAINTS.STEP_MIN).max(VALIDATION_CONSTRAINTS.STEP_MAX)),
  
  // Notes: Note values for melodic tracks (optional, indexed by step)
  notes: z.array(z.string()).optional(),
  
  // Velocity: Per-step velocity values (optional, 0-1 range)
  velocity: z.array(z.number().min(0).max(1)).optional(),
  
  // Ghost notes: Softer hit steps (optional, 0-2047 range)
  ghostNotes: z.array(z.number().int().min(VALIDATION_CONSTRAINTS.STEP_MIN).max(VALIDATION_CONSTRAINTS.STEP_MAX)).optional(),
  
  // Mute state: Boolean indicating if track is muted
  muted: z.boolean(),
  
  // Volume: Track volume in decibels
  volume: z.number(),
  
  // Synthesis: Complete synthesizer parameters (optional, for save/load)
  synthesis: z.any().optional(),
});

// Main song data validation schema
export const SongDataSchema = z.object({
  // Song metadata
  metadata: z.object({
    title: z.string().min(1, "Title cannot be empty"),
    artist: z.string().min(1, "Artist cannot be empty"),
    version: z.string(),
    created: z.string(), // ISO timestamp
    bpm: z.number().int().min(VALIDATION_CONSTRAINTS.BPM_MIN, "BPM must be at least 60").max(VALIDATION_CONSTRAINTS.BPM_MAX, "BPM cannot exceed 200"),
    bars: z.number().int().min(VALIDATION_CONSTRAINTS.BARS_MIN, "Must have at least 1 bar").max(VALIDATION_CONSTRAINTS.BARS_MAX, "Cannot exceed 128 bars"),
    steps: z.number().int().min(VALIDATION_CONSTRAINTS.STEPS_MIN, "Must have at least 16 steps").max(VALIDATION_CONSTRAINTS.STEPS_MAX, "Cannot exceed 2048 steps"),
    format: z.string().refine(val => val === "basedrum-v1", {
      message: "Format must be 'basedrum-v1'"
    }),
  }),
  
  // Effects chain settings
  effects: z.object({
    filter: z.object({
      cutoff: z.number().min(0).max(1),
      type: z.string(),
      startFreq: z.number().min(20).max(20000),
      endFreq: z.number().min(20).max(20000),
    }),
    reverb: z.object({
      wet: z.number().min(0).max(1),
      roomSize: z.number().min(0).max(1),
      decay: z.number().min(0).max(10),
    }),
  }),
  
  // Track definitions (record of track name to track data)
  tracks: z.record(z.string(), TrackDataSchema),
  
  // Arrangement sections (optional)
  arrangement: z.record(z.string(), z.object({
    bars: z.array(z.number().int().min(1).max(VALIDATION_CONSTRAINTS.BARS_MAX)),
    activeTracks: z.union([
      z.array(z.string()), 
      z.literal("all")
    ]),
  })).optional(),
});

// Type exports for TypeScript usage
export type TrackData = z.infer<typeof TrackDataSchema>;
export type SongData = z.infer<typeof SongDataSchema>;

/**
 * Validates song data against the BaseDrum schema
 * @param data - Raw data to validate
 * @returns Validated song data
 * @throws ZodError if validation fails
 */
export function validateSongData(data: unknown): SongData {
  return SongDataSchema.parse(data);
}

/**
 * Safely validates song data, returning result with error info
 * @param data - Raw data to validate
 * @returns Success result with data or failure with error
 */
export function safeParseSongData(data: unknown): {
  success: true;
  data: SongData;
} | {
  success: false;
  error: z.ZodError;
} {
  const result = SongDataSchema.safeParse(data);
  return result;
}

/**
 * Validates and formats a JSON string as BaseDrum song data
 * @param jsonString - JSON string to parse and validate
 * @returns Validated song data
 * @throws Error for JSON parsing issues or ZodError for validation issues
 */
export function importSongFromJSON(jsonString: string): SongData {
  try {
    const parsed = JSON.parse(jsonString);
    return validateSongData(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error; // Re-throw validation errors as-is
  }
}

/**
 * Interface for Detroit pattern generation output
 */
interface DetroitPatternData {
  tracks: Partial<Record<string, TrackData>>;
  style: {
    name: string;
    description: string;
    tempo: number;
    key: string;
    scale: string;
    leadPreset: string;
  };
  effects: {
    filterCutoff: number;
    reverbWet: number;
  };
  volumes: Record<string, number>;
}

/**
 * Converts Detroit pattern generation output to SongData format
 * @param detroitData - Generated Detroit pattern data
 * @returns Complete SongData object conforming to basedrum-v1 format
 */
export function convertDetroitToSongData(detroitData: DetroitPatternData): SongData {
  const { tracks, style, effects, volumes } = detroitData;
  
  // Calculate total bars and steps from the generated tracks
  const maxSteps = Math.max(
    ...Object.values(tracks).map(track => 
      track?.pattern ? Math.max(...track.pattern) + 1 : 0
    )
  );
  const totalBars = Math.max(8, Math.min(VALIDATION_CONSTRAINTS.BARS_MAX, Math.ceil(maxSteps / 16))); // Within schema limits
  const totalSteps = Math.max(VALIDATION_CONSTRAINTS.STEPS_MIN, Math.min(VALIDATION_CONSTRAINTS.STEPS_MAX, maxSteps)); // Within schema limits
  
  // Convert filter cutoff (Hz) to normalized 0-1 range for schema
  const filterCutoffNormalized = Math.max(0, Math.min(1, 
    (effects.filterCutoff - VALIDATION_CONSTRAINTS.FREQ_MIN) / 
    (VALIDATION_CONSTRAINTS.FREQ_MAX - VALIDATION_CONSTRAINTS.FREQ_MIN)
  ));
  
  // Create arrangement sections based on Detroit track structure
  const arrangement = {
    intro: {
      bars: [1, 2, 3, 4],
      activeTracks: ["kick", "pulse"] as string[]
    },
    buildup1: {
      bars: [5, 6, 7, 8],
      activeTracks: ["kick", "pulse", "hihat909"] as string[]
    },
    buildup2: {
      bars: [9, 10, 11, 12, 13, 14, 15, 16],
      activeTracks: ["kick", "pulse", "hihat909", "bass"] as string[]
    },
    buildup3: {
      bars: [17, 18, 19, 20],
      activeTracks: ["kick", "hihat909", "bass", "lead"] as string[]
    },
    breakdown1: {
      bars: [21, 22],
      activeTracks: ["kick", "bass"] as string[]
    },
    rebuild1: {
      bars: [23, 24],
      activeTracks: ["kick", "hihat909", "bass", "lead"] as string[]
    },
    peak1: {
      bars: [25, 26],
      activeTracks: "all" as "all"
    },
    breakdown2: {
      bars: [27, 28],
      activeTracks: ["kick", "lead"] as string[]
    },
    peak2: {
      bars: Array.from({ length: Math.max(4, totalBars - 28) }, (_, i) => i + 29),
      activeTracks: "all" as "all"
    }
  };
  
  // Define valid track names for the schema (include pulse for foundation rhythm)
  const validTrackNames = ['kick', 'hihat', 'hihat909', 'bass', 'lead', 'snare', 'rumble', 'ride', 'clap', 'acid', 'pulse'];
  
  // Ensure all tracks have proper TrackData structure with valid step ranges
  const validatedTracks: Record<string, TrackData> = {};
  Object.entries(tracks).forEach(([trackName, track]) => {
    // Skip tracks that aren't standard instruments (like 'pulse')
    if (!validTrackNames.includes(trackName)) {
      return;
    }
    if (track && track.pattern && track.pattern.length > 0) {
      validatedTracks[trackName] = {
        pattern: track.pattern,
        notes: track.notes,
        velocity: track.velocity,
        ghostNotes: track.ghostNotes,
        muted: track.muted ?? false,
        volume: volumes[trackName] ?? -10,
        synthesis: undefined // Will be populated by instrument factory if needed
      };
    }
  });
  
  const songData: SongData = {
    metadata: {
      title: `${style.name} - Detroit Generation`,
      artist: "OwenUI Industries",
      version: "1.0.0",
      created: new Date().toISOString(),
      bpm: Math.max(VALIDATION_CONSTRAINTS.BPM_MIN, 
            Math.min(VALIDATION_CONSTRAINTS.BPM_MAX, style.tempo)),
      bars: Math.max(VALIDATION_CONSTRAINTS.BARS_MIN,
             Math.min(VALIDATION_CONSTRAINTS.BARS_MAX, totalBars)),
      steps: Math.max(VALIDATION_CONSTRAINTS.STEPS_MIN,
              Math.min(VALIDATION_CONSTRAINTS.STEPS_MAX, totalSteps)),
      format: "basedrum-v1"
    },
    effects: {
      filter: {
        cutoff: filterCutoffNormalized,
        type: "lowpass",
        startFreq: effects.filterCutoff,
        endFreq: effects.filterCutoff
      },
      reverb: {
        wet: Math.max(0, Math.min(1, effects.reverbWet)),
        roomSize: 0.7, // Default room size
        decay: 2.0 // Default decay time
      }
    },
    tracks: validatedTracks,
    arrangement: arrangement
  };
  
  return songData;
}