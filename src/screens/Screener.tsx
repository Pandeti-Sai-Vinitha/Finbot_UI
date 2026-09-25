import { useState, useRef, useEffect, useCallback } from 'react'
import {
  HiOutlineMagnifyingGlass, HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlinePlus, HiOutlineXMark, HiOutlineBookmark, HiOutlineCheck,
  HiOutlineAdjustmentsHorizontal, HiOutlineArrowRight, HiOutlineTrash,
} from 'react-icons/hi2'
import {
  ANNUAL_METRIC_GROUPS, QUARTERLY_METRICS, SECTOR_COMPANIES, getAnnualData, FREQUENTLY_USED_METRICS,
} from '../data/finData'
import type { WatchlistItem, SavedScreener } from '../App'

const DS = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  border: 'rgba(15,23,42,0.08)',
  borderMed: 'rgba(15,23,42,0.12)',
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
  purple: '#7c3aed', purpleSoft: 'rgba(124,58,237,0.07)',
  overlay: 'rgba(15,23,42,0.45)',
  shadow: 'none',
  radius: 10,
}

const ALL_METRICS = [
  ...Object.values(ANNUAL_METRIC_GROUPS).flat(),
  ...QUARTERLY_METRICS.filter(m => !Object.values(ANNUAL_METRIC_GROUPS).flat().includes(m)),
]

const KEY_METRICS = ['PE TTM', 'PB Ratio', 'EV/EBITDA', 'Dividend Yield (%)', 'Return on Equity (%)', 'Return on Capital Employed (%)']
const RATIOS = ['Current Ratio', 'Quick Ratio', 'Debt to Equity', 'Interest Coverage', 'Asset Turnover']
const PRICE = ['Current Price (Rs)', 'Market Cap (Rs Cr)', '52W High', '52W Low', '1Y Return (%)', '3Y Return (%)']
const PREFERRED_TABS: { label: string; groups: { title: string; items: string[] }[] }[] = [
  { label: 'Annual Results', groups: [{ title: 'P&L', items: ['Sales', 'Operating Profit', 'Net Profit', 'EPS in Rs', 'OPM %'] }, { title: 'Margins', items: ANNUAL_METRIC_GROUPS['Profit & Loss'].slice(0, 8) }, { title: 'Full P&L', items: ANNUAL_METRIC_GROUPS['Profit & Loss'] }] },
  { label: 'Quarterly Results', groups: [{ title: 'Quarterly Metrics', items: QUARTERLY_METRICS }] },
  { label: 'Balance Sheet', groups: [{ title: 'Balance Sheet', items: ANNUAL_METRIC_GROUPS['Balance Sheet'] }] },
  { label: 'Cash Flow', groups: [{ title: 'Cash Flow', items: ANNUAL_METRIC_GROUPS['Cash Flow'] }] },
  { label: 'Key Metrics', groups: [{ title: 'Key Metrics', items: KEY_METRICS }] },
  { label: 'Ratios', groups: [{ title: 'Ratios', items: RATIOS }] },
  { label: 'Price', groups: [{ title: 'Price', items: PRICE }] },
]

const OPERATORS = ['<', '=', '>', '(', 'AND', 'OR', ')']

const ALL_COMPANIES = Array.from(new Set(Object.values(SECTOR_COMPANIES).flat()))

/* Deterministic seed based on query so each unique query shows different companies */
function querySeed(q: string): number {
  return q.trim().split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0)
}

function runScreener(query: string): Array<{ company: string; price: string; marketCap: string; values: Record<string, string> }> {
  const foundMetrics = ALL_METRICS.filter(m => query.includes(m))
  const seed = querySeed(query)
  const offset = seed % Math.max(1, ALL_COMPANIES.length - 15)
  const companies = [...ALL_COMPANIES.slice(offset), ...ALL_COMPANIES.slice(0, offset)].slice(0, 14)
  return companies.map(company => {
    const data = getAnnualData(company)
    const yd = (data['2025'] ?? data['2024'] ?? data['2023'] ?? {}) as Record<string, unknown>
    const fmt = (v: unknown) => (v !== undefined && v !== null && v !== '') ? String(v) : '—'
    const values: Record<string, string> = {}
    foundMetrics.forEach(m => { values[m] = fmt(yd[m]) })
    const priceRaw = ((seed + company.charCodeAt(0)) % 3000) + 50
    const capRaw = ((seed + company.charCodeAt(0) * 7) % 200000) + 1000
    return { company, price: priceRaw.toFixed(2), marketCap: Number(capRaw).toLocaleString('en-IN'), values }
  })
}

