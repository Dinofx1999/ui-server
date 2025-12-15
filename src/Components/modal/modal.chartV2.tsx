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

export interface CandleConfig {
  width: number;
  spacing: number;
  wickWidth: number;
  heightScale: number;
}

export interface TripleExchangeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;

  exchange1: ExchangeData;
  exchange2: ExchangeData;
  exchange3: ExchangeData;

  timeframe?: string;
  candleConfig?: CandleConfig | 'thin' | 'normal' | 'wide' | 'tall' | 'slim-tall';

  // ✅ Bid/Ask realtime khác nhau cho từng exchange
  exchange1Bid?: number;
  exchange1Ask?: number;
  exchange2Bid?: number;
  exchange2Ask?: number;
  exchange3Bid?: number;
  exchange3Ask?: number;

  // ✅ NEW: digits cho từng chart (lấy từ server digit)
  exchange1Digits?: number; // ví dụ XAUUSD: 2, EURUSD: 5
  exchange2Digits?: number;
  exchange3Digits?: number;
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
// TRIPLE CHART MODAL
// ============================================================================

const TripleExchangeChartModal: React.FC<TripleExchangeChartModalProps> = ({
  isOpen,
  onClose,
  symbol = "EUR/USD",
  exchange1,
  exchange2,
  exchange3,
  timeframe = "1H",
  candleConfig = 'slim-tall',

  exchange1Bid,
  exchange1Ask,
  exchange2Bid,
  exchange2Ask,
  exchange3Bid,
  exchange3Ask,

  exchange1Digits,
  exchange2Digits,
  exchange3Digits,
}) => {

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const isTablet = typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false;

  const getCandleConfig = (): CandleConfig => {
    if (typeof candleConfig === 'string') return CANDLE_PRESETS[candleConfig] || CANDLE_PRESETS['normal'];
    return candleConfig;
  };

  const candle = getCandleConfig();

  const baseConfig = {
    chartHeight: 180,
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

  // ============================================================================
  // CHART VIEW
  // ============================================================================

  const ChartView: React.FC<{
    data: OHLCData[];
    exchangeName: string;
    accentColor: string;
    bid?: number;
    ask?: number;
    digits?: number; // ✅ NEW
  }> = ({
    data,
    exchangeName,
    accentColor,
    bid,
    ask,
    digits
  }) => {

    // ✅ digits formatter (fallback 2)
    const DIGITS = Number.isFinite(digits as any) ? Math.max(0, Number(digits)) : 2;
    const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(DIGITS) : "--");

    // ✅ chỉ lấy 10 nến gần nhất
    const viewData = (data && data.length > MAX_CANDLES) ? data.slice(-MAX_CANDLES) : (data || []);

    if (!viewData || viewData.length === 0) {
      return (
        <div style={{
          background: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '10px', color: '#94a3b8', fontSize: '12px' }}>
            Không có dữ liệu OHLC
          </div>
        </div>
      );
    }

    // ✅ Bid/Ask realtime (fallback = close nến cuối)
    const lastBase = viewData[viewData.length - 1];
    const bidPrice = (typeof bid === 'number' && Number.isFinite(bid)) ? bid : (lastBase?.close ?? 0);
    const askPrice = (typeof ask === 'number' && Number.isFinite(ask)) ? ask : (lastBase?.close ?? 0);

    // ✅ Realtime candle: close của nến cuối = BID (giống MT4/MT5)
    const realtimeData = [...viewData];
    const lastIndex = realtimeData.length - 1;
    const lastCandle = realtimeData[lastIndex];

    if (lastCandle && Number.isFinite(bidPrice)) {
      realtimeData[lastIndex] = {
        ...lastCandle,
        close: bidPrice,
        high: Math.max(lastCandle.high, bidPrice),
        low: Math.min(lastCandle.low, bidPrice),
      };
    }

    const calculateChartData = (ohlcData: OHLCData[]) => {
      const allPrices = ohlcData.flatMap(d => [d.high, d.low, d.open, d.close]);
      if (Number.isFinite(bidPrice)) allPrices.push(bidPrice);
      if (Number.isFinite(askPrice)) allPrices.push(askPrice);

      const maxPrice = Math.max(...allPrices);
      const minPrice = Math.min(...allPrices);
      const priceRange = (maxPrice - minPrice) || 1e-9;

      return {
        maxPrice,
        minPrice,
        priceRange,
        scale: (price: number): number =>
          ((maxPrice - price) / priceRange) * config.scaleHeight + config.scaleOffset
      };
    };

    const chartInfo = calculateChartData(realtimeData);

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
          <text
            x={x}
            y={config.timeY}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={config.fontSize}
            fontWeight="500"
          >
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
                  {fmt(price)}
                </text>
              </g>
            );
          })}
        </>
      );
    };

    // ✅ Bid/Ask lines + label (dịch vào trong 10px)
    const BidAskLines: React.FC = () => {
      const bidY = chartInfo.scale(bidPrice);
      const askY = chartInfo.scale(askPrice);

      const xLeft = 35;
      const OFFSET_X = -55;
      const xRight = config.chartWidth - 10 - OFFSET_X;

      return (
        <g>
          {/* ASK */}
          <line x1={xLeft} y1={askY} x2={xRight} y2={askY} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6,3" opacity="0.95" />
          <rect x={xRight - 74} y={askY - 8} width="59" height="14" rx="3" fill="#0b1220" stroke="#fbbf24" strokeWidth="0.8" opacity="0.95" />
          <text x={xRight - 30} y={askY + 2} textAnchor="end" fill="#fbbf24" fontSize={config.fontSize} fontWeight="800">
            {fmt(askPrice)}
          </text>

          {/* BID */}
          <line x1={xLeft} y1={bidY} x2={xRight} y2={bidY} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4,4" opacity="0.95" />
          <rect x={xRight - 74} y={bidY - 8} width="59" height="14" rx="3" fill="#0b1220" stroke="#60a5fa" strokeWidth="0.8" opacity="0.95" />
          <text x={xRight - 30} y={bidY + 2} textAnchor="end" fill="#60a5fa" fontSize={config.fontSize} fontWeight="800">
            {fmt(bidPrice)}
          </text>
        </g>
      );
    };

    const last = realtimeData[realtimeData.length - 1];

    return (
      <div style={{
        background: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '8px 10px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 6 : 0,
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 100%)`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accentColor }} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{exchangeName}</span>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            fontSize: '10px',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            width: '100%'
          }}>
            <div><span style={{ color: '#94a3b8' }}>O:</span> <span style={{ color: 'white', fontWeight: 600 }}>{fmt(realtimeData[0].open)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>H:</span> <span style={{ color: '#10b981', fontWeight: 800 }}>{fmt(Math.max(...realtimeData.map(d => d.high)))}</span></div>
            <div><span style={{ color: '#94a3b8' }}>L:</span> <span style={{ color: '#ef4444', fontWeight: 800 }}>{fmt(Math.min(...realtimeData.map(d => d.low)))}</span></div>
            <div><span style={{ color: '#94a3b8' }}>C:</span> <span style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(last.close)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Bid:</span> <span style={{ color: '#60a5fa', fontWeight: 900 }}>{fmt(bidPrice)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Ask:</span> <span style={{ color: '#fbbf24', fontWeight: 900 }}>{fmt(askPrice)}</span></div>
          </div>
        </div>

        {/* Chart area */}
        <div style={{ padding: '8px', background: '#020617' }}>
          <svg width="100%" height={config.chartHeight} viewBox={`0 0 ${config.chartWidth} ${config.chartHeight}`}>
            <GridLines scale={chartInfo.scale} maxPrice={chartInfo.maxPrice} minPrice={chartInfo.minPrice} />

            {realtimeData.map((candleData, index) => (
              <Candlestick key={index} candle={candleData} index={index} scale={chartInfo.scale} />
            ))}

            <BidAskLines />
          </svg>
        </div>
      </div>
    );
  };

  // ============================================================================
  // SPREAD INFO (3 cặp)
  // ============================================================================

  const safeClose = (ex: ExchangeData) => {
    const d = ex?.data || [];
    return d.length ? d[d.length - 1].close : 0;
  };

  const spread12 = Math.abs(safeClose(exchange1) - safeClose(exchange2));
  const spread13 = Math.abs(safeClose(exchange1) - safeClose(exchange3));
  const spread23 = Math.abs(safeClose(exchange2) - safeClose(exchange3));

  // format spread theo max digits (đẹp)
  const spreadDigits = Math.max(
    Number.isFinite(exchange1Digits as any) ? Number(exchange1Digits) : 2,
    Number.isFinite(exchange2Digits as any) ? Number(exchange2Digits) : 2,
    Number.isFinite(exchange3Digits as any) ? Number(exchange3Digits) : 2,
  );
  const fmtSpread = (n: number) => (Number.isFinite(n) ? n.toFixed(spreadDigits) : "--");

  const modalWidth = isMobile ? '95vw' : isTablet ? 1100 : 1180;

  return (
    <Modal
      title={
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px' }}>💱</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#008670' }}>{symbol}</span>
            <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#94a3b8', marginLeft: '4px' }}>
              So Sánh Giá (3 Broker)
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
      width={modalWidth as any}
    //   height={isMobile ? 800 : 200}
      zIndex={20000}
      centered
      styles={{
        body: {
          padding: isMobile ? '12px' : '16px',
          background: '#0f172a',
          maxHeight: isMobile ? '80vh' : undefined,
          overflowY: isMobile ? 'auto' : undefined,
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
        {/* Charts Grid (2 -> 3) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '10px' : '12px',
          marginBottom: '12px'
        }}>
          <ChartView
            data={exchange1?.data || []}
            exchangeName={exchange1?.name || "Exchange 1"}
            accentColor={exchange1?.color || "#F0B90B"}
            bid={exchange1Bid}
            ask={exchange1Ask}
            digits={exchange1Digits}
          />
          <ChartView
            data={exchange2?.data || []}
            exchangeName={exchange2?.name || "Exchange 2"}
            accentColor={exchange2?.color || "#5741D9"}
            bid={exchange2Bid}
            ask={exchange2Ask}
            digits={exchange2Digits}
          />
          <ChartView
            data={exchange3?.data || []}
            exchangeName={exchange3?.name || "Exchange 3"}
            accentColor={exchange3?.color || "#10b981"}
            bid={exchange3Bid}
            ask={exchange3Ask}
            digits={exchange3Digits}
          />
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          fontSize: '11px',
          padding: '10px',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
            <span style={{ color: '#cbd5e1' }}>Tăng</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }} />
            <span style={{ color: '#cbd5e1' }}>Giảm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '2px', background: '#60a5fa' }} />
            <span style={{ color: '#cbd5e1' }}>Bid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '2px', background: '#fbbf24' }} />
            <span style={{ color: '#cbd5e1' }}>Ask</span>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>
            * Spread khác nhau do thanh khoản
          </div>
        </div>

        <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '10px', textAlign: 'center' }}>
          ⚡ Cập nhật: Real-time | Độ trễ: &lt;100ms
        </div>
      </div>
    </Modal>
  );
};

export default TripleExchangeChartModal;
