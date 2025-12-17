import React, { useMemo, useCallback, memo } from 'react';
import { Modal, Spin, Button, Tooltip } from 'antd';

// ============================================================================
// CONSTANTS - Extract to separate file if needed
// ============================================================================

const THEME = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#020617',
  },
  border: {
    default: '#334155',
    light: '#f0f2f6',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cbd5e1',
    muted: '#94a3b8',
  },
  candle: {
    bullish: '#10b981',
    bearish: '#ef4444',
  },
  price: {
    bid: '#60a5fa',
    ask: '#fbbf24',
  },
} as const;

const CANDLE_PRESETS = {
  'slim-tall': { width: 6, spacing: 20, wickWidth: 1, heightScale: 1.2 },
  'thin': { width: 12, spacing: 45, wickWidth: 1.5, heightScale: 1.2 },
  'normal': { width: 18, spacing: 55, wickWidth: 1.5, heightScale: 1.0 },
  'wide': { width: 24, spacing: 65, wickWidth: 2, heightScale: 1.0 },
  'tall': { width: 16, spacing: 52, wickWidth: 1.5, heightScale: 1.5 },
} as const;

const CHART_CONFIG = {
  maxCandles: 9,
  baseHeight: 180,
  baseWidth: 280,
  baseFontSize: 8,
  gridSteps: 3,
  animationDuration: 200,
} as const;

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
  candleConfig?: CandleConfig | keyof typeof CANDLE_PRESETS;
  exchange1Bid?: number;
  exchange1Ask?: number;
  exchange2Bid?: number;
  exchange2Ask?: number;
  exchange3Bid?: number;
  exchange3Ask?: number;
  exchange1Digits?: number;
  exchange2Digits?: number;
  exchange3Digits?: number;
}

interface ChartViewProps {
  data: OHLCData[];
  exchangeName: string;
  accentColor: string;
  bid?: number;
  ask?: number;
  digits?: number;
  isMobile?: boolean;
  scaleFactor?: number; // ✅ NEW: scale chart theo Zoom
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const useResponsive = () => {
  const [dimensions, setDimensions] = React.useState({
    isMobile: false,
    isTablet: false,
  });

  React.useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        isMobile: window.innerWidth < 640,
        isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return dimensions;
};

const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatPrice = (price: number, digits: number = 2): string => {
  return Number.isFinite(price) ? price.toFixed(Math.max(0, digits)) : '--';
};

// ============================================================================
// MEMOIZED SUB-COMPONENTS
// ============================================================================

const Candlestick = memo<{
  candle: OHLCData;
  index: number;
  scale: (price: number) => number;
  config: any;
}>(({ candle, index, scale, config }) => {
  const x = config.candleStartX + index * config.candleSpacing;
  const isGreen = candle.close >= candle.open;

  const highY = scale(candle.high);
  const lowY = scale(candle.low);
  const openY = scale(candle.open);
  const closeY = scale(candle.close);

  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY) || 1.5;
  const bodyColor = isGreen ? THEME.candle.bullish : THEME.candle.bearish;
  const halfWidth = config.candleWidth / 2;

  return (
    <g style={{ transition: `all ${CHART_CONFIG.animationDuration}ms ease` }}>
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
        strokeWidth="2"
        rx="1"
      />
      <text
        x={x}
        y={config.timeY + 15}
        textAnchor="middle"
        fill={THEME.text.muted}
        fontSize={Math.max(5, config.fontSize * 0.9)} // ✅ scale theo zoom
        fontWeight="500"
      >
        {candle.time}
      </text>
    </g>
  );
});
Candlestick.displayName = 'Candlestick';

const GridLines = memo<{
  scale: (price: number) => number;
  maxPrice: number;
  minPrice: number;
  config: any;
  digits: number;
}>(({ scale, maxPrice, minPrice, config, digits }) => {
  const steps = config.gridSteps;
  const priceStep = (maxPrice - minPrice) / steps;

  return (
    <>
      {Array.from({ length: steps + 1 }).map((_, i) => {
        const price = maxPrice - priceStep * i;
        const y = scale(price);

        return (
          <g key={`grid-${i}`}>
            <line
              x1="30"
              y1={y}
              x2={config.chartWidth - 10}
              y2={y}
              stroke={THEME.border.default}
              strokeWidth="0.5"
              strokeDasharray="3,3"
              opacity="0.5"
            />
            <text
              x="28"
              y={y + 3}
              textAnchor="end"
              fill={THEME.text.muted}
              fontSize={config.fontSize}
            >
              {formatPrice(price, digits)}
            </text>
          </g>
        );
      })}
    </>
  );
});
GridLines.displayName = 'GridLines';

