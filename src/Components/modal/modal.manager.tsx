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
  AutoComplete,
  Row,
  Col,
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
  SearchOutlined,
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
  const [dataTable, setDataTable] = useState<any[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [delayBrokerStop, setDelayBrokerStop] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
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

  // =========================================================
  // ✅ EDIT USER + LOGIN WINDOW (CHỈ THÊM, KHÔNG ẢNH HƯỞNG PHẦN KHÁC)
  // =========================================================
  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState(""); // optional
  const [editRule, setEditRule] = useState("User");
  const [editActived, setEditActived] = useState(false);

  // loginWindow
  const [lwEnabled, setLwEnabled] = useState(true);
  const [lwStart, setLwStart] = useState<Dayjs | null>(null);
  const [lwEnd, setLwEnd] = useState<Dayjs | null>(null);
  const [lwOvernight, setLwOvernight] = useState(false);

  const openEditModal = (record: any) => {
    setEditingUser(record);

    setEditName(record?.name || "");
    setEditEmail(record?.email || "");
    setEditUsername(record?.username || "");
    setEditPassword("");
    setEditRule(record?.rule || "User");
    setEditActived(!!record?.actived);

    // map loginWindow
    const lw = record?.loginWindow || {};
    const startMin =
      typeof lw.startMinute === "number" ? lw.startMinute : 14 * 60;
    const endMin = typeof lw.endMinute === "number" ? lw.endMinute : 18 * 60;

    setLwEnabled(lw.enabled !== false);
    setLwOvernight(!!lw.allowOvernight);
    setLwStart(dayjs().startOf("day").add(startMin, "minute"));
    setLwEnd(dayjs().startOf("day").add(endMin, "minute"));

    setOpenEdit(true);
  };

  const closeEditModal = () => {
    setOpenEdit(false);
    setSavingEdit(false);
    setEditingUser(null);

    setEditName("");
    setEditEmail("");
    setEditUsername("");
    setEditPassword("");
    setEditRule("User");
    setEditActived(false);

    setLwEnabled(true);
    setLwOvernight(false);
    setLwStart(null);
    setLwEnd(null);
  };

  const submitEditUser = async () => {
    try {
      if (!editingUser?._id) return;

      if (!String(editName).trim())
        return messageApi.error("Fullname không được để trống!");
      if (!String(editUsername).trim())
        return messageApi.error("Username không được để trống!");
      if (!String(editEmail).trim())
        return messageApi.error("Email không được để trống!");

      setSavingEdit(true);

      const payload: any = {
        name: String(editName).trim(),
        email: String(editEmail).trim(),
        username: String(editUsername).trim(),
        rule: editRule,
        actived: editActived,
        loginWindow: {
          enabled: lwEnabled,
          startMinute: lwStart ? lwStart.hour() * 60 + lwStart.minute() : 0,
          endMinute: lwEnd ? lwEnd.hour() * 60 + lwEnd.minute() : 1439,
          allowOvernight: lwOvernight,
          timezone: "Asia/Ho_Chi_Minh",
        },
      };

      // password optional
      if (String(editPassword || "").trim().length > 0) {
        payload.password = String(editPassword).trim();
      }

      const response = await axios.put(
        `${API_URL}/auth/account-user/${editingUser._id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ACCESS_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data?.ok) {
        messageApi.success("Cập nhật User thành công!");
        closeEditModal();
        getData_Table();
      } else {
        messageApi.error(response.data?.message || "Cập nhật User thất bại!");
      }
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message || "Lỗi khi kết nối đến server"
      );
    } finally {
      setSavingEdit(false);
    }
  };
  // =========================================================

  async function getAllBroker() {
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
        <Text strong style={{ color: "#1890ff" }}>{index + 1}</Text>
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
      title: "Last Online",
      dataIndex: "last_online",
      key: "last_online",
      render: (text: string) => <Text type="secondary">{text}</Text>,
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
        <Text code style={{ fontSize: "11px" }}>{text}</Text>
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
          }}
        />
      ),
    },

    // ✅ THÊM ACTION EDIT (KHÔNG ẢNH HƯỞNG CÁC CỘT KHÁC)
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      width: 120,
      render: (_: any, record: any) => (
        <Button size="small" onClick={() => openEditModal(record)}>
          Edit
        </Button>
      ),
    },
  ];

  async function updateStatusAccount(id_: any, status: boolean, mess: String) {
    try {
      const response = await axios.put(
        `${API_URL}/auth/account-user/${id_}`,
        {
          actived: status,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ACCESS_TOKEN,
          },
        }
      );

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

  async function HandleTest(broker: any, symbol: any, points: any) {
    try {
      if (!broker || !symbol || !points) {
        messageApi.error("Thông tin không đầy đủ!");
        return;
      }
      const response = await axios.get(
        `${API_BASE_URL}/${broker}/${symbol}/${points}/test-reset`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ACCESS_TOKEN,
          },
        }
      );

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
          marginBottom: 20,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
        styles={{ body: { padding: 20 } }}
      >
        <Title level={5} style={{ marginBottom: 16, color: "#262626" }}>
          ⚙️ Cấu Hình Giao Dịch
        </Title>

        {/* =======================
            TEST PRICE DELAY
        ======================= */}
        <div
          style={{
            padding: 16,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
            marginTop: 12,
          }}
        >
          <Row gutter={[12, 12]} align="middle">
            {/* LEFT */}
            <Col xs={24} md={8}>
              <Space align="start">
                <FileSearchOutlined
                  style={{ fontSize: 18, color: "#fb1072", marginTop: 3 }}
                />
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    Test Price Delay
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Nhập Broker / Symbol / Points để kiểm tra cài đặt
                  </Text>
                </div>
              </Space>
            </Col>

            {/* RIGHT - Controls */}
            <Col xs={24} md={16}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} lg={8}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <Text strong style={{ fontSize: 12, color: "#595959" }}>
                      Broker
                    </Text>
                    <AutoComplete
                      value={broker}
                      onSelect={(value) => {
                        setBroker(value);
                        setSymbol("");
                        getSymbolBroker(value);
                      }}
                      onChange={(value) => setBroker(value)}
                      options={allBroker.map((b: string) => ({
                        value: b,
                        label: (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{b}</span>
                            <span style={{ fontSize: 11, color: "#999" }}>
                              {b.includes("mt5") ? "MT5" : "MT4"}
                            </span>
                          </div>
                        ),
                      }))}
                    >
                      <Input
                        prefix={<SearchOutlined />}
                        placeholder="Search broker"
                        allowClear
                      />
                    </AutoComplete>
                  </div>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <Text strong style={{ fontSize: 12, color: "#595959" }}>
                      Symbol
                    </Text>
                    <AutoComplete
                      value={symbol}
                      disabled={!broker}
                      onSelect={(value) => setSymbol(value)}
                      onChange={(value) => setSymbol(value)}
                      options={allSymbol.map((s: string) => ({
                        value: s,
                        label: s,
                      }))}
                    >
                      <Input
                        prefix={<SearchOutlined />}
                        placeholder={broker ? "Search symbol" : "Chọn broker trước"}
                        allowClear
                      />
                    </AutoComplete>
                  </div>
                </Col>

                <Col xs={24} sm={12} lg={4}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <Text strong style={{ fontSize: 12, color: "#595959" }}>
                      Points
                    </Text>
                    <InputNumber
                      value={points}
                      onChange={(value) => setPoints(value || 0)}
                      style={{ width: "100%" }}
                      min={0}
                      placeholder="Points"
                    />
                  </div>
                </Col>

                <Col xs={24} sm={12} lg={4}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <Text strong style={{ fontSize: 12, color: "transparent" }}>
                      .
                    </Text>
                    <Button
                      type="primary"
                      loading={loadingDelay}
                      disabled={!broker || !symbol || !points}
                      onClick={() => HandleTest(broker, symbol, points)}
                      style={{
                        width: "100%",
                        background: "#fa1616",
                        borderColor: "#fa1616",
                        fontWeight: 600,
                      }}
                    >
                      Kiểm Tra
                    </Button>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        {/* ==============
            TOGGLE ITEM
        ============== */}
        {[
          {
            icon: (
              <ThunderboltOutlined style={{ fontSize: 18, color: "#52c41a" }} />
            ),
            title: "Auto Trade",
            desc: "Tự động thực hiện giao dịch",
            checked: autoTrade,
            onChange: (v: boolean) => {
              setAutoTrade(v);
              updateConfigAdmin({ AutoTrade: v }, "Auto Trade");
            },
            bg: autoTrade ? "#52c41a" : undefined,
            mt: 12,
          },
          {
            icon: <SendOutlined style={{ fontSize: 18, color: "#1890ff" }} />,
            title: "Send Telegram",
            desc: "Gửi thông báo qua Telegram",
            checked: sendTelegram,
            onChange: (v: boolean) => {
              setSendTelegram(v);
              updateConfigAdmin({ Send_Telegram: v }, "Send Telegram");
            },
            bg: sendTelegram ? "#1890ff" : undefined,
            mt: 12,
          },
        ].map((it, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              background: "#fafafa",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
              marginTop: it.mt,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Space align="start">
              {it.icon}
              <div>
                <Text strong style={{ fontSize: 15 }}>
                  {it.title}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {it.desc}
                </Text>
              </div>
            </Space>

            <Switch
              checked={it.checked}
              onChange={it.onChange}
              style={{ background: it.bg }}
            />
          </div>
        ))}

        {/* =======================
            DELAY BROKER STOP
        ======================= */}
        <div
          style={{
            padding: 16,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
            marginTop: 12,
          }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={12}>
              <Space align="start">
                <HourglassOutlined
                  style={{ fontSize: 18, color: "#fa8c16", marginTop: 3 }}
                />
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    Delay Broker Stop
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Thời gian trì hoãn dừng broker (Giây)
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <Row gutter={[12, 12]} justify="end">
                <Col xs={24} sm={12} md={10}>
                  <InputNumber
                    value={delayBrokerStop}
                    onChange={(value) => setDelayBrokerStop(value || 0)}
                    min={0}
                    max={10000}
                    step={100}
                    style={{ width: "100%" }}
                    placeholder="Nhập delay (Giây)"
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Button
                    type="primary"
                    loading={loadingDelay}
                    onClick={handleUpdateDelay}
                    style={{
                      width: "100%",
                      background: "#fa8c16",
                      borderColor: "#fa8c16",
                      fontWeight: 600,
                    }}
                  >
                    Cập Nhật
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        {/* =======================
            TYPE ANALYSIS
        ======================= */}
        <div
          style={{
            padding: 16,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
            marginTop: 12,
          }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={12}>
              <Space align="start">
                <AreaChartOutlined
                  style={{ fontSize: 18, color: "#00b176", marginTop: 3 }}
                />
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    Type Analysis
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chọn kiểu phân tích dữ liệu
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Select
                  value={typeAnalysis}
                  onChange={(value) => {
                    setTypeAnalysis(value);
                    updateConfigAdmin({ Type_Analysis: value }, "Type Analysis");
                  }}
                  style={{ width: "100%", maxWidth: 220 }}
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
              </div>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: "20px 0" }} />

        {/* =======================
            TIME CONFIGURATION
        ======================= */}
        <div
          style={{
            padding: 16,
            background:
              "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            borderRadius: 8,
            border: "1px solid #d9d9ff",
          }}
        >
          <Space align="start" style={{ marginBottom: 16 }}>
            <ClockCircleOutlined
              style={{ fontSize: 18, color: "#722ed1", marginTop: 3 }}
            />
            <div>
              <Text strong style={{ fontSize: 15 }}>
                Thời Gian Dừng Reset
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cấu hình khung giờ tạm dừng hệ thống (nhiều khung)
              </Text>
            </div>
          </Space>

          {timeRanges.map((r, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                background: "rgba(255,255,255,0.6)",
                borderRadius: 8,
                border: "1px solid #e6e6ff",
                marginBottom: idx === timeRanges.length - 1 ? 0 : 12,
              }}
            >
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={10}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Thời gian bắt đầu
                  </Text>
                  <TimePicker
                    value={r.start}
                    format={timeFormat}
                    onChange={(v) => updateTimeRange(idx, "start", v)}
                    style={{ width: "100%", marginTop: 6 }}
                    size="large"
                    placeholder="Chọn giờ bắt đầu"
                  />
                </Col>

                <Col xs={24} md={10}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Thời gian kết thúc
                  </Text>
                  <TimePicker
                    value={r.end}
                    format={timeFormat}
                    onChange={(v) => updateTimeRange(idx, "end", v)}
                    style={{ width: "100%", marginTop: 6 }}
                    size="large"
                    placeholder="Chọn giờ kết thúc"
                  />
                </Col>

                <Col xs={24} md={4}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    style={{ width: "100%", marginTop: 18 }}
                    onClick={() => removeTimeRange(idx)}
                  >
                    Xóa
                  </Button>
                </Col>
              </Row>
            </div>
          ))}

          <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12}>
              <Button
                icon={<PlusOutlined />}
                type="dashed"
                onClick={addTimeRange}
                style={{ width: "100%", borderRadius: 8 }}
              >
                Thêm khung giờ
              </Button>
            </Col>

            <Col xs={24} sm={12}>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleUpdateTime}
                style={{
                  width: "100%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                Cập Nhật
              </Button>
            </Col>
          </Row>
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

        {/* ✅ MODAL EDIT USER + LOGIN WINDOW */}
        <Modal
          open={openEdit}
          onCancel={closeEditModal}
          onOk={submitEditUser}
          okText="Lưu"
          cancelText="Huỷ"
          confirmLoading={savingEdit}
          title={`✏️ Edit User: ${editingUser?.username || ""}`}
        >
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Text strong>Fullname</Text>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nhập fullname"
              />
            </Col>

            <Col span={24}>
              <Text strong>Email</Text>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Nhập email"
              />
            </Col>

            <Col span={24}>
              <Text strong>Username</Text>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Nhập username"
              />
            </Col>

            <Col span={24}>
              <Text strong>Password (tuỳ chọn)</Text>
              <Input.Password
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Để trống nếu không đổi"
              />
            </Col>
            

            <Col span={12}>
              <Text strong>Role</Text>
              <Select
                value={editRule}
                onChange={(v) => setEditRule(v)}
                style={{ width: "100%" }}
              >
                <Select.Option value="Admin">Admin</Select.Option>
                <Select.Option value="Manager">Manager</Select.Option>
                <Select.Option value="User">User</Select.Option>
                <Select.Option value="Guest">Guest</Select.Option>
              </Select>
            </Col>

            <Col span={12}>
              <Text strong>Status</Text>
              <div style={{ marginTop: 6 }}>
                <Switch
                  checked={editActived}
                  onChange={(v) => setEditActived(v)}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0" }} />

          <Text strong>⏰ Khung Giờ Phiên Đăng Nhập (loginWindow)</Text>

          <Space
            direction="vertical"
            style={{ width: "100%", marginTop: 10 }}
            size={12}
          >
            <Switch
              checked={lwEnabled}
              onChange={setLwEnabled}
              checkedChildren="Giới hạn"
              unCheckedChildren="Không giới hạn"
            />

            <Row gutter={12}>
              <Col span={12}>
                <Text type="secondary">Giờ bắt đầu</Text>
                <TimePicker
                  value={lwStart}
                  onChange={setLwStart}
                  format="HH:mm"
                  disabled={!lwEnabled}
                  style={{ width: "100%" }}
                />
              </Col>

              <Col span={12}>
                <Text type="secondary">Giờ kết thúc</Text>
                <TimePicker
                  value={lwEnd}
                  onChange={setLwEnd}
                  format="HH:mm"
                  disabled={!lwEnabled}
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>

            <Switch
              checked={lwOvernight}
              onChange={setLwOvernight}
              disabled={!lwEnabled}
              checkedChildren="Cho phép qua ngày (VD: 22h → 02h)"
              unCheckedChildren="Không qua ngày"
            />
          </Space>
        </Modal>

        <Table
          columns={columns as any}
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
