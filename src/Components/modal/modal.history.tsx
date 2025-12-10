import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Table, Input, Button, Space, Tag, message, Spin, AutoComplete } from 'antd';
import { X, Search } from 'lucide-react';
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

  const handleSearch = (): void => {
    fetchHistoryData();
  };

  const handleDelete = (record: HistoryData): void => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc muốn xóa lịch sử này?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete<ApiResponse<never>>(
            `${API_BASE_URL}/history/delete/${record._id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': ACCESS_TOKEN,
              },
              timeout: 10000,
            }
          );

          if (response.data && response.data.success) {
            message.success('Đã xóa thành công!');
            await fetchHistoryData();
          } else {
            message.error(response.data?.message || 'Xóa thất bại');
          }
        } catch (error) {
          console.error('Error deleting history:', error);
          const axiosError = error as AxiosError<ApiResponse<never>>;
          message.error(axiosError.response?.data?.message || 'Lỗi khi xóa. Vui lòng thử lại!');
        }
      },
    });
  };

  const columns: ColumnsType<HistoryData> = [
    {
      title: '#',
      key: 'index',
      width: isMobile ? 40 : 50,
      fixed: 'left' as const,
      render: (_: unknown, __: HistoryData, index: number) => (
        <span style={{ fontWeight: 500 }}>{index + 1}</span>
      ),
    },
    {
  title: "Broker",
  dataIndex: "Broker",
  key: "Broker",
  width: isMobile ? 80 : 120,

  // 🔥 Dùng filterDropdown custom
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8 }}>
      <AutoComplete
        style={{ width: 180 }}
        placeholder="Tìm Broker..."
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

      <div style={{ marginTop: 8, textAlign: "right" }}>
        <a
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
        >
          Reset
        </a>
      </div>
    </div>
  ),

  // 🔥 Điều kiện lọc khi dùng AutoComplete
  onFilter: (value, record:any) =>
    record.Broker.toLowerCase().includes(String(value).toLowerCase()),

  filterIcon: (filtered) => (
    <span style={{ color: filtered ? "#1890ff" : undefined }}>🔍</span>
  ),

  render: (text) => (
    <span
      style={{
        color: "#1890ff",
        fontWeight: 600,
        fontSize: isMobile ? 12 : 14,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  ),
}
,
  {
  title: (
    <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 600 }}>
      Sản Phẩm
    </span>
  ),
  dataIndex: "Symbol",
  key: "Symbol",
  width: isMobile ? 80 : 120,

  // 🔥 Dùng filterDropdown custom
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8 }}>
      <AutoComplete
        style={{ width: 180 }}
        placeholder="Tìm Symbol..."
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

      <div style={{ marginTop: 8, textAlign: "right" }}>
        <a
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
        >
          Reset
        </a>
      </div>
    </div>
  ),

  // 🔥 Điều kiện lọc khi dùng AutoComplete
  onFilter: (value, record:any) =>
    record.Symbol.toLowerCase().includes(String(value).toLowerCase()),

  filterIcon: (filtered) => (
    <span style={{ color: filtered ? "#1890ff" : undefined }}>🔍</span>
  ),

  render: (text) => (
    <span
      style={{
        color: "#1890ff",
        fontWeight: 600,
        fontSize: isMobile ? 12 : 14,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  ),
}
,

    {
      title: 'Time Start',
      dataIndex: 'TimeStart',
      key: 'TimeStart',
      width: isMobile ? 140 : 180,
      sorter: (a:any, b:any) => new Date(a.TimeStart).getTime() - new Date(b.TimeStart).getTime(),
      render: (text: string) => (
        <span style={{ 
          color: '#52c41a', 
          fontWeight: 500, 
          fontSize: isMobile ? 11 : 13,
          fontFamily: 'monospace'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Time End',
      dataIndex: 'TimeCurrent',
      key: 'TimeCurrent',
      width: isMobile ? 140 : 180,
      sorter: (a:any, b:any) => new Date(a.TimeCurrent).getTime() - new Date(b.TimeCurrent).getTime(),
      render: (text: string) => (
        <span style={{ 
          color: '#ff4d4f', 
          fontWeight: 500, 
          fontSize: isMobile ? 11 : 13,
          fontFamily: 'monospace'
        }}>
          {text}
        </span>
      ),
    },
    ...(!isMobile ? [
      {
        title: 'Khoảng Cách',
        dataIndex: 'KhoangCach',
        key: 'KhoangCach',
        width: 120,
        sorter: (a: any, b: any) => a.KhoangCach - b.KhoangCach,
        render: (text: number) => (
          <span style={{ fontWeight: 500, fontSize: 14 }}>{text}</span>
        ),
      },
    ] : []),
    {
      title: 'Spread',
      dataIndex: 'Spread_main',
      key: 'Spread_main',
      width: isMobile ? 70 : 100,
      sorter: (a:any, b:any) => a.Spread_main - b.Spread_main,
      render: (text: number) => (
        <span style={{ 
          color: '#d946ef', 
          fontWeight: 600, 
          fontSize: isMobile ? 13 : 15 
        }}>
          {text}
        </span>
      ),
    },
    ...(!isMobile ? [
      {
        title: 'Time Delay',
        dataIndex: 'Count',
        key: 'Count',
        width: 110,
        sorter: (a: any, b: any) => a.Count - b.Count,
        render: (text: string) => (
          <span style={{ 
            fontWeight: 500, 
            fontSize: 13,
            fontFamily: 'monospace'
          }}>
            {text}
          </span>
        ),
      },
    ] : []),
  
  {
  title: 'isTrusted',
  key: 'IsStable',
  dataIndex: 'isTrusted',
  width: isMobile ? 70 : 90,
  fixed: 'right' as const,

  filters: [
    { text: 'Trusted', value: 'true' },
    { text: 'Not Trusted', value: 'false' },
  ],

  onFilter: (value, record: any) => {
    const boolValue = value === 'true';   // Ép string → boolean
    return record.IsStable === boolValue;
  },

  render: (value: boolean) => (
    <Tag color={value ? 'green' : 'red'} style={{ fontWeight: 600 }}>
      {value ? 'Trusted' : 'Not Trusted'}
    </Tag>
  ),
}, {
  title: 'Type Alert',
  key: 'Type',
  dataIndex: 'Type',
  width: isMobile ? 70 : 90,
//   fixed: 'right' as const,

  filters: [
    { text: 'Delay Price', value: 'Delay Price' },
    { text: 'Delay Price Stop', value: 'Delay Price Stop' },
  ],

  onFilter: (value, record: any) => {
    return record.Type === value;
  },

  render: (value: string) => (
    <Tag color={value === 'Delay Price' ? 'lime' : 'tomato'} style={{ fontWeight: 600 }}>
      {value === 'Delay Price' ? 'Delay Price' : 'Price Stop'}
    </Tag>
  ),
},
  {
      title: 'TYPE',
      dataIndex: 'Messenger',
      key: 'Messenger',
      width: isMobile ? 70 : 90,
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
            width: isMobile ? 60 : 70,
            fontWeight: 600,
            fontSize: isMobile ? 11 : 13,
            background: text === 'SELL' ? '#ff4d4f' : '#1890ff',
            borderColor: text === 'SELL' ? '#ff4d4f' : '#1890ff',
            pointerEvents: 'none'
          }}
        >
          {text}
        </Button>
      ),
    },


  ];

  const filteredData: HistoryData[] = historyData.filter((item: HistoryData) => {
    const matchBroker = item.broker?.toLowerCase().includes(brokerSearch.toLowerCase());
    const matchSymbol = item.symbol?.toLowerCase().includes(symbolSearch.toLowerCase());
    return matchBroker && matchSymbol;
  });

  return (
    <Modal
      title={
        <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600 }}>
          Lịch Sử Kèo
        </span>
      }
      open={visible}
      onCancel={handleClose}
      width={isMobile ? '100%' : isTablet ? 1000 : 1600}
      footer={null}
      closeIcon={<X size={isMobile ? 18 : 20} />}
      styles={{
        body: { 
          maxHeight: isMobile ? '85vh' : '75vh', 
          overflowY: 'auto',
          padding: isMobile ? 12 : 24,
        }
      }}
      style={isMobile ? { top: 10, margin: '0 8px', maxWidth: 'calc(100% - 16px)' } : {}}
    >
      {/* Search Section */}
      {/* <div style={{ 
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr auto' : '300px 300px auto',
        gap: isMobile ? 12 : 16,
        alignItems: 'end'
      }}>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontSize: isMobile ? 12 : 13,
            fontWeight: 500,
            color: '#595959'
          }}>
            Nhập tên sàn
          </label>
          <Input
            placeholder="Nhập tên sàn"
            value={brokerSearch}
            onChange={(e) => setBrokerSearch(e.target.value)}
            onPressEnter={handleSearch}
            size={isMobile ? 'middle' : 'large'}
            style={{ 
              borderRadius: 8,
              fontSize: isMobile ? 13 : 14
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontSize: isMobile ? 12 : 13,
            fontWeight: 500,
            color: '#595959'
          }}>
            Nhập tên sản phẩm
          </label>
          <Input
            placeholder="Nhập tên sản phẩm"
            value={symbolSearch}
            onChange={(e) => setSymbolSearch(e.target.value)}
            onPressEnter={handleSearch}
            size={isMobile ? 'middle' : 'large'}
            style={{ 
              borderRadius: 8,
              fontSize: isMobile ? 13 : 14
            }}
          />
        </div>

        <Button
          type="primary"
          icon={<Search size={16} />}
          onClick={handleSearch}
          loading={loading}
          size={isMobile ? 'middle' : 'large'}
          style={{
            height: isMobile ? 35 : 35,
            width: isMobile ? 150 : 150,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {!isMobile && 'Tìm Kiếm'}
        </Button>
      </div> */}

      {/* Table */}
      <Spin spinning={loading}>
        <Table<HistoryData>
          columns={columns}
          dataSource={historyData}
          pagination={{ 
            pageSize: isMobile ? 10 : 20,
            size: isMobile ? 'small' : 'default',
            showSizeChanger: !isMobile,
            showTotal: (total) => `Tổng ${total} bản ghi`
          }}
          scroll={{ 
            x: isMobile ? 900 : 1200, 
            y: isMobile ? 350 : 450 
          }}
          size={isMobile ? 'small' : 'middle'}
          bordered
          rowKey={record => record._id}
          style={{
            borderRadius: 8,
            overflow: 'hidden'
          }}
        />
      </Spin>

      <style>{`
        @media (max-width: 767px) {
          .ant-table-wrapper {
            font-size: 12px;
          }
          .ant-table-cell {
            padding: 8px 4px !important;
          }
          .ant-table-thead > tr > th {
            font-size: 11px !important;
            font-weight: 600 !important;
          }
        }

        .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
        }

        .ant-table-tbody > tr:hover {
          background: #f5f5f5 !important;
        }
      `}</style>
    </Modal>
  );
};

export default HistoryModal;