import { NextRequest, NextResponse } from 'next/server';
import { DataFetcher } from '@/lib/data-fetcher';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    const fidNumber = parseInt(fid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID format' }, { status: 400 });
    }

    // Use the DataFetcher to get Farcaster profile data
    const dataFetcher = new DataFetcher();
    
    // Create a minimal snapshot to test the Farcaster fetching
    const snapshot = await dataFetcher.fetchUserSnapshot({ 
      user: { fid: fidNumber } 
    }, undefined);

    // Return just the Farcaster data portion
    const farcasterData = {
      fid: snapshot.farcaster.fid,
      username: snapshot.farcaster.username,
      displayName: snapshot.farcaster.displayName,
      pfpUrl: snapshot.farcaster.pfpUrl,
      followerCount: snapshot.farcaster.followerCount,
      followingCount: snapshot.farcaster.followingCount,
      verifications: snapshot.farcaster.verifications || [],
    };

    console.log(`API: Returning Farcaster data for FID ${fidNumber}:`, farcasterData);

    return NextResponse.json(farcasterData);
  } catch (error) {
    console.error('Error fetching Farcaster data:', error);
    return NextResponse.json({ error: 'Failed to fetch Farcaster data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fid, context } = await req.json();

    if (!fid) {
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    // Use the DataFetcher with full context if provided
    const dataFetcher = new DataFetcher();
    const snapshot = await dataFetcher.fetchUserSnapshot(context || { user: { fid } }, undefined);

    const farcasterData = {
      fid: snapshot.farcaster.fid,
      username: snapshot.farcaster.username,
      displayName: snapshot.farcaster.displayName,
      pfpUrl: snapshot.farcaster.pfpUrl,
      followerCount: snapshot.farcaster.followerCount,
      followingCount: snapshot.farcaster.followingCount,
      verifications: snapshot.farcaster.verifications || [],
    };

    return NextResponse.json(farcasterData);
  } catch (error) {
    console.error('Error fetching Farcaster data:', error);
    return NextResponse.json({ error: 'Failed to fetch Farcaster data' }, { status: 500 });
  }
} 