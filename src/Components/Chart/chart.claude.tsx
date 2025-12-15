import React from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OHLCData {
  time: string;
  high: number;
  low: number;
  open: number;
  close: number;
  volume?: number;
}

export interface BidAskData {
  bid: number;
  ask: number;
  timestamp?: string;
}

export interface CandleConfig {
  width: number;
  spacing: number;
  wickWidth: number;
  heightScale: number;
}

export interface SingleChartProps {
  title: string;
  symbol?: string;
  data: OHLCData[];
  bidAsk?: BidAskData;
  candleConfig?: CandleConfig | 'ultra-compact' | 'compact' | 'slim';
  width?: number;
  height?: number;
  showGrid?: boolean;
  accentColor?: string;
  showHeader?: boolean;      // Ẩn/hiện header
  showFooter?: boolean;      // Ẩn/hiện footer
  showOHLCStats?: boolean;   // Ẩn/hiện OHLC stats
  compactMode?: 'ultra' | 'tight' | 'normal'; // Mức độ compact
}

// ============================================================================
// PRESET CONFIGS
// ============================================================================

const CANDLE_PRESETS: Record<string, CandleConfig> = {
  'ultra-compact': {
    width: 6,
    spacing: 35,
    wickWidth: 0.8,
    heightScale: 2.0
  },
  'compact': {
    width: 8,
    spacing: 40,
    wickWidth: 1,
    heightScale: 1.8
  },
  'slim': {
    width: 10,
    spacing: 50,
    wickWidth: 1.5,
    heightScale: 1.6
  }
};

// ============================================================================
// ULTRA-COMPACT CHART WITH MINIMAL BACKGROUND
// ============================================================================

