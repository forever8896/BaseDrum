import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = 'https://api.redstone.finance/prices';
    
    const response = await fetch(`${apiUrl}?symbols=ETH,BTC`, {
      headers: {
        'Accept': 'application/json',
      },
      // Server-side fetch doesn't have CORS restrictions
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    
    // Return empty prices rather than error to prevent app crash
    return NextResponse.json({
      ETH: { value: undefined },
      BTC: { value: undefined },
    });
  }
}