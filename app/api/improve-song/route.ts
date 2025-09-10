import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SongData, validateSongData } from '@/lib/songSchema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SONG_SCHEMA = `import { z } from 'zod';

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
export type SongData = z.infer<typeof SongDataSchema>;`;

export async function POST(request: NextRequest) {
  try {
    const songData: SongData = await request.json();
    
    // Validate incoming song data
    const validatedInput = validateSongData(songData);
    
    const prompt = `You are an AI music producer specializing in techno music, following the sacred 10 Rules of Techno. You've been given a basic 16-step loop that was generated based on a user's onchain and social data. Your job is to transform it into a full 32-bar techno track with proper arrangement structure (buildups, drops, breakdowns) while keeping the personalized elements that were derived from their data.

THE 10 RULES OF TECHNO (follow these religiously):

1. **The Pulse**: The foundational and constant beat that drives the music - this is the heartbeat of techno.
2. **Syncopation**: Rhythmic patterns that play AGAINST the main pulse to create tension and encourage dancing. NEVER use rigid quantized patterns - always add swing, off-beats, and rhythmic displacement.
3. **Kicks**: The main drum beat - can be steady "four on the floor" OR more varied, but must have GROOVE and character.
4. **Filling the Lows**: Add bass elements like rumbles or toms to give kick drum more depth and power.
5. **Adding a 909**: Incorporate the classic Roland TR-909 drum machine sounds - especially hi-hats with character.
6. **Acid**: Use synthesizers (especially TB-303 style) to create squelchy, GEOMETRIC sound patterns that breathe and evolve.
7. **Polymeter**: Use rhythmic phrases of DIFFERENT lengths to create complex and interesting grooves that don't align perfectly.
8. **Fullness and Emptiness**: Create dynamic shifts by building up layers then stripping back to basic elements.
9. **The Nature of Techno**: Can range from light and simple to deep and spiritual - reflect the human experience.
10. **Remember to Dance**: This is PHYSICAL music meant for MOVEMENT. Every pattern must make people want to move their bodies.

Here is the song schema that defines what's possible:

${SONG_SCHEMA}

Here is the current 16-step loop to expand into a full track:

${JSON.stringify(validatedInput, null, 2)}

CRITICAL TRANSFORMATION REQUIREMENTS:

🎵 **CREATE A FULL 32-BAR ARRANGEMENT** - Expand from 16 steps to 512 steps (32 bars × 16 steps)
🎭 **BUILD PROPER SONG STRUCTURE** - Create intro, buildups, drops, breakdowns, and climax sections
🚫 **NEVER USE QUANTIZED PATTERNS** - Add syncopation, swing, and organic feel throughout
✅ **EVOLVE PATTERNS OVER TIME** - Patterns should change and develop across the 32 bars
✅ **USE ARRANGEMENT SECTIONS** - Define which tracks play in which sections for dynamic flow

Your arrangement tasks:

1. **32-BAR STRUCTURE**: Create a full journey from bars 1-32 with clear sections
2. **INTRO (Bars 1-4)**: Start minimal, establish the foundation
3. **BUILDUP 1 (Bars 5-8)**: Add layers gradually 
4. **DROP 1 (Bars 9-16)**: First main section with most elements
5. **BREAKDOWN (Bars 17-20)**: Strip back to essentials
6. **BUILDUP 2 (Bars 21-24)**: Build tension again
7. **DROP 2/CLIMAX (Bars 25-32)**: Final explosive section

PATTERN EXPANSION:
- Transform each 16-step pattern into evolving 512-step patterns
- Add variation every 4-8 bars to keep interest
- Create call-and-response between instruments
- Use velocity and ghost notes for micro-dynamics
- Make acid melodies evolve and breathe throughout

ARRANGEMENT SECTIONS:
- Use the arrangement object to define which tracks play when
- Create natural flow between sections
- Build energy through strategic track layering
- Use breakdowns to create tension and release

GROOVE PHILOSOPHY:
- Nothing should land exactly on the beat unless it's intentional
- Every instrument should have its own rhythmic personality throughout the journey
- Create spaces and tension through strategic placement
- Make it impossible NOT to move your body to this music

KEEP the personalized elements from their data but expand them across 32 bars. Transform the simple loop into a full techno journey.

Update metadata: set bars to 32, steps to 512, and title to include "32-Bar Mix" suffix.

Please return ONLY the expanded song data as valid JSON that conforms to the schema. Do not include any explanation text, just the JSON object.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Extract JSON from Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Try to parse the JSON response
    let improvedSongData;
    try {
      // Look for JSON in the response (Claude sometimes includes extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      improvedSongData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid JSON response from AI producer');
    }

    // Validate the improved song data
    const validatedOutput = validateSongData(improvedSongData);
    
    console.log('✅ AI producer successfully improved song:', {
      originalTitle: validatedInput.metadata.title,
      improvedTitle: validatedOutput.metadata.title,
      originalTracks: Object.keys(validatedInput.tracks),
      improvedTracks: Object.keys(validatedOutput.tracks)
    });

    return NextResponse.json(validatedOutput);

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to improve song',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}