import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  HiOutlineChevronDown, HiOutlineArrowDownTray, HiOutlineXMark,
  HiOutlineMagnifyingGlass, HiOutlineCheck, HiOutlinePlus,
  HiOutlineTrash, HiOutlineBookmark, HiOutlinePencilSquare,
  HiOutlineEye, HiOutlineEyeSlash,
} from 'react-icons/hi2'
import type { WatchlistItem, BotConfig } from '../App'
import {
  SECTORS, SECTOR_COMPANIES,
  ANNUAL_METRIC_GROUPS, QUARTERLY_METRICS,
  getAnnualData,
} from '../data/finData'

interface Props {
  watchlists: WatchlistItem[]
  activeWatchlistId: number
  onAdd: (w: Omit<WatchlistItem, 'id' | 'createdAt' | 'updatedAt'>) => WatchlistItem
  onUpdate: (id: number, patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => void
  onDelete: (id: number) => void
  onSetActive: (id: number) => void
  botConfigs: BotConfig[]
}

const DS = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  overlay: 'rgba(15,23,42,0.45)',
  border: 'rgba(15,23,42,0.08)',
  borderMed: 'rgba(15,23,42,0.12)',
  borderStrong: 'rgba(15,23,42,0.16)',
  text: '#0f172a',
  textSub: '#475569',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  accent: '#2563eb',
  accentDark: '#1d4ed8',
  accentTwo: '#4f46e5',
  accentSoft: 'rgba(37,99,235,0.08)',
  accentBorder: 'rgba(37,99,235,0.18)',
  accentHover: 'rgba(37,99,235,0.12)',
  green: '#16a34a', greenSoft: '#f0fdf4', greenBorder: '#bbf7d0',
  red: '#dc2626', redSoft: '#fef2f2', redBorder: '#fecaca',
  amber: '#d97706', amberSoft: 'rgba(217,119,6,0.08)',
  purple: '#7c3aed', purpleSoft: 'rgba(124,58,237,0.07)', purpleBorder: 'rgba(124,58,237,0.18)',
  shadow: 'none',
  radius: 10,
}

const DEFAULT_METRICS = ['Sales', 'OPM %', 'Net Profit', 'EPS in Rs', 'Operating Profit', 'Borrowings', 'Total Assets']

function fmtNum(val: number | string | undefined): string {
  if (val === undefined || val === null || val === '') return '—'
  const n = Number(val)
  if (isNaN(n)) return String(val)
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(2) + 'L'
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  return n.toFixed(2)
}

function getSector(company: string): string | undefined {
  return SECTORS.find(s => (SECTOR_COMPANIES[s] ?? []).includes(company))
}

/* Build metric columns for a given tab — mirrors the table logic */
function getTabCols(tab: string, customViews: Record<string, string[]>, finDataCols: Partial<Record<string, string[]>>, annualGroups: Record<string, string[]>): string[] {
  if (customViews[tab]) return customViews[tab]
  if (finDataCols[tab]) return finDataCols[tab]
  return annualGroups['Profit & Loss'] ?? []
}

function exportXLS(
  watchlistName: string,
  companies: string[],
  visibleTabs: string[],
  customViews: Record<string, string[]>,
  finDataCols: Partial<Record<string, string[]>>,
  annualGroups: Record<string, string[]>,
  priceRows: Record<string, Record<string, string>>,
) {
  const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const buildSheet = (tab: string) => {
    const cols = getTabCols(tab, customViews, finDataCols, annualGroups)
    const headers = ['Company', ...cols]
    const dataRows = companies.map(co => {
      const data = getAnnualData(co)
      const yd = (data['2025'] ?? data['2024'] ?? data['2023'] ?? {}) as Record<string, unknown>
      return [co, ...cols.map(m => {
        if (priceRows[co]?.[m]) return priceRows[co][m]
        const v = yd[m]
        return v !== undefined ? String(v) : ''
      })]
    })
    const rowsXml = [headers, ...dataRows].map(row =>
      `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${esc(cell)}</Data></Cell>`).join('')}</Row>`
    ).join('\n')
    return `<Worksheet ss:Name="${esc(tab)}"><Table>${rowsXml}</Table></Worksheet>`
  }

  const sheetsXml = visibleTabs.map(buildSheet).join('\n')
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheetsXml}
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${watchlistName.replace(/[^a-z0-9]/gi, '_')}.xls`; a.click()
  URL.revokeObjectURL(url)
}

