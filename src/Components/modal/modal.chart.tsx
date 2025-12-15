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

// Config cho hình dáng nến
export interface CandleConfig {
  width: number;           // Chiều rộng nến (px)
  spacing: number;         // Khoảng cách giữa các nến (px)
  wickWidth: number;       // Độ dày của bấc nến (px)
  heightScale: number;     // Tỷ lệ chiều cao (1.0 = normal, >1 = cao hơn)
}

export interface DualExchangeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;
  exchange1: ExchangeData;
  exchange2: ExchangeData;
  timeframe?: string;
  candleConfig?: CandleConfig | 'thin' | 'normal' | 'wide' | 'tall' | 'slim-tall';

  // ✅ NEW: Bid/Ask realtime khác nhau cho từng exchange (đẩy từ Server)
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

  // ✅ NEW
  exchange1Bid,
  exchange1Ask,
  exchange2Bid,
  exchange2Ask,
}) => {

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

  // ✅ NEW: số nến hiển thị
  const MAX_CANDLES = 10;

  // Component vẽ biểu đồ
  const ChartView: React.FC<{
    data: OHLCData[];
    exchangeName: string;
    accentColor: string;

    // ✅ NEW: bid/ask realtime cho chart này
    bid?: number;
    ask?: number;
  }> = ({
    data,
    exchangeName,
    accentColor,
    bid,
    ask
  }) => {

    // ✅ Chỉ lấy 10 nến gần nhất
    const viewData = (data && data.length > MAX_CANDLES) ? data.slice(-MAX_CANDLES) : (data || []);

    const calculateChartData = (ohlcData: OHLCData[]) => {
      // ✅ include bid/ask vào range để không bị “line” nằm ngoài chart
      const last = ohlcData[ohlcData.length - 1];
      const bidPrice = (typeof bid === 'number') ? bid : last?.close;
      const askPrice = (typeof ask === 'number') ? ask : last?.close;

      const allPrices = ohlcData.flatMap(d => [d.high, d.low, d.open, d.close]);
      if (typeof bidPrice === 'number') allPrices.push(bidPrice);
      if (typeof askPrice === 'number') allPrices.push(askPrice);

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

    // ✅ tránh crash khi viewData rỗng
    if (!viewData || viewData.length === 0) {
      return (
        <div style={{
          background: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '10px',
            color: '#94a3b8',
            fontSize: '12px'
          }}>
            Không có dữ liệu OHLC
          </div>
        </div>
      );
    }

    const chartInfo = calculateChartData(viewData);

    // ✅ NEW: chuẩn hóa bid/ask dùng cho line + header
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
          <line
            x1={x}
            y1={highY}
            x2={x}
            y2={lowY}
            stroke={bodyColor}
            strokeWidth={config.wickWidth}
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

    // ✅ NEW: Bid/Ask lines realtime (line ngang theo giá hiện tại)
    const BidAskLines: React.FC = () => {
      const bidY = chartInfo.scale(bidPrice);
      const askY = chartInfo.scale(askPrice);

      const xLeft = 30;
      const xRight = config.chartWidth - 10 + 30;

      return (
        <g>
          {/* ASK line */}
          <line
            x1={xLeft}
            y1={askY}
            x2={xRight}
            y2={askY}
            stroke="#fbbf24"
            strokeWidth="1"
            strokeDasharray="6,3"
            opacity="0.95"
          />
          <rect
            x={xRight - 44}
            y={askY - 8}
            width="44"
            height="14"
            rx="3"
            fill="#0b1220"
            stroke="#fbbf24"
            strokeWidth="0.8"
            opacity="0.95"
          />
          <text
            x={xRight - 22}
            y={askY + 2}
            textAnchor="middle"
            fill="#fbbf24"
            fontSize={config.fontSize}
            fontWeight="700"
          >
            ASK
          </text>

          {/* BID line */}
          <line
            x1={xLeft}
            y1={bidY}
            x2={xRight}
            y2={bidY}
            stroke="#60a5fa"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.95"
          />
          <rect
            x={xRight - 44}
            y={bidY - 8}
            width="44"
            height="14"
            rx="3"
            fill="#0b1220"
            stroke="#60a5fa"
            strokeWidth="0.8"
            opacity="0.95"
          />
          <text
            x={xRight - 22}
            y={bidY + 2}
            textAnchor="middle"
            fill="#60a5fa"
            fontSize={config.fontSize}
            fontWeight="700"
          >
            BID
          </text>
        </g>
      );
    };

    return (
      <div style={{
        background: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {/* Header */}
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

          <div style={{ display: 'flex', gap: '6px', fontSize: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>O: </span>
              <span style={{ color: 'white', fontWeight: 500 }}>{viewData[0].open.toFixed(4)}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>H: </span>
              <span style={{ color: '#10b981', fontWeight: 500 }}>
                {Math.max(...viewData.map(d => d.high)).toFixed(4)}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>L: </span>
              <span style={{ color: '#ef4444', fontWeight: 500 }}>
                {Math.min(...viewData.map(d => d.low)).toFixed(4)}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>C: </span>
              <span style={{ color: '#3b82f6', fontWeight: 500 }}>
                {viewData[viewData.length - 1].close.toFixed(4)}
              </span>
            </div>

            {/* ✅ NEW: Bid/Ask realtime theo exchange */}
            <div>
              <span style={{ color: '#94a3b8' }}>Bid: </span>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>
                {bidPrice.toFixed(4)}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Ask: </span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                {askPrice.toFixed(4)}
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

            {viewData.map((candleData, index) => (
              <Candlestick
                key={index}
                candle={candleData}
                index={index}
                scale={chartInfo.scale}
              />
            ))}

            {/* ✅ NEW: Bid/Ask realtime lines */}
            <BidAskLines />
          </svg>
        </div>
      </div>
    );
  };

  // Tính spread (giữ nguyên logic cũ close-close)
  const calculateSpread = (): { close: string; average: string } => {
    const close1 = exchange1.data[exchange1.data.length - 1].close;
    const close2 = exchange2.data[exchange2.data.length - 1].close;
    const spread = Math.abs(close1 - close2);
    const avgSpread = (spread * 10000 / 2);

    return { close: spread.toFixed(4), average: avgSpread.toFixed(1) };
  };

  const spread = calculateSpread();

  return (
    <Modal
      title={
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💱</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#008670' }}>{symbol}</span>
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
        body: { padding: '16px', background: '#0f172a' },
        header: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderBottom: '1px solid #334155',
          padding: '12px 16px'
        },
        content: { background: '#1e293b', border: '1px solid #334155' }
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

          {/* Bid/Ask */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '2px', background: '#60a5fa' }}></div>
            <span style={{ color: '#cbd5e1' }}>Bid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '2px', background: '#fbbf24' }}></div>
            <span style={{ color: '#cbd5e1' }}>Ask</span>
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
