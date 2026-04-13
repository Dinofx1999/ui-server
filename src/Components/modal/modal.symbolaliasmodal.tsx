import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { CSSProperties } from 'react';

const API          = 'http://116.105.227.149:5000/api/symbol-aliases';
const API_URL      = 'http://116.105.227.149:5000';
const API_BASE_URL = `${API_URL}/v1/api`;
const ACCESS_TOKEN = localStorage.getItem('accessToken') || '';

// ===================== TYPES =====================
interface Msg { type: 'error' | 'success'; text: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  initialSymbol?: string;
  onSaved?: () => void;
}

interface BrokerDigitEntry { name: string; digits: number; }

interface SymbolAliasItem {
  _id: string;
  symbol: string;
  aliases: string[];
  description: string;
  active: boolean;
  maxDigits: number | null;
  brokerDigits: Record<string, number>;
  updatedAt: string;
}

// ===================== RESPONSIVE HOOK =====================
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

// ===================== STYLE HELPERS =====================
const base = {
  input: {
    width: '100%', padding: '9px 12px',
    background: '#161820', border: '1px solid #2a2d3a',
    borderRadius: 8, color: '#e2e8f0', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  } as CSSProperties,

  inputSm: {
    padding: '7px 10px',
    background: '#161820', border: '1px solid #2a2d3a',
    borderRadius: 8, color: '#e2e8f0', fontSize: 12,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'monospace', transition: 'border-color 0.15s',
  } as CSSProperties,

  inputAdmin: {
    padding: '7px 10px',
    background: '#1a1230', border: '1.5px solid #7c3aed',
    borderRadius: 8, color: '#c4b5fd', fontSize: 13,
    fontFamily: 'monospace', fontWeight: 700,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  } as CSSProperties,

  label: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    color: '#6b7280', textTransform: 'uppercase',
  } as CSSProperties,

  section: {
    display: 'flex', flexDirection: 'column', gap: 10,
  } as CSSProperties,

  divider: { border: 'none', borderTop: '1px solid #1e2030', margin: '2px 0' } as CSSProperties,
  addRow:  { display: 'flex', gap: 8 } as CSSProperties,

  btnPrimary: {
    padding: '8px 14px', borderRadius: 8,
    background: '#2563eb', color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600,
    whiteSpace: 'nowrap', transition: 'background 0.15s',
  } as CSSProperties,

  btnDanger: {
    padding: '3px 8px', borderRadius: 6,
    background: 'transparent', color: '#ef4444',
    border: '1px solid #3f1515', cursor: 'pointer',
    fontSize: 11, fontWeight: 600,
  } as CSSProperties,

  btnCancel: {
    padding: '8px 18px', borderRadius: 8,
    background: 'transparent', color: '#9ca3af',
    border: '1px solid #2a2d3a', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
  } as CSSProperties,

  btnSave: {
    padding: '8px 22px', borderRadius: 8,
    background: '#2563eb', color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
  } as CSSProperties,

  emptyNote: { color: '#4b5563', fontSize: 12, fontStyle: 'italic' } as CSSProperties,

  resolveResult: {
    background: '#0d1f12', border: '1px solid #1a4d35',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#34d399', fontFamily: 'monospace',
  } as CSSProperties,

  aliasTag: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#1a1f2e', border: '1px solid #2a2d3a',
    borderRadius: 20, padding: '4px 10px 4px 12px',
    fontSize: 12, color: '#94a3b8',
  } as CSSProperties,

  tblAliasTag: {
    background: '#1a1f2e', border: '1px solid #2a2d3a',
    borderRadius: 10, padding: '1px 7px',
    fontSize: 10, color: '#60a5fa', fontFamily: 'monospace',
  } as CSSProperties,

  tblBtnEdit: {
    padding: '3px 8px', borderRadius: 5,
    background: 'transparent', color: '#60a5fa',
    border: '1px solid #1a3a5c', cursor: 'pointer',
    fontSize: 10, fontWeight: 600,
  } as CSSProperties,

  tblBtnDel: {
    padding: '3px 8px', borderRadius: 5,
    background: 'transparent', color: '#f87171',
    border: '1px solid #3f1515', cursor: 'pointer',
    fontSize: 10, fontWeight: 600,
  } as CSSProperties,

  pageBtn: {
    padding: '4px 10px', borderRadius: 5,
    background: '#161820', border: '1px solid #2a2d3a',
    color: '#9ca3af', cursor: 'pointer', fontSize: 11,
  } as CSSProperties,
};

