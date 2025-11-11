import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Modal, Space, Tag, Tooltip } from 'antd';
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
  MenuOutlined,
} from '@ant-design/icons';
import AutocompleteSearch from '../Components/Autocomplete';
import CustomModal from './../Components/CustomModal'; 
import type { TableProps } from 'antd';
import { Table, Drawer } from 'antd';

//Icon
import {BidPriceIcon ,LongCandleIcon } from '../Helpers/icon';


//Helpers
import { numberFmt, parseDotDate, BrokerRow, freshnessColor } from '../Helpers/type.table';

//WebSocket
import { useWebSocketAnalysis } from '../Hooks/ws.analysis';
import { useWebSocketBrokers } from '../Hooks/ws.brokers';
import { useWebSocketBrokerInfo } from '../Hooks/ws.broker.info';
import { useWebSocketSymbols } from '../Hooks/ws.symbol.brokers';

type ViewMode = 'grid' | 'list';

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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [url_ws_brokerinfo, setUrlWsBrokerInfo] = useState('');
  const [openModalInfo, setOpenModalInfo] = useState(false);
  const [dataBrokerInfo, setDataBrokerInfo] = useState<any>([]);
  const [nameDrawer, setNameDrawer] = useState('Broker Không Tồn Tại');
  const [openModalBrokerInfo, setOpenModalBrokerInfo] = useState(false);
  const [modalOpenSymbol, setModalOpenSymbol] = useState(false);

  // 🔥 Responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onClose = () => {
    setOpenModalBrokerInfo(false);
  };

  // Responsive columns for broker table
  const columns: TableProps['columns'] = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (text, record) => <a>{record.index}</a>,
      sorter: (a, b) => a.broker.localeCompare(b.broker),
      width: isMobile ? 50 : 60,
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
      fixed: isMobile ? undefined : 'left',
    },
    {
      title: 'Type',
      dataIndex: 'typeaccount',
      key: 'typeaccount',
      render: (text, record: any) => (
        <div style ={{ textAlign: 'center' }}>
          <a onClick={() => console.log('Open type account:', record.typeaccount)}>{text}</a>
        </div>
      ),
      sorter: (a: any, b: any) => a.typeaccount.localeCompare(b.typeaccount),
      fixed: isMobile ? undefined : 'left',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (v) => (
        <div style={{ textAlign: 'center' }}>
          <Tag color="geekblue">v{v}</Tag>
        </div>
      ),
      width: isMobile ? 80 : 100,
      align: 'center' as const,
    },
    {
      title: 'Port',
      dataIndex: 'port',
      key: 'port',
      align: 'center' as const,
      width: isMobile ? 70 : 90,
      render: (v) => (
        <div style={{ textAlign: 'center' }}>
          <Tag color="geekblue">{v}</Tag>
        </div>
      ),
      sorter: (a, b) => Number(a.port) - Number(b.port),
    },
    {
      title: 'Symbols',
      key: 'symbols',
      align: 'right' as const,
      width: isMobile ? 50 : 80,
      render: (_, r) => (
        <div style={{ textAlign: 'center' }}>
          <Tooltip title={`totalsymbol: ${r.totalsymbol}`} >
            <Tag
              style={{ cursor: 'pointer' }}
              color="tomato"
              onClick={() => {
                setNameDrawer(r.broker);
                setUrlWsBrokerInfo(`ws://116.105.227.149:2002/symbols-broker-info?broker=${r.broker_}`);
                handleClickInfo_Broker();
              }}
            >
              {numberFmt(r.symbolCount)}
            </Tag>
          </Tooltip>
        </div>
      ),
      sorter: (a, b) => a.symbolCount - b.symbolCount,
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      width: isMobile ? 100 : 140,
      render: (_, r) => (
        <div style={{ textAlign: 'center' }}>
            <Tag style = {{ width: isMobile ? 80 : 140 , textAlign: 'center' }} color={r.status === 'True' ? 'green' : 'red'}>
              {r.status === 'True' ? 'Connected' : r.status}
            </Tag>
        </div>
      ),
      sorter: (a, b) => a.symbolCount - b.symbolCount,
    },
    {
      title: 'Time Now',
      dataIndex: 'timecurent',
      key: 'timecurent',
      render: (t: any) => (
        <Tooltip title={t}>
          <span>{t?.replace('.', '/').replace('.', '/')}</span>
        </Tooltip>
      ),
      width: 180,
    },
    ...(isMobile ? [] : [{
      title: 'Last Updated',
      dataIndex: 'timeUpdated',
      key: 'timeUpdated',
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
    }]),
    {
      title: 'Action',
      key: 'action',
      fixed: isMobile ? undefined : 'right',
      render: (_, record) => (
        <Space size="middle" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button 
            type="primary" 
            size={isMobile ? 'small' : 'middle'}
            onClick={() => console.log('Connect', record.broker, record.port)}
          >
            Reset
          </Button>
        </Space>
      ),
      width: isMobile ? 80 : 140,
    },
  ];

  const columns_symbols: TableProps['columns'] = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (text: any, record: any) => <a>{record.index}</a>,
      fixed: isMobile ? undefined : 'left',
      width: isMobile ? 50 : 60,
    },
    {
      title: 'Broker',
      dataIndex: 'broker',
      key: 'broker',
      render: (text: any, record: any) => (
        <Space size={6}>
          <Badge status="processing" />
          <a onClick={() => console.log('Open broker:', record.broker)}>{text}</a>
        </Space>
      ),
      sorter: (a: any, b: any) => a.broker.localeCompare(b.broker),
      fixed: isMobile ? undefined : 'left',
    },
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: any, record: any) => (
        <div style={{
          color: "#aa05b9",
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: isMobile ? '2px 4px' : '4px 8px',
          borderRadius: '4px',
        }}>
          <Tooltip title={record.symbol_raw !== record.symbol ? `Raw: ${record.symbol_raw}` : `Raw: ${record.symbol_raw}`}>
            <span>{text}</span>
          </Tooltip>
        </div>
      ),
      sorter: (a: any, b: any) => a.bid.localeCompare(b.bid),
      fixed: isMobile ? undefined : 'left',
    },
      {
        title: 'Bid',
        dataIndex: 'bid',
        key: 'bid',
        render: (text: any) => (
          <div style={{
            color: "#d90606",
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => Number(a.bid) - Number(b.bid),
      },
      {
        title: 'Bid Fix',
        dataIndex: 'bid_mdf',
        key: 'bid_mdf',
        render: (text: any) => (
          <div style={{
            color: "#d90606",
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => Number(a.bid_mdf) - Number(b.bid_mdf),
      },
      {
        title: 'Ask',
        dataIndex: 'ask',
        key: 'ask',
        render: (text: any) => (
          <div style={{
            color: "#066098",
            fontSize: '14px',
            fontWeight: 500,
            textAlign: 'center',
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => Number(a.ask) - Number(b.ask),
      },
      {
        title: 'Ask Fix',
        dataIndex: 'ask_mdf',
        key: 'ask_mdf',
        render: (text: any) => (
          <div style={{
            color: "#058569",
            fontSize: '14px',
            fontWeight: 500,
            textAlign: 'center',
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => Number(a.ask_mdf) - Number(b.ask_mdf),
      },
      {
        title: 'Spread',
        dataIndex: 'spread',
        key: 'spread',
        render: (text: any) => (
          <div style={{
            color: "#065ed9",
            fontSize: '14px',
            fontWeight: 500,
            textAlign: 'center',
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => Number(a.spread) - Number(b.spread),
      },
      {
  title: 'Long Candle',
  dataIndex: 'longcandle',
  key: 'longcandle',
  render: (text: any) => (
    <div style={{
      display: 'flex',              // ✅ Flexbox
      alignItems: 'center',         // ✅ Vertical center
      justifyContent: 'center',     // ✅ Horizontal center
      gap: '2px',                   // ✅ Spacing giữa icon và text
    }}>
      <LongCandleIcon size={14} color="#06c7d9" />
      <span style={{ 
        color: '#d90653',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1,              // ✅ Remove extra line height
      }}>{text} - Point
      </span>
    </div>
  ),
  sorter: (a: any, b: any) => Number(a.longcandle) - Number(b.longcandle),
  align: 'center' as const,
},
    {
      title: 'Action',
      key: 'action',
      fixed: isMobile ? undefined : 'right',
      render: (_, record) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button 
            type="primary" 
            size="small"
            onClick={() => console.log('Setting', record)}
          >
            {isMobile ? 'Set' : 'Setting'}
          </Button>
        </Space>
      ),
      width: isMobile ? 60 : 140,
    },
  ];

  const columns_broker_info: TableProps['columns'] = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => <a>{index + 1}</a>,
      width: isMobile ? 50 : 60,
    },
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text, record) => (
        <div style={{
          color: "#049196",
          fontSize: isMobile ? '13px' : '15px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: isMobile ? '60px' : '80px',
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
      sorter: (a: any, b: any) => a.symbol.localeCompare(b.symbol),
      fixed: isMobile ? undefined : 'left',
    },
    {
      title: 'Bid',
      dataIndex: 'bid',
      key: 'bid',
      render: (text) => (
        <div style={{
          color: "#d90606",
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: 500,
        }}>
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => Number(a.bid) - Number(b.bid),
      fixed: isMobile ? undefined : 'left',
    },
    {
      title: 'Ask',
      dataIndex: 'ask',
      key: 'ask',
      render: (text) => (
        <div style={{
          color: "#07a6c6",
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: 500,
        }}>
          <span>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.ask.localeCompare(b.ask),
      fixed: isMobile ? undefined : 'left',
    },
      {
        title: 'Bid Fix',
        dataIndex: 'bid_mdf',
        key: 'bid_mdf',
        render: (text: any) => (
          <div style={{
            color: "#f09b55",
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => a.bid_mdf.localeCompare(b.bid_mdf),
      },
      {
        title: 'Ask Fix',
        dataIndex: 'ask_mdf',
        key: 'ask_mdf',
        render: (text: any) => (
          <div style={{
            color: "#5aedef",
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => a.ask_mdf.localeCompare(b.ask_mdf),
      },
      {
        title: 'Time Current',
        dataIndex: 'timecurrent',
        key: 'timecurrent',
        render: (text: any) => (
          <div style={{
            color: "#df5008",
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <span>{text}</span>
          </div>
        ),
        sorter: (a: any, b: any) => a.timecurrent.localeCompare(b.timecurrent),
      },
    {
  title: 'Time Trade',
  dataIndex: 'trade',
  key: 'trade',
  align: 'center' as const,
  render: (_text, record) => {
    try {
      const safeToString = (value: any): string => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      };

      // ✅ Case 1: trade !== "TRUE" → Hiển thị "Close", Tooltip = record.trade
      if (record.trade !== 'TRUE') {
        if (isMobile) {
          return (
            <Tooltip title={`Status: ${safeToString(record.trade)}`}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#dc2626',
                  whiteSpace: 'nowrap',
                }}
              >
                ✕
              </span>
            </Tooltip>
          );
        }

        return (
          <Tooltip title={`Trade Status: ${safeToString(record.trade)}`} placement="topLeft">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1.5px solid #ef4444',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#ef4444',
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#dc2626',
                  whiteSpace: 'nowrap',
                }}
              >
                Close
              </span>
            </div>
          </Tooltip>
        );
      }

      // ✅ Case 2: trade === "TRUE" → Hiển thị timetrade có status = true
      const sessions = Array.isArray(record.timetrade)
        ? record.timetrade
        : [];

      const active = sessions.find(
        (s) => String(s?.status || '').toLowerCase() === 'true'
      );

      // Mobile version
      if (isMobile) {
        const hasActiveSession = !!active;
        return (
          <Tooltip 
            title={
              hasActiveSession 
                ? `Open: ${safeToString(active.open)} - ${safeToString(active.close)}` 
                : 'No active session'
            }
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: hasActiveSession ? '#16a34a' : '#f59e0b',
                whiteSpace: 'nowrap',
              }}
            >
              {hasActiveSession ? '✓' : '⚠️'}
            </span>
          </Tooltip>
        );
      }

      // Desktop version
      const label = active
        ? `${safeToString(active.open)} - ${safeToString(active.close)}`
        : 'No Active Session';

      // Tooltip content - Show all sessions
      const tooltipContent = sessions.length > 0 ? (
        <div style={{ lineHeight: 1.8, minWidth: 250 }}>
          <div style={{ 
            fontWeight: 700,
            fontSize: '13px',
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            📊 Trading Sessions
          </div>
          {sessions.map((s, idx) => {
            const isActive = String(s?.status || '').toLowerCase() === 'true';
            return (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  marginBottom: 4,
                  borderRadius: 4,
                  background: isActive 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : 'rgba(100, 116, 139, 0.1)',
                }}
              >
                <Badge status={isActive ? 'success' : 'default'} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#10b981' : '#94a3b8',
                  flex: 1,
                }}>
                  {safeToString(s?.open)} - {safeToString(s?.close)}
                </span>
                {isActive && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 700,
                  }}>
                    ACTIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          No sessions configured
        </span>
      );

      const color = active ? '#16a34a' : '#f59e0b';

      return (
        <Tooltip 
          title={tooltipContent}
          placement="topLeft"
          overlayStyle={{ maxWidth: 400 }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              background: active
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
              border: `1.5px solid ${color}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = active
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : '0 4px 12px rgba(245, 158, 11, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                boxShadow: active
                  ? '0 0 8px rgba(16, 185, 129, 0.6)'
                  : '0 0 8px rgba(245, 158, 11, 0.6)',
                animation: active ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
        </Tooltip>
      );
    } catch (error) {
      console.error('Time Trade render error:', error, record);
      return (
        <Tooltip title="Error loading trade sessions">
          <span style={{ 
            color: '#ef4444', 
            fontSize: '12px',
            fontWeight: 500,
          }}>
            ⚠️ Error
          </span>
        </Tooltip>
      );
    }
  },
  sorter: (a: any, b: any) => {
    try {
      const aValue = String(a?.trade || '');
      const bValue = String(b?.trade || '');
      return aValue.localeCompare(bValue);
    } catch (error) {
      return 0;
    }
  },
  fixed: isMobile ? undefined : 'left',
  width: isMobile ? 60 : 180,
},
    {
      title: 'Action',
      key: 'action',
      fixed: isMobile ? undefined : 'right',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => console.log('Connect', record)}
        >
          {isMobile ? '→' : 'Connect'}
        </Button>
      ),
      width: isMobile ? 50 : 140,
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
    setActiveTab(symbol || '');
    setModalOpenSymbol(prev => !prev);
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
    handle_setModalSymbols(value);
  };

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

  const handleClickInfo = () => {
    setOpenModalInfo(prev => !prev);
  };

  const handleClickInfo_Broker = () => {
    setOpenModalBrokerInfo(prev => !prev);
  };

  const t = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  const forexData = [
    { id: 1, provider: 'IC Markets', pair: 'EURUSD', exchange: 'Pepper', followers: '1.3k', score: 12, time: '08:15:38', action: 'BUY', online: true },
    { id: 2, provider: 'XM Global', pair: 'XAUUSD', exchange: 'Exness', followers: '3.5k', score: 25, time: '08:12:45', action: 'SELL', online: false },
    { id: 3, provider: 'FBS', pair: 'BTCUSD', exchange: 'Binance', followers: '890', score: 8, time: '08:18:20', action: 'BUY', online: true },
    { id: 4, provider: 'Exness', pair: 'GBPUSD', exchange: 'IC Mkts', followers: '2.1k', score: 15, time: '08:09:12', action: 'SELL', online: false },
    { id: 5, provider: 'Pepperstone', pair: 'EURJPY', exchange: 'XM', followers: '1.9k', score: 18, time: '08:13:55', action: 'BUY', online: false },
    { id: 6, provider: 'AvaTrade', pair: 'USDJPY', exchange: 'FBS', followers: '920', score: 10, time: '08:17:38', action: 'SELL', online: true },
  ];

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
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '16px' : '20px',
        border: `1px solid ${t.border}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = t.cardHoverBg;
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = t.cardBg;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {item.online && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '10px' : '12px',
          right: isMobile ? '10px' : '12px',
          width: isMobile ? '8px' : '10px',
          height: isMobile ? '8px' : '10px',
          background: '#10b981',
          borderRadius: '50%',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
          animation: 'pulse 2s infinite',
        }} />
      )}

      <div style={{
        color: t.accentPurple,
        fontSize: isMobile ? '14px' : '16px',
        fontWeight: 700,
        marginBottom: isMobile ? '6px' : '8px',
      }}>
        {item.provider}
      </div>

      <div style={{
        color: t.title,
        fontSize: isMobile ? '20px' : '24px',
        fontWeight: 700,
        marginBottom: isMobile ? '10px' : '12px',
      }}>
        {item.pair}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '10px' : '12px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ color: t.muted, fontSize: isMobile ? '12px' : '13px' }}>{item.exchange}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.text, fontSize: isMobile ? '12px' : '13px' }}>
          <UserIcon muted={t.muted} />
          {item.followers}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '12px' : '16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: isMobile ? '4px 10px' : '6px 12px',
          background: 'rgba(16, 185, 129, 0.12)',
          borderRadius: '6px',
          border: '1px solid rgba(16,185,129,0.25)',
        }}>
          <ArrowUpIcon />
          <span style={{ color: '#10b981', fontSize: isMobile ? '13px' : '14px', fontWeight: 700 }}>{item.score}</span>
        </div>
        <div style={{ color: t.muted, fontSize: isMobile ? '11px' : '12px' }}>{item.time}</div>
      </div>

      <button
        style={{
          width: '100%',
          padding: isMobile ? '10px' : '12px',
          background: item.action === 'BUY'
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: item.action === 'BUY'
            ? '0 4px 12px rgba(59, 130, 246, 0.3)'
            : '0 4px 12px rgba(239, 68, 68, 0.3)',
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
        gridTemplateColumns: isMobile
          ? '30px 1fr 70px' // Mobile: STT, Info, Action
          : isTablet
          ? '20px minmax(80px, 1fr) minmax(60px, 1fr) 70px 80px 90px' // Tablet
          : '20px minmax(100px, 1fr) minmax(80px, 1fr) minmax(50px, 1fr) 90px 90px 100px 100px', // Desktop
        alignItems: 'center',
        gap: isMobile ? '8px' : '12px',
        padding: isMobile ? '12px' : isTablet ? '12px 16px' : '14px 20px',
        background: index % 2 === 0 ? t.rowEven : t.rowOdd,
        borderRadius: isMobile ? '8px' : '10px',
        marginBottom: isMobile ? '8px' : '6px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        border: `1px solid ${t.border}`,
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = t.rowHover;
          e.currentTarget.style.borderColor = t.accentIndigo;
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = index % 2 === 0 ? t.rowEven : t.rowOdd;
          e.currentTarget.style.borderColor = t.border;
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {isMobile ? (
        <>
          {/* STT */}
          <div style={{ color: t.muted, fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
            {index + 1}
          </div>

          {/* Info Column - Stack all info */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {item.online && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: '#10b981',
                  borderRadius: '50%',
                  flexShrink: 0,
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                }} />
              )}
              <span style={{
                color: t.accentPurple,
                fontSize: '13px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.broker || item.provider}
              </span>
            </div>

            <div style={{
              color: t.title,
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '4px',
            }}>
              {item.symbol || item.pair}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
              <span style={{ color: t.muted }}>{item.brokerCheck || item.exchange}</span>
              <span style={{ color: t.accentIndigo, fontWeight: 600 }}>
                {item.distan || item.followers}
              </span>
              <span style={{ color: t.muted }}>{item.time}</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            style={{
              padding: '6px 12px',
              background: (item.type === 'BUY' || item.action === 'BUY')
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {item.type || item.action}
          </button>
        </>
      ) : (
        <>
          {/* Desktop/Tablet layout */}
          <div style={{ color: t.muted, fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>
            {index + 1}
          </div>

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
              fontSize: isTablet ? '13px' : '14px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.broker || item.provider}
            </span>
          </div>

          <div style={{
            color: t.title,
            fontSize: isTablet ? '14px' : '15px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.symbol || item.pair}
          </div>

          {!isTablet && (
            <>
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
            </>
          )}

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
              fontSize: isTablet ? '12px' : '13px',
              fontWeight: 700,
            }}>
              {item.spread || item.score}
            </span>
          </div>

          {!isTablet && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: t.muted, fontSize: '12px', fontWeight: 500 }}>
              <ClockIcon />
              <span>{item.time}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              style={{
                padding: isTablet ? '6px 16px' : '8px 24px',
                background: (item.type === 'BUY' || item.action === 'BUY')
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isTablet ? '12px' : '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: (item.type === 'BUY' || item.action === 'BUY')
                  ? '0 4px 12px rgba(59, 130, 246, 0.35)'
                  : '0 4px 12px rgba(239, 68, 68, 0.35)',
                minWidth: isTablet ? '60px' : '80px',
              }}
            >
              {item.type || item.action}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 0 }}>
      {/* Modal Thông Tin Broker */}
      <Modal
        width={isMobile ? '90%' : isTablet ? '80%' : '70%'}
        open={openModalInfo}
        onCancel={() => setOpenModalInfo(false)}
        title={isMobile ? "Thông Tin Sàn" : "Thông Tin Các Sàn Giao Dịch Đang Kết Nối"}
        // isDark={isDark}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={Array.isArray(dataBrokerInfo) ? dataBrokerInfo : []}
            scroll={{ x: isMobile ? 600 : 'max-content' }}
            pagination={{ pageSize: isMobile ? 5 : 10, simple: isMobile }}
            size={isMobile ? 'small' : 'middle'}
          />
        </div>
      </Modal>



      {/* Modal Thông Tin Symbols */}
      <Modal
        width={isMobile ? '90%' : isTablet ? '80%' : '70%'}
        open={modalOpenSymbol}
        onCancel={() => setModalOpenSymbol(false)}
        title={isMobile ? `CHI TIẾT SYMBOL: ${activeTab}` : `CHI TIẾT SYMBOL: ${activeTab}`}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns_symbols}
            dataSource={Array.isArray(symbols) ? symbols : []}
            scroll={{ x: isMobile ? 500 : 'max-content' }}
            pagination={{ pageSize: isMobile ? 5 : 10, simple: isMobile }}
            size={isMobile ? 'small' : 'middle'}
          />
        </div>
      </Modal>

      {/* Drawer */}
      <Drawer
        title={
          <span style={{ fontSize: isMobile ? '14px' : '16px' }}>
            <span style={{ color: '#04a781', fontWeight: 600 }}>Broker:</span>{' '}
            <span style={{ color: '#a6058e', fontWeight: 600 }}>{nameDrawer}</span>
          </span>
        }
        closable
        onClose={onClose}
        open={openModalBrokerInfo}
        width={isMobile ? '100%' : isTablet ? '85%' : '70%'}
        placement={isMobile ? 'bottom' : 'right'}
        height={isMobile ? '85%' : undefined}
        style={{
          borderRadius: isMobile ? '16px 16px 0 0' : '12px 0px 0px 12px',
          background: '#fff',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns_broker_info}
            dataSource={Array.isArray(brokerInfo?.OHLC_Symbols) ? brokerInfo?.OHLC_Symbols : []}
            scroll={{ x: isMobile ? 500 : 'max-content' }}
            pagination={{ pageSize: isMobile ? 5 : 10, simple: isMobile }}
            size={isMobile ? 'small' : 'middle'}
          />
        </div>
      </Drawer>

      {/* Header */}
      <div style={{
        background: t.headerGradient,
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        borderBottom: `1px solid ${t.border}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              background: t.accentPurpleGradient,
              borderRadius: isMobile ? '8px' : '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: isMobile ? '20px' : '24px' }}>📊</span>
            </div>
            {!isMobile && (
              <div>
                <div style={{ color: t.title, fontSize: isTablet ? '16px' : '18px', fontWeight: 700 }}>Price Delay</div>
                <div style={{ color: t.muted, fontSize: '12px' }}>Real-time Signals</div>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  background: viewMode === 'grid' ? t.accentIndigoGradient : t.btnNeutral,
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: viewMode === 'grid' ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                }}
              >
                <AppstoreOutlined style={{ fontSize: isMobile ? '14px' : '16px' }} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  background: viewMode === 'list' ? t.accentIndigoGradient : t.btnNeutral,
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: viewMode === 'list' ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                }}
              >
                <UnorderedListOutlined style={{ fontSize: isMobile ? '14px' : '16px' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            marginTop: isMobile ? '12px' : '16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            paddingBottom: 4,
            paddingRight: 16,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              minWidth: 'max-content',
              flexWrap: 'nowrap',
              gap: isMobile ? '6px' : '8px',
              scrollSnapType: 'x proximity',
              paddingBottom: 2,
            }}
          >
            {analysis?.symbols.map((tab: any, idx: any) => (
              <button
                key={`${tab}-${idx}`}
                onClick={() => handle_setModalSymbols(tab)}
                style={{
                  flex: '0 0 auto',
                  padding: isMobile ? '8px 14px' : isTablet ? '9px 18px' : '10px 20px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  transition: 'all 0.25s ease',
                  whiteSpace: 'nowrap',
                  scrollSnapAlign: 'start',
                  background:
                    activeTab === tab
                      ? t.accentPurpleGradient
                      : isDark
                      ? 'rgba(30, 41, 59, 0.6)'
                      : '#a1cecc',
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
          padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
          background: t.subHeaderBg,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: isMobile ? '1 1 100%' : '1 1 auto', minWidth: isMobile ? '100%' : '200px' }}>
            <AutocompleteSearch
              suggestions={analysis?.symbols || []}
              placeholder="Search..."
              onSearch={handleSearch}
              onSelect={handleSelect}
              theme={t}
            />
          </div>

          {!isMobile && (
            <>
              <button
                onClick={handleClickInfo}
                style={{
                  padding: isTablet ? '8px 16px' : '10px 20px',
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
              >
                <InfoCircleOutlined />
                {!isTablet && 'Info'}
              </button>

              {!isTablet && (
                <>
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
                  >
                    <SettingOutlined />
                    Config
                  </button>

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
                  >
                    <HistoryOutlined />
                    History
                  </button>

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
                  >
                    <ThunderboltOutlined />
                    Spread 0
                  </button>
                </>
              )}

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
              >
                <ReloadOutlined style={{ fontSize: '16px' }} />
              </button>
            </>
          )}

          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                padding: '8px 12px',
                background: t.accentIndigo,
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <MenuOutlined />
              Menu
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobile && showMobileMenu && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: t.panelBg,
            borderRadius: '8px',
            border: `1px solid ${t.border}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}>
            <button
              onClick={handleClickInfo}
              style={{
                padding: '10px',
                background: t.accentIndigo,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <InfoCircleOutlined /> Info
            </button>
            <button
              style={{
                padding: '10px',
                background: t.btnNeutral,
                border: 'none',
                borderRadius: '6px',
                color: t.text,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <SettingOutlined /> Config
            </button>
            <button
              style={{
                padding: '10px',
                background: t.btnNeutral,
                border: 'none',
                borderRadius: '6px',
                color: t.text,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <HistoryOutlined /> History
            </button>
            <button
              style={{
                padding: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ThunderboltOutlined /> Spread 0
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
        display: viewMode === 'grid' ? 'block' : 'grid',
        gridTemplateColumns: viewMode === 'list' ? (isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr') : '1fr',
        gap: isMobile ? '16px' : '24px',
      }}>
        {viewMode === 'list' ? (
          <>
            {/* Left Column - FX, XAU, Crypto */}
            <div style={{
              background: t.panelBg,
              borderRadius: isMobile ? '12px' : '16px',
              padding: isMobile ? '16px' : '20px',
              border: `1px solid ${t.border}`,
            }}>
              <SectionTitle
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
              <div>{forexData.map((item, index) => renderSignalRow(item, index))}</div>
            </div>

            {/* Right Column - Indices & Stocks */}
            <div style={{
              background: t.panelBg,
              borderRadius: isMobile ? '12px' : '16px',
              padding: isMobile ? '16px' : '20px',
              border: `1px solid ${t.border}`,
            }}>
              <SectionTitle
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
              <div>{stocksData.map((item, index) => renderSignalRow(item, index))}</div>
            </div>
          </>
        ) : (
          <div>
            {/* Forex Section */}
            <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: isMobile ? '12px' : '16px'
              }}>
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: isMobile ? '12px' : '16px'
              }}>
                {stocksData.map((item) => renderSignalCard(item))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div style={{
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
      </div>

      {/* CSS Animations */}
      <style>{`
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
      `}</style>
    </div>
  );
};

// Section Components with responsive props
const SectionHeader = ({
  t, isMobile, iconBg, title, subtitle, count, countBg, countBorder, countColor,
}: {
  t: Theme; isMobile: boolean; iconBg: string; title: string; subtitle: string;
  count: number; countBg: string; countBorder: string; countColor: string;
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    marginBottom: isMobile ? '16px' : '20px',
    padding: isMobile ? '12px 16px' : '16px 20px',
    background: t.panelBg,
    borderRadius: isMobile ? '10px' : '12px',
    border: `1px solid ${t.border}`,
  }}>
    <div style={{
      width: isMobile ? '32px' : '40px',
      height: isMobile ? '32px' : '40px',
      background: iconBg,
      borderRadius: isMobile ? '8px' : '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: isMobile ? '16px' : '20px' }}>💱</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        color: t.title,
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {title}
      </div>
      <div style={{ color: t.muted, fontSize: isMobile ? '11px' : '12px' }}>{subtitle}</div>
    </div>
    <div style={{
      padding: isMobile ? '4px 10px' : '6px 12px',
      background: countBg,
      border: `1px solid ${countBorder}`,
      borderRadius: '6px',
      color: countColor,
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: 700,
    }}>
      {count}
    </div>
  </div>
);

const SectionTitle = ({
  t, isMobile, iconBg, title, subtitle, count, countBg, countBorder, countColor,
}: {
  t: Theme; isMobile: boolean; iconBg: string; title: string; subtitle: string;
  count: number; countBg: string; countBorder: string; countColor: string;
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    marginBottom: isMobile ? '12px' : '16px'
  }}>
    <div style={{
      width: isMobile ? '32px' : '40px',
      height: isMobile ? '32px' : '40px',
      background: iconBg,
      borderRadius: isMobile ? '8px' : '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: isMobile ? '16px' : '20px' }}>📈</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        color: t.title,
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {title}
      </div>
      <div style={{ color: t.muted, fontSize: isMobile ? '11px' : '12px' }}>{subtitle}</div>
    </div>
    <div style={{
      padding: isMobile ? '4px 10px' : '6px 12px',
      background: countBg,
      border: `1px solid ${countBorder}`,
      borderRadius: '6px',
      color: countColor,
      fontSize: isMobile ? '13px' : '14px',
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