/* Deterministic mock value — stable per company across renders */
function mockVal(company: string, seed: number, min: number, max: number, decimals = 2): number {
  let hash = seed
  for (let i = 0; i < company.length; i++) hash = (hash * 31 + company.charCodeAt(i)) & 0xfffffff
  return parseFloat((min + (hash % 10000) / 10000 * (max - min)).toFixed(decimals))
}

/* ── Tab definitions matching Screener's PREFERRED_TABS (minus Technicals) ── */

const KEY_METRICS_COLS = ['PE TTM', 'PB Ratio', 'EV/EBITDA', 'Dividend Yield (%)', 'Return on Equity (%)', 'Return on Capital Employed (%)']
const RATIOS_COLS      = ['Current Ratio', 'Quick Ratio', 'Debt to Equity', 'Interest Coverage', 'Asset Turnover']
const PRICE_COLS       = ['Current Price (Rs)', 'Market Cap (Rs Cr)', '52W High', '52W Low', '1Y Return (%)', '3Y Return (%)']

const ALL_VIEW_TABS = ['Annual Results', 'Quarterly Results', 'Balance Sheet', 'Cash Flow', 'Key Metrics', 'Ratios', 'Price'] as const
type ViewTab = typeof ALL_VIEW_TABS[number]

/* FINDATA_TAB_METRICS is computed inside the component so Annual Results can read active.metrics */
const STATIC_FINDATA_TAB_METRICS: Partial<Record<ViewTab, string[]>> = {
  'Quarterly Results': QUARTERLY_METRICS,
  'Balance Sheet':     ANNUAL_METRIC_GROUPS['Balance Sheet'],
  'Cash Flow':         ANNUAL_METRIC_GROUPS['Cash Flow'],
}

const MOCK_TAB_SEEDS: Partial<Record<string, [number, number, number]>> = {
  'PE TTM':                    [8,  5,  80],
  'PB Ratio':                  [9,  0.5, 12],
  'EV/EBITDA':                 [10, 3,  40],
  'Dividend Yield (%)':        [11, 0,  5],
  'Return on Equity (%)':      [12, 5,  35],
  'Return on Capital Employed (%)':[13, 6, 30],
  'Current Ratio':             [14, 0.5, 4],
  'Quick Ratio':               [15, 0.3, 3],
  'Debt to Equity':            [16, 0,  3],
  'Interest Coverage':         [17, 1,  20],
  'Asset Turnover':            [18, 0.2, 2],
  'Current Price (Rs)':        [1,  50, 3500],
  'Market Cap (Rs Cr)':        [3,  500, 250000],
  '52W High':                  [20, 100, 4000],
  '52W Low':                   [21, 30,  2000],
  '1Y Return (%)':             [5,  -30, 80],
  '3Y Return (%)':             [6,  -20, 150],
}

function renderMockCell(company: string, metric: string): React.ReactNode {
  const seed = MOCK_TAB_SEEDS[metric]
  if (!seed) return <span style={{ color: DS.textFaint }}>—</span>
  const val = mockVal(company, seed[0], seed[1], seed[2])
  /* Pct-style metrics */
  if (metric.includes('Return') || metric.includes('Yield')) {
    const color = val >= 0 ? DS.green : DS.red
    return <span style={{ color, fontVariantNumeric: 'tabular-nums' }}>{val >= 0 ? '↑' : '↓'} {Math.abs(val).toFixed(2)}%</span>
  }
  return <span style={{ fontVariantNumeric: 'tabular-nums', color: DS.text }}>{val.toLocaleString('en-IN')}</span>
}

const ALL_COMPANIES = Array.from(new Set(Object.values(SECTOR_COMPANIES).flat()))

