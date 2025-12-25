import React, { useMemo, useCallback, memo } from 'react';
import { Modal, Spin, Button, Tooltip, message } from 'antd';
import {normalizeBrokerName} from '../../Helpers/text';
import axios from 'axios';

import { RefreshCcw, Trash2 ,TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  CandlestickChart,
  Activity,
  PieChart} from "lucide-react";

// ============================================================================
// CONSTANTS
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
    bullish: '#25fe29',
    bearish: '#f80505',
  },
  price: {
    bid: '#60a5fa',
    ask: '#fbbf24',
    spread: '#f97316',

    // Pair 2 colors
    bid2: '#a78bfa',
    ask2: '#fb7185',
  },
} as const;

const CANDLE_PRESETS = {
  'slim-tall': { width: 6, spacing: 20, wickWidth: 1, heightScale: 1.2 },
  thin: { width: 12, spacing: 45, wickWidth: 1.5, heightScale: 1.2 },
  normal: { width: 18, spacing: 55, wickWidth: 1.5, heightScale: 1.0 },
  wide: { width: 24, spacing: 65, wickWidth: 2, heightScale: 1.0 },
  tall: { width: 16, spacing: 52, wickWidth: 1.5, heightScale: 1.5 },
} as const;

const CHART_CONFIG = {
  maxCandles: 10,
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

  exchange1Spread?: number; // points
  exchange2Spread?: number; // points
  exchange3Spread?: number; // points
}

interface ChartViewProps {
  data: OHLCData[];
  exchangeName: string; // label for pair1
  accentColor: string;

  bid?: number; // Bid1
  ask?: number; // Ask1
  spread?: number; // points (UI)
  digits?: number;

  isMobile?: boolean;
  scaleFactor?: number;

  // Pair 2 (only chart3 uses)
  bid2?: number;
  ask2?: number; // if not provided, can be computed from bid2+spread2Points
  digits2?: number;
  label2?: string;

  // ✅ Pair2: Ask2 = Bid2 + Spread2(points)
  spread2Points?: number;
  ask2FromBidPlusSpread2?: boolean;
}

// ============================================================================
// UTILITY
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

// spread in points -> price
const pointsToPrice = (points: number, digits: number) => {
  const d = Math.max(0, digits);
  return points / Math.pow(10, d);
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
      <line x1={x} y1={highY} x2={x} y2={lowY} stroke={bodyColor} strokeWidth={config.wickWidth} />
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
        fontSize={Math.max(5, config.fontSize * 0.9)}
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
            <text x="28" y={y + 3} textAnchor="end" fill={THEME.text.muted} fontSize={config.fontSize}>
              {formatPrice(price, digits)}
            </text>
          </g>
        );
      })}
    </>
  );
});
GridLines.displayName = 'GridLines';

// ============================================================================
// BID/ASK LINES (Label left on line, Price box right centered)
// ============================================================================