function tabStyle(active: boolean, isMobile: boolean): CSSProperties {
  return {
    padding: isMobile ? '8px 14px' : '10px 22px',
    fontSize: isMobile ? 11 : 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', background: 'none',
    color: active ? '#60a5fa' : '#6b7280',
    borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent',
    transition: 'color 0.15s', whiteSpace: 'nowrap' as const,
  };
}

function activeBadge(v: boolean): CSSProperties {
  return {
    display: 'inline-block', padding: '1px 8px', borderRadius: 20,
    fontSize: 10, fontWeight: 600,
    background: v ? '#0f2d1f' : '#2d1515',
    color: v ? '#34d399' : '#f87171',
    border: `1px solid ${v ? '#1a4d35' : '#5c1f1f'}`,
  };
}

function maxDigitsBadge(val: number | null): CSSProperties {
  const ok = val !== null && val > 0;
  return {
    display: 'inline-block', padding: '1px 8px', borderRadius: 20,
    fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
    background: ok ? '#1a2a3a' : '#1e1e1e',
    color: ok ? '#60a5fa' : '#4b5563',
    border: `1px solid ${ok ? '#1a3a5c' : '#2a2d3a'}`,
  };
}

function msgStyle(type: 'error' | 'success'): CSSProperties {
  return {
    fontSize: 12, padding: '8px 12px', borderRadius: 8,
    background: type === 'error' ? '#2d1515' : '#0f2d1f',
    color: type === 'error' ? '#f87171' : '#34d399',
    border: `1px solid ${type === 'error' ? '#5c1f1f' : '#1a4d35'}`,
  };
}

const LIMIT = 10;
const ADMIN_KEY = 'admin';

