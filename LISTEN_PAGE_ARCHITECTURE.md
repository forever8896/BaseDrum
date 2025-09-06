# Listen Page Architecture

## Overview

The `/listen` page will be the new primary experience where users hear their onchain identity transformed into music. This page focuses on passive listening with rich contextual information about how their data influences the generated composition.

## Page Structure

### Layout Components

```
/listen
├── Header (Wallet Connection + Navigation)
├── UserProfileCard (Avatar, Handle, Summary Stats)
├── MusicPlayer (Play/Pause, Progress, Volume)
├── DataVisualization (Real-time data mapping display)
├── NarrativePanel (Explanations of musical choices)
└── Footer (Links back to sequencer, share options)
```

### Component Hierarchy

```typescript
ListenPage
├── UserProfileSection
│   ├── FarcasterProfile
│   ├── WalletSummary
│   └── GenerationStatus
├── AudioPlayerSection
│   ├── PlaybackControls
│   ├── ProgressIndicator
│   └── VolumeControl
├── VisualizationSection
│   ├── DataToMusicMapping
│   ├── ActiveInstruments
│   └── RealTimeEffects
└── NarrativeSection
    ├── DataExplanations
    ├── MusicalChoices
    └── ShareOptions
```

## User Interface Design

### Color & Theme
- Continue using existing theme variables from `theme.css`
- Maintain pixel font aesthetic for consistency
- Use darker backgrounds for listening experience (focus on audio)
- Highlight active data points with accent colors

### Visual Elements

#### User Profile Card
```typescript
interface ProfileCardData {
  farcasterHandle: string;
  avatar: string;
  followers: number;
  following: number;
  ethBalance: string;
  walletAge: number;
  generationStatus: 'loading' | 'ready' | 'playing' | 'error';
}
```

#### Music Player
- Minimal, clean design
- Large play/pause button
- Visual waveform or spectrum analyzer
- Track progress with data point markers
- Volume control

#### Data Visualization
- Real-time display of which data points are active
- Color-coded instrument tracks
- Animated indicators when data influences sound
- Scrollable list of all detected data points

#### Narrative Panel
- Live explanations: "Your 127 followers are creating this kick pattern"
- Data threshold explanations: "Reaching 100+ followers unlocked the bass line"
- Musical reasoning: "Your DeFi activity adds syncopated rhythms"

## Technical Implementation

### Data Flow Architecture

```typescript
// Main data flow
UserConnection → DataFetching → ParameterMapping → MusicGeneration → Playback

interface ListenPageState {
  user: UserProfile | null;
  musicData: MusicParameters | null;
  playbackState: PlaybackState;
  dataExplanations: DataExplanation[];
  loadingStates: Record<string, boolean>;
}

interface PlaybackState {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  activeInstruments: string[];
  currentDataInfluences: DataInfluence[];
}
```

### Component Structure

#### ListenPage.tsx
```typescript
export default function ListenPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [musicParams, setMusicParams] = useState<MusicParameters | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>();

  // Data fetching effects
  useEffect(() => {
    if (connectedWallet) {
      fetchUserProfile();
    }
  }, [connectedWallet]);

  // Music generation effect
  useEffect(() => {
    if (profile) {
      generateMusicFromProfile();
    }
  }, [profile]);

  return (
    <div className="listen-page">
      <UserProfileSection profile={profile} />
      <AudioPlayerSection 
        musicParams={musicParams}
        onPlaybackChange={setPlaybackState}
      />
      <VisualizationSection 
        profile={profile}
        playbackState={playbackState}
      />
      <NarrativeSection 
        profile={profile}
        playbackState={playbackState}
      />
    </div>
  );
}
```

#### UserProfileSection.tsx
```typescript
interface UserProfileSectionProps {
  profile: UserProfile | null;
}

export function UserProfileSection({ profile }: UserProfileSectionProps) {
  if (!profile) return <ProfileSkeleton />;

  return (
    <div className="profile-section">
      <div className="avatar-container">
        <img src={profile.farcaster.avatar} alt="Profile" />
        <div className="status-indicator" />
      </div>
      <div className="profile-stats">
        <h2>@{profile.farcaster.handle}</h2>
        <div className="stats-grid">
          <StatItem label="Followers" value={profile.farcaster.followers} />
          <StatItem label="Following" value={profile.farcaster.following} />
          <StatItem label="ETH Balance" value={profile.onchain.ethBalance} />
          <StatItem label="Wallet Age" value={profile.wallet.ageInDays} />
        </div>
      </div>
    </div>
  );
}
```

