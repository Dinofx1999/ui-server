import React, { useEffect, useMemo, useRef, useState } from "react";

export type Candle = {
  time: string;
  high: number;
  low: number;
  open: number;
  close: number;
};

type Props = {
  data: Candle[];

  width?: number;
  height?: number;

  // nếu bạn feed WS
  bid?: number;
  ask?: number;

  // nếu không feed WS thì auto chạy demo
  autoBidAsk?: boolean;

  precision?: number;

  // ✅ candle look
  candleWidthRatio?: number; // mảnh: 0.22 - 0.35
  candleMinWidth?: number;   // px
  candleMaxWidth?: number;   // px
  candleRadius?: number;     // bo góc
  wickWidth?: number;        // px
  candleGapSides?: number;   // chừa lề 2 bên (0.8 - 1.4 step)

  title?: string;
  showOhlcTop?: boolean;     // hiện OHLC header
  style?: React.CSSProperties;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function ModernMiniCandleChart({
  data,
  width = 560,
  height = 340,

  bid,
  ask,
  autoBidAsk = true,

  precision = 5,

  // ✅ mặc định “mảnh mai”
  candleWidthRatio = 0.28,
  candleMinWidth = 5,
  candleMaxWidth = 14,
  candleRadius = 7,
  wickWidth = 2,
  candleGapSides = 1.15,

  title = "OHLC • Bid/Ask",
  showOhlcTop = true,
  style,
}: Props) {
  // ===== layout =====
  const pad = { l: 64, r: 78, t: 46, b: 42 };
  const innerW = Math.max(10, width - pad.l - pad.r);
  const innerH = Math.max(10, height - pad.t - pad.b);

  const lastClose = data?.[data.length - 1]?.close ?? 1;

  // ===== bid/ask =====
  const [liveBid, setLiveBid] = useState<number>(bid ?? lastClose);
  const [liveAsk, setLiveAsk] = useState<number>(ask ?? lastClose);

  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof bid === "number") setLiveBid(bid);
  }, [bid]);

  useEffect(() => {
    if (typeof ask === "number") setLiveAsk(ask);
  }, [ask]);

  useEffect(() => {
    if (!autoBidAsk) return;

    const base = lastClose || 1;
    const spread = Math.max(base * 0.00003, 0.00005);

    timerRef.current = window.setInterval(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const jitter = (Math.random() - 0.5) * spread * 0.9;
        const mid = base + jitter;
        setLiveBid(mid - spread / 2);
        setLiveAsk(mid + spread / 2);
      });
    }, 80);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoBidAsk, lastClose]);

  // ===== scale =====
  const domain = useMemo(() => {
    if (!data?.length) return { min: 0, max: 1 };

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const c of data) {
      min = Math.min(min, c.low, c.open, c.close);
      max = Math.max(max, c.high, c.open, c.close);
    }

    min = Math.min(min, liveBid, liveAsk);
    max = Math.max(max, liveBid, liveAsk);

    // ✅ margin nhỏ để nến “cao” hơn
    const range = max - min || 1;
    const margin = range * 0.04;
    return { min: min - margin, max: max + margin };
  }, [data, liveBid, liveAsk]);

  const yToPx = (price: number) => {
    const { min, max } = domain;
    const t = (price - min) / (max - min || 1);
    return pad.t + (1 - t) * innerH;
  };

  // ===== x positions (đẹp + dễ nhìn) =====
  const n = Math.max(1, data.length);
  const xStep = innerW / (n + candleGapSides); // candleGapSides > 1 => chừa lề
  const xOf = (i: number) => pad.l + (i + candleGapSides / 2) * xStep;

  // ===== candle sizes =====
  const bodyW = Math.max(
    candleMinWidth,
    Math.min(candleMaxWidth, xStep * candleWidthRatio)
  );

  // ===== ticks =====
  const yTicks = 5;
  const tickVals = useMemo(() => {
    const { min, max } = domain;
    const res: number[] = [];
    for (let i = 0; i < yTicks; i++) {
      const t = i / (yTicks - 1);
      res.push(min + (max - min) * (1 - t));
    }
    return res;
  }, [domain]);

  const fmt = (v: number) => v.toFixed(precision);

  const bidY = yToPx(liveBid);
  const askY = yToPx(liveAsk);

  // ===== modern theme =====
  const theme = {
    bg: "#0a0f1c",
    panel: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.10)",
    grid: "rgba(255,255,255,0.07)",
    text: "rgba(255,255,255,0.90)",
    muted: "rgba(255,255,255,0.55)",
    bull: "#22c55e",
    bear: "#ef4444",
    bid: "#38bdf8",
    ask: "#f59e0b",
  };

  // ===== header OHLC (candle cuối) =====
  const last = data?.[data.length - 1];
  const headerText = last
    ? `O ${fmt(last.open)}  H ${fmt(last.high)}  L ${fmt(last.low)}  C ${fmt(last.close)}`
    : "";

  // ===== helper: tag label (bid/ask) =====
  const PriceTag = ({
    y,
    color,
    label,
  }: {
    y: number;
    color: string;
    label: string;
  }) => {
    const clampedY = clamp(y, pad.t + 14, pad.t + innerH - 14);
    const tagW = pad.r - 14;
    const x = pad.l + innerW + 8;

    return (
      <g>
        <rect
          x={x}
          y={clampedY - 12}
          width={tagW}
          height={24}
          rx={10}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.10)"
        />
        <rect x={x} y={clampedY - 12} width={6} height={24} rx={10} fill={color} />
        <text
          x={x + tagW / 2}
          y={clampedY + 5}
          textAnchor="middle"
          fill={color}
          fontSize={11}
          fontFamily="ui-sans-serif, system-ui"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div style={{ width, ...style }}>
      <svg width={width} height={height} style={{ display: "block" }}>
        {/* background */}
        <rect x={0} y={0} width={width} height={height} rx={18} fill={theme.bg} />

        {/* subtle top gradient */}
        <defs>
          <linearGradient id="topGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,0,0,0.45)" />
          </filter>
        </defs>
        <rect x={0} y={0} width={width} height={height} rx={18} fill="url(#topGlow)" />

        {/* Title + OHLC header */}
        <text
          x={pad.l}
          y={26}
          fill={theme.text}
          fontSize={14}
          fontFamily="ui-sans-serif, system-ui"
        >
          {title}
        </text>

        {showOhlcTop && (
          <text
            x={pad.l}
            y={44}
            fill={theme.muted}
            fontSize={11}
            fontFamily="ui-sans-serif, system-ui"
          >
            {headerText}
          </text>
        )}

        {/* chart panel */}
        <rect
          x={pad.l}
          y={pad.t}
          width={innerW}
          height={innerH}
          rx={14}
          fill={theme.panel}
          stroke={theme.border}
          filter="url(#softShadow)"
        />

        {/* grid + y labels */}
        {tickVals.map((v, i) => {
          const y = yToPx(v);
          return (
            <g key={`y-${i}`}>
              <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke={theme.grid} />
              <text
                x={pad.l - 10}
                y={y + 4}
                textAnchor="end"
                fill={theme.muted}
                fontSize={11}
                fontFamily="ui-sans-serif, system-ui"
              >
                {fmt(v)}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {data.map((c, i) => {
          const x = xOf(i);
          return (
            <text
              key={`x-${i}`}
              x={x}
              y={pad.t + innerH + 26}
              textAnchor="middle"
              fill={theme.muted}
              fontSize={11}
              fontFamily="ui-sans-serif, system-ui"
            >
              {c.time}
            </text>
          );
        })}

        {/* candles */}
        {data.map((c, i) => {
          const x = xOf(i);

          const hi = yToPx(c.high);
          const lo = yToPx(c.low);
          const op = yToPx(c.open);
          const cl = yToPx(c.close);

          const isBull = c.close >= c.open;
          const color = isBull ? theme.bull : theme.bear;

          const top = Math.min(op, cl);
          const bot = Math.max(op, cl);
          const bodyH = Math.max(2, bot - top);

          const bodyX = x - bodyW / 2;
          const wickX = x - wickWidth / 2;

          return (
            <g key={`c-${i}`}>
              {/* wick */}
              <rect
                x={wickX}
                y={hi}
                width={wickWidth}
                height={Math.max(2, lo - hi)}
                rx={2}
                fill={color}
                opacity={0.95}
              />

              {/* body */}
              <rect
                x={bodyX}
                y={top}
                width={bodyW}
                height={bodyH}
                rx={candleRadius}
                fill={color}
                opacity={0.92}
              />
            </g>
          );
        })}

        {/* bid/ask lines */}
        <line
          x1={pad.l}
          y1={bidY}
          x2={pad.l + innerW}
          y2={bidY}
          stroke={theme.bid}
          strokeDasharray="6 6"
          opacity={0.95}
        />
        <line
          x1={pad.l}
          y1={askY}
          x2={pad.l + innerW}
          y2={askY}
          stroke={theme.ask}
          strokeDasharray="6 6"
          opacity={0.95}
        />

        {/* price tags */}
        <PriceTag y={bidY} color={theme.bid} label={`BID ${fmt(liveBid)}`} />
        <PriceTag y={askY} color={theme.ask} label={`ASK ${fmt(liveAsk)}`} />

        {/* small footer: spread */}
        <text
          x={pad.l + innerW}
          y={pad.t - 14}
          textAnchor="end"
          fill={theme.muted}
          fontSize={11}
          fontFamily="ui-sans-serif, system-ui"
        >
          Spread: {(Math.abs(liveAsk - liveBid)).toFixed(precision)}
        </text>
      </svg>
    </div>
  );
}
