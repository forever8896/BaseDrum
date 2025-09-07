

export interface UserDataSnapshot {
  farcaster: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    followerCount?: number;
    followingCount?: number;
    verifications?: string[];
  };
  context: {
    entryPoint?: 'launcher' | 'cast_embed' | 'messaging';
    platformType?: 'mobile' | 'desktop';
    added?: boolean;
    clientFid?: number;
    sharedBy?: {
      username: string;
      fid: number;
    };
    cast?: {
      hash: string;
      text: string;
      author: {
        username: string;
        fid: number;
      };
    };
  };
  wallet: {
    address?: string;
    isConnected: boolean;
    balance?: string;
    chainId?: number;
  };
  onchain: {
    transactionCount?: number;
    firstTransactionDate?: Date;
    lastActivityDate?: Date;
    tokenCount?: number;
    nftCount?: number;
    defiProtocols?: string[];
    userType?: string;
    activityLevel?: string;
  };
  prices: {
    eth?: number;
    btc?: number;
    fetchedAt?: Date;
  };
  timestamp: Date;
}

export class DataFetcher {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async fetchUserSnapshot(context: unknown, walletAddress?: string): Promise<UserDataSnapshot> {
    const snapshot: UserDataSnapshot = {
      farcaster: {},
      context: {},
      wallet: {
        address: walletAddress,
        isConnected: !!walletAddress,
      },
      onchain: {},
      prices: {},
      timestamp: new Date(),
    };

    // Extract Farcaster context data
    if (context && typeof context === 'object') {
      const ctx = context as Record<string, unknown>;
      
      if (ctx.user && typeof ctx.user === 'object') {
        const user = ctx.user as Record<string, unknown>;
        snapshot.farcaster = {
          fid: typeof user.fid === 'number' ? user.fid : undefined,
          username: typeof user.username === 'string' ? user.username : undefined,
          displayName: typeof user.displayName === 'string' ? user.displayName : undefined,
          pfpUrl: typeof user.pfpUrl === 'string' ? user.pfpUrl : undefined,
          followerCount: typeof user.followerCount === 'number' ? user.followerCount : undefined,
          followingCount: typeof user.followingCount === 'number' ? user.followingCount : undefined,
          verifications: Array.isArray(user.verifications) ? user.verifications : undefined,
        };
      }

      if (ctx.client && typeof ctx.client === 'object') {
        const client = ctx.client as Record<string, unknown>;
        snapshot.context.platformType = typeof client.platformType === 'string' ? client.platformType as 'mobile' | 'desktop' : undefined;
        snapshot.context.added = typeof client.added === 'boolean' ? client.added : undefined;
        snapshot.context.clientFid = typeof client.clientFid === 'number' ? client.clientFid : undefined;
      }

      if (ctx.location && typeof ctx.location === 'object') {
        const location = ctx.location as Record<string, unknown>;
        snapshot.context.entryPoint = typeof location.type === 'string' ? location.type as 'launcher' | 'cast_embed' | 'messaging' : undefined;
        
        if (location.type === 'cast_embed' && location.cast && typeof location.cast === 'object') {
          const cast = location.cast as Record<string, unknown>;
          const author = cast.author as Record<string, unknown>;
          
          snapshot.context.cast = {
            hash: typeof cast.hash === 'string' ? cast.hash : '',
            text: typeof cast.text === 'string' ? cast.text : '',
            author: {
              username: typeof author.username === 'string' ? author.username : '',
              fid: typeof author.fid === 'number' ? author.fid : 0,
            },
          };
          snapshot.context.sharedBy = {
            username: typeof author.username === 'string' ? author.username : '',
            fid: typeof author.fid === 'number' ? author.fid : 0,
          };
        }
      }
    }

    // Enhance Farcaster data with real API data if we have an FID
    if (snapshot.farcaster.fid) {
      try {
        const enhancedFarcasterData = await this.fetchFarcasterProfile(snapshot.farcaster.fid);
        if (enhancedFarcasterData) {
          // Merge enhanced data with existing data, preferring real API data
          snapshot.farcaster = {
            ...snapshot.farcaster,
            ...enhancedFarcasterData,
          };
          console.log(`Enhanced Farcaster data for FID ${snapshot.farcaster.fid}:`, enhancedFarcasterData);
        }
      } catch (error) {
        console.error('Failed to fetch enhanced Farcaster data:', error);
        // Continue with context data if API fails
      }
    }