export default function Compare({ watchlists, activeWatchlistId, onAdd, onUpdate, onDelete, onSetActive, botConfigs }: Props) {
  const active = watchlists.find(w => w.id === activeWatchlistId) ?? watchlists[0]

  const [activeTab, setActiveTab] = useState<string>('Annual Results')
  const [showWLDropdown, setShowWLDropdown] = useState(false)
  const [newWLName, setNewWLName] = useState('')
  const [showNewWLInput, setShowNewWLInput] = useState(false)
  const wlDropRef = useRef<HTMLDivElement>(null)

  /* Add Stocks modal */
  const [showAddStocks, setShowAddStocks] = useState(false)
  const [addSearch, setAddSearch] = useState('')

  /* Edit mode */
  const [editMode, setEditMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set())

  /* Personalise modal */
  const [showPersonalise, setShowPersonalise] = useState(false)
  const [viewOrder, setViewOrder] = useState<string[]>([...ALL_VIEW_TABS])
  const [hiddenViews, setHiddenViews] = useState<Set<string>>(new Set())
  const dragIdx = useRef<number | null>(null)
  const [customViews, setCustomViews] = useState<Record<string, string[]>>({})

  /* Create New View state */
  const [showNewView, setShowNewView] = useState(false)
  const [newViewGroups, setNewViewGroups] = useState<string[]>([])
  const [newViewMetrics, setNewViewMetrics] = useState<string[]>([])
  const [newViewName, setNewViewName] = useState('')

  const visibleTabs = viewOrder.filter(v => !hiddenViews.has(v))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wlDropRef.current && !wlDropRef.current.contains(e.target as Node)) setShowWLDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const createWatchlist = () => {
    if (!newWLName.trim()) return
    onAdd({ name: newWLName.trim(), companies: [...(active?.companies ?? [])], metrics: DEFAULT_METRICS })
    setNewWLName(''); setShowNewWLInput(false); setShowWLDropdown(false)
  }

  const addCompany = (co: string) => {
    if (!active || active.companies.includes(co)) return
    onUpdate(active.id, { companies: [...active.companies, co] })
  }

  const removeSelected = () => {
    if (!active) return
    onUpdate(active.id, { companies: active.companies.filter(c => !selectedForDelete.has(c)) })
    setSelectedForDelete(new Set())
    setEditMode(false)
  }

  const filteredAddCos = useMemo(() => {
    const q = addSearch.toLowerCase()
    return q ? ALL_COMPANIES.filter(c => c.toLowerCase().includes(q)) : ALL_COMPANIES
  }, [addSearch])

  if (!active) return null

  const linkedConfig = null

  /* Build column list for current tab */
  const FINDATA_TAB_METRICS: Partial<Record<string, string[]>> = {
    'Annual Results': active.metrics.length ? active.metrics : ['Sales', 'Net Profit', 'OPM %', 'EPS in Rs'],
    ...STATIC_FINDATA_TAB_METRICS,
  }
  const isCustomTab = customViews[activeTab] !== undefined
  const finMetrics = isCustomTab ? customViews[activeTab] : (FINDATA_TAB_METRICS[activeTab] as string[] | undefined)
  const mockCols = !isCustomTab && (activeTab === 'Key Metrics' ? KEY_METRICS_COLS
    : activeTab === 'Ratios' ? RATIOS_COLS
    : activeTab === 'Price' ? PRICE_COLS
    : null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: DS.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Top bar */}
      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, flexShrink: 0, padding: '0 20px', display: 'flex', alignItems: 'center', height: 48, gap: 10 }}>
        {/* Watchlist title + dropdown */}
        <div ref={wlDropRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HiOutlineBookmark size={13} color="#fff" />
          </div>
          <button onClick={() => setShowWLDropdown(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: DS.text }}>{active.name}</span>
            <HiOutlineChevronDown size={12} color={DS.textSub} />
          </button>
          <span style={{ fontSize: 10, color: DS.textFaint }}>{active.companies.length} stocks</span>
          {/* Linked BotConfig badge */}
          {linkedConfig && (
            <span style={{ fontSize: 10, color: DS.purple, background: DS.purpleSoft, padding: '2px 8px', borderRadius: 6, border: `1px solid ${DS.purpleBorder}`, fontWeight: 600 }}>
              ⚡ {linkedConfig.name}
            </span>
          )}

          {showWLDropdown && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 220, background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>
              {watchlists.map(w => (
                <button key={w.id} onClick={() => { onSetActive(w.id); setShowWLDropdown(false) }}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: DS.text, borderBottom: `1px solid ${DS.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = DS.accentSoft}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ flex: 1 }}>{w.name}</span>
                  {w.id === activeWatchlistId && <HiOutlineCheck size={13} color={DS.accent} />}
                </button>
              ))}
              {watchlists.length > 1 && active.id !== watchlists[0].id && (
                <button onClick={() => { onDelete(active.id); setShowWLDropdown(false) }}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: DS.red, borderBottom: `1px solid ${DS.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = DS.redSoft}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <HiOutlineTrash size={12} /> Delete "{active.name}"
                </button>
              )}
              {showNewWLInput ? (
                <div style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                  <input autoFocus value={newWLName} onChange={e => setNewWLName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createWatchlist(); if (e.key === 'Escape') setShowNewWLInput(false) }}
                    placeholder="Watchlist name…"
                    style={{ flex: 1, padding: '6px 10px', border: `1px solid ${DS.accentBorder}`, borderRadius: 8, fontSize: 12, outline: 'none', boxShadow: '0 0 0 3px rgba(37,99,235,0.08)' }} />
                  <button onClick={createWatchlist} style={{ padding: '6px 10px', background: DS.accent, border: '1px solid rgba(37,99,235,0.12)', borderRadius: DS.radius, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Create</button>
                </div>
              ) : (
                <button onClick={() => setShowNewWLInput(true)}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: DS.accent, fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = DS.accentSoft}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <HiOutlinePlus size={13} /> Create New Watchlist
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action bar — right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          {editMode ? (
            <>
              <span style={{ fontSize: 11, color: DS.textSub }}>{selectedForDelete.size} selected</span>
              <button onClick={removeSelected} disabled={selectedForDelete.size === 0}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${DS.redBorder}`, background: selectedForDelete.size > 0 ? DS.redSoft : DS.surfaceHover, color: selectedForDelete.size > 0 ? DS.red : DS.textFaint, fontSize: 12, fontWeight: 600, cursor: selectedForDelete.size > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineTrash size={13} /> Remove Selected
              </button>
              <button onClick={() => { setEditMode(false); setSelectedForDelete(new Set()) }}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${DS.borderMed}`, background: DS.surface, color: DS.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Done
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowAddStocks(true)}
                style={{ padding: '6px 12px', borderRadius: DS.radius, border: `1px solid ${DS.accent}`, background: DS.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <HiOutlinePlus size={13} /> Add Stocks
              </button>
              <div style={{ width: 1, height: 20, background: DS.border }} />
              <button onClick={() => setEditMode(true)}
                style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${DS.borderMed}`, background: DS.surface, color: DS.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <HiOutlinePencilSquare size={13} /> Edit
              </button>
              <button onClick={() => setShowPersonalise(true)}
                style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${DS.borderMed}`, background: DS.surface, color: DS.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Personalise
              </button>
              <button onClick={() => exportXLS(active.name, active.companies, visibleTabs, customViews, FINDATA_TAB_METRICS, ANNUAL_METRIC_GROUPS, {})}
                style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${DS.borderMed}`, background: DS.surface, color: DS.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <HiOutlineArrowDownTray size={13} /> Export All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, flexShrink: 0, display: 'flex', padding: '0 20px', overflowX: 'auto' }}>
        {visibleTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === tab ? `2px solid ${DS.accent}` : '2px solid transparent', color: activeTab === tab ? DS.accent : DS.textSub, fontSize: 12.5, fontWeight: activeTab === tab ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.12s' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', background: DS.surface }}>
        {active.companies.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 16, height: '100%' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: DS.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiOutlineBookmark size={22} color={DS.accent} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: DS.text }}>No stocks yet</div>
            <div style={{ fontSize: 12, color: DS.textFaint }}>Click + Add Stocks to get started</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: DS.surfaceHover, position: 'sticky', top: 0, zIndex: 10 }}>
                {editMode && <th style={{ width: 32, padding: '8px 0 8px 12px' }} />}
                <th style={{ padding: '8px 12px', textAlign: 'left', color: DS.textMuted, fontWeight: 600, fontSize: 10.5, whiteSpace: 'nowrap', position: 'sticky', left: editMode ? 32 : 0, background: DS.surfaceHover, minWidth: 160, borderRight: `1px solid ${DS.border}` }}>
                  Company Name ↑↓
                </th>
                {finMetrics && finMetrics.map(m => (
                  <th key={m} style={{ padding: '8px 10px', textAlign: 'right', color: DS.textMuted, fontWeight: 600, fontSize: 10.5, whiteSpace: 'nowrap', background: DS.surfaceHover }}>
                    {m} ↑↓
                  </th>
                ))}
                {mockCols && mockCols.map(m => (
                  <th key={m} style={{ padding: '8px 10px', textAlign: 'right', color: DS.textMuted, fontWeight: 600, fontSize: 10.5, whiteSpace: 'nowrap', background: DS.surfaceHover }}>
                    {m} ↑↓
                  </th>
                ))}
                <th style={{ padding: '8px 10px', color: DS.textMuted, fontWeight: 600, fontSize: 10.5, whiteSpace: 'nowrap', background: DS.surfaceHover }}>Sector</th>
              </tr>
            </thead>
            <tbody>
              {active.companies.map((co) => {
                const data = getAnnualData(co)
                const yd = (data['2025'] ?? data['2024'] ?? data['2023'] ?? {}) as Record<string, unknown>
                const isSelected = selectedForDelete.has(co)
                return (
                  <tr key={co}
                    style={{ borderBottom: `1px solid ${DS.border}`, background: isSelected ? DS.redSoft : DS.surface, transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = DS.surfaceHover }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? DS.redSoft : DS.surface }}>
                    {editMode && (
                      <td style={{ padding: '8px 0 8px 12px', width: 32 }}>
                        <input type="checkbox" checked={isSelected}
                          onChange={() => {
                            setSelectedForDelete(prev => {
                              const next = new Set(prev)
                              if (isSelected) next.delete(co); else next.add(co)
                              return next
                            })
                          }}
                          style={{ accentColor: DS.accent, width: 14, height: 14, cursor: 'pointer' }} />
                      </td>
                    )}
                    <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 12.5, color: DS.text, whiteSpace: 'nowrap', position: 'sticky', left: editMode ? 32 : 0, background: isSelected ? DS.redSoft : DS.surface, borderRight: `1px solid ${DS.border}` }}>
                      {co}
                    </td>
                    {finMetrics && finMetrics.map(m => {
                      const rawVal = yd[m] as string | number | undefined
                      const numVal = rawVal !== undefined && rawVal !== null && rawVal !== '' ? Number(rawVal) : NaN
                      const isPositive = !isNaN(numVal) && numVal > 0
                      const isNegative = !isNaN(numVal) && numVal < 0
                      return (
                        <td key={m} style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: isPositive ? DS.green : isNegative ? DS.red : yd[m] !== undefined ? DS.text : DS.textFaint }}>
                          {fmtNum(rawVal)}
                        </td>
                      )
                    })}
                    {mockCols && mockCols.map(m => (
                      <td key={m} style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {renderMockCell(co, m)}
                      </td>
                    ))}
                    <td style={{ padding: '8px 10px', fontSize: 10.5, color: DS.textFaint, whiteSpace: 'nowrap' }}>
                      {getSector(co) ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Stocks Modal ── */}
      {showAddStocks && (
        <div onClick={() => setShowAddStocks(false)}
          style={{ position: 'fixed', inset: 0, background: DS.overlay, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: DS.surface, borderRadius: 12, width: 500, maxHeight: '68vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 20px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: DS.text }}>Add Stocks</div>
                <div style={{ fontSize: 11, color: DS.textFaint, marginTop: 2 }}>Search and add companies to your watchlist</div>
              </div>
              <button onClick={() => setShowAddStocks(false)}
                style={{ width: 28, height: 28, borderRadius: 8, background: DS.surfaceHover, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textSub }}>
                <HiOutlineXMark size={14} />
              </button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${DS.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: `1px solid ${DS.accentBorder}`, borderRadius: 8, background: DS.surfaceHover, boxShadow: '0 0 0 3px rgba(37,99,235,0.08)' }}>
                <HiOutlineMagnifyingGlass size={15} color={DS.textFaint} />
                <input autoFocus value={addSearch} onChange={e => setAddSearch(e.target.value)}
                  placeholder="Search & Add Stocks…"
                  style={{ flex: 1, border: 'none', background: 'none', fontSize: 13, outline: 'none', color: DS.text, fontFamily: 'Inter, sans-serif' }} />
                {addSearch && <button onClick={() => setAddSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.textFaint, display: 'flex', padding: 0 }}><HiOutlineXMark size={13} /></button>}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em' }}>COMPANIES</div>
              {filteredAddCos.slice(0, 60).map(co => {
                const inWL = active.companies.includes(co)
                return (
                  <div key={co}
                    style={{ display: 'flex', alignItems: 'center', padding: '11px 20px', borderBottom: `1px solid ${DS.border}`, background: inWL ? DS.accentSoft : DS.surface, transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!inWL) (e.currentTarget as HTMLElement).style.background = DS.surfaceHover }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = inWL ? DS.accentSoft : DS.surface }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: DS.text }}>{co}</div>
                      <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 2 }}>{getSector(co) ?? ''}</div>
                    </div>
                    <button onClick={() => addCompany(co)} disabled={inWL}
                      style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: inWL ? DS.greenSoft : DS.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inWL ? 'default' : 'pointer', transition: 'all 0.12s', flexShrink: 0 }}>
                      {inWL ? <HiOutlineCheck size={14} color={DS.green} /> : <HiOutlinePlus size={14} color={DS.accent} />}
                    </button>
                  </div>
                )
              })}
              {filteredAddCos.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: DS.textFaint, fontSize: 12 }}>No companies found for "{addSearch}"</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Personalise Modal ── */}
      {showPersonalise && (
        <div onClick={() => setShowPersonalise(false)}
          style={{ position: 'fixed', inset: 0, background: DS.overlay, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: DS.surface, borderRadius: 14, width: 420, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: DS.text, flex: 1 }}>Personalise Your View</div>
              <button onClick={() => setShowPersonalise(false)}
                style={{ width: 28, height: 28, borderRadius: 8, background: DS.surfaceHover, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textSub }}>
                <HiOutlineXMark size={14} />
              </button>
            </div>
            <div style={{ padding: '12px 20px 0', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em' }}>VIEWS</span>
                <button onClick={() => { setShowNewView(v => !v); setNewViewGroups([]); setNewViewMetrics([]); setNewViewName('') }}
                  style={{ padding: '5px 12px', borderRadius: 20, background: '#0f172a', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  + Create New View
                </button>
              </div>

              {/* Create New View form — multi-select groups */}
              {showNewView && (() => {
                const allGroupMetrics = newViewGroups.flatMap(g => ANNUAL_METRIC_GROUPS[g] ?? [])
                const uniqueGroupMetrics = Array.from(new Set(allGroupMetrics))
                return (
                  <div style={{ background: DS.surfaceHover, border: `1px solid ${DS.accentBorder}`, borderRadius: 12, padding: '14px 14px 12px', marginBottom: 12 }}>
                    {/* Step 1: multi-select groups */}
                    <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8 }}>1 — METRIC GROUPS <span style={{ color: DS.accent }}>({newViewGroups.length} selected)</span></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {Object.keys(ANNUAL_METRIC_GROUPS).map(g => {
                        const sel = newViewGroups.includes(g)
                        const count = ANNUAL_METRIC_GROUPS[g]?.length ?? 0
                        return (
                          <button key={g} onClick={() => {
                            setNewViewGroups(prev => sel ? prev.filter(x => x !== g) : [...prev, g])
                            if (!sel) {
                              setNewViewMetrics(prev => Array.from(new Set([...prev, ...(ANNUAL_METRIC_GROUPS[g] ?? [])])))
                            } else {
                              const toRemove = new Set(ANNUAL_METRIC_GROUPS[g] ?? [])
                              setNewViewMetrics(prev => prev.filter(m => !toRemove.has(m)))
                            }
                          }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 11, fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s' }}
                            onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent } }}
                            onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub } }}>
                            {sel && <HiOutlineCheck size={10} />}
                            {g}
                            <span style={{ fontSize: 9, color: sel ? DS.accent : DS.textFaint }}>{count}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Step 2: metrics from selected groups — immediately visible */}
                    {newViewGroups.length > 0 && (
                      <>
                        <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 6 }}>
                          2 — METRICS <span style={{ color: DS.accent }}>({newViewMetrics.length} selected)</span>
                          <button onClick={() => setNewViewMetrics(uniqueGroupMetrics)} style={{ marginLeft: 8, fontSize: 9, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DS.accentBorder}`, background: 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>All</button>
                          <button onClick={() => setNewViewMetrics([])} style={{ marginLeft: 4, fontSize: 9, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DS.border}`, background: 'transparent', color: DS.textSub, cursor: 'pointer', fontWeight: 600 }}>None</button>
                        </div>
                        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                          {newViewGroups.map(grp => (
                            <div key={grp}>
                              <div style={{ fontSize: 9, color: DS.textFaint, letterSpacing: '0.06em', padding: '4px 0 2px', fontWeight: 700 }}>{grp.toUpperCase()}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {(ANNUAL_METRIC_GROUPS[grp] ?? []).map(m => {
                                  const sel = newViewMetrics.includes(m)
                                  return (
                                    <button key={m} onClick={() => setNewViewMetrics(prev => sel ? prev.filter(x => x !== m) : [...prev, m])}
                                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 10, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.1s' }}>
                                      {sel && <HiOutlineCheck size={8} />}{m}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* View name + save */}
                    <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 6 }}>3 — VIEW NAME</div>
                    <input value={newViewName} onChange={e => setNewViewName(e.target.value)}
                      placeholder={newViewGroups.length > 0 ? newViewGroups[0] : 'Custom View'}
                      style={{ width: '100%', padding: '7px 10px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.surface, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                      onFocus={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }} />
                    <button
                      onClick={() => {
                        const name = newViewName.trim() || (newViewGroups[0] ?? 'Custom View')
                        if (!name || newViewMetrics.length === 0) return
                        setCustomViews(prev => ({ ...prev, [name]: newViewMetrics }))
                        setViewOrder(prev => [...prev, name])
                        setActiveTab(name)
                        setShowNewView(false); setNewViewGroups([]); setNewViewMetrics([]); setNewViewName('')
                      }}
                      disabled={newViewMetrics.length === 0}
                      style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: newViewMetrics.length > 0 ? DS.accent : '#e2e8f0', color: newViewMetrics.length > 0 ? '#fff' : DS.textFaint, fontSize: 12, fontWeight: 700, cursor: newViewMetrics.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: newViewMetrics.length > 0 ? '0 2px 10px rgba(37,99,235,0.25)' : 'none' }}>
                      Save View ({newViewMetrics.length} metrics)
                    </button>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
                {viewOrder.map((view, idx) => (
                  <div key={view}
                    draggable
                    onDragStart={() => { dragIdx.current = idx }}
                    onDragOver={e => { e.preventDefault() }}
                    onDrop={() => {
                      const from = dragIdx.current
                      if (from === null || from === idx) return
                      setViewOrder(prev => {
                        const next = [...prev]
                        const [item] = next.splice(from, 1)
                        next.splice(idx, 0, item)
                        return next
                      })
                      dragIdx.current = null
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: customViews[view] ? DS.accentSoft : DS.surfaceHover, border: `1px solid ${customViews[view] ? DS.accentBorder : DS.border}`, cursor: 'grab', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}>
                    <span style={{ color: DS.accent, fontSize: 16, cursor: 'grab', userSelect: 'none' }}>⋮⋮</span>
                    <span style={{ flex: 1, fontSize: 13, color: DS.text, fontWeight: 500 }}>{view}</span>
                    {customViews[view] && (
                      <span style={{ fontSize: 9, color: DS.accent, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 6, padding: '1px 6px', fontWeight: 600 }}>CUSTOM</span>
                    )}
                    <button onClick={() => setHiddenViews(prev => {
                      const next = new Set(prev)
                      if (next.has(view)) next.delete(view); else next.add(view)
                      return next
                    })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, color: hiddenViews.has(view) ? DS.textFaint : DS.accent, transition: 'all 0.12s' }}>
                      {hiddenViews.has(view) ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
                    </button>
                    {customViews[view] && (
                      <button onClick={() => {
                        setCustomViews(prev => { const next = { ...prev }; delete next[view]; return next })
                        setViewOrder(prev => prev.filter(v => v !== view))
                        setHiddenViews(prev => { const next = new Set(prev); next.delete(view); return next })
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, color: DS.red }}>
                        <HiOutlineXMark size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${DS.border}` }}>
              <button onClick={() => {
                setShowPersonalise(false)
                if (!visibleTabs.includes(activeTab)) setActiveTab((visibleTabs[0] ?? 'Annual Results'))
              }}
                style={{ width: '100%', padding: '10px', borderRadius: DS.radius, background: DS.accent, color: '#fff', border: `1px solid ${DS.accent}`, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
