import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { CSSProperties } from 'react';

const API = 'http://116.105.227.149:5000/api/symbol-aliases';
const API_URL = "http://116.105.227.149:5000";
  const API_BASE_URL = `${API_URL}/v1/api`;
  const ACCESS_TOKEN = localStorage.getItem("accessToken") || "";

// ===================== TYPES =====================
interface Msg {
  type: 'error' | 'success';
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialSymbol?: string;
  onSaved?: () => void;
}

interface SymbolAliasItem {
  _id: string;
  symbol: string;
  aliases: string[];
  description: string;
  active: boolean;
  updatedAt: string;
}

// ===================== STYLES =====================
const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn 0.18s ease',
  },
  modal: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: 14,
    width: '96%', maxWidth: 900,
    maxHeight: '92vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    animation: 'slideUp 0.2s ease',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #1e2030',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 15, fontWeight: 600, color: '#e2e8f0',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  headerBadge: {
    fontSize: 11, fontWeight: 600,
    background: '#1a3a5c', color: '#60a5fa',
    padding: '2px 8px', borderRadius: 20,
  },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#6b7280', cursor: 'pointer',
    fontSize: 20, lineHeight: 1, padding: 4,
    borderRadius: 6, transition: 'color 0.15s',
  },
  // Tab bar
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #1e2030',
    flexShrink: 0,
    background: '#0d1017',
  },

  body: {
    padding: '20px 24px',
    overflowY: 'auto', flex: 1,
    display: 'flex', flexDirection: 'column', gap: 18,
  },
  section: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  label: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    color: '#6b7280', textTransform: 'uppercase',
  },
  input: {
    width: '100%', padding: '9px 12px',
    background: '#161820', border: '1px solid #2a2d3a',
    borderRadius: 8, color: '#e2e8f0', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  addAliasRow: { display: 'flex', gap: 8 },
  btnPrimary: {
    padding: '8px 16px', borderRadius: 8,
    background: '#2563eb', color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600,
    whiteSpace: 'nowrap', transition: 'background 0.15s',
  },
  btnDanger: {
    padding: '3px 8px', borderRadius: 6,
    background: 'transparent', color: '#ef4444',
    border: '1px solid #3f1515', cursor: 'pointer',
    fontSize: 11, fontWeight: 600,
  },
  aliasList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  aliasTag: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#1a1f2e', border: '1px solid #2a2d3a',
    borderRadius: 20, padding: '4px 10px 4px 12px',
    fontSize: 12, color: '#94a3b8',
  },
  aliasTagSymbol: {
    fontWeight: 600, color: '#60a5fa', fontFamily: 'monospace',
  },
  emptyAlias: { color: '#4b5563', fontSize: 12, fontStyle: 'italic' },
  footer: {
    padding: '14px 24px',
    borderTop: '1px solid #1e2030',
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    flexShrink: 0,
  },
  btnCancel: {
    padding: '8px 18px', borderRadius: 8,
    background: 'transparent', color: '#9ca3af',
    border: '1px solid #2a2d3a', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
  },
  btnSave: {
    padding: '8px 22px', borderRadius: 8,
    background: '#2563eb', color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
  },
  divider: { border: 'none', borderTop: '1px solid #1e2030', margin: '4px 0' },
  resolveResult: {
    background: '#0d1f12', border: '1px solid #1a4d35',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#34d399', fontFamily: 'monospace',
  },
  // Table
  searchRow: { display: 'flex', gap: 10, marginBottom: 4 },
  searchInput: {
    flex: 1, padding: '8px 12px',
    background: '#161820', border: '1px solid #2a2d3a',
    borderRadius: 8, color: '#e2e8f0', fontSize: 12,
    outline: 'none', fontFamily: 'inherit',
  },
  btnSearch: {
    padding: '8px 14px', borderRadius: 8,
    background: '#161820', color: '#9ca3af',
    border: '1px solid #2a2d3a', cursor: 'pointer',
    fontSize: 12, whiteSpace: 'nowrap',
  },
  tableWrap: {
    border: '1px solid #1e2030', borderRadius: 8, overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    padding: '9px 14px',
    background: '#0d1017', color: '#6b7280',
    fontWeight: 600, fontSize: 10, letterSpacing: '0.06em',
    textAlign: 'left', borderBottom: '1px solid #1e2030',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #13151f',
    verticalAlign: 'middle', color: '#c8ccd8',
  },
  tblAliasWrap: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  tblAliasTag: {
    background: '#1a1f2e', border: '1px solid #2a2d3a',
    borderRadius: 10, padding: '1px 7px',
    fontSize: 10, color: '#60a5fa', fontFamily: 'monospace',
  },
  tblActionRow: { display: 'flex', gap: 5 },
  tblBtnEdit: {
    padding: '3px 10px', borderRadius: 5,
    background: 'transparent', color: '#60a5fa',
    border: '1px solid #1a3a5c', cursor: 'pointer',
    fontSize: 10, fontWeight: 600,
  },
  tblBtnDel: {
    padding: '3px 10px', borderRadius: 5,
    background: 'transparent', color: '#f87171',
    border: '1px solid #3f1515', cursor: 'pointer',
    fontSize: 10, fontWeight: 600,
  },
  emptyTbl: { textAlign: 'center', padding: '30px 0', color: '#374151', fontSize: 12 },
  loadingTbl: { textAlign: 'center', padding: '30px 0', color: '#4b5563', fontSize: 12 },
  pagination: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10, color: '#6b7280', fontSize: 11,
  },
  pageBtn: {
    padding: '4px 10px', borderRadius: 5,
    background: '#161820', border: '1px solid #2a2d3a',
    color: '#9ca3af', cursor: 'pointer', fontSize: 11,
  },
};

