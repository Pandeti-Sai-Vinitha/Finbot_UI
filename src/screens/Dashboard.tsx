import { useState, useMemo } from 'react'
import {
  HiOutlineSparkles, HiOutlineBookmark, HiOutlineAdjustmentsHorizontal,
  HiOutlineChevronRight, HiOutlineArrowUpRight, HiOutlineChartBar,
  HiOutlineMagnifyingGlass, HiOutlineChevronLeft,
  HiOutlineArrowTrendingUp, HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight, HiOutlineClipboardDocumentList,
  HiOutlineXMark, HiOutlineFunnel, HiOutlineChevronDown,
} from 'react-icons/hi2'
import { BsRobot } from 'react-icons/bs'
import { ALL_SECTORS, SECTOR_COMPANIES, getAnnualData } from '../data/finData'
import type { Screen, WatchlistItem } from '../App'

interface Props {
  onNavigate: (screen: Screen) => void
  watchlists: WatchlistItem[]
  recentScreenerRuns: { query: string; count: number; runAt: string }[]
  recentChatMessages: string[]
}

/* ─── Design tokens ─────────────────────────────────────────────── */
const DS = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  border: 'rgba(15,23,42,0.07)',
  borderMed: 'rgba(15,23,42,0.1)',
  text: '#0f172a',
  textSub: '#475569',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  accent: '#2563eb',
  accentDark: '#1d4ed8',
  accentSoft: 'rgba(37,99,235,0.06)',
  accentBorder: 'rgba(37,99,235,0.14)',
  accentHover: 'rgba(37,99,235,0.08)',
  green: '#16a34a', greenSoft: '#f0fdf4', greenBorder: '#bbf7d0',
  red: '#dc2626', redSoft: '#fef2f2', redBorder: '#fecaca',
  amber: '#d97706', amberSoft: 'rgba(217,119,6,0.08)', amberBorder: 'rgba(217,119,6,0.22)',
  purple: '#7c3aed', purpleSoft: 'rgba(124,58,237,0.07)', purpleBorder: 'rgba(124,58,237,0.18)',
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
    <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.03)', ...style }}>
      {children}
    </div>
  )
}

function WidgetHeader({ icon, title, meta, action }: { icon: React.ReactNode; title: string; meta?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 12px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 8, background: '#fafbfc' }}>
      <div style={{ flexShrink: 0, color: DS.accent }}>{icon}</div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: DS.text, flex: 1 }}>{title}</span>
      {meta && <span style={{ fontSize: 9.5, color: DS.textFaint }}>{meta}</span>}
      {action}
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
    <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.textFaint }}>{icon}</div>
      <div style={{ fontSize: 12, color: DS.textMuted, lineHeight: 1.6, maxWidth: 200 }}>{text}</div>
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

const PAGE_SIZE = 12

