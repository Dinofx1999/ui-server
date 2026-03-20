// src/components/MaintenanceScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Button, Typography, Space, Tag } from "antd";
import { Wrench, RefreshCw, Clock, PhoneCall, ShieldCheck, AlertTriangle } from "lucide-react";

const { Title, Text } = Typography;

type Props = {
  brand?: string;
  headline?: string;
  subtext?: string;

  statusText?: string;       // e.g. "MAINTENANCE"
  etaText?: string;          // e.g. "Dự kiến hoàn tất: 14:30"
  incidentText?: string;     // e.g. "Mã sự cố: BA-0205"
  contactText?: string;      // e.g. "0900 888 999"
  contactHref?: string;      // e.g. "tel:0900888999" or zalo link

  autoReloadSeconds?: number; // 0 = tắt
  onReload?: () => void;
};

export default function MaintenanceScreen({
  brand = "Bảo Ân Cosmetics",
  headline = "Hệ thống đang bảo trì",
  subtext = "Chúng tôi đang nâng cấp hạ tầng để tăng tốc độ và độ ổn định. Vui lòng quay lại sau.",

  statusText = "MAINTENANCE",
  etaText = "Dự kiến hoàn tất: trong thời gian ngắn",
  incidentText = "Mã thông báo: MAINT-001",
  contactText = "0900 888 999",
  contactHref = "tel:0900888999",

  autoReloadSeconds = 60,
  onReload,
}: Props) {
  const [left, setLeft] = useState(autoReloadSeconds);

  useEffect(() => {
    if (!autoReloadSeconds || autoReloadSeconds <= 0) return;

    setLeft(autoReloadSeconds);
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          (onReload ? onReload() : window.location.reload());
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [autoReloadSeconds, onReload]);

  const progress = useMemo(() => {
    if (!autoReloadSeconds || autoReloadSeconds <= 0) return 0;
    const done = autoReloadSeconds - left;
    return Math.min(100, Math.max(0, Math.round((done / autoReloadSeconds) * 100)));
  }, [autoReloadSeconds, left]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-sky-50" />
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/70 border border-slate-200 shadow-sm flex items-center justify-center">
                <Wrench size={20} />
              </div>
              <div className="leading-tight">
                <Text className="block font-semibold text-slate-900">{brand}</Text>
                <Text type="secondary" className="text-xs">
                  System Status Center
                </Text>
              </div>
            </div>

            <Tag color="blue" className="px-3 py-1 rounded-full">
              {statusText}
            </Tag>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.10)] overflow-hidden">
            {/* Card header */}
            <div className="p-7 md:p-9">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <ShieldCheck size={26} />
                </div>

                <div className="min-w-0">
                  <Title level={2} style={{ margin: 0 }} className="!text-slate-900">
                    {headline}
                  </Title>
                  <Text type="secondary" className="text-base">
                    {subtext}
                  </Text>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2">
                      <Clock size={16} className="text-slate-700" />
                      <Text className="text-slate-700">{etaText}</Text>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2">
                      <AlertTriangle size={16} className="text-amber-700" />
                      <Text className="text-amber-800">{incidentText}</Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {autoReloadSeconds > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Text type="secondary">Tự động kiểm tra lại</Text>
                    <Text type="secondary">{left}s</Text>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button
                  type="primary"
                  size="large"
                  className="!rounded-2xl !h-11"
                  icon={<RefreshCw size={16} />}
                  onClick={() => (onReload ? onReload() : window.location.reload())}
                  block
                >
                  Tải lại trang
                </Button>

                <Button
                  size="large"
                  className="!rounded-2xl !h-11"
                  icon={<PhoneCall size={16} />}
                  href={contactHref}
                  block
                >
                  {contactText}
                </Button>
              </div>

              {/* <div className="mt-5">
                <Text type="secondary" className="text-xs">
                  Nếu bạn đang ở bước thanh toán/đặt hàng, vui lòng lưu lại mã đơn (nếu có) và liên hệ hỗ trợ để được xử lý nhanh.
                </Text>
              </div> */}
            </div>

            {/* Card footer */}
            <div className="px-7 md:px-9 py-5 bg-slate-900/[0.03] border-t border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <Text type="secondary" className="text-xs">
                  © {new Date().getFullYear()} {brand}. All rights reserved.
                </Text>
                <Space size={8}>
                  <Text type="secondary" className="text-xs">Status:</Text>
                  <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                  <Text className="text-xs text-slate-700">Đang nâng cấp</Text>
                </Space>
              </div>
            </div>
          </div>

          {/* Small hint */}
          <div className="mt-5 text-center">
            <Text type="secondary" className="text-xs">
              Bạn có thể để trang này mở — hệ thống sẽ tự kiểm tra và tải lại khi sẵn sàng.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