const SingleChart: React.FC<SingleChartProps> = ({
  title,
  symbol = "",
  data,
  bidAsk,
  candleConfig = 'ultra-compact',
  width = 340,
  height = 240,
  showGrid = true,
  accentColor = '#3b82f6',
  showHeader = true,
  showFooter = true,
  showOHLCStats = true,
  compactMode = 'ultra'
}) => {
  
  const getCandleConfig = (): CandleConfig => {
    if (typeof candleConfig === 'string') {
      return CANDLE_PRESETS[candleConfig] || CANDLE_PRESETS['ultra-compact'];
    }
    return candleConfig;
  };

  const candle = getCandleConfig();

  // Compact mode settings
  const compactSettings = {
    'ultra': {
      headerPadding: '8px 10px',
      chartPadding: '8px',
      footerPadding: '4px 10px',
      borderRadius: '8px',
      headerMarginBottom: '4px',
      statsMarginTop: '4px',
      statsGap: '8px',
      bidAskGap: '6px',
      margin: { top: 25, right: 45, bottom: 25, left: 40 }
    },
    'tight': {
      headerPadding: '10px 12px',
      chartPadding: '10px',
      footerPadding: '5px 12px',
      borderRadius: '10px',
      headerMarginBottom: '5px',
      statsMarginTop: '5px',
      statsGap: '10px',
      bidAskGap: '8px',
      margin: { top: 28, right: 48, bottom: 28, left: 42 }
    },
    'normal': {
      headerPadding: '12px 14px',
      chartPadding: '14px',
      footerPadding: '6px 14px',
      borderRadius: '10px',
      headerMarginBottom: '6px',
      statsMarginTop: '6px',
      statsGap: '10px',
      bidAskGap: '8px',
      margin: { top: 30, right: 50, bottom: 30, left: 45 }
    }
  };

  const settings = compactSettings[compactMode];
  const margin = settings.margin;

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const calculateChartData = (ohlcData: OHLCData[]) => {
    const allPrices = ohlcData.flatMap(d => [d.high, d.low, d.open, d.close]);
    
    if (bidAsk) {
      allPrices.push(bidAsk.bid, bidAsk.ask);
    }
    
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice;
    
    const padding = priceRange * 0.08; // Giảm từ 0.1 → 0.08
    const paddedMax = maxPrice + padding;
    const paddedMin = minPrice - padding;
    const paddedRange = paddedMax - paddedMin;
    
    return {
      maxPrice: paddedMax,
      minPrice: paddedMin,
      priceRange: paddedRange,
      scale: (price: number): number => {
        return ((paddedMax - price) / paddedRange) * chartHeight;
      }
    };
  };

  const chartInfo = calculateChartData(data);

  const Candlestick: React.FC<{ 
    candle: OHLCData; 
    index: number; 
    scale: (price: number) => number 
  }> = ({ candle: candleData, index, scale }) => {
    
    const x = (index + 0.5) * (chartWidth / data.length);
    const isGreen = candleData.close >= candleData.open;
    
    const highY = scale(candleData.high);
    const lowY = scale(candleData.low);
    const openY = scale(candleData.open);
    const closeY = scale(candleData.close);
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY) || 1.5;
    const bodyColor = isGreen ? '#10b981' : '#ef4444';
    const halfWidth = candle.width / 2;
    
    return (
      <g>
        <line
          x1={x}
          y1={highY}
          x2={x}
          y2={lowY}
          stroke={bodyColor}
          strokeWidth={candle.wickWidth}
          strokeLinecap="round"
        />
        <rect
          x={x - halfWidth}
          y={bodyTop}
          width={candle.width}
          height={bodyHeight}
          fill={bodyColor}
          stroke={bodyColor}
          strokeWidth="0.5"
          rx="1"
        />
      </g>
    );
  };

  const PriceGrid: React.FC<{ scale: (price: number) => number }> = ({ scale }) => {
    const steps = 4;
    const priceStep = chartInfo.priceRange / steps;
    
    return (
      <g>
        {[...Array(steps + 1)].map((_, i) => {
          const price = chartInfo.maxPrice - (priceStep * i);
          const y = scale(price);
          
          return (
            <g key={i}>
              {showGrid && (
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="0.5"
                  strokeDasharray="3,2"
                  opacity="0.3"
                />
              )}
              <text
                x={chartWidth + 6}
                y={y + 3}
                fill="#9ca3af"
                fontSize="8"
                fontFamily="monospace"
              >
                {price.toFixed(4)}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const TimeAxis: React.FC = () => {
    return (
      <g>
        <line
          x1={0}
          y1={chartHeight}
          x2={chartWidth}
          y2={chartHeight}
          stroke="#475569"
          strokeWidth="1.5"
        />
        
        {data.map((candle, index) => {
          const x = (index + 0.5) * (chartWidth / data.length);
          return (
            <text
              key={index}
              x={x}
              y={chartHeight + 14}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="8"
              fontWeight="500"
              fontFamily="monospace"
            >
              {candle.time}
            </text>
          );
        })}
      </g>
    );
  };

  const PriceAxis: React.FC = () => {
    return (
      <g>
        <line
          x1={chartWidth}
          y1={0}
          x2={chartWidth}
          y2={chartHeight}
          stroke="#475569"
          strokeWidth="1.5"
        />
        
        <text
          x={chartWidth + 23}
          y={-12}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="7"
          fontWeight="600"
        >
          PRICE
        </text>
      </g>
    );
  };

  const BidAskLines: React.FC<{ scale: (price: number) => number }> = ({ scale }) => {
    if (!bidAsk) return null;
    
    const bidY = scale(bidAsk.bid);
    const askY = scale(bidAsk.ask);
    
    return (
      <g>
        {/* Bid Line */}
        <g>
          <line
            x1={0}
            y1={bidY}
            x2={chartWidth}
            y2={bidY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="5,3"
            opacity="0.7"
          />
          <rect
            x={chartWidth + 3}
            y={bidY - 7}
            width={38}
            height={14}
            fill="#10b981"
            rx="2"
          />
          <text
            x={chartWidth + 22}
            y={bidY + 3}
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {bidAsk.bid.toFixed(4)}
          </text>
          <text
            x={chartWidth - 6}
            y={bidY - 3}
            textAnchor="end"
            fill="#10b981"
            fontSize="7"
            fontWeight="600"
          >
            BID
          </text>
        </g>
        
        {/* Ask Line */}
        <g>
          <line
            x1={0}
            y1={askY}
            x2={chartWidth}
            y2={askY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="5,3"
            opacity="0.7"
          />
          <rect
            x={chartWidth + 3}
            y={askY - 7}
            width={38}
            height={14}
            fill="#ef4444"
            rx="2"
          />
          <text
            x={chartWidth + 22}
            y={askY + 3}
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {bidAsk.ask.toFixed(4)}
          </text>
          <text
            x={chartWidth - 6}
            y={askY - 3}
            textAnchor="end"
            fill="#ef4444"
            fontSize="7"
            fontWeight="600"
          >
            ASK
          </text>
        </g>
        
        {/* Spread */}
        <g>
          <line
            x1={chartWidth - 18}
            y1={bidY}
            x2={chartWidth - 18}
            y2={askY}
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          <text
            x={chartWidth - 21}
            y={(bidY + askY) / 2 + 2}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="6"
            fontWeight="600"
          >
            {((bidAsk.ask - bidAsk.bid) * 10000).toFixed(1)}p
          </text>
        </g>
      </g>
    );
  };

  const OHLCStats: React.FC = () => {
    if (!showOHLCStats) return null;
    
    const stats = {
      open: data[0].open,
      high: Math.max(...data.map(d => d.high)),
      low: Math.min(...data.map(d => d.low)),
      close: data[data.length - 1].close
    };
    
    return (
      <div style={{
        display: 'flex',
        gap: settings.statsGap,
        fontSize: '9px',
        marginTop: settings.statsMarginTop
      }}>
        <div>
          <span style={{ color: '#94a3b8' }}>O:</span>
          <span style={{ color: '#cbd5e1', fontWeight: 600, fontFamily: 'monospace', marginLeft: '2px' }}>
            {stats.open.toFixed(4)}
          </span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>H:</span>
          <span style={{ color: '#10b981', fontWeight: 600, fontFamily: 'monospace', marginLeft: '2px' }}>
            {stats.high.toFixed(4)}
          </span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>L:</span>
          <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: 'monospace', marginLeft: '2px' }}>
            {stats.low.toFixed(4)}
          </span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>C:</span>
          <span style={{ color: '#3b82f6', fontWeight: 600, fontFamily: 'monospace', marginLeft: '2px' }}>
            {stats.close.toFixed(4)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: settings.borderRadius,
      border: '1.5px solid #334155',
      overflow: 'hidden',
      width: 'fit-content'
    }}>
      {/* Header - Ultra Compact */}
      {showHeader && (
        <div style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 100%)`,
          borderBottom: '1.5px solid #334155',
          padding: settings.headerPadding
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: settings.headerMarginBottom
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '2px',
                height: '14px',
                background: accentColor,
                borderRadius: '1px'
              }}></div>
              <h3 style={{
                color: 'white',
                fontSize: '13px',
                fontWeight: 'bold',
                margin: 0
              }}>
                {title}
              </h3>
              {symbol && (
                <span style={{
                  color: '#94a3b8',
                  fontSize: '10px',
                  fontWeight: 500
                }}>
                  {symbol}
                </span>
              )}
            </div>
            
            {bidAsk && (
              <div style={{
                display: 'flex',
                gap: settings.bidAskGap,
                alignItems: 'center',
                padding: '3px 6px',
                background: '#1e293b',
                borderRadius: '4px',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{
                    width: '5px',
                    height: '5px',
                    background: '#10b981',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{ color: '#94a3b8', fontSize: '8px' }}>BID</span>
                  <span style={{ 
                    color: '#10b981', 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                  }}>
                    {bidAsk.bid.toFixed(4)}
                  </span>
                </div>
                <div style={{
                  width: '1px',
                  height: '12px',
                  background: '#334155'
                }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{
                    width: '5px',
                    height: '5px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{ color: '#94a3b8', fontSize: '8px' }}>ASK</span>
                  <span style={{ 
                    color: '#ef4444', 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                  }}>
                    {bidAsk.ask.toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <OHLCStats />
        </div>
      )}

      {/* Chart Area - Minimal Padding */}
      <div style={{
        background: '#020617',
        padding: settings.chartPadding
      }}>
        <svg 
          width={width} 
          height={height}
          style={{
            background: '#020617'
          }}
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <PriceGrid scale={chartInfo.scale} />
            
            {data.map((candleData, index) => (
              <Candlestick
                key={index}
                candle={candleData}
                index={index}
                scale={chartInfo.scale}
              />
            ))}
            
            <BidAskLines scale={chartInfo.scale} />
            
            <TimeAxis />
            <PriceAxis />
          </g>
          
          <rect
            x={margin.left}
            y={margin.top}
            width={chartWidth}
            height={chartHeight}
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
          />
          
          <text
            x={margin.left + chartWidth / 2}
            y={height - 3}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="7"
            fontWeight="600"
          >
            TIME
          </text>
        </svg>
      </div>

      {/* Footer - Ultra Compact */}
      {showFooter && (
        <div style={{
          background: '#0f172a',
          borderTop: '1px solid #334155',
          padding: settings.footerPadding,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '8px',
          color: '#64748b'
        }}>
          <div>⚡ Live</div>
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '1px' }}></div>
              <span>↑</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '1px' }}></div>
              <span>↓</span>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default SingleChart;