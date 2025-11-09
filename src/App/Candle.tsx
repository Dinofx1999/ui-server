import React, { use, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Space, Tag, Tooltip } from 'antd';
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
  ReloadOutlined,
} from '@ant-design/icons';
import AutocompleteSearch from '../Components/Autocomplete';
import CustomModal from './../Components/CustomModal'; 
import type { GetProp, TableProps } from 'antd';
import { Table ,Drawer} from 'antd';
import type { SorterResult } from 'antd/es/table/interface';

//Helpers
import { numberFmt, parseDotDate , BrokerRow, freshnessColor } from '../Helpers/type.table';

//WebSocket
import { useWebSocketAnalysis } from '../Hooks/ws.analysis';
import { useWebSocketBrokers } from '../Hooks/ws.brokers';
import { useWebSocketBrokerInfo } from '../Hooks/ws.broker.info';
// import { useWebSocketAnalysis} from '../Hooks/ws.broker.info';
import { text } from 'stream/consumers';
import { useWebSocketSymbols } from '../Hooks/ws.symbol.brokers';



type ViewMode = 'grid' | 'list';

type Theme = {
  // nền & khung
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

  // text
  text: string;
  muted: string;
  title: string;

  // nút trung tính
  btnNeutral: string;
  btnNeutralHover: string;

  // tab chưa active
  tabBg: string;

  // accent - EMERALD THEME
  accentPurple: string;
  accentPurpleGradient: string;
  accentIndigo: string;
  accentIndigoGradient: string;
  accentYellow: string;
  accentYellowBorder: string;
};

const DARK: Theme = {
  bg: '#0a0e27',
  subHeaderBg: '#16213e',
  headerGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  panelBg: 'rgba(30, 41, 59, 0.5)',
  cardBg: 'rgba(30, 41, 59, 0.6)',
  cardHoverBg: 'rgba(51, 65, 85, 0.8)',
  rowEven: 'rgba(30, 41, 59, 0.5)',
  rowOdd: 'rgba(30, 41, 59, 0.3)',
  rowHover: 'rgba(51, 65, 85, 0.7)',
  border: '#334155',
  inputBg: '#0f172a',

  text: '#f3f4f6',
  muted: '#94a3b8',
  title: '#f3f4f6',

  btnNeutral: '#334155',
  btnNeutralHover: '#475569',

  tabBg: '#1e293b',

  // EMERALD THEME 💚
  accentPurple: '#34d399',
  accentPurpleGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  accentIndigo: '#10b981',
  accentIndigoGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  accentYellow: '#fbbf24',
  accentYellowBorder: '#f59e0b',
};

const LIGHT: Theme = {
  bg: '#f5f7fb',
  subHeaderBg: '#ffffff',
  headerGradient: 'linear-gradient(135deg, #e9eef7 0%, #dfe7ff 100%)',
  panelBg: '#ffffff',
  cardBg: '#ffffff',
  cardHoverBg: '#f3f6ff',
  rowEven: '#ffffff',
  rowOdd: '#f9fbff',
  rowHover: '#eef3ff',
  border: '#e5e7eb',
  inputBg: '#ffffff',

  text: '#111827',
  muted: '#6b7280',
  title: '#0f172a',

  btnNeutral: '#eef2f7',
  btnNeutralHover: '#e3e8ef',

  tabBg: '#eef2f7',

  // EMERALD THEME 💚
  accentPurple: '#059669',
  accentPurpleGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  accentIndigo: '#059669',
  accentIndigoGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  accentYellow: '#b45309',
  accentYellowBorder: '#f59e0b',
};

type PriceProps = {
    isDark?: boolean;
};

