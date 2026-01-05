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
  InputNumber,
  Select,
  Tooltip,
  Input,
  AutoComplete
} from "antd";
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  SendOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  PlusOutlined,
  DeleteOutlined,
  AreaChartOutlined,
  FileSearchOutlined,
  SearchOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const timeFormat = "HH:mm:ss";

type TimeRange = { start: Dayjs | null; end: Dayjs | null };

const AccountModal = ({ open, onCancel }: any) => {
  const [autoTrade, setAutoTrade] = useState(false);
  const [sendTelegram, setSendTelegram] = useState(false);
  const [dataTable, setDataTable] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [delayBrokerStop, setDelayBrokerStop] = useState<number>(0);
  const [points , setPoints] = useState<number>(0);
  const [loadingDelay, setLoadingDelay] = useState(false);
  const [typeAnalysis, setTypeAnalysis] = useState("type1");
  const [allBroker, setAllBroker] = useState<string[]>([]);
  const [allSymbol, setAllSymbol] = useState<string[]>([]);
  const [broker, setBroker] = useState("");
  const [symbol, setSymbol] = useState("");


  // ✅ NEW: nhiều khung giờ
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { start: null, end: null },
  ]);
 
  const API_URL = "http://116.105.227.149:5000";
  const API_BASE_URL = `${API_URL}/v1/api`;
  const ACCESS_TOKEN = localStorage.getItem("accessToken") || "";


  async function getAllBroker(){
    try {
      const response = await axios.get(`${API_BASE_URL}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_TOKEN,
        },
        timeout: 10000,
      });
      console.log("Response All Broker:", response);
      if (response?.data) {
        setAllBroker(response.data);
        console.log("All Broker:", response.data);
      } else {
        console.error("Không thể tải danh sách broker");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách broker");
    }
  }

  async function getSymbolBroker(broker: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${broker}/info`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_TOKEN,
        },
        timeout: 10000,
      });
      console.log("Response All Symbol:", response);
      if (response?.data) {
        setAllSymbol(response.data);
        console.log("All Symbol:", response.data);
      } else {
        console.error("Không thể tải danh sách symbol");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách symbol");
    }
  }

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

        const tsr = response.data.data.TimeStopReset;

        if (Array.isArray(tsr)) {
          const mapped = tsr.map((r: any) => ({
            start: r?.start ? dayjs(r.start, timeFormat) : null,
            end: r?.end ? dayjs(r.end, timeFormat) : null,
          }));
          setTimeRanges(mapped.length ? mapped : [{ start: null, end: null }]);
        } else {
          const start = tsr?.start ?? null;
          const end = tsr?.end ?? null;
          setTimeRanges([
            {
              start: start ? dayjs(start, timeFormat) : null,
              end: end ? dayjs(end, timeFormat) : null,
            },
          ]);
        }

        setDelayBrokerStop(response.data.data.Delay_Stop ?? 0);
        setTypeAnalysis(response.data.data.Type_Analysis ?? "type1");
      } else {
        messageApi.error("Không thể tải dữ liệu SpreadPlus");
      }
    } catch (error) {
      messageApi.error("Lỗi khi tải cấu hình");
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
      getAllBroker();
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
          onChange={() => {
            updateStatusAccount(record._id, !value, "Trạng Thái");
            console.log("Switch toggled:");
            // Handle activation toggle here
          }}
        />
      ),
    },
  ];
 async function updateStatusAccount(id_: any, status: boolean, mess: String) {
    try {
      const response = await axios.put(`${API_URL}/auth/account-user/${id_}`, {
            actived: status,
        }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_TOKEN,
        },
        
      });

      if (response.data?.ok) {
        getData_Table();
        messageApi.success(`Cập Nhật ${mess} Thành Công!`);
      } else {
        messageApi.error(`Cập Nhật ${mess} Thất Bại!`);
      }
    } catch (error) {
      messageApi.error("Lỗi khi kết nối đến server");
    }
  }

  async function updateConfigAdmin(payload: any, mess: String) {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/config`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_TOKEN,
        },
      });

      if (response.data?.success) {
        messageApi.success(`Cập Nhật ${mess} Thành Công!`);
      } else {
        messageApi.error(`Cập Nhật ${mess} Thất Bại!`);
      }
    } catch (error) {
      messageApi.error("Lỗi khi kết nối đến server");
    }
  }

  async function HandleTest(broker: any , symbol :any , points: any) {
    try {
      if(!broker || !symbol || !points) {
        messageApi.error("Thông tin không đầy đủ!");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/${broker}/${symbol}/${points}/test-reset`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_TOKEN,
        },
      });

      console.log("Response Test Delay:", response);

      if (response.data?.success) {
        messageApi.success(`Gửi Yêu Cầu Thành Công!`);
      } else {
        messageApi.error(`Gửi Yêu Cầu Thất Bại!`);
      }
    } catch (error) {
      messageApi.error("Lỗi khi kết nối đến server");
    }
  }

  const handleUpdateDelay = async () => {
    setLoadingDelay(true);
    try {
      await updateConfigAdmin({ Delay_Stop: delayBrokerStop }, "Delay Stop");
    } catch (error) {
      messageApi.error("Lỗi khi cập nhật Delay Stop");
    } finally {
      setLoadingDelay(false);
    }
  };
  // ✅ NEW: add/remove/update time ranges
  const addTimeRange = () => {
    setTimeRanges((prev) => [...prev, { start: null, end: null }]);
  };

  const removeTimeRange = (idx: number) => {
    setTimeRanges((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [{ start: null, end: null }];
    });
  };

  const updateTimeRange = (
    idx: number,
    key: "start" | "end",
    value: Dayjs | null
  ) => {
    setTimeRanges((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  // ✅ NEW: update TimeStopReset as array
  const handleUpdateTime = async () => {
    setLoading(true);
    try {
      const payloadRanges = timeRanges.map((r) => ({
        start: r.start ? r.start.format(timeFormat) : null,
        end: r.end ? r.end.format(timeFormat) : null,
      }));

      const response = await axios.put(
        `${API_BASE_URL}/admin/config`,
        {
          TimeStopReset: payloadRanges, // ✅ gửi mảng
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
            <ThunderboltOutlined style={{ fontSize: "20px", color: "white" }} />
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

        {/* Test Price Delay */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#fafafa",
            borderRadius: "8px",
            marginTop: "12px",
            border: "1px solid #f0f0f0",
          }}
        >
          <Space>
            <FileSearchOutlined style={{ fontSize: "18px", color: "#fb1072" }} />
            <div>
              <Text strong style={{ fontSize: "15px" }}>
                Test Price Delay
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Nhập vào giá trị để kiểm tra cài đặt
              </Text>
            </div>
          </Space>
          <Space>
            <Text strong style={{ fontSize: "13px" }}>
              Broker
            </Text>
            <AutoComplete
              onChange={(value) => {
                getSymbolBroker(value);
                setBroker(value);
              }}
              options={allBroker.map((b: string) => ({
                      value: b,
                      label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{b}</span>
                          <span style={{ fontSize: 11, color: '#999' }}>
                            {b.includes('mt5') ? 'MT5' : 'MT4'}
                          </span>
                        </div>
                      ),
                    }))}
              style={{ width: 130 }}
            >
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search symbol"
                allowClear
              />
            </AutoComplete>
             <Text strong style={{ fontSize: "13px" }}>
              Symbol
            </Text>
             <AutoComplete
              onChange={(value) => {
                if(broker!=="")setSymbol(value);
              }}
              options={allSymbol.map((b: string) => ({
                      value: b,
                      label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{b}</span>
                        </div>
                      ),
                    }))}
              style={{ width: 130 }}
            >
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search symbol"
                allowClear
              />
            </AutoComplete>
            <Text strong style={{ fontSize: "13px" }}>
              Points
            </Text>
            <InputNumber
              value={points}
              onChange={(value) => setPoints(value || 0)}
              style={{ width: "100px" }}
              placeholder="Nhập delay (Giây)"
            />
            <Button
              type="primary"
              loading={loadingDelay}
              onClick={() => HandleTest(broker, symbol, points)}
              style={{ background: "#fa1616", borderColor: "#fa1616" }}
            >
              Kiểm Tra
            </Button>
          </Space>
        </div>

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
            <ThunderboltOutlined style={{ fontSize: "18px", color: "#52c41a" }} />
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
            onChange={(value) => {
              setAutoTrade(value);
              updateConfigAdmin({ AutoTrade: value }, "Auto Trade");
            }}
            style={{ background: autoTrade ? "#52c41a" : undefined }}
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
            onChange={(value) => {
              setSendTelegram(value);
              updateConfigAdmin({ Send_Telegram: value }, "Send Telegram");
            }}
            style={{ background: sendTelegram ? "#1890ff" : undefined }}
          />
        </div>

        {/* Delay Broker Stop */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#fafafa",
            borderRadius: "8px",
            marginTop: "12px",
            border: "1px solid #f0f0f0",
          }}
        >
          <Space>
            <HourglassOutlined style={{ fontSize: "18px", color: "#fa8c16" }} />
            <div>
              <Text strong style={{ fontSize: "15px" }}>
                Delay Broker Stop
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Thời gian trì hoãn dừng broker (Giây)
              </Text>
            </div>
          </Space>
          <Space>
            <InputNumber
              value={delayBrokerStop}
              onChange={(value) => setDelayBrokerStop(value || 0)}
              min={0}
              max={10000}
              step={100}
              style={{ width: "80px" }}
              placeholder="Nhập delay (Giây)"
            />
            <Button
              type="primary"
              loading={loadingDelay}
              onClick={handleUpdateDelay}
              style={{ background: "#fa8c16", borderColor: "#fa8c16" }}
            >
              Cập Nhật
            </Button>
          </Space>
        </div>

        {/* Type Phân Tích */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#fafafa",
            borderRadius: "8px",
            marginTop: "12px",
            border: "1px solid #f0f0f0",
          }}
        >
          <Space>
            <AreaChartOutlined style={{ fontSize: "18px", color: "#00b176" }} />
            <div>
              <Text strong style={{ fontSize: "15px" }}>
                Type Analysis
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Chọn kiểu phân tích dữ liệu
              </Text>
            </div>
          </Space>

          <Space>
            <Select
              value={typeAnalysis}
              onChange={(value) => {
                setTypeAnalysis(value);
                updateConfigAdmin({ Type_Analysis: value }, "Type Analysis");
              }}
              style={{ width: 140 }}
              placeholder="Chọn Type"
            >
              <Select.Option value="type1">
                <Tooltip title="Phân tích kiểu 1 – tốc độ nhanh, phù hợp realtime">
                  Type 1
                </Tooltip>
              </Select.Option>

              <Select.Option value="type2">
                <Tooltip title="Phân tích kiểu 2 – chính xác hơn, xử lý sâu">
                  Type 2
                </Tooltip>
              </Select.Option>
            </Select>
          </Space>
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
              <ClockCircleOutlined style={{ fontSize: "18px", color: "#722ed1" }} />
              <div>
                <Text strong style={{ fontSize: "15px" }}>
                  Thời Gian Dừng Reset
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Cấu hình khung giờ tạm dừng hệ thống (nhiều khung)
                </Text>
              </div>
            </Space>
          </div>

          {/* ✅ NEW: render list */}
          {timeRanges.map((r, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: idx === timeRanges.length - 1 ? 0 : 12,
                padding: "10px",
                background: "rgba(255,255,255,0.6)",
                borderRadius: "8px",
                border: "1px solid #e6e6ff",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Thời gian bắt đầu
                </Text>
                <TimePicker
                  value={r.start}
                  format={timeFormat}
                  onChange={(v) => updateTimeRange(idx, "start", v)}
                  style={{ width: "100%", marginTop: "4px" }}
                  size="large"
                  placeholder="Chọn giờ bắt đầu"
                />
              </div>

              <div style={{ fontSize: "20px", color: "#722ed1", marginTop: "20px" }}>
                →
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Thời gian kết thúc
                </Text>
                <TimePicker
                  value={r.end}
                  format={timeFormat}
                  onChange={(v) => updateTimeRange(idx, "end", v)}
                  style={{ width: "100%", marginTop: "4px" }}
                  size="large"
                  placeholder="Chọn giờ kết thúc"
                />
              </div>

              <Button
                danger
                icon={<DeleteOutlined />}
                style={{ marginTop: "20px" }}
                onClick={() => removeTimeRange(idx)}
              >
                Xóa
              </Button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <Button
              icon={<PlusOutlined />}
              type="dashed"
              onClick={addTimeRange}
              style={{ borderRadius: 8 }}
            >
              Thêm khung giờ
            </Button>

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
                minWidth: "140px",
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