export default function Dashboard({ onNavigate, watchlists, recentScreenerRuns, recentChatMessages }: Props) {
  const [activeInsight, setActiveInsight] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [niftyOnly, setNiftyOnly] = useState(false)
  const [showSectorMenu, setShowSectorMenu] = useState(false)
  const [page, setPage] = useState(1)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const activeWatchlist = watchlists[0]
  const watchlistCompanies = (activeWatchlist?.companies ?? []).slice(0, 5)
  const watchlistMetrics = activeWatchlist?.metrics ?? []

  const UNIQUE_SECTORS = Array.from(new Set(ALL_COMPANIES_LIST.map(c => c.sector)))

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ALL_COMPANIES_LIST.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.sector.toLowerCase().includes(q)) return false
      if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false
      if (niftyOnly && !NIFTY_500_SET.has(c.name)) return false
      return true
    })
  }, [search, sectorFilter, niftyOnly])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageData = showAll
    ? filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : ALL_COMPANIES_LIST.slice(0, 6)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleSector = (v: string) => { setSectorFilter(v); setPage(1); setShowSectorMenu(false) }

  const pageNums = getPageNumbers(safePage, totalPages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: DS.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, flexShrink: 0, boxShadow: '0 1px 0 rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 20px', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DS.text, letterSpacing: '-0.02em' }}>Dashboard</div>
            <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 1 }}>{greeting} · {dateStr}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: DS.green, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, borderRadius: 20, padding: '4px 10px', fontWeight: 500 }}>
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              NSE Open
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

          {/* ── LEFT: Companies ─────────────────────────────── */}
          <WidgetCard>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DS.border}`, background: '#fafbfc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showAll ? 8 : 0 }}>
                <HiOutlineChartBar size={15} color={DS.accent} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: DS.text, flex: 1 }}>Companies</span>
                <span style={{ fontSize: 10, color: DS.textFaint }}>{ALL_COMPANIES_LIST.length} listed</span>
              </div>

              {/* Search + filter row — always visible */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {/* Search */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: DS.surface, border: `1.5px solid ${DS.borderMed}`, borderRadius: 8, padding: '6px 10px' }}>
                  <HiOutlineMagnifyingGlass size={13} color={DS.textFaint} />
                  <input value={search} onChange={e => { handleSearch(e.target.value); if (!showAll) setShowAll(true) }}
                    placeholder="Search companies…"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 12, color: DS.text, fontFamily: 'Inter, sans-serif' }} />
                  {search && <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', color: DS.textFaint, display: 'flex', padding: 0, cursor: 'pointer' }}><HiOutlineXMark size={13} /></button>}
                </div>

                {/* Sector filter */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowSectorMenu(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', background: sectorFilter !== 'All' ? DS.accentSoft : DS.surface, border: `1.5px solid ${sectorFilter !== 'All' ? DS.accentBorder : DS.borderMed}`, borderRadius: 8, fontSize: 11, color: sectorFilter !== 'All' ? DS.accent : DS.textSub, fontWeight: sectorFilter !== 'All' ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <HiOutlineFunnel size={12} />
                    {sectorFilter === 'All' ? 'Sector' : sectorFilter.split(' ')[0]}
                    <HiOutlineChevronDown size={10} />
                  </button>
                  {showSectorMenu && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50, background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)', width: 200, maxHeight: 260, overflowY: 'auto' }}>
                      {['All', ...UNIQUE_SECTORS].map(s => (
                        <button key={s} onClick={() => { handleSector(s); if (!showAll) setShowAll(true) }}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: s === sectorFilter ? DS.accentSoft : 'none', border: 'none', fontSize: 12, color: s === sectorFilter ? DS.accent : DS.text, fontWeight: s === sectorFilter ? 600 : 400, cursor: 'pointer' }}
                          onMouseEnter={e => { if (s !== sectorFilter) e.currentTarget.style.background = '#f1f5f9' }}
                          onMouseLeave={e => { if (s !== sectorFilter) e.currentTarget.style.background = 'none' }}>
                          {s === 'All' ? 'All Sectors' : s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nifty 500 toggle */}
                <button onClick={() => { setNiftyOnly(v => !v); if (!showAll) setShowAll(true); setPage(1) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: niftyOnly ? DS.amberSoft : DS.surface, border: `1.5px solid ${niftyOnly ? DS.amber : DS.borderMed}`, borderRadius: 8, fontSize: 11, color: niftyOnly ? DS.amber : DS.textSub, fontWeight: niftyOnly ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Nifty 500
                </button>
              </div>
            </div>

            {/* Company cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {(showAll ? pageData : ALL_COMPANIES_LIST.slice(0, 6)).map((co, i) => (
                <CompanyCard key={`${co.name}-${i}`} name={co.name} sector={co.sector} borderRight={i % 2 === 0} />
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfc', borderTop: `1px solid ${DS.border}` }}>
              {showAll
                ? <span style={{ fontSize: 11, color: DS.textFaint }}>
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} companies
                  </span>
                : <span style={{ fontSize: 11, color: DS.textFaint }}>Showing 6 of {ALL_COMPANIES_LIST.length} companies</span>
              }
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => onNavigate('chat')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', border: 'none', borderRadius: 7, padding: '6px 14px', boxShadow: '0 2px 8px rgba(37,99,235,0.28)', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}>
                  <BsRobot size={12} /> Analyze with AI
                </button>
                <button onClick={() => { setShowAll(v => !v); setSearch(''); setSectorFilter('All'); setNiftyOnly(false); setPage(1) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: DS.accent, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.11)'}
                  onMouseLeave={e => e.currentTarget.style.background = DS.accentSoft}>
                  {showAll ? '↑ Show less' : 'More'}
                </button>
              </div>
            </div>

            {/* Smart Pagination — only when expanded */}
            {showAll && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 16px', borderTop: `1px solid ${DS.border}`, background: '#fafbfc' }}>
                <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === 1 ? 0.35 : 1, color: DS.textMuted, cursor: safePage === 1 ? 'default' : 'pointer' }}>
                  <HiOutlineChevronLeft size={13} />
                </button>
                {pageNums.map((pg, i) =>
                  pg === '...'
                    ? <span key={`dots-${i}`} style={{ width: 30, textAlign: 'center', color: DS.textFaint, fontSize: 12 }}>…</span>
                    : <button key={pg} onClick={() => setPage(pg as number)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${pg === safePage ? DS.accentBorder : DS.border}`, background: pg === safePage ? DS.accentSoft : DS.surface, color: pg === safePage ? DS.accent : DS.textMuted, fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: pg === safePage ? 700 : 400, cursor: 'pointer' }}>{pg}</button>
                )}
                <button disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === totalPages ? 0.35 : 1, color: DS.textMuted, cursor: safePage === totalPages ? 'default' : 'pointer' }}>
                  <HiOutlineChevronRight size={13} />
                </button>
              </div>
            )}
          </WidgetCard>

          {/* ── RIGHT column ─────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Watchlist snapshot */}
            <WidgetCard>
              <WidgetHeader
                icon={<HiOutlineBookmark size={14} />}
                title={activeWatchlist?.name ?? 'Watchlist'}
                action={<NavLink label="Open" onClick={() => onNavigate('compare')} />}
              />
              {watchlistCompanies.length === 0 ? (
                <EmptyState icon={<HiOutlineBookmark size={22} />} text="No companies added yet. Open Watchlist to track companies." cta="Open Watchlist" onCta={() => onNavigate('compare')} />
              ) : (
                <div>
                  {watchlistCompanies.map((name, i) => (
                    <div key={name}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < watchlistCompanies.length - 1 ? `1px solid ${DS.border}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbff'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <Avatar name={name} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ fontSize: 10, color: DS.textMuted }}>{CO_SECTOR[name] ?? '—'}</div>
                      </div>
                      {watchlistMetrics[0] && (
                        <span style={{ fontSize: 9, color: DS.purple, background: DS.purpleSoft, border: `1px solid ${DS.purpleBorder}`, borderRadius: 5, padding: '2px 7px', flexShrink: 0, fontWeight: 500 }}>
                          {watchlistMetrics[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>

            {/* AI Insights */}
            <WidgetCard>
              <WidgetHeader
                icon={<HiOutlineSparkles size={14} style={{ color: DS.purple }} />}
                title="AI Insights"
                action={<NavLink label="Ask AI" onClick={() => onNavigate('chat')} />}
              />
              {recentChatMessages.length === 0 ? (
                <EmptyState icon={<HiOutlineChatBubbleLeftRight size={22} />} text="No queries yet. Start a conversation in AI Chat to see recent activity here." cta="Open AI Chat" onCta={() => onNavigate('chat')} />
              ) : (
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recentChatMessages.map((msg, i) => {
                    const IconComponents = [HiOutlineArrowTrendingUp, HiOutlineChatBubbleLeftRight, HiOutlineSparkles, HiOutlineExclamationTriangle, HiOutlineMagnifyingGlass]
                    const IconComp = IconComponents[i % IconComponents.length]
                    const isActive = activeInsight === i
                    return (
                      <div key={i} onClick={() => setActiveInsight(isActive ? null : i)}
                        style={{ padding: '10px 12px', borderRadius: 9, background: isActive ? DS.accentSoft : '#f8fafc', border: `1px solid ${isActive ? DS.accentBorder : DS.border}`, cursor: 'pointer', transition: 'all 0.12s' }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <IconComp size={13} color={isActive ? DS.accent : DS.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: 11, color: DS.textSub, lineHeight: 1.55, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg}</span>
                        </div>
                        {isActive && (
                          <button onClick={e => { e.stopPropagation(); onNavigate('chat') }}
                            style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#fff', background: DS.accent, border: 'none', borderRadius: 6, padding: '5px 11px', fontWeight: 600, cursor: 'pointer' }}>
                            <BsRobot size={11} /> Continue in AI Chat
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </WidgetCard>

            {/* Screener Activity */}
            <WidgetCard>
              <WidgetHeader
                icon={<HiOutlineAdjustmentsHorizontal size={14} style={{ color: DS.amber }} />}
                title="Screener Activity"
                action={<NavLink label="Run" onClick={() => onNavigate('screener')} />}
              />
              {recentScreenerRuns.length === 0 ? (
                <EmptyState icon={<HiOutlineClipboardDocumentList size={22} />} text="No screener runs yet. Run a query in Screener to see activity here." cta="Open Screener" onCta={() => onNavigate('screener')} />
              ) : (
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {recentScreenerRuns.map((s, i) => (
                    <button key={i} onClick={() => onNavigate('screener')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${DS.border}`, textAlign: 'left', width: '100%', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.borderColor = DS.accentBorder }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = DS.border }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: DS.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HiOutlineAdjustmentsHorizontal size={14} color={DS.amber} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.query}</div>
                        <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 2 }}>{s.count} companies · {s.runAt}</div>
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