const Price: React.FC<PriceProps> = ({ isDark }) => {
  const [activeTab, setActiveTab] = useState('EURUSD');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
   

  const [url_ws_brokerinfo, setUrlWsBrokerInfo] = useState('');
  //modal broker info
  const [openModalInfo, setOpenModalInfo] = useState(false);
  const [dataBrokerInfo, setDataBrokerInfo] = useState<any>([]);

  //drawer sản phẩm trong Broker
  const [nameDrawer, setNameDrawer] = useState('Broker Không Tồn Tại');
  const [openModalBrokerInfo, setOpenModalBrokerInfo] = useState(false);

  //modal symbols
  const [modalOpenSymbol, setModalOpenSymbol] = useState(false); 

  const onClose = () => {
    setOpenModalBrokerInfo(false);
  };


 // Nếu bạn chỉ muốn kết nối khi modal mở, tắt autoReconnect
 const columns: TableProps<BrokerRow>['columns'] = [
    {
    title: 'STT',
    dataIndex: 'index',
    key: 'index',
    render: (text, record) => (
        <a >{record.index}</a>
    ),
    sorter: (a, b) => a.broker.localeCompare(b.broker),
    // fixed: 'left',
  },
  {
    title: 'Broker',
    dataIndex: 'broker',
    key: 'broker',
    render: (text, record) => (
      <Space size={6}>
        <Badge status="processing" />
        <a onClick={() => console.log('Open broker:', record.broker)}>{text}</a>
      </Space>
    ),
    sorter: (a, b) => a.broker.localeCompare(b.broker),
    fixed: 'left',
  },
  {
    title: 'Type Account',
    dataIndex: 'typeaccount',
    key: 'typeaccount',
    render: (text, record:any) => (
      <Space size={6}>
        <a onClick={() => console.log('Open type account:', record.typeaccount)}>{text}</a>
      </Space>
    ),
    sorter: (a:any, b:any) => a.typeaccount.localeCompare(b.typeaccount),
    fixed: 'left',
  },
  {
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
    render: (v) => <Tag color="geekblue">v{v}</Tag>,
    width: 100,
    align: 'center' as const,
  },
  {
    title: 'Port',
    dataIndex: 'port',
    key: 'port',
    align: 'center' as const,
    width: 90,
    sorter: (a, b) => Number(a.port) - Number(b.port),
  },
  {
    title: 'Symbols',
    key: 'symbols',
    align: 'right' as const,
    width: 130,
    render: (_, r) => (
      <Space>
        <Tooltip title={`totalsymbol: ${r.totalsymbol}`}>
          <Tag
            style={{ cursor: 'pointer' }}
            color="green"
            onClick={() => {
              setNameDrawer(r.broker);
              setUrlWsBrokerInfo(`ws://116.105.227.149:2002/symbols-broker-info?broker=${r.broker_}`)
              // setOpenModalBrokerInfo(true);
              handleClickInfo_Broker();
            }}
          >
            {numberFmt(r.symbolCount)}
          </Tag>
        </Tooltip>
      </Space>
    ),
    sorter: (a, b) => a.symbolCount - b.symbolCount,
  },
  {
    title: 'Time Now',
    dataIndex: 'timecurent',
    key: 'timecurent',
    render: (t) => (
      <Tooltip title={t}>
        <span>{t?.replace('.', '/').replace('.', '/')}</span>
      </Tooltip>
    ),
    width: 180,
  },
  {
    title: 'Last Updated',
    dataIndex: 'timeUpdated',
    key: 'timeUpdated',
    render: (t) => {
      const d = parseDotDate(t);
      const color = freshnessColor(t);
      return (
        <Space>
          <Badge status={color} />
          <Tooltip title={t}>
            <span>{d ? d.toLocaleString() : t}</span>
          </Tooltip>
        </Space>
      );
    },
    sorter: (a, b) => {
      const da = parseDotDate(a.timeUpdated)?.getTime() ?? 0;
      const db = parseDotDate(b.timeUpdated)?.getTime() ?? 0;
      return da - db;
    },
    width: 220,
  },
  {
    title: 'Action',
    key: 'action',
    fixed: 'right',
    render: (_, record) => (
      <Space size="middle">
         <Button type="primary" onClick={() => console.log('Connect', record.broker, record.port)}>
            Connect
            </Button>
        <Button type="primary" onClick={() => console.log('Connect', record.broker, record.port)}>
            Connect
            </Button>
      </Space>
    ),
    width: 140,
  },
];

 const columns_symbols: TableProps['columns'] = [
    {
    title: 'STT',
    dataIndex: 'index',
    key: 'index',
    render: (text:any, record:any) => (
        <a >{record.index}</a>
    ),
    fixed: 'left',
  },
  {
    title: 'Broker',
    dataIndex: 'broker',
    key: 'broker',
    render: (text:any, record:any) => (
      <Space size={6}>
        <Badge status="processing" />
        <a onClick={() => console.log('Open broker:', record.broker)}>{text}</a>
      </Space>
    ),
    sorter: (a:any, b:any) => a.broker.localeCompare(b.broker),
    fixed: 'left',
  },
  {
    title: 'Symbol',
    dataIndex: 'symbol',
    key: 'symbol',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        <Tooltip title={record.symbol_raw !== record.symbol ? `Raw: ${record.symbol_raw}` : `Raw: ${record.symbol_raw}`}>
          <span>{text}</span>
        </Tooltip>
      </div>
    ),
    sorter: (a:any, b:any) => a.bid .localeCompare(b.bid),
    fixed: 'left',
  },
  {
    title: 'Bid',
    dataIndex: 'bid',
    key: 'bid',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.bid) - Number(b.bid),
    fixed: 'left',
  },
  {
    title: 'Bid Fix',
    dataIndex: 'bid_mdf',
    key: 'bid_mdf',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.bid_mdf) - Number(b.bid_mdf),
    fixed: 'left',
  },
  {
    title: 'Ask',
    dataIndex: 'ask',
    key: 'ask',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.ask) - Number(b.ask),
    fixed: 'left',
  },
  {
    title: 'Ask Fix',
    dataIndex: 'ask_mdf',
    key: 'ask_mdf',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.ask_mdf) - Number(b.ask_mdf),
    fixed: 'left',
  },
  {
    title: 'Long Candle',
    dataIndex: 'longcandle',
    key: 'longcandle',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.longcandle) - Number(b.longcandle),
    fixed: 'left',
  },
  {
    title: 'Spread',
    dataIndex: 'spread',
    key: 'spread',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.spread) - Number(b.spread),
    fixed: 'left',
  },
  {
    title: 'Time Symbol',
    dataIndex: 'timeCrr',
    key: 'timeCrr',
    render: (text:any, record:any) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.timeCrr) - Number(b.timeCrr),
    // fixed: 'left',
  },
  {
    title: 'Action',
    key: 'action',
    fixed: 'right',
    render: (_, record) => (
      <Space size="middle">
         <Button type="primary" onClick={() => console.log('Connect', record.broker, record.port)}>
            Setting
            </Button>
        <Button type="primary" onClick={() => console.log('Connect', record.broker, record.port)}>
            Reset
            </Button>
      </Space>
    ),
    width: 140,
  },
];

 // Nếu bạn chỉ muốn kết nối khi modal mở, tắt autoReconnect
 const columns_broker_info: TableProps['columns'] = [
    {
    title: 'STT',
    dataIndex: 'index',
    key: 'index',
    render: (text, record , index) => (
        <a >{index + 1}</a>
    ),
    // sorter: (a, b) => a.broker.localeCompare(b.broker),
    // fixed: 'left',
  },
  {
    title: 'Symbol',
    dataIndex: 'symbol',
    key: 'symbol',
    render: (text, record) => (
      <div style={{
        color: "#049196",
        fontSize: '15px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '80px',
      }}>
        <Tooltip title={
          <>
            {record.symbol_raw != record.symbol && <span style={{ color: 'red' }}>Raw: {record.symbol_raw}</span>}
            {record.symbol_raw === record.symbol && <span style={{ color: 'green' }}>Raw: {record.symbol_raw}</span>}
          </>
        }>
          <span>{text}</span>
        </Tooltip>
      </div>
    ),
    sorter: (a:any, b:any) => a.symbol.localeCompare(b.symbol),
    fixed: 'left',
  },
  {
    title: 'Bid',
    dataIndex: 'bid',
    key: 'bid',
    render: (text, record) => (
      <div style={{
        color: "#d90606",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => Number(a.bid) - Number(b.bid),
    fixed: 'left',
  },
  {
    title: 'Bid Fix',
    dataIndex: 'bid_mdf',
    key: 'bid_mdf',
    render: (text, record) => (
      <div style={{
        color: "#f09b55",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => a.bid_mdf.localeCompare(b.bid_mdf),
    fixed: 'left',
  },
  {
    title: 'Ask',
    dataIndex: 'ask',
    key: 'ask',
    render: (text, record) => (
      <div style={{
        color: "#07a6c6",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => a.ask.localeCompare(b.ask),
    fixed: 'left',
  },
  {
    title: 'Ask Fix',
    dataIndex: 'ask_mdf',
    key: 'ask_mdf',
    render: (text, record) => (
      <div style={{
        color: "#5aedef",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => a.ask_mdf.localeCompare(b.ask_mdf),
    fixed: 'left',
  },
  {
    title: 'Time Current',
    dataIndex: 'timecurrent',
    key: 'timecurrent',
    render: (text, record) => (
      <div style={{
        color: "#df5008",
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
          <span>{text}</span>
      </div>
    ),
    sorter: (a:any, b:any) => a.timecurrent.localeCompare(b.timecurrent),
    fixed: 'left',
  },
  {
  title: 'Time Trade',
  dataIndex: 'trade',
  key: 'trade',
  render: (_text, record) => {
    const sessions = Array.isArray(record.timetrade)
      ? record.timetrade
      : [];

    // Tìm session đang active (status === "true")
    const active = sessions.find(
      (s) => String(s.status).toLowerCase() === 'true'
    );

    // Nhãn hiển thị chính
    const label =
      record.trade === 'TRUE' && active
        ? `${active.open} - ${active.close}`
        : 'Close Trade';

    // Nội dung Tooltip: list toàn bộ session
    const tooltipContent =
      sessions.length > 0 ? (
        <div style={{ lineHeight: 1.6 }}>
          {sessions.map((s, idx) => {
            const isActive = String(s.status).toLowerCase() === 'true';
            return (
              <div key={idx}>
                <Space size={6}>
                  <Badge status={isActive ? 'success' : 'default'} />
                  <span>
                    {s.open} - {s.close}{' '}
                    <em style={{ color: isActive ? '#16a34a' : '#64748b' }}>
                      ({String(s.status)})
                    </em>
                  </span>
                </Space>
              </div>
            );
          })}
        </div>
      ) : (
        _text
      );

    // Xác định màu text
    const color =
      record.trade === 'TRUE' && active
        ? '#16a34a' // xanh lá khi active
        : '#dc2626'; // đỏ khi Close Trade

    return (
      <Tooltip title={tooltipContent} placement="topLeft">
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block',
            maxWidth: 200,
            color,
          }}
        >
          {label}
        </span>
      </Tooltip>
    );
  },
  sorter: (a: any, b: any) => a.trade.localeCompare(b.trade),
  fixed: 'left',
},

  {
    title: 'Action',
    key: 'action',
    fixed: 'right',
    render: (_, record) => (
      <Space size="middle">
         <Button type="primary" onClick={() => console.log('Connect', record.broker, record.port)}>
            Connect
            </Button>
        <Button type="primary" onClick={() => console.log('Connect', record.broker, record.port)}>
            Connect
            </Button>
      </Space>
    ),
    width: 140,
  },
];

const { brokers, connected_brokers, connect_Brokers, disconnect_Brokers } =
  useWebSocketBrokers('ws://116.105.227.149:2001/broker-info', {
    autoConnect: false,
    autoReconnect: false,
    debug: true,
  });

  const { brokerInfo, connected_brokerInfo, connect_BrokerInfo, disconnect_BrokerInfo } =
  useWebSocketBrokerInfo(url_ws_brokerinfo, {
    autoConnect: false,
    autoReconnect: false,
    debug: true,
  });

  const { analysis, connected_analysis, connect_analysis, disconnect_analysis } =
  useWebSocketAnalysis('ws://116.105.227.149:2003/analysis', {
    autoConnect: true,
    autoReconnect: false,
    debug: true,
  });

   const { symbols, connected_symbols, connect_symbols, disconnect_symbols } =
  useWebSocketSymbols(`ws://116.105.227.149:2000/symbol-brokers?symbol=${activeTab}`, {
    autoConnect: true,
    autoReconnect: false,
    debug: true,
  });


  const handle_setModalSymbols = (symbol: string | null) => {
    // setModalSymbol(symbol);
      setActiveTab(symbol || '');
      setModalOpenSymbol(prev => !prev);
    }

// ✅ chỉ chạy 1 lần khi component được mount
useEffect(() => {
  connect_analysis();
  return () => {
    disconnect_analysis();
  };
}, []); // <-- chỉ chạy 1 lần





// ✅ Kết nối hoặc ngắt kết nối brokers khi modal thay đổi
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

// ✅ Kết nối hoặc ngắt kết nối brokers khi modal thay đổi
useEffect(() => {
  if (modalOpenSymbol) {
    connect_symbols();
  } else {
    disconnect_symbols();
  }
  return () => disconnect_symbols();
}, [modalOpenSymbol, connect_symbols, disconnect_symbols]);

const handleSearch = (value: string) => {
  console.log('Searching:', value);
};

const handleSelect = (value: string) => {
  console.log('Selected:', value);
  // setActiveTab(value);
  handle_setModalSymbols(value);
};

// ✅ Log mỗi khi brokers thay đổi
useEffect(() => {
  if (brokers) {
    setDataBrokerInfo(brokers);
    console.log('📊 Brokers data updated:', brokers);
  }
}, [brokers]);

useEffect(() => {
  if (symbols) {
    console.log('📊 Symbols data updated:', symbols);
  }
}, [symbols]);

useEffect(() => {
  if (brokerInfo) {
    console.log('📊 Brokers data updated 71238:', brokerInfo);
  }
}, [brokerInfo]);

// useEffect(() => {
//   if (analysis) {
//     // connect_analysis();
//     console.log('📊 Analysis data updated:', analysis);
//   }
// }, [analysis]);

// ✅ Chỉ toggle modal; kết nối được điều khiển bởi useEffect ở trên
const handleClickInfo = () => {
  setOpenModalInfo(prev => !prev);
};

const handleClickInfo_Broker = () => {
  setOpenModalBrokerInfo(prev => !prev);
}


  const t = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  // Sample data for FX, XAU, Crypto
  const forexData = [
    { id: 1, provider: 'IC Markets', pair: 'EURUSD', exchange: 'Pepper', followers: '1.3k', score: 12, time: '08:15:38', action: 'BUY', online: true },
    { id: 2, provider: 'XM Global', pair: 'XAUUSD', exchange: 'Exness', followers: '3.5k', score: 25, time: '08:12:45', action: 'SELL', online: false },
    { id: 3, provider: 'FBS', pair: 'BTCUSD', exchange: 'Binance', followers: '890', score: 8, time: '08:18:20', action: 'BUY', online: true },
    { id: 4, provider: 'Exness', pair: 'GBPUSD', exchange: 'IC Mkts', followers: '2.1k', score: 15, time: '08:09:12', action: 'SELL', online: false },
    { id: 5, provider: 'Pepperstone', pair: 'EURJPY', exchange: 'XM', followers: '1.9k', score: 18, time: '08:13:55', action: 'BUY', online: false },
    { id: 6, provider: 'AvaTrade', pair: 'USDJPY', exchange: 'FBS', followers: '920', score: 10, time: '08:17:38', action: 'SELL', online: true },
  ];

  // Sample data for Indices & Stocks
  const stocksData = [
    { id: 1, provider: 'Tickmill', pair: 'USDBRL', exchange: 'Sta', followers: '2.3k', score: 326, time: '08:04:56', action: 'BUY', online: true },
    { id: 2, provider: 'AvaTrade', pair: 'US30', exchange: 'IC', followers: '1.6k', score: 45, time: '08:08:15', action: 'SELL', online: false },
    { id: 3, provider: 'FBS', pair: 'NAS100', exchange: 'Pepper', followers: '980', score: 38, time: '08:11:22', action: 'BUY', online: true },
    { id: 4, provider: 'Exness', pair: 'SPX500', exchange: 'XM', followers: '1.4k', score: 52, time: '08:14:08', action: 'SELL', online: false },
    { id: 5, provider: 'Pepperstone', pair: 'DAX40', exchange: 'AVA', followers: '760', score: 28, time: '08:16:45', action: 'BUY', online: true },
    { id: 6, provider: 'IC Markets', pair: 'FTSE100', exchange: 'FBS', followers: '1.2k', score: 42, time: '08:19:12', action: 'SELL', online: false },
    { id: 7, provider: 'XM Global', pair: 'NIKKEI', exchange: 'Exness', followers: '2.0k', score: 55, time: '08:20:33', action: 'BUY', online: false },
  ];

  const renderSignalCard = (item: any) => (
    <div
      key={item.id}
      style={{
        background: t.cardBg,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${t.border}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.cardHoverBg;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = t.cardBg;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Online Status Badge */}
      {item.online && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '10px',
          height: '10px',
          background: '#10b981',
          borderRadius: '50%',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
          animation: 'pulse 2s infinite',
        }} />
      )}

      {/* Provider */}
      <div style={{
        color: t.accentPurple,
        fontSize: '16px',
        fontWeight: 700,
        marginBottom: '8px',
      }}>
        {item.provider}
      </div>

      {/* Pair */}
      <div style={{
        color: t.title,
        fontSize: '24px',
        fontWeight: 700,
        marginBottom: '12px',
      }}>
        {item.pair}
      </div>

      {/* Exchange & Followers */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{ color: t.muted, fontSize: '13px' }}>{item.exchange}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.text, fontSize: '13px' }}>
          <UserIcon muted={t.muted} />
          {item.followers}
        </div>
      </div>

      {/* Score & Time */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          background: 'rgba(16, 185, 129, 0.12)',
          borderRadius: '6px',
          border: '1px solid rgba(16,185,129,0.25)',
        }}>
          <ArrowUpIcon />
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 700 }}>{item.score}</span>
        </div>
        <div style={{ color: t.muted, fontSize: '12px' }}>{item.time}</div>
      </div>

      {/* Action Button */}
      <button
        style={{
          width: '100%',
          padding: '12px',
          background: item.action === 'BUY' 
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: item.action === 'BUY'
            ? '0 4px 12px rgba(59, 130, 246, 0.3)'
            : '0 4px 12px rgba(239, 68, 68, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = item.action === 'BUY'
            ? '0 8px 20px rgba(59, 130, 246, 0.45)'
            : '0 8px 20px rgba(239, 68, 68, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = item.action === 'BUY'
            ? '0 4px 12px rgba(59, 130, 246, 0.3)'
            : '0 4px 12px rgba(239, 68, 68, 0.3)';
        }}
      >
        {item.action}
      </button>
    </div>
  );

  const renderSignalRow = (item: any, index: number) => (
    <div
      key={item.id}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px minmax(100px, 1fr) minmax(80px, 1fr) minmax(50px, 1fr) 90px 90px 100px 100px',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        background: index % 2 === 0 ? t.rowEven : t.rowOdd,
        borderRadius: '10px',
        marginBottom: '6px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        border: `1px solid ${t.border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.rowHover;
        e.currentTarget.style.borderColor = t.accentIndigo;
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = index % 2 === 0 ? t.rowEven : t.rowOdd;
        e.currentTarget.style.borderColor = t.border;
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* STT */}
      <div style={{ color: t.muted, fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>
        {index + 1}
      </div>

      {/* Broker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {item.online && (
          <div style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            flexShrink: 0,
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
            animation: 'pulse 2s infinite',
          }} />
        )}
        <span style={{
          color: t.accentPurple,
          fontSize: '14px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {item.broker || item.provider}
        </span>
      </div>

      {/* Symbol */}
      <div style={{
        color: t.title,
        fontSize: '15px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {item.symbol || item.pair}
      </div>

      {/* Broker Check */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <div style={{
          width: '6px',
          height: '6px',
          background: item.brokerCheck ? '#10b981' : '#ef4444',
          borderRadius: '50%',
          flexShrink: 0,
        }} />
        <span style={{
          color: t.muted,
          fontSize: '13px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {item.brokerCheck || item.exchange}
        </span>
      </div>

      {/* Distan */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 10px',
        background: 'rgba(16, 185, 129, 0.12)',
        borderRadius: '8px',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      }}>
        <span style={{ color: t.accentIndigo, fontSize: '13px', fontWeight: 700 }}>
          {item.distan || item.followers}
        </span>
      </div>

      {/* Spread / Score */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '6px 10px',
        background: item.spread === '0' || item.score < 10
          ? 'rgba(16, 185, 129, 0.12)'
          : 'rgba(251, 191, 36, 0.12)',
        borderRadius: '8px',
        border: item.spread === '0' || item.score < 10
          ? '1px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(251, 191, 36, 0.25)',
      }}>
        <ArrowUpIcon />
        <span style={{
          color: item.spread === '0' || item.score < 10 ? '#10b981' : t.accentYellow,
          fontSize: '13px',
          fontWeight: 700,
        }}>
          {item.spread || item.score}
        </span>
      </div>

      {/* Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: t.muted, fontSize: '12px', fontWeight: 500 }}>
        <ClockIcon />
        <span>{item.time}</span>
      </div>

      {/* Type (BUY/SELL) */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          style={{
            padding: '8px 24px',
            background: (item.type === 'BUY' || item.action === 'BUY')
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: (item.type === 'BUY' || item.action === 'BUY')
              ? '0 4px 12px rgba(59, 130, 246, 0.35)'
              : '0 4px 12px rgba(239, 68, 68, 0.35)',
            minWidth: '80px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          {item.type || item.action}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 0 }}>
      {/* Modal Thông Tin Broker */}
      <CustomModal
        open={openModalInfo}
        onClose={() => setOpenModalInfo(false)}
        title="Thông Tin Các Sàn Giao Dịch Đang Kết Nối"
        isDark={isDark}
      >
        <Table columns={columns} dataSource={Array.isArray(dataBrokerInfo) ? dataBrokerInfo : []} />
      </CustomModal>
    {/* Modal Thông Tin 1 Symbols của nhiều Broker */}
      <CustomModal
        open={modalOpenSymbol}
        onClose={() => setModalOpenSymbol(false)}
        title="Chi tiết Symbol"
        isDark={isDark}
      >
        <Table columns={columns_symbols} dataSource={Array.isArray(symbols) ? symbols : []} />
      </CustomModal>

      <Drawer
  title={
    <span>
      <span style={{ color: '#04a781', fontWeight: 600 }}>Thông Tin Broker:</span>{' '}
      <span style={{ color: '#a6058e', fontWeight: 600 }}>{nameDrawer}</span>
    </span>
  }
  closable
  onClose={onClose}
  open={openModalBrokerInfo}
  width={'70%'}
  style={{
    borderRadius: '12px 0px 0px 12px',
    background: '#fff',
    borderBottom: '1px solid #f0f0f0',
  }}
>
  <Table columns={columns_broker_info} dataSource={Array.isArray(brokerInfo?.OHLC_Symbols) ? brokerInfo?.OHLC_Symbols : []} />
</Drawer>

      {/* Header */}
      <div style={{ background: t.headerGradient, padding: '16px 24px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: t.accentPurpleGradient,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '24px' }}>📊</span>
            </div>
            <div>
              <div style={{ color: t.title, fontSize: '18px', fontWeight: 700 }}>Price Delay</div>
              <div style={{ color: t.muted, fontSize: '12px' }}>Real-time Signals</div>
            </div>
          </div>

          {/* Right: Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '8px 12px',
                  background: viewMode === 'grid' ? t.accentIndigoGradient : t.btnNeutral,
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: viewMode === 'grid' ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'grid') {
                    e.currentTarget.style.background = t.btnNeutralHover;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'grid') {
                    e.currentTarget.style.background = t.btnNeutral;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <AppstoreOutlined />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 12px',
                  background: viewMode === 'list' ? t.accentIndigoGradient : t.btnNeutral,
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: viewMode === 'list' ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'list') {
                    e.currentTarget.style.background = t.btnNeutralHover;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'list') {
                    e.currentTarget.style.background = t.btnNeutral;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <UnorderedListOutlined />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {/* Tabs — horizontal scroll fully */}
        <div
        style={{
            marginTop: '16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            paddingBottom: 4,
            paddingRight: 16, // chừa mép phải cho item cuối
        }}
        >
        <div
            style={{
            display: 'inline-flex',     // quan trọng
            minWidth: 'max-content',    // quan trọng
            flexWrap: 'nowrap',         // quan trọng
            gap: '8px',
            // nếu trước đó bạn có maskImage gây “cắt” mép, bỏ đi cho chắc:
            // maskImage:
            //   'linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
            scrollSnapType: 'x proximity', // optional
            paddingBottom: 2,
            }}
        >
            {analysis?.symbols.map((tab: any, idx: any) => (
  <button
    key={`${tab}-${idx}`}
    onClick={() => handle_setModalSymbols(tab)}
    style={{
      flex: '0 0 auto',
      padding: '10px 20px',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      transition: 'all 0.25s ease',
      whiteSpace: 'nowrap',
      scrollSnapAlign: 'start',
      background:
        activeTab === tab
          ? t.accentPurpleGradient
          : isDark
          ? 'rgba(30, 41, 59, 0.6)' // nền tối nhẹ
          : '#a1cecc', // sáng nhạt
      color:
        activeTab === tab
          ? '#fff'
          : isDark
          ? '#f3f4f6'
          : '#111827',
      boxShadow:
        activeTab === tab
          ? isDark
            ? '0 4px 12px rgba(16, 185, 129, 0.35)'
            : '0 4px 12px rgba(59, 130, 246, 0.35)'
          : 'none',
    }}
    onMouseEnter={(e) => {
      if (activeTab !== tab) {
        e.currentTarget.style.background = isDark
          ? 'rgba(51, 65, 85, 0.8)'
          : '#f1f5f9';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }
    }}
    onMouseLeave={(e) => {
      if (activeTab !== tab) {
        e.currentTarget.style.background = isDark
          ? 'rgba(30, 41, 59, 0.6)'
          : '#a1cecc';
        e.currentTarget.style.transform = 'translateY(0)';
      }
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
    padding: '16px 24px',
    background: t.subHeaderBg,
    borderBottom: `1px solid ${t.border}`,
  }}
>
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <AutocompleteSearch
      suggestions={analysis?.symbols || []}
      placeholder="Search..."
      onSearch={handleSearch}
      onSelect={handleSelect}
      theme={t}
    />

    {/* --- Info Button --- */}
    <button
      style={{
        padding: '10px 20px',
        background: t.accentIndigo,
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.accentIndigoGradient;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          '0 6px 16px rgba(99, 102, 241, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = t.accentIndigo;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 12px rgba(99, 102, 241, 0.25)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px)';
        e.currentTarget.style.filter = 'brightness(0.9)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
      onClick={handleClickInfo}
    >
      <InfoCircleOutlined />
      Info
    </button>

    {/* --- Config Button --- */}
    <button
      style={{
        padding: '10px 20px',
        background: t.btnNeutral,
        border: 'none',
        borderRadius: '8px',
        color: t.muted,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.btnNeutralHover;
        e.currentTarget.style.color = t.text;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = t.btnNeutral;
        e.currentTarget.style.color = t.muted;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px)';
        e.currentTarget.style.filter = 'brightness(0.9)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <SettingOutlined />
      Config
    </button>

    {/* --- History Button --- */}
    <button
      style={{
        padding: '10px 20px',
        background: t.btnNeutral,
        border: 'none',
        borderRadius: '8px',
        color: t.muted,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.btnNeutralHover;
        e.currentTarget.style.color = t.text;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = t.btnNeutral;
        e.currentTarget.style.color = t.muted;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px)';
        e.currentTarget.style.filter = 'brightness(0.9)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <HistoryOutlined />
      History
    </button>

    {/* --- Spread Button --- */}
    <button
      style={{
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          '0 6px 16px rgba(245, 158, 11, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 12px rgba(245, 158, 11, 0.35)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px)';
        e.currentTarget.style.filter = 'brightness(0.9)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <ThunderboltOutlined />
      Spread 0
    </button>

    {/* --- Reload Button --- */}
    <button
      style={{
        padding: '10px',
        background: t.btnNeutral,
        border: 'none',
        borderRadius: '8px',
        color: t.muted,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.btnNeutralHover;
        e.currentTarget.style.color = t.text;
        e.currentTarget.style.transform = 'rotate(180deg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = t.btnNeutral;
        e.currentTarget.style.color = t.muted;
        e.currentTarget.style.transform = 'rotate(0deg)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.filter = 'brightness(0.9)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <ReloadOutlined style={{ fontSize: '16px' }} />
    </button>
  </div>

  {/* Theme dropdown style */}
  <style>{`
    .search-dropdown .ant-select-item {
      background: ${t.panelBg};
      color: ${t.text};
    }
    .search-dropdown .ant-select-item-option-active {
      background: ${t.btnNeutralHover};
    }
    .search-dropdown .ant-select-item-option-selected {
      background: ${t.accentIndigo};
      color: #fff;
    }
  `}</style>
</div>



      {/* Main Content */}
      <div style={{
        padding: '24px',
        display: viewMode === 'grid' ? 'block' : 'grid',
        gridTemplateColumns: viewMode === 'list' ? '1fr 1fr' : '1fr',
        gap: '24px',
      }}>
        {viewMode === 'list' ? (
          <>
            {/* Left Column - FX, XAU, Crypto */}
            <div style={{
              background: t.panelBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${t.border}`,
            }}>
              <SectionTitle
                t={t}
                iconBg={t.accentPurpleGradient}
                title="FX, XAU, Crypto"
                subtitle="Forex & Commodities"
                count={forexData.length}
                countBg="rgba(16, 185, 129, 0.12)"
                countBorder={t.accentIndigo}
                countColor={t.accentPurple}
              />
              <div>{forexData.map((item, index) => renderSignalRow(item, index))}</div>
            </div>

            {/* Right Column - Indices & Stocks */}
            <div style={{
              background: t.panelBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${t.border}`,
            }}>
              <SectionTitle
                t={t}
                iconBg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                title="Chỉ Số, Chứng Khoán"
                subtitle="Indices & Stocks"
                count={stocksData.length}
                countBg="rgba(245,158,11,0.12)"
                countBorder={t.accentYellowBorder}
                countColor={t.accentYellow}
              />
              <div>{stocksData.map((item, index) => renderSignalRow(item, index))}</div>
            </div>
          </>
        ) : (
          <div>
            {/* Forex Section */}
            <div style={{ marginBottom: '32px' }}>
              <SectionHeader
                t={t}
                iconBg={t.accentPurpleGradient}
                title="FX, XAU, Crypto"
                subtitle="Forex & Commodities"
                count={forexData.length}
                countBg="rgba(16, 185, 129, 0.12)"
                countBorder={t.accentIndigo}
                countColor={t.accentPurple}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {forexData.map((item) => renderSignalCard(item))}
              </div>
            </div>

            {/* Stocks Section */}
            <div>
              <SectionHeader
                t={t}
                iconBg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                title="Chỉ Số, Chứng Khoán"
                subtitle="Indices & Stocks"
                count={stocksData.length}
                countBg="rgba(245,158,11,0.12)"
                countBorder={t.accentYellowBorder}
                countColor={t.accentYellow}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {stocksData.map((item) => renderSignalCard(item))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div style={{
        padding: '0 24px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}>
        {[
          { icon: '🏢', label: 'Brokers', value: '24', color: '#10b981' },
          { icon: '📡', label: 'Signals', value: '13', color: '#10b981' },
          { icon: '🔥', label: 'Hot', value: '7', color: '#ef4444', badge: 'HOT' },
          { icon: '⚡', label: 'Spread 0', value: '0', color: '#f59e0b', badge: 'ZERO' },
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: t.panelBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${t.border}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {stat.badge && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 8px',
                background: stat.color,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
              }}>
                {stat.badge}
              </div>
            )}
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {stat.icon}
            </div>
            <div style={{ color: t.muted, fontSize: '13px', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ color: stat.color, fontSize: '36px', fontWeight: 700 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Small pieces
const SectionHeader = ({
  t, iconBg, title, subtitle, count, countBg, countBorder, countColor,
}: {
  t: Theme; iconBg: string; title: string; subtitle: string;
  count: number; countBg: string; countBorder: string; countColor: string;
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px 20px',
    background: t.panelBg,
    borderRadius: '12px',
    border: `1px solid ${t.border}`,
  }}>
    <div style={{
      width: '40px', height: '40px', background: iconBg, borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '20px' }}>💱</span>
    </div>
    <div>
      <div style={{ color: t.title, fontSize: '18px', fontWeight: 700 }}>{title}</div>
      <div style={{ color: t.muted, fontSize: '12px' }}>{subtitle}</div>
    </div>
    <div style={{
      marginLeft: 'auto',
      padding: '6px 12px',
      background: countBg,
      border: `1px solid ${countBorder}`,
      borderRadius: '6px',
      color: countColor,
      fontSize: '14px',
      fontWeight: 700,
    }}>
      {count}
    </div>
  </div>
);

const SectionTitle = ({
  t, iconBg, title, subtitle, count, countBg, countBorder, countColor,
}: {
  t: Theme; iconBg: string; title: string; subtitle: string;
  count: number; countBg: string; countBorder: string; countColor: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
    <div style={{
      width: '40px', height: '40px', background: iconBg, borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '20px' }}>📈</span>
    </div>
    <div>
      <div style={{ color: t.title, fontSize: '18px', fontWeight: 700 }}>{title}</div>
      <div style={{ color: t.muted, fontSize: '12px' }}>{subtitle}</div>
    </div>
    <div style={{
      marginLeft: 'auto',
      padding: '6px 12px',
      background: countBg,
      border: `1px solid ${countBorder}`,
      borderRadius: '6px',
      color: countColor,
      fontSize: '14px',
      fontWeight: 700,
    }}>
      {count}
    </div>
  </div>
);

// Helper Icons
const UserIcon = ({ muted = '#94a3b8' }: { muted?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default Price;