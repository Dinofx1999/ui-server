import React from 'react';
import { Modal } from 'antd';

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

export interface ExchangeData {
  name: string;
  color: string;
  data: OHLCData[];
}

export interface DualExchangeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;
  exchange1: ExchangeData;
  exchange2: ExchangeData;
  timeframe?: string;
}

// ============================================================================
// COMPACT CHART WITH ANT DESIGN MODAL
// ============================================================================

const DualExchangeChartModal: React.FC<DualExchangeChartModalProps> = ({
  isOpen,
  onClose,
  symbol = "EUR/USD",
  exchange1,
  exchange2,
  timeframe = "1H"
}) => {
  
  // Compact config
  const config = {
    chartHeight: 160,      // Thu nhỏ hơn nữa
    chartWidth: 250,       
    candleWidth: 12,       // Nến nhỏ hơn
    candleSpacing: 20,     
    candleStartX: 55,      
    fontSize: 8,           
    timeY: 150,           
    gridSteps: 3,          
    scaleHeight: 115,      
    scaleOffset: 12        
  };

  // Component vẽ biểu đồ compact
  const ChartView: React.FC<{ data: OHLCData[]; exchangeName: string; accentColor: string }> = ({ 
    data, 
    exchangeName, 
    accentColor 
  }) => {
    const calculateChartData = (ohlcData: OHLCData[]) => {
      const allPrices = ohlcData.flatMap(d => [d.high, d.low, d.open, d.close]);
      const maxPrice = Math.max(...allPrices);
      const minPrice = Math.min(...allPrices);
      const priceRange = maxPrice - minPrice;
      
      return {
        maxPrice,
        minPrice,
        priceRange,
        scale: (price: number): number => ((maxPrice - price) / priceRange) * config.scaleHeight + config.scaleOffset
      };
    };

    const chartInfo = calculateChartData(data);

    const Candlestick: React.FC<{ candle: OHLCData; index: number; scale: (price: number) => number }> = ({ 
      candle, 
      index, 
      scale 
    }) => {
      const x = config.candleStartX + index * config.candleSpacing;
      const isGreen = candle.close >= candle.open;
      
      const highY = scale(candle.high);
      const lowY = scale(candle.low);
      const openY = scale(candle.open);
      const closeY = scale(candle.close);
      
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1.5;
      const bodyColor = isGreen ? '#10b981' : '#ef4444';
      const halfWidth = config.candleWidth / 2;
      
      return (
        <g>
          <line
            x1={x}
            y1={highY}
            x2={x}
            y2={lowY}
            stroke={bodyColor}
            strokeWidth="1.5"
          />
          <rect
            x={x - halfWidth}
            y={bodyTop}
            width={config.candleWidth}
            height={bodyHeight}
            fill={bodyColor}
            stroke={bodyColor}
            strokeWidth="1"
          />
          <text
            x={x}
            y={config.timeY}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={config.fontSize}
            fontWeight="500"
          >
            {candle.time}
          </text>
        </g>
      );
    };

    const GridLines: React.FC<{ scale: (price: number) => number; maxPrice: number; minPrice: number }> = ({ 
      scale, 
      maxPrice, 
      minPrice 
    }) => {
      const steps = config.gridSteps;
      const priceStep = (maxPrice - minPrice) / steps;
      
      return (
        <>
          {[...Array(steps + 1)].map((_, i) => {
            const price = maxPrice - (priceStep * i);
            const y = scale(price);
            
            return (
              <g key={i}>
                <line
                  x1="30"
                  y1={y}
                  x2={config.chartWidth - 10}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="0.5"
                  strokeDasharray="3,3"
                />
                <text
                  x="28"
                  y={y + 3}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize={config.fontSize}
                >
                  {price.toFixed(4)}
                </text>
              </g>
            );
          })}
        </>
      );
    };

    return (
      <div style={{ 
        background: '#0f172a', 
        borderRadius: '8px', 
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {/* Header compact */}
        <div style={{ 
          padding: '6px 10px', 
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 100%)`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: accentColor 
            }}></div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{exchangeName}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>O: </span>
              <span style={{ color: 'white', fontWeight: 500 }}>{data[0].open.toFixed(4)}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>H: </span>
              <span style={{ color: '#10b981', fontWeight: 500 }}>
                {Math.max(...data.map(d => d.high)).toFixed(4)}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>L: </span>
              <span style={{ color: '#ef4444', fontWeight: 500 }}>
                {Math.min(...data.map(d => d.low)).toFixed(4)}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>C: </span>
              <span style={{ color: '#3b82f6', fontWeight: 500 }}>
                {data[data.length - 1].close.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div style={{ padding: '8px', background: '#020617' }}>
          <svg width="100%" height={config.chartHeight} viewBox={`0 0 ${config.chartWidth} ${config.chartHeight}`}>
            <GridLines 
              scale={chartInfo.scale} 
              maxPrice={chartInfo.maxPrice}
              minPrice={chartInfo.minPrice}
            />
            
            {data.map((candle, index) => (
              <Candlestick
                key={index}
                candle={candle}
                index={index}
                scale={chartInfo.scale}
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // Tính spread
  const calculateSpread = (): { close: string; average: string } => {
    const close1 = exchange1.data[exchange1.data.length - 1].close;
    const close2 = exchange2.data[exchange2.data.length - 1].close;
    const spread = Math.abs(close1 - close2);
    const avgSpread = (spread * 10000 / 2);
    
    return {
      close: spread.toFixed(4),
      average: avgSpread.toFixed(1)
    };
  };

  const spread = calculateSpread();

  return (
    <Modal
      title={
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💱</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{symbol}</span>
            <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#94a3b8', marginLeft: '4px' }}>
              So Sánh Giá
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Timeframe: {timeframe} | Real-time
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      zIndex={1000}
      centered
      styles={{
        body: {
          padding: '16px',
          background: '#0f172a'
        },
        header: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderBottom: '1px solid #334155',
          padding: '12px 16px'
        },
        content: {
          background: '#1e293b',
          border: '1px solid #334155'
        }
      }}
    >
      <div style={{ background: '#0f172a' }}>
        {/* Charts Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          <ChartView 
            data={exchange1.data}
            exchangeName={exchange1.name}
            accentColor={exchange1.color}
          />

          <ChartView 
            data={exchange2.data}
            exchangeName={exchange2.name}
            accentColor={exchange2.color}
          />
        </div>

        {/* Legend */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '20px',
          fontSize: '11px',
          padding: '10px',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
            <span style={{ color: '#cbd5e1' }}>Tăng</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
            <span style={{ color: '#cbd5e1' }}>Giảm</span>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '10px', marginLeft: '8px' }}>
            * Spread khác nhau do thanh khoản
          </div>
        </div>

        {/* Spread Info */}
        <div style={{ 
          background: '#1e293b',
          borderRadius: '8px',
          padding: '10px',
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px'
        }}>
          <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Spread:</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Close: </span>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{spread.close}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Avg: </span>
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{spread.average} pips</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ 
          color: '#94a3b8', 
          fontSize: '10px', 
          marginTop: '10px',
          textAlign: 'center'
        }}>
          ⚡ Cập nhật: Real-time | Độ trễ: &lt;100ms
        </div>
      </div>
    </Modal>
  );
};

export default DualExchangeChartModal;