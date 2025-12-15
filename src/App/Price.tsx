import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Badge,
  Button,
  Modal,
  Space,
  Tag,
  Tooltip,
  Alert,
  Progress,
  Row,
  InputNumber,
  Form,
  AutoComplete,
} from "antd";

import Marquee from 'react-fast-marquee';



import HistoryModal from '../Components/modal/modal.history';
import AccountModal from '../Components/modal/modal.manager';
import DualExchangeChartModal from '../Components/modal/modal.chart';
import TripleExchangeChartModal from '../Components/modal/modal.chartV2';
import ImpactBadge from '../Components/Alert/Alert_News';



import { RefreshCcw, Trash2 } from "lucide-react";

import SpreadManagementModal from '../Components/modal/modal.configSpread';

import {
  Pagination,
  Spin,
  Layout,
  Input,
  Card,
  Col,
  TimePicker,
  Select,
} from "antd";
import { ClockCircleOutlined} from "@ant-design/icons";
import { ReloadOutlined, DeleteOutlined } from "@ant-design/icons";
import { green, red } from "@ant-design/colors";
import { calculatePercentage , formatSecondsToTime ,formatNewsMessage } from "../Helpers/text";
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import AutocompleteSearch from "../Components/Autocomplete";
import type { TableProps } from "antd";
import { Table, Drawer, message } from "antd";

//Icon
import { BidPriceIcon, LongCandleIcon } from "../Helpers/icon";

//Helpers
import {
  numberFmt,
  parseDotDate,
  BrokerRow,
  freshnessColor,
} from "../Helpers/type.table";

//WebSocket
import { useWebSocketAnalysis } from "../Hooks/ws.analysis";
import { useWebSocketBrokers } from "../Hooks/ws.brokers";
import { useWebSocketBrokerInfo } from "../Hooks/ws.broker.info";
import { useWebSocketSymbols } from "../Hooks/ws.symbol.brokers";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const audio = new Audio("/sound/alert.wav");
type ViewMode = "grid" | "list";

type Theme = {
  bg: string;
  subHeaderBg: string;
  headerGradient: string;
  panelBg: string;
  cardBg: string;
  cardHoverBg: string;
  rowEven: string;
  rowOdd: string;
  rowHover: string;
  border: string;
  inputBg: string;
  text: string;
  muted: string;
  title: string;
  btnNeutral: string;
  btnNeutralHover: string;
  tabBg: string;
  accentPurple: string;
  accentPurpleGradient: string;
  accentIndigo: string;
  accentIndigoGradient: string;
  accentYellow: string;
  accentYellowBorder: string;
};

const DARK: Theme = {
  bg: "#0a0e27",
  subHeaderBg: "#16213e",
  headerGradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  panelBg: "rgba(30, 41, 59, 0.5)",
  cardBg: "rgba(30, 41, 59, 0.6)",
  cardHoverBg: "rgba(51, 65, 85, 0.8)",
  rowEven: "rgba(30, 41, 59, 0.5)",
  rowOdd: "rgba(30, 41, 59, 0.3)",
  rowHover: "rgba(51, 65, 85, 0.7)",
  border: "#334155",
  inputBg: "#0f172a",
  text: "#f3f4f6",
  muted: "#94a3b8",
  title: "#f3f4f6",
  btnNeutral: "#334155",
  btnNeutralHover: "#475569",
  tabBg: "#1e293b",
  accentPurple: "#34d399",
  accentPurpleGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  accentIndigo: "#10b981",
  accentIndigoGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  accentYellow: "#fbbf24",
  accentYellowBorder: "#f59e0b",
};

const LIGHT: Theme = {
  bg: "#f5f7fb",
  subHeaderBg: "#ffffff",
  headerGradient: "linear-gradient(135deg, #e9eef7 0%, #dfe7ff 100%)",
  panelBg: "#ffffff",
  cardBg: "#ffffff",
  cardHoverBg: "#f3f6ff",
  rowEven: "#ffffff",
  rowOdd: "#f9fbff",
  rowHover: "#eef3ff",
  border: "#e5e7eb",
  inputBg: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  title: "#0f172a",
  btnNeutral: "#eef2f7",
  btnNeutralHover: "#e3e8ef",
  tabBg: "#eef2f7",
  accentPurple: "#059669",
  accentPurpleGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  accentIndigo: "#059669",
  accentIndigoGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  accentYellow: "#b45309",
  accentYellowBorder: "#f59e0b",
};

type PriceProps = {
  isDark?: boolean;
};

