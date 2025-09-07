import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'default';
    const address = searchParams.get('address');
    const txCount = parseInt(searchParams.get('txCount') || '0');
    const tokenCount = parseInt(searchParams.get('tokenCount') || '0');
    const ethPrice = parseInt(searchParams.get('ethPrice') || '0');

    // Generate dynamic embed based on mode
    let title = 'BaseDrum - Onchain Music Generator';
    let subtitle = 'Transform your wallet data into techno beats';
    let bgGradient = 'linear-gradient(135deg, #000000 0%, #1e40af 50%, #7c3aed 100%)';
    let accentColor = '#3b82f6';
    let emoji = '🎵';

    if (mode === 'personalized' && address) {
      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      
      // Customize based on user data
      if (txCount > 100) {
        title = `${shortAddress}'s Complex Beat`;
        subtitle = `${txCount} transactions → Syncopated rhythms`;
        bgGradient = 'linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #f59e0b 100%)';
        accentColor = '#dc2626';
        emoji = '🔥';
      } else if (txCount > 25) {
        title = `${shortAddress}'s Active Beat`;
        subtitle = `${txCount} transactions → Enhanced patterns`;
        bgGradient = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)';
        accentColor = '#3b82f6';
        emoji = '⚡';
      } else if (txCount === 0) {
        title = `Welcome to Web3, ${shortAddress}`;
        subtitle = 'Starting with a classic 4/4 beat';
        bgGradient = 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #9ca3af 100%)';
        accentColor = '#6b7280';
        emoji = '👋';
      }

      if (ethPrice > 4000) {
        subtitle += ' • ETH at moon levels! 🚀';
      } else if (ethPrice > 3000) {
        subtitle += ' • ETH in bull mode 📈';
      }

      if (tokenCount > 20) {
        subtitle += ` • ${tokenCount} tokens = DeFi bass`;
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: bgGradient,
            fontFamily: 'system-ui',
            position: 'relative',
          }}
        >
          {/* Animated background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                ${accentColor} 10px,
                ${accentColor} 20px
              )`,
            }}
          />

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '60px',
              zIndex: 1,
            }}
          >
            {/* Emoji */}
            <div
              style={{
                fontSize: '120px',
                marginBottom: '40px',
              }}
            >
              {emoji}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: 'white',
                marginBottom: '20px',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                letterSpacing: '2px',
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: '32px',
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                maxWidth: '800px',
                lineHeight: 1.3,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {subtitle}
            </div>

            {/* Visual elements */}
            {mode === 'personalized' && (
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  marginTop: '40px',
                  alignItems: 'center',
                }}
              >
                {/* Kick pattern visualization */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 4, 8, 12].map((step, i) => (
                    <div
                      key={i}
                      style={{
                        width: '20px',
                        height: '20px',
                        background: accentColor,
                        borderRadius: '2px',
                        boxShadow: `0 0 10px ${accentColor}`,
                      }}
                    />
                  ))}
                </div>
                
                <div style={{ color: 'white', fontSize: '24px' }}>→</div>
                
                {/* Enhanced pattern for active users */}
                {txCount > 25 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[0, 2, 4, 8, 10, 12].map((step, i) => (
                      <div
                        key={i}
                        style={{
                          width: '20px',
                          height: '20px',
                          background: '#fbbf24',
                          borderRadius: '2px',
                          boxShadow: '0 0 10px #fbbf24',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '40px',
              fontSize: '24px',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 600,
            }}
          >
            BaseDrum
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Failed to generate the image`, e);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}