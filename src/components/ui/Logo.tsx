import { type FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { height: 32, iconSize: 28 },
  md: { height: 42, iconSize: 36 },
  lg: { height: 58, iconSize: 52 },
  xl: { height: 96, iconSize: 80 },
};

/**
 * Official DPS Buzz Brand Logo
 * Automatic Dark/Light mode theme switching:
 * - In Dark Mode: Displays white "DPS" with yellow drop-shadow & electric violet "BUZZ"
 * - In Light Mode: Displays black "DPS" with yellow drop-shadow & electric violet "BUZZ"
 */
const Logo: FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const cfg = sizeMap[size];

  if (!showText) {
    return (
      <div
        className={`relative overflow-hidden rounded-[12px] shadow-sm flex-shrink-0 select-none ${className}`}
        style={{ width: cfg.iconSize, height: cfg.iconSize }}
      >
        {/* Light Mode App Tile */}
        <img
          src="/icons/logo.png"
          alt="DPS Buzz Icon"
          width={cfg.iconSize}
          height={cfg.iconSize}
          className="w-full h-full object-cover rounded-[12px] logo-light-img"
        />
        {/* Dark Mode App Tile */}
        <img
          src="/icons/logo_dark.png"
          alt="DPS Buzz Icon"
          width={cfg.iconSize}
          height={cfg.iconSize}
          className="w-full h-full object-cover rounded-[12px] logo-dark-img"
        />
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      {/* Light Mode Logo (Black DPS) */}
      <img
        src="/icons/wordmark.png"
        alt="DPS Buzz"
        style={{ height: cfg.height, width: 'auto' }}
        className="object-contain max-w-full drop-shadow-xs pointer-events-none logo-light-img"
      />
      {/* Dark Mode Logo (White DPS - high contrast against dark backgrounds) */}
      <img
        src="/icons/wordmark_dark.png"
        alt="DPS Buzz"
        style={{ height: cfg.height, width: 'auto' }}
        className="object-contain max-w-full drop-shadow-sm pointer-events-none logo-dark-img"
      />
    </div>
  );
};

export default Logo;
