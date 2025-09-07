import * as Tone from "tone";
import { SongData } from "./songData";

export function createSequenceCallback(
  synthsRef: any,
  muteStatesRef: any,
  songDataRef: React.MutableRefObject<SongData>,
  setCurrentStep: (step: number) => void,
  setBeatIntensity: (intensity: number) => void
) {
  return (time: number, step: number) => {
    // Update step counter for visualization
    Tone.Draw.schedule(() => {
      setCurrentStep(step);
    }, time);

    // Beat detection for particle effects
    let beatHit = false;
    const currentSong = songDataRef.current;

    if (!synthsRef.current) return;
    const synths = synthsRef.current;

    // Dynamic volume adjustments based on arrangement section (matching sound lab)
    const getSectionVolumeAdjustment = (instrumentName: string, sectionName: string): number => {
      const adjustments: Record<string, Record<string, number>> = {
        "intro": { kick: 0 },
        "buildup1": { kick: 0, snare: -2, hihat909: -2 },
        "buildup2": { kick: 0, snare: 0, hihat909: 0, clap: -3, bass: -2 },
        "buildup3": { kick: 0, bass: 0, lead: -3, clap: 0 },
        "breakdown1": { kick: +2, bass: +1 },
        "rebuild1": { kick: 0, hihat909: +1, lead: -1 },
        "peak1": { kick: 0, bass: 0, lead: 0, acid: -2, snare: +1 },
        "breakdown2": { kick: +3, lead: +2 },
        "peak2": { kick: 0, bass: +1, lead: +1, acid: 0, snare: +2 }
      };
      
      return adjustments[sectionName]?.[instrumentName] || 0;
    };

    // Determine current arrangement section for dynamic volume (matching sound lab)
    const currentBar = Math.floor(step / 16);
    let currentSection = 'intro';
    if (currentBar >= 2 && currentBar < 8) currentSection = 'buildup1';
    else if (currentBar >= 8 && currentBar < 16) currentSection = 'buildup2';
    else if (currentBar >= 16 && currentBar < 20) currentSection = 'buildup3';
    else if (currentBar >= 20 && currentBar < 22) currentSection = 'breakdown1';
    else if (currentBar >= 22 && currentBar < 24) currentSection = 'rebuild1';
    else if (currentBar >= 24 && currentBar < 26) currentSection = 'peak1';
    else if (currentBar >= 26 && currentBar < 28) currentSection = 'breakdown2';
    else if (currentBar >= 28) currentSection = 'peak2';

    // KICK
    if (!muteStatesRef.current.kick && currentSong.tracks.kick && currentSong.tracks.kick.volume > -50) {
      const track = currentSong.tracks.kick;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -6;
        const sectionAdjustment = getSectionVolumeAdjustment('kick', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const velocity = track.velocity?.[step] || 1.0;
        synths.kick?.triggerAttackRelease("C1", "8n", time, velocity * volume);
        beatHit = true;
      } else if (track.ghostNotes?.includes(step)) {
        const baseVolume = track.volume || -6;
        const volume = Tone.dbToGain(baseVolume);
        synths.kick?.triggerAttackRelease("C1", "16n", time, 0.3 * volume);
      }
    }

    // HIHAT 909
    if (!muteStatesRef.current.hihat909 && currentSong.tracks.hihat909 && currentSong.tracks.hihat909.volume > -50) {
      const track = currentSong.tracks.hihat909;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -15;
        const sectionAdjustment = getSectionVolumeAdjustment('hihat909', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const velocity = track.velocity?.[step] || 0.8;
        synths.hihat909Env?.triggerAttackRelease("16n", time, velocity * volume);
      }
    }

    // OPEN HIHAT
    if (!muteStatesRef.current.hihat && currentSong.tracks.hihat && currentSong.tracks.hihat.volume > -50) {
      const track = currentSong.tracks.hihat;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -18;
        const volume = Tone.dbToGain(baseVolume);
        const velocity = track.velocity?.[step] || 0.5;
        synths.hihat?.triggerAttackRelease("8n", time, velocity * volume);
      }
    }

    // SNARE
    if (!muteStatesRef.current.snare && currentSong.tracks.snare && currentSong.tracks.snare.volume > -50) {
      const track = currentSong.tracks.snare;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -8;
        const sectionAdjustment = getSectionVolumeAdjustment('snare', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const velocity = track.velocity?.[step] || 0.9;
        synths.snare?.triggerAttackRelease("8n", time, velocity * volume);
        beatHit = true;
      }
    }

    // BASS
    if (!muteStatesRef.current.bass && currentSong.tracks.bass && currentSong.tracks.bass.volume > -50) {
      const track = currentSong.tracks.bass;
      const patternIndex = track.pattern.indexOf(step);
      if (patternIndex !== -1) {
        const baseVolume = track.volume || -8;
        const sectionAdjustment = getSectionVolumeAdjustment('bass', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const note = track.notes?.[patternIndex] || "A1";
        const velocity = track.velocity?.[step] || 0.9;
        synths.bass?.triggerAttackRelease(note, "4n", time, velocity * volume);
      }
    }

    // LEAD
    if (!muteStatesRef.current.lead && currentSong.tracks.lead && currentSong.tracks.lead.volume > -50) {
      const track = currentSong.tracks.lead;
      const patternIndex = track.pattern.indexOf(step);
      if (patternIndex !== -1) {
        const baseVolume = track.volume || -12;
        const sectionAdjustment = getSectionVolumeAdjustment('lead', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const note = track.notes?.[patternIndex] || "A3";
        const velocity = track.velocity?.[step] || 0.6;
        
        // Support chord playback (comma-separated notes) like sound lab
        if (note && note.includes(',')) {
          const chordNotes = note.split(',');
          synths.lead?.triggerAttackRelease(chordNotes, "4n", time, velocity * volume);
        } else {
          synths.lead?.triggerAttackRelease(note, "4n", time, velocity * volume);
        }
      }
    }

    // RUMBLE
    if (!muteStatesRef.current.rumble && currentSong.tracks.rumble && currentSong.tracks.rumble.volume > -50) {
      const track = currentSong.tracks.rumble;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -20;
        const volume = Tone.dbToGain(baseVolume);
        const velocity = track.velocity?.[step] || 0.4;
        synths.rumbleEnv?.triggerAttackRelease("2n", time, velocity * volume);
      }
    }

    // RIDE
    if (!muteStatesRef.current.ride && currentSong.tracks.ride && currentSong.tracks.ride.volume > -50) {
      const track = currentSong.tracks.ride;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -14;
        const volume = Tone.dbToGain(baseVolume);
        const velocity = track.velocity?.[step] || 0.6;
        synths.ride?.triggerAttackRelease("16n", time, velocity * volume);
      }
    }

    // CLAP
    if (!muteStatesRef.current.clap && currentSong.tracks.clap && currentSong.tracks.clap.volume > -50) {
      const track = currentSong.tracks.clap;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -10;
        const sectionAdjustment = getSectionVolumeAdjustment('clap', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const velocity = track.velocity?.[step] || 0.7;
        synths.clap?.triggerAttackRelease("16n", time + 0.015, velocity * volume);
      }
    }

    // ACID
    if (!muteStatesRef.current.acid && currentSong.tracks.acid && currentSong.tracks.acid.volume > -50) {
      const track = currentSong.tracks.acid;
      const patternIndex = track.pattern.indexOf(step);
      if (patternIndex !== -1) {
        const baseVolume = track.volume || -10;
        const sectionAdjustment = getSectionVolumeAdjustment('acid', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const note = track.notes?.[patternIndex] || "A2";
        const velocity = track.velocity?.[step] || 0.8;
        synths.acid?.triggerAttackRelease(note, "16n", time, velocity * volume); // 16n like sound lab
      }
    }

    // PULSE - Kick-hihat hybrid for foundation rhythm
    if (!muteStatesRef.current.pulse && currentSong.tracks.pulse && currentSong.tracks.pulse.volume > -50) {
      const track = currentSong.tracks.pulse;
      if (track.pattern.includes(step)) {
        const baseVolume = track.volume || -12;
        const sectionAdjustment = getSectionVolumeAdjustment('pulse', currentSection);
        const dynamicVolume = baseVolume + sectionAdjustment;
        const volume = Tone.dbToGain(dynamicVolume);
        const velocity = track.velocity?.[step] || 0.7;
        synths.pulse?.triggerAttackRelease("C2", "8n", time, velocity * volume);
        beatHit = true;
      }
    }

    // Update beat intensity for particle effects
    if (beatHit) {
      Tone.Draw.schedule(() => {
        setBeatIntensity(1);
        // Decay the intensity over time
        setTimeout(() => setBeatIntensity(0.7), 50);
        setTimeout(() => setBeatIntensity(0.4), 100);
        setTimeout(() => setBeatIntensity(0.1), 150);
        setTimeout(() => setBeatIntensity(0), 200);
      }, time);
    }
  };
}