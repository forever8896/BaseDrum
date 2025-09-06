import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Mock data for now - in a real implementation, you'd fetch from Base RPC or Alchemy
    const mockData = {
      balance: "1.234", // ETH balance
      chainId: 8453, // Base mainnet
      transactionCount: Math.floor(Math.random() * 500) + 10,
      firstTransactionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      tokenCount: Math.floor(Math.random() * 20) + 1,
      nftCount: Math.floor(Math.random() * 10),
      defiProtocols: ['Uniswap', 'Compound', 'Aave'].slice(0, Math.floor(Math.random() * 3) + 1),
    };

    // Simulate some realistic data based on address
    const addressNumber = parseInt(address.slice(-4), 16);
    mockData.transactionCount = Math.floor(addressNumber / 10) + 10;
    mockData.tokenCount = Math.floor(addressNumber / 100) + 1;
    mockData.balance = (addressNumber / 10000).toFixed(3);

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
  }
} 