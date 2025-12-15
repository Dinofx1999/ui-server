import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Badge, Drawer, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  CopyOutlined,
  BellOutlined,
  MoonOutlined,
  SunOutlined,
  MenuOutlined,
  CloseOutlined,
  HomeOutlined,
  DollarOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

import { App } from 'antd';

const { Header, Content, Footer } = Layout;

type MainLayoutProps = {
    handle_dark_mode_toggle?: () => void;
};
  setInterval(async () => {
     const refreshToken = localStorage.getItem("refreshToken") || "";
    const values = {
      refreshToken: refreshToken 
    };
    axios.post('http://116.105.227.149:9000/auth/refresh', values, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        // form.resetFields(); // Reset form sau khi submit thành công
      })
      .catch(error => {

      });
  }, (60000 * 10));

const MainLayout: React.FC<MainLayoutProps> = ({ handle_dark_mode_toggle }) => {

  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('darkMode') === 'true');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current tab from URL
  const currentPath = location.pathname;
  const selectedTab = currentPath.includes('/price') ? 'price' : 
                     currentPath.includes('/candle') ? 'candle' : 'home';

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


 // Cập nhật mỗi phút

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleDarkModeToggle = (value: boolean) => {
    handle_dark_mode_toggle?.();
    setDarkMode(value);
    document.documentElement.classList.toggle('dark', value);
    localStorage.setItem('darkMode', value.toString());
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('fullname');
    localStorage.removeItem('role');
    localStorage.removeItem('id_SECRET');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

 const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
{
  key: 'Key SECRET',
  icon: <CopyOutlined />,
  label: localStorage.getItem("id_SECRET"),
  onClick: () => {
    const secretKey = localStorage.getItem("id_SECRET");
    console.log("SECRET Key to copy:", secretKey);

    if (!secretKey) {
      messageApi.error("Không tìm thấy Key!");
      return;
    }

    // Fallback để copy trong mọi trường hợp
    const fallbackCopy = (text: string) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    };

    try {
      // Nếu browser hỗ trợ clipboard API
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(secretKey)
          .then(() => {
            messageApi.success("Đã copy Key SECRET!");
            console.log("Copied SECRET Key:", secretKey);
          })
          .catch((err) => {
            console.error("Clipboard API failed, using fallback", err);
            fallbackCopy(secretKey);
            messageApi.success("Đã copy Key SECRET!");
          });
      } else {
        // Dùng fallback khi clipboard API không hoạt động
        fallbackCopy(secretKey);
        messageApi.success("Đã copy Key SECRET!");
      }
    } catch (error) {
      console.error("Error copying SECRET Key:", error);
      fallbackCopy(secretKey);
      messageApi.success("Đã copy Key SECRET!");
    }
  },
},

    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Handle tab navigation
  const handleTabClick = (tabKey: string) => {
    navigate(`/${tabKey}`);
    setMobileMenuOpen(false);
  };

  // Navigation items with icons
  const navItems = [
    { key: 'home', label: 'Home', icon: <HomeOutlined /> },
    { key: 'price', label: 'Price', icon: <DollarOutlined /> },
    // { key: 'candle', label: 'Candle', icon: <LineChartOutlined /> },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Fixed Header */}
      {contextHolder} 
      <Header style={{
        background: darkMode ? '#1f2937' : '#ffffff',
        padding: isMobile ? '0 16px' : isTablet ? '0 24px' : '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: isMobile ? '56px' : '64px',
        lineHeight: isMobile ? '56px' : '64px',
        boxShadow: darkMode 
          ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
      }}>
        {/* Left Section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '12px' : '32px',
          height: '100%',
          flex: 1,
          minWidth: 0,
        }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: darkMode ? '#374151' : '#f3f4f6',
                color: darkMode ? '#f3f4f6' : '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MenuOutlined style={{ fontSize: '18px' }} />
            </button>
          )}

          {/* Logo */}
          <div 
            onClick={() => navigate('/')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '8px' : '12px',
              height: '100%',
              cursor: 'pointer',
              minWidth: 0,
            }}
          >
            <div style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              background: '#2563eb',
              borderRadius: isMobile ? '6px' : '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ 
                color: '#fff', 
                fontSize: isMobile ? '16px' : '20px', 
                fontWeight: '700' 
              }}>
                D
              </span>
            </div>
            {!isMobile && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                minWidth: 0,
              }}>
                <div style={{
                  fontSize: isTablet ? '15px' : '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f3f4f6' : '#111827',
                  lineHeight: '20px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  DinoHunter
                </div>
                <div style={{
                  fontSize: '11px',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  lineHeight: '14px',
                  whiteSpace: 'nowrap',
                }}>
                  Trading Platform
                </div>
              </div>
            )}
          </div>

          {/* Desktop/Tablet Navigation */}
          {!isMobile && (
            <nav style={{ 
              display: 'flex', 
              gap: '4px',
              alignItems: 'center',
              height: '100%',
            }}>
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleTabClick(item.key)}
                  style={{
                    padding: isTablet ? '8px 16px' : '10px 20px',
                    border: 'none',
                    background: selectedTab === item.key
                      ? (darkMode ? '#374151' : '#f3f4f6')
                      : 'transparent',
                    color: selectedTab === item.key
                      ? (darkMode ? '#f3f4f6' : '#111827')
                      : (darkMode ? '#9ca3af' : '#6b7280'),
                    borderRadius: '6px',
                    fontSize: isTablet ? '13px' : '14px',
                    fontWeight: selectedTab === item.key ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTab !== item.key) {
                      e.currentTarget.style.background = darkMode ? '#374151' : '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTab !== item.key) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {isTablet && item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Right Section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '8px' : '12px',
          height: '100%',
          flexShrink: 0,
        }}>
          {/* Live Status - Hide on mobile */}
          {!isMobile && (
            <button
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '6px',
                border: 'none',
                background: darkMode ? '#374151' : '#f3f4f6',
                color: darkMode ? '#10b981' : '#059669',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                marginRight: '6px',
                animation: 'pulse 2s infinite',
              }} />
              LIVE
            </button>
          )}

          {/* Time - Hide on mobile */}
       

          {/* Notifications */}
          <Badge count={3} size="small">
            <button style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: isMobile ? '6px' : '8px',
              border: 'none',
              background: darkMode ? '#374151' : '#f3f4f6',
              color: darkMode ? '#d1d5db' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}>
              <BellOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
            </button>
          </Badge>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => handleDarkModeToggle(!darkMode)}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: isMobile ? '6px' : '8px',
              border: 'none',
              background: darkMode ? '#374151' : '#f3f4f6',
              color: darkMode ? '#fbbf24' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            {darkMode ? 
              <MoonOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} /> : 
              <SunOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
            }
          </button>

          {/* User Menu - Compact on mobile */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0' : '8px',
              padding: isMobile ? '6px' : '6px 12px 6px 6px',
              borderRadius: isMobile ? '6px' : '8px',
              background: darkMode ? '#374151' : '#f3f4f6',
              cursor: 'pointer',
              height: isMobile ? '36px' : '40px',
              flexShrink: 0,
            }}>
              <Avatar
                size={isMobile ? 24 : 28}
                style={{ background: '#2563eb' }}
                icon={<UserOutlined />}
              />
              {!isMobile && (
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: darkMode ? '#f3f4f6' : '#111827',
                  whiteSpace: 'nowrap',
                }}>
                   {localStorage.getItem('fullname')}
                </span>
              )}
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: '#2563eb',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>D</span>
              </div>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f3f4f6' : '#111827',
                }}>
                  DinoHunter
                </div>
                <div style={{
                  fontSize: '12px',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                }}>
                  Trading Platform
                </div>
              </div>
            </div>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{
          body: {
            padding: 0,
            background: darkMode ? '#1f2937' : '#ffffff',
          },
          header: {
            background: darkMode ? '#1f2937' : '#ffffff',
            borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          },
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* Navigation Items */}
          <div style={{ flex: 1, padding: '16px 0' }}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  border: 'none',
                  background: selectedTab === item.key
                    ? (darkMode ? '#374151' : '#f3f4f6')
                    : 'transparent',
                  color: selectedTab === item.key
                    ? (darkMode ? '#f3f4f6' : '#111827')
                    : (darkMode ? '#9ca3af' : '#6b7280'),
                  fontSize: '15px',
                  fontWeight: selectedTab === item.key ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                }}
              >
                {React.cloneElement(item.icon, { 
                  style: { fontSize: '18px' } 
                })}
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Status Info */}
          <div style={{
            padding: '16px 24px',
            borderTop: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{
                fontSize: '13px',
                color: darkMode ? '#10b981' : '#059669',
                fontWeight: '600',
              }}>
                LIVE
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '13px',
                color: darkMode ? '#9ca3af' : '#6b7280',
              }}>
                12:30 PM
              </span>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Content with Outlet for nested routes */}
      <Content style={{
        padding: isMobile ? '12px 8px' : isTablet ? '16px 12px' : '24px 16px',
        background: darkMode ? '#111827' : '#f9fafb',
        minHeight: `calc(100vh - ${isMobile ? '112px' : '128px'})`,
      }}>
        <div style={{ maxWidth: '100%' }}>
          <div style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: isMobile ? '12px' : '16px',
            border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            minHeight: isMobile ? '400px' : '600px',
            overflow: 'hidden',
          }}>
            {/* Outlet renders nested route components */}
            <Outlet />
          </div>
        </div>
      </Content>

      {/* Footer */}
      <Footer style={{
        textAlign: 'center',
        background: darkMode ? '#1f2937' : '#ffffff',
        borderTop: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        padding: isMobile ? '16px' : '20px',
      }}>
        <div style={{
          fontSize: isMobile ? '12px' : '13px',
          color: darkMode ? '#9ca3af' : '#6b7280',
        }}>
          {isMobile ? (
            <>© {new Date().getFullYear()} DinoHunter 
            <p>Đây Là Hệ Thống Phân Tích Nội Bộ Được Sử Dụng Cá Nhân</p>
            <p>Chúng tôi miễn trừ mọi trách nhiệm, đối với cá nhân nào sử dụng hệ thống này.</p>
            </>
          ) : (
            <>© {new Date().getFullYear()} DinoHunter Trading Platform. All rights reserved.
              <p>Đây Là Hệ Thống Phân Tích Nội Bộ Được Sử Dụng Cá Nhân</p>
            <p>Chúng tôi miễn trừ mọi trách nhiệm, đối với cá nhân nào sử dụng hệ thống này.</p>
            </>
          )}
        </div>
      </Footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.5;
            transform: scale(0.9);
          }
        }

        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: ${darkMode ? '#1f2937' : '#f9fafb'};
        }

        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#374151' : '#d1d5db'};
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#4b5563' : '#9ca3af'};
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

        /* Drawer animations */
        .ant-drawer-content-wrapper {
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
        }

        /* Badge responsive */
        @media (max-width: 768px) {
          .ant-badge-count {
            font-size: 10px;
            height: 16px;
            line-height: 16px;
            min-width: 16px;
            padding: 0 4px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default MainLayout;