const Price: React.FC<PriceProps> = ({ isDark }) => {
  useEffect(() => {
    // ✅ Thay đổi title động
    document.title = "Price Delay - Dashboard";
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
const [roleUser, setRoleUser] = useState(localStorage.getItem("role") || "");
const [alert, setAlert] = useState(false);
const [alert_, setAlert_] = useState(false); 
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");

  const [activeBroker, setActiveBroker] = useState("");
  const [activeBrokerChart, setActiveBrokerChart] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [url_ws_brokerinfo, setUrlWsBrokerInfo] = useState("");
  const [dataBrokerInfo, setDataBrokerInfo] = useState<any>([]);
  const [nameDrawer, setNameDrawer] = useState("Broker Không Tồn Tại");
  const [messageApi, contextHolder] = message.useMessage();
  //Modal
  const [openModalInfo, setOpenModalInfo] = useState(true);
  const [openModalBrokerInfo, setOpenModalBrokerInfo] = useState(false);
  const [modalOpenSymbol, setModalOpenSymbol] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);
  const [modalDisconnect, setModalDisconnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [modalHistory, setModalHistory] = useState(false);
  const [modalSpreadConfig, setModalSpreadConfig] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  // const [chartData, setChartData] = useState<any | null>(null);

  const [form_Add_Symbol, setForm_Add_Symbol] = useState(false);
  const [button_Add_Form_Symbol, setButton_Add_Form_Symbol] = useState("Thêm Mới");
  const [form_] = Form.useForm();
  const [form_spread] = Form.useForm();
  const [modal_Symbol, setModal_Symbol] = useState(false);
  const [spreadPlus, setSpreadPlus] = useState(1);
  const [form_update_Symbol, setForm_update_Symbol] = useState(false);
  const [form] = Form.useForm();
  const [symbol_config, setSymbol_config] = useState([]);
  const [brokerCheck, setbrokerCheck] = useState("");
  const [broker_actived, setbrokerActived] = useState("");
  const [symbol, setSymbol] = useState<any[]>([]);
  const [timeAnalysis, setTimeAnalysis] = useState("");
  const [highNews , setHighNews] = useState([]);
  const [typeHighNews , setTypeHighNews] = useState('high');
  const [time_soon, setTime_soon] = useState(2);
  //Pagination
  const [pageSize_BrokerInfo, setPageSize_BrokerInfo] = useState(10);


  //data chart

const [chartData, setChartData] = useState<{
  symbol: string;
  timeframe: string;
  exchange1: any;
  exchange2: any;
  exchange3: any;
  exchange1Bid?: number;
  exchange1Ask?: number;
  exchange2Bid?: number;
  exchange2Ask?: number;
  exchange3Bid?: number;
  exchange3Ask?: number;
  exchange1Digits?: number;
  exchange2Digits?: number;
  exchange3Digits?: number;
} | null>(null);

// 2️⃣ Realtime tick – thay đổi liên tục
const [ticks, setTicks] = useState({
  ex1Bid: 0,
  ex1Ask: 0,
  ex2Bid: 0,
  ex2Ask: 0,
});



 const chartData_Example = {
    symbol: "EURUSD",
    timeframe: "1H",
    exchange1: {
      name: "Broker 1",
      color: "#F0B90B",
      data: [
        { time: "14:00", high: 1.0850, low: 1.0620, open: 1.0890, close: 1.0845 },
        { time: "15:00", high: 1.0870, low: 1.0840, open: 1.0845, close: 1.0865 },
        { time: "16:00", high: 1.0885, low: 1.0855, open: 1.0865, close: 1.0870 },
        { time: "17:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "18:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "19:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "20:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "21:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "22:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "23:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
      ]
    },
    exchange2: {
      name: "Broker 2",
      color: "#5741D9",
      data: [
        { time: "14:00", high: 1.0855, low: 1.0815, open: 1.0825, close: 1.0840 },
        { time: "15:00", high: 1.0875, low: 1.0835, open: 1.0840, close: 1.0870 },
        { time: "16:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0875 },
        { time: "17:00", high: 1.0895, low: 1.0865, open: 1.0875, close: 1.0885 },
        { time: "18:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "19:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "20:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "21:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "22:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "23:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
      ]
    },
    exchange3: {
      name: "Broker 3",
      color: "#10B981",
      data: [
        { time: "14:00", high: 1.0855, low: 1.0815, open: 1.0825, close: 1.0840 },
        { time: "15:00", high: 1.0875, low: 1.0835, open: 1.0840, close: 1.0870 },
        { time: "16:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0875 },
        { time: "17:00", high: 1.0895, low: 1.0865, open: 1.0875, close: 1.0885 },
        { time: "18:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "19:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "20:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "21:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "22:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
        { time: "23:00", high: 1.0890, low: 1.0860, open: 1.0870, close: 1.0880 },
      ]
    },
  }


  

 

const handleCancelModalInfo = async () => {
  setOpenModalInfo(false);
  setActiveBroker("");

  if (audioRef.current && !alert_) {
    try {
      // Tắt tiếng
      audioRef.current.volume = 0;

      // Play để unlock
      await audioRef.current.play();

      // Ngừng audio ngay sau khi unlock
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // Bật lại volume bình thường
      audioRef.current.volume = 1;

      setAlert_(true);
      console.log("🔓 Audio unlocked (silent)");
    } catch (err) {
      console.error("Unlock audio error:", err);
    }
  }
};

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapOHLC(ohlc: any[]) {
  const arr = Array.isArray(ohlc) ? ohlc : [];

  const normalized = arr
    .slice(0, 10)
    .sort((a, b) => String(a.time).localeCompare(String(b.time))); // "16:06" -> "16:15"

  return normalized.map((c) => ({
    time: String(c.time),
    open: toNum(c.open),
    high: toNum(c.high),
    low: toNum(c.low),
    close: toNum(c.close),
  }));
}

function buildChartDataFromAB(payload: any, chartData_Example: any) {
  const A = payload?.A;
  const B = payload?.B;

  const aData = mapOHLC(A?.ohlc);
  const bData = mapOHLC(B?.ohlc);

  return {
    symbol: A?.symbol || B?.symbol || chartData_Example.symbol || "UNKNOWN",
    timeframe: A?.timeframe || B?.timeframe || chartData_Example.timeframe || "1M",

    exchange1: {
      name: A?.Broker || "Broker A",
      color: "#F0B90B",
      data: aData.length ? aData : bData || chartData_Example.exchange1.data,
    },

    exchange2: {
      name: B?.Broker || "Broker B",
      color: "#5741D9",
      data: bData.length ? bData : aData || chartData_Example.exchange2.data,
    },
    exchange3: {
      name: A?.Broker + " & "+ B?.Broker || "Broker C",
      color: "#10B981",
      data: bData.length ? bData : chartData_Example.exchange3.data,
    },

    exchange1Bid: toNum(A?.bid),
    exchange1Ask: toNum(A?.ask),
    exchange2Bid: toNum(B?.bid),
    exchange2Ask: toNum(B?.ask),
    exchange3Bid: toNum(A?.bid_mdf),
    exchange3Ask: toNum(A?.ask_mdf),
    exchange1Digits: toNum(A?.digit),
    exchange2Digits: toNum(B?.digit),
    exchange3Digits: toNum(A?.digit),
  };
}



 useEffect(() => {
  audioRef.current = new Audio("/sound/alert.wav");
  audioRef.current.load();
}, []);

// ✅ parse "02:00pm" | "2:00 pm" | "14:45" | "14:45:00" => phút trong ngày
const parseTimeLabelToMinutes = (timeLabel: string): number | null => {
  if (!timeLabel) return null;

  const raw = String(timeLabel).trim().toLowerCase();

  // 1) 12h: 02:00pm / 2:00 pm
  const t12 = raw.replace(/\s+/g, "");
  const m12 = t12.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
  if (m12) {
    let hh = parseInt(m12[1], 10);
    const mm = parseInt(m12[2], 10);
    const ap = m12[3];

    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;

    if (ap === "am") hh = hh === 12 ? 0 : hh;
    if (ap === "pm") hh = hh === 12 ? 12 : hh + 12;

    return hh * 60 + mm;
  }

  // 2) 24h: 14:45 hoặc 14:45:00
  const m24 = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m24) {
    const hh = parseInt(m24[1], 10);
    const mm = parseInt(m24[2], 10);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  return null;
};

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const getToneByTime = (timeLabel: string, soonWindowMin = 30) => {
  const eventMin = parseTimeLabelToMinutes(timeLabel);
  if (eventMin == null) return "default" as const;

  const now = nowMinutes();
  let diff = eventMin - now;

  // ✅ rollover: ví dụ 23:50 -> 00:10 (diff = -1420) => +1440
  if (diff < -720) diff += 1440;

  if (diff < 0) return "past" as const;
  if (diff <= soonWindowMin) return "now" as const;
  return "default" as const;
};


const filteredNews = highNews.filter((item: any) => {
  return getToneByTime(item.timeLabel, time_soon) !== "past";
});

const groupNewsByMinute = (news: any[]) => {
  const map = new Map<string, any[]>();

  news.forEach((item) => {
    const key = String(item.timeLabel || "").trim();
    if (!key) return;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });

  return Array.from(map.entries()).map(([timeLabel, items]) => {
    const impact =
      items.some((i) => String(i.impactName).toLowerCase() === "high")
        ? "high"
        : items.some((i) => String(i.impactName).toLowerCase() === "medium")
        ? "medium"
        : items.some((i) => String(i.impactName).toLowerCase() === "low")
        ? "low"
        : "unknown";

    return { timeLabel, items, impact };
  });
};


const groupedNews = groupNewsByMinute(filteredNews);


  let IP_Server = "116.105.227.149";
const HandleGetNews = async () => {
  try {
    const response = await axios.get(`${`http://${IP_Server}:5000`}/v1/api/admin/forex-news/impact/${typeHighNews}`);
  return response.data;
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
  
};

  useEffect(() => {
    HandleGetNews().then((data) => {
      console.log("Forex News High Impact:",(data.data));
      setHighNews((data.data));
    });
  }, []);

  const {
    analysis,
    connected_analysis,
    connect_analysis,
    disconnect_analysis,
  } = useWebSocketAnalysis(`ws://${IP_Server}:8003`, {
    autoConnect: true,
    autoReconnect: true,
    debug: true,
  });

  useEffect(() => {
    if (connected_analysis) {
      setIsConnected(true);
    }
  }, [connected_analysis]);

  const symbolSig = useMemo(() => {
  const arr = analysis?.symbols || [];
  // signature rẻ: length + first/last (đủ để hạn chế spam)
  const first = arr?.[0]?.symbol ?? arr?.[0] ?? "";
  const last = arr?.[arr.length - 1]?.symbol ?? arr?.[arr.length - 1] ?? "";
  return `${arr.length}|${first}|${last}`;
}, [analysis?.symbols]);

useEffect(() => {
  setSymbol(Array.isArray(analysis?.symbols) ? analysis!.symbols : []);
}, [symbolSig]);

  useEffect(() => {
  setTimeAnalysis(analysis?.timeAnalysis || "Disconnect");
}, [analysis?.timeAnalysis]);


// The symbol connect/disconnect effect was moved below (after the useWebSocketSymbols
// declaration) to avoid referencing block-scoped variables before they are defined.

  const { brokers, connected_brokers, connect_Brokers, disconnect_Brokers } =
    useWebSocketBrokers(`ws://${IP_Server}:8001`, {
      autoConnect: false,
      autoReconnect: false,
      debug: true,
    });

  const {
    brokerInfo,
    connected_brokerInfo,
    connect_BrokerInfo,
    disconnect_BrokerInfo,
  } = useWebSocketBrokerInfo(url_ws_brokerinfo, {
    autoConnect: false,
    autoReconnect: false,
    debug: true,
  });

  const { symbols, connected_symbols, connect_symbols, disconnect_symbols } =
    useWebSocketSymbols(`ws://${IP_Server}:8000/${activeTab}`, {
      autoConnect: false,
      autoReconnect: false,
      debug: true,
    });

  

  useEffect(() => {
    if (!connected_analysis && isConnected) {
      console.log("📊 Server Disconnect");
      setModalDisconnect(true);
    } else {
      console.log("📊 Server Connected");
    }
  }, [connected_analysis]);

  // 🔥 Responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onClose = () => {
    setOpenModalBrokerInfo(false);
  };

  // Responsive columns for broker table
  const columns: TableProps["columns"] = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      render: (text, record) => <a>{record.index}</a>,
      sorter: (a, b) => a.broker.localeCompare(b.broker),
      width: isMobile ? 50 : 60,
    },
    {
      title: "Broker",
      dataIndex: "broker",
      key: "broker",
      render: (text, record) => (
        <Space size={6}>
          <Badge status="processing" />
          <a onClick={() => console.log("Open broker:", record.broker)}>
            {text}
          </a>
        </Space>
      ),
      sorter: (a, b) => a.broker.localeCompare(b.broker),
      fixed: isMobile ? undefined : "left",
    },
    {
      title: "Type",
      dataIndex: "typeaccount",
      key: "typeaccount",
      render: (text, record: any) => (
        <div style={{ textAlign: "center" }}>
          <a
            onClick={() =>
              console.log("Open type account:", record.typeaccount)
            }
          >
            {text}
          </a>
        </div>
      ),
      sorter: (a: any, b: any) => a.typeaccount.localeCompare(b.typeaccount),
      fixed: isMobile ? undefined : "left",
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (v) => (
        <div style={{ textAlign: "center" }}>
          <Tag color="cyan">v{v}</Tag>
        </div>
      ),
      width: isMobile ? 80 : 100,
      align: "center" as const,
    },
    {
      title: "Port",
      dataIndex: "port",
      key: "port",
      align: "center" as const,
      width: isMobile ? 70 : 90,
      render: (v) => (
        <div style={{ textAlign: "center" }}>
          <Tag color="geekblue">{v}</Tag>
        </div>
      ),
      sorter: (a, b) => Number(a.port) - Number(b.port),
    },
    {
      title: "Symbols",
      key: "symbols",
      align: "right" as const,
      width: isMobile ? 50 : 80,
      render: (_, r) => (
        <div style={{ textAlign: "center" }}>
          <Tooltip title={`Market Watch`}>
            <Tag
              style={{ cursor: "pointer" }}
              color="tomato"
              onClick={() => {
                setNameDrawer(r.broker);
                setUrlWsBrokerInfo(`ws://${IP_Server}:8002/${r.broker_}`);
                handleClickInfo_Broker();
                setbrokerActived(r.broker_);
              }}
            >
              {numberFmt(r.totalsymbol)}
            </Tag>
          </Tooltip>
        </div>
      ),
      sorter: (a, b) => a.totalsymbol - b.totalsymbol,
    },
    {
      title: "Status",
      key: "status",
      align: "center" as const,
      width: isMobile ? 100 : 140,
      render: (_, r) => (
        <div style={{ textAlign: "center" }}>
          <Tag
            style={{ width: isMobile ? 80 : 140, textAlign: "center" }}
            color={
              r.status === "True"
                ? "green"
                : r.status === "Disconnect"
                ? "red"
                : "orange"
            }
          >
            {r.status === "True" ? (
              "Connected"
            ) : r.status === "Disconnect" ? (
              "Disconnect"
            ) : (
              <Tooltip title={r.status}>
                <Progress
                  size="small"
                  percent={Number(calculatePercentage(r.status))}
                  steps={20}
                  strokeColor={[red[5], red[5], green[5]]}
                />
              </Tooltip>
            )}
          </Tag>
        </div>
      ),
      sorter: (a, b) => a.symbolCount - b.symbolCount,
    },
    {
      title: "Time Now",
      dataIndex: "timecurent",
      key: "timecurent",
      render: (t: any) => (
        <Tooltip title={t}>
          <span>{t?.replace(".", "/").replace(".", "/")}</span>
        </Tooltip>
      ),
      width: 180,
    },
    ...(isMobile
      ? []
      : [
          {
            title: "Last Updated",
            dataIndex: "timeUpdated",
            key: "timeUpdated",
            render: (t: any) => {
              const d = parseDotDate(t);
              const color = freshnessColor(t);
              return (
                <Space>
                  <Tooltip title={t}>
                    <span>{d ? d.toLocaleString() : t}</span>
                  </Tooltip>
                </Space>
              );
            },
            sorter: (a: any, b: any) => {
              const da = parseDotDate(a.timeUpdated)?.getTime() ?? 0;
              const db = parseDotDate(b.timeUpdated)?.getTime() ?? 0;
              return da - db;
            },
            width: 220,
          },
        ]),
    {
  title: "Action",
  key: "action",
  fixed: isMobile ? undefined : "right",
  render: (_, record) => (
    <Space size="middle" direction={isMobile ? "vertical" : "horizontal"}>
      <Tooltip title="Đồng Bộ Giá Broker">
        <Button
     type="primary"
     style={{width:50}}
  icon={<RefreshCcw size={16} />}
  size={isMobile ? "small" : "middle"}
  disabled={record.index === "0" || record.status !== "True"}
    onClick={async () => {
      try {
        const AccessToken = localStorage.getItem("accessToken") || "";
        const resp: any = await axios.get(
          `http://${IP_Server}:5000/v1/api/${record.broker_}/all/reset`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${AccessToken}`,
            },
            timeout: 10000,
          }
        );
        console.log("Reset broker response:", resp);
        if (resp?.data.code === 1) {
          messageApi.open({
            type: "success",
            content: `Gửi Reset Broker: ${record.broker} thành công!`,
          });
        } else {
          messageApi.open({
            type: "error",
            content: `Gửi yêu cầu Reset Broker: ${record.broker} thất bại! , ${resp?.data.mess}`,
          });
        }
      } catch (error: any) {
        console.log("Error resetting broker:", error.message);
        messageApi.open({
          type: "error",
          content: error.message,
        });
        handleLogout();
      }
    }}
  >
  </Button>
      </Tooltip>
  
  <Tooltip title="Xóa Broker">
    <Button
    type="default"
  icon={<Trash2 size={16} />}
  disabled={record.status !== "True"}
  danger
  size={isMobile ? "small" : "middle"}
  style={{width:50}}
    onClick={async () => {
      try {
        const AccessToken = localStorage.getItem("accessToken") || "";
        const resp: any = await axios.get(
          `http://${IP_Server}:5000/v1/api/${record.broker_}/destroy`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${AccessToken}`,
            },
            timeout: 10000,
          }
        );
        console.log("Reset broker response:", resp);
        if (resp?.data.code === 1) {
          messageApi.open({
            type: "success",
            content: `Gửi Reset Broker: ${record.broker} thành công!`,
          });
        } else {
          messageApi.open({
            type: "error",
            content: `Gửi yêu cầu Reset Broker: ${record.broker} thất bại! , ${resp?.data.mess}`,
          });
        }
      } catch (error: any) {
        console.log("Error resetting broker:", error.message);
        messageApi.open({
          type: "error",
          content: error.message,
        });
        handleLogout();
      }
    }}
  >
  </Button>
  </Tooltip>
  
</Space>
  ),
  width: isMobile ? 80 : 140,
},
  ];

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    navigate("/login");
  };

  function pickBrokerPair(Data: any[], brokerAName: string) {
  if (!Array.isArray(Data) || Data.length === 0) return null;

  const brokerA = Data.find(
    (item) => item.Broker === brokerAName
  );

  const brokerB = Data[0]; // mặc định Data[0]

  if (!brokerA || !brokerB) return null;

  return {
    A: brokerA,
    B: brokerB,
  };
}

  const columns_symbols: TableProps["columns"] = [
    {
      title: "STT",
      dataIndex: "Index",
      key: "Index",
      render: (text: any, record: any) => <a>{record.Index}</a>,
      fixed: isMobile ? undefined : "left",
      width: isMobile ? 50 : 60,
    },
    {
      title: "Broker",
      dataIndex: "Broker",
      key: "Broker",
      render: (text: any, record: any) => (
        <div
          style={{
            color: "#a00101",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 900,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: isMobile ? "2px 4px" : "4px 8px",
            borderRadius: "4px",
          }}
        >
            {activeBroker === record.Broker ? (
              <Tag color="green">{text}</Tag>
            ) : (
              <span>{text}</span>
            )}
        </div>
      ),
      sorter: (a: any, b: any) => a.Broker.localeCompare(b.Broker),
      fixed: isMobile ? undefined : "left",
    },
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      render: (text: any, record: any) => (
        <div
          style={{
            color: "#aa05b9",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: isMobile ? "2px 4px" : "4px 8px",
            borderRadius: "4px",
          }}
        >
          <Tooltip
            title={
              record.symbol_raw !== record.symbol
                ? `Raw: ${record.symbol_raw}`
                : `Raw: ${record.symbol_raw}`
            }
          >
            <span>{text}</span>
          </Tooltip>
        </div>
      ),
      sorter: (a: any, b: any) => a.bid.localeCompare(b.bid),
      fixed: isMobile ? undefined : "left",
    },
    {
      title: "Bid",
      dataIndex: "bid",
      key: "bid",
      width: isMobile ? 50 : 120,
      render: (text: any) => (
        <div
          style={{
            color: "#d90606",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.bid) - Number(b.bid),
    },
    {
      title: "Bid Fix",
      dataIndex: "bid_mdf",
      key: "bid_mdf",
      width: isMobile ? 50 : 120,
      render: (text: any) => (
        <div
          style={{
            color: "#d90606",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.bid_mdf) - Number(b.bid_mdf),
    },
    {
      title: "Ask",
      dataIndex: "ask",
      key: "ask",
      width: isMobile ? 50 : 120,
      render: (text: any) => (
        <div
          style={{
            color: "#066098",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.ask) - Number(b.ask),
    },
    {
      title: "Ask Fix",
      dataIndex: "ask_mdf",
      key: "ask_mdf",
      width: isMobile ? 50 : 120,
      render: (text: any) => (
        <div
          style={{
            color: "#058569",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.ask_mdf) - Number(b.ask_mdf),
    },
    {
      title: "Spread",
      dataIndex: "spread_mdf",
      key: "spread_mdf",
      render: (text: any) => (
        <div
          style={{
            color: "#065ed9",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.spread_mdf) - Number(b.spread_mdf),
    },
    {
      title: "Time Delay",
      dataIndex: "timedelay",
      key: "timedelay",
      render: (text: any) => (
        <div
          style={{
            color: Number(text) < 0 ? "#ff4d4f" : "#52c41a",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.timedelay) - Number(b.timedelay),
    },
    {
      title: "Long Candle",
      dataIndex: "longcandle",
      key: "longcandle",
      render: (text: any) => (
        <div
          style={{
            display: "flex", // ✅ Flexbox
            alignItems: "center", // ✅ Vertical center
            justifyContent: "center", // ✅ Horizontal center
            gap: "2px", // ✅ Spacing giữa icon và text
          }}
        >
          <LongCandleIcon size={14} color="#06c7d9" />
          <span
            style={{
              color: "#d90653",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1, // ✅ Remove extra line height
            }}
          >
            {text} - Point
          </span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.longcandle) - Number(b.longcandle),
      align: "center" as const,
    },
    {
      title: "Time Cr",
      dataIndex: "timeCrr",
      key: "timeCrr",
      render: (text: any, record: any) => {
        const sessions = Array.isArray(record.timetrade)
          ? record.timetrade
          : [];
        const hasActiveSessions = sessions.some(
          (s: any) => String(s?.status || "").toLowerCase() === "true"
        );

        const tooltipContent = (
          <div style={{ lineHeight: 1.8, minWidth: 250 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "13px",
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>📊 Trading Sessions</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: hasActiveSessions ? "#10b981" : "#6b7280",
                  color: "#fff",
                }}
              >
                {sessions.length}
              </span>
            </div>
            {sessions.length > 0 ? (
              sessions.map((s: any, idx: number) => {
                const isActive =
                  String(s?.status || "").toLowerCase() === "true";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      marginBottom: 4,
                      borderRadius: 4,
                      background: isActive
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(100, 116, 139, 0.1)",
                    }}
                  >
                    <Badge status={isActive ? "success" : "default"} />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#10b981" : "#94a3b8",
                        flex: 1,
                      }}
                    >
                      {s?.open || "N/A"} - {s?.close || "N/A"}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "#10b981",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "12px",
                  color: "#9ca3af",
                  fontSize: "12px",
                }}
              >
                No sessions configured
              </div>
            )}
          </div>
        );

        return (
          <Tooltip
            title={tooltipContent}
            placement="topLeft"
            overlayStyle={{ maxWidth: 400 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#065ed9",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 4,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(6, 94, 217, 0.1)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span>{text}</span>
              {sessions.length > 0 && (
                <Badge
                  count={sessions.length}
                  style={{
                    backgroundColor: hasActiveSessions ? "#10b981" : "#6b7280",
                    fontSize: "10px",
                  }}
                />
              )}
            </div>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => Number(a.timeCrr) - Number(b.timeCrr),
      align: "center" as const,
    },
    {
      title: "Last Reset",
      dataIndex: "last_reset",
      key: "last_reset",
      render: (text: any) => (
        <div
          style={{
            color: "#065ed9",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.last_reset) - Number(b.last_reset),
    },
    {
  title: "Action",
  key: "action",
  fixed: isMobile ? undefined : "right",
  render: (_, record) => (
    <Space size="small" direction={isMobile ? "vertical" : "horizontal"}>
      {record.Status === "True" ? (
        <Button
          icon={<RefreshCcw size={16} />}
          style={{width:50}}
          type="primary"
          size="small"
          onClick={async () => {
            try {
              const AccessToken = localStorage.getItem("accessToken") || "";
              const resp: any = await axios.get(
                `http://${IP_Server}:5000/v1/api/${record.Broker_}/${record.symbol}/reset`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `${AccessToken}`,
                  },
                  timeout: 10000,
                }
              );
              if (resp?.data.code === 1) {
                messageApi.open({
                  type: "success",
                  content: `Send Reset ${record.symbol} -> ${record.Broker} thành công!`,
                });
              } else {
                messageApi.open({
                  type: "error",
                  content: `Gửi yêu cầu Reset ${record.symbol} cho broker ${record.Broker} thất bại!`,
                });
              }
            } catch (error) {
              messageApi.open({
                type: "error",
                content: (error as Error).message,
              });
              handleLogout();
            }
          }}
        >
        </Button>
        
      ) : record.Status === "Disconnect" ? (
        "Disconnect"
      ) : (
        <Tooltip title={record.Status}>
          <Progress
            size="small"
            percent={Number(calculatePercentage(record.Status))}
            steps={20}
            strokeColor={[red[5], red[5], green[5]]}
          />
        </Tooltip>
      )}
      <Button
        type="primary"
        size="small"
        danger
        disabled={record.Auto_Trade !== "true"}
        onClick={async () => {
          try {
            const AccessToken = localStorage.getItem("accessToken") || "";
            const Key_SECRET = localStorage.getItem("id_SECRET") || "";
            const Symbol = record.symbol;
            const Broker_ = record.Broker_;
            const Price = record.bid;
            const resp: any = await axios.get(
              `http://${IP_Server}:5000/v1/api/${Symbol}/${Broker_}/SELL/${Price}/${Key_SECRET}/order`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `${AccessToken}`,
                },
                timeout: 10000,
              }
            );
            if (resp?.data.code === 1) {
              messageApi.open({
                type: "success",
                content: `Send SELL ${record.symbol} -> ${record.Broker} thành công!`,
              });
            } else {
              messageApi.open({
                type: "error",
                content: `Gửi yêu cầu SELL ${record.symbol} cho broker ${record.Broker} thất bại!`,
              });
            }
          } catch (error) {
            messageApi.open({
              type: "error",
              content: (error as Error).message,
            });
            handleLogout();
          }
        }}
      >
        {isMobile ? "SELL" : "SELL"}
      </Button>
      <Button
        type="primary"
        size="small"
        disabled={record.Auto_Trade !== "true"}
        onClick={async () => {
          try {
            const AccessToken = localStorage.getItem("accessToken") || "";
            const Key_SECRET = localStorage.getItem("id_SECRET") || "";
            const Symbol = record.symbol;
            const Broker_ = record.Broker_;
            const Price = record.ask;
            const resp: any = await axios.get(
              `http://${IP_Server}:5000/v1/api/${Symbol}/${Broker_}/BUY/${Price}/${Key_SECRET}/order`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `${AccessToken}`,
                },
                timeout: 10000,
              }
            );
            if (resp?.data.code === 1) {
              messageApi.open({
                type: "success",
                content: `Send BUY ${record.symbol} -> ${record.Broker} thành công!`,
              });
            } else {
              messageApi.open({
                type: "error",
                content: `Gửi yêu cầu BUY ${record.symbol} cho broker ${record.Broker} thất bại!`,
              });
            }
          } catch (error) {
            messageApi.open({
              type: "error",
              content: (error as Error).message,
            });
            handleLogout();
          }
        }}
      >
        {isMobile ? "BUY" : "BUY"}
      </Button>

      <Button
        type="primary"
        size="small"
        onClick={async () => {
          try {
            setActiveBrokerChart(record.Broker);
            setIsChartOpen(true);
            console.log("Open chart for:", record.symbol);
          } catch (error) {
            messageApi.open({
              type: "error",
              content: (error as Error).message,
            });
            handleLogout();
          }
        }}
      >
        Chart
      </Button>
    </Space>
  ),
  width: isMobile ? 60 : 140,
}
  ];

  const columns_broker_info: TableProps["columns"] = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => <a>{index + 1}</a>,
      width: isMobile ? 50 : 60,
    },
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      render: (text, record) => (
        <div
          style={{
            color: "#049196",
            fontSize: isMobile ? "13px" : "15px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: isMobile ? "60px" : "80px",
          }}
        >
          <Tooltip
            title={
              <>
                {record.symbol_raw != record.symbol && (
                  <span style={{ color: "red" }}>Raw: {record.symbol_raw}</span>
                )}
                {record.symbol_raw === record.symbol && (
                  <span style={{ color: "green" }}>
                    Raw: {record.symbol_raw}
                  </span>
                )}
              </>
            }
          >
            <span>{text}</span>
          </Tooltip>
        </div>
      ),
      sorter: (a: any, b: any) => a.symbol.localeCompare(b.symbol),
      fixed: isMobile ? undefined : "left",
    },
    {
      title: "Bid",
      dataIndex: "bid",
      key: "bid",
      render: (text) => (
        <div
          style={{
            color: "#d90606",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.bid) - Number(b.bid),
      fixed: isMobile ? undefined : "left",
    },
    {
      title: "Bid Fix",
      dataIndex: "bid_mdf",
      key: "bid_mdf",
      render: (text: any) => (
        <div
          style={{
            color: "#f09b55",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.bid_mdf.localeCompare(b.bid_mdf),
    },
    {
      title: "Ask",
      dataIndex: "ask",
      key: "ask",
      render: (text) => (
        <div
          style={{
            color: "#07a6c6",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.ask.localeCompare(b.ask),
      fixed: isMobile ? undefined : "left",
    },

    {
      title: "Ask Fix",
      dataIndex: "ask_mdf",
      key: "ask_mdf",
      render: (text: any) => (
        <div
          style={{
            color: "#5aedef",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.ask_mdf.localeCompare(b.ask_mdf),
    },
    {
      title: "Spread",
      dataIndex: "spread",
      key: "spread",
      render: (text: any) => (
        <div
          style={{
            color: "#ca5aef",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.spread.localeCompare(b.spread),
    },
    {
      title: "Delay",
      dataIndex: "timedelay",
      key: "timedelay",
      render: (text: any) => {
        const n = Number(text);
        if (Number.isNaN(n)) {
          return (
            <div
              style={{
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <span>{text}</span>
            </div>
          );
        }
        return n < 0 ? (
          <div
            style={{
              color: "#ef6e5a",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {formatSecondsToTime(n)}
          </div>
        ) : (
          <div
            style={{
              color: "#2906d9",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span>{text} s</span>
          </div>
        );
      },
      sorter: (a: any, b: any) => a.timedelay.localeCompare(b.timedelay),
    },
    {
      title: "Time Current",
      dataIndex: "timecurrent",
      key: "timecurrent",
      render: (text: any) => (
        <div
          style={{
            color: "#df5008",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.timecurrent.localeCompare(b.timecurrent),
    },
    {
      title: "Time Trade",
      dataIndex: "trade",
      key: "trade",
      align: "center" as const,
      render: (_text, record) => {
        try {
          const safeToString = (value: any): string => {
            if (value === null || value === undefined) return "N/A";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value);
          };

          // ✅ Case 1: trade !== "TRUE" → Hiển thị "Close"
          if (record.trade !== "TRUE") {
            if (isMobile) {
              return (
                <Tooltip title={`Status: ${safeToString(record.trade)}`}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#dc2626",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✕
                  </span>
                </Tooltip>
              );
            }

            return (
              <Tooltip
                title={`Trade Status: ${safeToString(record.trade)}`}
                placement="topLeft"
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1.5px solid #ef4444",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#ef4444",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#dc2626",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Close
                  </span>
                </div>
              </Tooltip>
            );
          }

          // ✅ Case 2: trade === "TRUE" → Hiển thị timetrade
          const sessions = Array.isArray(record.timetrade)
            ? record.timetrade
            : [];
          const sessionCount = sessions.length;

          const active = sessions.find(
            (s) => String(s?.status || "").toLowerCase() === "true"
          );

          // Mobile version
          if (isMobile) {
            const hasActiveSession = !!active;
            return (
              <Tooltip
                title={
                  hasActiveSession
                    ? `Open: ${safeToString(active.open)} - ${safeToString(
                        active.close
                      )} (${sessionCount} sessions)`
                    : `No active session (${sessionCount} sessions)`
                }
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: hasActiveSession ? "#16a34a" : "#f59e0b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hasActiveSession ? "✓" : "⚠️"}
                  </span>
                  {/* Badge for mobile */}
                  {sessionCount > 0 && (
                    <Badge
                      count={sessionCount}
                      style={{
                        backgroundColor: hasActiveSession
                          ? "#10b981"
                          : "#f59e0b",
                        fontSize: "9px",
                        height: "16px",
                        lineHeight: "16px",
                        minWidth: "16px",
                      }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          }

          // Desktop version
          const label = active
            ? `${safeToString(active.open)} - ${safeToString(active.close)}`
            : "No Active Session";

          // Tooltip content
          const tooltipContent =
            sessions.length > 0 ? (
              <div style={{ lineHeight: 1.8, minWidth: 250 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    marginBottom: 8,
                    paddingBottom: 8,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>📊 Trading Sessions</span>
                  {/* Badge in tooltip header */}
                  <Badge
                    count={sessionCount}
                    style={{
                      backgroundColor: active ? "#10b981" : "#6b7280",
                      fontSize: "11px",
                    }}
                  />
                </div>
                {sessions.map((s, idx) => {
                  const isActive =
                    String(s?.status || "").toLowerCase() === "true";
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        marginBottom: 4,
                        borderRadius: 4,
                        background: isActive
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(100, 116, 139, 0.1)",
                      }}
                    >
                      <Badge status={isActive ? "success" : "default"} />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#10b981" : "#94a3b8",
                          flex: 1,
                        }}
                      >
                        {safeToString(s?.open)} - {safeToString(s?.close)}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#10b981",
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                No sessions configured
              </span>
            );

          const color = active ? "#16a34a" : "#f59e0b";

          return (
            <Tooltip
              title={tooltipContent}
              placement="topLeft"
              overlayStyle={{ maxWidth: 400 }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: active
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(245, 158, 11, 0.1)",
                  border: `1.5px solid ${color}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = active
                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                    : "0 4px 12px rgba(245, 158, 11, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: active
                      ? "0 0 8px rgba(16, 185, 129, 0.6)"
                      : "0 0 8px rgba(245, 158, 11, 0.6)",
                    animation: active ? "pulse 2s infinite" : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>

                {/* ✅ Badge hiển thị số lượng sessions */}
                {sessionCount > 0 && (
                  <Badge
                    count={sessionCount}
                    style={{
                      backgroundColor: active ? "#10b981" : "#f59e0b",
                      boxShadow: active
                        ? "0 2px 8px rgba(16, 185, 129, 0.3)"
                        : "0 2px 8px rgba(245, 158, 11, 0.3)",
                      fontSize: "11px",
                      fontWeight: 700,
                      height: "20px",
                      lineHeight: "20px",
                      minWidth: "20px",
                    }}
                  />
                )}
              </div>
            </Tooltip>
          );
        } catch (error) {
          console.error("Time Trade render error:", error, record);
          return (
            <Tooltip title="Error loading trade sessions">
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                ⚠️ Error
              </span>
            </Tooltip>
          );
        }
      },
      sorter: (a: any, b: any) => {
        try {
          const aValue = String(a?.trade || "");
          const bValue = String(b?.trade || "");
          return aValue.localeCompare(bValue);
        } catch (error) {
          return 0;
        }
      },
      fixed: isMobile ? undefined : "left",
      width: isMobile ? 80 : 200, // ✅ Tăng width để chứa badge
    },
    {
  title: "Action",
  key: "action",
  fixed: isMobile ? undefined : "right",
  render: (_, record) => (
    <div>
      <Space size="small" direction={isMobile ? "vertical" : "horizontal"}>
         <Button
          type="primary"
          size="small"
          danger
          disabled={brokerInfo?.data?.auto_trade !== "true" || record.trade !== "TRUE"}
          onClick={async () => {
            try {
              const AccessToken = localStorage.getItem("accessToken") || "";
              const Key_SECRET = localStorage.getItem("id_SECRET") || "";
              const Symbol = record.symbol;
              const Broker_ = broker_actived;
              const Price = record.bid;
              const resp: any = await axios.get(
                `http://${IP_Server}:5000/v1/api/${Symbol}/${Broker_}/SELL/${Price}/${Key_SECRET}/order`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `${AccessToken}`,
                  },
                  timeout: 10000,
                }
              );
              if (resp?.data.code === 1) {
                messageApi.open({
                  type: "success",
                  content: `Send Reset ${record.symbol} -> ${record.broker} thành công!`,
                });
              } else {
                messageApi.open({
                  type: "error",
                  content: `Gửi yêu cầu Reset ${record.symbol} cho broker ${record.broker} thất bại!`,
                });
              }
            } catch (error) {
              messageApi.open({
                type: "error",
                content: (error as Error).message,
              });
              handleLogout();
            }
          }}
        >
          {isMobile ? "SELL" : "SELL"}
        </Button>
        <Button 
          type="primary"
          size="small"
          disabled={brokerInfo?.data?.auto_trade !== "true" || record.trade !== "TRUE"}
          onClick={async () => {
            try {
              const AccessToken = localStorage.getItem("accessToken") || "";
              const Key_SECRET = localStorage.getItem("id_SECRET") || "";
              const Symbol = record.symbol;
              const Broker_ = broker_actived;
              const Price = record.ask;
              console.log(record);
              const resp: any = await axios.get(
                `http://${IP_Server}:5000/v1/api/${Symbol}/${Broker_}/BUY/${Price}/${Key_SECRET}/order`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `${AccessToken}`,
                  },
                  timeout: 10000,
                }
              );
              if (resp?.data.code === 1) {
                messageApi.open({
                  type: "success",
                  content: `Send Reset ${record.symbol} -> ${record.broker} thành công!`,
                });
              } else {
                messageApi.open({
                  type: "error",
                  content: `Gửi yêu cầu Reset ${record.symbol} cho broker ${record.broker} thất bại!`,
                });
              }
            } catch (error) {
              messageApi.open({
                type: "error",
                content: (error as Error).message,
              });
              handleLogout();
            }
          }}
        >
          {isMobile ? "BUY" : "BUY"}
        </Button>

       
      </Space>
    </div>
  ),
  width: isMobile ? 50 : 140,
}
  ];

  const handle_setModalSymbols = (symbol: string | null) => {
    setActiveTab(symbol || "");
    setModalOpenSymbol((prev) => !prev);
  };

  useEffect(() => {
    connect_analysis();
    return () => {
      disconnect_analysis();
    };
  }, []);

  useEffect(() => {
    if (openModalInfo) {
      connect_Brokers();
    } else {
      disconnect_Brokers();
    }
    return () => disconnect_Brokers();
  }, [openModalInfo, connect_Brokers, disconnect_Brokers]);

  useEffect(() => {
    if (openModalBrokerInfo) {
      connect_BrokerInfo();
    } else {
      disconnect_BrokerInfo();
    }
    return () => disconnect_BrokerInfo();
  }, [openModalBrokerInfo, connect_BrokerInfo, disconnect_BrokerInfo]);

  const shouldConnectSymbols = modalOpenSymbol || isChartOpen;

useEffect(() => {
  if (shouldConnectSymbols) connect_symbols();
  else disconnect_symbols();

  return () => disconnect_symbols();
}, [shouldConnectSymbols, connect_symbols, disconnect_symbols]);


const rafRef = useRef<number | null>(null);

useEffect(() => {
  if (!isChartOpen) return;
  if (!symbols?.length) return;
  if (!activeBrokerChart) return;

  if (rafRef.current) cancelAnimationFrame(rafRef.current);

  rafRef.current = requestAnimationFrame(() => {
    const pair = pickBrokerPair(symbols, activeBrokerChart);
    if (!pair?.A || !pair?.B) return;

    const next = buildChartDataFromAB(pair, chartData_Example);
    setChartData(next);
  });

  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };
}, [symbols, activeBrokerChart, isChartOpen]);



  const handleSearch = (value: string) => {
    console.log("Searching:", value);
  };

  const handleSelect = (value: string) => {
    console.log("Selected:", value);
    handle_setModalSymbols(value);

    // HandleSymbol(value);
  };
  const handleSelect_symbolConfig = (value: string) => {
    // HandleSymbol(value);
  };
  useEffect(() => {
    if (brokers) {
      setDataBrokerInfo(brokers.data || []);
      // console.log('📊 Brokers data updated:', brokers);
    }
  }, [brokers]);


useEffect(() => {
  if (!isChartOpen) return;
  if (!symbols?.length) return;
  if (!activeBrokerChart) return;

  const pair = pickBrokerPair(symbols, activeBrokerChart);
  if (!pair?.A || !pair?.B) return;

  const next = buildChartDataFromAB(pair, chartData_Example);
  setChartData(next);
}, [symbols, activeBrokerChart, isChartOpen]);
  

  const handleClickInfo = () => {
    setOpenModalInfo((prev) => !prev);
  };

  const handleSpreadSTDChange = (value: any) => {
    form_.setFieldsValue({
      Spread_ECN: value,
    });
  };

  const onFinish_add_Spread = (values: any) => {
    console.log(values);
    const Payload = {
      name_Setting: "Spread_Plus",
      value: values.spread,
    };

    axios
      .post("http://${IP_Server}:3001/symbol/spread", Payload)
      .then((response) => {
        if (response.data) {
          console.log("Success:", response);
          // success(response.data.mess);
          HandleSymbol("ALL");
        } else {
          // Eror_(response.data.mess);
          HandleSymbol("ALL");
        }
        // HandleSymbol();
        // success(`${values.Symbol} thêm mới thành công`);
        // form.resetFields(); // Reset form sau khi submit thành công
      })
      .catch((error) => {
        // if(error.response.data.code === 0)Eror_("Symbol đã tồn tại");
      });
  };

  const onFinish_add = (values: any) => {
    console.log(values);
    // Ví dụ gửi lên server:
    const AccessToken = localStorage.getItem("accessToken") || "";
    axios
      .post("http://${IP_Server}:5000/v1/api/symbol/config", values, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${AccessToken}`,
        },
      })
      .then((response) => {
        // console.log('Success:', response);
        HandleSymbol("ALL");
        // success(`${values.Symbol} thêm mới thành công`);
        messageApi.open({
          type: "success",
          content: `${values.Symbol} thêm mới thành công`,
        });
        // form.resetFields(); // Reset form sau khi submit thành công
      })
      .catch((error) => {
        // if(error.response.data.code === 0)Error_("Symbol đã tồn tại");
        messageApi.open({
          type: "error",
          content: `${values.Symbol} đã tồn tại`,
        });
      });
  };

 const themmoiSymbol = () => setForm_Add_Symbol((p) => !p);

  const HandleSymbol = async (symbol: string) => {
    // audio.play();
    setModalSpreadConfig(true);
    try {
      // const AccessToken = localStorage.getItem("accessToken") || "";
      //         const resp: any = await axios.get(
      //           `http://${IP_Server}:9000/v1/api/symbol/config/${symbol || "ALL"}`,
      //           {
      //             headers: {
      //               "Content-Type": "application/json",
      //               Authorization: `${AccessToken}`,
      //             },
      //             timeout: 10000,
      //           }
      //         );
      // console.log('Symbol Config Data:', resp.data);
      // setSymbol_config(resp?.data.data);
      // setModalSpreadConfig(false);
      // setSymbol_Config(response.data.Data);
      // setSpreadPlus(response.data.Spread_Plus.value);
    } catch (error: any) {
      console.error("API request failed:", error.message);
      throw error;
    }
  };

  const handleClickInfo_Broker = () => {
    setOpenModalBrokerInfo((prev) => !prev);
  };

  const onFinish_update = (values: any) => {
    console.log(values);
    // values._id = _id;
    // Ví dụ gửi lên server:
    axios
      .post("http://${IP_Server}:3001/symbol/update", values)
      .then((response) => {
        if (response.data) {
          // success(`${values.Symbol} Update Thành Công`);
          HandleSymbol("ALL");
        } else {
          // Eror_(`${values.Symbol} Không Tồn Tại`);
          HandleSymbol("ALL");
        }
        // HandleSymbol();
        // success(`${values.Symbol} thêm mới thành công`);
        // form.resetFields(); // Reset form sau khi submit thành công
      })
      .catch((error) => {
        // if(error.response.data.code === 0)Eror_("Symbol đã tồn tại");
      });
  };


  const columns_SymbolConfig: TableProps<any>["columns"] = [
    {
      title: "#",
      dataIndex: "Index",
      fixed: "left",
      width: "10px",
      key: "Index",
      render: (text: any) => {
        return (
          <span
            style={{
              color: "#1e90ff",
              fontWeight: "500",
              fontFamily: "inherit",
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: <span>SẢN PHẨM</span>,
      dataIndex: "Symbol",
      fixed: "left",
      className: "blue-column",
      key: "Symbol",
      render: (text: any, record: any) => {
        const shortText = text.length > 7 ? text.substring(0, 7) + "..." : text;
        if (text === brokerCheck) {
          return (
            <span
              style={{
                color: "#ff1e1e",
                fontWeight: "500",
                fontFamily: "inherit",
              }}
            >
              {shortText}
            </span>
          );
        } else {
          return (
            <span
              style={{
                color: "#1e90ff",
                fontWeight: "500",
                fontFamily: "inherit",
              }}
            >
              {shortText}
            </span>
          );
        }
      },
    },
    {
      title: "SPREAD STD",
      dataIndex: "Spread_STD",
      width: "500",
      key: "Spread_STD",
      sorter: {
        compare: (a: any, b: any) =>
          parseFloat(a.PriceBid) - parseFloat(b.PriceBid),
        multiple: 3,
      },
      render: (text: any) => {
        return (
          <span
            style={{
              color: "tomato",
              width: "75px",
              display: "inline-block",
              fontWeight: "400",
              fontFamily: "inherit",
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "SPREAD_ECN",
      dataIndex: "Spread_ECN",
      key: "Spread_ECN",
      sorter: {
        compare: (a: any, b: any) =>
          parseFloat(a.PriceBid_modify) - parseFloat(b.PriceBid_modify),
        multiple: 3,
      },
      render: (text: any) => {
        return (
          <span
            style={{
              color: "red",
              width: "75px",
              display: "inline-block",
              fontWeight: "500",
              fontFamily: "inherit",
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "SYDNEY",
      dataIndex: "Sydney",
      key: "Sydney",
      sorter: {
        compare: (a: any, b: any) =>
          parseFloat(a.Spread) - parseFloat(b.Spread),
        multiple: 1,
      },
      render: (text: any) => {
        return (
          <span
            style={{ color: "blue", fontWeight: "400", fontFamily: "inherit" }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "TOKYO",
      dataIndex: "Tokyo",
      key: "Tokyo",
      sorter: {
        compare: (a: any, b: any) =>
          parseFloat(a.High_Candle) - parseFloat(b.High_Candle),
        multiple: 1,
      },
      render: (text: any) => {
        return (
          <span
            style={{ color: "blue", fontWeight: "400", fontFamily: "inherit" }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "LONDON",
      dataIndex: "London",
      key: "London",
      sorter: {
        compare: (a: any, b: any) =>
          parseFloat(a.PriceAsk) - parseFloat(b.PriceAsk),
        multiple: 2,
      },
      render: (text: any) => {
        return (
          <span
            style={{
              color: "Green",
              width: "75px",
              display: "inline-block",
              fontWeight: "400",
              fontFamily: "inherit",
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "NEWYORK",
      dataIndex: "NewYork",
      key: "NewYork",
      sorter: {
        compare: (a: any, b: any) =>
          parseFloat(a.PriceAsk_modify) - parseFloat(b.PriceAsk_modify),
        multiple: 2,
      },
      render: (text: any) => {
        return (
          <span
            style={{
              color: "Green",
              width: "75px",
              display: "inline-block",
              fontWeight: "500",
              fontFamily: "inherit",
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "ACTION",
      dataIndex: "actions",
      render: (text: any, record: any, index: number) => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                const values = {
                  _id: record._id,
                };

                axios
                  .post("http://${IP_Server}:9001/v1/api/symbol/config", values)
                  .then((response) => {
                    if (response.data !== null) {
                      // set_Id(response.data._id);
                      console.log(response.data);
                      form.setFieldsValue(response.data);
                      setForm_update_Symbol(true);
                      // seForm_Add_Symbol(false);
                    } else {
                      // Eror_(`${record.Symbol} không tồn tại`);
                      HandleSymbol(record.Symbol);
                    }
                    // setInfoSymbol()
                    // success(`${values.Symbol} thêm mới thành công`);
                    // form.resetFields(); // Reset form sau khi submit thành công
                  })
                  .catch((error) => {
                    // if(error.response.data.code === 0)Eror_("Symbol đã tồn tại");
                  });
                // ws_3?.send(JSON.stringify([mes]));
                // success(" Reset -> " + record.Broker + " Success 2");
                // console.log(mes);
              }}
            >
              Sửa
            </Button>
            <Button
              danger
              type="primary"
              onClick={() => {
                const values = {
                  _id: record._id,
                };

                axios
                  .post("http://${IP_Server}:9001/v1/api/symbol/delete", values)
                  .then((response) => {
                    console.log(response);
                    if (response.data !== null) {
                      // success(`Xóa Sản Phẩm "${record.Symbol}" thành công`);
                      HandleSymbol("ALL");
                    } else {
                      // Eror_(`${record.Symbol} không tồn tại`);
                      HandleSymbol("ALL");
                    }
                    // setInfoSymbol()
                    // success(`${values.Symbol} thêm mới thành công`);
                    // form.resetFields(); // Reset form sau khi submit thành công
                  })
                  .catch((error) => {
                    // if(error.response.data.code === 0)Eror_("Symbol đã tồn tại");
                  });
              }}
            >
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  const t = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);
  

   const [type_1, setType_1] = useState<any[]>([]);
   const [type_2, setType_2] = useState<any[]>([]);
  useEffect(() => {
    if (analysis?.analysis) {
      if(analysis?.analysis.Type_1 !== type_1){
        setType_1(analysis?.analysis.Type_1 || []);
      }
      if(analysis?.analysis.Type_2 !== type_2){
        setType_2(analysis?.analysis.Type_2 || []);
      }
    }
}, [analysis?.analysis]);

  const forexData: any[] = analysis?.analysis?.Type_1 || [];

  const stocksData: any[] = analysis?.analysis?.Type_2 || [];

  useEffect(() => {
  if ((type_1.length + type_2.length) > 0) {
    setAlert(true);
  } else {
    setAlert(false);
  }
}, [type_1, type_2]);

useEffect(() => {
  if (alert && alert_ && audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => {
        console.log("🔔 Alert sound played");
      })
      .catch((err) => {
        console.error("Play alert error:", err);
      });
  }
}, [alert, alert_]); // nhớ thêm alert_ vào dependency


  const renderSignalCard = (item: any) => (
    <div
      key={item.id}
      style={{
        background: t.cardBg,
        borderRadius: isMobile ? "10px" : "12px",
        padding: isMobile ? "16px" : "20px",
        border: `1px solid ${t.border}`,
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = t.cardHoverBg;
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow =
            "0 8px 24px rgba(16, 185, 129, 0.2)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = t.cardBg;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          top: isMobile ? "10px" : "12px",
          right: isMobile ? "10px" : "12px",
          width: isMobile ? "8px" : "10px",
          height: isMobile ? "8px" : "10px",
          background: "#10b981",
          borderRadius: "50%",
          boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
          animation: "pulse 2s infinite",
        }}
      />

      <div
        style={{
          color: t.accentPurple,
          fontSize: isMobile ? "14px" : "16px",
          fontWeight: 700,
          marginBottom: isMobile ? "6px" : "8px",
        }}
      >
        {item.Broker}
      </div>

      <div
        style={{
          color: t.title,
          fontSize: isMobile ? "20px" : "24px",
          fontWeight: 700,
          marginBottom: isMobile ? "10px" : "12px",
        }}
      >
        {item.Symbol}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: isMobile ? "10px" : "12px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ color: t.muted, fontSize: isMobile ? "12px" : "13px" }}>
          {item.Broker_Main}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: t.text,
            fontSize: isMobile ? "12px" : "13px",
          }}
        >
          <UserIcon muted={t.muted} />
          {item.KhoangCach}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isMobile ? "12px" : "16px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: isMobile ? "4px 10px" : "6px 12px",
            background: "rgba(16, 185, 129, 0.12)",
            borderRadius: "6px",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <ArrowUpIcon />
          <span
            style={{
              color: "#10b981",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: 700,
            }}
          >
            {item.KhoangCach}
          </span>
        </div>
        <div style={{ color: t.muted, fontSize: isMobile ? "11px" : "12px" }}>
          {item.Count}
        </div>
      </div>

      <button
        style={{
          width: "100%",
          padding: isMobile ? "10px" : "12px",
          background:
            item.Messenger === "BUY"
              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          border: "none",
          borderRadius: "8px",
          color: "#fff",
          fontSize: isMobile ? "13px" : "14px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow:
            item.Messenger === "BUY"
              ? "0 4px 12px rgba(59, 130, 246, 0.3)"
              : "0 4px 12px rgba(239, 68, 68, 0.3)",
        }}
      >
        {item.Messenger}
      </button>
    </div>
  );

  const renderSignalRow = (item: any, index: number) => {
  // ✅ Check isTrust status
  const isTrusted = item.IsStable === "True" || item.IsStable === true;

  // ✅ Check Type - có thể là "GOLD", "FOREX", "CRYPTO", etc.
  const itemType = item.Type || null;
  
  // ✅ Màu sắc theo Type
  const getTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "DELAY PRICE STOP":
        return {
          bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          shadow: "rgba(16, 185, 129, 0.3)",
        };
      case "CRYPTO":
        return {
          bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          shadow: "rgba(139, 92, 246, 0.3)",
        };
      case "STOCK":
        return {
          bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          shadow: "rgba(16, 185, 129, 0.3)",
        };
      case "INDEX":
        return {
          bg: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
          shadow: "rgba(236, 72, 153, 0.3)",
        };
      default:
        return {
          bg: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
          shadow: "rgba(107, 114, 128, 0.3)",
        };
    }
  };

  const typeColor = getTypeColor(itemType);

  return (
    <div
      key={`${item.id}-${item.Broker}-${item.Symbol}`}
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "30px 1fr 70px"
          : isTablet
          ? "20px minmax(80px, 1fr) minmax(60px, 1fr) 70px 80px 90px"
          : "20px minmax(100px, 1fr) minmax(80px, 1fr) minmax(50px, 1fr) 90px 90px 100px 100px",
        alignItems: "center",
        gap: isMobile ? "8px" : "12px",
        padding: isMobile ? "12px" : isTablet ? "12px 16px" : "14px 20px",

        // ✅ Đổi màu background sang ĐỎ khi isTrust = True
        background: isTrusted
          ? isDark
            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%)"
            : "linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(220, 38, 38, 0.03) 100%)"
          : index % 2 === 0
          ? t.rowEven
          : t.rowOdd,
        border: isTrusted
          ? `2px solid rgba(239, 68, 68, 0.3)`
          : `1px solid ${t.border}`,
        boxShadow: isTrusted ? "0 4px 12px rgba(239, 68, 68, 0.1)" : "none",

        borderRadius: isMobile ? "8px" : "10px",
        marginBottom: isMobile ? "8px" : "6px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",

        // ✅ Position relative để đặt badge
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = isTrusted
            ? isDark
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.2) 100%)"
              : "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)"
            : t.rowHover;
          e.currentTarget.style.borderColor = isTrusted
            ? "rgba(239, 68, 68, 0.6)"
            : t.accentIndigo;
          e.currentTarget.style.transform = "translateX(4px)";
          e.currentTarget.style.boxShadow = isTrusted
            ? "0 8px 20px rgba(239, 68, 68, 0.25)"
            : "0 4px 12px rgba(16, 185, 129, 0.25)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = isTrusted
            ? isDark
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%)"
              : "linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(220, 38, 38, 0.03) 100%)"
            : index % 2 === 0
            ? t.rowEven
            : t.rowOdd;
          e.currentTarget.style.borderColor = isTrusted
            ? "rgba(239, 68, 68, 0.3)"
            : t.border;
          e.currentTarget.style.transform = "translateX(0)";
          e.currentTarget.style.boxShadow = isTrusted
            ? "0 4px 12px rgba(239, 68, 68, 0.1)"
            : "none";
        }
      }}
    >
      
      {/* ✅ Trusted Badge - Góc trên bên TRÁI */}
      {isTrusted && (
        <div
          style={{
            position: "absolute",
            top: isMobile ? -10 : -12,
            left: isMobile ? 4 : 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: isMobile ? "2px 6px" : "3px 8px",
            background: "linear-gradient(135deg, #e22d2d 0%, #df1d1d 100%)",
            borderRadius: isMobile ? 8 : 10,
            boxShadow: "0 2px 8px rgba(255, 92, 92, 0.3)",
            zIndex: 10,
          }}
        >
          <svg
            width={isMobile ? 10 : 12}
            height={isMobile ? 10 : 12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.5px",
            }}
          >
            TRUSTED
          </span>
        </div>
      )}

      {/* ✅ Type Badge - Góc trên bên PHẢI */}
      {itemType && (
        <div
          style={{
            position: "absolute",
            top: isMobile ? -10 : -12,
            right: isMobile ? 4 : 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: isMobile ? "2px 6px" : "3px 8px",
            background: typeColor.bg,
            borderRadius: isMobile ? 8 : 10,
            boxShadow: `0 2px 8px ${typeColor.shadow}`,
            zIndex: 10,
          }}
        >
          {/* Icon theo Type */}
          {itemType?.toUpperCase() === "Delay Price Stop" && (
            <svg
              width={isMobile ? 10 : 12}
              height={isMobile ? 10 : 12}
              viewBox="0 0 24 24"
              fill="#fff"
            >
              <path d="M12.89 11.1c-1.78-.59-2.64-.96-2.64-1.9 0-1.02 1.11-1.39 1.81-1.39 1.31 0 1.79.99 1.9 1.34l1.58-.67c-.15-.44-.82-1.91-2.66-2.23V5h-1.75v1.26c-2.6.56-2.62 2.85-2.62 2.96 0 2.27 2.25 2.91 3.35 3.31 1.58.56 2.28 1.07 2.28 2.03 0 1.13-1.05 1.61-1.98 1.61-1.82 0-2.34-1.87-2.4-2.09l-1.66.67c.63 2.19 2.28 2.78 3.02 2.96V19h1.75v-1.24c.52-.09 3.02-.59 3.02-3.22.01-1.39-.6-2.61-3-3.44z" />
            </svg>
          )}
          {itemType?.toUpperCase() === "CRYPTO" && (
            <svg
              width={isMobile ? 10 : 12}
              height={isMobile ? 10 : 12}
              viewBox="0 0 24 24"
              fill="#fff"
            >
              <path d="M11.5 11.5v-6h1v6h6v1h-6v6h-1v-6h-6v-1z" />
              <circle cx="12" cy="12" r="10" fill="none" stroke="#fff" strokeWidth="2" />
            </svg>
          )}
          {itemType?.toUpperCase() === "STOCK" && (
            <svg
              width={isMobile ? 10 : 12}
              height={isMobile ? 10 : 12}
              viewBox="0 0 24 24"
              fill="#fff"
            >
              <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
            </svg>
          )}
          {itemType?.toUpperCase() === "INDEX" && (
            <svg
              width={isMobile ? 10 : 12}
              height={isMobile ? 10 : 12}
              viewBox="0 0 24 24"
              fill="#fff"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          )}
          {/* Default icon nếu không match */}
          {![ "DELAY PRICE STOP", "CRYPTO", "STOCK", "INDEX"].includes(
            itemType?.toUpperCase()
          ) && (
            <svg
              width={isMobile ? 10 : 12}
              height={isMobile ? 10 : 12}
              viewBox="0 0 24 24"
              fill="#fff"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {itemType}
          </span>
        </div>
      )}

      {isMobile ? (
        <>
          {/* STT */}
          <div
            style={{
              color: isTrusted ? "#10b981" : t.muted,
              fontSize: "13px",
              fontWeight: isTrusted ? 700 : 600,
              textAlign: "center",
            }}
          >
            {index + 1}
          </div>

          {/* Info Column */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              {/* ✅ Trusted indicator */}
              {isTrusted && (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "#10b981",
                    borderRadius: "50%",
                    flexShrink: 0,
                    boxShadow: "0 0 8px rgba(16, 185, 129, 0.8)",
                    animation: "pulse 2s infinite",
                  }}
                />
              )}
              {item.online && !isTrusted && (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "#10b981",
                    borderRadius: "50%",
                    flexShrink: 0,
                    boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
                  }}
                />
              )}
              <span
                style={{
                  color: isTrusted ? "#10b981" : t.accentPurple,
                  fontSize: "13px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.Broker || item.provider}
              </span>
            </div>

            <div
              style={{
                color: isTrusted ? "#10b981" : t.title,
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "4px",
              }}
               onClick={() => {
              console.log("Clicked symbol 1", item.Symbol);
              setActiveBroker(item.Broker || item.provider);
              setActiveTab(item.Symbol || item.pair);
              setModalOpenSymbol(true);
            }}
            >
              {item.Symbol || item.pair}
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                fontSize: "11px",
              }}
            >
              <span style={{ color: t.muted }}>
                {item.Broker_Main || item.exchange}
              </span>
              <span
                style={{
                  color: isTrusted ? "#10b981" : t.accentIndigo,
                  fontWeight: 600,
                }}
              >
                {item.KhoangCach || item.followers}
              </span>
              <span style={{ color: t.muted }}>{item.Count || item.time}</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            style={{
              padding: "6px 12px",
              background:
                item.type === "BUY" || item.Messenger === "BUY"
                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              setActiveBrokerChart(item.Broker || item.provider);
              setActiveTab(item.Symbol || item.pair);
              console.log("Clicked action button", item.Symbol);
            }}
          >
            {item.Messenger || item.action}
          </button>
        </>
      ) : (
        <>
          {/* Desktop/Tablet layout */}
          <div
            style={{
              color: isTrusted ? "#10b981" : t.muted,
              fontSize: "15px",
              fontWeight: isTrusted ? 700 : 600,
              textAlign: "center",
            }}
          >
            {index + 1}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                background: isTrusted ? "#10b981" : "#10b981",
                borderRadius: "50%",
                flexShrink: 0,
                boxShadow: isTrusted
                  ? "0 0 12px rgba(16, 185, 129, 1)"
                  : "0 0 8px rgba(16, 185, 129, 0.6)",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                color: isTrusted ? "#10b981" : t.accentPurple,
                fontSize: isTablet ? "13px" : "14px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.Broker || item.provider}
            </span>
          </div>

          <div
            style={{
              color: isTrusted ? "#10b981" : t.title,
              fontSize: isTablet ? "14px" : "15px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onClick={() => {
              console.log("Clicked symbol 2", item.Symbol);
              setActiveBroker(item.Broker || item.provider);
              setActiveTab(item.Symbol || item.pair);
              setModalOpenSymbol(true);
            }}
          >
            {item.Symbol || item.pair}
          </div>

          {!isTablet && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    background: item.brokerCheck ? "#10b981" : "#ef4444",
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: t.muted,
                    fontSize: "13px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.Broker_Main || item.exchange}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 10px",
                  background: isTrusted
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(16, 185, 129, 0.12)",
                  borderRadius: "8px",
                  border: isTrusted
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                <span
                  style={{
                    color: isTrusted ? "#10b981" : t.accentIndigo,
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <Tooltip title={"Spread"}>{item.Spread_main}</Tooltip>
                </span>
              </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "6px 10px",
              background:
                item.Spread_main === "0" || item.score < 10
                  ? isTrusted
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(16, 185, 129, 0.12)"
                  : "rgba(251, 191, 36, 0.12)",
              borderRadius: "8px",
              border:
                item.Spread_main === "0" || item.score < 10
                  ? isTrusted
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid rgba(16, 185, 129, 0.25)"
                  : "1px solid rgba(251, 191, 36, 0.25)",
            }}
          >
            <ArrowUpIcon />
            <span
              style={{
                color:
                  item.Spread_main === "0" || item.score < 10
                    ? isTrusted
                      ? "#10b981"
                      : "#10b981"
                    : t.accentYellow,
                fontSize: isTablet ? "12px" : "13px",
                fontWeight: 700,
              }}
            >
              <Tooltip
                title={item.Spread_main === "0" ? "Low Spread" : "High Spread"}
              >
                {Number(item.Spread_main) * 3 > Number(item.KhoangCach)
                  ? "Low"
                  : "High"}
              </Tooltip>
              &nbsp;
              {item.KhoangCach}
            </span>
          </div>

          {!isTablet && (
           <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {item.Type === "Delay Price Stop" ? (
                <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ClockIcon /> {formatSecondsToTime(item.Delay)}
                </span>
              ) : (
                <span style={{ color: "#00be8f", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ClockIcon /> {formatSecondsToTime(item.Count)}
                </span>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              style={{
                padding: isTablet ? "6px 16px" : "8px 24px",
                background:
                  item.type === "BUY" || item.Messenger === "BUY"
                    ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: isTablet ? "12px" : "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow:
                  item.type === "BUY" || item.Messenger === "BUY"
                    ? "0 4px 12px rgba(59, 130, 246, 0.35)"
                    : "0 4px 12px rgba(239, 68, 68, 0.35)",
                minWidth: isTablet ? "60px" : "80px",
              }}
              onClick={() => {
                setActiveBrokerChart(item.Broker || item.provider);
                setActiveTab(item.Symbol || item.pair);
                setIsChartOpen(true);
              console.log("Clicked action button", item.Symbol);
            }}
            >
              {item.Messenger || item.action}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

  return (
    <div style={{ background: t.bg, minHeight: "100vh", padding: 0 }}>
      {/* Modal Thông Tin Broker */}
      {contextHolder}
      <Modal
        title="Server Disconnect"
        style={{ top: 20 }}
        open={modalDisconnect}
        okText="Re Load"

        onOk={() => {
          setModalDisconnect(false);
          navigate(`http://${IP_Server}:3000/price`);
        }}
        onCancel={() => setModalDisconnect(false)}
      >
        <p>Disconnected server at {new Date().toLocaleTimeString()} </p>
      </Modal>
      
      {chartData &&(
      <TripleExchangeChartModal
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        symbol={chartData?.symbol|| activeTab}
        exchange1={chartData?.exchange1 || null}
        exchange2={chartData?.exchange2 || null}
        exchange3={chartData?.exchange3 || null}
        timeframe={chartData?.timeframe || "1m"}
        exchange1Bid={chartData?.exchange1Bid || 1.0875}
        exchange1Ask={chartData?.exchange1Ask || 1.0878}
        exchange2Bid={chartData?.exchange2Bid || 1.0876}
        exchange2Ask={chartData?.exchange2Ask || 1.0879}
        exchange3Bid={chartData?.exchange3Bid || 1.0877}
        exchange3Ask={chartData?.exchange3Ask || 1.0880}
        exchange1Digits={chartData?.exchange1Digits}
        exchange2Digits={chartData?.exchange2Digits}
        exchange3Digits={chartData?.exchange3Digits}
      />
      )}
      


      <AccountModal open={modalConfig} onCancel={() => setModalConfig(false)} />

        <SpreadManagementModal
        visible={modalSpreadConfig}
          onClose={() => setModalSpreadConfig(false)}
          symbols ={symbol || []}
        />

      <HistoryModal
        visible={modalHistory}
        onClose={() => setModalHistory(false)}
      />

      <Modal
  width={isMobile ? "90%" : isTablet ? "80%" : "70%"}
  open={openModalInfo}
  onCancel={() => {
    handleCancelModalInfo();
  }}
  className="light-scroll"
  title={
    isMobile
      ? `Thông Tin Sàn (${dataBrokerInfo.length} Sàn Đã Kết Nối - ${symbol?.length} Sản Phẩm)`
      : `Thông Tin Các Sàn Giao Dịch (${dataBrokerInfo.length} Sàn Đã Kết Nối - ${symbol?.length} Sản Phẩm)`
  }
  footer={null}
  styles={{
    body: {
      maxHeight: "70vh",      // Chiều cao tối đa
      overflowY: "auto",      // Thanh cuộn dọc
    },
  }}
>
        {/* Table - Separate container */}
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
  <div style={{ display: "flex", justifyContent: "flex-end" }}>
    <Space 
      direction={isMobile ? "vertical" : "horizontal"} 
      size="small"
    >
      <Button
        type="primary"
        danger
        icon={<RefreshCcw size={14} />}
        size="small"
        style={{
          width: isMobile ? "100%" : "160px",
          height: "32px",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0 2px 6px rgba(255, 77, 79, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
        onClick={async () => {
          try {
            message.loading("Resetting...");
            console.log("Reset ALL brokers initiated");

            const AccessToken = localStorage.getItem("accessToken") || "";
            if (!AccessToken) {
              messageApi.open({
                type: "warning",
                content: "Chưa có token truy cập!, vui lòng đăng nhập lại.",
              });
              return;
            }
            messageApi.open({
              type: "success",
              content: "Đã gửi yêu cầu Reset ALL!",
            });
            const resp = await axios.get(
              `http://${IP_Server}:5000/v1/api/reset-all-brokers`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `${AccessToken}`,
                },
                timeout: 10000,
              }
            );
            if (resp.data && resp.data.success) {
              message.success("Reset ALL successful!");
              console.log("Reset ALL response:", resp.data);
            } else {
              console.error("Reset ALL failed:", resp.data);
            }
          } catch (error) {
            console.error("Error resetting:", error);
          }
        }}
      >
        Reset ALL
      </Button>

      <Button
        type="primary"
        icon={<Trash2 size={14} />}
        size="small"
        style={{
          width: isMobile ? "100%" : "160px",
          height: "32px",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0 2px 6px rgba(24, 144, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          marginRight: isMobile ? 0 : "16px",
        }}
        onClick={async () => {
          try {
            message.loading("Deleting...");
            console.log("Delete broker server initiated");

            const AccessToken = localStorage.getItem("accessToken") || "";
            if (!AccessToken) {
              messageApi.open({
                type: "warning",
                content: "Chưa có token truy cập!, vui lòng đăng nhập lại.",
              });
              return;
            }
            messageApi.open({
              type: "success",
              content: "Đã gửi yêu cầu Delete Broker!",
            });
            const resp = await axios.get(
              `http://${IP_Server}:5000/v1/api/reset-broker-server`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `${AccessToken}`,
                },
                timeout: 10000,
              }
            );
            if (resp.data && resp.data.success) {
              message.success("Delete Broker successful!");
              console.log("Delete Broker response:", resp.data);
            } else {
              console.error("Delete Broker failed:", resp.data);
            }
          } catch (error) {
            console.error("Error deleting:", error);
          }
        }}
      >
        Delete Server
      </Button>
    </Space>
  </div>

  <div style={{ overflowX: "auto" }} className="light-scroll">
    <Table
      rowKey={(record) => `${record.symbol}-${record.broker}`}
      columns={columns}
      dataSource={Array.isArray(dataBrokerInfo) ? dataBrokerInfo : []}
      scroll={{ x: isMobile ? 600 : "max-content" }}
      pagination={{ pageSize: isMobile ? 100 : 100, simple: isMobile }}
      size={isMobile ? "small" : "middle"}
    />
  </div>
        </Space>
       

        {/* Button - Separate container */}
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
            marginTop: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
         
          
        </div>
      </Modal>

      {/* Modal Thông Tin Symbols */}
      <Modal
        width={isMobile ? "90%" : isTablet ? "80%" : "70%"}
        open={modalOpenSymbol}
        okText="Reset ALL"
        onCancel={() => setModalOpenSymbol(false)}
        onOk={async () => {
          // setModalOpenSymbol(false)
          const AccessToken = localStorage.getItem("accessToken") || "";
          const resp = await axios.get(
            `http://${IP_Server}:5000/v1/api/all/${activeTab}/reset`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `${AccessToken}`,
              },
              timeout: 10000,
            }
          );
          if (resp.data && resp.data.success) {
            message.success("Reset ALL successful!");
            console.log("Reset ALL response:", resp.data);
          } else {
            console.error("Reset ALL failed:", resp.data);
          }
        }}
        title={
          isMobile
            ? `CHI TIẾT SYMBOL: ${activeTab}`
            : `CHI TIẾT SYMBOL: ${activeTab}`
        }
      >
        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey={(record) => `${record.symbol}-${record.Broker}`}
            columns={columns_symbols}
            dataSource={Array.isArray(symbols) ? symbols : []}
            scroll={{ x: isMobile ? 500 : "max-content" }}
            pagination={{ pageSize: isMobile ? 100 : 100, simple: isMobile }}
            rowClassName={(record) =>
              activeBroker === record.broker ? "active-row" : ""
            }
            size={isMobile ? "small" : "middle"}
          />
        </div>
      </Modal>

      {/* Drawer */}
      <Drawer
        title={
          <span style={{ fontSize: isMobile ? "14px" : "16px" }}>
            <span style={{ color: "#04a781", fontWeight: 600 }}>Broker:</span>{" "}
            <span style={{ color: "#a6058e", fontWeight: 600 }}>
              {nameDrawer}
            </span>
          </span>
        }
        closable
        onClose={onClose}
        open={openModalBrokerInfo}
        width={isMobile ? "100%" : isTablet ? "85%" : "70%"}
        placement={isMobile ? "bottom" : "right"}
        height={isMobile ? "85%" : undefined}
        style={{
          borderRadius: isMobile ? "16px 16px 0 0" : "12px 0px 0px 12px",
          background: "#fff",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey={(record) => `${record.symbol}`}
            columns={columns_broker_info}
            dataSource={
              Array.isArray(brokerInfo?.data?.OHLC_Symbols)
                ? brokerInfo?.data?.OHLC_Symbols
                : []
            }
            scroll={{ x: isMobile ? 500 : "max-content" }}
            pagination={{
              onChange: (page, newPageSize) => {
                setPageSize_BrokerInfo(newPageSize);
            },
              pageSize: pageSize_BrokerInfo,
              simple: isMobile,
              hideOnSinglePage: false, // ← Thêm dòng này!
            }}
            size={isMobile ? "small" : "middle"}
          />
        </div>
      </Drawer>

      {/* Header */}
      <div
        style={{
          background: t.headerGradient,
          padding: isMobile
            ? "12px 16px"
            : isTablet
            ? "14px 20px"
            : "16px 24px",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left: Logo & Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "8px" : "12px",
            }}
          >

            {!isMobile && (
               <div
              style={{
                width: isMobile ? "32px" : "40px",
                height: isMobile ? "32px" : "40px",
                background: t.accentPurpleGradient,
                borderRadius: isMobile ? "8px" : "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: isMobile ? "20px" : "24px" }}>📊</span>
            </div>
            
            )}
           
            {!isMobile && (
              <div>
                <div
                  style={{
                    color: t.title,
                    fontSize: isTablet ? "16px" : "18px",
                    fontWeight: 700,
                  }}
                >
                  Price Delay
                </div>
                <div style={{ color: t.muted, fontSize: "12px" }}>
                  Real-time Signals
                </div>
              </div>
            )}
            
  

           <Alert
  style={{ maxWidth: isMobile ? 200 : 400, borderRadius: 8 }}
  banner
  message={
      <Marquee pauseOnHover gradient={false} speed={80}>
  <Space size={30}>
    {groupedNews.length === 0 ? (
      <span style={{ color: "#9ca3af", fontSize: 12, padding: "0 8px" }}>
        Không có tin tức
      </span>
    ) : (
      groupedNews.map((g, index) => {
        const tone = getToneByTime(g.timeLabel, time_soon);

        const CIRCLED = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"];

const titles = g.items
  .map((x: any, i: number) => {
    const n = CIRCLED[i] ?? `${i + 1}.`;
    return `| ${n} [${x.currency}] ${x.name}`;
  })
  .join("  "); 

        return (
          <ImpactBadge
            key={`group-${g.timeLabel}-${index}`}
            size="lg"
            level={g.impact}
            tone={tone}
            text={`${g.timeLabel} - ${titles}`}
          />
        );
      })
    )}

    {/* ✅ spacer để tạo khoảng cách khi marquee lặp */}
    <span style={{ display: "inline-block", width: 30 }} />
  </Space>
</Marquee>

    
  }
/>

          
          </div>

          {/* Right: Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "6px" : "12px",
            }}
          >
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                            style={{
                              width: '180px',
                              height: '36px',
                              padding: '0 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: isDark ? '#353a41' : '#e3eaf8',
                              color: isDark ? '#fcf4f4' : '#99a3b9',
                              cursor: 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontSize: '15px',
                              fontWeight: '600',
                            }}
                          >
                            {timeAnalysis}
                          </button>
              {/* <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: isMobile ? "6px 10px" : "8px 12px",
                  background:
                    viewMode === "grid" ? t.accentIndigoGradient : t.btnNeutral,
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    viewMode === "grid"
                      ? "0 4px 12px rgba(16, 185, 129, 0.35)"
                      : "none",
                }}
              >
                <AppstoreOutlined
                  style={{ fontSize: isMobile ? "14px" : "16px" }}
                />
              </button> */}
              {/* <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: isMobile ? "6px 10px" : "8px 12px",
                  background:
                    viewMode === "list" ? t.accentIndigoGradient : t.btnNeutral,
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    viewMode === "list"
                      ? "0 4px 12px rgba(16, 185, 129, 0.35)"
                      : "none",
                }}
              >
                <UnorderedListOutlined
                  style={{ fontSize: isMobile ? "14px" : "16px" }}
                />
              </button> */}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            marginTop: isMobile ? "12px" : "16px",
            overflowX: "auto",
            overflowY: "hidden",
            whiteSpace: "nowrap",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
            paddingBottom: 4,
            paddingRight: 16,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              minWidth: "max-content",
              flexWrap: "nowrap",
              gap: isMobile ? "6px" : "8px",
              scrollSnapType: "x proximity",
              paddingBottom: 2,
            }}
          >
            {symbol?.map((tab: any, idx: any) => (
              <button
                key={`${tab}-${idx}`}
                onClick={() => handle_setModalSymbols(tab)}
                style={{
                  flex: "0 0 auto",
                  padding: isMobile
                    ? "8px 14px"
                    : isTablet
                    ? "9px 18px"
                    : "10px 20px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: 600,
                  transition: "all 0.25s ease",
                  whiteSpace: "nowrap",
                  scrollSnapAlign: "start",
                  background:
                    activeTab === tab
                      ? t.accentPurpleGradient
                      : isDark
                      ? "rgba(30, 41, 59, 0.6)"
                      : "#a1cecc",
                  color:
                    activeTab === tab ? "#fff" : isDark ? "#f3f4f6" : "#111827",
                  boxShadow:
                    activeTab === tab
                      ? isDark
                        ? "0 4px 12px rgba(16, 185, 129, 0.35)"
                        : "0 4px 12px rgba(59, 130, 246, 0.35)"
                      : "none",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          padding: isMobile
            ? "12px 16px"
            : isTablet
            ? "14px 20px"
            : "16px 24px",
          background: t.subHeaderBg,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: isMobile ? "8px" : "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: isMobile ? "1 1 100%" : "1 1 auto",
              minWidth: isMobile ? "100%" : "200px",
            }}
          >
            <AutocompleteSearch
              suggestions={analysis?.symbols || []}
              placeholder="Symbol ..."
              onSearch={handleSearch}
              onSelect={handleSelect}
              // theme={t}
              height={isMobile ? 36 : 40}
              width={isMobile ? 120 : 150}
            />

          </div>

          <div
            style={{
              width: isMobile ? "100%" : "600px", // ✅ Width cố định
              maxWidth: "100%",
            }}
          >
            {analysis?.resetting &&
              Array.isArray(analysis.resetting) &&
              analysis.resetting.length > 0 && (
                <Alert
                  message={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        overflow: "hidden", // ✅ Hide overflow
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "#d97706",
                          flexShrink: 0,
                        }}
                      >
                        ({analysis.resetting.length})
                      </span>
                      <span style={{ color: "#6b7280", flexShrink: 0 }}>:</span>

                      <span
                        style={{
                          overflow: "hidden", // ✅ Hide overflow
                          textOverflow: "ellipsis", // ✅ Show "..."
                          whiteSpace: "nowrap", // ✅ Single line
                          fontSize: "13px",
                        }}
                      >
                        {analysis.resetting.map((item: any, idx: number) => (
                          <span key={idx}>
                            <span style={{ fontWeight: 600 }}>
                              {item.broker}
                            </span>{" "}
                            <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                              {item.status}
                            </span>
                            {idx < analysis.resetting.length - 1 && ", "}
                          </span>
                        ))}
                      </span>
                    </div>
                  }
                  type="warning"
                  showIcon
                  closable
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #fbbf24",
                  }}
                />
              )}
          </div>

          {!isMobile && (
            <>
              {/* Info Button */}
              <Space>
                <button
                onClick={handleClickInfo}
                style={{
                  padding: isTablet ? "8px 16px" : "10px 20px",
                  background: t.accentIndigo,
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = t.accentIndigoGradient;
                  e.currentTarget.style.transform =
                    "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(5, 150, 105, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = t.accentIndigo;
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(5, 150, 105, 0.25)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(0.98)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-2px) scale(1.02)";
                }}
              >
                <InfoCircleOutlined />
                Info
              </button>

                <button
               style={{
                padding: "10px",
                background: "#06b6d4",            // Cyan chính
                border: "none",
                borderRadius: "6px",
                color: "#ffffff",                // Trắng cho dễ nhìn
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
                e.currentTarget.style.background = "#0891b2";   // Cyan đậm khi nhấn
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "#06b6d4";   // Trở về cyan
              }}
              onClick={() => setModalHistory(true)}
            >
              <HistoryOutlined /> History
                </button>

                  {/* Spread 0 Button */}
                  {roleUser.toUpperCase() === "ADMIN" && (
                       <button
                    style={{
                      padding: "10px 20px",
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
                      e.currentTarget.style.transform =
                        "translateY(-2px) scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 20px rgba(245, 158, 11, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(245, 158, 11, 0.35)";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(0.98)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-2px) scale(1.05)";
                    }}
                    onClick={() => HandleSymbol("ALL")}
                  > <SettingOutlined />
                   
                    Spread Config
                  </button>
                  )}
                 

                   {/* Config Button */}
                   {roleUser.toUpperCase() === "ADMIN" && (
                       <button
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #f87171 0%, #ef4444 100%)";
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 20px rgba(239, 68, 68, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(239, 68, 68, 0.35)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(0.98)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                      }}
                      onClick={() => setModalConfig(true)}
                    >
                    <ThunderboltOutlined />
                    Manager
                  </button>
                   )}
                  
              </Space>
              

                </>
              )}

          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                padding: "8px 12px",
                background: t.accentIndigo,
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 600,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = t.accentIndigoGradient;
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = t.accentIndigo;
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <MenuOutlined />
              Menu
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobile && showMobileMenu && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              background: t.panelBg,
              borderRadius: "8px",
              border: `1px solid ${t.border}`,
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
              animation: "slideDown 0.3s ease",
            }}
          >
            {/* Info Button - Mobile */}
            <button
              onClick={handleClickInfo}
              style={{
                padding: "10px",
                background: t.accentIndigo,
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
                e.currentTarget.style.opacity = "0.8";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.opacity = "1";
              }}
            >
              <InfoCircleOutlined /> Info
            </button>

            {/* Config Button - Mobile */}
            {/* Config Button */}

            {roleUser.toUpperCase() === "ADMIN" && (
                <button
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #f87171 0%, #ef4444 100%)";
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 20px rgba(239, 68, 68, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(239, 68, 68, 0.35)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(0.98)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                      }}
                      onClick={() => setModalConfig(true)}
                    >
                    <ThunderboltOutlined />
                    Manager
                  </button>
            )}
                  

            {/* History Button - Mobile */}
           <button
              style={{
                padding: "10px",
                background: "#06b6d4",            // Cyan chính
                border: "none",
                borderRadius: "6px",
                color: "#ffffff",                // Trắng cho dễ nhìn
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
                e.currentTarget.style.background = "#0891b2";   // Cyan đậm khi nhấn
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "#06b6d4";   // Trở về cyan
              }}
              onClick={() => setModalHistory(true)}
            >
              <HistoryOutlined /> History
            </button>
               {/* Spread 0 Button - Mobile */}
          {roleUser.toUpperCase() === "ADMIN" && (
           
             <button
                    style={{
                      padding: "10px 20px",
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
                      e.currentTarget.style.transform =
                        "translateY(-2px) scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 20px rgba(245, 158, 11, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(245, 158, 11, 0.35)";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(0.98)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-2px) scale(1.05)";
                    }}
                    onClick={() => HandleSymbol("ALL")}
                  > <SettingOutlined />
                   
                    Spread Config
              </button>
          )}
            
          </div>
        )}

        {/* Animation styles */}
        <style>{`
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Ripple effect for buttons */
    button {
      position: relative;
      overflow: hidden;
    }

    button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    button:active::before {
      width: 300px;
      height: 300px;
    }
  `}</style>
      </div>

      {/* Main Content */}
      <div
        style={{
          padding: isMobile ? "12px" : isTablet ? "16px" : "24px",
        }}
      >
        {viewMode === "list" ? (
          // ===== LIST VIEW =====
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr" // Mobile: 1 column
                : isTablet
                ? "1fr" // Tablet: 1 column (stack vertically)
                : "repeat(2, 1fr)", // Desktop: 2 columns side by side
              gap: isMobile ? "16px" : isTablet ? "20px" : "24px",
            }}
          >
            {/* Left Column - FX, XAU, Crypto */}
            <div
              style={{
                background: t.panelBg,
                borderRadius: isMobile ? "12px" : isTablet ? "14px" : "16px",
                padding: isMobile ? "12px" : isTablet ? "16px" : "20px",
                border: `1px solid ${t.border}`,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            >
              <SectionTitle
                t={t}
                isMobile={isMobile}
                iconBg={t.accentPurpleGradient}
                title="FX, XAU, Crypto"
                subtitle="Forex & Commodities"
                count={type_1.length}
                countBg="rgba(16, 185, 129, 0.12)"
                countBorder={t.accentIndigo}
                countColor={t.accentPurple}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? "8px" : "10px",
                  marginTop: isMobile ? "12px" : "16px",
                }}
              >
                {type_1?.map((item, index) => renderSignalRow(item, index))}
              </div>
            </div>

            {/* Right Column - Indices & Stocks */}
            <div
              style={{
                background: t.panelBg,
                borderRadius: isMobile ? "12px" : isTablet ? "14px" : "16px",
                padding: isMobile ? "12px" : isTablet ? "16px" : "20px",
                border: `1px solid ${t.border}`,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            >
              <SectionTitle
                t={t}
                isMobile={isMobile}
                iconBg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                title="Chỉ Số, Chứng Khoán"
                subtitle="Indices & Stocks"
                count={type_2.length}
                countBg="rgba(245,158,11,0.12)"
                countBorder={t.accentYellowBorder}
                countColor={t.accentYellow}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? "8px" : "10px",
                  marginTop: isMobile ? "12px" : "16px",
                }}
              >
                {type_2.map((item, index) => renderSignalRow(item, index))}
              </div>
            </div>
          </div>
        ) : (
          // ===== GRID VIEW =====
          <div>
            {/* Forex Section */}
            <div
              style={{
                marginBottom: isMobile ? "20px" : isTablet ? "28px" : "32px",
              }}
            >
              <SectionHeader
                t={t}
                isMobile={isMobile}
                iconBg={t.accentPurpleGradient}
                title="FX, XAU, Crypto"
                subtitle="Forex & Commodities"
                count={forexData.length}
                countBg="rgba(16, 185, 129, 0.12)"
                countBorder={t.accentIndigo}
                countColor={t.accentPurple}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr" // Mobile: 1 column
                    : isTablet
                    ? "repeat(2, 1fr)" // Tablet: 2 columns
                    : "repeat(auto-fill, minmax(300px, 1fr))", // Desktop: Auto-fit với min 300px
                  gap: isMobile ? "12px" : isTablet ? "16px" : "20px",
                  marginTop: isMobile ? "12px" : "16px",
                }}
              >
                {forexData.map((item) => renderSignalCard(item))}
              </div>
            </div>

            {/* Stocks Section */}
            <div>
              <SectionHeader
                t={t}
                isMobile={isMobile}
                iconBg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                title="Chỉ Số, Chứng Khoán"
                subtitle="Indices & Stocks"
                count={stocksData.length}
                countBg="rgba(245,158,11,0.12)"
                countBorder={t.accentYellowBorder}
                countColor={t.accentYellow}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr" // Mobile: 1 column
                    : isTablet
                    ? "repeat(2, 1fr)" // Tablet: 2 columns
                    : "repeat(auto-fill, minmax(300px, 1fr))", // Desktop: Auto-fit
                  gap: isMobile ? "12px" : isTablet ? "16px" : "20px",
                  marginTop: isMobile ? "12px" : "16px",
                }}
              >
                {stocksData.map((item) => renderSignalCard(item))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      {/* <div style={{
        padding: isMobile ? '0 16px 16px' : isTablet ? '0 20px 20px' : '0 24px 24px',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '16px',
      }}>
        {[
          { icon: '🏢', label: 'Brokers', value: '24', color: '#10b981' },
          { icon: '📡', label: 'Signals', value: '13', color: '#10b981' },
          { icon: '🔥', label: 'Hot', value: '7', color: '#ef4444', badge: 'HOT' },
          { icon: '⚡', label: 'Spread 0', value: '0', color: '#f59e0b', badge: 'ZERO' },
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: t.panelBg,
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
            border: `1px solid ${t.border}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {stat.badge && (
              <div style={{
                position: 'absolute',
                top: isMobile ? '8px' : '12px',
                right: isMobile ? '8px' : '12px',
                padding: isMobile ? '3px 6px' : '4px 8px',
                background: stat.color,
                borderRadius: '6px',
                color: '#fff',
                fontSize: isMobile ? '9px' : '10px',
                fontWeight: 700,
              }}>
                {stat.badge}
              </div>
            )}
            <div style={{ fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px', marginBottom: isMobile ? '6px' : '8px' }}>
              {stat.icon}
            </div>
            <div style={{ color: t.muted, fontSize: isMobile ? '11px' : '13px', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ color: stat.color, fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px', fontWeight: 700 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div> */}

      {/* CSS Animations */}
      <style>{`

       .active-row > td {
    background-color: #d4f8d0 !important; /* Màu xanh nhạt */
    font-weight: bold;
    transition: background-color 0.2s ease-in-out;
  }

  .active-row:hover > td {
    background-color: #c6f3c2 !important; /* Hover màu đậm hơn */
  }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: ${t.panelBg};
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: ${t.accentIndigo};
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${t.accentPurple};
        }

        /* Touch feedback for mobile */
        @media (hover: none) and (pointer: coarse) {
          button:active {
            transform: scale(0.95);
          }
        }

        /* Prevent text selection on buttons */
        button {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        /* Ant Design Table responsive */
        .ant-table-wrapper {
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .ant-table {
            font-size: 12px;
          }
          .ant-table-thead > tr > th {
            padding: 8px 4px;
          }
          .ant-table-tbody > tr > td {
            padding: 8px 4px;
          }
        }

         /* Scrollbar light theme */
    .light-scroll::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .light-scroll::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 6px;
    }
    .light-scroll::-webkit-scrollbar-thumb {
      background: #c8c8c8;
      border-radius: 6px;
    }
    .light-scroll::-webkit-scrollbar-thumb:hover {
      background: #b5b5b5;
    }
      `}</style>
    </div>
  );
};

// Section Components with responsive props
const SectionHeader = ({
  t,
  isMobile,
  iconBg,
  title,
  subtitle,
  count,
  countBg,
  countBorder,
  countColor,
}: {
  t: Theme;
  isMobile: boolean;
  iconBg: string;
  title: string;
  subtitle: string;
  count: number;
  countBg: string;
  countBorder: string;
  countColor: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "8px" : "12px",
      marginBottom: isMobile ? "16px" : "20px",
      padding: isMobile ? "12px 16px" : "16px 20px",
      background: t.panelBg,
      borderRadius: isMobile ? "10px" : "12px",
      border: `1px solid ${t.border}`,
    }}
  >
    <div
      style={{
        width: isMobile ? "32px" : "40px",
        height: isMobile ? "32px" : "40px",
        background: iconBg,
        borderRadius: isMobile ? "8px" : "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: isMobile ? "16px" : "20px" }}>💱</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          color: t.title,
          fontSize: isMobile ? "16px" : "18px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </div>
      <div style={{ color: t.muted, fontSize: isMobile ? "11px" : "12px" }}>
        {subtitle}
      </div>
    </div>
    <div
      style={{
        padding: isMobile ? "4px 10px" : "6px 12px",
        background: countBg,
        border: `1px solid ${countBorder}`,
        borderRadius: "6px",
        color: countColor,
        fontSize: isMobile ? "13px" : "14px",
        fontWeight: 700,
      }}
    >
      {count}
    </div>
  </div>
);

const SectionTitle = ({
  t,
  isMobile,
  iconBg,
  title,
  subtitle,
  count,
  countBg,
  countBorder,
  countColor,
}: {
  t: Theme;
  isMobile: boolean;
  iconBg: string;
  title: string;
  subtitle: string;
  count: number;
  countBg: string;
  countBorder: string;
  countColor: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "8px" : "12px",
      marginBottom: isMobile ? "12px" : "16px",
    }}
  >
    <div
      style={{
        width: isMobile ? "32px" : "40px",
        height: isMobile ? "32px" : "40px",
        background: iconBg,
        borderRadius: isMobile ? "8px" : "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: isMobile ? "16px" : "20px" }}>📈</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          color: t.title,
          fontSize: isMobile ? "16px" : "18px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </div>
      <div style={{ color: t.muted, fontSize: isMobile ? "11px" : "12px" }}>
        {subtitle}
      </div>
    </div>
    <div
      style={{
        padding: isMobile ? "4px 10px" : "6px 12px",
        background: countBg,
        border: `1px solid ${countBorder}`,
        borderRadius: "6px",
        color: countColor,
        fontSize: isMobile ? "13px" : "14px",
        fontWeight: 700,
      }}
    >
      {count}
    </div>
  </div>
);

// Helper Icons
const UserIcon = ({ muted = "#94a3b8" }: { muted?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke={muted}
    strokeWidth="2"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#10b981"
    strokeWidth="3"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default Price;
