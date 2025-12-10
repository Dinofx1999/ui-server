import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  message,
  Modal,
  Switch,
  Table,
  Tag,
  TimePicker,
  Divider,
  Card,
  Space,
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  SendOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const timeFormat = "HH:mm:ss";

const AccountModal = ({ open, onCancel }: any) => {
  const [autoTrade, setAutoTrade] = useState(false);
  const [sendTelegram, setSendTelegram] = useState(false);
  const [dataTable, setDataTable] = useState([]);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://116.105.227.149:5000/v1/api";
  const ACCESS_TOKEN = localStorage.getItem("accessToken") || "";

  async function getSpreadPlus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/config`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_TOKEN,
        },
        timeout: 10000,
      });

      if (response.data?.data) {
        setAutoTrade(response.data.data.AutoTrade);
        setSendTelegram(response.data.data.sendTelegram);
        const start = response.data.data.TimeStopReset?.start ?? null;
        const end = response.data.data.TimeStopReset?.end ?? null;
        setStartTime(start ? dayjs(start, timeFormat) : null);
        setEndTime(end ? dayjs(end, timeFormat) : null);
      } else {
        messageApi.error("Không thể tải dữ liệu SpreadPlus");
      }
    } catch (error) {
      messageApi.error("Lỗi khi tải cấu hình");
    }
  }


  async function updateConfigAdmin(payload: any) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/admin/config`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ACCESS_TOKEN,
          },
        }
      );

      if (response.data?.success) {
        messageApi.success("Cập nhật cấu hình thành công!");
      } else {
        messageApi.error("Cập nhật cấu hình thất bại");
      }
    } catch (error) {
      messageApi.error("Lỗi khi kết nối đến server");
    }
  }

  async function getData_Table() {
    try {
      const response = await axios.get(
        `http://116.105.227.149:5000/auth/account-user`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ACCESS_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data?.data) {
        setDataTable(response.data.data);
      } else {
        messageApi.error("Không thể tải dữ liệu bảng");
      }
    } catch (error) {
      messageApi.error("Lỗi khi tải danh sách tài khoản");
    }
  }

  useEffect(() => {
    if (open) {
      console.log("Fetching initial data...");
      getSpreadPlus();
      getData_Table();
    }
  }, [open]);

  const roleColor: Record<string, string> = {
    Admin: "red",
    User: "blue",
    Manager: "orange",
    Guest: "green",
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: "Fullname",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: "#1890ff" }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
      render: (text: string) => (
        <Text code style={{ fontSize: "12px" }}>
          {"•".repeat(8)}
        </Text>
      ),
    },
    {
      title: "Role",
      dataIndex: "rule",
      key: "rule",
      align: "center" as const,
      render: (value: string) => (
        <Tag
          color={roleColor[value] || "default"}
          style={{
            fontWeight: 600,
            borderRadius: "6px",
            padding: "4px 12px",
          }}
        >
          {value}
        </Tag>
      ),
    },
    {
      title: "ID SECRET",
      dataIndex: "id_SECRET",
      key: "id_SECRET",
      render: (text: string) => (
        <Text code style={{ fontSize: "11px" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "actived",
      key: "actived",
      align: "center" as const,
      render: (value: boolean, record: any) => (
        <Switch
          checked={value}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
          onChange={(checked) => {
            console.log("Switch toggled:", checked, record);
            // Handle activation toggle here
          }}
        />
      ),
    },
  ];

  const handleUpdateTime = async () => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/admin/config`,
        {
          TimeStopReset: {
            start: startTime ? startTime.format(timeFormat) : null,
            end: endTime ? endTime.format(timeFormat) : null,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ACCESS_TOKEN,
          },
        }
      );

      if (response.data?.success) {
        messageApi.success("Cập nhật thời gian thành công!");
      } else {
        messageApi.error("Cập nhật thời gian thất bại");
      }
    } catch (error) {
      messageApi.error("Lỗi khi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ThunderboltOutlined
              style={{ fontSize: "20px", color: "white" }}
            />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Cài Đặt Hệ Thống
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Quản lý cấu hình tự động và tài khoản
            </Text>
          </div>
        </div>
      }
      footer={null}
      width={1100}
      style={{ top: 20 }}
      styles={{
        body: {
          padding: "24px",
          maxHeight: "80vh",
          overflowY: "auto",
        },
      }}
    >
      {contextHolder}

      {/* Configuration Section */}
      <Card
        style={{
          marginBottom: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
        styles={{ body: { padding: "20px" } }}
      >
        <Title level={5} style={{ marginBottom: "20px", color: "#262626" }}>
          ⚙️ Cấu Hình Giao Dịch
        </Title>

        {/* Auto Trade Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#fafafa",
            borderRadius: "8px",
            marginBottom: "12px",
            border: "1px solid #f0f0f0",
          }}
        >
          <Space>
            <ThunderboltOutlined
              style={{ fontSize: "18px", color: "#52c41a" }}
            />
            <div>
              <Text strong style={{ fontSize: "15px" }}>
                Auto Trade
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Tự động thực hiện giao dịch
              </Text>
            </div>
          </Space>
          <Switch
            checked={autoTrade}
            onChange={(check) => {
                setAutoTrade(check);
                updateConfigAdmin({ AutoTrade: check });
            }}
            style={{
              background: autoTrade ? "#52c41a" : undefined,
            }}
          />
        </div>

        {/* Send Telegram Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#fafafa",
            borderRadius: "8px",
            border: "1px solid #f0f0f0",
          }}
        >
          <Space>
            <SendOutlined style={{ fontSize: "18px", color: "#1890ff" }} />
            <div>
              <Text strong style={{ fontSize: "15px" }}>
                Send Telegram
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Gửi thông báo qua Telegram
              </Text>
            </div>
          </Space>
          <Switch
            checked={sendTelegram}
            onChange={(check) => {
                setSendTelegram(check);
                updateConfigAdmin({ sendTelegram: check });
            }}
            style={{
              background: sendTelegram ? "#1890ff" : undefined,
            }}
          />
        </div>

        <Divider style={{ margin: "20px 0" }} />

        {/* Time Configuration */}
        <div
          style={{
            padding: "16px",
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            borderRadius: "8px",
            border: "1px solid #d9d9ff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <Space>
              <ClockCircleOutlined
                style={{ fontSize: "18px", color: "#722ed1" }}
              />
              <div>
                <Text strong style={{ fontSize: "15px" }}>
                  Thời Gian Dừng Reset
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Cấu hình khung giờ tạm dừng hệ thống
                </Text>
              </div>
            </Space>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Thời gian bắt đầu
              </Text>
              <TimePicker
                value={startTime}
                format={timeFormat}
                onChange={setStartTime}
                style={{ width: "100%", marginTop: "4px" }}
                size="large"
                placeholder="Chọn giờ bắt đầu"
              />
            </div>

            <div
              style={{
                fontSize: "20px",
                color: "#722ed1",
                marginTop: "20px",
              }}
            >
              →
            </div>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Thời gian kết thúc
              </Text>
              <TimePicker
                value={endTime}
                format={timeFormat}
                onChange={setEndTime}
                style={{ width: "100%", marginTop: "4px" }}
                size="large"
                placeholder="Chọn giờ kết thúc"
              />
            </div>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleUpdateTime}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                marginTop: "20px",
                minWidth: "120px",
              }}
            >
              Cập Nhật
            </Button>
          </div>
        </div>
      </Card>

      {/* User Table Section */}
      <Card
        style={{
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
        styles={{ body: { padding: "20px" } }}
      >
        <Title level={5} style={{ marginBottom: "16px", color: "#262626" }}>
          👥 Danh Sách Tài Khoản
        </Title>

        <Table
          columns={columns}
          dataSource={dataTable}
          pagination={{
            pageSize: 5,
            showTotal: (total) => `Tổng ${total} tài khoản`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          bordered
          size="middle"
          rowKey="username"
          style={{
            borderRadius: "8px",
            overflow: "hidden",
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </Modal>
  );
};

export default AccountModal;