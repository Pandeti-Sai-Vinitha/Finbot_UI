import { useState, useMemo, useEffect, useRef } from 'react'
import {
  HiOutlineSparkles, HiOutlineBookmark, HiOutlineAdjustmentsHorizontal,
  HiOutlineChevronRight, HiOutlineArrowUpRight, HiOutlineChartBar,
  HiOutlineMagnifyingGlass, HiOutlineChevronLeft,
  HiOutlineArrowTrendingUp, HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight, HiOutlineClipboardDocumentList,
  HiOutlineXMark, HiOutlineFunnel, HiOutlineCheck,
} from 'react-icons/hi2'
import { BsRobot } from 'react-icons/bs'
import { ALL_SECTORS, SECTOR_COMPANIES, getAnnualData } from '../data/finData'
import type { Screen, WatchlistItem } from '../App'

interface Props {
  onNavigate: (screen: Screen) => void
  watchlists: WatchlistItem[]
  activeWatchlistId: number
  onUpdateWatchlist: (id: number, patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => void
  recentScreenerRuns: { query: string; count: number; runAt: string }[]
  recentChatMessages: string[]
  onSelectCompany: (company: string) => void
}

/* ─── Design tokens ─────────────────────────────────────────────── */
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
  amber: '#d97706', amberSoft: 'rgba(217,119,6,0.08)', amberBorder: 'rgba(217,119,6,0.22)',
  purple: '#7c3aed', purpleSoft: 'rgba(124,58,237,0.07)', purpleBorder: 'rgba(124,58,237,0.18)',
  shadow: 'none',
  radius: 10,
}

/* ─── Company data ──────────────────────────────────────────────── */
const CO_SECTOR: Record<string, string> = {}
ALL_SECTORS.forEach(sec => { (SECTOR_COMPANIES[sec] ?? []).forEach(co => { CO_SECTOR[co] = sec }) })

const ALL_COMPANIES_LIST: { name: string; sector: string }[] = (() => {
  const seen = new Set<string>(); const out: { name: string; sector: string }[] = []
  ALL_SECTORS.forEach(sec => (SECTOR_COMPANIES[sec] ?? []).forEach(name => { if (!seen.has(name)) { seen.add(name); out.push({ name, sector: sec }) } }))
  return out
})()

/* Mock Nifty 500: first 100 companies */
const NIFTY_500_SET = new Set(ALL_COMPANIES_LIST.slice(0, 100).map(c => c.name))

const METRIC_LABELS = ['Sales', 'Net Profit', 'OPM %']

