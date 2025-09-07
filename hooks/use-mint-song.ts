import { useState } from 'react';
import { useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { mintBaseDrumNFT, getShareableURL, getTransactionURL } from '../lib/contract-interactions';
import { SongData } from '../lib/songSchema-new';

export interface MintSongResult {
  success: true;
  tokenId: bigint;
  transactionHash: string;
  shareableURL: string;
  transactionURL: string;
  blockNumber: bigint;
}

export interface MintSongError {
  success: false;
  error: string;
  code?: string;
}

export interface UseMintSongState {
  isLoading: boolean;
  result: MintSongResult | null;
  error: MintSongError | null;
}

/**
 * Hook for minting BaseDrum NFTs
 * Provides loading state, error handling, and success data
 */
export function useMintSong() {
  const chainId = useChainId();
  const [state, setState] = useState<UseMintSongState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const mintSong = async (songData: SongData, creatorFid: number): Promise<MintSongResult | MintSongError> => {
    setState({ isLoading: true, result: null, error: null });

    try {
      // Validate song data has required fields
      if (!songData.metadata.title || !songData.tracks || Object.keys(songData.tracks).length === 0) {
        throw new Error('Invalid song data: missing title or tracks');
      }

      // Mint the NFT (force Sepolia for testing)
      const mintResult = await mintBaseDrumNFT(songData, creatorFid, baseSepolia.id);
      
      // Generate URLs (use Sepolia)
      const shareableURL = getShareableURL(mintResult.tokenId, baseSepolia.id);
      const transactionURL = getTransactionURL(mintResult.transactionHash, baseSepolia.id);

      const result: MintSongResult = {
        success: true,
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        shareableURL,
        transactionURL,
        blockNumber: mintResult.blockNumber,
      };

      setState({ isLoading: false, result, error: null });
      return result;

    } catch (error: any) {
      console.error('Mint song error:', error);
      
      let errorMessage = 'Failed to mint song';
      let errorCode: string | undefined;

      // Handle common error types
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
        errorCode = 'USER_REJECTED';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas + mint fee (0.001 ETH)';
        errorCode = 'INSUFFICIENT_FUNDS';
      } else if (error.message?.includes('Contract not deployed')) {
        errorMessage = 'Contract not available on this network';
        errorCode = 'NETWORK_NOT_SUPPORTED';
      } else if (error.message?.includes('Invalid song data')) {
        errorMessage = error.message;
        errorCode = 'INVALID_DATA';
      } else if (error.message) {
        errorMessage = error.message;
      }

      const errorResult: MintSongError = {
        success: false,
        error: errorMessage,
        code: errorCode,
      };

      setState({ isLoading: false, result: null, error: errorResult });
      return errorResult;
    }
  };

  const reset = () => {
    setState({ isLoading: false, result: null, error: null });
  };

  return {
    mintSong,
    reset,
    ...state,
  };
}

/**
 * Simplified hook that just returns the mint function
 * For cases where you don't need the loading/error state
 */
export function useMintSongSimple() {
  return async (songData: SongData, creatorFid: number): Promise<MintSongResult> => {
    const mintResult = await mintBaseDrumNFT(songData, creatorFid, baseSepolia.id);
    const shareableURL = getShareableURL(mintResult.tokenId, baseSepolia.id);
    const transactionURL = getTransactionURL(mintResult.transactionHash, baseSepolia.id);

    return {
      success: true,
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      shareableURL,
      transactionURL,
      blockNumber: mintResult.blockNumber,
    };
  };
}