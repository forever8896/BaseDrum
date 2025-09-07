import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { parseEther } from 'viem';
import { SongData } from './songSchema-new';
import { base, baseSepolia } from 'wagmi/chains';

// Contract deployment addresses
const CONTRACT_ADDRESSES = {
  [baseSepolia.id]: '0x20585aCAD03AC611BeE6Ed70E6EF6D0E9A5AD18c' as const,
  [base.id]: '' as const, // Will be set when deployed to mainnet
};

// Contract ABI for the mint function and other required functions
export const BASEDRUM_NFT_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'title', type: 'string' },
          { name: 'bpm', type: 'uint16' },
          { name: 'bars', type: 'uint8' },
          { name: 'steps', type: 'uint8' },
          { name: 'created', type: 'uint32' },
          { name: 'creator', type: 'address' },
          { name: 'creatorFid', type: 'uint32' },
        ],
        name: 'metadata',
        type: 'tuple',
      },
      {
        components: [
          { name: 'filterCutoff', type: 'uint16' },
          { name: 'filterType', type: 'uint8' },
          { name: 'reverbWet', type: 'uint16' },
          { name: 'reverbRoomSize', type: 'uint8' },
          { name: 'reverbDecay', type: 'uint16' },
        ],
        name: 'effects',
        type: 'tuple',
      },
      { name: 'trackNames', type: 'string[]' },
      {
        components: [
          { name: 'pattern', type: 'uint16[]' },
          { name: 'notes', type: 'string[]' },
          { name: 'volume', type: 'uint8' },
          { name: 'muted', type: 'bool' },
        ],
        name: 'trackData',
        type: 'tuple[]',
      },
    ],
    name: 'mintSong',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getShareableURL',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Convert SongData to contract format for minting
 */
function convertSongDataToContractFormat(songData: SongData, creatorFid: number) {
  // Convert effects to contract format
  const effects = {
    filterCutoff: Math.round(songData.effects.filter.cutoff * 1000), // 0-1000 range
    filterType: songData.effects.filter.type === 'lowpass' ? 0 : 
                songData.effects.filter.type === 'highpass' ? 1 : 2, // bandpass
    reverbWet: Math.round(songData.effects.reverb.wet * 1000), // 0-1000 range
    reverbRoomSize: Math.round(songData.effects.reverb.roomSize * 100), // 0-100 range
    reverbDecay: Math.round(songData.effects.reverb.decay * 10), // tenths of seconds
  };

  // Extract track names and data
  const trackNames = Object.keys(songData.tracks);
  const trackData = trackNames.map((trackName) => {
    const track = songData.tracks[trackName];
    return {
      pattern: track.pattern,
      notes: track.notes || [], // Empty array if no notes
      volume: Math.round(Math.abs(track.volume)), // Convert dB to 0-100 range
      muted: track.muted,
    };
  });

  // Create metadata
  const metadata = {
    title: songData.metadata.title,
    bpm: songData.metadata.bpm,
    bars: songData.metadata.bars,
    steps: songData.metadata.steps,
    created: 0, // Will be set to block.timestamp in contract
    creator: '0x0000000000000000000000000000000000000000' as const, // Will be set to msg.sender in contract
    creatorFid: creatorFid,
  };

  return { metadata, effects, trackNames, trackData };
}

/**
 * Mint a new BaseDrum NFT with the given song data
 * @param songData - The song data to mint as an NFT
 * @param creatorFid - The Farcaster FID of the creator
 * @param chainId - The chain ID to mint on (defaults to Base Sepolia)
 * @returns Promise resolving to the transaction receipt and token ID
 */
export async function mintBaseDrumNFT(
  songData: SongData,
  creatorFid: number,
  chainId: number = baseSepolia.id
): Promise<{
  transactionHash: string;
  tokenId: bigint;
  blockNumber: bigint;
}> {
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!contractAddress) {
    throw new Error(`Contract not deployed on chain ID ${chainId}`);
  }

  // Convert song data to contract format
  const contractData = convertSongDataToContractFormat(songData, creatorFid);

  // Write to contract with 0.001 ETH mint fee
  const hash = await writeContract({
    address: contractAddress,
    abi: BASEDRUM_NFT_ABI,
    functionName: 'mintSong',
    args: [
      contractData.metadata,
      contractData.effects,
      contractData.trackNames,
      contractData.trackData,
    ],
    value: parseEther('0.001'), // Mint price
  });

  // Wait for transaction confirmation
  const receipt = await waitForTransactionReceipt({
    hash,
  });

  // Extract token ID from the SongMinted event logs
  const mintEvent = receipt.logs.find(log => 
    log.address.toLowerCase() === contractAddress.toLowerCase()
  );

  if (!mintEvent || !mintEvent.topics || mintEvent.topics.length < 2) {
    throw new Error('Failed to extract token ID from mint transaction');
  }

  // Token ID is the first indexed parameter in the SongMinted event
  const tokenId = BigInt(mintEvent.topics[1]);

  return {
    transactionHash: hash,
    tokenId,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Get the shareable URL for a minted song
 * @param tokenId - The token ID of the minted song
 * @param chainId - The chain ID (defaults to Base Sepolia)
 * @returns The shareable URL
 */
export function getShareableURL(tokenId: bigint, chainId: number = baseSepolia.id): string {
  // For now, return the Base mini-app URL format
  // In production, this should call the contract's getShareableURL function
  return `https://base.org/app/basedrum?play=${tokenId.toString()}`;
}

/**
 * Get the Base scan URL for a transaction
 * @param transactionHash - The transaction hash
 * @param chainId - The chain ID
 * @returns The BaseScan URL
 */
export function getTransactionURL(transactionHash: string, chainId: number): string {
  if (chainId === baseSepolia.id) {
    return `https://sepolia.basescan.org/tx/${transactionHash}`;
  } else if (chainId === base.id) {
    return `https://basescan.org/tx/${transactionHash}`;
  }
  return `Transaction: ${transactionHash}`;
}

/**
 * Get the contract address for a given chain
 * @param chainId - The chain ID
 * @returns The contract address or null if not deployed
 */
export function getContractAddress(chainId: number): string | null {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || null;
}