import { NextRequest, NextResponse } from 'next/server';
import { DataFetcher } from '@/lib/data-fetcher';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Use the actual DataFetcher to get real onchain data
    const dataFetcher = new DataFetcher();
    const snapshot = await dataFetcher.fetchUserSnapshot(null, address);

    // Return the onchain data portion of the snapshot
    const walletData = {
      balance: snapshot.wallet.balance || "0",
      chainId: snapshot.wallet.chainId || 8453,
      transactionCount: snapshot.onchain.transactionCount || 0,
      firstTransactionDate: snapshot.onchain.firstTransactionDate?.toISOString() || null,
      lastActivityDate: snapshot.onchain.lastActivityDate?.toISOString() || null,
      tokenCount: snapshot.onchain.tokenCount || 0,
      nftCount: snapshot.onchain.nftCount || 0,
      defiProtocols: snapshot.onchain.defiProtocols || [],
      userType: snapshot.onchain.userType || 'newcomer',
      activityLevel: snapshot.onchain.activityLevel || 'new',
    };

    return NextResponse.json(walletData);
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
  }
} 