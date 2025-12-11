import { useEffect, useRef, useState, useCallback } from 'react';

type WSOptions = {
  autoConnect?: boolean;     // tự connect khi mount
  autoReconnect?: boolean;   // tự reconnect khi rớt
  reconnectDelay?: number;   // ms
  debug?: boolean;
};

export function useWebSocketAnalysis(
  url: string = 'ws://116.105.227.149:2003/analysis',
  {
    autoConnect = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    debug = false,
  }: WSOptions = {}
) {
  const [connected_analysis, setConnected] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null); // browser: number
  const shouldReconnectRef = useRef<boolean>(autoReconnect); // kiểm soát reconnect
  const closingManuallyRef = useRef<boolean>(false);         // đánh dấu đóng tay
  const isDisconnectingRef = useRef(false);

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const log = (...args: any[]) => {
    if (debug) console.log('[WS]', ...args);
  };

  const connect_analysis = useCallback(() => {
    // Đừng tạo thêm nếu đang mở hoặc đang kết nối
    if (wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
         wsRef.current.readyState === WebSocket.CONNECTING)) {
      // log('skip connect: already OPEN/CONNECTING');
      return;
    }

    closingManuallyRef.current = false;     // reset cờ đóng tay
    shouldReconnectRef.current = autoReconnect; // cập nhật theo option hiện tại
    clearReconnectTimer();

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      log('✅ Connected to', url);
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          setAnalysis(data);
        }
      } catch (e) {
        // bỏ qua message không phải JSON
      }
    };

    ws.onclose = (evt) => {
      setConnected(false);

      log('❌ Disconnected', evt.code, evt.reason || '');

      // Nếu đóng tay -> không reconnectß
      if (closingManuallyRef.current) {
        log('closed manually -> no reconnect');
        return;
      }

      // Nếu tắt autoReconnect -> không reconnect
      if (!shouldReconnectRef.current) {
        log('autoReconnect disabled -> no reconnect');
        return;
      }

      // Tránh tạo nhiều timer
      clearReconnectTimer();
      reconnectTimerRef.current = window.setTimeout(() => {
        log('reconnecting...');
        connect_analysis();
      }, reconnectDelay);
    };

    ws.onerror = (err) => {
      log('⚠️ WebSocket error:', err);
      // để onclose xử lý chu kỳ reconnect
      ws.close();
    };
  }, [url, autoReconnect, reconnectDelay, debug]);

  const disconnect_analysis = useCallback(() => {
  // Chặn spam: nếu đã CLOSED/không có socket hoặc đang đóng thì bỏ qua
  const rs = wsRef.current?.readyState;
  if (!wsRef.current || rs === WebSocket.CLOSED || isDisconnectingRef.current) {
    log('skip disconnect: no socket / already CLOSED / in-progress');
    shouldReconnectRef.current = false;
    closingManuallyRef.current = true;
    clearReconnectTimer();
    setConnected(false);
    return;
  }

  log('🛑 Manual disconnect');
  isDisconnectingRef.current = true;
  shouldReconnectRef.current = false;
  closingManuallyRef.current = true;

  clearReconnectTimer();

  try {
    wsRef.current.close(1000, 'Manual disconnect');
  } catch {}

  wsRef.current = null;
  setConnected(false);
  // đánh dấu xong sau 1 tick để tránh race khi onclose chạy
  setTimeout(() => (isDisconnectingRef.current = false), 0);
}, [debug]);

  // Tự connect khi mount nếu autoConnect=true
  useEffect(() => {
    if (autoConnect) connect_analysis();
    return () => {
      // cleanup khi unmount
      disconnect_analysis();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, autoConnect, connect_analysis, disconnect_analysis]);

  const readyState =
    wsRef.current?.readyState ?? WebSocket.CLOSED; // 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED

  return { analysis, connected_analysis, readyState, connect_analysis, disconnect_analysis };
}