function tabStyle(active: boolean): CSSProperties {
  return {
    padding: '10px 22px',
    fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none',
    background: 'none',
    color: active ? '#60a5fa' : '#6b7280',
    borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent',
    transition: 'color 0.15s',
  };
}

function activeBadgeStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-block', padding: '1px 8px', borderRadius: 20,
    fontSize: 10, fontWeight: 600,
    background: active ? '#0f2d1f' : '#2d1515',
    color: active ? '#34d399' : '#f87171',
    border: `1px solid ${active ? '#1a4d35' : '#5c1f1f'}`,
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

// ===================== COMPONENT =====================
export default function SymbolAliasModal({ open, onClose, initialSymbol = '', onSaved }: Props) {
  // --- Tab ---
  const [tab, setTab] = useState<'form' | 'table'>('form');

  // --- Form state ---
  const [symbol, setSymbol]              = useState<string>('');
  const [aliases, setAliases]            = useState<string[]>([]);
  const [description, setDescription]   = useState<string>('');
  const [newAlias, setNewAlias]          = useState<string>('');
  const [resolveInput, setResolveInput]  = useState<string>('');
  const [resolveResult, setResolveResult] = useState<string | null>(null);
  const [msg, setMsg]                    = useState<Msg | null>(null);
  const [loading, setLoading]            = useState<boolean>(false);

  // --- Table state ---
  const [tableData, setTableData]        = useState<SymbolAliasItem[]>([]);
  const [total, setTotal]                = useState(0);
  const [page, setPage]                  = useState(1);
  const [searchInput, setSearchInput]    = useState('');
  const [search, setSearch]              = useState('');
  const [tableLoading, setTableLoading]  = useState(false);

  // ===================== EFFECTS =====================
  useEffect(() => {
    if (!open) return;
    setTab('form');
    setSymbol(initialSymbol.toUpperCase());
    setAliases([]);
    setDescription('');
    setNewAlias('');
    setResolveInput('');
    setResolveResult(null);
    setMsg(null);

    if (!initialSymbol) return;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/${initialSymbol.toUpperCase()}`);
        if (data.ok) {
          setSymbol(data.data.symbol);
          setAliases(data.data.aliases || []);
          setDescription(data.data.description || '');
        }
      } catch {}
    })();
  }, [open, initialSymbol]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const fetchTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const { data } = await axios.get(`${API}/all`, {
        params: { search, page, limit: LIMIT },
      });
      if (data.ok) { setTableData(data.data); setTotal(data.total); }
    } catch {}
    finally { setTableLoading(false); }
  }, [search, page]);

   const Reload_Symbol_Map = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/symbol-map`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_TOKEN,
        },
        timeout: 10000,
      });
    } catch {}
    finally { setTableLoading(false); }
  }, [search, page]);

  // Load table khi chuyển sang tab table
  useEffect(() => {
    if (!open || tab !== 'table') return;
    fetchTable();
  }, [open, tab, fetchTable]);

  if (!open) return null;

  // ===================== HANDLERS =====================
  const showMsg = (type: 'error' | 'success', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleAddAlias = () => {
    const val = newAlias.trim();
    if (!val) return;
    if (aliases.includes(val)) { showMsg('error', `"${val}" đã tồn tại`); return; }
    setAliases(prev => [...prev, val]);
    setNewAlias('');
  };

  const handleRemoveAlias = (ali: string) => {
    setAliases(prev => prev.filter(a => a !== ali));
  };

  const handleSave = async () => {
    if (!symbol.trim()) { showMsg('error', 'Symbol không được rỗng'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/create`, {
        symbol: symbol.toUpperCase().trim(), aliases, description,
      });
      if (data.ok) {
        showMsg('success', 'Lưu thành công!');
        onSaved?.();
        // Reload table nếu đang ở tab table
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
        data.resolved
          ? `"${resolveInput}" → "${data.resolved}"`
          : `"${resolveInput}" → không tìm thấy`
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
    setTab('form');
  };

  const handleTableDelete = async (sym: string) => {
    if (!window.confirm(`Xóa symbol "${sym}"?`)) return;
    try {
      await axios.post(`${API}/delete`, { symbol: sym });
      fetchTable();
    } catch {}
  };

  const totalPages = Math.ceil(total / LIMIT);

  // ===================== RENDER =====================
  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .sym-input:focus { border-color:#3b82f6 !important; }
        .sym-btn-save:hover { background:#1d4ed8 !important; }
        .sym-btn-cancel:hover { background:#1e2030 !important; }
        .sym-btn-add:hover { background:#1d4ed8 !important; }
        .sym-close:hover { color:#e2e8f0 !important; }
        .sym-tag-del:hover { background:#3f1515 !important; }
        .tbl-row:hover td { background:#0d1017; }
        .tbl-btn-edit:hover { background:#1a3a5c !important; }
        .tbl-btn-del:hover  { background:#3f1515 !important; }
        .tbl-search:focus   { border-color:#3b82f6 !important; }
      `}</style>

      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>

          {/* HEADER */}
          <div style={styles.header}>
            <div style={styles.headerTitle}>
              ⚙ Symbol Alias Mapping
              <span style={styles.headerBadge}>MongoDB</span>
            </div>
            <button className="sym-close" style={styles.closeBtn} onClick={onClose}>×</button>
          </div>

          {/* TAB BAR */}
          <div style={styles.tabBar}>
            <button style={tabStyle(tab === 'form')} onClick={() => setTab('form')}>
              + Thêm / Sửa
            </button>
            <button style={tabStyle(tab === 'table')} onClick={() => setTab('table')}>
              Danh sách ({total})
            </button>
          </div>

          {/* ========== TAB FORM ========== */}
          {tab === 'form' && (
            <div style={styles.body}>

              <div style={styles.section}>
                <div style={styles.label}>Symbol gốc</div>
                <input className="sym-input" style={styles.input}
                  placeholder="VD: GBPUSD" value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())} />
              </div>

              <div style={styles.section}>
                <div style={styles.label}>Mô tả (tuỳ chọn)</div>
                <input className="sym-input" style={styles.input}
                  placeholder="VD: British Pound / US Dollar" value={description}
                  onChange={e => setDescription(e.target.value)} />
              </div>

              <hr style={styles.divider} />

              <div style={styles.section}>
                <div style={styles.label}>Aliases / Hậu tố</div>
                <div style={styles.addAliasRow}>
                  <input className="sym-input"
                    style={{ ...styles.input, flex: 1 }}
                    placeholder="VD: GBPUSD# hoặc GBPUSDpro"
                    value={newAlias}
                    onChange={e => setNewAlias(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddAlias()} />
                  <button className="sym-btn-add" style={styles.btnPrimary} onClick={handleAddAlias}>
                    + Thêm
                  </button>
                </div>
                <div style={styles.aliasList}>
                  {aliases.length === 0
                    ? <span style={styles.emptyAlias}>Chưa có alias nào</span>
                    : aliases.map(ali => (
                      <div key={ali} style={styles.aliasTag}>
                        <span style={styles.aliasTagSymbol}>{ali}</span>
                        <button className="sym-tag-del" style={styles.btnDanger}
                          onClick={() => handleRemoveAlias(ali)}>×</button>
                      </div>
                    ))}
                </div>
              </div>

              <hr style={styles.divider} />

              <div style={styles.section}>
                <div style={styles.label}>Test Resolve Alias</div>
                <div style={styles.addAliasRow}>
                  <input className="sym-input"
                    style={{ ...styles.input, flex: 1 }}
                    placeholder="Nhập alias cần kiểm tra, VD: GBPUSD#"
                    value={resolveInput}
                    onChange={e => setResolveInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResolve()} />
                  <button className="sym-btn-add" style={styles.btnPrimary} onClick={handleResolve}>
                    Resolve
                  </button>
                </div>
                {resolveResult && <div style={styles.resolveResult}>{resolveResult}</div>}
              </div>

              {msg && <div style={msgStyle(msg.type)}>{msg.text}</div>}
            </div>
          )}

          {/* ========== TAB TABLE ========== */}
          {tab === 'table' && (
            <div style={styles.body}>

              {/* Search */}
              <div style={styles.searchRow}>
                <input className="tbl-search" style={styles.searchInput}
                  placeholder="Tìm symbol hoặc alias..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTableSearch()} />
                <button style={styles.btnSearch} onClick={handleTableSearch}>🔍 Tìm</button>
                <button style={{ ...styles.btnSearch, color: tableLoading ? '#4b5563' : '#34d399', borderColor: '#1a4d35' }} onClick={Reload_Symbol_Map} disabled={tableLoading}>{tableLoading ? '...' : '↻ Reload'}</button>
              </div>

              {/* Table */}
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Symbol</th>
                      <th style={styles.th}>Aliases</th>
                      <th style={styles.th}>Mô tả</th>
                      <th style={styles.th}>Trạng thái</th>
                      <th style={styles.th}>Cập nhật</th>
                      <th style={styles.th}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr><td colSpan={7} style={styles.loadingTbl}>Đang tải...</td></tr>
                    ) : tableData.length === 0 ? (
                      <tr><td colSpan={7} style={styles.emptyTbl}>Không có dữ liệu</td></tr>
                    ) : tableData.map((item, idx) => (
                      <tr key={item._id} className="tbl-row">
                        <td style={{ ...styles.td, color: '#4b5563', width: 32 }}>
                          {(page - 1) * LIMIT + idx + 1}
                        </td>
                        <td style={{ ...styles.td, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>
                          {item.symbol}
                        </td>
                        <td style={styles.td}>
                          {item.aliases.length === 0
                            ? <span style={{ color: '#374151', fontStyle: 'italic' }}>—</span>
                            : <div style={styles.tblAliasWrap}>
                                {item.aliases.map(ali => (
                                  <span key={ali} style={styles.tblAliasTag}>{ali}</span>
                                ))}
                              </div>
                          }
                        </td>
                        <td style={{ ...styles.td, color: '#6b7280', maxWidth: 150 }}>
                          {item.description || '—'}
                        </td>
                        <td style={styles.td}>
                          <span style={activeBadgeStyle(item.active)}>
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...styles.td, color: '#4b5563', whiteSpace: 'nowrap' }}>
                          {new Date(item.updatedAt).toLocaleString('vi-VN')}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.tblActionRow}>
                            <button className="tbl-btn-edit" style={styles.tblBtnEdit}
                              onClick={() => handleTableEdit(item)}>Sửa</button>
                            <button className="tbl-btn-del" style={styles.tblBtnDel}
                              onClick={() => handleTableDelete(item.symbol)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <span>Tổng {total} records | Trang {page}/{totalPages}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={styles.pageBtn}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}>← Trước</button>
                    <button style={styles.pageBtn}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}>Tiếp →</button>
                  </div>
                </div>
              )}

              {msg && <div style={msgStyle(msg.type)}>{msg.text}</div>}
            </div>
          )}

          {/* FOOTER */}
          <div style={styles.footer}>
            <button className="sym-btn-cancel" style={styles.btnCancel} onClick={onClose}>Hủy</button>
            {tab === 'form' && (
              <button className="sym-btn-save"
                style={{ ...styles.btnSave, opacity: loading ? 0.6 : 1 }}
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