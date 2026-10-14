import { ImageResponse } from 'next/og';

export const alt = 'DPS Buzz — Official Student Social Network | Dilsukhnagar Public School';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow backdrop circles */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'rgba(236, 72, 153, 0.25)',
          }}
        />

        {/* Brand Icon + Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '26px',
              background: 'linear-gradient(135deg, #833AB4 0%, #C13584 50%, #F77737 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '52px',
              boxShadow: '0 20px 40px rgba(193, 53, 132, 0.4)',
            }}
          >
            🐝
          </div>
          <span
            style={{
              fontSize: '76px',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-2px',
            }}
          >
            DPS Buzz
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '34px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          Your School. Your People. Your Vibe.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '22px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '850px',
            lineHeight: 1.4,
          }}
        >
          Official Student Social Network • Dilsukhnagar Public School (DPS)
        </div>

        {/* Badges footer */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '44px',
          }}
        >
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              color: '#f4f4f5',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            📱 Official Android APK v1.4
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              color: '#f4f4f5',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            📢 Circulars & Notices
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              color: '#f4f4f5',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            🏆 School Star Board
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