const BidAskLines = memo<{
  bidPrice: number;
  askPrice: number;
  scale: (price: number) => number;
  config: any;
  digits: number;
}>(({ bidPrice, askPrice, scale, config, digits }) => {
  const bidY = scale(bidPrice);
  const askY = scale(askPrice);

  return (
    <g>
      {/* ASK Line */}
      <line
        x1={config.bidAskXLeft}
        y1={askY}
        x2={config.bidAskXRight - config.bidAskLineOffset}
        y2={askY}
        stroke={THEME.price.ask}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="6,3"
        opacity="0.95"
      />
      <rect
        x={config.bidAskXRight - config.bidAskLabelWidth + config.bidAskRectOffset}
        y={askY - config.bidAskLabelHeight / 2}
        width={config.bidAskLabelWidth}
        height={config.bidAskLabelHeight}
        rx={config.bidAskLabelRadius}
        fill={THEME.background.tertiary}
        stroke={THEME.price.ask}
        strokeWidth={config.bidAskRectStroke}
        opacity="0.95"
      />
      <text
        x={config.bidAskXRight - config.bidAskLabelOffset + config.bidAskTextExtraOffset}
        y={askY + config.bidAskTextYOffset}
        textAnchor="end"
        fill={THEME.price.ask}
        fontSize={config.fontSize}
        fontWeight="800"
      >
        {formatPrice(askPrice, digits)}
      </text>

      {/* BID Line */}
      <line
        x1={config.bidAskXLeft}
        y1={bidY}
        x2={config.bidAskXRight - config.bidAskLineOffset}
        y2={bidY}
        stroke={THEME.price.bid}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="4,4"
        opacity="0.95"
      />
      <rect
        x={config.bidAskXRight - config.bidAskLabelWidth + config.bidAskRectOffset}
        y={bidY - config.bidAskLabelHeight / 2}
        width={config.bidAskLabelWidth}
        height={config.bidAskLabelHeight}
        rx={config.bidAskLabelRadius}
        fill={THEME.background.tertiary}
        stroke={THEME.price.bid}
        strokeWidth={config.bidAskRectStroke}
        opacity="0.95"
      />
      <text
        x={config.bidAskXRight - config.bidAskLabelOffset + config.bidAskTextExtraOffset}
        y={bidY + config.bidAskTextYOffset}
        textAnchor="end"
        fill={THEME.price.bid}
        fontSize={config.fontSize}
        fontWeight="800"
      >
        {formatPrice(bidPrice, digits)}
      </text>
    </g>
  );
});
BidAskLines.displayName = 'BidAskLines';

// ============================================================================
// CHART VIEW COMPONENT
// ============================================================================