const PriceBox = memo<{
  x: number;
  yLine: number;
  yOffset: number;
  width: number;
  height: number;
  radius: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  text: string;
  textPaddingX: number;
  textYOffset: number;
  fontSize: number;
  fontWeight?: number;
  textColor: string;
}>(
  ({
    x,
    yLine,
    yOffset,
    width,
    height,
    radius,
    stroke,
    strokeWidth,
    fill,
    text,
    textPaddingX,
    textYOffset,
    fontSize,
    fontWeight = 800,
    textColor,
  }) => {
    const yLabel = yLine + yOffset;
    const rectY = yLabel - height / 2;
    const textY = yLabel + textYOffset;

    return (
      <>
        <rect
          x={x}
          y={rectY}
          width={width}
          height={height}
          rx={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity="0.95"
        />
        <text
          x={x + textPaddingX}
          y={textY}
          textAnchor="start"
          fill={textColor}
          fontSize={fontSize}
          fontWeight={fontWeight}
        >
          {text}
        </text>
      </>
    );
  }
);
PriceBox.displayName = 'PriceBox';

const ExchangeLineLabel = memo<{
  x: number;
  yLine: number;
  yOffset: number;
  text: string;
  color: string;
  fontSize: number;
  fontWeight?: number;
  textYOffset: number;
}>(({ x, yLine, yOffset, text, color, fontSize, fontWeight = 800, textYOffset }) => {
  const yLabel = yLine + yOffset;
  return (
    <text
      x={x}
      y={yLabel + textYOffset}
      textAnchor="start"
      fill={color}
      fontSize={fontSize}
      fontWeight={fontWeight}
      opacity="0.95"
    >
      {text}
    </text>
  );
});
ExchangeLineLabel.displayName = 'ExchangeLineLabel';

const BidAskLines = memo<{
  bidPrice: number;
  askPrice: number;
  scale: (price: number) => number;
  config: any;
  digits: number;
  label1?: string;
}>(({ bidPrice, askPrice, scale, config, digits, label1 }) => {
  const bidY = scale(bidPrice);
  const askY = scale(askPrice);

  const priceBoxX = config.bidAskXRight - config.priceBoxWidth;
  const labelX = config.bidAskXLeft + config.exchangeLabelInset;

  return (
    <g>
      {/* ASK */}
      <line
        x1={config.bidAskXLeft}
        y1={askY}
        x2={config.bidAskXRight}
        y2={askY}
        stroke={THEME.price.ask}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="6,3"
        opacity="0.95"
      />
      <ExchangeLineLabel
        x={labelX}
        yLine={askY}
        yOffset={0}
        text={label1 ? `${label1} ASK` : 'ASK'}
        color={THEME.price.ask}
        fontSize={config.exchangeLabelFontSize}
        textYOffset={config.exchangeLabelTextYOffset}
      />
      <PriceBox
        x={priceBoxX}
        yLine={askY}
        yOffset={0}
        width={config.priceBoxWidth}
        height={config.priceBoxHeight}
        radius={config.priceBoxRadius}
        stroke={THEME.price.ask}
        strokeWidth={config.priceBoxStroke}
        fill={THEME.background.tertiary}
        text={formatPrice(askPrice, digits)}
        textPaddingX={config.priceBoxTextPaddingX}
        textYOffset={config.priceBoxTextYOffset}
        fontSize={config.priceBoxFontSize}
        textColor={THEME.price.ask}
      />

      {/* BID */}
      <line
        x1={config.bidAskXLeft}
        y1={bidY}
        x2={config.bidAskXRight}
        y2={bidY}
        stroke={THEME.price.bid}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="4,4"
        opacity="0.95"
      />
      <ExchangeLineLabel
        x={labelX}
        yLine={bidY}
        yOffset={0}
        text={label1 ? `${label1} BID` : 'BID'}
        color={THEME.price.bid}
        fontSize={config.exchangeLabelFontSize}
        textYOffset={config.exchangeLabelTextYOffset}
      />
      <PriceBox
        x={priceBoxX}
        yLine={bidY}
        yOffset={0}
        width={config.priceBoxWidth}
        height={config.priceBoxHeight}
        radius={config.priceBoxRadius}
        stroke={THEME.price.bid}
        strokeWidth={config.priceBoxStroke}
        fill={THEME.background.tertiary}
        text={formatPrice(bidPrice, digits)}
        textPaddingX={config.priceBoxTextPaddingX}
        textYOffset={config.priceBoxTextYOffset}
        fontSize={config.priceBoxFontSize}
        textColor={THEME.price.bid}
      />
    </g>
  );
});
BidAskLines.displayName = 'BidAskLines';

const BidAskLinesDual = memo<{
  bidPrice: number;
  askPrice: number;
  bidPrice2: number;
  askPrice2: number;
  scale: (price: number) => number;
  config: any;
  digits: number;
  digits2: number;
  label1?: string;
  label2?: string;
}>(({ bidPrice, askPrice, bidPrice2, askPrice2, scale, config, digits, digits2, label1, label2 }) => {
  const bidY1 = scale(bidPrice);
  const askY1 = scale(askPrice);

  const bidY2 = scale(bidPrice2);
  const askY2 = scale(askPrice2);

  const priceBoxX = config.bidAskXRight - config.priceBoxWidth;
  const labelX = config.bidAskXLeft + config.exchangeLabelInset;

  // only move box/text if too close (line stays exact)
  const minGap = config.priceBoxHeight * 0.95;
  const calcBoxOffset = (yA: number, yB: number, direction: 1 | -1) => {
    const gap = Math.abs(yA - yB);
    if (gap >= minGap) return 0;
    return direction * (minGap - gap);
  };

  const offsetAsk1 = calcBoxOffset(askY1, askY2, -1);
  const offsetBid1 = calcBoxOffset(bidY1, bidY2, -1);
  const offsetAsk2 = calcBoxOffset(askY2, askY1, 1);
  const offsetBid2 = calcBoxOffset(bidY2, bidY1, 1);

  return (
    <g>
      {/* Pair 1 ASK */}
      <line
        x1={config.bidAskXLeft}
        y1={askY1}
        x2={config.bidAskXRight}
        y2={askY1}
        stroke={THEME.price.ask}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="6,3"
        opacity="0.95"
      />
      <ExchangeLineLabel
        x={labelX}
        yLine={askY1}
        yOffset={0}
        text={label1 ? `${label1} ASK` : 'ASK'}
        color={THEME.price.ask}
        fontSize={config.exchangeLabelFontSize}
        textYOffset={config.exchangeLabelTextYOffset}
      />
      <PriceBox
        x={priceBoxX}
        yLine={askY1}
        yOffset={offsetAsk1}
        width={config.priceBoxWidth}
        height={config.priceBoxHeight}
        radius={config.priceBoxRadius}
        stroke={THEME.price.ask}
        strokeWidth={config.priceBoxStroke}
        fill={THEME.background.tertiary}
        text={formatPrice(askPrice, digits)}
        textPaddingX={config.priceBoxTextPaddingX}
        textYOffset={config.priceBoxTextYOffset}
        fontSize={config.priceBoxFontSize}
        textColor={THEME.price.ask}
      />

      {/* Pair 1 BID */}
      <line
        x1={config.bidAskXLeft}
        y1={bidY1}
        x2={config.bidAskXRight}
        y2={bidY1}
        stroke={THEME.price.bid}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="4,4"
        opacity="0.95"
      />
      <ExchangeLineLabel
        x={labelX}
        yLine={bidY1}
        yOffset={0}
        text={label1 ? `${label1} BID` : 'BID'}
        color={THEME.price.bid}
        fontSize={config.exchangeLabelFontSize}
        textYOffset={config.exchangeLabelTextYOffset}
      />
      <PriceBox
        x={priceBoxX}
        yLine={bidY1}
        yOffset={offsetBid1}
        width={config.priceBoxWidth}
        height={config.priceBoxHeight}
        radius={config.priceBoxRadius}
        stroke={THEME.price.bid}
        strokeWidth={config.priceBoxStroke}
        fill={THEME.background.tertiary}
        text={formatPrice(bidPrice, digits)}
        textPaddingX={config.priceBoxTextPaddingX}
        textYOffset={config.priceBoxTextYOffset}
        fontSize={config.priceBoxFontSize}
        textColor={THEME.price.bid}
      />

      {/* Pair 2 ASK */}
      <line
        x1={config.bidAskXLeft}
        y1={askY2}
        x2={config.bidAskXRight}
        y2={askY2}
        stroke={THEME.price.ask2}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="8,2"
        opacity="0.95"
      />
      <ExchangeLineLabel
        x={labelX}
        yLine={askY2}
        yOffset={0}
        text={label2 ? `${label2} ASK` : 'ASK2'}
        color={THEME.price.ask2}
        fontSize={config.exchangeLabelFontSize}
        textYOffset={config.exchangeLabelTextYOffset}
      />
      <PriceBox
        x={priceBoxX}
        yLine={askY2}
        yOffset={offsetAsk2}
        width={config.priceBoxWidth}
        height={config.priceBoxHeight}
        radius={config.priceBoxRadius}
        stroke={THEME.price.ask2}
        strokeWidth={config.priceBoxStroke}
        fill={THEME.background.tertiary}
        text={formatPrice(askPrice2, digits2)}
        textPaddingX={config.priceBoxTextPaddingX}
        textYOffset={config.priceBoxTextYOffset}
        fontSize={config.priceBoxFontSize}
        textColor={THEME.price.ask2}
      />

      {/* Pair 2 BID */}
      <line
        x1={config.bidAskXLeft}
        y1={bidY2}
        x2={config.bidAskXRight}
        y2={bidY2}
        stroke={THEME.price.bid2}
        strokeWidth={config.bidAskStrokeWidth}
        strokeDasharray="2,6"
        opacity="0.95"
      />
      <ExchangeLineLabel
        x={labelX}
        yLine={bidY2}
        yOffset={0}
        text={label2 ? `${label2} BID` : 'BID2'}
        color={THEME.price.bid2}
        fontSize={config.exchangeLabelFontSize}
        textYOffset={config.exchangeLabelTextYOffset}
      />
      <PriceBox
        x={priceBoxX}
        yLine={bidY2}
        yOffset={offsetBid2}
        width={config.priceBoxWidth}
        height={config.priceBoxHeight}
        radius={config.priceBoxRadius}
        stroke={THEME.price.bid2}
        strokeWidth={config.priceBoxStroke}
        fill={THEME.background.tertiary}
        text={formatPrice(bidPrice2, digits2)}
        textPaddingX={config.priceBoxTextPaddingX}
        textYOffset={config.priceBoxTextYOffset}
        fontSize={config.priceBoxFontSize}
        textColor={THEME.price.bid2}
      />
    </g>
  );
});
BidAskLinesDual.displayName = 'BidAskLinesDual';

// ============================================================================
// CHART VIEW
// ============================================================================

const ChartView = memo<ChartViewProps>(({
  data,
  exchangeName,
  accentColor,
  bid,
  ask,
  spread,
  digits = 2,
  isMobile = false,
  scaleFactor = 1,

  bid2,
  ask2,
  digits2,
  label2,

  spread2Points,
  ask2FromBidPlusSpread2 = false,
}) => {
  const DIGITS = Math.max(0, safeNumber(digits, 2));
  const DIGITS2 = Math.max(0, safeNumber(digits2 ?? digits, 2));

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

      bidAskXLeft: (35) * s,
      bidAskXRight: (CHART_CONFIG.baseWidth + 30) * s,
      bidAskStrokeWidth: 1.5 * s,

      exchangeLabelInset: 6 * s,
      exchangeLabelFontSize: Math.max(7, Math.round(7 * s)),
      exchangeLabelTextYOffset: 2 * s,

      priceBoxWidth: 64 * s,
      priceBoxHeight: 14 * s,
      priceBoxRadius: 3 * s,
      priceBoxStroke: 0.85 * s,
      priceBoxFontSize: Math.max(8, Math.round(8 * s)),
      priceBoxTextPaddingX: 6 * s,
      priceBoxTextYOffset: 2 * s,
    };
  }, [scaleFactor]);

  const viewData = useMemo(() => {
    if (!data?.length) return [];
    return data.length > CHART_CONFIG.maxCandles ? data.slice(-CHART_CONFIG.maxCandles) : data;
  }, [data]);

  // Pair1 realtime
  const { bidPrice, askPrice, realtimeData } = useMemo(() => {
    if (!viewData.length) return { bidPrice: 0, askPrice: 0, realtimeData: [] as OHLCData[] };

    const lastCandle = viewData[viewData.length - 1];
    const bidP = safeNumber(bid, lastCandle.close);
    const askP = safeNumber(ask, lastCandle.close);

    // realtime update candle (use bid as close)
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

  // Pair2: compute Ask2 = Bid2 + Spread2(points) when enabled
  const { bidPrice2, askPrice2 } = useMemo(() => {
    if (!viewData.length) return { bidPrice2: Number.NaN, askPrice2: Number.NaN };

    const lastCandle = viewData[viewData.length - 1];
    const b2 = safeNumber(bid2, Number.NaN);
    const fallback = lastCandle.close;

    const bid2Final = Number.isFinite(b2) ? b2 : fallback;

    let ask2Final = safeNumber(ask2, Number.NaN);
    if (!Number.isFinite(ask2Final)) ask2Final = fallback;

    if (ask2FromBidPlusSpread2 && Number.isFinite(bid2Final)) {
      const sp2Pts = safeNumber(spread2Points, 0);
      ask2Final = bid2Final + pointsToPrice(sp2Pts, DIGITS2);
    }

    return { bidPrice2: bid2Final, askPrice2: ask2Final };
  }, [viewData, bid2, ask2, ask2FromBidPlusSpread2, spread2Points, DIGITS2]);

  const chartInfo = useMemo(() => {
    if (!realtimeData.length) return { maxPrice: 0, minPrice: 0, priceRange: 1, scale: (_: number) => 0 };

    const allPrices = realtimeData.flatMap((d) => [d.high, d.low, d.open, d.close]);

    if (Number.isFinite(bidPrice)) allPrices.push(bidPrice);
    if (Number.isFinite(askPrice)) allPrices.push(askPrice);
    if (Number.isFinite(bidPrice2)) allPrices.push(bidPrice2);
    if (Number.isFinite(askPrice2)) allPrices.push(askPrice2);

    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1e-9;

    return {
      maxPrice,
      minPrice,
      priceRange,
      scale: (price: number) => ((maxPrice - price) / priceRange) * config.scaleHeight + config.scaleOffset,
    };
  }, [realtimeData, bidPrice, askPrice, bidPrice2, askPrice2, config]);

  const stats = useMemo(() => {
    if (!realtimeData.length) return null;
    return {
      open: realtimeData[0].open,
      high: Math.max(...realtimeData.map((d) => d.high)),
      low: Math.min(...realtimeData.map((d) => d.low)),
      close: realtimeData[realtimeData.length - 1].close,
    };
  }, [realtimeData]);

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
        <div style={{ color: THEME.text.muted, fontSize: '12px', marginTop: '12px' }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  const hasSecondPair = Number.isFinite(bid2 as any) || ask2FromBidPlusSpread2 || Number.isFinite(ask2 as any);

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
          <span style={{ color: THEME.text.primary, fontWeight: 700, fontSize: '13px' }}>{exchangeName}</span>
          {hasSecondPair && <span style={{ marginLeft: 8, fontSize: 10, color: THEME.text.muted }}>(Bid/Ask x2)</span>}
        </div>

        {stats && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: `${Math.max(10, Math.round(7 * scaleFactor))}px`,
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              width: '100%',
            }}
          >
            <StatItem label="O" value={formatPrice(stats.open, DIGITS)} color={THEME.text.primary} />
            <StatItem label="H" value={formatPrice(stats.high, DIGITS)} color={THEME.candle.bullish} />
            <StatItem label="L" value={formatPrice(stats.low, DIGITS)} color={THEME.candle.bearish} />
            <StatItem label="C" value={formatPrice(stats.close, DIGITS)} color="#3b82f6" />

            <StatItem label="Spread" value={formatPrice(safeNumber(spread, 0), 0)} color={THEME.price.spread} weight={900} />
            <StatItem label="Bid" value={formatPrice(bidPrice, DIGITS)} color={THEME.price.bid} weight={900} />
            <StatItem label="Ask" value={formatPrice(askPrice, DIGITS)} color={THEME.price.ask} weight={900} />

            {hasSecondPair && (
              <>
                <StatItem label="Bid2" value={formatPrice(bidPrice2, DIGITS2)} color={THEME.price.bid2} weight={900} />
                <StatItem label="Ask2" value={formatPrice(askPrice2, DIGITS2)} color={THEME.price.ask2} weight={900} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ padding: '8px', background: THEME.background.tertiary }}>
        <svg width="100%" height={config.chartHeight} viewBox={`0 0 ${config.chartWidth} ${config.chartHeight}`}>
          <GridLines scale={chartInfo.scale} maxPrice={chartInfo.maxPrice} minPrice={chartInfo.minPrice} config={config} digits={DIGITS} />

          {realtimeData.map((candle, index) => (
            <Candlestick key={`${candle.time}-${index}`} candle={candle} index={index} scale={chartInfo.scale} config={config} />
          ))}

          {hasSecondPair ? (
            <BidAskLinesDual
              bidPrice={bidPrice}
              askPrice={askPrice}
              bidPrice2={bidPrice2}
              askPrice2={askPrice2}
              scale={chartInfo.scale}
              config={config}
              digits={DIGITS}
              digits2={DIGITS2}
              label1={exchangeName}
              label2={label2}
            />
          ) : (
            <BidAskLines bidPrice={bidPrice} askPrice={askPrice} scale={chartInfo.scale} config={config} digits={DIGITS} label1={exchangeName} />
          )}
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
// MAIN MODAL
// ============================================================================


export async function Handle_ResetSymbol(
  symbol: string,
  exchangeName: string,
  messageApi: { success: (s: string) => void; error: (s: string) => void }
) {
  try {
    const exchangeName_ = normalizeBrokerName(exchangeName);

    const accessToken = localStorage.getItem("accessToken") || "";
    const resp: any = await axios.get(
      `http://116.105.227.149:5000/v1/api/${exchangeName_}/${symbol}/reset`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${accessToken}`,
        },
        timeout: 10000,
      }
    );

    if (resp?.data?.code === 1) {
      messageApi.success(`Gửi Reset Broker: ${exchangeName} thành công!`);
    } else {
      messageApi.error(
        `Gửi yêu cầu Reset Broker: ${exchangeName} thất bại!${
          resp?.data?.mess ? " , " + resp.data.mess : ""
        }`
      );
    }

    return resp?.data;
  } catch (error: any) {
    messageApi.error(String(error?.message ?? error));
    throw error;
  }
}

const TripleExchangeChartModal: React.FC<TripleExchangeChartModalProps> = ({
  isOpen,
  onClose,
  symbol = 'EUR/USD',
  exchange1,
  exchange2,
  exchange3,
  timeframe = '1M',

  exchange1Bid,
  exchange1Ask,
  exchange2Bid,
  exchange2Ask,
  exchange3Bid,
  exchange3Ask,

  exchange1Spread,
  exchange2Spread,
  exchange3Spread,

  exchange1Digits,
  exchange2Digits,
  exchange3Digits,
}) => {
  const { isMobile, isTablet } = useResponsive();

  const [isZoom, setIsZoom] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const modalWidth = useMemo(() => {
    if (isFullScreen) return isMobile ? '99vw' : '98vw';
    if (isMobile) return isZoom ? '99vw' : '95vw';
    if (isTablet) return isZoom ? 1400 : 1100;
    return isZoom ? 1600 : 1200;
  }, [isMobile, isTablet, isZoom, isFullScreen]);

  const scaleFactor = useMemo(() => {
    if (isFullScreen) return isMobile ? 1.5 : 2.0;
    if (isMobile) return isZoom ? 1.15 : 1.0;
    return isZoom ? 1.45 : 1.0;
  }, [isMobile, isZoom, isFullScreen]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const toggleZoom = useCallback(() => setIsZoom((prev) => !prev), []);
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
    if (!isFullScreen) setIsZoom(false);
  }, [isFullScreen]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px' }}>💱</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#008670' }}>{symbol}</span>
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: THEME.text.muted, marginLeft: '4px' }}>
                So Sánh Giá (3 Broker)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: THEME.text.muted, marginTop: '4px' }}>
              Timeframe: {timeframe} | Real-time
            </div>
          </div>
          {contextHolder}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
            <Tooltip title={`Reset ${symbol} , Broker ${exchange1?.name || 'Exchange 1'}`}>
              <Button
                size="small"
                onClick={() => {
                  Handle_ResetSymbol(symbol, exchange1?.name , messageApi);
                }}
                disabled={isFullScreen}
                style={{
                  borderColor: isZoom ? '#10b981' : THEME.border.default,
                  background: 'rgb(174, 101, 0)',
                  color: isZoom ? '#10b981' : THEME.text.primary,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  opacity: isFullScreen ? 0.5 : 1,
                }}
              >
                <RefreshCcw size={14} /> {exchange1?.name || 'Exchange 1'}
              </Button>
            </Tooltip>
            <Tooltip title={isZoom ? 'Thu nhỏ Modal' : 'Phóng to Modal'}>
              <Button
                size="small"
                onClick={() => {
                  Handle_ResetSymbol(symbol, 'all', messageApi);
                }}
                disabled={isFullScreen}
                style={{
                  borderColor: isZoom ? '#10b981' : THEME.border.default,
                  background: 'rgba(0, 142, 106, 0.875)',
                  color: isZoom ? '#10b981' : THEME.text.primary,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  opacity: isFullScreen ? 0.5 : 1,
                }}
              >
                <RefreshCcw size={14} /> {symbol} All
              </Button>
            </Tooltip>
            <Tooltip title={isZoom ? 'Thu nhỏ Modal' : 'Phóng to Modal'}>
              <Button
                size="small"
                onClick={toggleZoom}
                disabled={isFullScreen}
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
            spread={exchange1Spread}
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
            spread={exchange2Spread}
            digits={exchange2Digits}
            isMobile={isMobile}
            scaleFactor={scaleFactor}
          />

          {/* ✅ Chart 3 theo đúng yêu cầu:
              - Candle/Bid1/Ask1/Spread1 = Exchange3
              - Bid2 = Exchange2
              - Ask2 = Bid2 + Spread2(points) (Spread2 = Exchange2Spread)
           */}
          <ChartView
            data={exchange3?.data || []}
            exchangeName={exchange3?.name || 'Exchange 3'}
            accentColor={exchange3?.color || '#10b981'}
            bid={exchange3Bid}
            ask={exchange3Ask}
            spread={exchange3Spread}
            digits={exchange3Digits}
            isMobile={isMobile}
            scaleFactor={scaleFactor}
            bid2={exchange2Bid}
            // ask2 sẽ auto tính theo bid2+spread2Points
            digits2={exchange2Digits}
            label2={exchange2?.name || 'Exchange 2'}
            spread2Points={exchange2Spread}
            ask2FromBidPlusSpread2={true}
          />
        </div>

        <Legend isMobile={isMobile} />
        <FooterInfo exchange1Name={exchange1?.name} exchange2Name={exchange2?.name} exchange3Name={exchange3?.name} />
      </div>
    </Modal>
  );
};

// ============================================================================
// LEGEND & FOOTER
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
    <LegendItem color={THEME.price.bid2} label="Bid2" isLine />
    <LegendItem color={THEME.price.ask2} label="Ask2" isLine />
    <div style={{ color: THEME.text.muted, fontSize: '10px' }}>* Spread khác nhau do thanh khoản</div>
  </div>
));
Legend.displayName = 'Legend';

const LegendItem: React.FC<{ color: string; label: string; isLine?: boolean }> = ({ color, label, isLine }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    {isLine ? <div style={{ width: '14px', height: '2px', background: color }} /> : <div style={{ width: '12px', height: '12px', background: color, borderRadius: '2px' }} />}
    <span style={{ color: THEME.text.secondary }}>{label}</span>
  </div>
);

const FooterInfo = memo<{ exchange1Name?: string; exchange2Name?: string; exchange3Name?: string }>(
  ({ exchange1Name, exchange2Name, exchange3Name }) => (
    <div style={{ color: THEME.text.muted, fontSize: '10px', marginTop: '10px', textAlign: 'center' }}>
      ⚡ Cập nhật: Real-time | Độ trễ: &lt;100ms
      <p>
        <span style={{ fontWeight: 'bold', color: THEME.text.secondary }}>{exchange3Name || 'Exchange 3'}</span> Chart là Của Sàn{' '}
        <span style={{ fontWeight: 'bold', color: THEME.text.secondary }}>{exchange2Name || 'Exchange 2'}</span> | Giá Bid/Ask real-time lấy từ Sàn{' '}
        <span style={{ fontWeight: 'bold', color: THEME.text.secondary }}>{exchange1Name || 'Exchange 1'}</span>
      </p>
    </div>
  )
);
FooterInfo.displayName = 'FooterInfo';

export default TripleExchangeChartModal;
