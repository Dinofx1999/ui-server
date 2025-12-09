import React, { useState } from "react";
import { Modal, Switch, Table } from "antd";

const AccountModal = ({ open }: any, onCancel: any) => {
  const [autoTrade, setAutoTrade] = useState(false);
  const [sendTelegram, setSendTelegram] = useState(false);

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      width: 70
    },
    {
      title: "Fullname",
      dataIndex: "fullname",
      key: "fullname"
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username"
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email"
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password"
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role"
    },
    {
      title: "Actived",
      dataIndex: "actived",
      key: "actived",
      render: (value: any) => <Switch checked={value} />
    }
  ];

  // Sample data (bạn có thể thay bằng API)
  const data = [
    {
      key: 1,
      stt: 1,
      fullname: "Nguyễn Văn A",
      username: "nguyenvana",
      email: "a@gmail.com",
      password: "123456",
      role: "Admin",
      actived: true
    },
    {
      key: 2,
      stt: 2,
      fullname: "Trần Văn B",
      username: "tranvanb",
      email: "b@yahoo.com",
      password: "abcdef",
      role: "User",
      actived: false
    }
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Cài Đặt Tự Động"
      footer={null}
      width={900}
    >
      {/* Toggle Auto Trade */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>Auto Trade</span>
        <Switch checked={autoTrade} onChange={setAutoTrade} />
      </div>

      {/* Toggle Send Telegram */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 16 }}>Send Telegram</span>
        <Switch checked={sendTelegram} onChange={setSendTelegram} />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 5 }}
        bordered
      />
    </Modal>
  );
};

export default AccountModal;
