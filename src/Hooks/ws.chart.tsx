import { useEffect, useMemo, useRef, useState } from "react";

export type ChartInit3 = {
  type: "CHART_INIT_3";
  symbol: string;
  broker: string; // broker_ (vd: "abc")
  charts: Array<any>; // bạn muốn type chặt thì mình sẽ type tiếp theo output của bạn
  tf?: string; // nếu có
};

export type ChartWSParams = {
  baseUrl: string;            // vd: ws://127.0.0.1:8004
  activeTab: string;          // symbol, vd: "EURUSD"
  activeBrokerChart: string;  // broker name hoặc broker_, vd: "ABC" hoặc "abc"
};

type UseChartWSReturn = {
  data: ChartInit3 | null;
  connected: boolean;
  error: string | null;
  wsState: number; // WebSocket.readyState
  reconnectCount: number;
};

function normSymbol(s: string) {
  return String(s || "").trim().toUpperCase();
}

// Nếu bạn đã có formatString ở FE thì dùng luôn.
// Ở đây mình làm normalize đơn giản: "ABC" -> "abc", "2 ATFX" -> "2-atfx"
function normBroker(b: string) {
  return String(b || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._:-]/g, "")
    .toLowerCase();
}

export function useChartWS(params: ChartWSParams | null): UseChartWSReturn {
  const [data, setData] = useState<ChartInit3 | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<number>(WebSocket.CLOSED);
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const closedByUserRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);

  // ✅ Key để reconnect khi symbol/broker/baseUrl đổi
  const connKey = useMemo(() => {
    if (!params) return "";
    const symbol = normSymbol(params.activeTab);
    const broker_ = normBroker(params.activeBrokerChart);
    const baseUrl = String(params.baseUrl || "").trim();
    if (!symbol || !broker_ || !baseUrl) return "";
    return `${baseUrl}|${symbol}|${broker_}`;
  }, [params]);

  function cleanup() {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const ws = wsRef.current;
    wsRef.current = null;

    if (ws) {
      try {
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
      } catch {}
    }

    setConnected(false);
    setWsState(WebSocket.CLOSED);
  }

  useEffect(() => {
    // ✅ params null hoặc connKey rỗng => đóng WS + reset state
    if (!params || !connKey) {
      closedByUserRef.current = true;
      cleanup();
      setData(null);
      setError(null);
      return;
    }

    closedByUserRef.current = false;
    setError(null);

    const { baseUrl, activeTab, activeBrokerChart } = params;
    const symbol = normSymbol(activeTab);
    const broker_ = normBroker(activeBrokerChart);

    const url = `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(
      symbol
    )}?broker=${encodeURIComponent(broker_)}`;

    // ✅ đóng cái cũ nếu có
    cleanup();

    // ✅ mở mới
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e: any) {
      setError(e?.message || "WebSocket init failed");
      return;
    }

    wsRef.current = ws;
    setWsState(ws.readyState);

    ws.onopen = () => {
      setConnected(true);
      setWsState(WebSocket.OPEN);
      setError(null);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);

        // Server bạn đang gửi đúng dạng CHART_INIT_3
        if (msg && msg.type === "CHART_INIT_3") {
          setData(msg as ChartInit3);
          return;
        }

        // Nếu server đôi lúc gửi lỗi
        if (msg && msg.type === "ERROR") {
          setError(msg.message || "WS ERROR");
          return;
        }

        // ignore message khác
      } catch (e: any) {
        // dữ liệu không phải JSON
        // bạn có thể setError ở đây nếu muốn
      }
    };

    ws.onerror = () => {
      // onclose sẽ chạy sau
      setWsState(ws.readyState);
    };

    ws.onclose = () => {
      setConnected(false);
      setWsState(WebSocket.CLOSED);

      if (closedByUserRef.current) return;

      // ✅ auto reconnect (nhẹ)
      const next = reconnectCount + 1;
      setReconnectCount(next);

      // backoff 250ms -> 2s
      const delay = Math.min(2000, 250 + next * 150);

      reconnectTimerRef.current = window.setTimeout(() => {
        // trigger reconnect bằng cách “đổi state” gián tiếp: chạy lại effect do connKey không đổi?
        // => ta tự tạo lại bằng cách gọi cleanup + new WS bằng cách setReconnectCount đã thay đổi
        // easiest: chỉ cần “touch” setReconnectCount là đủ vì effect phụ thuộc connKey thôi,
        // nên ở đây ta đóng/mở lại trực tiếp:
        if (!wsRef.current && !closedByUserRef.current) {
          // gọi lại bằng cách tạo WS mới thủ công:
          try {
            const ws2 = new WebSocket(url);
            wsRef.current = ws2;
            setWsState(ws2.readyState);

            ws2.onopen = ws.onopen!;
            ws2.onmessage = ws.onmessage!;
            ws2.onerror = ws.onerror!;
            ws2.onclose = ws.onclose!;
          } catch (e: any) {
            setError(e?.message || "Reconnect failed");
          }
        }
      }, delay);
    };

    // cleanup khi đổi connKey / unmount
    return () => {
      closedByUserRef.current = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connKey]);

  return { data, connected, error, wsState, reconnectCount };
}
