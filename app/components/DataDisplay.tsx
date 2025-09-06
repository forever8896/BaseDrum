"use client";

import { useState } from 'react';
import { UserDataSnapshot } from '../../lib/data-fetcher';

interface DataDisplayProps {
  snapshot: UserDataSnapshot | null;
  musicInterpretation: Record<string, string | number> | null;
  onClose?: () => void;
}

export function DataDisplay({ snapshot, musicInterpretation, onClose }: DataDisplayProps) {
  const [activeTab, setActiveTab] = useState<'farcaster' | 'context' | 'wallet' | 'onchain' | 'prices' | 'music'>('farcaster');

  if (!snapshot) {
    return (
      <div className="card-base p-4 text-center">
        <p className="text-[var(--app-foreground-muted)]">Click a drum step to see your data!</p>
      </div>
    );
  }

  const tabs = [
    { id: 'farcaster', label: 'Farcaster', data: snapshot.farcaster },
    { id: 'context', label: 'Context', data: snapshot.context },
    { id: 'wallet', label: 'Wallet', data: snapshot.wallet },
    { id: 'onchain', label: 'Onchain', data: snapshot.onchain },
    { id: 'prices', label: 'Crypto Prices', data: snapshot.prices },
    { id: 'music', label: 'Music Mapping', data: musicInterpretation },
  ] as const;

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--app-foreground)]">
          Your Digital Identity Data
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] text-xl"
          >
            ×
          </button>
        )}
      </div>

      <div className="text-xs text-[var(--app-foreground-muted)]">
        Captured at {snapshot.timestamp.toLocaleTimeString()}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--app-card-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--app-accent)] text-white'
                : 'text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]'
            }`}
          >
            {tab.label}
            {tab.data && Object.keys(tab.data).length > 0 && (
              <span className="ml-1 text-xs opacity-70">
                ({Object.keys(tab.data).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
        {activeTab === 'farcaster' && (
          <div className="space-y-3">
            <h4 className="font-medium text-[var(--app-foreground)]">Farcaster Profile (Mini App Context)</h4>
            <div className="text-xs text-[var(--app-foreground-muted)] mb-3">
              Raw data from Mini App context:
            </div>
            <div className="bg-[var(--app-card-background)] p-3 rounded border text-xs font-mono">
              <pre>{JSON.stringify(snapshot.farcaster, null, 2)}</pre>
            </div>
            {Object.keys(snapshot.farcaster).length === 0 ? (
              <p className="text-[var(--app-foreground-muted)] text-sm">No Farcaster data available</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 text-sm">
                {snapshot.farcaster.fid && (
                  <div className="flex justify-between">
                    <span className="text-[var(--app-foreground-muted)]">FID:</span>
                    <span className="text-[var(--app-foreground)] font-mono">{snapshot.farcaster.fid}</span>
                  </div>
                )}
                {snapshot.farcaster.username && (
                  <div className="flex justify-between">
                    <span className="text-[var(--app-foreground-muted)]">Username:</span>
                    <span className="text-[var(--app-foreground)]">@{snapshot.farcaster.username}</span>
                  </div>
                )}
                {snapshot.farcaster.displayName && (
                  <div className="flex justify-between">
                    <span className="text-[var(--app-foreground-muted)]">Display Name:</span>
                    <span className="text-[var(--app-foreground)]">{snapshot.farcaster.displayName}</span>
                  </div>
                )}
                {snapshot.farcaster.pfpUrl && (
                  <div className="flex justify-between">
                    <span className="text-[var(--app-foreground-muted)]">Profile Pic:</span>
                    <span className="text-[var(--app-foreground)] text-xs break-all">{snapshot.farcaster.pfpUrl}</span>
                  </div>
                )}
                {snapshot.farcaster.followerCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[var(--app-foreground-muted)]">Followers:</span>
                    <span className="text-[var(--app-accent)] font-semibold">{snapshot.farcaster.followerCount}</span>
                  </div>
                )}
                {snapshot.farcaster.followingCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[var(--app-foreground-muted)]">Following:</span>
                    <span className="text-[var(--app-accent)] font-semibold">{snapshot.farcaster.followingCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'context' && (
          <div className="space-y-3">
            <h4 className="font-medium text-[var(--app-foreground)]">App Context</h4>
            <div className="text-xs text-[var(--app-foreground-muted)] mb-3">
              Raw context data:
            </div>
            <div className="bg-[var(--app-card-background)] p-3 rounded border text-xs font-mono">
              <pre>{JSON.stringify(snapshot.context, null, 2)}</pre>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {snapshot.context.entryPoint && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">Entry Point:</span>
                  <span className="text-[var(--app-accent)] font-semibold capitalize">
                    {snapshot.context.entryPoint.replace('_', ' ')}
                  </span>
                </div>
              )}
              {snapshot.context.platformType && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">Platform:</span>
                  <span className="text-[var(--app-foreground)] capitalize">{snapshot.context.platformType}</span>
                </div>
              )}
              {snapshot.context.added !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">App Saved:</span>
                  <span className={snapshot.context.added ? "text-green-500" : "text-orange-500"}>
                    {snapshot.context.added ? "Yes" : "No"}
                  </span>
                </div>
              )}
              {snapshot.context.sharedBy && (
                <div className="space-y-1">
                  <div className="text-[var(--app-foreground-muted)]">Shared by:</div>
                  <div className="text-[var(--app-foreground)] pl-2">
                    @{snapshot.context.sharedBy.username} (FID: {snapshot.context.sharedBy.fid})
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-3">
            <h4 className="font-medium text-[var(--app-foreground)]">Wallet Info</h4>
            <div className="text-xs text-[var(--app-foreground-muted)] mb-3">
              Raw wallet data:
            </div>
            <div className="bg-[var(--app-card-background)] p-3 rounded border text-xs font-mono">
              <pre>{JSON.stringify(snapshot.wallet, null, 2)}</pre>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--app-foreground-muted)]">Connected:</span>
                <span className={snapshot.wallet.isConnected ? "text-green-500" : "text-red-500"}>
                  {snapshot.wallet.isConnected ? "Yes" : "No"}
                </span>
              </div>
              {snapshot.wallet.address && (
                <div className="space-y-1">
                  <div className="text-[var(--app-foreground-muted)]">Address:</div>
                  <div className="text-[var(--app-foreground)] font-mono text-xs break-all">
                    {snapshot.wallet.address}
                  </div>
                </div>
              )}
              {snapshot.wallet.balance && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">ETH Balance:</span>
                  <span className="text-[var(--app-accent)] font-semibold">{snapshot.wallet.balance} ETH</span>
                </div>
              )}
              {snapshot.wallet.chainId && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">Chain:</span>
                  <span className="text-[var(--app-foreground)]">
                    {snapshot.wallet.chainId === 8453 ? 'Base' : `Chain ${snapshot.wallet.chainId}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'onchain' && (
          <div className="space-y-3">
            <h4 className="font-medium text-[var(--app-foreground)]">Onchain Activity</h4>
            <div className="text-xs text-[var(--app-foreground-muted)] mb-3">
              Raw onchain data (from OnchainKit getPortfolios API):
            </div>
            <div className="bg-[var(--app-card-background)] p-3 rounded border text-xs font-mono">
              <pre>{JSON.stringify(snapshot.onchain, null, 2)}</pre>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {snapshot.onchain.transactionCount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">Transactions:</span>
                  <span className="text-[var(--app-accent)] font-semibold">{snapshot.onchain.transactionCount}</span>
                </div>
              )}
              {snapshot.onchain.tokenCount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">Tokens Held:</span>
                  <span className="text-[var(--app-accent)] font-semibold">{snapshot.onchain.tokenCount}</span>
                </div>
              )}
              {snapshot.onchain.nftCount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">NFTs:</span>
                  <span className="text-[var(--app-accent)] font-semibold">{snapshot.onchain.nftCount}</span>
                </div>
              )}
              {snapshot.onchain.firstTransactionDate && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-foreground-muted)]">First TX:</span>
                  <span className="text-[var(--app-foreground)]">
                    {snapshot.onchain.firstTransactionDate.toLocaleDateString()}
                  </span>
                </div>
              )}
              {snapshot.onchain.defiProtocols && snapshot.onchain.defiProtocols.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[var(--app-foreground-muted)]">DeFi Protocols:</div>
                  <div className="flex flex-wrap gap-1">
                    {snapshot.onchain.defiProtocols.map((protocol, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[var(--app-accent)] text-white text-xs rounded"
                      >
                        {protocol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="space-y-3">
            <h4 className="font-medium text-[var(--app-foreground)]">Live Crypto Prices</h4>
            <div className="text-xs text-[var(--app-foreground-muted)] mb-3">
              Real-time prices from Redstone API (secured on Arweave):
            </div>
            {(!snapshot.prices.eth && !snapshot.prices.btc) ? (
              <div className="text-center py-6">
                <p className="text-[var(--app-foreground-muted)] text-sm mb-2">No live price data available</p>
                <p className="text-xs text-[var(--app-foreground-muted)]">
                  API connection failed - music generated without price influences
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {snapshot.prices.eth && (
                  <div className="bg-[var(--app-card-background)] p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          ETH
                        </div>
                        <span className="text-[var(--app-foreground)] font-medium">Ethereum</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[var(--app-foreground)] font-mono text-lg">
                          ${snapshot.prices.eth.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {snapshot.prices.btc && (
                  <div className="bg-[var(--app-card-background)] p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          BTC
                        </div>
                        <span className="text-[var(--app-foreground)] font-medium">Bitcoin</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[var(--app-foreground)] font-mono text-lg">
                          ${snapshot.prices.btc.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {snapshot.prices.fetchedAt && (
                  <div className="text-xs text-[var(--app-foreground-muted)] text-center pt-2 border-t border-[var(--app-card-border)]">
                    Fetched at {snapshot.prices.fetchedAt.toLocaleTimeString()}
                  </div>
                )}
                
                                 <div className="text-xs text-[var(--app-foreground-muted)] bg-blue-50 border border-blue-200 rounded p-2">
                   🎵 These prices influence your music: ETH affects rhythm complexity, BTC affects bass depth and energy levels
                   {(!snapshot.prices.eth || !snapshot.prices.btc) && (
                     <div className="mt-1 text-orange-600">
                       ⚠️ Some prices unavailable due to API connection issues
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'music' && (
          <div className="space-y-3">
            <h4 className="font-medium text-[var(--app-foreground)]">Music Interpretation</h4>
            {!musicInterpretation || Object.keys(musicInterpretation).length === 0 ? (
              <p className="text-[var(--app-foreground-muted)] text-sm">No music data generated yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(musicInterpretation).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-[var(--app-foreground-muted)] text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                    </div>
                    <div className="text-[var(--app-foreground)] pl-2">
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                    </div>
                    {key === 'drumComplexity' && typeof value === 'number' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 ml-2">
                        <div
                          className="bg-[var(--app-accent)] h-2 rounded-full"
                          style={{ width: `${value * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 