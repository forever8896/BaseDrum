// Example of how to integrate the mint functionality
// This shows how to use the MintSongButton component

import { useState, useEffect } from 'react';
import { MintSongButton } from '../app/components/MintSongButton';
import { SongData } from '../lib/songSchema-new';

export function MintExampleUsage() {
  const [songData, setSongData] = useState<SongData | null>(null);
  const [creatorFid, setCreatorFid] = useState<number>(1); // Default FID

  // Example: Generate or load song data
  useEffect(() => {
    // This would typically come from your music generation system
    const exampleSongData: SongData = {
      metadata: {
        title: "My Generated Song",
        artist: "BaseDrum User",
        version: "1.0.0",
        created: new Date().toISOString(),
        bpm: 140,
        bars: 4,
        steps: 16,
        format: "basedrum-v1"
      },
      effects: {
        filter: {
          cutoff: 0.8,
          type: "lowpass",
          startFreq: 1000,
          endFreq: 1000
        },
        reverb: {
          wet: 0.3,
          roomSize: 0.7,
          decay: 2.0
        }
      },
      tracks: {
        kick: {
          pattern: [0, 4, 8, 12], // Every 4 steps
          notes: [],
          velocity: [1, 0.8, 1, 0.8],
          muted: false,
          volume: -6,
        },
        hihat: {
          pattern: [2, 6, 10, 14], // Off-beat
          notes: [],
          muted: false,
          volume: -12,
        },
        bass: {
          pattern: [0, 8],
          notes: ["C2", "C2"],
          muted: false,
          volume: -8,
        }
      }
    };

    setSongData(exampleSongData);
  }, []);

  const handleMintSuccess = (result: { tokenId: bigint; shareableURL: string; transactionURL: string }) => {
    console.log('Mint successful!', result);
    
    // You could:
    // - Show a success notification
    // - Redirect to the shareable URL
    // - Save the token ID to your database
    // - Update the UI to show the minted NFT
    
    alert(`Successfully minted NFT #${result.tokenId}! Check the console for full details.`);
  };

  const handleMintError = (error: string) => {
    console.error('Mint failed:', error);
    
    // You could:
    // - Show an error notification
    // - Log the error for debugging
    // - Provide alternative options to the user
    
    alert(`Minting failed: ${error}`);
  };

  if (!songData) {
    return <div>Loading song data...</div>;
  }

  return (
    <div className="mint-example">
      <h2>Ready to Mint Your Song!</h2>
      
      <div className="song-preview">
        <h3>{songData.metadata.title}</h3>
        <p>{songData.metadata.bpm} BPM • {songData.metadata.bars} bars</p>
        <p>{Object.keys(songData.tracks).length} tracks</p>
      </div>

      <MintSongButton
        songData={songData}
        creatorFid={creatorFid}
        onSuccess={handleMintSuccess}
        onError={handleMintError}
        className="my-custom-mint-button"
      >
        🎵 Mint My Song as NFT
      </MintSongButton>

      <div className="mint-info">
        <p><strong>Mint Cost:</strong> 0.001 ETH + gas fees</p>
        <p><strong>Network:</strong> Base Sepolia (testnet)</p>
        <p><strong>Contract:</strong> 0x20585aCAD03AC611BeE6Ed70E6EF6D0E9A5AD18c</p>
      </div>
    </div>
  );
}

// Alternative: Using the hook directly for more control
export function MintExampleWithHook() {
  const { mintSong, isLoading, result, error } = useMintSong();
  const [songData, setSongData] = useState<SongData | null>(null);

  const handleCustomMint = async () => {
    if (!songData) return;

    const result = await mintSong(songData, 1); // FID = 1
    
    if (result.success) {
      console.log('Custom mint success:', result);
      // Handle success
    } else {
      console.log('Custom mint error:', result);
      // Handle error
    }
  };

  return (
    <div className="custom-mint-example">
      <button onClick={handleCustomMint} disabled={isLoading || !songData}>
        {isLoading ? 'Minting...' : 'Custom Mint Logic'}
      </button>
      
      {result && (
        <div>Success! Token ID: {result.tokenId.toString()}</div>
      )}
      
      {error && (
        <div>Error: {error.error}</div>
      )}
    </div>
  );
}