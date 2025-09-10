"use client";

import { useState } from 'react';
import { Transaction, TransactionButton, TransactionSponsor, TransactionStatus, TransactionStatusLabel, TransactionStatusAction } from '@coinbase/onchainkit/transaction';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { SongData } from '../../lib/songSchema';
import { base } from 'wagmi/chains';
import { parseEther } from 'viem';

// Contract ABI for the mint function
const BASEDRUM_NFT_ABI = [
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
] as const;

// Contract address on Base Mainnet
const CONTRACT_ADDRESS = '0x20585aCAD03AC611BeE6Ed70E6EF6D0E9A5AD18c';

interface MintSongButtonTransactionProps {
  songData: SongData;
  creatorFid: number;
  onSuccess?: (tokenId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

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

export function MintSongButtonTransaction({
  songData,
  creatorFid,
  onSuccess,
  onError,
  disabled = false,
  className = "",
  children = "Mint as NFT",
}: MintSongButtonTransactionProps) {
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { context } = useMiniKit();

  // Convert song data to contract format
  const contractData = convertSongDataToContractFormat(songData, creatorFid);

  // Log context for debugging
  console.log('MiniKit context:', context);

  // Prepare transaction calls for OnchainKit
  const calls = [
    {
      to: CONTRACT_ADDRESS as `0x${string}`,
      data: undefined, // OnchainKit will encode this for us
      value: parseEther('0'), // Free minting
    }
  ];

  const contracts = [
    {
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: BASEDRUM_NFT_ABI,
      functionName: 'mintSong',
      args: [
        contractData.metadata,
        contractData.effects,
        contractData.trackNames,
        contractData.trackData,
      ],
      value: parseEther('0'), // Free minting
    }
  ];

  const handleOnStatus = (status: any) => {
    console.log('Transaction status:', status);
    
    if (status.statusName === 'success') {
      console.log('🎉 Song minted successfully!');
      setTransactionHash(status.statusData.transactionHashList?.[0] || '');
      
      // Extract token ID from receipt if available
      const receipt = status.statusData.receipt;
      if (receipt && receipt.logs) {
        // Try to extract token ID from logs (simplified)
        const tokenId = receipt.logs[0]?.topics?.[1] || 'unknown';
        onSuccess?.(tokenId);
      } else {
        onSuccess?.('minted');
      }
    } else if (status.statusName === 'error') {
      console.error('❌ Mint failed:', status.statusData);
      onError?.(status.statusData?.message || 'Transaction failed');
    }
  };

  return (
    <div className={`mint-container ${className}`}>
      <Transaction
        chainId={base.id}
        contracts={contracts}
        onStatus={handleOnStatus}
      >
        <TransactionButton 
          className="w-full bg-blue-600 text-white font-bold py-4 hover:bg-blue-700 transition-all duration-200 font-[var(--font-orbitron)] text-lg tracking-wide shadow-lg"
          disabled={disabled}
          text={children as string}
        />
        <TransactionSponsor />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>

      {transactionHash && (
        <div className="mt-4 text-center">
          <a 
            href={`https://basescan.org/tx/${transactionHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View on BaseScan
          </a>
        </div>
      )}

      <style jsx>{`
        .mint-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
} 