import React from 'react';
import { Modal } from 'antd';

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  isDark?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({ open, onClose, title, children, isDark }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span style={{ color: isDark ? '#10b981' : '#f900bf', fontWeight: 700 }}>{title}</span>}
      width="80%"
      modalRender={(dom) => (
    <div style={{ borderRadius: 12, overflow: 'hidden' }}>{dom}</div>
  )}
        styles={{
    body: {
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#111827',
      borderRadius: 12,
      padding: 24,
      transition: 'all 0.3s ease',
    },
    
    content: {
      background: isDark ? '#1e293b' : '#f9fafb',
      borderRadius: 12,
    },
    header: {
      background: isDark ? '#1e293b' : '#f9fafb',
      borderRadius: 12,
    },
  }}
      style={{
        background: isDark ? '#1e293b' : '#f9fafb',
      }}
    >
      {children}
    </Modal>
  );
};

export default CustomModal;