// ===================== COMPONENT =====================
export default function SymbolAliasModal({ open, onClose, initialSymbol = '', onSaved }: Props) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<'form' | 'table'>('form');

  // Form
  const [symbol, setSymbol]               = useState('');
  const [aliases, setAliases]             = useState<string[]>([]);
  const [description, setDescription]     = useState('');
  const [newAlias, setNewAlias]           = useState('');
  const [resolveInput, setResolveInput]   = useState('');
  const [resolveResult, setResolveResult] = useState<string | null>(null);
  const [msg, setMsg]                     = useState<Msg | null>(null);
  const [loading, setLoading]             = useState(false);

  // Broker digits
  const [brokerEntries, setBrokerEntries]     = useState<BrokerDigitEntry[]>([]);
  const [newBrokerName, setNewBrokerName]     = useState('');
  const [newBrokerDigits, setNewBrokerDigits] = useState<number>(3);

  // Admin override
  const [adminMaxDigits, setAdminMaxDigits] = useState<string>('');

  // Table
  const [tableData, setTableData]       = useState<SymbolAliasItem[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  // ===================== COMPUTED =====================
  const autoMaxDigits: number | null = brokerEntries.length > 0
    ? Math.max(...brokerEntries.map(e => e.digits))
    : null;

  const hasAdminBroker = brokerEntries.some(e => e.name.toLowerCase().trim() === ADMIN_KEY);

  const finalMaxDigits: number | null = (() => {
    if (hasAdminBroker) {
      const p = parseInt(adminMaxDigits, 10);
      if (!isNaN(p) && p >= 1 && p <= 8) return p;
    }
    return autoMaxDigits;
  })();

  // ===================== EFFECTS =====================
  useEffect(() => {
    if (!open) return;
    setTab('form');
    setSymbol(initialSymbol.toUpperCase());
    setAliases([]); setDescription(''); setNewAlias('');
    setResolveInput(''); setResolveResult(null); setMsg(null);
    setBrokerEntries([]); setNewBrokerName(''); setNewBrokerDigits(3);
    setAdminMaxDigits('');

    if (!initialSymbol) return;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/${initialSymbol.toUpperCase()}`);
        if (data.ok) {
          const d: SymbolAliasItem = data.data;
          setSymbol(d.symbol);
          setAliases(d.aliases || []);
          setDescription(d.description || '');
          const entries: BrokerDigitEntry[] = Object.entries(d.brokerDigits || {}).map(
            ([name, digits]) => ({ name, digits: Number(digits) })
          );
          setBrokerEntries(entries);
          const hasAdmin = entries.some(e => e.name.toLowerCase().trim() === ADMIN_KEY);
          if (hasAdmin && d.maxDigits) setAdminMaxDigits(String(d.maxDigits));
        }
      } catch {}
    })();
  }, [open, initialSymbol]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const fetchTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const { data } = await axios.get(`${API}/all`, { params: { search, page, limit: LIMIT } });
      if (data.ok) { setTableData(data.data); setTotal(data.total); }
    } catch {}
    finally { setTableLoading(false); }
  }, [search, page]);

  const reloadSymbolMap = useCallback(async () => {
    setTableLoading(true);
    try {
      await axios.get(`${API_BASE_URL}/symbol-map`, {
        headers: { 'Content-Type': 'application/json', Authorization: ACCESS_TOKEN },
        timeout: 10000,
      });
    } catch {}
    finally { setTableLoading(false); }
  }, []);

  useEffect(() => {
    if (!open || tab !== 'table') return;
    fetchTable();
  }, [open, tab, fetchTable]);

  if (!open) return null;

  // ===================== HANDLERS =====================
  const showMsg = (type: 'error' | 'success', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleAddAlias = () => {
    const val = newAlias.trim();
    if (!val) return;
    if (aliases.includes(val)) { showMsg('error', `"${val}" đã tồn tại`); return; }
    setAliases(p => [...p, val]);
    setNewAlias('');
  };

  const handleAddBrokerEntry = () => {
    const name = newBrokerName.trim();
    if (!name) { showMsg('error', 'Tên broker không được rỗng'); return; }
    if (newBrokerDigits < 1 || newBrokerDigits > 8) { showMsg('error', 'Digits phải 1–8'); return; }
    setBrokerEntries(prev => {
      const ex = prev.find(e => e.name === name);
      if (ex) return prev.map(e => e.name === name ? { ...e, digits: newBrokerDigits } : e);
      return [...prev, { name, digits: newBrokerDigits }];
    });
    setNewBrokerName(''); setNewBrokerDigits(3);
  };

  const handleRemoveBrokerEntry = (name: string) => {
    setBrokerEntries(p => p.filter(e => e.name !== name));
    if (name.toLowerCase().trim() === ADMIN_KEY) setAdminMaxDigits('');
  };

  const handleSave = async () => {
    if (!symbol.trim()) { showMsg('error', 'Symbol không được rỗng'); return; }
    setLoading(true);
    try {
      const brokerDigitsObj: Record<string, number> = {};
      brokerEntries.forEach(e => { brokerDigitsObj[e.name] = e.digits; });

      const { data } = await axios.post(`${API}/create`, {
        symbol: symbol.toUpperCase().trim(),
        aliases, description,
        maxDigits: finalMaxDigits ?? undefined,
        brokerDigits: brokerDigitsObj,
      });

      if (data.ok) {
        showMsg('success', `Lưu thành công! action: ${data.action ?? '—'}`);
        onSaved?.();
        if (tab === 'table') fetchTable();
      } else {
        showMsg('error', data.mess || 'Lỗi không xác định');
      }
    } catch (e) {
      const err = e as AxiosError<{ mess: string }>;
      showMsg('error', err?.response?.data?.mess || err.message);
    } finally { setLoading(false); }
  };

  const handleResolve = async () => {
    if (!resolveInput.trim()) return;
    try {
      const { data } = await axios.post(`${API}/resolve`, { symbol: resolveInput.trim() });
      setResolveResult(
        data.resolved ? `"${resolveInput}" → "${data.resolved}"` : `"${resolveInput}" → không tìm thấy`
      );
    } catch (e) {
      const err = e as AxiosError<{ mess: string }>;
      setResolveResult('Lỗi: ' + (err?.response?.data?.mess || err.message));
    }
  };

  const handleTableSearch = () => { setSearch(searchInput); setPage(1); };

  const handleTableEdit = (item: SymbolAliasItem) => {
    setSymbol(item.symbol);
    setAliases(item.aliases || []);
    setDescription(item.description || '');
    const entries: BrokerDigitEntry[] = Object.entries(item.brokerDigits || {}).map(
      ([name, digits]) => ({ name, digits: Number(digits) })
    );
    setBrokerEntries(entries);
    const hasAdmin = entries.some(e => e.name.toLowerCase().trim() === ADMIN_KEY);
    setAdminMaxDigits(hasAdmin && item.maxDigits ? String(item.maxDigits) : '');
    setTab('form');
  };

  const handleTableDelete = async (sym: string) => {
    if (!window.confirm(`Xóa symbol "${sym}"?`)) return;
    try { await axios.post(`${API}/delete`, { symbol: sym }); fetchTable(); } catch {}
  };

  const totalPages = Math.ceil(total / LIMIT);
  const colSpan    = isMobile ? 5 : 9;

  // ===================== RENDER =====================
  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
        .sym-input:focus    { border-color:#3b82f6 !important; }
        .admin-input:focus  { border-color:#a78bfa !important; }
        .sym-btn-save:hover { background:#1d4ed8 !important; }
        .sym-btn-add:hover  { background:#1d4ed8 !important; }
        .sym-close:hover    { color:#e2e8f0 !important; }
        .sym-tag-del:hover  { background:#3f1515 !important; }
        .broker-del:hover   { background:#3f1515 !important; }
        .tbl-row:hover td   { background:#0d1017; }
        .tbl-btn-edit:hover { background:#1a3a5c !important; }
        .tbl-btn-del:hover  { background:#3f1515 !important; }
        .tbl-search:focus   { border-color:#3b82f6 !important; }
      `}</style>

      {/* OVERLAY */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 8, animation: 'fadeIn 0.18s ease',
      }} onClick={onClose}>

        {/* MODAL */}
        <div style={{
          background: '#0f1117', border: '1px solid #2a2d3a',
          borderRadius: isMobile ? 10 : 14,
          width: '100%', maxWidth: isMobile ? '100%' : 960,
          maxHeight: isMobile ? '95vh' : '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden', animation: 'slideUp 0.2s ease',
        }} onClick={e => e.stopPropagation()}>

          {/* HEADER */}
          <div style={{
            padding: isMobile ? '10px 14px' : '14px 22px',
            borderBottom: '1px solid #1e2030',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙ Symbol Alias
              <span style={{ fontSize: 11, fontWeight: 600, background: '#1a3a5c', color: '#60a5fa', padding: '2px 8px', borderRadius: 20 }}>MongoDB</span>
            </div>
            <button className="sym-close" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 6 }} onClick={onClose}>×</button>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1e2030', flexShrink: 0, background: '#0d1017', overflowX: 'auto' }}>
            <button style={tabStyle(tab === 'form', isMobile)} onClick={() => setTab('form')}>+ Thêm / Sửa</button>
            <button style={tabStyle(tab === 'table', isMobile)} onClick={() => setTab('table')}>Danh sách ({total})</button>
          </div>

          {/* ======== FORM ======== */}
          {tab === 'form' && (
            <div style={{ padding: isMobile ? 14 : '18px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>

              {/* Symbol + Desc */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 14 }}>
                <div style={base.section}>
                  <div style={base.label}>Symbol gốc</div>
                  <input className="sym-input" style={base.input} placeholder="VD: GBPUSD" value={symbol}
                    onChange={e => setSymbol(e.target.value.toUpperCase())} />
                </div>
                <div style={base.section}>
                  <div style={base.label}>Mô tả (tuỳ chọn)</div>
                  <input className="sym-input" style={base.input} placeholder="VD: British Pound / US Dollar" value={description}
                    onChange={e => setDescription(e.target.value)} />
                </div>
              </div>

              <hr style={base.divider} />

              {/* Broker Digits */}
              <div style={base.section}>
                {/* Header badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={base.label}>Broker digits — stdDigits</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1a2a1a', border: '1px solid #1a4d35', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#34d399' }}>
                      auto = <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#34d399' }}>{autoMaxDigits ?? '—'}</span>
                    </div>
                    {hasAdminBroker && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1a1230', border: '1px solid #7c3aed', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#c4b5fd' }}>
                        final = <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#a78bfa' }}>{finalMaxDigits ?? '—'}</span>
                        <span style={{ fontSize: 9, color: '#7c3aed' }}>override</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add broker row */}
                <div style={base.addRow}>
                  <input className="sym-input"
                    style={{ ...base.inputSm, flex: 1 }}
                    placeholder='Broker name — gõ "admin" để bật override'
                    value={newBrokerName}
                    onChange={e => setNewBrokerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddBrokerEntry()} />
                  <input type="number" min={1} max={8} step={1}
                    style={{ ...base.inputSm, width: 60, textAlign: 'center' }}
                    value={newBrokerDigits}
                    onChange={e => setNewBrokerDigits(parseInt(e.target.value, 10) || 2)} />
                  <button className="sym-btn-add" style={base.btnPrimary} onClick={handleAddBrokerEntry}>+ Thêm</button>
                </div>

                {/* Broker list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {brokerEntries.length === 0
                    ? <span style={base.emptyNote}>Chưa có broker nào</span>
                    : brokerEntries.map(e => {
                      const isAdmin = e.name.toLowerCase().trim() === ADMIN_KEY;
                      return (
                        <div key={e.name} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 30px', gap: 7, alignItems: 'center' }}>
                          <div style={{
                            background: isAdmin ? '#1a1230' : '#161820',
                            border: `1px solid ${isAdmin ? '#7c3aed' : '#2a2d3a'}`,
                            borderRadius: 7, padding: '5px 10px',
                            fontSize: 12, color: isAdmin ? '#c4b5fd' : '#e2e8f0',
                            fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 5,
                          }}>
                            {isAdmin && <span style={{ fontSize: 9, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>admin</span>}
                            {e.name}
                          </div>
                          <div style={{
                            background: isAdmin ? '#1a1230' : '#1a2a3a',
                            border: `1px solid ${isAdmin ? '#7c3aed' : '#1a3a5c'}`,
                            borderRadius: 7, padding: '5px 8px',
                            fontSize: 13, fontWeight: 700,
                            color: isAdmin ? '#c4b5fd' : '#60a5fa',
                            fontFamily: 'monospace', textAlign: 'center',
                          }}>
                            {e.digits}d
                          </div>
                          <button className="broker-del" style={base.btnDanger} onClick={() => handleRemoveBrokerEntry(e.name)}>×</button>
                        </div>
                      );
                    })
                  }
                </div>

                {/* ✅ Admin override panel */}
                {hasAdminBroker && (
                  <div style={{
                    background: '#13102a', border: '1.5px solid #7c3aed',
                    borderRadius: 10, padding: '12px 14px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      🔐 Admin — Override maxDigits thủ công
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
                      Ghi đè maxDigits tự động. Chỉ có hiệu lực khi broker{' '}
                      <code style={{ color: '#c4b5fd', background: '#1a1230', padding: '1px 5px', borderRadius: 4 }}>admin</code>{' '}
                      tồn tại trong danh sách.
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        className="admin-input"
                        type="number" min={1} max={8} step={1}
                        style={{ ...base.inputAdmin, width: 80, textAlign: 'center' }}
                        placeholder="1–8"
                        value={adminMaxDigits}
                        onChange={e => setAdminMaxDigits(e.target.value)}
                      />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        auto = <b style={{ color: '#34d399' }}>{autoMaxDigits ?? '—'}</b>
                        &nbsp;→ override = <b style={{ color: '#a78bfa' }}>{adminMaxDigits || '—'}</b>
                        &nbsp;→ final = <b style={{ color: '#fff' }}>{finalMaxDigits ?? '—'}</b>
                      </span>
                      {adminMaxDigits && (
                        <button style={{ ...base.btnDanger, fontSize: 10 }} onClick={() => setAdminMaxDigits('')}>Reset</button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <hr style={base.divider} />

              {/* Aliases */}
              <div style={base.section}>
                <div style={base.label}>Aliases / Hậu tố</div>
                <div style={base.addRow}>
                  <input className="sym-input" style={{ ...base.input, flex: 1 }}
                    placeholder="VD: GBPUSD# hoặc GBPUSDpro"
                    value={newAlias}
                    onChange={e => setNewAlias(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddAlias()} />
                  <button className="sym-btn-add" style={base.btnPrimary} onClick={handleAddAlias}>+ Thêm</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {aliases.length === 0
                    ? <span style={base.emptyNote}>Chưa có alias nào</span>
                    : aliases.map(ali => (
                      <div key={ali} style={base.aliasTag}>
                        <span style={{ fontWeight: 600, color: '#60a5fa', fontFamily: 'monospace' }}>{ali}</span>
                        <button className="sym-tag-del" style={base.btnDanger} onClick={() => setAliases(p => p.filter(a => a !== ali))}>×</button>
                      </div>
                    ))}
                </div>
              </div>

              <hr style={base.divider} />

              {/* Resolve */}
              <div style={base.section}>
                <div style={base.label}>Test Resolve Alias</div>
                <div style={base.addRow}>
                  <input className="sym-input" style={{ ...base.input, flex: 1 }}
                    placeholder="Nhập alias, VD: GBPUSD#"
                    value={resolveInput}
                    onChange={e => setResolveInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResolve()} />
                  <button className="sym-btn-add" style={base.btnPrimary} onClick={handleResolve}>Resolve</button>
                </div>
                {resolveResult && <div style={base.resolveResult}>{resolveResult}</div>}
              </div>

              {msg && <div style={msgStyle(msg.type)}>{msg.text}</div>}
            </div>
          )}

          {/* ======== TABLE ======== */}
          {tab === 'table' && (
            <div style={{ padding: isMobile ? 12 : '16px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Search row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="tbl-search"
                  style={{ flex: 1, minWidth: 120, padding: '8px 12px', background: '#161820', border: '1px solid #2a2d3a', borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                  placeholder="Tìm symbol hoặc alias..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTableSearch()} />
                <button style={{ padding: '8px 12px', borderRadius: 8, background: '#161820', color: '#9ca3af', border: '1px solid #2a2d3a', cursor: 'pointer', fontSize: 12 }} onClick={handleTableSearch}>🔍 Tìm</button>
                <button style={{ padding: '8px 12px', borderRadius: 8, background: '#161820', color: tableLoading ? '#4b5563' : '#34d399', border: '1px solid #1a4d35', cursor: 'pointer', fontSize: 12 }}
                  onClick={reloadSymbolMap} disabled={tableLoading}>{tableLoading ? '...' : '↻ Reload'}</button>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #1e2030', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: isMobile ? 360 : 700 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>#</th>
                      <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>Symbol</th>
                      <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>maxDigits</th>
                      {!isMobile && <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>Broker digits</th>}
                      <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>Aliases</th>
                      {!isMobile && <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>Mô tả</th>}
                      <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>Trạng thái</th>
                      {!isMobile && <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>Cập nhật</th>}
                      <th style={{ padding: '8px 10px', background: '#0d1017', color: '#6b7280', fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: '1px solid #1e2030', whiteSpace: 'nowrap' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: '30px 0', color: '#4b5563', fontSize: 12 }}>Đang tải...</td></tr>
                    ) : tableData.length === 0 ? (
                      <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: '30px 0', color: '#374151', fontSize: 12 }}>Không có dữ liệu</td></tr>
                    ) : tableData.map((item, idx) => {
                      const td: CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #13151f', verticalAlign: 'middle', color: '#c8ccd8' };
                      return (
                        <tr key={item._id} className="tbl-row">
                          <td style={{ ...td, color: '#4b5563', width: 28 }}>{(page - 1) * LIMIT + idx + 1}</td>
                          <td style={{ ...td, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{item.symbol}</td>
                          <td style={{ ...td, textAlign: 'center' }}>
                            <span style={maxDigitsBadge(item.maxDigits)}>{item.maxDigits ?? '—'}</span>
                          </td>
                          {!isMobile && (
                            <td style={td}>
                              {!item.brokerDigits || Object.keys(item.brokerDigits).length === 0
                                ? <span style={{ color: '#374151', fontStyle: 'italic' }}>—</span>
                                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {Object.entries(item.brokerDigits).map(([name, dig]) => {
                                      const ia = name.toLowerCase() === ADMIN_KEY;
                                      return (
                                        <span key={name} style={{
                                          background: ia ? '#1a1230' : '#1a1f2e',
                                          border: `1px solid ${ia ? '#7c3aed' : '#2a2d3a'}`,
                                          borderRadius: 10, padding: '1px 7px',
                                          fontSize: 10, color: ia ? '#c4b5fd' : '#94a3b8',
                                          fontFamily: 'monospace', whiteSpace: 'nowrap',
                                        }}>
                                          {name}:<b>{dig}d</b>
                                        </span>
                                      );
                                    })}
                                  </div>
                              }
                            </td>
                          )}
                          <td style={td}>
                            {item.aliases.length === 0
                              ? <span style={{ color: '#374151', fontStyle: 'italic' }}>—</span>
                              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {item.aliases.slice(0, isMobile ? 2 : 999).map(ali => (
                                    <span key={ali} style={base.tblAliasTag}>{ali}</span>
                                  ))}
                                  {isMobile && item.aliases.length > 2 && (
                                    <span style={{ ...base.tblAliasTag, color: '#6b7280' }}>+{item.aliases.length - 2}</span>
                                  )}
                                </div>
                            }
                          </td>
                          {!isMobile && <td style={{ ...td, color: '#6b7280', maxWidth: 120 }}>{item.description || '—'}</td>}
                          <td style={td}><span style={activeBadge(item.active)}>{item.active ? 'Active' : 'Off'}</span></td>
                          {!isMobile && <td style={{ ...td, color: '#4b5563', whiteSpace: 'nowrap' }}>{new Date(item.updatedAt).toLocaleString('vi-VN')}</td>}
                          <td style={td}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="tbl-btn-edit" style={base.tblBtnEdit} onClick={() => handleTableEdit(item)}>Sửa</button>
                              <button className="tbl-btn-del" style={base.tblBtnDel} onClick={() => handleTableDelete(item.symbol)}>Xóa</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, color: '#6b7280', fontSize: 11 }}>
                  <span>Tổng {total} records | Trang {page}/{totalPages}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={base.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Trước</button>
                    <button style={base.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Tiếp →</button>
                  </div>
                </div>
              )}

              {msg && <div style={msgStyle(msg.type)}>{msg.text}</div>}
            </div>
          )}

          {/* FOOTER */}
          <div style={{ padding: isMobile ? '10px 14px' : '12px 22px', borderTop: '1px solid #1e2030', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button style={base.btnCancel} onClick={onClose}>Hủy</button>
            {tab === 'form' && (
              <button className="sym-btn-save"
                style={{ ...base.btnSave, opacity: loading ? 0.6 : 1 }}
                onClick={handleSave} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}