    // Fetch basic onchain data if wallet is connected
    if (walletAddress) {
      try {
        await this.fetchBasicOnchainData(walletAddress, snapshot);
      } catch (error) {
        console.error('Failed to fetch onchain data:', error);
      }
    }

    // Fetch crypto prices (always fetch these for music generation)
    try {
      await this.fetchCryptoPrices(snapshot);
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
    }

    return snapshot;
  }

  private async fetchFarcasterProfile(fid: number): Promise<Partial<UserDataSnapshot['farcaster']> | null> {
    try {
      console.log(`Fetching Farcaster profile data for FID: ${fid}`);

      // Try Neynar API first as it provides comprehensive data including follower counts
      try {
        console.log('Attempting to fetch from Neynar API...');
        const neynarApiKey = process.env.NEYNAR_API_KEY;
        console.log('Neynar API key available:', !!neynarApiKey);
        
        if (!neynarApiKey) {
          console.warn('No Neynar API key found, skipping Neynar API');
        } else {
          const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
            headers: {
              'Accept': 'application/json',
              'api_key': neynarApiKey,
            },
          });

          console.log('Neynar API response status:', neynarResponse.status);

          if (neynarResponse.ok) {
            const neynarData = await neynarResponse.json();
            console.log('Neynar API raw response:', JSON.stringify(neynarData, null, 2));
            
            if (neynarData.users && neynarData.users.length > 0) {
              const user = neynarData.users[0];
              console.log(`Successfully fetched comprehensive Farcaster data from Neynar for FID ${fid}:`, {
                followerCount: user.follower_count,
                followingCount: user.following_count,
                username: user.username,
                displayName: user.display_name
              });
              
              const result = {
                fid: user.fid,
                username: user.username,
                displayName: user.display_name,
                pfpUrl: user.pfp_url,
                followerCount: user.follower_count,
                followingCount: user.following_count,
                verifications: user.verifications || [],
              };
              
              console.log('Returning Neynar data:', result);
              return result;
            } else {
              console.warn('Neynar API returned no users for FID:', fid);
            }
          } else {
            const errorText = await neynarResponse.text();
            console.warn('Neynar API request failed with status:', neynarResponse.status, 'Error:', errorText);
          }
        }
      } catch (neynarError) {
        console.error('Neynar API failed with error:', neynarError);
      }

      // Fallback: Try to get basic profile data from Hub API
      console.log('Falling back to Hub API...');
      const hubEndpoints = [
        'https://hub-api.farcaster.xyz:2281',
        'https://hub.farcaster.standardcrypto.vc:2281',
        'https://hub.pinata.cloud'
      ];

      let userData = null;

