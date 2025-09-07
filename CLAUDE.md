# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BaseDrum is a Next.js application that transforms onchain and social data into personalized music compositions. It features a drum sequencer interface and a music generation system that analyzes user data from Farcaster and blockchain activity to create unique techno tracks.

## Development Commands

### Basic Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### No Test Framework Currently
There are no test scripts defined in package.json. Tests would need to be set up if required.

## Core Architecture

### Technology Stack
- **Framework**: Next.js 15.3.3 with App Router
- **Audio Engine**: Tone.js for Web Audio synthesis and sequencing
- **UI**: Tailwind CSS with custom theming
- **Blockchain**: Wagmi + Viem for wallet connections, OnchainKit for Base integration
- **Frame Support**: Farcaster Frame SDK for social integration
- **Data Storage**: Upstash Redis for caching and notifications

### Key Components

#### Audio System (`lib/`)
- **`audio-engine.ts`**: Core audio sequencing engine using Tone.js
  - Manages audio tracks, effects, and real-time playback
  - Handles synth creation and audio routing
  - Provides tempo control and step sequencing
- **`sound-bank.ts`**: Sound preset library
  - Defines synthesizer configurations for different instruments
  - Maps presets to musical rules (kicks, hi-hats, bass, etc.)
  - Contains effect definitions and audio processing chains

#### Data Collection (`lib/data-fetcher.ts`)
- Fetches user data from multiple sources:
  - Farcaster profile data (followers, following, FID)
  - Onchain activity (transaction count, token holdings, DeFi protocols)
  - Crypto prices from RedStone API
  - Context data (entry point, platform type)
- Interprets data for musical mapping (transaction count → tempo, follower count → drum complexity)

#### Music Generation (`lib/music-generator.ts`)
- Converts user data into musical parameters
- Maps social/financial metrics to instrument patterns
- Generates track arrangements based on user profile sophistication

#### UI Components (`app/components/`)
- **`Sequencer.tsx`**: Interactive drum machine interface with 10 techno rules
- **`DataDisplay.tsx`**: Shows user data and musical interpretations
- **`RuleGuide.tsx`**: Educational component teaching techno production concepts
- **`ThemeProvider.tsx`**: Custom theme system with pixel fonts

### Pages Structure
- **`app/page.tsx`**: Main experience - generates personalized music from user data
- **`app/sequencer/page.tsx`**: Educational drum sequencer for learning techno rules
- **`app/listen/`**: Planned page for passive listening experience (see architecture docs)

## Data Flow

### Music Generation Process
1. **User Connection**: Wallet connection + Farcaster context
2. **Data Fetching**: Collect onchain transactions, token holdings, social metrics
3. **Musical Mapping**: Transform data into musical parameters:
   - Follower count → Kick drum patterns
   - Transaction count → Tempo and rhythm complexity
   - Token diversity → Instrument selection
   - DeFi activity → Bass lines and effects
   - Wallet age → Reverb and sophistication
4. **Audio Generation**: Create Tone.js tracks with mapped parameters
5. **Real-time Playback**: Step sequencer with visual feedback

### Key Data Mappings
- **Social Activity** → Hi-hat complexity and syncopation
- **Financial Activity** → Volume levels and bass intensity  
- **Portfolio Diversity** → Number of instrumental layers
- **Crypto Prices** → Harmonic relationships and tempo variations
- **Context (launcher/cast/messaging)** → Intro style and arrangement

## Important Implementation Notes

### Audio Engine Considerations
- Audio initialization requires user interaction (browser security)
- All audio tracks are managed through a singleton `audioEngine` instance
- Effects and volume changes are applied in real-time during playback
- Pattern data is passed via callback functions to ensure real-time updates
- **CRITICAL**: The beat must ALWAYS continue playing during all animations and transitions - never stop the audio engine during UI changes

### Personalized Music Generation Pattern
**IMPORTANT**: Follow this UX pattern for all future track additions:

#### Progressive Revelation Pattern:
1. **Always Start Basic**: Every new track/instrument starts with the most basic, standard pattern
2. **Show Educational Context**: Brief explanation of what the instrument does in techno
3. **Reveal Personal Data**: Show user's specific metrics that influence this track
4. **Dramatic Transformation**: Upgrade pattern in real-time based on user data (both audio + visual)

#### Implementation Strategy:
- Store both "basic" and "personalized" patterns for each instrument
- Use `setTimeout` delays to create dramatic reveals (500ms after text appears)
- Only upgrade if personalized pattern differs from basic
- Log transformations for debugging: `console.log('✨ Pattern upgraded!')`

#### Data-to-Music Mappings:
- **Kick Drum**: Transaction count → rhythm complexity
- **Hi-hats**: Follower count → syncopation patterns  
- **Bass**: Token diversity → note variations
- **Snare**: DeFi protocols → placement patterns
- **Effects**: Wallet age → reverb/sophistication

This creates powerful "aha moments" where users literally hear their onchain activity transform the music.

### Frame Integration
- App supports Farcaster Frame embedding with MiniKit
- Frame metadata is configured in `layout.tsx`
- Account association enables notifications and frame saving
- Context data provides rich social information for music generation

### Onchain Data
- Uses OnchainKit's portfolio API for token/balance data
- Falls back to direct RPC calls for transaction counts
- Implements multiple RPC endpoint failover for reliability
- No mock data - all undefined values represent actual missing data

### Theme System
- Custom CSS variables in `app/theme.css`
- Pixel font (Pixelify Sans) for retro aesthetic
- Dark/light mode support through OnchainKit
- Color mapping for different musical elements and rules

## Future Development Areas

Based on the architecture documentation (`IMPLEMENTATION_ROADMAP.md`, `LISTEN_PAGE_ARCHITECTURE.md`, `DATA_SOURCES_IMPLEMENTATION.md`), the project is planned to expand into:

1. **Enhanced Data Sources**: More sophisticated blockchain analysis, multi-chain support
2. **Advanced Musical Mappings**: ML-driven pattern recognition, cross-data correlations
3. **Social Features**: Track sharing, community comparisons, friend discovery
4. **Listen Page**: Passive music experience with real-time data visualization
5. **Production Features**: Track export, advanced visualization, mobile optimization

## Environment Variables

Required for full functionality:
```bash
# OnchainKit
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
NEXT_PUBLIC_URL=

# Farcaster Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD= 
FARCASTER_SIGNATURE=

# Redis for notifications
REDIS_URL=
REDIS_TOKEN=

# Optional API keys for enhanced data
NEYNAR_API_KEY=
ALCHEMY_API_KEY=
ETHERSCAN_API_KEY=
```

## Special Considerations

### Performance
- Audio assets are loaded on-demand to minimize initial bundle size
- Real-time audio processing requires careful memory management
- Large pattern arrays are passed by reference to avoid copying

### Browser Compatibility
- Web Audio API support required (modern browsers only)
- Mobile performance considerations for audio processing
- Frame embedding has specific requirements for Farcaster clients

### Error Handling
- Graceful degradation when external APIs fail
- Audio initialization errors are surfaced to user
- Missing data doesn't break music generation (uses fallback mappings)