import React from "react";

type ImpactLevel = "high" | "medium" | "low" | "unknown";

interface ImpactBadgeProps {
  level: ImpactLevel;
  text?: string;
  size?: "sm" | "md";
}

const IMPACT_STYLE: Record<ImpactLevel, any> = {
  high: {
    bg: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    border: "#ef4444",
    emoji: "🔴",
    label: "HIGH",
  },
  medium: {
    bg: "rgba(249,115,22,0.15)",
    color: "#f97316",
    border: "#f97316",
    emoji: "🟠",
    label: "MED",
  },
  low: {
    bg: "rgba(234,179,8,0.15)",
    color: "#eab308",
    border: "#eab308",
    emoji: "🟡",
    label: "LOW",
  },
  unknown: {
    bg: "rgba(156,163,175,0.15)",
    color: "#9ca3af",
    border: "#9ca3af",
    emoji: "⚪",
    label: "N/A",
  },
};

const SIZE_STYLE = {
  sm: {
    fontSize: "10px",
    padding: "2px 6px",
    gap: "4px",
  },
  md: {
    fontSize: "11px",
    padding: "4px 8px",
    gap: "6px",
  },
};

const ImpactBadge: React.FC<ImpactBadgeProps> = ({
  level,
  text,
  size = "sm",
}) => {
  const style = IMPACT_STYLE[level] ?? IMPACT_STYLE.unknown;
  const sizeStyle = SIZE_STYLE[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizeStyle.gap,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: 700,
        borderRadius: "999px",
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span>{style.emoji}</span>
      <span>{text ?? style.label}</span>
    </span>
  );
};

export default ImpactBadge;
