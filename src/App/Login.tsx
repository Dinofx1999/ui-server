import React, { useState } from 'react';
import axios from 'axios';

export default function ForexLogin() {
  const [username, setusername] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
        const resp = await axios.post(
  'http://116.105.227.149:8000/auth/login',
  {
    username,
    password: pass,
  },
  {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // optional: giới hạn 10s
  }
);
        if (resp.data.success) {
            setMsg({ type: 'success', text: 'Đăng nhập thành công!' });
            // Lưu trạng thái đăng nhập vào localStorage
            localStorage.setItem('isLoggedIn', 'true');
            // Chuyển hướng hoặc tải lại trang
            window.location.href = '/';
        } else {
            throw new Error(resp.data.message || 'Email hoặc mật khẩu không hợp lệ.');
        }
    //   if (!username || !pass) throw new Error('Vui lòng nhập đầy đủ thông tin.');
    //   if (username.includes('@') && pass.length >= 6) {
    //     setMsg({ type: 'success', text: 'Đăng nhập thành công!' });
    //     localStorage.setItem('isLoggedIn', 'true');
    //      window.location.href = '/';
    //   } else {
    //     throw new Error('Email hoặc mật khẩu không hợp lệ.');
    //   }
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Có lỗi xảy ra.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060b10] text-gray-100">
      {/* Glow gradient */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      {/* Background candlestick grid */}
      <CandlesBackdrop />

      {/* Ticker */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur supports-[backdrop-filter]:bg-black/20">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <span className="text-xs tracking-widest text-emerald-400">MARKET TICKER</span>
          <div className="relative w-full overflow-hidden">
            <ul className="ticker flex gap-8 whitespace-nowrap text-sm text-gray-300">
              {[
                {s:'EURUSD', p:'1.0843', ch:'+0.21%'},
                {s:'GBPUSD', p:'1.2761', ch:'-0.08%'},
                {s:'USDJPY', p:'149.62', ch:'+0.34%'},
                {s:'XAUUSD', p:'2385.4', ch:'+0.12%'},
                {s:'WTI',    p:'78.12',  ch:'-0.55%'},
                {s:'BTCUSD', p:'71234',  ch:'+1.12%'},
              ].map((i, idx)=>(
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-gray-400">{i.s}</span>
                  <span className="font-semibold">{i.p}</span>
                  <span className={i.ch.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}>{i.ch}</span>
                </li>
              ))}
              {/* clone để loop mượt */}
              {[
                {s:'EURUSD', p:'1.0843', ch:'+0.21%'},
                {s:'GBPUSD', p:'1.2761', ch:'-0.08%'},
                {s:'USDJPY', p:'149.62', ch:'+0.34%'},
                {s:'XAUUSD', p:'2385.4', ch:'+0.12%'},
                {s:'WTI',    p:'78.12',  ch:'-0.55%'},
                {s:'BTCUSD', p:'71234',  ch:'+1.12%'},
              ].map((i, idx)=>(
                <li key={`clone-${idx}`} className="flex items-center gap-2">
                  <span className="text-gray-400">{i.s}</span>
                  <span className="font-semibold">{i.p}</span>
                  <span className={i.ch.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}>{i.ch}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="relative mx-auto grid min-h-[calc(100vh-56px)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 md:grid-cols-2">
        {/* Left: tagline */}
        <div className="relative z-10">
          <Badge>Forex Suite</Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
            Đăng nhập <span className="text-emerald-400">Trader Hub</span>
          </h1>
          <p className="mt-3 max-w-xl text-gray-400">
            Bảng điều khiển tín hiệu, quản trị rủi ro, và số liệu thị trường theo thời gian thực.
            Đồng bộ dữ liệu với MT4/MT5, quản lý giao dịch.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-gray-300">
            {[
              'Tín hiệu Price Action & Candle',
              'Watchlist nhiều sản phẩm của các sàn Forex hàng đầu',
              'Quản lý lợi nhuận',
              'Auto Trade với MT4/MT5',
              // 'Copy Trade chuyên nghiệp',
            ].map((t, i)=>(
              <li key={i} className="flex items-center gap-2">
                <CheckIcon />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <PulseDot className="bg-emerald-400" />
              Realtime Feeds
            </div>
            <div className="flex items-center gap-2">
              <PulseDot className="bg-cyan-400" />
              Secure Auth
            </div>
            <div className="flex items-center gap-2">
              <PulseDot className="bg-purple-400" />
              MT4/MT5 Bridge
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <div className="relative z-10">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <LogoFX />
              <div>
                <h2 className="text-xl font-bold">Đăng nhập tài khoản</h2>
                <p className="text-sm text-gray-400">Truy cập bảng điều khiển Forex</p>
              </div>
            </div>

            {msg && (
              <div
                className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                  msg.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
              <div>
                <label className="mb-1 block text-sm text-gray-300" htmlFor="email">
                  Email
                </label>
                <div className="group relative">
                  <input
                    id="email"
                    type="text"
                    placeholder="you@example.com or username"
                    value={username}
                    onChange={(e) => setusername(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/30 placeholder:text-gray-500 focus:border-emerald-500/40 focus:ring"
                    autoComplete="email"
                    required
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50">
                    <MailIcon />
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-300" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none ring-emerald-500/30 placeholder:text-gray-500 focus:border-emerald-500/40 focus:ring"
                    autoComplete="current-password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  >
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-emerald-500"
                    checked={remember}
                    onChange={(e)=>setRemember(e.target.checked)}
                  />
                  <span className="text-gray-300">Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className="text-emerald-400 hover:text-emerald-300">Quên mật khẩu?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LockIcon />
                    Đăng nhập
                  </>
                )}
                <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Chưa có tài khoản?{' '}
              <a href="#" className="text-emerald-400 hover:text-emerald-300">Tạo tài khoản</a>
            </div>

            {/* Terms */}
            <p className="mt-4 text-center text-[11px] leading-5 text-gray-500">
              Bằng việc đăng nhập, bạn đồng ý với{' '}
              <a href="#" className="text-gray-400 underline hover:text-gray-300">Điều khoản</a> &{' '}
              <a href="#" className="text-gray-400 underline hover:text-gray-300">Chính sách bảo mật</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Sub Components ---------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      {children}
    </span>
  );
}

function PulseDot({ className='' }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-2.5 w-2.5 items-center justify-center rounded-full ${className}`}>
      <span className="absolute h-full w-full animate-ping rounded-full bg-current opacity-75" />
      <span className="relative block h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path className="opacity-90" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Zm0 12.5a5 5 0 1 1 0-10a5 5 0 0 1 0 10Z"/>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="currentColor" d="M2.1 3.51L3.5 2.1l18.4 18.39l-1.4 1.41l-3.2-3.2A12.44 12.44 0 0 1 12 19.5C7 19.5 2.73 16.39 1 12a12.7 12.7 0 0 1 4.23-5.77L2.1 3.5ZM12 6.5a5.5 5.5 0 0 1 5.5 5.5c0 .67-.11 1.32-.33 1.92L13.08 9.83A2.98 2.98 0 0 0 9.83 6.9L8.58 5.66A5.46 5.46 0 0 1 12 6.5Zm0 11a5.5 5.5 0 0 0 5.5-5.5c0-.67-.11-1.32-.33-1.92l-4.09-4.09A5.5 5.5 0 0 0 6.5 12c0 .67.11 1.32.33 1.92l4.09 4.08A5.45 5.45 0 0 0 12 17.5Z"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="currentColor" d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-6 8.73V17a1 1 0 1 1 2 0v-.27a2 2 0 1 1-2 0ZM9 6a3 3 0 0 1 6 0v2H9V6Z"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.9l10-5.9V6a2 2 0 0 0-2-2Zm0 4.25l-8 4.71l-8-4.71V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.25Z"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400">
      <path fill="currentColor" d="m9 16.17l-3.88-3.88L3.71 13.7L9 19l12-12l-1.41-1.41z"/>
    </svg>
  );
}
function LogoFX() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/30">
      <svg viewBox="0 0 64 64" className="h-6 w-6 text-emerald-400">
        <path
          d="M12 44 V20 M20 52 V16 M28 36 V12 M36 48 V24 M44 40 V18 M52 50 V28"
          stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none"
        />
        <path d="M10 10h44v44H10z" stroke="currentColor" strokeOpacity=".25" strokeWidth="1" fill="none"/>
      </svg>
    </div>
  );
}

function CandlesBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 h-full w-full opacity-[0.15]" viewBox="0 0 1000 600" preserveAspectRatio="none">
        {/* grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* random candles */}
      <div className="absolute inset-0">
        {Array.from({length: 22}).map((_, i) => (
          <Candle key={i} left={`${(i*4.5)%100}%`} />
        ))}
      </div>
    </div>
  );
}

function Candle({ left }: { left: string }) {
  const h = 30 + Math.floor(Math.random()*180);
  const bull = Math.random() > 0.45;
  const body = Math.max(12, Math.floor(h*0.4));
  return (
    <div className="absolute bottom-10" style={{ left, transform: `translateX(-50%)` }}>
      <div className="mx-auto h-[180px] w-px bg-white/10" />
      <div className={`mx-auto mt-1`}>
        <div className={`mx-auto w-1 rounded ${bull ? 'bg-emerald-400/50' : 'bg-red-400/50'}`} style={{ height: `${h}px` }} />
        <div className={`mx-auto -mt-2 w-3 rounded ${bull ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ height: `${body}px` }} />
      </div>
    </div>
  );
}

/* ---------- CSS cần thêm vào globals.css ----------
.ticker { animation: marquee 22s linear infinite; }
@keyframes marquee { 0% { transform: translateX(0%);} 100% { transform: translateX(-50%);} }
*/
