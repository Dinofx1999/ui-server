
// LongCandleIcon.tsx
import React from 'react';

interface LongCandleIconProps {
  size?: number;
  color?: string;
  className?: string;
}

interface BidIconProps {
  size?: number;
  color?: string;
}

export const LongCandleIcon: React.FC<LongCandleIconProps> = ({ 
  size = 16, 
  color = '#10b981',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    style={{ 
      verticalAlign: 'middle',  // ✅ Fix chính
      marginRight: '4px'         // spacing với text
    }}
    className={className}
  >
    <line x1="12" y1="2" x2="12" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <rect x="8" y="6" width="8" height="12" fill={color} rx="1"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CandleChartIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Candle 1 - Short */}
    <line x1="5" y1="8" x2="5" y2="10" stroke="#ef4444" strokeWidth="1.5"/>
    <rect x="3.5" y="10" width="3" height="6" fill="#ef4444" rx="0.5"/>
    <line x1="5" y1="16" x2="5" y2="18" stroke="#ef4444" strokeWidth="1.5"/>
    
    {/* Candle 2 - Long (highlighted) */}
    <line x1="12" y1="4" x2="12" y2="8" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
    <rect x="9.5" y="8" width="5" height="10" fill="#10b981" rx="1"/>
    <line x1="12" y1="18" x2="12" y2="20" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
    
    {/* Candle 3 - Medium */}
    <line x1="19" y1="10" x2="19" y2="12" stroke="#10b981" strokeWidth="1.5"/>
    <rect x="17.5" y="12" width="3" height="5" fill="#10b981" rx="0.5"/>
    <line x1="19" y1="17" x2="19" y2="19" stroke="#10b981" strokeWidth="1.5"/>
  </svg>
);

export const LongCandleWithBadge = ({ value, size = 16 }: { value: number; size?: number }) => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <LongCandleIcon size={size} color="#10b981" />
    {value > 0 && (
      <span style={{
        position: 'absolute',
        top: -6,
        right: -6,
        background: '#10b981',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
        borderRadius: '10px',
        padding: '2px 4px',
        minWidth: '16px',
        textAlign: 'center',
      }}>
        {value}
      </span>
    )}
  </div>
);

export const BidPriceIcon: React.FC<BidIconProps> = ({ 
  size = 14, 
  color = '#ef4444' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
    }}
  >
    {/* Price Tag */}
    <path 
      d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="7" cy="7" r="1.5" fill={color} />
    
    {/* Small arrow down */}
    <path 
      d="M15 10 L15 14 M15 14 L13 12 M15 14 L17 12" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const BidIcon: React.FC<BidIconProps> = ({ 
  size = 14, 
  color = '#ef4444' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
    }}
  >
    {/* Arrow Down */}
    <path 
      d="M12 5 L12 19 M12 19 L6 13 M12 19 L18 13" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);