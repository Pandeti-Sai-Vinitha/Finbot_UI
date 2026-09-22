import { useState, useEffect, useRef, useMemo } from 'react'
import {
  HiOutlineArrowDownTray, HiOutlineSparkles, HiOutlineNewspaper,
  HiOutlineArrowPath, HiOutlinePlay, HiOutlineStop,
  HiOutlineArrowPathRoundedSquare, HiOutlinePause,
  HiOutlineUsers, HiOutlineBookmark, HiOutlineAdjustmentsHorizontal,
  HiOutlineCheckCircle, HiOutlinePencilSquare, HiOutlineXMark,
  HiOutlineCheck, HiOutlineChevronDown, HiOutlineChevronRight,
  HiOutlineCommandLine, HiOutlineUserGroup, HiOutlineChartBar,
  HiOutlineMagnifyingGlass, HiOutlineChevronLeft, HiOutlineArrowUpRight,
  HiOutlineFunnel,
} from 'react-icons/hi2'
import { BsRobot } from 'react-icons/bs'
import type { WatchlistItem, BotConfig } from '../App'
import {
  SECTORS, SECTOR_COMPANIES, ANNUAL_METRIC_GROUPS, FREQUENTLY_USED_METRICS, getAnnualData,
} from '../data/finData'
import { DEFAULT_BOT_CONFIG_ID } from '../App'

/* ─── Palette ────────────────────────────────────────────────────── */
const DS = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  border: 'rgba(15,23,42,0.07)',
  borderMed: 'rgba(15,23,42,0.1)',
  borderStrong: 'rgba(15,23,42,0.16)',
  text: '#0f172a',
  textSub: '#475569',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  accent: '#2563eb',
  accentSoft: 'rgba(37,99,235,0.06)',
  accentBorder: 'rgba(37,99,235,0.14)',
  accentHover: 'rgba(37,99,235,0.08)',
  green: '#16a34a', greenSoft: '#f0fdf4', greenBorder: '#bbf7d0',
  red: '#dc2626', redSoft: '#fef2f2', redBorder: '#fecaca',
  amber: '#d97706', amberSoft: 'rgba(217,119,6,0.08)', amberBorder: 'rgba(217,119,6,0.22)',
  purple: '#7c3aed', purpleSoft: 'rgba(124,58,237,0.07)', purpleBorder: 'rgba(124,58,237,0.18)',
  card: '#ffffff',
}

/* ─── Jobs / terminal data ───────────────────────────────────────── */
type JobState = 'idle' | 'running' | 'completed' | 'failed' | 'stopped'
interface Job { id: string; label: string; Icon: React.ElementType; state: JobState; progress: number; lastRun: string; color: string; bg: string; border: string }
const initJobs: Job[] = [
  { id: 'fetch',   label: 'Fetch Filings',  Icon: HiOutlineArrowDownTray, state: 'idle',      progress: 0,   lastRun: '2h ago', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'extract', label: 'Extract Metrics', Icon: HiOutlineSparkles,      state: 'completed', progress: 100, lastRun: '1h ago', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'news',    label: 'Collect News',    Icon: HiOutlineNewspaper,     state: 'idle',      progress: 0,   lastRun: '3h ago', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
]
const stateLabel:  Record<JobState, string> = { idle: 'Idle', running: 'Running', completed: 'Done', failed: 'Failed', stopped: 'Stopped' }
const stateColor:  Record<JobState, string> = { idle: '#94a3b8', running: '#2563eb', completed: '#16a34a', failed: '#dc2626', stopped: '#d97706' }
const stateBg:     Record<JobState, string> = { idle: '#f1f5f9', running: '#eff6ff', completed: '#f0fdf4', failed: '#fef2f2', stopped: '#fffbeb' }
const stateBorder: Record<JobState, string> = { idle: '#e2e8f0', running: '#bfdbfe', completed: '#bbf7d0', failed: '#fecaca', stopped: '#fde68a' }

type LogEntry = { t: string; msg: string; type: 'info' | 'success' | 'error' }
const logColor = { info: '#475569', success: '#16a34a', error: '#dc2626' }
const logBg    = { info: 'transparent', success: '#f0fdf4', error: '#fef2f2' }
const seedLogs: LogEntry[] = [
  { t: '11:30:00', msg: 'System initialized — FinBot backend v0.9.1', type: 'info' },
  { t: '11:30:02', msg: 'Connecting to NSE data gateway…', type: 'info' },
  { t: '11:30:05', msg: 'NSE connection established', type: 'success' },
  { t: '11:30:08', msg: 'Fetching Q3 FY2025 filings…', type: 'info' },
  { t: '11:30:22', msg: 'Extracting financial metrics from PDF', type: 'info' },
  { t: '11:30:40', msg: 'Metrics extraction completed ✓', type: 'success' },
  { t: '11:30:48', msg: 'Fetching NSE announcements — IT sector', type: 'info' },
  { t: '11:31:00', msg: 'News ingestion — 124 articles indexed', type: 'success' },
  { t: '11:31:30', msg: 'Scheduler: Next fetch cycle in 60 minutes', type: 'info' },
]

/* ─── Mock users ─────────────────────────────────────────────────── */
const MOCK_USERS = [
  { id: 1, name: 'Priya Sharma',  email: 'priya@finbot.in',   watchlists: ['Core Watchlist', 'Tech Watch'],                         screeners: ['IT Growth Screen', 'Banking Quality Filter'], lastActive: 'Today, 2:34 PM' },
  { id: 2, name: 'Arjun Mehta',   email: 'arjun@finbot.in',   watchlists: ['Core Watchlist'],                                        screeners: ['FMCG Dividend Play'],                          lastActive: 'Yesterday, 11:00 AM' },
  { id: 3, name: 'Sneha Patel',   email: 'sneha@finbot.in',   watchlists: ['Core Watchlist', 'Healthcare Watch', 'FMCG Watch'],      screeners: [],                                              lastActive: '2 days ago' },
  { id: 4, name: 'Rahul Gupta',   email: 'rahul@finbot.in',   watchlists: ['Core Watchlist', 'Banking Watch'],                       screeners: ['Large Cap Screen'],                            lastActive: '3 days ago' },
  { id: 5, name: 'Divya Nair',    email: 'divya@finbot.in',   watchlists: ['Core Watchlist'],                                        screeners: ['Momentum Screen', 'Value Pick'],               lastActive: 'Today, 9:10 AM' },
  { id: 6, name: 'Kiran Reddy',   email: 'kiran@finbot.in',   watchlists: ['Core Watchlist', 'IT Watch', 'Pharma Watch'],            screeners: [],                                              lastActive: 'Last week' },
]

const PAGE_SIZE = 5

/* ─── Shared small components ────────────────────────────────────── */
function SL({ label }: { label: string }) {
  return <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.08em', marginBottom: 7, marginTop: 16 }}>{label}</div>
}

function Chip({ label, sel, onClick }: { label: string; sel: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', padding: '5px 9px', borderRadius: 6, background: sel ? DS.accentSoft : '#fff', border: `1.5px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : '#475569', fontSize: 10, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <div style={{ width: 11, height: 11, borderRadius: 3, border: `1.5px solid ${sel ? DS.accent : 'rgba(100,116,139,0.3)'}`, background: sel ? DS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {sel && <HiOutlineCheck size={7} color="#fff" />}
      </div>
      {label}
    </button>
  )
}

function CtrlBtn({ onClick, icon, label, color, bg, border }: { onClick: () => void; icon: React.ReactNode; label: string; color: string; bg: string; border: string }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 4, background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '4px 10px', fontSize: 10, color, cursor: 'pointer', fontWeight: 500, transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >{icon}{label}</button>
  )
}

