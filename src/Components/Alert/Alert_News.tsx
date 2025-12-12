import React from "react";

type ImpactLevel = "high" | "medium" | "low" | "unknown";
type Tone = "default" | "now" | "past";

interface ImpactBadgeProps {
  level: string;                // nhận luôn newsItem.impactName
  text?: string;
  size?: "sm" | "md";
  tone?: Tone;                  // ✅ NEW
}

const normalizeLevel = (x: any): ImpactLevel => {
  const v = String(x ?? "").trim().toLowerCase();
  if (v === "high" || v === "medium" || v === "low") return v;
  return "unknown";
};

const LEVEL_STYLE: Record<ImpactLevel, any> = {
  high: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "#ef4444", emoji: "🔴", label: "HIGH" },
  medium: { bg: "rgba(249,115,22,0.15)", color: "#f97316", border: "#f97316", emoji: "🟠", label: "MED" },
  low: { bg: "rgba(234,179,8,0.15)", color: "#eab308", border: "#eab308", emoji: "🟡", label: "LOW" },
  unknown: { bg: "rgba(156,163,175,0.15)", color: "#9ca3af", border: "#9ca3af", emoji: "⚪", label: "N/A" },
};

// ✅ tone override
const TONE_OVERRIDE: Record<Tone, Partial<{ bg: string; color: string; border: string; emoji: string }>> = {
  default: {},
  now: {
    bg: "rgba(34,211,238,0.16)",
    color: "#22d3ee",
    border: "#22d3ee",
    emoji: "⚡",
  },
  past: {
    bg: "rgba(156,163,175,0.18)",
    color: "#9ca3af",
    border: "#6b7280",
    emoji: "⏱️",
  },
};

const SIZE_STYLE = {
  sm: { fontSize: "10px", padding: "2px 6px", gap: "4px" },
  md: { fontSize: "11px", padding: "4px 8px", gap: "6px" },
};

const ImpactBadge: React.FC<ImpactBadgeProps> = ({ level, text, size = "sm", tone = "default" }) => {
  const lv = normalizeLevel(level);
  const base = LEVEL_STYLE[lv];
  const over = TONE_OVERRIDE[tone] ?? {};

  const style = {
    bg: over.bg ?? base.bg,
    color: over.color ?? base.color,
    border: over.border ?? base.border,
    emoji: over.emoji ?? base.emoji,
    label: base.label,
  };

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
      title={tone === "past" ? "Đã qua" : tone === "now" ? "Đang tới / sắp tới" : ""}
    >
      <span>{style.emoji}</span>
      <span>{text ?? style.label}</span>
    </span>
  );
};

export default ImpactBadge;