const ChartView = memo<ChartViewProps>(({
  data,
  exchangeName,
  accentColor,
  bid,
  ask,
  digits = 2,
  isMobile = false,
  scaleFactor = 1, // ✅ default
}) => {
   const DIGITS = Math.max(0, safeNumber(digits, 2));

  // ✅ Config calculation - TẤT CẢ được scale
  const config = useMemo(() => {
    const candle = CANDLE_PRESETS['slim-tall'];
    const s = Math.max(0.8, Math.min(2.2, scaleFactor));
    
    return {
      chartHeight: Math.round(CHART_CONFIG.baseHeight * s),
      chartWidth: Math.round(CHART_CONFIG.baseWidth * s),
      fontSize: Math.max(8, Math.round(CHART_CONFIG.baseFontSize * s)),
      timeY: Math.round(165 * s),
      gridSteps: CHART_CONFIG.gridSteps,

      candleWidth: candle.width * s,
      candleSpacing: candle.spacing * s,
      wickWidth: candle.wickWidth * s,
      candleStartX: 55 * s,

      scaleHeight: 115 * candle.heightScale * s,
      scaleOffset: 15 * s,
      
      // ✅ BidAsk Lines - TẤT CẢ giá trị được scale
      bidAskXLeft: 35 * s,
      bidAskXRight: (CHART_CONFIG.baseWidth - 10) * s,
      bidAskLabelWidth: 59 * s,
      bidAskLabelHeight: 14 * s,
      bidAskLabelRadius: 3 * s,
      bidAskLabelOffset: 30 * s,
      
      // ✅ NEW: Các offset khác
      bidAskLineOffset: 15 * s,        // offset cho line x2
      bidAskRectOffset: 15 * s,        // offset cho rect x position  
      bidAskTextExtraOffset: 35 * s,   // offset thêm cho text position
      bidAskTextYOffset: 2 * s,        // offset Y cho text
      bidAskStrokeWidth: 1.5 * s,      // stroke width của line
      bidAskRectStroke: 0.8 * s,       // stroke width của rect
    };
  }, [scaleFactor]);

  // ✅ Process data
  const viewData = useMemo(() => {
    if (!data?.length) return [];
    return data.length > CHART_CONFIG.maxCandles
      ? data.slice(-CHART_CONFIG.maxCandles)
      : data;
  }, [data]);

  // ✅ Realtime prices
  const { bidPrice, askPrice, realtimeData } = useMemo(() => {
    if (!viewData.length) {
      return { bidPrice: 0, askPrice: 0, realtimeData: [] };
    }

    const lastCandle = viewData[viewData.length - 1];
    const bidP = safeNumber(bid, lastCandle.close);
    const askP = safeNumber(ask, lastCandle.close);

    const rtData = [...viewData];
    const lastIndex = rtData.length - 1;

    if (Number.isFinite(bidP)) {
      rtData[lastIndex] = {
        ...rtData[lastIndex],
        close: bidP,
        high: Math.max(rtData[lastIndex].high, bidP),
        low: Math.min(rtData[lastIndex].low, bidP),
      };
    }

    return { bidPrice: bidP, askPrice: askP, realtimeData: rtData };
  }, [viewData, bid, ask]);

  // ✅ Chart calculations
  const chartInfo = useMemo(() => {
    if (!realtimeData.length) {
      return { maxPrice: 0, minPrice: 0, priceRange: 1, scale: () => 0 };
    }

    const allPrices = realtimeData.flatMap((d) => [d.high, d.low, d.open, d.close]);
    if (Number.isFinite(bidPrice)) allPrices.push(bidPrice);
    if (Number.isFinite(askPrice)) allPrices.push(askPrice);

    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1e-9;

    return {
      maxPrice,
      minPrice,
      priceRange,
      scale: (price: number) =>
        ((maxPrice - price) / priceRange) * config.scaleHeight + config.scaleOffset,
    };
  }, [realtimeData, bidPrice, askPrice, config]);

  // ✅ Stats
  const stats = useMemo(() => {
    if (!realtimeData.length) return null;

    return {
      open: realtimeData[0].open,
      high: Math.max(...realtimeData.map((d) => d.high)),
      low: Math.min(...realtimeData.map((d) => d.low)),
      close: realtimeData[realtimeData.length - 1].close,
    };
  }, [realtimeData]);

  // ✅ Empty state
  if (!viewData.length) {
    return (
      <div
        style={{
          background: THEME.background.primary,
          borderRadius: '8px',
          border: `1px solid ${THEME.border.default}`,
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <Spin />
        <div style={{ color: THEME.text.muted, fontSize: '12px', marginTop: '12px' }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: THEME.background.primary,
        borderRadius: '5px',
        border: `1px solid ${THEME.border.default}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px',
          borderBottom: `1px solid ${THEME.border.light}`,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 6 : 0,
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
          <span style={{ color: THEME.text.primary, fontWeight: 700, fontSize: '13px' }}>
            {exchangeName}
          </span>
        </div>

        {stats && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: `${Math.max(10, Math.round(10 * scaleFactor))}px`, // ✅ scale
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              width: '100%',
            }}
          >
            <StatItem label="O" value={formatPrice(stats.open, DIGITS)} color={THEME.text.primary} />
            <StatItem label="H" value={formatPrice(stats.high, DIGITS)} color={THEME.candle.bullish} />
            <StatItem label="L" value={formatPrice(stats.low, DIGITS)} color={THEME.candle.bearish} />
            <StatItem label="C" value={formatPrice(stats.close, DIGITS)} color="#3b82f6" />
            <StatItem label="Bid" value={formatPrice(bidPrice, DIGITS)} color={THEME.price.bid} weight={900} />
            <StatItem label="Ask" value={formatPrice(askPrice, DIGITS)} color={THEME.price.ask} weight={900} />
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ padding: '8px', background: THEME.background.tertiary }}>
        <svg
          width="100%"
          height={config.chartHeight}
          viewBox={`0 0 ${config.chartWidth} ${config.chartHeight}`}
        >
          <GridLines
            scale={chartInfo.scale}
            maxPrice={chartInfo.maxPrice}
            minPrice={chartInfo.minPrice}
            config={config}
            digits={DIGITS}
          />

          {realtimeData.map((candle, index) => (
            <Candlestick
              key={`${candle.time}-${index}`}
              candle={candle}
              index={index}
              scale={chartInfo.scale}
              config={config}
            />
          ))}

          <BidAskLines
            bidPrice={bidPrice}
            askPrice={askPrice}
            scale={chartInfo.scale}
            config={config}
            digits={DIGITS}
          />
        </svg>
      </div>
    </div>
  );
});
ChartView.displayName = 'ChartView';

// ============================================================================
// HELPER COMPONENT
// ============================================================================

const StatItem: React.FC<{
  label: string;
  value: string;
  color: string;
  weight?: number;
}> = ({ label, value, color, weight = 600 }) => (
  <div>
    <span style={{ color: THEME.text.muted }}>{label}:</span>{' '}
    <span style={{ color, fontWeight: weight }}>{value}</span>
  </div>
);

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

const TripleExchangeChartModal: React.FC<TripleExchangeChartModalProps> = ({
  isOpen,
  onClose,
  symbol = 'EUR/USD',
  exchange1,
  exchange2,
  exchange3,
  timeframe = '1M',
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
  const { isMobile, isTablet } = useResponsive();

  // ✅ NEW: Zoom state + Full Screen state
  const [isZoom, setIsZoom] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  // ✅ Modal width theo Zoom & Full Screen
  const modalWidth = useMemo(() => {
    if (isFullScreen) {
      return isMobile ? '99vw' : '98vw';
    }
    if (isMobile) return isZoom ? '99vw' : '95vw';
    if (isTablet) return isZoom ? 1400 : 1100;
    return isZoom ? 1600 : 1200;
  }, [isMobile, isTablet, isZoom, isFullScreen]);

  // ✅ Chart scale theo Zoom & Full Screen (đồng bộ 3 chart)
  const scaleFactor = useMemo(() => {
    if (isFullScreen) {
      return isMobile ? 1.5 : 2.0;
    }
    if (isMobile) return isZoom ? 1.15 : 1.0;
    return isZoom ? 1.45 : 1.0;
  }, [isMobile, isZoom, isFullScreen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const toggleZoom = useCallback(() => {
    setIsZoom((prev) => !prev);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
    // Khi bật Full Screen, tự động tắt Zoom thường
    if (!isFullScreen) {
      setIsZoom(false);
    }
  }, [isFullScreen]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          {/* Left title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px' }}>💱</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#008670' }}>{symbol}</span>
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: THEME.text.muted, marginLeft: '4px' }}>
                So Sánh Giá (3 Broker)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: THEME.text.muted, marginTop: '4px' }}>
              Timeframe: M1 | Real-time
            </div>
          </div>

          {/* ✅ Right controls - Zoom Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
            {/* Regular Zoom Button */}
            <Tooltip title={isZoom ? 'Thu nhỏ Modal' : 'Phóng to Modal'}>
              <Button
                size="small"
                onClick={toggleZoom}
                disabled={isFullScreen} // Disable khi đang Full Screen
                style={{
                  borderColor: isZoom ? '#10b981' : THEME.border.default,
                  background: isZoom ? 'rgba(16, 185, 129, 0.1)' : THEME.background.tertiary,
                  color: isZoom ? '#10b981' : THEME.text.primary,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  opacity: isFullScreen ? 0.5 : 1,
                }}
              >
                {isZoom ? '🔍 Zoom On' : '🔍 Zoom'}
              </Button>
            </Tooltip>

            {/* Full Screen Button */}
            <Tooltip title={isFullScreen ? 'Thoát Full Screen' : 'Mở Full Screen'}>
              <Button
                size="small"
                onClick={toggleFullScreen}
                style={{
                  borderColor: isFullScreen ? '#3b82f6' : THEME.border.default,
                  background: isFullScreen 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                  color: isFullScreen ? '#60a5fa' : THEME.text.primary,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  boxShadow: isFullScreen ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                {isFullScreen ? '⛶ Exit Full' : '⛶ Full Screen'}
              </Button>
            </Tooltip>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={modalWidth as any}
      zIndex={20000}
      centered
      styles={{
        body: {
          padding: isMobile ? '12px' : isFullScreen ? '20px' : '16px',
          background: THEME.background.primary,
          maxHeight: isFullScreen ? '92vh' : isMobile ? '80vh' : isZoom ? '90vh' : undefined,
          overflowY: isMobile || isZoom || isFullScreen ? 'auto' : undefined,
        },
        header: {
          background: isFullScreen
            ? `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`
            : `linear-gradient(135deg, ${THEME.background.primary} 0%, ${THEME.background.secondary} 100%)`,
          borderBottom: `1px solid ${isFullScreen ? '#3b82f6' : THEME.border.default}`,
          padding: isMobile ? '10px 12px' : '12px 16px',
          boxShadow: isFullScreen ? '0 2px 8px rgba(59, 130, 246, 0.2)' : 'none',
        },
        content: {
          background: THEME.background.secondary,
          border: `1px solid ${isFullScreen ? '#3b82f6' : THEME.border.default}`,
          boxShadow: isFullScreen ? '0 8px 32px rgba(0, 0, 0, 0.4)' : 'none',
        },
      }}
    >
      <div style={{ background: THEME.background.primary }}>
        {/* Charts Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '10px' : isFullScreen ? '16px' : '12px',
            marginBottom: '12px',
          }}
        >
          <ChartView
            data={exchange1?.data || []}
            exchangeName={exchange1?.name || 'Exchange 1'}
            accentColor={exchange1?.color || '#F0B90B'}
            bid={exchange1Bid}
            ask={exchange1Ask}
            digits={exchange1Digits}
            isMobile={isMobile}
            scaleFactor={scaleFactor}
          />
          <ChartView
            data={exchange2?.data || []}
            exchangeName={exchange2?.name || 'Exchange 2'}
            accentColor={exchange2?.color || '#5741D9'}
            bid={exchange2Bid}
            ask={exchange2Ask}
            digits={exchange2Digits}
            isMobile={isMobile}
            scaleFactor={scaleFactor}
          />
          <ChartView
            data={exchange3?.data || []}
            exchangeName={exchange3?.name || 'Exchange 3'}
            accentColor={exchange3?.color || '#10b981'}
            bid={exchange3Bid}
            ask={exchange3Ask}
            digits={exchange3Digits}
            isMobile={isMobile}
            scaleFactor={scaleFactor}
          />
        </div>

        {/* Legend */}
        <Legend isMobile={isMobile} />

        {/* Footer Info */}
        <FooterInfo exchange1Name={exchange1?.name} exchange2Name={exchange2?.name} exchange3Name={exchange3?.name} />
      </div>
    </Modal>
  );
};

// ============================================================================
// LEGEND & FOOTER COMPONENTS
// ============================================================================

const Legend = memo<{ isMobile: boolean }>(({ isMobile }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      flexWrap: 'wrap',
      fontSize: '11px',
      padding: '10px',
      background: THEME.background.secondary,
      borderRadius: '8px',
      border: `1px solid ${THEME.border.default}`,
      marginBottom: '12px',
    }}
  >
    <LegendItem color={THEME.candle.bullish} label="Tăng" />
    <LegendItem color={THEME.candle.bearish} label="Giảm" />
    <LegendItem color={THEME.price.bid} label="Bid" isLine />
    <LegendItem color={THEME.price.ask} label="Ask" isLine />
    <div style={{ color: THEME.text.muted, fontSize: '10px' }}>
      * Spread khác nhau do thanh khoản
    </div>
  </div>
));
Legend.displayName = 'Legend';

const LegendItem: React.FC<{ color: string; label: string; isLine?: boolean }> = ({
  color,
  label,
  isLine,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    {isLine ? (
      <div style={{ width: '14px', height: '2px', background: color }} />
    ) : (
      <div style={{ width: '12px', height: '12px', background: color, borderRadius: '2px' }} />
    )}
    <span style={{ color: THEME.text.secondary }}>{label}</span>
  </div>
);

const FooterInfo = memo<{ exchange1Name?: string; exchange2Name?: string; exchange3Name?: string }>(
  ({ exchange1Name, exchange2Name, exchange3Name }) => (
    <div style={{ color: THEME.text.muted, fontSize: '10px', marginTop: '10px', textAlign: 'center' }}>
      ⚡ Cập nhật: Real-time | Độ trễ: &lt;100ms
      <p>
        <span style={{ fontWeight: 'bold', color: THEME.text.secondary }}>
          {exchange3Name || 'Exchange 3'}
        </span>{' '}
        Chart là Của Sàn{' '}
        <span style={{ fontWeight: 'bold', color: THEME.text.secondary }}>
          {exchange2Name || 'Exchange 2'}
        </span>{' '}
        | Giá Bid/Ask real-time lấy từ Sàn{' '}
        <span style={{ fontWeight: 'bold', color: THEME.text.secondary }}>
          {exchange1Name || 'Exchange 1'}
        </span>
      </p>
    </div>
  )
);
FooterInfo.displayName = 'FooterInfo';

export default TripleExchangeChartModal;