function getCompanyMetrics(name: string): { label: string; value: string; positive: boolean | null }[] {
  const data = getAnnualData(name)
  const yd = (data['2025'] ?? data['2024'] ?? data['2023'] ?? {}) as Record<string, unknown>
  const fmt = (v: unknown, isPct: boolean) => {
    if (v === undefined || v === null || v === '') return null
    const n = Number(v)
    if (isNaN(n)) return String(v)
    if (isPct) return `${n.toFixed(1)}%`
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L Cr`
    if (Math.abs(n) >= 1000) return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
    return `₹${n.toFixed(0)} Cr`
  }
  return [
    { label: 'Revenue', value: fmt(yd['Sales'], false) ?? '—', positive: null },
    { label: 'Net Profit', value: fmt(yd['Net Profit'], false) ?? '—', positive: yd['Net Profit'] !== undefined ? Number(yd['Net Profit']) > 0 : null },
    { label: 'OPM %', value: fmt(yd['OPM %'], true) ?? '—', positive: yd['OPM %'] !== undefined ? Number(yd['OPM %']) > 0 : null },
  ]
}

/* ─── Avatar ────────────────────────────────────────────────────── */
const GRADIENTS = [
  'linear-gradient(135deg,#2563eb,#1d4ed8)', 'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'linear-gradient(135deg,#059669,#047857)', 'linear-gradient(135deg,#d97706,#b45309)',
  'linear-gradient(135deg,#dc2626,#b91c1c)', 'linear-gradient(135deg,#0891b2,#0e7490)',
]
function hashIdx(name: string) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff; return h % GRADIENTS.length }

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: GRADIENTS[hashIdx(name)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em' }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

/* ─── Company card ──────────────────────────────────────────────── */
function CompanyCard({ name, sector, borderRight = false }: { name: string; sector: string; borderRight?: boolean }) {
  const metrics = getCompanyMetrics(name)
  const isNifty = NIFTY_500_SET.has(name)
  return (
    <div style={{ padding: '12px 12px', borderRight: borderRight ? `1px solid ${DS.border}` : 'none', borderBottom: `1px solid ${DS.border}`, transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = DS.surfaceHover}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <Avatar name={name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
            {isNifty && <span style={{ fontSize: 8, fontWeight: 700, color: DS.amber, background: DS.amberSoft, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>N500</span>}
          </div>
          <div style={{ fontSize: 10, color: DS.textMuted }}>{sector}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {metrics.map(m => (
          <div key={m.label} style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: `1px solid ${DS.border}`, fontSize: 10 }}>
            <span style={{ background: '#f1f5f9', color: DS.textFaint, padding: '3px 6px', borderRight: `1px solid ${DS.border}` }}>{m.label}</span>
            <span style={{ background: '#fff', color: m.positive === true ? DS.green : m.positive === false ? DS.red : DS.textSub, padding: '3px 7px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Smart paginator ───────────────────────────────────────────── */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = []
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }
  return pages
}

/* ─── Widget chrome ─────────────────────────────────────────────── */
function WidgetCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius, overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function WidgetHeader({ icon, title, meta, action }: { icon: React.ReactNode; title: string; meta?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '6px 12px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 8, background: DS.surfaceHover, flexShrink: 0 }}>
      <div style={{ flexShrink: 0, color: DS.accent }}>{icon}</div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: DS.text, flex: 1 }}>{title}</span>
      {meta && <span style={{ fontSize: 9.5, color: DS.textFaint }}>{meta}</span>}
      {action}
    </div>
  )
}

function CompanyFilters({ activeGroup, onGroup, onSelect, sectors }: { activeGroup: 'indices' | 'sectors' | 'marketCap' | 'all'; onGroup: (group: 'indices' | 'sectors' | 'marketCap' | 'all') => void; onSelect: (value: string) => void; sectors: string[] }) {
  const groups = [
    { id: 'indices' as const, label: 'Key Indices' },
    { id: 'sectors' as const, label: 'Sectors' },
    { id: 'marketCap' as const, label: 'Market Cap' },
    { id: 'all' as const, label: 'All Companies' },
  ]
  const values = activeGroup === 'indices' ? ['Nifty 500'] : activeGroup === 'marketCap' ? ['Large Cap', 'Mid Cap', 'Small Cap'] : activeGroup === 'sectors' ? sectors : ['All Companies']
  return (
    <div style={{ position: 'absolute', top: 54, right: 14, zIndex: 30, width: 440, display: 'flex', background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 10, boxShadow: '0 4px 14px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
      <div style={{ width: 150, flexShrink: 0, borderRight: `1px solid ${DS.borderMed}` }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${DS.borderMed}`, fontSize: 13, fontWeight: 700, color: DS.text }}>Filters</div>
        {groups.map(group => {
          const selected = activeGroup === group.id
          return <button key={group.id} onClick={() => onGroup(group.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: selected ? '#f1f5f9' : '#fff', border: 'none', borderBottom: `1px solid ${DS.border}`, color: selected ? DS.text : DS.textSub, fontSize: 12, fontWeight: selected ? 700 : 500, textAlign: 'left', cursor: 'pointer' }}>
            {group.label}{group.id !== 'all' && <HiOutlineChevronRight size={14} color={selected ? DS.text : DS.textMuted} />}
          </button>
        })}
      </div>
      <div style={{ flex: 1, maxHeight: 280, overflowY: 'auto' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.borderMed}`, fontSize: 12, fontWeight: 700, color: DS.text }}>{groups.find(group => group.id === activeGroup)?.label}</div>
        {values.map(value => <button key={value} onClick={() => onSelect(value)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: 'none', borderBottom: `1px dashed ${DS.borderMed}`, color: DS.textSub, fontSize: 12, textAlign: 'left', cursor: 'pointer' }} onMouseEnter={event => event.currentTarget.style.background = '#f8fafc'} onMouseLeave={event => event.currentTarget.style.background = '#fff'}>{value}<HiOutlineChevronRight size={13} color={DS.textFaint} /></button>)}
      </div>
    </div>
  )
}

const TABLE_COLS = 'minmax(160px, 1.5fr) minmax(110px, 1.1fr) repeat(4, minmax(80px, 0.8fr))'

function CompanyTable({ companies, watchlistCompanies, onAddCompany, onSelectCompany, compact }: { companies: { name: string; sector: string }[]; watchlistCompanies: string[]; onAddCompany: (company: string) => void; onSelectCompany: (company: string) => void; compact?: boolean }) {
  const pad = compact ? '6px 10px' : '8px 12px'
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ minWidth: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, background: '#f3f4f6', borderBottom: `1px solid ${DS.borderMed}`, color: DS.textMuted, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
          {['Company Name', 'Sector', 'Revenue', 'Net Profit', 'OPM %', 'Total Assets'].map(label => <div key={label} style={{ padding: pad, textAlign: label === 'Company Name' || label === 'Sector' ? 'left' : 'right' }}>{label}</div>)}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {companies.map((co, index) => {
            const row = (getAnnualData(co.name)['2025'] ?? getAnnualData(co.name)['2024'] ?? {}) as Record<string, unknown>
            const format = (value: unknown, suffix = '') => value === undefined || value === '' ? '—' : `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 })}${suffix}`
            return <div key={`${co.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, borderBottom: `1px solid ${DS.border}`, background: index % 2 ? '#fbfbfc' : '#fff', color: DS.text, fontSize: compact ? 11 : 12, height: compact ? 38 : 42 }}>
              <div style={{ padding: pad, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <button onClick={() => onAddCompany(co.name)} disabled={watchlistCompanies.includes(co.name)} title={watchlistCompanies.includes(co.name) ? 'Already in watchlist' : 'Add to watchlist'} style={{ width: 18, height: 18, padding: 0, border: 'none', background: 'transparent', color: watchlistCompanies.includes(co.name) ? DS.green : DS.accent, fontSize: 16, lineHeight: 1, cursor: watchlistCompanies.includes(co.name) ? 'default' : 'pointer', flexShrink: 0 }}>
                  {watchlistCompanies.includes(co.name) ? <HiOutlineCheck size={14} /> : '+'}
                </button>
                <button onClick={() => onSelectCompany(co.name)} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 'none', background: 'none', padding: 0, color: DS.text, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }} title={`View ${co.name} details`}>{co.name}</button>
              </div>
              <div style={{ padding: pad, color: DS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>{co.sector}</div>
              <div style={{ padding: pad, textAlign: 'right', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{format(row.Sales, ' Cr')}</div>
              <div style={{ padding: pad, textAlign: 'right', color: Number(row['Net Profit']) >= 0 ? DS.green : DS.red, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{format(row['Net Profit'], ' Cr')}</div>
              <div style={{ padding: pad, textAlign: 'right', color: DS.green, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{format(row['OPM %'], '%')}</div>
              <div style={{ padding: pad, textAlign: 'right', color: DS.textSub, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{format(row['Total Assets'], ' Cr')}</div>
            </div>
          })}
        </div>
      </div>
    </div>
  )
}

function NavLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontSize: 11, color: DS.accent, background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600, padding: 0, cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'}
      onMouseLeave={e => e.currentTarget.style.color = DS.accent}>
      {label} <HiOutlineChevronRight size={11} />
    </button>
  )
}

function EmptyState({ icon, text, cta, onCta }: { icon: React.ReactNode; text: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', height: '100%', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.textFaint }}>{icon}</div>
      <div style={{ fontSize: 11, color: DS.textMuted, lineHeight: 1.5, maxWidth: 200 }}>{text}</div>
      {cta && onCta && (
        <button onClick={onCta} style={{ fontSize: 11, fontWeight: 600, color: DS.accent, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 7, padding: '5px 14px', marginTop: 2, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.background = DS.accentSoft }}>
          {cta}
        </button>
      )}
    </div>
  )
}

export default function Dashboard({ onNavigate, watchlists, activeWatchlistId, onUpdateWatchlist, recentScreenerRuns, recentChatMessages, onSelectCompany }: Props) {
  const [activeInsight, setActiveInsight] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [niftyOnly, setNiftyOnly] = useState(true)
  const [capFilter, setCapFilter] = useState('All')
  const [filterGroup, setFilterGroup] = useState<'indices' | 'sectors' | 'marketCap' | 'all'>('indices')
  const [showFilterPopup, setShowFilterPopup] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [vw, setVw] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const tableAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () => setVw({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const compact = vw.h < 820 || vw.w < 1180
  const sideW = vw.w < 1100 ? 240 : vw.w < 1280 ? 268 : 300

  useEffect(() => {
    const el = tableAreaRef.current
    if (!el) return
    const measure = () => {
      const rowH = compact ? 38 : 42
      const headerH = compact ? 30 : 34
      const n = Math.floor((el.clientHeight - headerH) / rowH)
      setPageSize(Math.max(3, Math.min(14, n || 5)))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [compact])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const activeWatchlist = watchlists.find(watchlist => watchlist.id === activeWatchlistId) ?? watchlists[0]
  const watchlistCompanies = activeWatchlist?.companies ?? []

  const UNIQUE_SECTORS = Array.from(new Set(ALL_COMPANIES_LIST.map(c => c.sector)))

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ALL_COMPANIES_LIST.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.sector.toLowerCase().includes(q)) return false
      if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false
      if (niftyOnly && !NIFTY_500_SET.has(c.name)) return false
      if (capFilter !== 'All') {
        const assets = Number(getAnnualData(c.name)['2025']?.['Total Assets'] ?? 0)
        if (capFilter === 'Large Cap' && assets < 100000) return false
        if (capFilter === 'Mid Cap' && (assets < 30000 || assets >= 100000)) return false
        if (capFilter === 'Small Cap' && assets >= 30000) return false
      }
      return true
    })
  }, [search, sectorFilter, niftyOnly, capFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageData = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const addCompanyToWatchlist = (company: string) => {
    if (!activeWatchlist || activeWatchlist.companies.includes(company)) return
    onUpdateWatchlist(activeWatchlist.id, { companies: [...activeWatchlist.companies, company] })
  }

  const pageNums = getPageNumbers(safePage, totalPages)
  const padX = compact ? 12 : 16
  const bodyPad = compact ? '10px 12px 10px' : '14px 18px 14px'
  const btnSize = compact ? 26 : 28

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: DS.bg, fontFamily: 'Inter, sans-serif' }}>

      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 20px', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: DS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HiOutlineChartBar size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: compact ? 14 : 16, fontWeight: 700, color: DS.text, letterSpacing: '-0.02em', fontFamily: 'Instrument Sans, sans-serif' }}>Dashboard</div>
            <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 1 }}>{greeting} · {dateStr}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: bodyPad, display: 'flex' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `minmax(0, 1fr) ${sideW}px`, gap: compact ? 10 : 14, flex: 1, minHeight: 0, minWidth: 0 }}>

          <WidgetCard style={{ position: 'relative', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: compact ? '8px 12px 8px' : '10px 14px', borderBottom: `1px solid ${DS.border}`, background: DS.surfaceHover, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: compact ? 6 : 8 }}>
                <HiOutlineChartBar size={14} color={DS.accent} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: DS.text, flex: 1 }}>Companies</span>
                <span style={{ fontSize: 10, color: DS.textFaint }}>{ALL_COMPANIES_LIST.length} listed</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 8, padding: compact ? '4px 8px' : '5px 10px' }}>
                  <HiOutlineMagnifyingGlass size={13} color={DS.textFaint} />
                  <input value={search} onChange={e => handleSearch(e.target.value)}
                    placeholder="Search companies…"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 12, color: DS.text, fontFamily: 'Inter, sans-serif' }} />
                  {search && <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', color: DS.textFaint, display: 'flex', padding: 0, cursor: 'pointer' }}><HiOutlineXMark size={13} /></button>}
                </div>
                <button onClick={() => setShowFilterPopup(value => !value)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: compact ? '4px 10px' : '5px 12px', background: showFilterPopup ? DS.accentSoft : '#fff', border: `1px solid ${showFilterPopup ? DS.accent : DS.borderMed}`, borderRadius: 8, color: showFilterPopup ? DS.accent : DS.textSub, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}><HiOutlineFunnel size={13} /> Filter</button>
              </div>
              {showFilterPopup && <CompanyFilters activeGroup={filterGroup} onGroup={group => { setFilterGroup(group); setPage(1) }} onSelect={value => {
                setShowFilterPopup(false); setPage(1)
                if (value === 'Nifty 500') { setFilterGroup('indices'); setNiftyOnly(true); setSectorFilter('All'); setCapFilter('All') }
                else if (value === 'All Companies') { setFilterGroup('all'); setNiftyOnly(false); setSectorFilter('All'); setCapFilter('All') }
                else if (value.endsWith('Cap')) { setFilterGroup('marketCap'); setNiftyOnly(false); setSectorFilter('All'); setCapFilter(value) }
                else { setFilterGroup('sectors'); setNiftyOnly(false); setCapFilter('All'); setSectorFilter(value) }
              }} sectors={UNIQUE_SECTORS} />}
            </div>

            <div ref={tableAreaRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <CompanyTable companies={pageData} watchlistCompanies={watchlistCompanies} onAddCompany={addCompanyToWatchlist} onSelectCompany={onSelectCompany} compact={compact} />
            </div>

            <div style={{ padding: compact ? '6px 10px' : `8px ${padX}px`, display: 'flex', alignItems: 'center', gap: 8, background: DS.surfaceHover, borderTop: `1px solid ${DS.border}`, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, color: DS.textFaint, whiteSpace: 'nowrap' }}>
                {filtered.length === 0 ? '0 companies' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
              </span>
              {totalPages > 1 && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)}
                    style={{ width: btnSize, height: btnSize, borderRadius: 7, border: `1px solid ${DS.border}`, background: DS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === 1 ? 0.35 : 1, color: DS.textMuted, cursor: safePage === 1 ? 'default' : 'pointer' }}>
                    <HiOutlineChevronLeft size={12} />
                  </button>
                  {pageNums.map((pg, i) =>
                    pg === '...'
                      ? <span key={`dots-${i}`} style={{ width: btnSize, textAlign: 'center', color: DS.textFaint, fontSize: 11 }}>…</span>
                      : <button key={pg} onClick={() => setPage(pg as number)}
                          style={{ minWidth: btnSize, height: btnSize, padding: '0 4px', borderRadius: 7, border: `1px solid ${pg === safePage ? DS.accentBorder : DS.border}`, background: pg === safePage ? DS.accentSoft : DS.surface, color: pg === safePage ? DS.accent : DS.textMuted, fontSize: 11, fontVariantNumeric: 'tabular-nums', fontWeight: pg === safePage ? 700 : 400, cursor: 'pointer' }}>{pg}</button>
                  )}
                  <button disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}
                    style={{ width: btnSize, height: btnSize, borderRadius: 7, border: `1px solid ${DS.border}`, background: DS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === totalPages ? 0.35 : 1, color: DS.textMuted, cursor: safePage === totalPages ? 'default' : 'pointer' }}>
                    <HiOutlineChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </WidgetCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10, minHeight: 0, height: '100%', overflow: 'hidden' }}>
            <WidgetCard style={{ flex: '0 1 auto', maxHeight: compact ? 'calc((100% - 16px) / 3)' : 'calc((100% - 20px) / 3)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <WidgetHeader
                icon={<HiOutlineBookmark size={14} />}
                title={activeWatchlist?.name ?? 'Watchlist'}
                action={<NavLink label="Open" onClick={() => onNavigate('compare')} />}
              />
              {watchlistCompanies.length === 0 ? (
                <div style={{ flex: 1, minHeight: 0 }}><EmptyState icon={<HiOutlineBookmark size={18} />} text="No companies added yet." cta="Open Watchlist" onCta={() => onNavigate('compare')} /></div>
              ) : (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  {watchlistCompanies.map((name, i) => (
                    <div key={name}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: compact ? '6px 10px' : '8px 12px', borderBottom: i < watchlistCompanies.length - 1 ? `1px solid ${DS.border}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbff'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <Avatar name={name} size={compact ? 26 : 28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button onClick={() => onSelectCompany(name)} style={{ display: 'block', maxWidth: '100%', padding: 0, border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'left' }}>{name}</button>
                        <div style={{ fontSize: 10, color: DS.textMuted }}>{CO_SECTOR[name] ?? '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>

            <WidgetCard style={{ flex: '0 1 auto', maxHeight: compact ? 'calc((100% - 16px) / 3)' : 'calc((100% - 20px) / 3)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <WidgetHeader
                icon={<HiOutlineSparkles size={14} style={{ color: DS.purple }} />}
                title="AI Insights"
                action={<NavLink label="Ask AI" onClick={() => onNavigate('chat')} />}
              />
              {recentChatMessages.length === 0 ? (
                <div style={{ flex: 1, minHeight: 0 }}><EmptyState icon={<HiOutlineChatBubbleLeftRight size={18} />} text="No queries yet. Start a conversation in AI Chat." cta="Open AI Chat" onCta={() => onNavigate('chat')} /></div>
              ) : (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {recentChatMessages.map((msg, i) => {
                    const IconComponents = [HiOutlineArrowTrendingUp, HiOutlineChatBubbleLeftRight, HiOutlineSparkles, HiOutlineExclamationTriangle, HiOutlineMagnifyingGlass]
                    const IconComp = IconComponents[i % IconComponents.length]
                    const isActive = activeInsight === i
                    return (
                      <div key={i} onClick={() => setActiveInsight(isActive ? null : i)}
                        style={{ padding: '8px 10px', borderRadius: 8, background: isActive ? DS.accentSoft : '#f8fafc', border: `1px solid ${isActive ? DS.accentBorder : DS.border}`, cursor: 'pointer', transition: 'all 0.12s' }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <IconComp size={13} color={isActive ? DS.accent : DS.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: 11, color: DS.textSub, lineHeight: 1.45, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg}</span>
                        </div>
                        {isActive && (
                          <button onClick={e => { e.stopPropagation(); onNavigate('chat') }}
                            style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#fff', background: DS.accent, border: `1px solid ${DS.accent}`, borderRadius: 7, padding: '4px 10px', fontWeight: 600, cursor: 'pointer' }}>
                            <BsRobot size={11} /> Continue in AI Chat
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </WidgetCard>

            <WidgetCard style={{ flex: '0 1 auto', maxHeight: compact ? 'calc((100% - 16px) / 3)' : 'calc((100% - 20px) / 3)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <WidgetHeader
                icon={<HiOutlineAdjustmentsHorizontal size={14} style={{ color: DS.amber }} />}
                title="Screener Activity"
                action={<NavLink label="Run" onClick={() => onNavigate('screener')} />}
              />
              {recentScreenerRuns.length === 0 ? (
                <div style={{ flex: 1, minHeight: 0 }}><EmptyState icon={<HiOutlineClipboardDocumentList size={18} />} text="No screener runs yet." cta="Open Screener" onCta={() => onNavigate('screener')} /></div>
              ) : (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recentScreenerRuns.map((s, i) => (
                    <button key={i} onClick={() => onNavigate('screener')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: compact ? '6px 8px' : '8px 10px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${DS.border}`, textAlign: 'left', width: '100%', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.borderColor = DS.accentBorder }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = DS.border }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: DS.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HiOutlineAdjustmentsHorizontal size={13} color={DS.amber} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.query}</div>
                        <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 1 }}>{s.count} companies · {s.runAt}</div>
                      </div>
                      <HiOutlineArrowUpRight size={12} color={DS.textFaint} />
                    </button>
                  ))}
                </div>
              )}
            </WidgetCard>
          </div>
        </div>
      </div>
    </div>
  )
}