const EXAMPLE_QUERIES = [
  'Sales > 1000 AND OPM % > 15',
  'Net Profit > 500 AND EPS in Rs > 20',
  'Operating Profit > 200 AND Total Assets > 5000',
  'Sales > 500 AND Net Profit > 100',
]

interface Props {
  watchlists: WatchlistItem[]
  activeWatchlistId: number
  onUpdateWatchlist: (id: number, patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => void
  onNavigateToChat: () => void
  savedScreeners: SavedScreener[]
  onAddSavedScreener: (s: SavedScreener) => void
  onDeleteSavedScreener: (id: number) => void
  onRunComplete?: (query: string, count: number) => void
}

export default function Screener({
  watchlists, activeWatchlistId, onUpdateWatchlist, onNavigateToChat,
  savedScreeners, onAddSavedScreener, onDeleteSavedScreener, onRunComplete,
}: Props) {
  const [activeScreenerId, setActiveScreenerId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [metricSearch, setMetricSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [preferredOpen, setPreferredOpen] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [results, setResults] = useState<ReturnType<typeof runScreener> | null>(null)
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [showSavedMenu, setShowSavedMenu] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId)

  const isInWatchlist = useCallback((company: string) =>
    addedSet.has(company) || (activeWatchlist?.companies.includes(company) ?? false),
    [addedSet, activeWatchlist])

  const addToWatchlist = (company: string) => {
    if (isInWatchlist(company)) return
    const existing = activeWatchlist?.companies ?? []
    onUpdateWatchlist(activeWatchlistId, { companies: [...existing, company] })
    setAddedSet(prev => new Set(prev).add(company))
    setToast(`${company} added to Watchlist`)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2500)
  }

  const appendToQuery = (token: string) => {
    setQuery(q => {
      const sep = q.length > 0 && !q.endsWith(' ') ? ' ' : ''
      return q + sep + token + ' '
    })
    setMetricSearch('')
    setSearchOpen(false)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredMetrics = metricSearch.trim()
    ? ALL_METRICS.filter(m => m.toLowerCase().includes(metricSearch.toLowerCase()))
    : []

  const handlePreview = () => {
    if (!query.trim()) return
    const res = runScreener(query)
    setResults(res)
    onRunComplete?.(query, res.length)
  }

  const handleSave = () => {
    if (!query.trim()) return
    const res = results ?? runScreener(query)
    const id = Date.now()
    const name = `Screener ${savedScreeners.length + 1}`
    const s: SavedScreener = { id, name, query, results: res }
    onAddSavedScreener(s)
    setActiveScreenerId(id)
    setResults(res)
  }

  const loadScreener = (sc: SavedScreener) => {
    setQuery(sc.query)
    setResults(sc.results)
    setActiveScreenerId(sc.id)
  }

  const newScreener = () => {
    setQuery('')
    setResults(null)
    setActiveScreenerId(null)
  }

  const deleteScreener = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmId(id)
  }

  const confirmDeleteScreener = () => {
    if (deleteConfirmId === null) return
    const id = deleteConfirmId
    onDeleteSavedScreener(id)
    if (activeScreenerId === id) newScreener()
    setDeleteConfirmId(null)
  }

  const foundMetrics = ALL_METRICS.filter(m => query.includes(m))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: DS.bg, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* Shared page navbar */}
      <div style={{ height: 48, background: DS.surface, borderBottom: `1px solid ${DS.border}`, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DS.text, lineHeight: 1.1 }}>Screener</div>
          <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 2, whiteSpace: 'nowrap' }}>Build queries to filter companies by financial metrics</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <button onClick={() => setShowSavedMenu(value => !value)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', minHeight: 26, borderRadius: 6, border: `1px solid ${showSavedMenu ? DS.accentBorder : DS.borderMed}`, background: showSavedMenu ? DS.accentSoft : DS.surface, color: showSavedMenu ? DS.accent : DS.textSub, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            <HiOutlineBookmark size={11} /> Saved {savedScreeners.length > 0 && <span style={{ fontSize: 8, background: showSavedMenu ? 'rgba(37,99,235,0.12)' : '#e2e8f0', borderRadius: 10, padding: '1px 5px' }}>{savedScreeners.length}</span>} <HiOutlineChevronDown size={10} />
          </button>
          <button onClick={newScreener} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', minHeight: 26, borderRadius: 6, border: `1px solid ${DS.borderMed}`, background: DS.surface, color: DS.textSub, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}><HiOutlinePlus size={11} /> New</button>
          {showSavedMenu && <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 44, width: 220, maxHeight: 280, overflowY: 'auto', background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 8, boxShadow: '0 10px 24px rgba(15,23,42,0.14)', zIndex: 100 }}>
            {savedScreeners.length === 0 ? <div style={{ padding: '12px 14px', fontSize: 10, color: DS.textFaint }}>No saved screeners</div> : savedScreeners.map(sc => {
              const active = activeScreenerId === sc.id
              return <div key={sc.id} style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${DS.border}`, background: active ? DS.accentSoft : DS.surface }}>
                <button onClick={() => { loadScreener(sc); setShowSavedMenu(false) }} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', background: 'none', border: 'none', color: active ? DS.accent : DS.textSub, fontSize: 11, fontWeight: active ? 700 : 500, textAlign: 'left', cursor: 'pointer' }}><HiOutlineBookmark size={10} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.name}</span><span style={{ marginLeft: 'auto', fontSize: 8, color: DS.textFaint }}>{sc.results.length}</span></button>
                <button onClick={e => deleteScreener(sc.id, e)} title="Delete screener" style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4, background: 'none', border: 'none', color: DS.textFaint, cursor: 'pointer' }}><HiOutlineTrash size={11} /></button>
              </div>
            })}
          </div>}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px 20px' }}>

        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

          {/* Left: query + results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

            {/* Query Builder */}
            <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius, overflow: 'hidden' }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ padding: '8px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em' }}>QUERY BUILDER</span>
                {query && <button onClick={() => { setQuery(''); setResults(null) }}
                  style={{ fontSize: 10, color: DS.textFaint, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <HiOutlineXMark size={11} /> Clear
                </button>}
              </div>
              <textarea
                className="no-focus-glow"
                ref={textareaRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                rows={3}
                placeholder={`e.g., ${FREQUENTLY_USED_METRICS[0]} > 1000 AND ${FREQUENTLY_USED_METRICS[2]} > 10`}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 12.5, color: DS.text, background: 'transparent', lineHeight: 1.6, boxSizing: 'border-box', padding: '8px 12px' }}
              />
              {/* Operator chips + compact actions */}
              <div style={{ padding: '6px 12px 8px', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                {OPERATORS.map(op => (
                  <button key={op} onClick={() => appendToQuery(op)}
                    style={{ padding: '3px 9px', fontSize: 11, borderRadius: 6, background: '#f1f5f9', border: `1px solid ${DS.border}`, color: DS.textSub, cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.color = DS.accent }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = DS.textSub }}>
                    {op}
                  </button>
                ))}
                {/* Metric search */}
                <div ref={searchRef} style={{ position: 'relative' }}>
                  <button onClick={() => setSearchOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', fontSize: 11, borderRadius: 8, background: searchOpen ? DS.accentSoft : '#f1f5f9', border: `1px solid ${searchOpen ? DS.accentBorder : DS.border}`, color: searchOpen ? DS.accent : DS.textSub, cursor: 'pointer', fontWeight: 500 }}>
                    <HiOutlineMagnifyingGlass size={11} /> Add Metric
                  </button>
                  {searchOpen && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, background: DS.surface, border: `1px solid ${DS.accentBorder}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(37,99,235,0.12)', width: 240, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${DS.border}` }}>
                        <input autoFocus value={metricSearch} onChange={e => setMetricSearch(e.target.value)}
                          placeholder="Search metrics…"
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: DS.text, background: 'transparent', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
                        {(filteredMetrics.length > 0 ? filteredMetrics : FREQUENTLY_USED_METRICS).map(m => (
                          <button key={m} onClick={() => appendToQuery(m)}
                            style={{ width: '100%', textAlign: 'left', padding: '6px 12px', background: 'none', border: 'none', fontSize: 12, color: DS.text, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.color = DS.accent }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = DS.text }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button onClick={handlePreview} disabled={!query.trim()}
                    style={{ padding: '4px 10px', border: query.trim() ? `1px solid ${DS.accent}` : `1px solid ${DS.border}`, borderRadius: 6, background: query.trim() ? DS.accent : DS.surfaceHover, color: query.trim() ? '#fff' : DS.textFaint, fontSize: 11, fontWeight: 600, cursor: query.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, minHeight: 26 }}>
                    <HiOutlineAdjustmentsHorizontal size={12} /> Run
                  </button>
                  <button onClick={handleSave} disabled={!query.trim()}
                    style={{ padding: '4px 10px', border: `1px solid ${query.trim() ? DS.accentBorder : DS.border}`, borderRadius: 6, background: query.trim() ? DS.accentSoft : DS.surfaceHover, color: query.trim() ? DS.accent : DS.textFaint, fontSize: 11, fontWeight: 600, cursor: query.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, minHeight: 26 }}>
                    <HiOutlineBookmark size={12} /> Save
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {results === null ? (
              /* Empty state */
              <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <HiOutlineAdjustmentsHorizontal size={22} color={DS.accent} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DS.text, marginBottom: 6 }}>Build your first screener</div>
                <div style={{ fontSize: 12, color: DS.textSub, marginBottom: 18, lineHeight: 1.6 }}>Type a query or click an example below to filter companies by any financial metric</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
                  {EXAMPLE_QUERIES.map(q => (
                    <button key={q} onClick={() => { setQuery(q); setTimeout(handlePreview, 50) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', minHeight: 26, borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, fontSize: 10, cursor: 'pointer', fontWeight: 600, transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = DS.accent; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.color = DS.accent }}>
                      {q} <HiOutlineArrowRight size={10} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Results table */
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 8, overflow: 'hidden', boxShadow: 'none' }}>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${DS.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: DS.text }}>{results.length} companies matched</span>
                    <button onClick={() => setResults(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: DS.textFaint, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <HiOutlineXMark size={12} /> Clear
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: DS.textSub, background: DS.surfaceHover, border: `1px solid ${DS.border}`, borderRadius: 6, padding: '4px 8px', marginBottom: foundMetrics.length > 0 ? 5 : 0 }}>
                    <span style={{ color: DS.textFaint }}>Query: </span>{query}
                  </div>
                  {foundMetrics.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {foundMetrics.map(m => <span key={m} style={{ fontSize: 8, padding: '1px 6px', borderRadius: 5, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, fontWeight: 600 }}>{m}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: DS.surfaceHover }}>
                        <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: DS.textMuted, letterSpacing: '0.07em', whiteSpace: 'nowrap', background: DS.surfaceHover }}>COMPANY</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: DS.textMuted, letterSpacing: '0.07em', background: DS.surfaceHover }}>PRICE</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: DS.textMuted, letterSpacing: '0.07em', background: DS.surfaceHover }}>MKT CAP</th>
                        {foundMetrics.map(m => <th key={m} style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: DS.textMuted, letterSpacing: '0.07em', whiteSpace: 'nowrap', background: DS.surfaceHover }}>{m.toUpperCase()}</th>)}
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: DS.textMuted, letterSpacing: '0.07em', background: DS.surfaceHover }}>WATCHLIST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => {
                        const inWL = isInWatchlist(row.company)
                        return (
                          <tr key={row.company} style={{ background: i % 2 === 0 ? '#fff' : '#fafbff', borderTop: `1px solid ${DS.border}` }}
                            onMouseEnter={e => e.currentTarget.style.background = DS.surfaceHover}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff'}>
                            <td style={{ padding: '6px 12px', fontWeight: 600, color: DS.text, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: `1px solid ${DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: DS.accent, flexShrink: 0 }}>
                                  {row.company.slice(0, 2).toUpperCase()}
                                </div>
                                {row.company}
                              </div>
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: DS.text, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>₹{row.price}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: DS.textSub, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>₹{row.marketCap} Cr</td>
                            {foundMetrics.map(m => <td key={m} style={{ padding: '6px 8px', textAlign: 'right', fontSize: 11, color: row.values[m] === '—' ? DS.textFaint : DS.text, fontVariantNumeric: 'tabular-nums' }}>{row.values[m]}</td>)}
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              {inWL ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: DS.green, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>
                                  <HiOutlineCheck size={10} /> Added
                                </span>
                              ) : (
                                <button onClick={() => addToWatchlist(row.company)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: DS.accent, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.12s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = DS.accent; e.currentTarget.style.color = '#fff' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.color = DS.accent }}>
                                  <HiOutlinePlus size={10} /> Add
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: metric picker */}
          <div style={{ display: 'flex', flexDirection: 'column', background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 8, overflow: 'hidden', boxShadow: 'none' }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${DS.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8 }}>FREQUENTLY USED</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {FREQUENTLY_USED_METRICS.map(m => (
                  <button key={m} onClick={() => appendToQuery(m)}
                    style={{ padding: '4px 9px', fontSize: 10, borderRadius: 6, background: query.includes(m) ? DS.accent : DS.accentSoft, border: `1px solid ${query.includes(m) ? DS.accent : DS.accentBorder}`, color: query.includes(m) ? '#fff' : DS.accent, cursor: 'pointer', fontWeight: 600, transition: 'all 0.12s' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs + metric accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <button onClick={() => setPreferredOpen(o => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'none', border: 'none', borderBottom: preferredOpen ? `1px solid ${DS.border}` : 'none', cursor: 'pointer', color: DS.textSub, fontSize: 11, fontWeight: 600 }}>
                <span style={{ fontSize: 9, letterSpacing: '0.07em', color: DS.textFaint, fontWeight: 700 }}>METRIC CATEGORIES</span>
                {preferredOpen ? <HiOutlineChevronUp size={12} /> : <HiOutlineChevronDown size={12} />}
              </button>
              {preferredOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  {/* Tab bar */}
                  <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${DS.border}` }}>
                    {PREFERRED_TABS.map((tab, i) => (
                      <button key={tab.label} onClick={() => setActiveTab(i)}
                        style={{ padding: '7px 11px', background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${DS.accent}` : '2px solid transparent', color: activeTab === i ? DS.accent : DS.textSub, fontSize: 10, fontWeight: activeTab === i ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s' }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {/* Groups */}
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 0' }}>
                    {PREFERRED_TABS[activeTab]?.groups.map(grp => (
                      <div key={grp.title} style={{ padding: '4px 14px 8px' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 5 }}>{grp.title.toUpperCase()}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {grp.items.map(item => {
                            const inQuery = query.includes(item)
                            return (
                              <button key={item} onClick={() => appendToQuery(item)}
                                style={{ padding: '3px 8px', fontSize: 10, borderRadius: 6, background: inQuery ? DS.accentSoft : DS.surfaceHover, border: `1px solid ${inQuery ? DS.accentBorder : DS.border}`, color: inQuery ? DS.accent : DS.textSub, cursor: 'pointer', fontWeight: inQuery ? 600 : 400, transition: 'all 0.1s' }}
                                onMouseEnter={e => { if (!inQuery) { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.color = DS.accent } }}
                                onMouseLeave={e => { if (!inQuery) { e.currentTarget.style.background = DS.surfaceHover; e.currentTarget.style.color = DS.textSub } }}>
                                {item}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 12, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 100, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
          <HiOutlineBookmark size={13} color="#60a5fa" /> {toast}
        </div>
      )}

      {deleteConfirmId !== null && (
        <div onClick={() => setDeleteConfirmId(null)} style={{ position: 'fixed', inset: 0, background: DS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 320, background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 10, padding: 16, boxShadow: '0 12px 30px rgba(15,23,42,0.18)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DS.text, marginBottom: 5 }}>Delete saved screener?</div>
            <div style={{ fontSize: 11, color: DS.textSub, lineHeight: 1.5, marginBottom: 14 }}>This will remove the saved screener and its dashboard activity.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '4px 10px', minHeight: 26, borderRadius: 6, border: `1px solid ${DS.borderMed}`, background: DS.surface, color: DS.textSub, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDeleteScreener} style={{ padding: '4px 10px', minHeight: 26, borderRadius: 6, border: `1px solid ${DS.redBorder}`, background: DS.redSoft, color: DS.red, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