/* ─── Admin Dashboard helpers ────────────────────────────────────── */
const GRADIENTS_AD = [
  'linear-gradient(135deg,#2563eb,#1d4ed8)', 'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'linear-gradient(135deg,#059669,#047857)', 'linear-gradient(135deg,#d97706,#b45309)',
  'linear-gradient(135deg,#dc2626,#b91c1c)', 'linear-gradient(135deg,#0891b2,#0e7490)',
]
function hashG(name: string) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff; return h % GRADIENTS_AD.length }

/* Build full company list for "View all" — all sectors */
const ALL_CO_LIST: { name: string; sector: string }[] = (() => {
  const seen = new Set<string>()
  const out: { name: string; sector: string }[] = []
  SECTORS.forEach(sec => (SECTOR_COMPANIES[sec] ?? []).forEach(name => { if (!seen.has(name)) { seen.add(name); out.push({ name, sector: sec }) } }))
  return out
})()

const AD_PAGE = 12

function AdminAvatar({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), background: GRADIENTS_AD[hashG(name)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em' }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

/* Nifty 500 set for admin — first 100 companies */
const ADMIN_NIFTY_500 = new Set(ALL_CO_LIST.slice(0, 100).map(c => c.name))

function getAdminMetrics(name: string): { label: string; value: string; positive: boolean | null }[] {
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

function getAdminPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = []
  if (current <= 4) { pages.push(1, 2, 3, 4, 5, '...', total) }
  else if (current >= total - 3) { pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total) }
  else { pages.push(1, '...', current - 1, current, current + 1, '...', total) }
  return pages
}

export function AdminDashboard({ botConfigs }: { botConfigs: BotConfig[] }) {
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

  const UNIQUE_SECTORS_AD = Array.from(new Set(ALL_CO_LIST.map(c => c.sector)))

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ALL_CO_LIST.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.sector.toLowerCase().includes(q)) return false
      if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false
      if (niftyOnly && !ADMIN_NIFTY_500.has(c.name)) return false
      return true
    })
  }, [search, sectorFilter, niftyOnly])

  const totalPages = Math.max(1, Math.ceil(filtered.length / AD_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageData = filtered.slice((safePage - 1) * AD_PAGE, safePage * AD_PAGE)
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleSector = (v: string) => { setSectorFilter(v); setPage(1); setShowSectorMenu(false) }

  const featuredSix = filtered.slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: DS.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 24px', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DS.text }}>Dashboard</div>
            <div style={{ fontSize: 10, color: DS.textFaint }}>{greeting} · {dateStr}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: DS.green, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, borderRadius: 6, padding: '4px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> NSE Open
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px' }}>
        <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>

          {/* Section header + filters */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.border}`, background: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <HiOutlineChartBar size={15} color={DS.accent} />
              <span style={{ fontSize: 13, fontWeight: 700, color: DS.text, flex: 1 }}>Companies</span>
              <span style={{ fontSize: 10, color: DS.textFaint }}>{ALL_CO_LIST.length} listed</span>
            </div>
            {/* Search + filter row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1.5px solid ${DS.border}`, borderRadius: 8, padding: '7px 11px' }}>
                <HiOutlineMagnifyingGlass size={13} color={DS.textFaint} />
                <input value={search} onChange={e => { handleSearch(e.target.value); if (!showAll) setShowAll(true) }}
                  placeholder="Search companies or sectors…"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 12, color: DS.text, fontFamily: 'Inter, sans-serif' }} />
                {search && <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', color: DS.textFaint, display: 'flex', padding: 0, cursor: 'pointer' }}><HiOutlineXMark size={13} /></button>}
              </div>
              {/* Sector dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSectorMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', background: sectorFilter !== 'All' ? DS.accentSoft : '#fff', border: `1.5px solid ${sectorFilter !== 'All' ? DS.accentBorder : DS.border}`, borderRadius: 8, fontSize: 11, color: sectorFilter !== 'All' ? DS.accent : DS.textSub, fontWeight: sectorFilter !== 'All' ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <HiOutlineFunnel size={12} />
                  {sectorFilter === 'All' ? 'Sector' : sectorFilter.split(' ')[0]}
                  <HiOutlineChevronDown size={10} />
                </button>
                {showSectorMenu && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50, background: '#fff', border: `1px solid ${DS.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)', width: 200, maxHeight: 260, overflowY: 'auto' }}>
                    {['All', ...UNIQUE_SECTORS_AD].map(s => (
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
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', background: niftyOnly ? DS.amberSoft : '#fff', border: `1.5px solid ${niftyOnly ? DS.amber : DS.border}`, borderRadius: 8, fontSize: 11, color: niftyOnly ? DS.amber : DS.textSub, fontWeight: niftyOnly ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Nifty 500
              </button>
            </div>
          </div>

          {/* Company cards grid — same design as analyst Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {(showAll ? pageData : featuredSix).map((co, i) => {
              const metrics = getAdminMetrics(co.name)
              const isNifty = ADMIN_NIFTY_500.has(co.name)
              return (
                <div key={`${co.name}-${i}`}
                  style={{ padding: '12px 14px', borderRight: i % 2 === 0 ? `1px solid ${DS.border}` : 'none', borderBottom: `1px solid ${DS.border}`, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8faff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <AdminAvatar name={co.name} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{co.name}</span>
                        {isNifty && <span style={{ fontSize: 8, fontWeight: 700, color: DS.amber, background: DS.amberSoft, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>N500</span>}
                      </div>
                      <div style={{ fontSize: 10, color: DS.textSub }}>{co.sector}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {metrics.map(m => (
                      <div key={m.label} style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: `1px solid ${DS.border}`, fontSize: 10 }}>
                        <span style={{ background: '#f1f5f9', color: DS.textFaint, padding: '3px 6px', borderRight: `1px solid ${DS.border}` }}>{m.label}</span>
                        <span style={{ background: '#fff', color: m.positive === true ? DS.green : m.positive === false ? DS.red : DS.textSub, padding: '3px 7px', fontWeight: 600 }}>
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfc', borderTop: `1px solid ${DS.border}` }}>
            {showAll
              ? <span style={{ fontSize: 11, color: DS.textFaint }}>
                  {(safePage - 1) * AD_PAGE + 1}–{Math.min(safePage * AD_PAGE, filtered.length)} of {filtered.length} companies
                </span>
              : <span style={{ fontSize: 11, color: DS.textFaint }}>Showing 6 of {filtered.length} companies</span>
            }
            <button onClick={() => { setShowAll(v => !v); setPage(1) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: DS.accent, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = DS.accentHover}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = DS.accentSoft}>
              {showAll ? '↑ Show less' : 'More'}
            </button>
          </div>

          {/* Smart pagination — only when expanded */}
          {showAll && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 14px', borderTop: `1px solid ${DS.border}`, background: '#fafbfc' }}>
              <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${DS.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === 1 ? 0.35 : 1, color: DS.textSub, cursor: safePage === 1 ? 'default' : 'pointer' }}>
                <HiOutlineChevronLeft size={13} />
              </button>
              {getAdminPageNumbers(safePage, totalPages).map((pg, idx) =>
                pg === '...'
                  ? <span key={`dots-${idx}`} style={{ width: 30, textAlign: 'center', color: DS.textFaint, fontSize: 12 }}>…</span>
                  : <button key={pg} onClick={() => setPage(pg as number)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${pg === safePage ? DS.accentBorder : DS.border}`, background: pg === safePage ? DS.accentSoft : '#fff', color: pg === safePage ? DS.accent : DS.textSub, fontSize: 12, fontWeight: pg === safePage ? 700 : 400, cursor: 'pointer' }}>{pg}</button>
              )}
              <button disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${DS.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === totalPages ? 0.35 : 1, color: DS.textSub, cursor: safePage === totalPages ? 'default' : 'pointer' }}>
                <HiOutlineChevronLeft size={13} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Props ──────────────────────────────────────────────────────── */
interface Props {
  watchlists: WatchlistItem[]
  onUpdateWatchlist: (id: number, patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => void
  botConfigs: BotConfig[]
  onUpdateBotConfig: (id: number, patch: Partial<Omit<BotConfig, 'id' | 'createdAt'>>) => void
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function Admin({ watchlists, onUpdateWatchlist, botConfigs, onUpdateBotConfig }: Props) {
  const [activeTab, setActiveTab] = useState<'console' | 'users' | 'defaults'>('console')

  /* Console state */
  const [jobs, setJobs] = useState(initJobs)
  const [logs, setLogs] = useState<LogEntry[]>(seedLogs)
  const logsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const iv = setInterval(() => {
      setJobs(prev => prev.map(j => {
        if (j.state !== 'running') return j
        const np = Math.min(j.progress + Math.random() * 7, 100)
        return { ...j, progress: np, state: np >= 100 ? 'completed' : 'running' }
      }))
    }, 600)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: 'smooth' })
  }, [logs])

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev, { t, msg, type }])
  }
  const startJob = (id: string) => {
    const job = jobs.find(j => j.id === id)!
    setJobs(prev => prev.map(j => j.id === id ? { ...j, state: 'running', progress: 0 } : j))
    addLog(`Job started: ${job.label}`, 'info')
  }
  const stopJob = (id: string) => {
    const job = jobs.find(j => j.id === id)!
    setJobs(prev => prev.map(j => j.id === id ? { ...j, state: 'stopped' } : j))
    addLog(`Job stopped: ${job.label}`, 'error')
  }
  const restartJob = (id: string) => {
    const job = jobs.find(j => j.id === id)!
    setJobs(prev => prev.map(j => j.id === id ? { ...j, state: 'running', progress: 0 } : j))
    addLog(`Job restarted: ${job.label}`, 'info')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: DS.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 48 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiOutlineCommandLine size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: DS.text }}>Admin Console</div>
            <div style={{ fontSize: 10, color: DS.textFaint }}>Backend operations · User management</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: DS.green, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, borderRadius: 6, padding: '4px 10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s ease-in-out infinite' }} />
              System Online
            </div>
            {activeTab === 'console' && (
              <button onClick={() => { jobs.filter(j => j.state !== 'running').forEach(j => startJob(j.id)) }}
                style={{ background: DS.accent, border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 3px rgba(37,99,235,0.25)' }}>
                <HiOutlineArrowPath size={13} /> Run All
              </button>
            )}
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {([
            { id: 'console',  label: 'Operations Console', icon: HiOutlineCommandLine },
            { id: 'users',    label: 'Users & Data',        icon: HiOutlineUserGroup },
            { id: 'defaults', label: 'Default Config',      icon: HiOutlineBookmark },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? `2px solid ${DS.accent}` : '2px solid transparent', color: activeTab === tab.id ? DS.accent : DS.textSub, fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s' }}>
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Operations Console ── */}
      {activeTab === 'console' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'auto 1fr', overflow: 'hidden', padding: '16px 24px', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {jobs.map(job => {
              const st = job.state
              return (
                <div key={job.id} style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: job.bg, border: `1px solid ${job.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <job.Icon size={17} color={job.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: DS.text, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.label}</div>
                      <div style={{ fontSize: 9, color: DS.textFaint }}>Last: {job.lastRun}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: stateColor[st], background: stateBg[st], border: `1px solid ${stateBorder[st]}`, borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>
                      {stateLabel[st]}
                    </span>
                  </div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${job.progress}%`, borderRadius: 2, background: st === 'failed' ? '#ef4444' : st === 'completed' ? '#22c55e' : DS.accent, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {(st === 'idle' || st === 'stopped' || st === 'failed') && (
                      <CtrlBtn onClick={() => startJob(job.id)} icon={<HiOutlinePlay size={11} />} label="Start" color="#2563eb" bg="#eff6ff" border="#bfdbfe" />
                    )}
                    {st === 'running' && (
                      <>
                        <CtrlBtn onClick={() => stopJob(job.id)} icon={<HiOutlineStop size={11} />} label="Stop" color={DS.red} bg={DS.redSoft} border={DS.redBorder} />
                        <CtrlBtn onClick={() => {}} icon={<HiOutlinePause size={11} />} label="Pause" color="#d97706" bg="#fffbeb" border="#fde68a" />
                      </>
                    )}
                    {(st === 'completed' || st === 'failed' || st === 'stopped') && (
                      <CtrlBtn onClick={() => restartJob(job.id)} icon={<HiOutlineArrowPathRoundedSquare size={11} />} label="Restart" color="#059669" bg={DS.greenSoft} border={DS.greenBorder} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Live terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: DS.textSub }}>LIVE TERMINAL · finbot-backend</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 9, color: DS.green }}>auto-scroll</span>
              </div>
              <button onClick={() => setLogs([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: DS.textFaint, fontSize: 10, cursor: 'pointer' }}>Clear</button>
            </div>
            <div ref={logsRef} style={{ flex: 1, overflow: 'auto', padding: '10px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, lineHeight: 2 }}>
              {logs.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '1px 6px', borderRadius: 4, background: logBg[line.type] }}>
                  <span style={{ color: '#cbd5e1', flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>[{line.t}]</span>
                  <span style={{ color: logColor[line.type], fontFamily: 'DM Mono, monospace' }}>{line.msg}</span>
                </div>
              ))}
              <div style={{ color: '#cbd5e1', fontFamily: 'DM Mono, monospace' }}>▌</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Users & Data ── */}
      {activeTab === 'users' && <UsersDataTab />}

      {/* ── Default Config ── */}
      {activeTab === 'defaults' && (
        <DefaultConfigTab
          botConfigs={botConfigs}
          onUpdateBotConfig={onUpdateBotConfig}
        />
      )}

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}

/* ─── Users & Data tab ───────────────────────────────────────────── */
function UsersDataTab() {
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(MOCK_USERS.length / PAGE_SIZE)
  const pageUsers = MOCK_USERS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Analysts', value: MOCK_USERS.length, icon: <HiOutlineUsers size={16} color={DS.accent} />, bg: DS.accentSoft, border: DS.accentBorder, color: DS.accent },
          { label: 'Total Watchlists', value: MOCK_USERS.reduce((a, u) => a + u.watchlists.length, 0), icon: <HiOutlineBookmark size={16} color={DS.green} />, bg: DS.greenSoft, border: DS.greenBorder, color: DS.green },
          { label: 'Total Screeners', value: MOCK_USERS.reduce((a, u) => a + u.screeners.length, 0), icon: <HiOutlineAdjustmentsHorizontal size={16} color={DS.purple} />, bg: DS.purpleSoft, border: DS.purpleBorder, color: DS.purple },
        ].map(stat => (
          <div key={stat.label} style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, border: `1px solid ${stat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: DS.textFaint }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analyst accounts */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.08em' }}>ANALYST ACCOUNTS</div>
          {totalPages > 1 && (
            <div style={{ fontSize: 10, color: DS.textFaint }}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, MOCK_USERS.length)} of {MOCK_USERS.length}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pageUsers.map(u => {
            const expanded = expandedUser === u.id
            return (
              <div key={u.id} style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}>
                <button onClick={() => setExpandedUser(expanded ? null : u.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {u.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DS.text }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: DS.textFaint }}>{u.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, color: DS.green, fontWeight: 600 }}>ANALYST</span>
                    <span style={{ fontSize: 10, color: DS.textFaint }}>{u.lastActive}</span>
                    {expanded ? <HiOutlineChevronDown size={14} color={DS.textFaint} /> : <HiOutlineChevronRight size={14} color={DS.textFaint} />}
                  </div>
                </button>
                {expanded && (
                  <div style={{ borderTop: `1px solid ${DS.border}`, padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <HiOutlineBookmark size={10} /> WATCHLISTS ({u.watchlists.length})
                      </div>
                      {u.watchlists.length === 0
                        ? <div style={{ fontSize: 11, color: DS.textFaint, fontStyle: 'italic' }}>No watchlists yet</div>
                        : u.watchlists.map(wl => (
                          <div key={wl} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 6, marginBottom: 5 }}>
                            <HiOutlineCheckCircle size={12} color={DS.accent} />
                            <span style={{ fontSize: 12, color: DS.accent, fontWeight: 500 }}>{wl}</span>
                            {wl === 'Core Watchlist' && <span style={{ marginLeft: 'auto', fontSize: 8, color: DS.textFaint }}>DEFAULT</span>}
                          </div>
                        ))
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <HiOutlineAdjustmentsHorizontal size={10} /> SCREENERS ({u.screeners.length})
                      </div>
                      {u.screeners.length === 0
                        ? <div style={{ fontSize: 11, color: DS.textFaint, fontStyle: 'italic' }}>No saved screeners</div>
                        : u.screeners.map(sc => (
                          <div key={sc} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: DS.purpleSoft, border: `1px solid ${DS.purpleBorder}`, borderRadius: 6, marginBottom: 5 }}>
                            <HiOutlineAdjustmentsHorizontal size={12} color={DS.purple} />
                            <span style={{ fontSize: 12, color: DS.purple, fontWeight: 500 }}>{sc}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Paginator */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: `1px solid ${DS.border}`, background: page === 0 ? '#f8faff' : DS.surface, color: page === 0 ? DS.textFaint : DS.textSub, fontSize: 11, fontWeight: 500, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
              <HiOutlineChevronLeft size={12} /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${i === page ? DS.accentBorder : DS.border}`, background: i === page ? DS.accentSoft : DS.surface, color: i === page ? DS.accent : DS.textSub, fontSize: 12, fontWeight: i === page ? 700 : 400, cursor: 'pointer' }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: `1px solid ${DS.border}`, background: page >= totalPages - 1 ? '#f8faff' : DS.surface, color: page >= totalPages - 1 ? DS.textFaint : DS.textSub, fontSize: 11, fontWeight: 500, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
              Next <HiOutlineChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

/* ─── Default Config tab ─────────────────────────────────────────── */
function DefaultConfigTab({ botConfigs, onUpdateBotConfig }: {
  botConfigs: BotConfig[]
  onUpdateBotConfig: (id: number, patch: Partial<Omit<BotConfig, 'id' | 'createdAt'>>) => void
}) {
  const defaultCfg = botConfigs.find(c => c.id === DEFAULT_BOT_CONFIG_ID)
  const [editing, setEditing] = useState(false)

  if (!defaultCfg) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 12, color: DS.textFaint, fontStyle: 'italic' }}>Default config not found.</div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HiOutlineAdjustmentsHorizontal size={18} color={DS.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.text, marginBottom: 3 }}>Default AI Personalization</div>
          <div style={{ fontSize: 12, color: DS.textSub, lineHeight: 1.6 }}>
            Configure the default FinBot personalization for all analyst logins. Changes reflect immediately across every analyst's default config.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: DS.accent, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 8, padding: '5px 12px' }}>
            <HiOutlineUsers size={12} /> {MOCK_USERS.length} analysts
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: DS.accent, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(37,99,235,0.25)' }}>
              <HiOutlinePencilSquare size={13} /> Edit
            </button>
          )}
          {editing && (
            <button onClick={() => setEditing(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: DS.surface, border: `1px solid ${DS.borderMed}`, color: DS.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <HiOutlineXMark size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <DefaultBotConfigEditor
          config={defaultCfg}
          onSave={patch => { onUpdateBotConfig(DEFAULT_BOT_CONFIG_ID, patch); setEditing(false) }}
        />
      ) : (
        <DefaultConfigReadOnly config={defaultCfg} />
      )}
    </div>
  )
}

/* ─── Read-only view of the default config ──────────────────────── */
function DefaultConfigReadOnly({ config }: { config: BotConfig }) {
  const sectors = inferSectors(config.companies)
  const styleColors: Record<string, { bg: string; color: string; border: string }> = {
    concise:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    detailed:   { bg: DS.accentSoft, color: DS.accent, border: DS.accentBorder },
    analytical: { bg: DS.purpleSoft, color: DS.purple, border: DS.purpleBorder },
  }
  const sc = styleColors[config.responseStyle] ?? styleColors.analytical
  const companiesBySector: Record<string, string[]> = {}
  sectors.forEach(sec => {
    companiesBySector[sec] = (SECTOR_COMPANIES[sec] ?? []).filter(co => config.companies.includes(co))
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sectors + Response Style row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14 }}>
        <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.08em', marginBottom: 10 }}>SECTORS ({sectors.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sectors.map(s => (
              <span key={s} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, fontWeight: 600 }}>{s}</span>
            ))}
            {sectors.length === 0 && <span style={{ fontSize: 11, color: DS.textFaint, fontStyle: 'italic' }}>No sectors configured</span>}
          </div>
        </div>
        <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.08em' }}>RESPONSE STYLE</div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 6, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, textTransform: 'capitalize', textAlign: 'center' }}>
            {config.responseStyle}
          </span>
        </div>
      </div>

      {/* Companies by sector */}
      <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DS.border}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiOutlineUsers size={13} color={DS.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: DS.text, flex: 1 }}>Companies ({config.companies.length})</span>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(companiesBySector).map(([sec, cos]) => (
            <div key={sec}>
              <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 6 }}>{sec}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {cos.map(co => (
                  <span key={co} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, fontWeight: 500 }}>{co}</span>
                ))}
              </div>
            </div>
          ))}
          {config.companies.length === 0 && <div style={{ fontSize: 12, color: DS.textFaint, fontStyle: 'italic' }}>No companies configured</div>}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DS.border}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiOutlineAdjustmentsHorizontal size={13} color={DS.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: DS.text }}>Metrics ({config.metrics.length})</span>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {config.metrics.map(m => (
            <span key={m} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#f1f5f9', border: `1px solid ${DS.border}`, color: DS.textSub, fontWeight: 500 }}>{m}</span>
          ))}
          {config.metrics.length === 0 && <span style={{ fontSize: 12, color: DS.textFaint, fontStyle: 'italic' }}>No metrics configured</span>}
        </div>
      </div>
    </div>
  )
}

/* ─── Helper: infer sectors from a companies list ─────────────────── */
function inferSectors(companies: string[]): string[] {
  return Object.entries(SECTOR_COMPANIES)
    .filter(([, members]) => members.some(c => companies.includes(c)))
    .map(([sec]) => sec)
}

/* ─── Default BotConfig editor ───────────────────────────────────── */
function DefaultBotConfigEditor({ config, onSave }: {
  config: BotConfig
  onSave: (patch: Partial<Omit<BotConfig, 'id' | 'createdAt'>>) => void
}) {
  const initSectors = inferSectors(config.companies)
  const [sectors, setSectors] = useState<string[]>(initSectors)
  const [sectorTab, setSectorTab] = useState<string>(initSectors[0] ?? '')
  const [editCompanies, setEditCompanies] = useState<string[]>([...config.companies])
  const [editMetrics, setEditMetrics] = useState<string[]>([...config.metrics])
  const [metricSearch, setMetricSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))
  const [responseStyle, setResponseStyle] = useState(config.responseStyle)
  const [saved, setSaved] = useState(false)

  const toggleSector = (s: string) => {
    setSectors(prev => {
      const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
      const cos = Array.from(new Set(next.flatMap(sec => SECTOR_COMPANIES[sec] ?? [])))
      setEditCompanies(cos)
      if (!next.includes(sectorTab)) setSectorTab(next[0] ?? '')
      return next
    })
  }

  const toggleCompany = (co: string) => setEditCompanies(prev => prev.includes(co) ? prev.filter(c => c !== co) : [...prev, co])
  const toggleMetric = (m: string) => setEditMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  const toggleGroup = (g: string) => setExpandedGroups(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n })
  const fmtMetrics = (list: string[]) => metricSearch ? list.filter(m => m.toLowerCase().includes(metricSearch.toLowerCase())) : list

  const activeSec = sectors.includes(sectorTab) ? sectorTab : sectors[0] ?? ''
  const secCos = SECTOR_COMPANIES[activeSec] ?? []
  const allSectorCos = Array.from(new Set(sectors.flatMap(s => SECTOR_COMPANIES[s] ?? [])))

  const save = () => {
    onSave({ sectors, companies: editCompanies, metrics: editMetrics, responseStyle })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 220px)' }}>
      {/* Card header — fixed */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb22, #7c3aed22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiOutlineAdjustmentsHorizontal size={14} color={DS.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DS.text }}>{config.name}</div>
          <div style={{ fontSize: 10, color: DS.textFaint }}>
            {editCompanies.length} companies · {editMetrics.length} metrics · {responseStyle}
          </div>
        </div>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: DS.green, fontWeight: 600 }}>
            <HiOutlineCheck size={13} /> Saved — applied to all analysts
          </div>
        )}
      </div>

      {/* Scrollable form body */}
      <div style={{ padding: '16px 18px 20px', overflowY: 'auto', flex: 1 }}>
        {/* SECTORS */}
        <SL label="SECTORS" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 10, color: DS.textFaint }}>{sectors.length > 0 ? `${sectors.length} selected` : 'None selected'}</span>
          <button onClick={() => {
            const next = SECTORS.every(s => sectors.includes(s)) ? [] : [...SECTORS]
            setSectors(next)
            setEditCompanies(Array.from(new Set(next.flatMap(s => SECTOR_COMPANIES[s] ?? []))))
            setSectorTab(next[0] ?? '')
          }} style={{ fontSize: 9, padding: '2px 9px', borderRadius: 5, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
            {SECTORS.every(s => sectors.includes(s)) ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 4 }}>
          {SECTORS.map(s => <Chip key={s} label={s} sel={sectors.includes(s)} onClick={() => toggleSector(s)} />)}
        </div>

        {/* COMPANIES */}
        <SL label="COMPANIES" />
        {sectors.length === 0 ? (
          <div style={{ fontSize: 11, color: DS.textFaint, fontStyle: 'italic', marginBottom: 10 }}>Select sectors above to see companies</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: DS.textFaint }}>{editCompanies.length} of {allSectorCos.length} selected</span>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => setEditCompanies(allSectorCos)} style={{ fontSize: 9, padding: '2px 9px', borderRadius: 5, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>All</button>
                <button onClick={() => setEditCompanies([])} style={{ fontSize: 9, padding: '2px 9px', borderRadius: 5, border: `1px solid ${DS.border}`, background: '#fff', color: DS.textSub, cursor: 'pointer', fontWeight: 600 }}>None</button>
              </div>
            </div>
            <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${DS.border}`, gap: 0 }}>
              {sectors.map(sec => {
                const isSel = sec === activeSec
                const cnt = (SECTOR_COMPANIES[sec] ?? []).filter(co => editCompanies.includes(co)).length
                return (
                  <button key={sec} onClick={() => setSectorTab(sec)}
                    style={{ padding: '7px 11px', background: 'none', border: 'none', borderBottom: isSel ? `2px solid ${DS.accent}` : '2px solid transparent', color: isSel ? DS.accent : DS.textSub, fontSize: 10, fontWeight: isSel ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {sec}
                    <span style={{ fontSize: 8, background: isSel ? DS.accentBorder : '#e2e8f0', color: isSel ? DS.accent : DS.textFaint, borderRadius: 10, padding: '0 5px', lineHeight: '14px' }}>{cnt}/{SECTOR_COMPANIES[sec]?.length ?? 0}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ border: `1px solid ${DS.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', marginBottom: 2 }}>
              {secCos.map(co => {
                const sel = editCompanies.includes(co)
                return (
                  <label key={co} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${DS.border}`, cursor: 'pointer', background: sel ? DS.accentSoft : '#fff' }}>
                    <input type="checkbox" checked={sel} onChange={() => toggleCompany(co)} style={{ accentColor: DS.accent, width: 13, height: 13, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: sel ? DS.accent : DS.text, fontWeight: sel ? 600 : 400 }}>{co}</span>
                  </label>
                )
              })}
            </div>
          </>
        )}

        {/* METRICS */}
        <SL label="METRICS" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {FREQUENTLY_USED_METRICS.map(m => {
            const sel = editMetrics.includes(m)
            return <button key={m} onClick={() => toggleMetric(m)} style={{ padding: '4px 9px', borderRadius: 12, fontSize: 10, background: sel ? DS.accent : DS.accentSoft, border: `1px solid ${sel ? DS.accent : DS.accentBorder}`, color: sel ? '#fff' : DS.accent, fontWeight: 600, cursor: 'pointer' }}>{m}</button>
          })}
        </div>
        <input value={metricSearch} onChange={e => setMetricSearch(e.target.value)} placeholder="Search metrics…"
          style={{ width: '100%', padding: '6px 10px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 11, color: DS.text, background: '#f8fafc', outline: 'none', boxSizing: 'border-box', marginBottom: 7 }}
          onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder} onBlur={e => e.currentTarget.style.borderColor = DS.border} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {Object.entries(ANNUAL_METRIC_GROUPS).map(([grp, mlist]) => {
            const vis = fmtMetrics(mlist); if (!vis.length) return null
            const expanded = expandedGroups.has(grp)
            const allSel = vis.every(m => editMetrics.includes(m))
            return (
              <div key={grp} style={{ border: `1px solid ${DS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', cursor: 'pointer', gap: 7 }} onClick={() => toggleGroup(grp)}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: DS.text, flex: 1 }}>{grp}</span>
                  <button onClick={e => { e.stopPropagation(); setEditMetrics(prev => allSel ? prev.filter(m => !vis.includes(m)) : Array.from(new Set([...prev, ...vis]))) }}
                    style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DS.accentBorder}`, background: 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                    {allSel ? 'Deselect' : 'All'}
                  </button>
                  {expanded ? <HiOutlineChevronDown size={10} color={DS.textFaint} /> : <HiOutlineChevronRight size={10} color={DS.textFaint} />}
                </div>
                {expanded && (
                  <div style={{ padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {vis.map(m => {
                      const sel = editMetrics.includes(m)
                      return <button key={m} onClick={() => toggleMetric(m)} style={{ padding: '3px 8px', borderRadius: 12, fontSize: 10, background: sel ? DS.accentSoft : '#fff', border: `1.5px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : '#475569', fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>{sel && <HiOutlineCheck size={7} />}{m}</button>
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {editMetrics.length > 0 && <div style={{ fontSize: 10, color: DS.accent, marginBottom: 10 }}>{editMetrics.length} metrics selected</div>}

        {/* RESPONSE STYLE */}
        <SL label="RESPONSE STYLE" />
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['concise', 'detailed', 'analytical'] as const).map(st => (
            <button key={st} onClick={() => setResponseStyle(st)}
              style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1.5px solid ${responseStyle === st ? DS.accentBorder : DS.border}`, background: responseStyle === st ? DS.accentSoft : 'transparent', color: responseStyle === st ? DS.accent : DS.textSub, fontSize: 11, fontWeight: responseStyle === st ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>{st}</button>
          ))}
        </div>

        <button onClick={save}
          style={{ width: '100%', padding: '11px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <HiOutlineArrowPath size={14} /> Save Changes — Apply to All Analyst Logins
        </button>
      </div>
    </div>
  )
}

/* ─── Default Watchlist editor ───────────────────────────────────── */
function DefaultWatchlistEditor({ watchlist, onSave, alwaysExpanded = false }: {
  watchlist: WatchlistItem
  onSave: (patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => void
  alwaysExpanded?: boolean
}) {
  const initSectors = inferSectors(watchlist.companies)
  const [editing, setEditing] = useState(alwaysExpanded)
  const [sectors, setSectors] = useState<string[]>(alwaysExpanded ? initSectors : [])
  const [sectorTab, setSectorTab] = useState<string>(alwaysExpanded ? (initSectors[0] ?? '') : '')
  const [editCompanies, setEditCompanies] = useState<string[]>(alwaysExpanded ? [...watchlist.companies] : [])
  const [editMetrics, setEditMetrics] = useState<string[]>(alwaysExpanded ? [...watchlist.metrics] : [])
  const [metricSearch, setMetricSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))
  const [saved, setSaved] = useState(false)

  const startEditing = () => {
    const inferredSectors = inferSectors(watchlist.companies)
    setSectors(inferredSectors)
    setSectorTab(inferredSectors[0] ?? '')
    setEditCompanies([...watchlist.companies])
    setEditMetrics([...watchlist.metrics])
    setMetricSearch('')
    setExpandedGroups(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))
    setEditing(true)
  }

  const cancelEditing = () => {
    if (!alwaysExpanded) setEditing(false)
  }

  const toggleSector = (s: string) => {
    setSectors(prev => {
      const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
      const cos = Array.from(new Set(next.flatMap(sec => SECTOR_COMPANIES[sec] ?? [])))
      setEditCompanies(cos)
      if (!next.includes(sectorTab)) setSectorTab(next[0] ?? '')
      return next
    })
  }

  const toggleCompany = (co: string) => {
    setEditCompanies(prev => prev.includes(co) ? prev.filter(c => c !== co) : [...prev, co])
  }

  const toggleMetric = (m: string) => {
    setEditMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  const toggleGroup = (g: string) => {
    setExpandedGroups(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n })
  }

  const save = () => {
    onSave({ companies: editCompanies, metrics: editMetrics })
    if (!alwaysExpanded) setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const fmtMetrics = (list: string[]) =>
    metricSearch ? list.filter(m => m.toLowerCase().includes(metricSearch.toLowerCase())) : list

  const activeSec = sectors.includes(sectorTab) ? sectorTab : sectors[0] ?? ''
  const secCos = SECTOR_COMPANIES[activeSec] ?? []
  const allSectorCos = Array.from(new Set(sectors.flatMap(s => SECTOR_COMPANIES[s] ?? [])))

  return (
    <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}>
      {/* Card header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiOutlineBookmark size={14} color={DS.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DS.text }}>Default Watchlist</div>
          <div style={{ fontSize: 10, color: DS.textFaint }}>
            {watchlist.name} · {watchlist.companies.length} companies · {watchlist.metrics.length} metrics
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: DS.green, fontWeight: 600 }}>
              <HiOutlineCheck size={13} /> Saved — applied to all analysts
            </div>
          )}
          {!alwaysExpanded && (
            <button onClick={() => editing ? cancelEditing() : startEditing()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${editing ? DS.border : DS.accentBorder}`, background: editing ? '#fff' : DS.accentSoft, color: editing ? DS.textSub : DS.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {editing ? <HiOutlineXMark size={12} /> : <HiOutlinePencilSquare size={12} />}
              {editing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Read-only view */}
      {!editing && (
        <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8 }}>COMPANIES ({watchlist.companies.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {watchlist.companies.map(co => (
                <span key={co} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, fontWeight: 500 }}>{co}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8 }}>METRICS ({watchlist.metrics.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {watchlist.metrics.map(m => (
                <span key={m} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#f1f5f9', border: `1px solid ${DS.border}`, color: DS.textSub }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit form — personalization style */}
      {editing && (
        <div style={{ padding: '16px 18px 20px' }}>

          {/* SECTORS */}
          <SL label="SECTORS" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <span style={{ fontSize: 10, color: DS.textFaint }}>{sectors.length > 0 ? `${sectors.length} selected` : 'None selected'}</span>
            <button onClick={() => {
              const next = SECTORS.every(s => sectors.includes(s)) ? [] : [...SECTORS]
              setSectors(next)
              const cos = Array.from(new Set(next.flatMap(s => SECTOR_COMPANIES[s] ?? [])))
              setEditCompanies(cos)
              setSectorTab(next[0] ?? '')
            }}
              style={{ fontSize: 9, padding: '2px 9px', borderRadius: 5, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
              {SECTORS.every(s => sectors.includes(s)) ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 4 }}>
            {SECTORS.map(s => <Chip key={s} label={s} sel={sectors.includes(s)} onClick={() => toggleSector(s)} />)}
          </div>

          {/* COMPANIES — sector tabs */}
          <SL label="COMPANIES" />
          {sectors.length === 0 ? (
            <div style={{ fontSize: 11, color: DS.textFaint, fontStyle: 'italic', marginBottom: 10 }}>Select sectors above to see companies</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: DS.textFaint }}>{editCompanies.length} of {allSectorCos.length} selected</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => setEditCompanies(allSectorCos)}
                    style={{ fontSize: 9, padding: '2px 9px', borderRadius: 5, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>All</button>
                  <button onClick={() => setEditCompanies([])}
                    style={{ fontSize: 9, padding: '2px 9px', borderRadius: 5, border: `1px solid ${DS.border}`, background: '#fff', color: DS.textSub, cursor: 'pointer', fontWeight: 600 }}>None</button>
                </div>
              </div>
              {/* Sector tab strip */}
              <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${DS.border}`, gap: 0 }}>
                {sectors.map(sec => {
                  const isSel = sec === activeSec
                  const cnt = (SECTOR_COMPANIES[sec] ?? []).filter(co => editCompanies.includes(co)).length
                  return (
                    <button key={sec} onClick={() => setSectorTab(sec)}
                      style={{ padding: '7px 11px', background: 'none', border: 'none', borderBottom: isSel ? `2px solid ${DS.accent}` : '2px solid transparent', color: isSel ? DS.accent : DS.textSub, fontSize: 10, fontWeight: isSel ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {sec}
                      <span style={{ fontSize: 8, background: isSel ? DS.accentBorder : '#e2e8f0', color: isSel ? DS.accent : DS.textFaint, borderRadius: 10, padding: '0 5px', lineHeight: '14px' }}>{cnt}/{SECTOR_COMPANIES[sec]?.length ?? 0}</span>
                    </button>
                  )
                })}
              </div>
              {/* Companies list for active sector */}
              <div style={{ maxHeight: 160, overflowY: 'auto', border: `1px solid ${DS.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', marginBottom: 2 }}>
                {secCos.map(co => {
                  const sel = editCompanies.includes(co)
                  return (
                    <label key={co} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${DS.border}`, cursor: 'pointer', background: sel ? DS.accentSoft : '#fff' }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleCompany(co)}
                        style={{ accentColor: DS.accent, width: 13, height: 13, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: sel ? DS.accent : DS.text, fontWeight: sel ? 600 : 400 }}>{co}</span>
                    </label>
                  )
                })}
              </div>
            </>
          )}

          {/* METRICS */}
          <SL label="METRICS" />
          {/* Frequently used quick-pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {FREQUENTLY_USED_METRICS.map(m => {
              const sel = editMetrics.includes(m)
              return (
                <button key={m} onClick={() => toggleMetric(m)}
                  style={{ padding: '4px 9px', borderRadius: 12, fontSize: 10, background: sel ? DS.accent : DS.accentSoft, border: `1px solid ${sel ? DS.accent : DS.accentBorder}`, color: sel ? '#fff' : DS.accent, fontWeight: 600, cursor: 'pointer' }}>
                  {m}
                </button>
              )
            })}
          </div>
          {/* Search */}
          <input value={metricSearch} onChange={e => setMetricSearch(e.target.value)} placeholder="Search metrics…"
            style={{ width: '100%', padding: '6px 10px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 11, color: DS.text, background: '#f8fafc', outline: 'none', boxSizing: 'border-box', marginBottom: 7 }}
            onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
            onBlur={e => e.currentTarget.style.borderColor = DS.border} />
          {/* Accordion groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(ANNUAL_METRIC_GROUPS).map(([grp, mlist]) => {
              const vis = fmtMetrics(mlist); if (!vis.length) return null
              const expanded = expandedGroups.has(grp)
              const allSel = vis.every(m => editMetrics.includes(m))
              return (
                <div key={grp} style={{ border: `1px solid ${DS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', cursor: 'pointer', gap: 7 }} onClick={() => toggleGroup(grp)}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: DS.text, flex: 1 }}>{grp}</span>
                    <button onClick={e => { e.stopPropagation(); setEditMetrics(prev => allSel ? prev.filter(m => !vis.includes(m)) : Array.from(new Set([...prev, ...vis]))) }}
                      style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DS.accentBorder}`, background: 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                      {allSel ? 'Deselect' : 'All'}
                    </button>
                    {expanded ? <HiOutlineChevronDown size={10} color={DS.textFaint} /> : <HiOutlineChevronRight size={10} color={DS.textFaint} />}
                  </div>
                  {expanded && (
                    <div style={{ padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {vis.map(m => {
                        const sel = editMetrics.includes(m)
                        return (
                          <button key={m} onClick={() => toggleMetric(m)}
                            style={{ padding: '3px 8px', borderRadius: 12, fontSize: 10, background: sel ? DS.accentSoft : '#fff', border: `1.5px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : '#475569', fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {sel && <HiOutlineCheck size={7} />}{m}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {editMetrics.length > 0 && (
            <div style={{ marginTop: 5, fontSize: 10, color: DS.accent }}>{editMetrics.length} metrics selected</div>
          )}

          {/* Save button */}
          <button onClick={save}
            style={{ marginTop: 16, width: '100%', padding: '11px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <HiOutlineArrowPath size={14} /> Save Changes — Apply to All Analyst Logins
          </button>
        </div>
      )}
    </div>
  )
}
