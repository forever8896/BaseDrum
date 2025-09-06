// Song data structure based on dataformat.md
// Import types and schemas from dedicated schema file
export type { TrackData, SongData } from './songSchema';
export { 
  TrackDataSchema, 
  SongDataSchema,
  validateSongData,
  safeParseSongData,
  VALIDATION_CONSTRAINTS
} from './songSchema';

// Import default song from JSON file
import defaultSongJson from '@/data/defaultSong.json';

// Create default song with dynamic timestamp
export const DEFAULT_SONG: SongData = {
  ...defaultSongJson,
  metadata: {
    ...defaultSongJson.metadata,
    created: new Date().toISOString() // Always use current timestamp
  }
} as SongData;

// Helper functions
export function getStepNote(track: TrackData, step: number): string | undefined {
  if (!track.notes) return undefined;
  const patternIndex = track.pattern.indexOf(step);
  if (patternIndex === -1) return undefined;
  return track.notes[patternIndex];
}

export function setStepNote(track: TrackData, step: number, note: string): void {
  if (!track.notes) track.notes = [];
  const patternIndex = track.pattern.indexOf(step);
  if (patternIndex !== -1) {
    track.notes[patternIndex] = note;
  }
}

export function isStepActive(track: TrackData, step: number): boolean {
  return track.pattern.includes(step);
}

export function toggleStep(track: TrackData, step: number, note?: string): void {
  const index = track.pattern.indexOf(step);
  if (index > -1) {
    // Remove step
    track.pattern.splice(index, 1);
    if (track.notes) {
      track.notes.splice(index, 1);
    }
  } else {
    // Add step
    track.pattern.push(step);
    if (note && track.notes) {
      track.notes.push(note);
    }
    // Keep pattern sorted
    const sortedIndices = track.pattern
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val);
    
    track.pattern = sortedIndices.map(item => item.val);
    if (track.notes) {
      const newNotes: string[] = [];
      sortedIndices.forEach(item => {
        newNotes.push(track.notes![item.idx] || "C3");
      });
      track.notes = newNotes;
    }
  }
}

export function saveSongToLocalStorage(song: SongData): void {
  localStorage.setItem('basedrum-current-song', JSON.stringify(song));
}

export function loadSongFromLocalStorage(): SongData | null {
  const saved = localStorage.getItem('basedrum-current-song');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved song:', e);
      return null;
    }
  }
  return null;
}

export function exportSongAsJSON(song: SongData): string {
  return JSON.stringify(song, null, 2);
}

export { importSongFromJSON } from './songSchema';