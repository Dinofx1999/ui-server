import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Table, Button, Tag, message, Spin, AutoComplete } from 'antd';
import { X } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import type { ColumnsType } from 'antd/es/table';

// ============= TYPE DEFINITIONS =============
interface HistoryData {
  _id: string;
  broker: string;
  symbol: string;
  timeStart: string;
  timeEnd: string;
  distance: number;
  spread: number;
  timeDelay: string;
  type: 'SELL' | 'BUY';
}

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ============= COMPONENT =============
const HistoryModal: React.FC<HistoryModalProps> = ({ visible, onClose }) => {
  const [brokerSearch, setBrokerSearch] = useState<string>('');
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  const [pageSize, setPageSize] = useState<number>(10);

  const API_BASE_URL = 'http://116.105.227.149:5000/v1/api';
  const ACCESS_TOKEN = localStorage.getItem('accessToken') || '';

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

  useEffect(() => {
    if (visible) {
      fetchHistoryData();
    }
  }, [visible]);

  const symbolFilters = useMemo(
    () =>
      Array.from(new Set(historyData.map((item:any) => item.Symbol))).map(
        (sym) => ({
          text: sym,
          value: sym,
        })
      ),
    [historyData]
  );

  const BrokerFilters = useMemo(
    () =>
      Array.from(new Set(historyData.map((item:any) => item.Broker))).map(
        (broker) => ({
          text: broker,
          value: broker,
        })
      ),
    [historyData]
  );

  const fetchHistoryData = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/errors/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ACCESS_TOKEN,
        },
        timeout: 10000,
      });
      if (response.data) {
        setHistoryData(response.data);
      } else {
        message.error('Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
      const axiosError = error as AxiosError<ApiResponse<never>>;
      message.error(axiosError.response?.data?.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setBrokerSearch('');
    setSymbolSearch('');
    onClose();
  };

  const columns: ColumnsType<HistoryData> = [
    {
      title: '#',
      key: 'index',
      width: isMobile ? 35 : 50,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (_: unknown, __: HistoryData, index: number) => (
        <div style={{
          width: isMobile ? 20 : 28,
          height: isMobile ? 20 : 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          fontSize: isMobile ? 10 : 12,
          fontWeight: 700,
          color: 'white'
        }}>
          {index + 1}
        </div>
      ),
    },
    {
      title: isMobile ? 'Broker' : <span style={{ color: '#595959', fontWeight: 600 }}>🏢 Broker</span>,
      dataIndex: "Broker",
      key: "Broker",
      width: isMobile ? 90 : 140,

      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <AutoComplete
            style={{ width: 200 }}
            placeholder="🔍 Tìm Broker..."
            options={BrokerFilters.map((broker) => ({ value: broker.value }))}
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
            }}
            onSelect={(value) => {
              setSelectedKeys([value]);
              confirm();
            }}
            allowClear
          />

          <div style={{ marginTop: 12, textAlign: "right" }}>
            <a
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{ 
                color: '#ff4d4f', 
                fontWeight: 500,
                fontSize: 12
              }}
            >
              Xóa bộ lọc
            </a>
          </div>
        </div>
      ),

      onFilter: (value, record:any) =>
        record.Broker.toLowerCase().includes(String(value).toLowerCase()),

      filterIcon: (filtered) => (
        <span style={{ 
          color: filtered ? "#667eea" : "#8c8c8c",
          fontSize: 16
        }}>
          🔍
        </span>
      ),

      render: (text) => (
        <div style={{
          padding: isMobile ? '4px 8px' : '6px 12px',
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          borderRadius: isMobile ? '6px' : '8px',
          border: '1px solid #d9d9ff',
          display: 'inline-block'
        }}>
          <span style={{
            color: "#667eea",
            fontWeight: isMobile ? 600 : 700,
            fontSize: isMobile ? 11 : 14,
            whiteSpace: "nowrap",
          }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      title: isMobile ? 'Symbol' : (
        <span style={{ color: '#595959', fontWeight: 600 }}>
          📈 Sản Phẩm
        </span>
      ),
      dataIndex: "Symbol",
      key: "Symbol",
      width: isMobile ? 90 : 140,

      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <AutoComplete
            style={{ width: 200 }}
            placeholder="🔍 Tìm Symbol..."
            options={symbolFilters.map((sym) => ({ value: sym.value }))}
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
            }}
            onSelect={(value) => {
              setSelectedKeys([value]);
              confirm();
            }}
            allowClear
          />

          <div style={{ marginTop: 12, textAlign: "right" }}>
            <a
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{ 
                color: '#ff4d4f', 
                fontWeight: 500,
                fontSize: 12
              }}
            >
              Xóa bộ lọc
            </a>
          </div>
        </div>
      ),

      onFilter: (value, record:any) =>
        record.Symbol.toLowerCase().includes(String(value).toLowerCase()),

      filterIcon: (filtered) => (
        <span style={{ 
          color: filtered ? "#667eea" : "#8c8c8c",
          fontSize: 16
        }}>
          🔍
        </span>
      ),

      render: (text) => (
        <div style={{
          padding: isMobile ? '4px 8px' : '6px 12px',
          background: 'linear-gradient(135deg, #52c41a15 0%, #95de6415 100%)',
          borderRadius: isMobile ? '6px' : '8px',
          border: '1px solid #b7eb8f',
          display: 'inline-block'
        }}>
          <span style={{
            color: "#52c41a",
            fontWeight: isMobile ? 600 : 700,
            fontSize: isMobile ? 11 : 14,
            whiteSpace: "nowrap",
          }}>
            {text}
          </span>
        </div>
      ),
    },

    {
      title: isMobile ? 'Start' : <span style={{ color: '#595959', fontWeight: 600 }}>🟢 Time Start</span>,
      dataIndex: 'TimeStart',
      key: 'TimeStart',
      width: isMobile ? 110 : 180,
      sorter: (a:any, b:any) => new Date(a.TimeStart).getTime() - new Date(b.TimeStart).getTime(),
      render: (text: string) => (
        <div style={{
          padding: isMobile ? '4px 6px' : '6px 10px',
          background: '#f6ffed',
          borderLeft: isMobile ? '2px solid #52c41a' : '3px solid #52c41a',
          borderRadius: '4px'
        }}>
          <span style={{ 
            color: '#52c41a', 
            fontWeight: isMobile ? 500 : 600, 
            fontSize: isMobile ? 10 : 13,
            fontFamily: 'monospace'
          }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      title: isMobile ? 'End' : <span style={{ color: '#595959', fontWeight: 600 }}>🔴 Time End</span>,
      dataIndex: 'TimeCurrent',
      key: 'TimeCurrent',
      width: isMobile ? 110 : 180,
      sorter: (a:any, b:any) => new Date(a.TimeCurrent).getTime() - new Date(b.TimeCurrent).getTime(),
      render: (text: string) => (
        <div style={{
          padding: isMobile ? '4px 6px' : '6px 10px',
          background: '#fff1f0',
          borderLeft: isMobile ? '2px solid #ff4d4f' : '3px solid #ff4d4f',
          borderRadius: '4px'
        }}>
          <span style={{ 
            color: '#ff4d4f', 
            fontWeight: isMobile ? 500 : 600, 
            fontSize: isMobile ? 10 : 13,
            fontFamily: 'monospace'
          }}>
            {text}
          </span>
        </div>
      ),
    },
    ...(!isMobile ? [
      {
        title: <span style={{ color: '#595959', fontWeight: 600 }}>📏 Khoảng Cách</span>,
        dataIndex: 'KhoangCach',
        key: 'KhoangCach',
        width: 130,
        align: 'center' as const,
        sorter: (a: any, b: any) => a.KhoangCach - b.KhoangCach,
        render: (text: number) => (
          <span style={{ 
            fontWeight: 600, 
            fontSize: 14,
            color: '#1890ff',
            padding: '4px 12px',
            background: '#e6f7ff',
            borderRadius: '6px',
            border: '1px solid #91d5ff'
          }}>
            {text}
          </span>
        ),
      },
    ] : []),
    {
      title: isMobile ? 'Spread' : <span style={{ color: '#595959', fontWeight: 600 }}>💜 Spread</span>,
      dataIndex: 'Spread_main',
      key: 'Spread_main',
      width: isMobile ? 65 : 110,
      align: 'center' as const,
      sorter: (a:any, b:any) => a.Spread_main - b.Spread_main,
      render: (text: number) => (
        <div style={{
          display: 'inline-block',
          padding: isMobile ? '4px 8px' : '6px 14px',
          background: 'linear-gradient(135deg, #d946ef20 0%, #f0abfc20 100%)',
          borderRadius: isMobile ? '6px' : '8px',
          border: '1px solid #d946ef40'
        }}>
          <span style={{ 
            color: '#d946ef', 
            fontWeight: 700, 
            fontSize: isMobile ? 11 : 16
          }}>
            {text}
          </span>
        </div>
      ),
    },
    ...(!isMobile ? [
      {
        title: <span style={{ color: '#595959', fontWeight: 600 }}>⏱️ Time Delay</span>,
        dataIndex: 'Count',
        key: 'Count',
        width: 120,
        align: 'center' as const,
        sorter: (a: any, b: any) => a.Count - b.Count,
        render: (text: string) => (
          <span style={{ 
            fontWeight: 600, 
            fontSize: 13,
            fontFamily: 'monospace',
            color: '#fa8c16',
            padding: '4px 10px',
            background: '#fff7e6',
            borderRadius: '6px',
            border: '1px solid #ffd591'
          }}>
            {text}
          </span>
        ),
      },
    ] : []),
  
    {
      title: isMobile ? 'Trust' : <span style={{ color: '#595959', fontWeight: 600 }}>✅ Trusted</span>,
      key: 'IsStable',
      dataIndex: 'isTrusted',
      width: isMobile ? 60 : 110,
      align: 'center' as const,
      fixed: 'right' as const,

      filters: [
        { text: 'Trusted', value: 'true' },
        { text: 'Not Trusted', value: 'false' },
      ],

      onFilter: (value, record: any) => {
        const boolValue = value === 'true';
        return record.IsStable === boolValue;
      },

      render: (value: boolean) => (
        <Tag 
          color={value ? 'success' : 'error'} 
          style={{ 
            fontWeight: 700,
            fontSize: isMobile ? 9 : 12,
            padding: isMobile ? '2px 6px' : '4px 12px',
            borderRadius: '6px',
            border: 'none'
          }}
        >
          {isMobile ? (value ? '✓' : '✗') : (value ? '✓ Trusted' : '✗ Not Trusted')}
        </Tag>
      ),
    },
    {
      title: isMobile ? 'Alert' : <span style={{ color: '#595959', fontWeight: 600 }}>⚠️ Type Alert</span>,
      key: 'Type',
      dataIndex: 'Type',
      width: isMobile ? 75 : 140,
      align: 'center' as const,

      filters: [
        { text: 'Delay Price', value: 'Delay Price' },
        { text: 'Delay Price Stop', value: 'Delay Price Stop' },
      ],

      onFilter: (value, record: any) => {
        return record.Type === value;
      },

      render: (value: string) => (
        <Tag 
          color={value === 'Delay Price' ? 'processing' : 'warning'} 
          style={{ 
            fontWeight: 700,
            fontSize: isMobile ? 9 : 12,
            padding: isMobile ? '2px 6px' : '4px 12px',
            borderRadius: '6px',
            border: 'none'
          }}
        >
          {isMobile 
            ? (value === 'Delay Price' ? 'Delay' : 'Stop')
            : (value === 'Delay Price' ? '📉 Delay Price' : '🛑 Price Stop')
          }
        </Tag>
      ),
    },
    {
      title: isMobile ? 'Type' : <span style={{ color: '#595959', fontWeight: 600 }}>📊 TYPE</span>,
      dataIndex: 'Messenger',
      key: 'Messenger',
      width: isMobile ? 60 : 100,
      align: 'center' as const,
      filters: [
        { text: 'SELL', value: 'SELL' },
        { text: 'BUY', value: 'BUY' },
      ],
      onFilter: (value, record:any) => record.Messenger === value,
      render: (text: 'SELL' | 'BUY') => (
        <Button
          type="primary"
          danger={text === 'SELL'}
          size={isMobile ? 'small' : 'middle'}
          style={{
            width: isMobile ? 50 : 80,
            fontWeight: 700,
            fontSize: isMobile ? 10 : 13,
            background: text === 'SELL' 
              ? 'linear-gradient(135deg, #ff4d4f 0%, #f5222d 100%)' 
              : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            borderColor: 'transparent',
            pointerEvents: 'none',
            boxShadow: text === 'SELL' 
              ? '0 2px 8px rgba(255, 77, 79, 0.3)' 
              : '0 2px 8px rgba(24, 144, 255, 0.3)',
            borderRadius: isMobile ? '6px' : '8px',
            padding: isMobile ? '0 4px' : undefined
          }}
        >
          {isMobile ? text : (text === 'SELL' ? '📉 SELL' : '📈 BUY')}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 10 : 14,
          padding: isMobile ? '8px 0' : '12px 0'
        }}>
          <div style={{
            width: isMobile ? 42 : 50,
            height: isMobile ? 42 : 50,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.35)'
          }}>
            <span style={{ 
              fontSize: isMobile ? 20 : 24, 
              fontWeight: 700
            }}>
              📊
            </span>
          </div>
          <div>
            <div style={{ 
              fontSize: isMobile ? 17 : 22, 
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.2,
              letterSpacing: '-0.5px'
            }}>
              Lịch Sử Kèo
            </div>
            <div style={{ 
              fontSize: isMobile ? 11 : 13, 
              color: '#8c8c8c',
              fontWeight: 500,
              marginTop: 3
            }}>
              Theo dõi và quản lý lịch sử giao dịch
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={isMobile ? '100%' : isTablet ? 1000 : 1600}
      footer={null}
      closeIcon={
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d4f 0%, #f5222d 100%)';
          e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f5f5f5';
          e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
        }}
        >
          <X size={isMobile ? 17 : 19} />
        </div>
      }
      styles={{
        body: { 
          height: isMobile ? '85vh' : '90vh',
          padding: isMobile ? 12 : 24,
          background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
          overflowY: 'auto',
        }
      }}
      style={isMobile ? { top: 10, margin: '0 8px', maxWidth: 'calc(100% - 16px)' } : { top: 20 }}
    >
      <Spin spinning={loading} tip="Đang tải dữ liệu...">
        <Table<HistoryData>
          columns={columns}
          dataSource={historyData}
          pagination={{ 
            current: undefined,
            pageSize: pageSize,
            onChange: (page, newPageSize) => {
              console.log('Page changed:', page, newPageSize);
              setPageSize(newPageSize);
            },
            onShowSizeChange: (current, size) => {
              console.log('PageSize changed:', size);
              setPageSize(size);
            },
            simple: false,
            hideOnSinglePage: false,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => (
              <div style={{ 
                fontWeight: 600, 
                color: '#595959',
                fontSize: isMobile ? 11 : 13,
                textAlign: 'center',
                width: '100%'
              }}>
                {isMobile 
                  ? `${range[0]}-${range[1]} / ${total}` 
                  : (
                    <>
                      Tổng <span style={{ color: '#667eea', fontWeight: 700 }}>{total}</span> bản ghi
                    </>
                  )
                }
              </div>
            ),
            size: isMobile ? 'small' : 'default',
            responsive: true,
          }}
          scroll={{ 
            x: isMobile ? 800 : 1200
          }}
          size={isMobile ? 'small' : 'middle'}
          bordered
          rowKey={record => record._id}
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
          }
        />
      </Spin>

      <style>{`
        @media (max-width: 767px) {
          .ant-table-wrapper {
            font-size: 11px;
          }
          .ant-table-cell {
            padding: 6px 3px !important;
          }
          .ant-table-thead > tr > th {
            font-size: 10px !important;
            font-weight: 700 !important;
            padding: 8px 4px !important;
          }
          .ant-table-tbody > tr > td {
            font-size: 10px !important;
          }
          .ant-tag {
            font-size: 9px !important;
          }
          .ant-pagination {
            margin-top: 12px !important;
            font-size: 12px !important;
          }
          .ant-pagination-item {
            min-width: 26px !important;
            height: 26px !important;
            line-height: 24px !important;
            margin: 0 2px !important;
            font-size: 12px !important;
          }
          .ant-pagination-item a {
            font-size: 11px !important;
          }
          .ant-pagination-prev, .ant-pagination-next {
            min-width: 26px !important;
            height: 26px !important;
            line-height: 24px !important;
          }
          .ant-pagination-options {
            display: inline-block !important;
            margin-left: 8px !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .ant-pagination-options-size-changer.ant-select {
            display: inline-block !important;
            visibility: visible !important;
            min-width: 90px !important;
          }
          .ant-select {
            font-size: 12px !important;
          }
          .ant-select-selector {
            height: 26px !important;
            font-size: 11px !important;
            padding: 0 8px !important;
          }
          .ant-select-selection-item {
            line-height: 24px !important;
            font-size: 11px !important;
          }
          .ant-select-arrow {
            font-size: 10px !important;
          }
        }

        .ant-table-wrapper {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #f0f0f0;
        }

        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%) !important;
          font-weight: 700 !important;
          border-bottom: 2px solid #667eea30 !important;
          padding: 16px !important;
        }

        .table-row-even {
          background: #fafafa !important;
        }

        .table-row-odd {
          background: #ffffff !important;
        }

        .ant-table-tbody > tr:hover {
          background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%) !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }

        .ant-table-cell {
          border-color: #f0f0f0 !important;
        }

        .ant-pagination {
          margin-top: 20px !important;
          margin-bottom: 0 !important;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 4px;
        }

        @media (max-width: 767px) {
          .ant-pagination {
            text-align: center !important;
            gap: 6px 4px;
          }
          
          .ant-pagination-total-text {
            display: block;
            width: 100%;
            text-align: center;
            margin-bottom: 8px;
            order: 1;
          }

          .ant-pagination-options {
            display: inline-block !important;
            margin: 0 !important;
            order: 2;
            width: 100%;
            text-align: center;
            margin-bottom: 8px !important;
          }

          .ant-pagination-item,
          .ant-pagination-prev,
          .ant-pagination-next,
          .ant-pagination-jump-prev,
          .ant-pagination-jump-next {
            order: 3;
          }
        }

        .ant-pagination-item-active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border-color: transparent !important;
        }

        .ant-pagination-item-active a {
          color: white !important;
        }

        .ant-pagination-item:hover {
          border-color: #667eea !important;
        }

        .ant-pagination-item:hover a {
          color: #667eea !important;
        }

        .ant-spin-dot-item {
          background-color: #667eea !important;
        }

        /* Custom scrollbar cho modal */
        .ant-modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .ant-modal-body::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 4px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
      `}</style>
    </Modal>
  );
};

export default HistoryModal;