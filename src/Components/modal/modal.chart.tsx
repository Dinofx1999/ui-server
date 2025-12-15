import React, { useMemo } from 'react';
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

export interface CandleConfig {
  width: number;
  spacing: number;
  wickWidth: number;
  heightScale: number;
}

export interface DualExchangeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;
  exchange1: ExchangeData;
  exchange2: ExchangeData;
  timeframe?: string;
  candleConfig?: CandleConfig | 'thin' | 'normal' | 'wide' | 'tall' | 'slim-tall';

  exchange1Bid?: number;
  exchange1Ask?: number;
  exchange2Bid?: number;
  exchange2Ask?: number;
}

// ============================================================================
// PRESET CONFIGS
// ============================================================================

const CANDLE_PRESETS: Record<string, CandleConfig> = {
  'slim-tall': { width: 8, spacing: 20, wickWidth: 1, heightScale: 1.4 },
  'thin': { width: 12, spacing: 45, wickWidth: 1.5, heightScale: 1.2 },
  'normal': { width: 18, spacing: 55, wickWidth: 1.5, heightScale: 1.0 },
  'wide': { width: 24, spacing: 65, wickWidth: 2, heightScale: 1.0 },
  'tall': { width: 16, spacing: 52, wickWidth: 1.5, heightScale: 1.5 }
};

// ============================================================================
// HELPERS
// ============================================================================

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// ============================================================================
// COMPACT CHART WITH CONFIGURABLE CANDLES
// ============================================================================

