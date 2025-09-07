import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid') || '12152'; // Default FID for testing

    console.log('Testing Neynar API with FID:', fid);
    
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    
    if (!neynarApiKey) {
      return NextResponse.json({ 
        error: 'No Neynar API key found',
        hasKey: false 
      }, { status: 400 });
    }

    console.log('API key available, making request...');
    
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'Accept': 'application/json',
        'api_key': neynarApiKey,
      },
    });

    console.log('Neynar response status:', response.status);
    console.log('Neynar response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error:', errorText);
      return NextResponse.json({
        error: 'Neynar API failed',
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        hasKey: true
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Neynar API success:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      hasKey: true,
      fid: fid,
      data: data,
      userCount: data.users ? data.users.length : 0,
      firstUser: data.users && data.users.length > 0 ? {
        fid: data.users[0].fid,
        username: data.users[0].username,
        followerCount: data.users[0].follower_count,
        followingCount: data.users[0].following_count
      } : null
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error),
      hasKey: !!process.env.NEYNAR_API_KEY
    }, { status: 500 });
  }
} 