#### AudioPlayerSection.tsx
```typescript
interface AudioPlayerSectionProps {
  musicParams: MusicParameters | null;
  onPlaybackChange: (state: PlaybackState) => void;
}

export function AudioPlayerSection({ musicParams, onPlaybackChange }: AudioPlayerSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePlay = async () => {
    if (!musicParams) return;
    
    await audioEngine.initialize();
    
    // Generate tracks from music parameters
    const tracks = generateTracksFromParameters(musicParams);
    
    audioEngine.startSequence(
      () => tracks,
      musicParams.tempo,
      (step) => {
        setCurrentStep(step);
        onPlaybackChange({
          isPlaying: true,
          currentStep: step,
          totalSteps: 16,
          activeInstruments: getActiveInstruments(tracks, step),
          currentDataInfluences: getDataInfluences(step)
        });
      }
    );
    
    setIsPlaying(true);
  };

  return (
    <div className="audio-player">
      <button 
        className="play-button"
        onClick={isPlaying ? handleStop : handlePlay}
        disabled={!musicParams}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      <ProgressBar current={currentStep} total={16} />
      <VolumeControl />
    </div>
  );
}
```

### Data Services

#### FarcasterService.ts
```typescript
export class FarcasterService {
  async getUserProfile(fid: number): Promise<FarcasterData> {
    // Fetch from Farcaster API
    const response = await fetch(`/api/farcaster/user/${fid}`);
    return response.json();
  }

  async getUserStats(fid: number): Promise<FarcasterStats> {
    // Get followers, following, casts, etc.
  }
}
```

#### OnchainService.ts
```typescript
export class OnchainService {
  async getWalletData(address: string): Promise<OnchainData> {
    // Fetch from various sources:
    // - Etherscan for transaction history
    // - Alchemy for token balances
    // - OpenSea for NFTs
    // - DeFi protocols for interactions
  }

  async getWalletAge(address: string): Promise<number> {
    // Calculate days since first transaction
  }
}
```

#### MusicMappingService.ts
```typescript
export class MusicMappingService {
  generateMusicParameters(profile: UserProfile): MusicParameters {
    return {
      tempo: this.calculateTempo(profile),
      trackLength: this.calculateLength(profile),
      instruments: this.selectInstruments(profile),
      effects: this.selectEffects(profile),
      arrangement: this.createArrangement(profile)
    };
  }

  private calculateTempo(profile: UserProfile): number {
    // Base tempo on activity patterns
    const baselineTempo = 120;
    const activityFactor = profile.onchain.avgTransactionsPerWeek / 10;
    return Math.max(100, Math.min(140, baselineTempo + activityFactor * 20));
  }

  private selectInstruments(profile: UserProfile): InstrumentConfig[] {
    const instruments: InstrumentConfig[] = [];
    
    // Always include kick (rule 1)
    instruments.push({
      ruleId: 1,
      presetId: 'pulse-kick',
      pattern: this.generateKickPattern(profile.farcaster.followers)
    });

    // Add hi-hat based on following (rule 2)
    if (profile.farcaster.following > 10) {
      instruments.push({
        ruleId: 2,
        presetId: 'synco-hihat',
        pattern: this.generateHihatPattern(profile.farcaster.following)
      });
    }

    // Add bass based on balance (rule 4)
    if (profile.onchain.ethBalance > 0.1) {
      instruments.push({
        ruleId: 4,
        presetId: 'sub-bass',
        pattern: this.generateBassPattern(profile.onchain.ethBalance)
      });
    }

    return instruments;
  }
}
```

## API Endpoints

### /api/farcaster/[fid]
- Fetch Farcaster profile data
- Returns: user info, follower count, cast count, etc.

### /api/onchain/[address]
- Fetch comprehensive onchain data
- Returns: balance, transaction history, token holdings, NFTs

### /api/generate-music
- POST endpoint to generate music parameters
- Input: UserProfile
- Output: MusicParameters

## State Management

Using React state with custom hooks for complex state logic:

```typescript
// useUserProfile.ts
export function useUserProfile(address: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchProfile(address);
    }
  }, [address]);

  return { profile, loading, error, refetch: () => fetchProfile(address) };
}

// useMusicGeneration.ts
export function useMusicGeneration(profile: UserProfile | null) {
  const [musicParams, setMusicParams] = useState<MusicParameters | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (profile) {
      generateMusic(profile);
    }
  }, [profile]);

  return { musicParams, generating };
}
```

## Error Handling

### Graceful Degradation
- Show placeholder music if data fetching fails
- Display partial information when some APIs are down
- Provide fallback explanations for missing data

### Error States
- Network connectivity issues
- API rate limits
- Invalid wallet addresses
- Audio initialization failures

### User Feedback
- Loading states for each data source
- Clear error messages with retry options
- Progress indicators for music generation

## Performance Considerations

### Data Loading
- Parallel API calls for different data sources
- Progressive enhancement (show what's available)
- Cache frequently accessed data in localStorage

### Audio Performance
- Preload audio samples
- Use Web Workers for heavy computations
- Optimize Tone.js memory usage

### UI Responsiveness
- Skeleton loading states
- Debounced updates
- Virtual scrolling for large data lists

## Future Enhancements

### Real-time Updates
- WebSocket connections for live data updates
- Dynamic track modification as new data arrives
- Live social activity integration

### Social Features
- Share generated tracks
- Compare with friends
- Community leaderboards based on musical complexity

### Advanced Visualizations
- 3D audio visualization
- Interactive data exploration
- Custom visual themes based on user preferences

This architecture provides a solid foundation for the onchain music generation experience while maintaining the existing codebase's strengths and ensuring scalability for future features. 