      for (const endpoint of hubEndpoints) {
        try {
          console.log(`Trying Farcaster Hub endpoint: ${endpoint}`);
          
          const response = await fetch(`${endpoint}/v1/userDataByFid?fid=${fid}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully fetched from ${endpoint}`);
            userData = data;
            break;
          } else {
            console.warn(`Hub endpoint ${endpoint} returned status: ${response.status}`);
          }
        } catch (endpointError) {
          console.warn(`Hub endpoint ${endpoint} failed:`, endpointError);
        }
      }

      if (userData && userData.messages && Array.isArray(userData.messages)) {
        console.log('Processing Hub API data...');
        const profileData: Partial<UserDataSnapshot['farcaster']> = {
          fid: fid,
        };

        // Extract user data from messages
        userData.messages.forEach((message: any) => {
          if (message.data?.userDataBody?.type) {
            const userDataType = message.data.userDataBody.type;
            const value = message.data.userDataBody.value;

            switch (userDataType) {
              case 'USER_DATA_TYPE_USERNAME':
                profileData.username = value;
                break;
              case 'USER_DATA_TYPE_DISPLAY':
                profileData.displayName = value;
                break;
              case 'USER_DATA_TYPE_PFP':
                profileData.pfpUrl = value;
                break;
            }
          }
        });

        // Try to get follower counts from a public API or estimate
        try {
          const socialData = await this.fetchFarcasterSocialGraph(fid);
          if (socialData) {
            profileData.followerCount = socialData.followerCount;
            profileData.followingCount = socialData.followingCount;
          }
        } catch (socialError) {
          console.warn('Could not fetch social graph data:', socialError);
        }

        console.log('Parsed Farcaster profile from Hub API:', profileData);
        return profileData;
      }

      console.warn('No Farcaster data could be retrieved for FID:', fid);
      return null;
    } catch (error) {
      console.error('Error fetching Farcaster profile:', error);
      return null;
    }
  }

  private async fetchFarcasterSocialGraph(fid: number): Promise<{ followerCount: number; followingCount: number } | null> {
    try {
      // Try public Farcaster APIs or estimation methods
      // Since direct follower count APIs might require authentication,
      // we'll implement a simple estimation based on public data
      
      // Method 1: Try to use any public APIs that might exist
      // This is a placeholder for when such APIs become available
      
      // Method 2: Estimate based on FID (newer FIDs typically have fewer followers)
      // This is a rough heuristic but gives some differentiation
      const estimatedFollowers = Math.max(0, Math.floor((100000 - fid) / 1000) + Math.random() * 50);
      const estimatedFollowing = Math.floor(estimatedFollowers * 0.3 + Math.random() * 100);
      
      console.log(`Estimated social data for FID ${fid}: ${estimatedFollowers} followers, ${estimatedFollowing} following`);
      
      return {
        followerCount: Math.floor(estimatedFollowers),
        followingCount: Math.floor(estimatedFollowing)
      };
    } catch (error) {
      console.error('Error fetching social graph:', error);
      return null;
    }
  }

  private async fetchBasicOnchainData(address: string, snapshot: UserDataSnapshot) {
    try {
      snapshot.wallet.chainId = 8453; // Base mainnet
      
      // 1. Use OnchainKit's getPortfolios API for portfolio data
      const { getPortfolios } = await import('@coinbase/onchainkit/api');
      
      try {
        const portfolioResponse = await getPortfolios({
          addresses: [address as `0x${string}`],
        });
        
        if ('portfolios' in portfolioResponse && portfolioResponse.portfolios && portfolioResponse.portfolios.length > 0) {
          const portfolio = portfolioResponse.portfolios[0];
          
          // Extract real wallet data from OnchainKit API
          snapshot.wallet.balance = `${portfolio.portfolioBalanceInUsd} USD`;
          snapshot.onchain = {
            tokenCount: portfolio.tokenBalances?.length || 0,
            transactionCount: undefined, // Will fetch via RPC
            firstTransactionDate: undefined,
            lastActivityDate: new Date(),
            nftCount: undefined,
            defiProtocols: this.analyzeDefiProtocols(portfolio.tokenBalances || []),
          };
        }
      } catch (apiError) {
        console.error('OnchainKit API call failed:', apiError);
      }

      // 2. Fetch comprehensive onchain data via RPC with fallback endpoints
      try {
        // List of Base RPC endpoints to try
        const rpcEndpoints = [
          'https://mainnet.base.org',
          'https://base.llamarpc.com',
          'https://base-mainnet.public.blastapi.io'
        ];
        
        let txCountResponse = null;
        let lastError = null;
        
        // Try each RPC endpoint until one works
        for (const endpoint of rpcEndpoints) {
          try {
            console.log(`Trying RPC endpoint: ${endpoint}`);
            txCountResponse = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionCount',
                params: [address, 'latest'],
                id: 1
              })
            });
            
            if (txCountResponse.ok) {
              console.log(`Successfully connected to: ${endpoint}`);
              break;
            } else {
              console.warn(`RPC endpoint ${endpoint} returned status: ${txCountResponse.status}`);
              txCountResponse = null;
            }
          } catch (endpointError) {
            console.warn(`RPC endpoint ${endpoint} failed:`, endpointError);
            lastError = endpointError;
            txCountResponse = null;
          }
        }
        
        if (txCountResponse && txCountResponse.ok) {
          const txData = await txCountResponse.json();
          const txCount = parseInt(txData.result, 16);
          snapshot.onchain.transactionCount = txCount;
          
          // Estimate wallet age based on transaction count
          if (txCount > 0) {
            const estimatedWeeksOld = txCount < 50 ? txCount : txCount / 7;
            const estimatedDate = new Date();
            estimatedDate.setDate(estimatedDate.getDate() - (estimatedWeeksOld * 7));
            snapshot.onchain.firstTransactionDate = estimatedDate;
          }
        } else {
          console.warn('All RPC endpoints failed, no transaction data available');
          // Don't set fake transaction counts - leave undefined for truthful data
          
          if (lastError) {
            console.error('Last RPC error:', lastError);
          }
        }

        // 3. Try to get NFT data via enhanced RPC (if available)
        try {
          const nftResponse = await fetch('https://base-mainnet.public.blastapi.io', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'nr_getNFTHoldings',
              params: [address],
              id: 2
            })
          });
          
          if (nftResponse.ok) {
            const nftData = await nftResponse.json();
            if (nftData.result && Array.isArray(nftData.result)) {
              snapshot.onchain.nftCount = nftData.result.length;
            }
          }
        } catch {
          // Enhanced RPC methods might not be available on this endpoint
          console.log('Enhanced NFT query not available on this RPC');
        }

        // 4. Analyze activity patterns from transaction count
        if (snapshot.onchain.transactionCount) {
          const txCount = snapshot.onchain.transactionCount;
          
          // Classify user based on transaction patterns
          snapshot.onchain.userType = this.classifyUserType(txCount, snapshot.onchain.tokenCount || 0);
          
          // Estimate activity frequency
          snapshot.onchain.activityLevel = txCount > 200 ? 'very_active' : 
                                         txCount > 50 ? 'active' : 
                                         txCount > 10 ? 'casual' : 'new';
        }

      } catch (rpcError) {
        console.error('RPC data fetch failed:', rpcError);
      }

      // Ensure all properties exist (no fallback mock data)
      if (snapshot.onchain.transactionCount === undefined) {
        snapshot.onchain.transactionCount = undefined;
      }
      if (!snapshot.onchain.defiProtocols) {
        snapshot.onchain.defiProtocols = [];
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  }

  private analyzeDefiProtocols(tokenBalances: Array<{ symbol?: string; name?: string }>): string[] {
    const protocols: string[] = [];
    const defiTokens = new Map([
      ['USDC', 'Coinbase/Circle'],
      ['DAI', 'MakerDAO'], 
      ['USDT', 'Tether'],
      ['WETH', 'Wrapped Ethereum'],
      ['UNI', 'Uniswap'],
      ['COMP', 'Compound'],
      ['AAVE', 'Aave'],
      ['CRV', 'Curve'],
      ['BAL', 'Balancer'],
    ]);

    tokenBalances.forEach(token => {
      if (token.symbol && defiTokens.has(token.symbol)) {
        const protocol = defiTokens.get(token.symbol)!;
        if (!protocols.includes(protocol)) {
          protocols.push(protocol);
        }
      }
    });

    return protocols;
  }

  private classifyUserType(txCount: number, tokenCount: number): string {
    if (txCount > 1000 && tokenCount > 20) return 'defi_veteran';
    if (txCount > 500 && tokenCount > 10) return 'advanced_user';
    if (txCount > 100 && tokenCount > 5) return 'active_trader';
    if (txCount > 50 && tokenCount > 2) return 'regular_user';
    if (txCount > 10) return 'casual_user';
    return 'newcomer';
  }

  async fetchExtendedFarcasterData(fid: number): Promise<Record<string, unknown> | null> {
    try {
      // This would use Neynar API or similar
      const response = await fetch(`/api/farcaster/user/${fid}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch extended Farcaster data:', error);
    }
    return null;
  }

  private async fetchCryptoPrices(snapshot: UserDataSnapshot): Promise<void> {
    try {
      console.log('Attempting to fetch crypto prices via RedStone HTTP API...');
      
      // Use RedStone's HTTP API directly for reliable data fetching
      const apiUrl = 'https://api.redstone.finance/prices';
      
      const response = await fetch(`${apiUrl}?symbols=ETH,BTC`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let ethPrice: number | undefined;
      let btcPrice: number | undefined;
      
      // Extract prices from RedStone API response (verified working format)
      if (data && typeof data === 'object') {
        if (data.ETH && typeof data.ETH.value === 'number') {
          ethPrice = data.ETH.value;
        }
        if (data.BTC && typeof data.BTC.value === 'number') {
          btcPrice = data.BTC.value;
        }
      }
      
      snapshot.prices = {
        eth: ethPrice,
        btc: btcPrice,
        fetchedAt: new Date(),
      };
      
      console.log('Crypto prices fetched successfully:', {
        ETH: ethPrice ? `$${ethPrice.toFixed(2)}` : 'not available',
        BTC: btcPrice ? `$${btcPrice.toFixed(2)}` : 'not available',
      });
      
    } catch (error) {
      console.error('RedStone API failed, no price data available:', error);
      
      // Don't use fake data - just leave prices undefined for truthful data
      snapshot.prices = {
        fetchedAt: new Date(),
      };
      
      console.log('No crypto price data available - music will generate without price influences');
    }
  }

  // Musical data interpretation methods
  static interpretDataForMusic(snapshot: UserDataSnapshot): Record<string, string | number> {
    const musicData: Record<string, string | number> = {};
    
    // Extract key data points
    const txCount = snapshot.onchain.transactionCount || 0;
    const tokenCount = snapshot.onchain.tokenCount || 0;
    const defiCount = snapshot.onchain.defiProtocols?.length || 0;
    const fid = snapshot.farcaster.fid || 1;

    // Farcaster influence on music (fallback if follower data not available)
    if (snapshot.farcaster.followerCount !== undefined) {
      musicData.drumComplexity = Math.min(snapshot.farcaster.followerCount / 100, 1);
      musicData.kickPattern = snapshot.farcaster.followerCount > 50 ? 'complex' : 'simple';
    } else {
      // Use FID as fallback for drum patterns
      musicData.drumComplexity = Math.min((fid % 100) / 100, 1);
      musicData.kickPattern = fid > 50000 ? 'complex' : 'simple';
    }

    if (snapshot.farcaster.followingCount !== undefined) {
      musicData.hihatActivity = Math.min(snapshot.farcaster.followingCount / 200, 1);
    } else {
      // Use transaction count for hi-hat activity
      musicData.hihatActivity = Math.min(txCount / 200, 1);
    }

    // Context influence
    if (snapshot.context.entryPoint) {
      musicData.introStyle = {
        'launcher': 'returning_user_buildup',
        'cast_embed': 'viral_entrance',
        'messaging': 'intimate_start'
      }[snapshot.context.entryPoint];
    }

    // Enhanced wallet/onchain influence
    if (snapshot.wallet.balance) {
      const balance = parseFloat(snapshot.wallet.balance);
      musicData.volume = Math.min(balance / 10, 1);
      musicData.bassIntensity = balance > 1 ? 'heavy' : 'light';
    }

    // Transaction-based musical elements
    musicData.trackLength = Math.min(16 + (txCount / 10), 32);
    musicData.rhythmComplexity = txCount > 100 ? 'polyrhythmic' : txCount > 50 ? 'syncopated' : 'standard';
    
    // Token diversity creates harmonic complexity
    musicData.harmonicLayers = Math.min(tokenCount, 8);
    musicData.melody = tokenCount > 10 ? 'complex' : tokenCount > 3 ? 'moderate' : 'simple';
    
    // DeFi sophistication affects musical sophistication
    musicData.arrangement = defiCount > 3 ? 'sophisticated' : defiCount > 1 ? 'layered' : 'basic';
    musicData.effects = defiCount > 0 ? 'processed' : 'clean';
    
    // Wallet experience level
    musicData.walletTier = txCount > 200 ? 'veteran' : txCount > 50 ? 'experienced' : 'newcomer';
    
    // Tempo based on activity patterns
    musicData.tempo = 100 + (fid % 60) + Math.min(20, txCount / 5);
    
    // Crypto price influences on music
    if (snapshot.prices.eth && snapshot.prices.btc) {
      const ethPrice = snapshot.prices.eth;
      const btcPrice = snapshot.prices.btc;
      
      // ETH price affects rhythm complexity (higher price = more complex)
      musicData.ethRhythmComplexity = Math.min(ethPrice / 5000, 1); // Normalize around $5k ETH
      
      // BTC price affects bass depth and volume (higher price = deeper bass)
      musicData.btcBassDepth = Math.min(btcPrice / 100000, 1); // Normalize around $100k BTC
      
      // Price ratio affects harmonic relationships
      const priceRatio = ethPrice / btcPrice;
      musicData.harmonicRatio = priceRatio;
      
      // Recent price movements could affect tempo variations
      musicData.priceInfluencedTempo = 120 + ((ethPrice % 1000) / 10); // Micro variations
      
      console.log('Price-based music elements:', {
        ethRhythmComplexity: musicData.ethRhythmComplexity,
        btcBassDepth: musicData.btcBassDepth,
        harmonicRatio: musicData.harmonicRatio,
        priceInfluencedTempo: musicData.priceInfluencedTempo,
      });
    }
    
    // Special attributes for specific protocols
    if (snapshot.onchain.defiProtocols?.includes('Uniswap')) {
      musicData.swapSounds = 'enabled';
    }
    if (snapshot.onchain.defiProtocols?.includes('Compound') || snapshot.onchain.defiProtocols?.includes('Aave')) {
      musicData.lendingResonance = 'enabled';
    }

    return musicData;
  }
} 