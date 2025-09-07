# BaseDrum

BaseDrum is an innovative onchain music generation platform that transforms your digital identity into personalized techno compositions. Built as a Base App using Coinbase's MiniKit framework, it analyzes your social data and blockchain activity to create unique musical experiences that reflect your onchain journey.

## What is BaseDrum?

BaseDrum evolved from a manual drum sequencer into an intelligent music generation system that creates personalized tracks based on:

- **Social Presence**: Activity from Base App interactions, followers, engagement metrics
- **Onchain Activity**: Transaction history, token holdings, NFT collections, DeFi interactions  
- **Wallet Profile**: Age, activity patterns, network usage, portfolio diversity

Each data point maps to specific musical elements, creating a personalized audio signature that tells the story of your digital presence through sound.

## Technology Stack

- [MiniKit](https://docs.base.org/builderkits/minikit/overview) - Base App framework
- [OnchainKit](https://www.base.org/builders/onchainkit) - Base blockchain integration
- [Tone.js](https://tonejs.github.io/) - Web Audio synthesis and sequencing
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Next.js](https://nextjs.org/docs) - React framework

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Verify environment variables, these will be set up by the `npx create-onchain --mini` command:

You can regenerate the Base App Account Association environment variables by running `npx create-onchain --manifest` in your project directory.

The environment variables enable the following features:

- Frame metadata - Sets up the Frame Embed that will be shown when you share your generated music
- Account association - Allows users to add BaseDrum to their account, enables notifications  
- Redis API keys - Enable Webhooks and background notifications for music generation updates

```bash
# Shared/OnchainKit variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_URL=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Base App Frame metadata  
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis config
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:
```bash
npm run dev
```

## Key Features

### Music Generation Engine
- **Data-Driven Composition**: Transforms your onchain activity into musical parameters
- **Real-Time Audio Synthesis**: Uses Tone.js for professional-quality web audio
- **Personalized Mappings**: Each user's data creates unique musical patterns and arrangements
- **Educational Experience**: Learn how your digital footprint translates to sound

### Musical Mapping System
- **Social Metrics → Rhythm Patterns**: Follower count affects drum complexity and hi-hat activity  
- **Portfolio Data → Instrument Selection**: Token diversity determines number of instrumental layers
- **Transaction History → Tempo & Structure**: Activity patterns influence tempo variations and track length
- **Wallet Characteristics → Effects Processing**: Account age and sophistication control reverb and atmosphere

### Base App Integration
- Built with MiniKit framework for seamless Base ecosystem integration
- Frame support for sharing generated compositions
- Account association enables notifications and personalized experiences
- OnchainKit integration for reliable blockchain data access

### Interactive Experience  
- **Live Sequencer**: Educational 10-step drum machine with techno production rules
- **Data Visualization**: Real-time display of how your data influences the music
- **Narrative Explanations**: Clear descriptions of musical choices based on your profile

## How It Works

### User Experience Flow

1. **Connect Wallet**: Link your Base App account and wallet to begin the experience
2. **Data Analysis**: BaseDrum fetches your social metrics, transaction history, and token portfolio  
3. **Musical Generation**: Your data is transformed into musical parameters using algorithmic mapping
4. **Personalized Playback**: Experience your unique composition with real-time explanations
5. **Learn & Share**: Understand how your onchain identity creates sound, then share your track

### Musical Mappings Examples

- **High follower count** → More intricate kick drum patterns
- **Diverse token portfolio** → Multiple instrumental layers and harmonic complexity  
- **Frequent transactions** → Dynamic tempo changes and rhythmic variations
- **DeFi activity** → Active bass lines and advanced effect processing
- **Long wallet history** → Sophisticated arrangements with atmospheric effects

## Development & Architecture

BaseDrum features a sophisticated architecture designed for real-time music generation:

- **Audio Engine**: Built on Tone.js with support for multiple tracks, effects, and real-time synthesis
- **Data Services**: Integrated APIs for Base App social data, onchain analytics, and token portfolio analysis  
- **Mapping Algorithms**: Proprietary algorithms that convert numerical data into musical parameters
- **Caching Layer**: Redis-backed system for fast data retrieval and user session management

### Future Roadmap

- **Enhanced Data Sources**: Multi-chain support and advanced behavioral pattern recognition
- **Social Features**: Track sharing, community comparisons, and collaborative compositions  
- **Advanced Mappings**: Machine learning-driven pattern recognition and cross-data correlations
- **Export Capabilities**: Download generated tracks and advanced visualization modes

## Learn More

- [Base App MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started) 
- [Tone.js Web Audio Framework](https://tonejs.github.io/)
- [Next.js Documentation](https://nextjs.org/docs)

---

*Built for ETHWarsaw 2025 Hackathon - Transforming onchain identity into sound*

## Enhanced Data Integration

The app now supports real Farcaster data fetching for more accurate musical generation:

### Farcaster API Integration
To get real follower counts and social data, set up a Neynar API key:

1. Get an API key from [Neynar](https://neynar.com/)
2. Add to your environment variables:
```bash
NEYNAR_API_KEY=your_neynar_api_key_here
```

### Data Sources
- **Farcaster**: Real follower/following counts, username, display name, profile picture
- **Onchain**: Transaction count, token holdings, NFT count, DeFi protocol usage
- **Crypto Prices**: Real-time ETH/BTC prices for dynamic musical elements

The system gracefully falls back to estimation methods if API keys are not available.
