# Data Sources & Implementation Guide

## Overview

This document outlines the specific data sources, API integrations, and algorithmic mappings needed to transform user onchain and social data into musical compositions. The goal is to start with simple, reliable data points and gradually expand complexity.

## Phase 1: Foundation Data Sources (MVP)

### Farcaster Social Data

#### Primary Data Points
```typescript
interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  verifications: string[]; // Connected addresses
  power?: number; // Farcaster power user status
}

interface FarcasterActivity {
  castCount: number;
  recastCount: number;
  likeCount: number;
  replyCount: number;
  channelsFollowed: string[];
  activeChannels: string[];
}
```

#### API Integration
```typescript
// Using Neynar API (recommended for Farcaster data)
export class FarcasterService {
  private apiKey = process.env.NEYNAR_API_KEY;
  private baseUrl = 'https://api.neynar.com/v2';

  async getUserByAddress(address: string): Promise<FarcasterProfile> {
    const response = await fetch(
      `${this.baseUrl}/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'api_key': this.apiKey!
        }
      }
    );
    
    const data = await response.json();
    return data[address]?.[0] || null;
  }

  async getUserActivity(fid: number): Promise<FarcasterActivity> {
    // Get user's cast history and engagement metrics
    const castsResponse = await fetch(
      `${this.baseUrl}/farcaster/feed/user/casts?fid=${fid}&limit=100`,
      {
        headers: {
          'Accept': 'application/json',
          'api_key': this.apiKey!
        }
      }
    );
    
    const casts = await castsResponse.json();
    
    return {
      castCount: casts.casts.length,
      recastCount: casts.casts.filter(c => c.parent_hash).length,
      likeCount: casts.casts.reduce((sum, c) => sum + c.reactions.likes.length, 0),
      replyCount: casts.casts.filter(c => c.parent_author).length,
      channelsFollowed: [], // Additional API call needed
      activeChannels: this.extractChannels(casts.casts)
    };
  }
}
```

### Onchain Data Sources

#### Basic Wallet Information
```typescript
interface WalletBasics {
  address: string;
  ethBalance: number;
  firstTransactionDate: Date;
  totalTransactions: number;
  lastActivityDate: Date;
  isContract: boolean;
}

