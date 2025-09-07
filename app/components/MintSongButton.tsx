"use client";

import { useState } from 'react';
import { useMintSong } from '../../hooks/use-mint-song';
import { SongData } from '../../lib/songSchema-new';

interface MintSongButtonProps {
  songData: SongData;
  creatorFid: number;
  onSuccess?: (result: { tokenId: bigint; shareableURL: string; transactionURL: string }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function MintSongButton({
  songData,
  creatorFid,
  onSuccess,
  onError,
  disabled = false,
  className = "",
  children = "Mint as NFT",
}: MintSongButtonProps) {
  const { mintSong, isLoading, result, error } = useMintSong();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleMint = async () => {
    const mintResult = await mintSong(songData, creatorFid);
    
    if (mintResult.success) {
      setShowSuccess(true);
      onSuccess?.(mintResult);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } else {
      onError?.(mintResult.error);
    }
  };

  // Show success state
  if (showSuccess && result) {
    return (
      <div className={`mint-success ${className}`}>
        <div className="success-content">
          <div className="success-icon">✅</div>
          <div className="success-text">
            <p className="font-bold">Minted as NFT #{result.tokenId.toString()}!</p>
            <div className="success-links">
              <a 
                href={result.shareableURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="share-link"
              >
                🎵 Share Song
              </a>
              <a 
                href={result.transactionURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="tx-link"
              >
                📄 View Transaction
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mint-container ${className}`}>
      <button
        onClick={handleMint}
        disabled={disabled || isLoading}
        className={`mint-button ${isLoading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner">⏳</span>
            Minting...
          </>
        ) : (
          children
        )}
      </button>
      
      {error && (
        <div className="mint-error">
          <p className="error-text">❌ {error.error}</p>
          {error.code === 'INSUFFICIENT_FUNDS' && (
            <p className="error-hint">
              You need at least 0.001 ETH + gas fees to mint
            </p>
          )}
          {error.code === 'USER_REJECTED' && (
            <p className="error-hint">
              Please approve the transaction to mint your song
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .mint-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mint-button {
          background: linear-gradient(45deg, #0052ff, #00d4ff);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          min-height: 48px;
        }

        .mint-button:hover:not(.disabled):not(.loading) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 82, 255, 0.3);
        }

        .mint-button.loading {
          opacity: 0.8;
          cursor: wait;
        }

        .mint-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #ccc;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .mint-success {
          background: linear-gradient(45deg, #00aa00, #44dd44);
          color: white;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .success-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .success-icon {
          font-size: 2rem;
        }

        .success-links {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .share-link, .tx-link {
          color: white;
          text-decoration: underline;
          font-size: 0.9rem;
        }

        .share-link:hover, .tx-link:hover {
          text-decoration: none;
        }

        .mint-error {
          background: #ffebee;
          border: 1px solid #f44336;
          border-radius: 4px;
          padding: 8px;
          color: #d32f2f;
        }

        .error-text {
          font-weight: bold;
          margin: 0;
        }

        .error-hint {
          font-size: 0.9rem;
          margin: 4px 0 0 0;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}