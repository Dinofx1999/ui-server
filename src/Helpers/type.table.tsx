
import { Badge, Space, Tag, type TableProps ,Tooltip, Button } from 'antd';
export type BrokerRow = {
  broker: string;
  broker_: string;
  port: string;           // server trả về dạng string
  index: string;          // string
  version: string;
  totalsymbol: string;    // string
  timecurent: string;     // "YYYY.MM.DD HH:mm:ss"
  timeUpdated: string;    // "YYYY.MM.DD HH:mm:ss"
  symbolCount: number;    // number
};



// helper: đổi "2025.11.09 13:10:49" -> Date
export const parseDotDate = (s?: string) => {
  if (!s) return null;
  // 2025.11.09 13:10:49 => 2025-11-09T13:10:49
  const iso = s.replace(/\./g, '-').replace(' ', 'T');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};


export const numberFmt = (n: number | string) =>
  Intl.NumberFormat().format(typeof n === 'string' ? Number(n) : n);

// Tô màu theo “độ mới” của timeUpdated (<= 5 phút: success, <= 30 phút: processing, > 30 phút: default)
export const freshnessColor = (updated?: string) => {
  const d = parseDotDate(updated);
  if (!d) return 'default' as const;
  const diffMs = Date.now() - d.getTime();
  const diffMin = diffMs / 60000;
  if (diffMin <= 5) return 'success' as const;
  if (diffMin <= 30) return 'processing' as const;
  return 'default' as const;
};
