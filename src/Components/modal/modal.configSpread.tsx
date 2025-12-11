import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Button, Space, Form, message, Spin, InputNumber } from 'antd';
import { X, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import type { ColumnsType } from 'antd/es/table';
import AutocompleteSearch from '../Autocomplete';

// ============= TYPE DEFINITIONS =============
interface SpreadData {
  _id: string;
  Symbol: string;
  Spread_STD: number;
  Spread_ECN: number;
  Sydney: number;
  Tokyo: number;
  London: number;
  NewYork: number;
}

interface SpreadManagementModalProps {
  visible: boolean;
  onClose: () => void;
  symbols?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ============= COMPONENT =============
const SpreadManagementModal: React.FC<SpreadManagementModalProps> = ({
  visible,
  onClose,
  symbols,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState<string>('');
  const [spreadData, setSpreadData] = useState<SpreadData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [editingKey, setEditingKey] = useState<string>('');

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  const [messageApi, contextHolder] = message.useMessage();
  const [spreadPlus, setSpreadPlus] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const API_BASE_URL = 'http://116.105.227.149:5000/v1/api';
  const ACCESS_TOKEN = localStorage.getItem('accessToken') || '';

  // ============= RESPONSIVE DETECT =============
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    getSpreadPlus();
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============= FETCH DATA =============
  useEffect(() => {
    if (visible) {
      fetchSpreadData();
    }
  }, [visible]);

  //Get SpreadPlus
  async function getSpreadPlus() {
    const response = await axios.get(`${API_BASE_URL}/admin/config`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: ACCESS_TOKEN,
      },
      timeout: 10000,
    });

    if (response.data?.data) {
      setSpreadPlus(response.data.data.SpreadPlus);
    } else {
      message.error('Không thể tải dữ liệu SpreadPlus');
    }
  }

  const fetchSpreadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/symbol/all`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: ACCESS_TOKEN,
        },
        timeout: 10000,
      });

      if (response.data?.Data) {
        setSpreadData(response.data.Data);
      } else {
        message.error('Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error fetching spread data:', error);
      const axiosError = error as AxiosError<ApiResponse<never>>;
      message.error(
        axiosError.response?.data?.message || 'Lỗi khi tải dữ liệu',
      );
    } finally {
      setLoading(false);
    }
  };

  // ============= HANDLERS =============
  const handleClose = (): void => {
    setShowAddForm(false);
    setEditingKey('');
    setSearchText('');
    form.resetFields();
    editForm.resetFields();
    onClose();
  };

  const handleReload = (): void => {
    setSearchText('');
    setShowAddForm(false);
    setEditingKey('');
    form.resetFields();
    editForm.resetFields();
    fetchSpreadData();
  };

  const handleAdd = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        Symbol: searchText.toUpperCase(),
        Spread_STD: Number(values.spreadStd),
        Spread_ECN: Number(values.spreadEcn),
        Sydney: Number(values.sydney),
        Tokyo: Number(values.tokyo),
        London: Number(values.london),
        NewYork: Number(values.newyork),
      };

      const response = await axios.post(
        `${API_BASE_URL}/symbol/config`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: ACCESS_TOKEN,
          },
          timeout: 10000,
        },
      );

      if (response.data) {
        messageApi.success(`Đã thêm ${searchText.toUpperCase()} thành công!`);
        form.resetFields();
        setShowAddForm(false);
        setSearchText(payload.Symbol);
        await fetchSpreadData();
      } else {
        messageApi.error(response.data?.message || 'Thêm thất bại');
      }
    } catch (error) {
      console.error('Error adding spread:', error);
      const axiosError = error as AxiosError<ApiResponse<never>>;
      messageApi.error(
        axiosError.response?.data?.message ||
          'Lỗi khi thêm spread. Vui lòng thử lại!',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: SpreadData): void => {
    setEditingKey(record.Symbol);
    editForm.setFieldsValue({
      Symbol: record.Symbol,
      Spread_STD: record.Spread_STD,
      Spread_ECN: record.Spread_ECN,
      Sydney: record.Sydney,
      Tokyo: record.Tokyo,
      London: record.London,
      NewYork: record.NewYork,
      _id: record._id,
    });
  };

  const handleSaveEdit = async (record: SpreadData): Promise<void> => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);

      const payload = {
        _id: values._id,
        Symbol: values.Symbol,
        Spread_STD: Number(values.Spread_STD),
        Spread_ECN: Number(values.Spread_ECN),
        Sydney: Number(values.Sydney),
        Tokyo: Number(values.Tokyo),
        London: Number(values.London),
        NewYork: Number(values.NewYork),
      };

      const response = await axios.post(
        `${API_BASE_URL}/symbol/update`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: ACCESS_TOKEN,
          },
          timeout: 10000,
        },
      );

      if (response.data) {
        messageApi.success(`Đã cập nhật ${values.Symbol} thành công!`);
        setEditingKey('');
        await fetchSpreadData();
      } else {
        messageApi.error(response.data?.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating spread:', error);
      const axiosError = error as AxiosError<ApiResponse<never>>;
      messageApi.error(
        axiosError.response?.data?.message ||
          'Lỗi khi cập nhật spread. Vui lòng thử lại!',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = (): void => {
    setEditingKey('');
    editForm.resetFields();
  };

  const handleDelete = async (record: SpreadData): Promise<void> => {
    console.log('Deleting record:', record);
    try {
      const payload = {
        _id: record._id,
      };
      const response = await axios.post(
        `${API_BASE_URL}/symbol/delete`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: ACCESS_TOKEN,
          },
          timeout: 10000,
        },
      );

      if (response.data) {
        messageApi.success(`Đã xóa ${record.Symbol} thành công!`);
        await fetchSpreadData();
      } else {
        messageApi.error(response.data?.message || 'Xóa thất bại');
      }
    } catch (error) {
      console.error('Error deleting spread:', error);
      const axiosError = error as AxiosError<ApiResponse<never>>;
      messageApi.error(
        axiosError.response?.data?.message ||
          'Lỗi khi xóa spread. Vui lòng thử lại!',
      );
    }
  };

  const isEditing = (record: SpreadData): boolean =>
    record.Symbol === editingKey;

  // ============= TABLE COLUMNS =============
  const columns: ColumnsType<SpreadData> = [
    {
      title: '#',
      key: 'index',
      width: isMobile ? 40 : 40,    
      fixed: 'left' as const,
      align: 'center' as const,
      render: (_: unknown, __: SpreadData, index: number) => (
        <span style={{
          fontSize: isMobile ? 12 : 13,
          fontWeight: 600,
          color: '#8c8c8c',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: isMobile ? 'SYMBOL' : 'SYMBOL',
      dataIndex: 'Symbol',
      key: 'Symbol',
      width: isMobile ? 100 : 140,
      fixed: 'left' as const,
      sorter: (a, b) => a.Symbol.localeCompare(b.Symbol),
      render: (text: string) => (
        <span style={{
          color: '#1a1a1a',
          fontWeight: 600,
          fontSize: isMobile ? 12 : 15,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.01em'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'STD',
      dataIndex: 'Spread_STD',
      key: 'Spread_STD',
      width: isMobile ? 100 : 100,
      align: 'center' as const,
      sorter: (a, b) => a.Spread_STD - b.Spread_STD,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="Spread_STD" style={{ margin: 0 }}>
            <InputNumber 
              size={isMobile ? 'small' : 'middle'} 
              style={{ width: '100%' }}
              controls={false}
            />
          </Form.Item>
        ) : (
          <span style={{
            color: '#ff4d4f',
            fontWeight: 600,
            fontSize: isMobile ? 12 : 14,
            fontFamily: 'SF Mono, Monaco, monospace'
          }}>
            {text}
          </span>
        ),
    },
    {
      title: 'ECN',
      dataIndex: 'Spread_ECN',
      key: 'Spread_ECN',
      width: isMobile ? 100 : 100,
      align: 'center' as const,
      sorter: (a, b) => a.Spread_ECN - b.Spread_ECN,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="Spread_ECN" style={{ margin: 0 }}>
            <InputNumber 
              size={isMobile ? 'small' : 'middle'} 
              style={{ width: '100%' }}
              controls={false}
            />
          </Form.Item>
        ) : (
          <span style={{
            color: '#ff4d4f',
            fontWeight: 600,
            fontSize: isMobile ? 12 : 14,
            fontFamily: 'SF Mono, Monaco, monospace'
          }}>
            {text}
          </span>
        ),
    },
      {
        title: 'SYDNEY',
        dataIndex: 'Sydney',
        key: 'Sydney',
        width: 110,
        align: 'center' as const,
        sorter: (a: SpreadData, b: SpreadData) => a.Sydney - b.Sydney,
        render: (text: number, record: SpreadData) =>
          isEditing(record) ? (
            <Form.Item name="Sydney" style={{ margin: 0 }}>
              <InputNumber 
                size="middle" 
                style={{ width: '100%' }}
                controls={false}
              />
            </Form.Item>
          ) : (
            <span style={{ 
              color: '#595959',
              fontWeight: 500,
              fontSize: 14,
              fontFamily: 'SF Mono, Monaco, monospace'
            }}>
              {text}
            </span>
          ),
      },
      {
        title: 'TOKYO',
        dataIndex: 'Tokyo',
        key: 'Tokyo',
        width: 110,
        align: 'center' as const,
        sorter: (a: SpreadData, b: SpreadData) => a.Tokyo - b.Tokyo,
        render: (text: number, record: SpreadData) =>
          isEditing(record) ? (
            <Form.Item name="Tokyo" style={{ margin: 0 }}>
              <InputNumber 
                size="middle" 
                style={{ width: '100%' }}
                controls={false}
              />
            </Form.Item>
          ) : (
            <span style={{ 
              color: '#595959',
              fontWeight: 500,
              fontSize: 14,
              fontFamily: 'SF Mono, Monaco, monospace'
            }}>
              {text}
            </span>
          ),
      },
      {
        title: 'LONDON',
        dataIndex: 'London',
        key: 'London',
        width: 110,
        align: 'center' as const,
        sorter: (a: SpreadData, b: SpreadData) => a.London - b.London,
        render: (text: number, record: SpreadData) =>
          isEditing(record) ? (
            <Form.Item name="London" style={{ margin: 0 }}>
              <InputNumber 
                size="middle" 
                style={{ width: '100%' }}
                controls={false}
              />
            </Form.Item>
          ) : (
            <span style={{ 
              color: '#595959',
              fontWeight: 500,
              fontSize: 14,
              fontFamily: 'SF Mono, Monaco, monospace'
            }}>
              {text}
            </span>
          ),
      },
      {
        title: 'NEWYORK',
        dataIndex: 'NewYork',
        key: 'NewYork',
        width: 120,
        align: 'center' as const,
        sorter: (a: SpreadData, b: SpreadData) => a.NewYork - b.NewYork,
        render: (text: number, record: SpreadData) =>
          isEditing(record) ? (
            <Form.Item name="NewYork" style={{ margin: 0 }}>
              <InputNumber 
                size="middle" 
                style={{ width: '100%' }}
                controls={false}
              />
            </Form.Item>
          ) : (
            <span style={{ 
              color: '#595959',
              fontWeight: 500,
              fontSize: 14,
              fontFamily: 'SF Mono, Monaco, monospace'
            }}>
              {text}
            </span>
          ),
      },
    {
      title: 'ACTION',
      key: 'action',
      width: isMobile ? 80 : 180,
    //   fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, record: SpreadData) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size={isMobile ? 4 : 8} direction="horizontal">
            <Button
              type="primary"
              size={isMobile ? 'small' : 'middle'}
              loading={submitting}
              onClick={() => handleSaveEdit(record)}
              style={{
                background: '#1a1a1a',
                borderColor: '#1a1a1a',
                fontWeight: 500,
                borderRadius: 6,
                minWidth: isMobile ? 32 : 70
              }}
            >
              {isMobile ? '✓' : 'Save'}
            </Button>
            <Button
              size={isMobile ? 'small' : 'middle'}
              onClick={handleCancelEdit}
              style={{
                fontWeight: 500,
                borderRadius: 6,
                minWidth: isMobile ? 32 : 70
              }}
            >
              {isMobile ? '✕' : 'Cancel'}
            </Button>
          </Space>
        ) : (
          <Space size={isMobile ? 4 : 8} direction="horizontal">
            <Button
              type="text"
              size={isMobile ? 'small' : 'middle'}
              disabled={editingKey !== ''}
              onClick={() => handleEdit(record)}
              icon={<Edit2 size={isMobile ? 14 : 16} />}
              style={{
                color: editingKey !== '' ? '#d9d9d9' : '#1a1a1a',
                fontWeight: 500,
                padding: isMobile ? '4px 8px' : '4px 12px',
                minWidth: isMobile ? 32 : 'auto'
              }}
            />
            <Button
              type="text"
              size={isMobile ? 'small' : 'middle'}
              disabled={editingKey !== ''}
              onClick={() => handleDelete(record)}
              icon={<Trash2 size={isMobile ? 14 : 16} />}
              style={{
                color: editingKey !== '' ? '#d9d9d9' : '#ff4d4f',
                fontWeight: 500,
                padding: isMobile ? '4px 8px' : '4px 12px',
                minWidth: isMobile ? 32 : 'auto'
              }}
            />
          </Space>
        );
      },
    },
  ];

  const filteredData: SpreadData[] = spreadData.filter((item: SpreadData) =>
    item.Symbol?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleSelect = (value: string) => {
    setSearchText(value);

    if (value.trim()) {
      const exists = spreadData.some(
        (item) => item.Symbol.toLowerCase() === value.toLowerCase(),
      );

      if (!exists) {
        setShowAddForm(true);
        message.info(`"${value}" chưa có. Vui lòng thêm mới!`);
      } else {
        setShowAddForm(false);
      }
    } else {
      setShowAddForm(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 12 : 16,
          padding: isMobile ? '4px 0' : '8px 0'
        }}>
          <div>
            <div style={{ 
              fontSize: isMobile ? 17 : 20, 
              fontWeight: 600,
              color: '#1a1a1a',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              Spread Management
            </div>
            <div style={{ 
              fontSize: isMobile ? 12 : 13, 
              color: '#8c8c8c',
              fontWeight: 400,
              marginTop: 2,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              Configure spread parameters for products
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={isMobile ? '100%' : isTablet ? 900 : 1400}
      footer={null}
      closeIcon={
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1a1a1a';
          e.currentTarget.querySelector('svg')?.setAttribute('stroke', 'white');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f5f5f5';
          e.currentTarget.querySelector('svg')?.setAttribute('stroke', '#000000');
        }}
        >
          <X size={18} />
        </div>
      }
      styles={{
        body: {
          height: isMobile ? '85vh' : '90vh',
          padding: isMobile ? 16 : 24,
          background: '#ffffff',
          overflowY: 'auto',
        },
      }}
      style={isMobile ? { top: 10, margin: '0 8px', maxWidth: 'calc(100% - 16px)' } : { top: 20 }}
    >
      {contextHolder}

      {/* HEADER: SEARCH + BUTTONS + SPREAD PLUS */}
      <div style={{
        marginBottom: isMobile ? 16 : 20,
        padding: isMobile ? 14 : 18,
        background: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #e8e8e8'
      }}>
        <Space
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{
            width: '100%',
            justifyContent: 'space-between',
          }}
          size={isMobile ? 12 : 16}
        >
          <Space
            direction={isMobile ? 'horizontal' : 'horizontal'}
            style={{ width: isMobile ? '100%' : 'auto' }}
            size={isMobile ? 8 : 12}
            wrap
          >
            <AutocompleteSearch
              suggestions={symbols || []}
              placeholder="Search symbol..."
              onSearch={handleSearch}
              onSelect={handleSelect}
              width={isMobile ? 140 : 220}
              height={isMobile ? 34 : 36}
            />
            <Button
              onClick={handleReload}
              loading={loading}
              size={isMobile ? 'middle' : 'large'}
              icon={<RefreshCw size={16} />}
              style={{
                fontWeight: 500,
                height: isMobile ? 34 : 36,
                borderRadius: 6,
                background: '#1a1a1a',
                color: 'white',
                borderColor: '#1a1a1a'
              }}
            >
              {!isMobile && 'Reload'}
            </Button>
          </Space>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: isMobile ? '8px 12px' : '8px 14px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #e8e8e8'
          }}>
            <span style={{ 
              fontWeight: 500, 
              fontSize: isMobile ? 12 : 14,
              color: '#595959',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              Spread Plus:
            </span>
            <InputNumber
              value={spreadPlus}
              onChange={(value) => setSpreadPlus(value || 0)}
              style={{ 
                width: isMobile ? 65 : 80,
                fontWeight: 500
              }}
              size={isMobile ? 'small' : 'middle'}
              controls={false}
            />
            <Button
              size={isMobile ? 'small' : 'middle'}
              onClick={async () => {
                try {
                  const response = await axios.put(
                    `${API_BASE_URL}/admin/config`,
                    { SpreadPlus: spreadPlus },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: ACCESS_TOKEN,
                      },
                    }
                  );
                  if (response.data?.success) {
                    messageApi.success('Updated Spread Plus successfully');
                  } else {
                    messageApi.error('Failed to update Spread Plus');
                  }
                } catch (error) {
                  messageApi.error('An error occurred');
                }
              }}
              style={{
                background: '#1a1a1a',
                borderColor: '#1a1a1a',
                color: 'white',
                fontWeight: 500,
                borderRadius: 6
              }}
            >
              Update
            </Button>
          </div>
        </Space>
      </div>

      {/* ADD FORM */}
      {showAddForm && searchText && (
        <div
          style={{
            marginBottom: isMobile ? 16 : 20,
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            padding: isMobile ? 16 : 20,
            background: '#fafafa',
          }}
        >
          <div
            style={{
              marginBottom: 20,
              padding: isMobile ? '12px 14px' : '14px 18px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#8c8c8c',
                  marginBottom: 6,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                Add New Symbol
              </div>
              <div
                style={{
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '-0.02em'
                }}
              >
                {searchText.toUpperCase()}
              </div>
            </div>
            <Button
              type="text"
              icon={<X size={20} />}
              onClick={() => {
                setShowAddForm(false);
                setSearchText('');
              }}
              style={{ 
                color: '#8c8c8c',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <Form form={form} layout="vertical">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? 14 : 16,
              }}
            >
              <Form.Item
                label={
                  <span style={{ 
                    fontWeight: 500, 
                    fontSize: isMobile ? 12 : 13,
                    color: '#595959',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    SPREAD STD
                  </span>
                }
                name="spreadStd"
                initialValue={1}
                rules={[{ required: true, message: 'Enter spread STD' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  size={isMobile ? 'middle' : 'large'}
                  controls={false}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ 
                    fontWeight: 500, 
                    fontSize: isMobile ? 12 : 13,
                    color: '#595959',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    SPREAD ECN
                  </span>
                }
                name="spreadEcn"
                initialValue={1}
                rules={[{ required: true, message: 'Enter spread ECN' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  size={isMobile ? 'middle' : 'large'}
                  controls={false}
                />
              </Form.Item>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? 14 : 16,
              }}
            >
              <Form.Item
                label={
                  <span style={{ 
                    fontWeight: 500, 
                    fontSize: isMobile ? 12 : 13,
                    color: '#595959',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    SYDNEY
                  </span>
                }
                name="sydney"
                initialValue={1}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  size={isMobile ? 'middle' : 'large'}
                  controls={false}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ 
                    fontWeight: 500, 
                    fontSize: isMobile ? 12 : 13,
                    color: '#595959',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    TOKYO
                  </span>
                }
                name="tokyo"
                initialValue={1}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  size={isMobile ? 'middle' : 'large'}
                  controls={false}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ 
                    fontWeight: 500, 
                    fontSize: isMobile ? 12 : 13,
                    color: '#595959',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    LONDON
                  </span>
                }
                name="london"
                initialValue={1}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  size={isMobile ? 'middle' : 'large'}
                  controls={false}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ 
                    fontWeight: 500, 
                    fontSize: isMobile ? 12 : 13,
                    color: '#595959',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    NEWYORK
                  </span>
                }
                name="newyork"
                initialValue={1}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  size={isMobile ? 'middle' : 'large'}
                  controls={false}
                />
              </Form.Item>
            </div>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 12 }}>
              <Button
                type="primary"
                onClick={handleAdd}
                loading={submitting}
                size={isMobile ? 'middle' : 'large'}
                icon={<Plus size={16} />}
                style={{
                  minWidth: isMobile ? 120 : 160,
                  fontWeight: 500,
                  fontSize: isMobile ? 14 : 15,
                  height: isMobile ? 38 : 42,
                  background: '#1a1a1a',
                  borderColor: '#1a1a1a',
                  borderRadius: 6
                }}
              >
                Add Symbol
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}

      {/* TABLE */}
      <Spin spinning={loading} tip="Loading data...">
        <Form form={editForm} component={false}>
          <Form.Item name="_id" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="Symbol" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Table<SpreadData>
            columns={columns}
            dataSource={filteredData}
            pagination={{
              pageSize: pageSize,
              onChange: (page, newPageSize) => {
                setPageSize(newPageSize);
              },
              onShowSizeChange: (current, size) => {
                setPageSize(size);
              },
              simple: false,
              hideOnSinglePage: false,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => (
                <div style={{
                  fontWeight: 500,
                  color: '#595959',
                  fontSize: isMobile ? 12 : 13,
                  textAlign: 'center',
                  width: '100%',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {isMobile
                    ? `${range[0]}-${range[1]} of ${total}`
                    : (
                      <>
                        Showing <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{range[0]}-{range[1]}</span> of <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{total}</span> items
                      </>
                    )
                  }
                </div>
              ),
              size: isMobile ? 'small' : 'default',
              responsive: true,
            }}
            scroll={{
              x: isMobile ? 500 : 1200,
            }}
            size={isMobile ? 'small' : 'middle'}
            bordered
            rowKey={(record) => record._id}
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          />
        </Form>
      </Spin>

      <style>{`
        @media (max-width: 767px) {
          .ant-table-wrapper {
            font-size: 12px;
          }
          .ant-table-cell {
            padding: 10px 6px !important;
          }
          .ant-table-thead > tr > th {
            font-size: 11px !important;
            font-weight: 600 !important;
            padding: 12px 6px !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .ant-table-tbody > tr > td {
            font-size: 12px !important;
            padding: 10px 6px !important;
          }
          .ant-form-item {
            margin-bottom: 12px !important;
          }
          .ant-form-item-label {
            padding-bottom: 4px !important;
          }
          .ant-pagination {
            margin-top: 12px !important;
            font-size: 12px !important;
          }
          .ant-pagination-item {
            min-width: 28px !important;
            height: 28px !important;
            line-height: 26px !important;
            margin: 0 2px !important;
            font-size: 12px !important;
          }
          .ant-pagination-item a {
            font-size: 12px !important;
          }
          .ant-pagination-prev, .ant-pagination-next {
            min-width: 28px !important;
            height: 28px !important;
            line-height: 26px !important;
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
            height: 28px !important;
            font-size: 12px !important;
            padding: 0 8px !important;
          }
          .ant-select-selection-item {
            line-height: 26px !important;
            font-size: 12px !important;
          }
          .ant-select-arrow {
            font-size: 10px !important;
          }
        }

        .ant-table-wrapper {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e8e8e8;
        }

        .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
          border-bottom: 1px solid #e8e8e8 !important;
          padding: 16px !important;
          color: #595959 !important;
          font-size: 13px !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ant-table-tbody > tr {
          transition: all 0.2s ease;
        }

        .ant-table-tbody > tr:hover {
          background: #fafafa !important;
        }

        .ant-table-cell {
          border-color: #f0f0f0 !important;
          padding: 14px 16px !important;
        }

        .ant-table-tbody > tr > td {
          font-size: 14px !important;
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

        .ant-pagination-item {
          border-color: #e8e8e8;
          border-radius: 6px;
        }

        .ant-pagination-item-active {
          background: #1a1a1a !important;
          border-color: #1a1a1a !important;
        }

        .ant-pagination-item-active a {
          color: white !important;
        }

        .ant-pagination-item:hover {
          border-color: #1a1a1a !important;
        }

        .ant-pagination-item:hover a {
          color: #1a1a1a !important;
        }

        .ant-pagination-prev:hover button,
        .ant-pagination-next:hover button {
          color: #1a1a1a !important;
          border-color: #1a1a1a !important;
        }

        .ant-spin-dot-item {
          background-color: #1a1a1a !important;
        }

        .ant-modal-body::-webkit-scrollbar {
          width: 6px;
        }

        .ant-modal-body::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 3px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb {
          background: #bfbfbf;
          border-radius: 3px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb:hover {
          background: #8c8c8c;
        }

        .ant-input-number {
          border-radius: 6px;
        }

        .ant-input-number:hover,
        .ant-input-number:focus {
          border-color: #1a1a1a;
        }

        .ant-input-number-focused {
          border-color: #1a1a1a;
          box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.1);
        }

        .ant-btn {
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .ant-btn-primary {
          background: #1a1a1a;
          border-color: #1a1a1a;
        }

        .ant-btn-primary:hover {
          background: #262626;
          border-color: #262626;
        }

        .ant-btn-text:hover {
          background: #f5f5f5;
        }
      `}</style>
    </Modal>
  );
};

export default SpreadManagementModal;