interface TokenHoldings {
  tokens: Array<{
    symbol: string;
    name: string;
    balance: number;
    valueUSD: number;
    contractAddress: string;
  }>;
  totalValueUSD: number;
  tokenCount: number;
}
```

#### API Integration (Using Alchemy)
```typescript
export class OnchainService {
  private alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  });

  async getWalletBasics(address: string): Promise<WalletBasics> {
    // Get ETH balance
    const balance = await this.alchemy.core.getBalance(address, 'latest');
    
    // Get transaction count
    const txCount = await this.alchemy.core.getTransactionCount(address);
    
    // Get first and last transaction (using Etherscan API)
    const { firstTx, lastTx } = await this.getTransactionTimestamps(address);
    
    return {
      address,
      ethBalance: parseFloat(formatEther(balance)),
      firstTransactionDate: new Date(firstTx * 1000),
      totalTransactions: txCount,
      lastActivityDate: new Date(lastTx * 1000),
      isContract: await this.isContract(address)
    };
  }

  async getTokenHoldings(address: string): Promise<TokenHoldings> {
    const balances = await this.alchemy.core.getTokenBalances(address);
    
    const tokens = await Promise.all(
      balances.tokenBalances
        .filter(token => token.tokenBalance !== '0x0')
        .slice(0, 20) // Limit to top 20 tokens
        .map(async token => {
          const metadata = await this.alchemy.core.getTokenMetadata(token.contractAddress);
          const balance = parseFloat(formatUnits(token.tokenBalance!, metadata.decimals || 18));
          
          return {
            symbol: metadata.symbol || 'UNKNOWN',
            name: metadata.name || 'Unknown Token',
            balance,
            valueUSD: 0, // Would need price API integration
            contractAddress: token.contractAddress
          };
        })
    );

    return {
      tokens,
      totalValueUSD: 0, // Calculate once price data is available
      tokenCount: tokens.length
    };
  }

  private async getTransactionTimestamps(address: string) {
    // Use Etherscan API for transaction history
    const apiKey = process.env.ETHERSCAN_API_KEY;
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${apiKey}`
    );
    
    const data = await response.json();
    const firstTx = data.result[0]?.timeStamp;
    
    // Get last transaction
    const lastResponse = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=desc&apikey=${apiKey}`
    );
    
    const lastData = await lastResponse.json();
    const lastTx = lastData.result[0]?.timeStamp;
    
    return { firstTx: parseInt(firstTx), lastTx: parseInt(lastTx) };
  }
}
```

## Musical Mapping Algorithms

### Core Mapping Philosophy

Each data point maps to musical elements based on these principles:
1. **Linear scaling** for continuous values (followers → pattern density)
2. **Threshold triggers** for binary features (has NFTs → add special effects)
3. **Logarithmic scaling** for large ranges (transaction count → tempo)
4. **Categorical mapping** for discrete values (token types → instrument selection)

### Specific Mapping Functions

#### Follower Count → Kick Drum Pattern
```typescript
export function generateKickPattern(followerCount: number): boolean[] {
  const basePattern = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
  
  if (followerCount < 10) {
    // Very basic pattern: just on 1 and 9
    return [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false];
  }
  
  if (followerCount < 50) {
    // Basic four-on-the-floor
    return basePattern;
  }
  
  if (followerCount < 200) {
    // Add syncopation
    const pattern = [...basePattern];
    pattern[6] = true; // Add kick on 7th step
    return pattern;
  }
  
  if (followerCount < 1000) {
    // Complex pattern with more hits
    return [true, false, true, false, true, false, true, false, true, false, false, true, true, false, true, false];
  }
  
  // Influencer level - very complex pattern
  return [true, false, true, true, false, true, false, true, true, false, true, false, true, true, false, true];
}
```

#### ETH Balance → Volume & Effects
```typescript
export function calculateVolumeFromBalance(ethBalance: number): number {
  // Logarithmic scaling: 0.01 ETH = 0.3 volume, 1 ETH = 0.7 volume, 10+ ETH = 1.0 volume
  if (ethBalance <= 0) return 0.2;
  if (ethBalance < 0.01) return 0.3;
  if (ethBalance < 0.1) return 0.5;
  if (ethBalance < 1) return 0.7;
  if (ethBalance < 10) return 0.9;
  return 1.0;
}