const DualExchangeChartModal: React.FC<DualExchangeChartModalProps> = ({
  isOpen,
  onClose,
  symbol = "EUR/USD",
  exchange1,
  exchange2,
  timeframe = "1H",
  candleConfig = 'slim-tall',

  exchange1Bid,
  exchange1Ask,
  exchange2Bid,
  exchange2Ask,
}) => {

  // ✅ Responsive flags (không cần lib)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const isTablet = typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false;

  // ✅ Size modal responsive
  const modalWidth = isMobile ? '95vw' : isTablet ? 920 : 800;

  const getCandleConfig = (): CandleConfig => {
    if (typeof candleConfig === 'string') return CANDLE_PRESETS[candleConfig] || CANDLE_PRESETS['normal'];
    return candleConfig;
  };

  const candle = getCandleConfig();

  const baseConfig = {
    chartHeight: isMobile ? 200 : 180,
    chartWidth: 280,
    fontSize: 8,
    timeY: 165,
    gridSteps: 3,
  };

  const config = {
    ...baseConfig,
    candleWidth: candle.width,
    candleSpacing: candle.spacing,
    wickWidth: candle.wickWidth,
    candleStartX: 55,
    scaleHeight: 115 * candle.heightScale,
    scaleOffset: 15
  };

  const MAX_CANDLES = 10;

  // Component vẽ biểu đồ
  const ChartView: React.FC<{
    data: OHLCData[];
    exchangeName: string;
    accentColor: string;
    bid?: number;
    ask?: number;
  }> = ({ data, exchangeName, accentColor, bid, ask }) => {

    const viewData = (data && data.length > MAX_CANDLES) ? data.slice(-MAX_CANDLES) : (data || []);

    const calculateChartData = (ohlcData: OHLCData[]) => {
      const last = ohlcData[ohlcData.length - 1];
      const bidPrice_ = (typeof bid === 'number') ? bid : last?.close;
      const askPrice_ = (typeof ask === 'number') ? ask : last?.close;

      const allPrices = ohlcData.flatMap(d => [d.high, d.low, d.open, d.close]);
      if (typeof bidPrice_ === 'number') allPrices.push(bidPrice_);
      if (typeof askPrice_ === 'number') allPrices.push(askPrice_);

      const maxPrice = Math.max(...allPrices);
      const minPrice = Math.min(...allPrices);
      const priceRange = (maxPrice - minPrice) || 1e-9;

      return {
        maxPrice,
        minPrice,
        priceRange,
        scale: (price: number): number => ((maxPrice - price) / priceRange) * config.scaleHeight + config.scaleOffset
      };
    };

    if (!viewData || viewData.length === 0) {
      return (
        <div style={{
          background: '#0f172a',
          borderRadius: 10,
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{ padding: 10, color: '#94a3b8', fontSize: 12 }}>
            Không có dữ liệu OHLC
          </div>
        </div>
      );
    }

    const chartInfo = calculateChartData(viewData);

    const last = viewData[viewData.length - 1];
    const bidPrice = (typeof bid === 'number') ? bid : (last?.close ?? 0);
    const askPrice = (typeof ask === 'number') ? ask : (last?.close ?? 0);

    const Candlestick: React.FC<{ candle: OHLCData; index: number; scale: (price: number) => number }> = ({
      candle: candleData,
      index,
      scale
    }) => {
      const x = config.candleStartX + index * config.candleSpacing;
      const isGreen = candleData.close >= candleData.open;

      const highY = scale(candleData.high);
      const lowY = scale(candleData.low);
      const openY = scale(candleData.open);
      const closeY = scale(candleData.close);

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1.5;
      const bodyColor = isGreen ? '#10b981' : '#ef4444';
      const halfWidth = config.candleWidth / 2;

      return (
        <g>
          <line x1={x} y1={highY} x2={x} y2={lowY} stroke={bodyColor} strokeWidth={config.wickWidth} />
          <rect
            x={x - halfWidth}
            y={bodyTop}
            width={config.candleWidth}
            height={bodyHeight}
            fill={bodyColor}
            stroke={bodyColor}
            strokeWidth="1"
          />
          <text x={x} y={config.timeY} textAnchor="middle" fill="#9ca3af" fontSize={config.fontSize} fontWeight="500">
            {candleData.time}
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
                <text x="28" y={y + 3} textAnchor="end" fill="#9ca3af" fontSize={config.fontSize}>
                  {price.toFixed(2)}
                </text>
              </g>
            );
          })}
        </>
      );
    };

    const BidAskLines: React.FC = () => {
      const bidY = chartInfo.scale(bidPrice);
      const askY = chartInfo.scale(askPrice);

      const xLeft = 30;

      // ✅ Mobile: label không bị chạm mép, dịch vào trong 10px
      const BID_ASK_OFFSET_X = -35;
      const xRight = config.chartWidth - 10 - BID_ASK_OFFSET_X;

      return (
        <g>
          {/* ASK */}
          <line x1={xLeft} y1={askY} x2={xRight} y2={askY} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6,3" opacity="0.95" />
          <rect x={xRight - 54} y={askY - 8} width="54" height="14" rx="3" fill="#0b1220" stroke="#fbbf24" strokeWidth="0.8" opacity="0.95" />
          <text x={xRight - 27} y={askY + 2} textAnchor="middle" fill="#fbbf24" fontSize={config.fontSize} fontWeight="800">
            {askPrice.toFixed(2)}
          </text>

          {/* BID */}
          <line x1={xLeft} y1={bidY} x2={xRight} y2={bidY} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4,4" opacity="0.95" />
          <rect x={xRight - 54} y={bidY - 8} width="54" height="14" rx="3" fill="#0b1220" stroke="#60a5fa" strokeWidth="0.8" opacity="0.95" />
          <text x={xRight - 27} y={bidY + 2} textAnchor="middle" fill="#60a5fa" fontSize={config.fontSize} fontWeight="800">
            {bidPrice.toFixed(2)}
          </text>
        </g>
      );
    };

    return (
      <div style={{
        background: '#0f172a',
        borderRadius: 10,
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '8px 10px' : '6px 10px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 6 : 0,
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 100%)`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor }} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{exchangeName}</span>
          </div>

          {/* ✅ Mobile: chia 2 dòng nhỏ gọn */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: 10,
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            width: '100%'
          }}>
            <div><span style={{ color: '#94a3b8' }}>O:</span> <span style={{ color: 'white', fontWeight: 600 }}>{viewData[0].open.toFixed(2)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>H:</span> <span style={{ color: '#10b981', fontWeight: 700 }}>{Math.max(...viewData.map(d => d.high)).toFixed(2)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>L:</span> <span style={{ color: '#ef4444', fontWeight: 700 }}>{Math.min(...viewData.map(d => d.low)).toFixed(2)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>C:</span> <span style={{ color: '#3b82f6', fontWeight: 700 }}>{viewData[viewData.length - 1].close.toFixed(2)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Bid:</span> <span style={{ color: '#60a5fa', fontWeight: 800 }}>{bidPrice.toFixed(2)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Ask:</span> <span style={{ color: '#fbbf24', fontWeight: 800 }}>{askPrice.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Chart area */}
        <div style={{ padding: isMobile ? 8 : 8, background: '#020617' }}>
          <svg width="100%" height={config.chartHeight} viewBox={`0 0 ${config.chartWidth} ${config.chartHeight}`}>
            <GridLines scale={chartInfo.scale} maxPrice={chartInfo.maxPrice} minPrice={chartInfo.minPrice} />
            {viewData.map((candleData, index) => (
              <Candlestick key={index} candle={candleData} index={index} scale={chartInfo.scale} />
            ))}
            <BidAskLines />
          </svg>
        </div>
      </div>
    );
  };

  // ✅ Spread safe (mobile hay bị load data muộn)
  const calculateSpread = (): { close: string; average: string } => {
    const d1 = exchange1?.data || [];
    const d2 = exchange2?.data || [];
    const last1 = d1.length ? d1[d1.length - 1] : null;
    const last2 = d2.length ? d2[d2.length - 1] : null;

    const close1 = last1?.close ?? 0;
    const close2 = last2?.close ?? 0;

    const spread = Math.abs(close1 - close2);
    const avgSpread = (spread * 10000 / 2);

    return { close: spread.toFixed(4), average: avgSpread.toFixed(1) };
  };

  const spread = calculateSpread();

  return (
    <Modal
      title={
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18 }}>💱</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#008670' }}>{symbol}</span>
            <span style={{ fontSize: 11, fontWeight: 'normal', color: '#94a3b8' }}>
              So Sánh Giá
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            Timeframe: {timeframe} | Real-time
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={modalWidth as any}
      zIndex={1000}
      centered
      style={{
        top: isMobile ? 8 : undefined,
      }}
      styles={{
        body: {
          padding: isMobile ? 12 : 16,
          background: '#0f172a',
          maxHeight: isMobile ? '80vh' : 'auto',
          overflowY: isMobile ? 'auto' : 'visible',
        },
        header: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderBottom: '1px solid #334155',
          padding: isMobile ? '10px 12px' : '12px 16px'
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
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? 10 : 12,
          marginBottom: 12
        }}>
          <ChartView
            data={exchange1.data}
            exchangeName={exchange1.name}
            accentColor={exchange1.color}
            bid={exchange1Bid}
            ask={exchange1Ask}
          />

          <ChartView
            data={exchange2.data}
            exchangeName={exchange2.name}
            accentColor={exchange2.color}
            bid={exchange2Bid}
            ask={exchange2Ask}
          />
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: 11,
          padding: isMobile ? 10 : 10,
          background: '#1e293b',
          borderRadius: 10,
          border: '1px solid #334155',
          marginBottom: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: 2 }} />
            <span style={{ color: '#cbd5e1' }}>Tăng</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2 }} />
            <span style={{ color: '#cbd5e1' }}>Giảm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 2, background: '#60a5fa' }} />
            <span style={{ color: '#cbd5e1' }}>Bid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 2, background: '#fbbf24' }} />
            <span style={{ color: '#cbd5e1' }}>Ask</span>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>
            * Spread khác nhau do thanh khoản
          </div>
        </div>

        {/* Spread Info */}
        <div style={{
          background: '#1e293b',
          borderRadius: 10,
          padding: isMobile ? 10 : 10,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 8 : 0,
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          fontSize: 12
        }}>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Spread:</span>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>Close: </span>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{spread.close}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>Avg: </span>
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{spread.average} pips</span>
            </div>
          </div>
        </div>

        <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 10, textAlign: 'center' }}>
          ⚡ Cập nhật: Real-time | Độ trễ: &lt;100ms
        </div>
      </div>
    </Modal>
  );
};

export default DualExchangeChartModal;
