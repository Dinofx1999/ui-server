import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Button, Space, Form, message, Spin } from 'antd';
import { X } from 'lucide-react';
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
  const [editingKey, setEditingKey] = useState<string>(''); // dùng Symbol làm key

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  const [messageApi, contextHolder] = message.useMessage();
  const [spreadPlus, setSpreadPlus] = useState<number>(0);
  


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
        setEditingKey(values.Symbol);
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
      width: isMobile ? 40 : 50,
      fixed: isMobile ? 'left' : undefined,
      render: (_: unknown, __: SpreadData, index: number) => index + 1,
    },
    {
      title: 'SYMBOL',
      dataIndex: 'Symbol',
      key: 'Symbol',
      width: isMobile ? 90 : 120,
      fixed: isMobile ? 'left' : undefined,
      sorter: (a, b) => a.Symbol.localeCompare(b.Symbol),
      render: (text: string) => (
        <span
          style={{
            color: '#1890ff',
            fontWeight: 600,
            fontSize: isMobile ? 12 : 14,
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'STD',
      dataIndex: 'Spread_STD',
      key: 'Spread_STD',
      width: isMobile ? 70 : 100,
      sorter: (a, b) => a.Spread_STD - b.Spread_STD,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="Spread_STD" style={{ margin: 0 }}>
            <Input type="number" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>
        ) : (
          <span
            style={{
              color: '#ff4d4f',
              fontWeight: 500,
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {text}
          </span>
        ),
    },
    {
      title: 'ECN',
      dataIndex: 'Spread_ECN',
      key: 'Spread_ECN',
      width: isMobile ? 70 : 100,
      sorter: (a, b) => a.Spread_ECN - b.Spread_ECN,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="Spread_ECN" style={{ margin: 0 }}>
            <Input type="number" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>
        ) : (
          <span
            style={{
              color: '#ff4d4f',
              fontWeight: 500,
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {text}
          </span>
        ),
    },
    {
      title: 'SYDNEY',
      dataIndex: 'Sydney',
      key: 'Sydney',
      width: isMobile ? 70 : 100,
      sorter: (a: SpreadData, b: SpreadData) => a.Sydney - b.Sydney,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="Sydney" style={{ margin: 0 }}>
            <Input type="number" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>
        ) : (
          <span style={{ color: '#1890ff', fontWeight: 500 }}>{text}</span>
        ),
    },
    {
      title: 'TOKYO',
      dataIndex: 'Tokyo',
      key: 'Tokyo',
      width: isMobile ? 70 : 100,
      sorter: (a: SpreadData, b: SpreadData) => a.Tokyo - b.Tokyo,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="Tokyo" style={{ margin: 0 }}>
            <Input type="number" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>
        ) : (
          <span style={{ color: '#1890ff', fontWeight: 500 }}>{text}</span>
        ),
    },
    {
      title: 'LONDON',
      dataIndex: 'London',
      key: 'London',
      width: isMobile ? 80 : 100,
      sorter: (a: SpreadData, b: SpreadData) => a.London - b.London,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="London" style={{ margin: 0 }}>
            <Input type="number" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>
        ) : (
          <span style={{ color: '#52c41a', fontWeight: 500 }}>{text}</span>
        ),
    },
    {
      title: 'NEWYORK',
      dataIndex: 'NewYork',
      key: 'NewYork',
      width: isMobile ? 30 : 100,
      sorter: (a: SpreadData, b: SpreadData) => a.NewYork - b.NewYork,
      render: (text: number, record: SpreadData) =>
        isEditing(record) ? (
          <Form.Item name="NewYork" style={{ margin: 0 }}>
            <Input type="number" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>
        ) : (
          <span style={{ color: '#52c41a', fontWeight: 500 }}>{text}</span>
        ),
    },
    {
      title: 'ACTION',
      key: 'action',
      width: isMobile ? 100 : 150,
      fixed: 'right' as const,
      render: (_: unknown, record: SpreadData) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="small">
            <Button
              type="primary"
              size={isMobile ? 'small' : 'middle'}
              loading={submitting}
              onClick={() => handleSaveEdit(record)}
            >
              Lưu
            </Button>
            <Button
              size={isMobile ? 'small' : 'middle'}
              onClick={handleCancelEdit}
            >
              Hủy
            </Button>
          </Space>
        ) : (
          <Space
            size={isMobile ? 4 : 8}
            direction={isMobile ? 'horizontal' : 'horizontal'}
          >
            <Button
              type="primary"
              size={isMobile ? 'small' : 'middle'}
              disabled={editingKey !== ''}
              onClick={() => handleEdit(record)}
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              Sửa
            </Button>
            <Button
              type="primary"
              danger
              size={isMobile ? 'small' : 'middle'}
              disabled={editingKey !== ''}
              onClick={() => handleDelete(record)}
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              Xóa
            </Button>
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
        <span style={{ fontSize: isMobile ? 15 : 18, fontWeight: 600 }}>
          Thông Số SPREAD Sản Phẩm
        </span>
      }
      open={visible}
      onCancel={handleClose}
      width={isMobile ? '100%' : isTablet ? 900 : 1200}
      footer={null}
      closeIcon={<X size={isMobile ? 18 : 20} />}
      destroyOnClose
      styles={{
        body: {
          maxHeight: isMobile ? 'calc(100vh - 110px)' : '70vh',
          overflowY: 'auto',
          padding: isMobile ? 8 : 24,
        },
      }}
      style={
        isMobile
          ? {
              top: 0,
              margin: 0,
              padding: 0,
              maxWidth: '100%',
            }
          : {}
      }
    >
         {contextHolder}
      {/* HEADER: SEARCH + BUTTONS */}
      <Space
        direction={isMobile ? 'vertical' : 'horizontal'}
        style={{
          marginBottom: isMobile ? 8 : 16,
          width: '100%',
          justifyContent: 'space-between',
        }}
        size={isMobile ? 6 : 16}
      >
        <Space
          direction={isMobile ? 'horizontal' : 'horizontal'}
          style={{ width: isMobile ? '100%' : 'auto' }}
          size={isMobile ? 6 : 8}
        >
          <AutocompleteSearch
            suggestions={symbols || []}
            placeholder="Search..."
            onSearch={handleSearch}
            onSelect={handleSelect}
            width={isMobile ? 150 : 220}
            height={isMobile ? 30 : 30}
          />
          <Space size={isMobile ? 6 : 8} wrap>
            <Button
              type="primary"
              danger
              onClick={handleReload}
              loading={loading}
              size={isMobile ? 'middle' : 'middle'}
            >
              {isMobile ? 'Reload' : 'Reload'}
            </Button>
          </Space>
        </Space>
          <span style={{ marginLeft: 8, fontWeight: 500, fontSize: 14 }}>
            Spread Plus:&nbsp;
            <Space>
              <Input value={spreadPlus} style={{ width: 50, textAlign: 'center' }}  onChange={(e:any) => setSpreadPlus(e.target.value)} />
              <Button
                type="primary"
               danger
               onClick={async () => {
                 try {
                   const response = await axios.put(`${API_BASE_URL}/admin/config`, {
                     SpreadPlus: spreadPlus,
                   }, {
                     headers: {
                       'Content-Type': 'application/json',
                       Authorization: ACCESS_TOKEN,
                     },
                   });
                   if (response.data?.success) {
                     messageApi.success('Cập nhật Spread Plus thành công');
                   } else {
                     messageApi.error('Cập nhật Spread Plus thất bại');
                   }
                 } catch (error) {
                   messageApi.error('Đã xảy ra lỗi');
                 }
               }}
              >
                Update
              </Button>
            </Space>
          </span>
        
      </Space>

      {/* ADD FORM */}
      {showAddForm && searchText && (
        <div
          style={{
            marginBottom: isMobile ? 10 : 20,
            border: '2px solid #1890ff',
            borderRadius: 8,
            padding: isMobile ? 10 : 16,
            background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
            animation: 'slideDown 0.3s ease-out',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
          }}
        >
          <div
            style={{
              marginBottom: 12,
              padding: isMobile ? '8px 10px' : '12px 16px',
              background: '#fff',
              borderRadius: 6,
              border: '1px solid #91d5ff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#8c8c8c',
                  marginBottom: 4,
                }}
              >
                THÊM MỚI SYMBOL
              </div>
              <div
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 700,
                  color: '#1890ff',
                }}
              >
                {searchText.toUpperCase()}
              </div>
            </div>
            <Button
              type="text"
              icon={<X size={18} />}
              onClick={() => {
                setShowAddForm(false);
                setSearchText('');
              }}
              style={{ color: '#8c8c8c' }}
            />
          </div>

          <Form form={form} layout="vertical">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? 10 : 16,
              }}
            >
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: isMobile ? 12 : 14,
                    }}
                  >
                    SPREAD STD
                  </span>
                }
                name="spreadStd"
                initialValue={1}
                rules={[
                  { required: true, message: 'Vui lòng nhập spread STD' },
                ]}
              >
                <Input type="number" size={isMobile ? 'small' : 'middle'} />
              </Form.Item>

              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: isMobile ? 12 : 14,
                    }}
                  >
                    SPREAD ECN
                  </span>
                }
                name="spreadEcn"
                initialValue={1}
                rules={[
                  { required: true, message: 'Vui lòng nhập spread ECN' },
                ]}
              >
                <Input type="number" size={isMobile ? 'small' : 'middle'} />
              </Form.Item>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr 1fr'
                  : isTablet
                  ? 'repeat(2, 1fr)'
                  : 'repeat(4, 1fr)',
                gap: isMobile ? 10 : 16,
              }}
            >
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: isMobile ? 12 : 14,
                    }}
                  >
                    SYDNEY
                  </span>
                }
                name="sydney"
                initialValue={1}
              >
                <Input type="number" size={isMobile ? 'small' : 'middle'} />
              </Form.Item>

              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: isMobile ? 12 : 14,
                    }}
                  >
                    TOKYO
                  </span>
                }
                name="tokyo"
                initialValue={1}
              >
                <Input type="number" size={isMobile ? 'small' : 'middle'} />
              </Form.Item>

              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: isMobile ? 12 : 14,
                    }}
                  >
                    LONDON
                  </span>
                }
                name="london"
                initialValue={1}
              >
                <Input type="number" size={isMobile ? 'small' : 'middle'} />
              </Form.Item>

              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: isMobile ? 12 : 14,
                    }}
                  >
                    NEWYORK
                  </span>
                }
                name="newyork"
                initialValue={1}
              >
                <Input type="number" size={isMobile ? 'small' : 'middle'} />
              </Form.Item>
            </div>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={handleAdd}
                loading={submitting}
                size={isMobile ? 'small' : 'large'}
                style={{
                  minWidth: isMobile ? 110 : 150,
                  height: isMobile ? 34 : 44,
                  fontWeight: 600,
                  fontSize: isMobile ? 13 : 15,
                }}
              >
                ✓ Thêm Mới
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}

      {/* TABLE */}
      <Spin spinning={loading}>
        <Form form={editForm} component={false}>
          <Form.Item name="_id" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="Symbol" hidden>
            <Input type="hidden" />
          </Form.Item>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <Table<SpreadData>
              columns={columns}
              dataSource={filteredData}
              pagination={{
                pageSize: isMobile ? 20 : 50,
                size: isMobile ? 'small' : 'default',
                showSizeChanger: !isMobile,
              }}
              scroll={{
                x: 'max-content', // kéo ngang để xem hết cột
                y: isMobile ? 320 : 400,
              }}
              size={isMobile ? 'small' : 'middle'}
              bordered
              rowKey={(record) => record._id}
            />
          </div>
        </Form>
      </Spin>

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

        @media (max-width: 767px) {
          .ant-table-wrapper {
            font-size: 12px;
          }
          .ant-table-cell {
            padding: 6px 4px !important;
          }
          .ant-modal {
            max-width: 100% !important;
          }
        }
      `}</style>
    </Modal>
    
  );
};

export default SpreadManagementModal;