export function getBalanceEffects(ethBalance: number): EffectConfig[] {
  const effects: EffectConfig[] = [];
  
  if (ethBalance > 1) {
    // Add reverb for "wealthy" wallets
    effects.push({
      type: 'reverb',
      params: { roomSize: Math.min(0.8, ethBalance / 10) },
      wetness: 0.3
    });
  }
  
  if (ethBalance > 5) {
    // Add subtle distortion for very wealthy wallets
    effects.push({
      type: 'distortion',
      params: { distortion: Math.min(0.2, ethBalance / 50) },
      wetness: 0.1
    });
  }
  
  return effects;
}
```

#### Transaction Count → Tempo & Complexity
```typescript
export function calculateTempo(
  transactionCount: number,
  walletAge: number // in days
): number {
  const baseTempo = 120;
  
  // Calculate average transactions per month
  const monthsOld = Math.max(1, walletAge / 30);
  const avgTxPerMonth = transactionCount / monthsOld;
  
  // Map to tempo: 0-10 tx/month = 100-120 BPM, 50+ tx/month = 140 BPM
  const tempoModifier = Math.min(20, avgTxPerMonth * 0.4);
  
  return Math.round(baseTempo + tempoModifier);
}
```

#### Token Diversity → Instrument Selection
```typescript
export function selectInstrumentsFromTokens(tokens: TokenHoldings): InstrumentConfig[] {
  const instruments: InstrumentConfig[] = [];
  
  // Always have a kick drum
  instruments.push({
    ruleId: 1,
    presetId: 'pulse-kick',
    pattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
  });
  
  // Add hi-hat if user has any tokens
  if (tokens.tokenCount > 0) {
    instruments.push({
      ruleId: 2,
      presetId: 'synco-hihat',
      pattern: generateHihatFromTokenCount(tokens.tokenCount)
    });
  }
  
  // Add bass if user has DeFi tokens (check common DeFi token symbols)
  const defiTokens = tokens.tokens.filter(token => 
    ['UNI', 'AAVE', 'COMP', 'MKR', 'YFI', 'CRV', 'SUSHI', 'LDO'].includes(token.symbol)
  );
  
  if (defiTokens.length > 0) {
    instruments.push({
      ruleId: 4,
      presetId: 'sub-bass',
      pattern: generateBassFromDeFiActivity(defiTokens.length)
    });
  }
  
  // Add lead melody if user has governance tokens
  const govTokens = tokens.tokens.filter(token =>
    ['UNI', 'COMP', 'MKR', 'ENS', 'OP', 'ARB'].includes(token.symbol)
  );
  
  if (govTokens.length > 0) {
    instruments.push({
      ruleId: 8,
      presetId: 'filter-lead',
      pattern: generateLeadFromGovernance(govTokens.length)
    });
  }
  
  return instruments;
}
```

#### Farcaster Activity → Hi-Hat Patterns
```typescript
export function generateHihatFromActivity(
  followingCount: number,
  castCount: number
): boolean[] {
  const basePattern = new Array(16).fill(false);
  
  // Basic pattern every 4 steps if user follows anyone
  if (followingCount > 0) {
    for (let i = 2; i < 16; i += 4) {
      basePattern[i] = true;
    }
  }
  
  // Add syncopation based on cast activity
  if (castCount > 10) {
    basePattern[1] = true;
    basePattern[5] = true;
    basePattern[9] = true;
    basePattern[13] = true;
  }
  
  // Very active users get complex patterns
  if (castCount > 100) {
    basePattern[3] = true;
    basePattern[7] = true;
    basePattern[11] = true;
    basePattern[15] = true;
  }
  
  return basePattern;
}
```

#### Wallet Age → Reverb & Sophistication
```typescript
export function calculateWalletAgeEffects(ageInDays: number): EffectConfig[] {
  const effects: EffectConfig[] = [];
  
  if (ageInDays > 365) {
    // OG wallets get reverb (depth of experience)
    const reverbAmount = Math.min(0.6, ageInDays / 1825); // Max at 5 years
    effects.push({
      type: 'reverb',
      params: { roomSize: reverbAmount },
      wetness: 0.4
    });
  }
  
  if (ageInDays > 1095) { // 3+ years
    // Very old wallets get subtle chorus (wisdom)
    effects.push({
      type: 'chorus',
      params: { frequency: 0.5, delayTime: 2, depth: 0.3 },
      wetness: 0.2
    });
  }
  
  return effects;
}
```

## Phase 1 Implementation Checklist

### API Setup
- [ ] Neynar API key for Farcaster data
- [ ] Alchemy API key for onchain data
- [ ] Etherscan API key for transaction history
- [ ] Rate limiting and caching strategy

### Data Services
- [ ] `FarcasterService` class implementation
- [ ] `OnchainService` class implementation
- [ ] Error handling and fallbacks
- [ ] Data caching layer

### Musical Mapping
- [ ] Pattern generation algorithms
- [ ] Volume and effect calculations
- [ ] Tempo and timing logic
- [ ] Instrument selection rules

### Integration
- [ ] Connect data services to existing `AudioEngine`
- [ ] Extend `SoundBank` with new preset selection logic
- [ ] Create `MusicMappingService` orchestrator
- [ ] Add narrative generation for explanations

## Testing Strategy

### Mock Data
Create realistic mock profiles for testing:

```typescript
export const mockProfiles = {
  newbie: {
    farcaster: { followers: 3, following: 25, casts: 5 },
    onchain: { ethBalance: 0.02, transactions: 15, ageInDays: 30 },
    tokens: { count: 1, types: ['ETH'] }
  },
  
  active: {
    farcaster: { followers: 127, following: 180, casts: 250 },
    onchain: { ethBalance: 2.5, transactions: 400, ageInDays: 450 },
    tokens: { count: 8, types: ['ETH', 'UNI', 'USDC', 'WETH'] }
  },
  
  whale: {
    farcaster: { followers: 2500, following: 500, casts: 1000 },
    onchain: { ethBalance: 50, transactions: 2000, ageInDays: 1200 },
    tokens: { count: 25, types: ['ETH', 'WBTC', 'UNI', 'MKR', 'YFI'] }
  }
};
```

### Validation
- Test musical output with different profile types
- Verify data fetching reliability and speed
- Ensure graceful degradation when APIs fail
- Validate musical mappings make intuitive sense

This foundation provides a robust starting point for Phase 1, with clear pathways for expansion in subsequent phases. 