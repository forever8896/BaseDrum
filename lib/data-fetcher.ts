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
  };
  timestamp: Date;
}

export class DataFetcher {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async fetchUserSnapshot(context: any, walletAddress?: string): Promise<UserDataSnapshot> {
    const snapshot: UserDataSnapshot = {
      farcaster: {},
      context: {},
      wallet: {
        address: walletAddress,
        isConnected: !!walletAddress,
      },
      onchain: {},
      timestamp: new Date(),
    };

    // Extract Farcaster context data
    if (context) {
      if (context.user) {
        snapshot.farcaster = {
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
          followerCount: context.user.followerCount,
          followingCount: context.user.followingCount,
          verifications: context.user.verifications,
        };
      }

      if (context.client) {
        snapshot.context.platformType = context.client.platformType;
        snapshot.context.added = context.client.added;
        snapshot.context.clientFid = context.client.clientFid;
      }

      if (context.location) {
        snapshot.context.entryPoint = context.location.type;
        
        if (context.location.type === 'cast_embed' && context.location.cast) {
          snapshot.context.cast = {
            hash: context.location.cast.hash,
            text: context.location.cast.text,
            author: {
              username: context.location.cast.author.username,
              fid: context.location.cast.author.fid,
            },
          };
          snapshot.context.sharedBy = {
            username: context.location.cast.author.username,
            fid: context.location.cast.author.fid,
          };
        }
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

    return snapshot;
  }

  private async fetchBasicOnchainData(address: string, snapshot: UserDataSnapshot) {
    try {
      // Get ETH balance using a simple RPC call
      const response = await fetch('/api/wallet-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (response.ok) {
        const data = await response.json();
        snapshot.wallet.balance = data.balance;
        snapshot.wallet.chainId = data.chainId;
        snapshot.onchain = {
          transactionCount: data.transactionCount,
          firstTransactionDate: data.firstTransactionDate ? new Date(data.firstTransactionDate) : undefined,
          lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate) : undefined,
          tokenCount: data.tokenCount,
          nftCount: data.nftCount,
          defiProtocols: data.defiProtocols || [],
        };
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  }

  async fetchExtendedFarcasterData(fid: number): Promise<any> {
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

  // Musical data interpretation methods
  static interpretDataForMusic(snapshot: UserDataSnapshot): Record<string, any> {
    const musicData: Record<string, any> = {};

    // Farcaster influence on music
    if (snapshot.farcaster.followerCount !== undefined) {
      musicData.drumComplexity = Math.min(snapshot.farcaster.followerCount / 100, 1);
      musicData.kickPattern = snapshot.farcaster.followerCount > 50 ? 'complex' : 'simple';
    }

    if (snapshot.farcaster.followingCount !== undefined) {
      musicData.hihatActivity = Math.min(snapshot.farcaster.followingCount / 200, 1);
    }

    // Context influence
    if (snapshot.context.entryPoint) {
      musicData.introStyle = {
        'launcher': 'returning_user_buildup',
        'cast_embed': 'viral_entrance',
        'messaging': 'intimate_start'
      }[snapshot.context.entryPoint];
    }

    // Wallet/onchain influence
    if (snapshot.wallet.balance) {
      const balance = parseFloat(snapshot.wallet.balance);
      musicData.volume = Math.min(balance / 10, 1); // Normalize to 0-1
      musicData.bassIntensity = balance > 1 ? 'heavy' : 'light';
    }

    if (snapshot.onchain.transactionCount !== undefined) {
      musicData.trackLength = Math.min(16 + (snapshot.onchain.transactionCount / 10), 32);
      musicData.rhythmComplexity = snapshot.onchain.transactionCount > 100 ? 'polyrhythmic' : 'standard';
    }

    return musicData;
  }
} 