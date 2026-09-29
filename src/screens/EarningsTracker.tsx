import { useEffect, useMemo, useRef, useState } from 'react'
import {
  HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineChevronRight,
  HiOutlineXMark, HiOutlineTrophy, HiOutlineChevronLeft,
} from 'react-icons/hi2'
import { SECTOR_COMPANIES, getAnnualData, getQuarterlyData } from '../data/finData'

const YEARS = ['FY27', 'FY26', 'FY25', 'FY24', 'FY23']
const QUARTERS = [
  { id: 'Q4', period: 'Jan–Mar' },
  { id: 'Q3', period: 'Oct–Dec' },
  { id: 'Q2', period: 'Jul–Sep' },
  { id: 'Q1', period: 'Apr–Jun' },
] as const
const SECTORS = Object.keys(SECTOR_COMPANIES)
const ALL_COMPANIES = Array.from(new Set(Object.values(SECTOR_COMPANIES).flat()))
const COMPANY_SECTOR = new Map<string, string>()
Object.entries(SECTOR_COMPANIES).forEach(([sector, companies]) => companies.forEach(company => {
  if (!COMPANY_SECTOR.has(company)) COMPANY_SECTOR.set(company, sector)
}))

const C = {
  bg: '#f4f6f9', surface: '#fff', soft: '#f7f8fa', border: '#e2e6eb',
  text: '#17212f', sub: '#64748b', muted: '#94a3b8', blue: '#3b82f6',
  blueSoft: '#eff6ff', green: '#16a34a', red: '#ef4444', redSoft: '#fef2f2',
}

type QuarterId = typeof QUARTERS[number]['id']
type GrowthRow = { name: string; sector: string; sales: number | null; pat: number | null; salesGrowth: number | null; patGrowth: number | null }

function sourceFiscalYear(fiscalYear: string): string {
  const fySuffix = Number(fiscalYear.slice(2))
  return String(2025 - (27 - fySuffix))
}

function quarterValues(company: string, fiscalYear: string, quarter: QuarterId) {
  const seed = [...company, ...quarter, ...fiscalYear].reduce((value, character) => value * 31 + character.charCodeAt(0), 7) >>> 0
  if (seed % 11 === 0) return { sales: null, pat: null, salesGrowth: null, patGrowth: null }

  const sourceYear = sourceFiscalYear(fiscalYear)
  const sourceSuffix = sourceYear.slice(2)
  const data = getQuarterlyData(company)
  const current = data[`${quarter} FY${sourceSuffix}`] ?? {}
  const priorYear = String(Number(sourceYear) - 1).slice(2)
  const prior = data[`${quarter} FY${priorYear}`]
  const sales = Number(current.Sales ?? 0)
  const pat = Number(current['Net Profit'] ?? 0)
  const previousSales = Number(prior?.Sales ?? sales / 1.08)
  const previousPat = Number(prior?.['Net Profit'] ?? pat / 1.08)
  const salesGrowth = previousSales === 0 ? 0 : ((sales - previousSales) / Math.abs(previousSales)) * 100
  const patGrowth = previousPat === 0 ? 0 : ((pat - previousPat) / Math.abs(previousPat)) * 100
  const salesShift = ((seed % 37) - 18)
  const patShift = (((seed >>> 5) % 43) - 21)
  return {
    sales,
    pat,
    salesGrowth: salesGrowth + salesShift,
    patGrowth: patGrowth + patShift,
  }
}

function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatAmount(value: number | null): string {
  if (value === null) return '—'
  if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L Cr`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K Cr`
  return `${value.toFixed(0)} Cr`
}

function SurfaceButton({ children, onClick, active = false }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: active ? C.blueSoft : C.surface, border: `1px solid ${active ? '#bfdbfe' : C.border}`, borderRadius: 7, color: C.text, cursor: 'pointer' }}>{children}</button>
}

export default function EarningsTracker({ onSelectCompany }: { onSelectCompany: (company: string) => void }) {
  const [fiscalYear, setFiscalYear] = useState<string | null>(null)
  const [quarter, setQuarter] = useState<QuarterId | null>(null)
  const [index, setIndex] = useState('All Companies')
  const [activeView, setActiveView] = useState<'sectors' | 'leaderboard'>('sectors')
  const [leaderboardMetric, setLeaderboardMetric] = useState<'salesGrowth' | 'patGrowth'>('salesGrowth')
  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [sectorPage, setSectorPage] = useState(1)
  const [leaderboardPage, setLeaderboardPage] = useState(1)
  const sectorPageSize = 6
  const [leaderboardPageSize, setLeaderboardPageSize] = useState(1)
  const leaderboardViewportRef = useRef<HTMLDivElement>(null)
  const isLeaderboardFullPage = Boolean(quarter) && activeView === 'leaderboard'

  const indexCompanies = useMemo(() => {
    const ranked = [...ALL_COMPANIES].sort((a, b) => {
      const assetsA = Number(getAnnualData(a)['2025']?.['Total Assets'] ?? 0)
      const assetsB = Number(getAnnualData(b)['2025']?.['Total Assets'] ?? 0)
      return assetsB - assetsA
    })
    if (index === 'Nifty 50') return new Set(ranked.slice(0, 50))
    return new Set(ALL_COMPANIES)
  }, [index])

  const companyRows = useMemo<GrowthRow[]>(() => {
    if (!fiscalYear || !quarter) return []
    return ALL_COMPANIES.filter(company => indexCompanies.has(company)).map(name => ({
      name,
      sector: COMPANY_SECTOR.get(name) ?? 'Other',
      ...quarterValues(name, fiscalYear, quarter),
    }))
  }, [fiscalYear, quarter, indexCompanies])

  const quarterSummaries = useMemo(() => QUARTERS.map(item => {
    const rows = ALL_COMPANIES.filter(company => indexCompanies.has(company)).map(name => quarterValues(name, fiscalYear ?? YEARS[0], item.id))
    const coveredRows = rows.filter(row => row.salesGrowth !== null && row.patGrowth !== null)
    return {
      ...item,
      declared: coveredRows.length,
      salesGrowth: coveredRows.length ? coveredRows.reduce((total, row) => total + (row.salesGrowth ?? 0), 0) / coveredRows.length : 0,
      patGrowth: coveredRows.length ? coveredRows.reduce((total, row) => total + (row.patGrowth ?? 0), 0) / coveredRows.length : 0,
    }
  }), [fiscalYear, indexCompanies])

  const sectorSummaries = useMemo(() => SECTORS.map(sector => {
    const rows = companyRows.filter(row => row.sector === sector)
    const coveredRows = rows.filter(row => row.salesGrowth !== null && row.patGrowth !== null)
    const average = (key: 'salesGrowth' | 'patGrowth') => coveredRows.length ? coveredRows.reduce((sum, row) => sum + (row[key] ?? 0), 0) / coveredRows.length : null
    return {
      sector,
      companies: rows.length,
      declared: coveredRows.length,
      noCoverage: rows.length - coveredRows.length,
      salesGrowth: average('salesGrowth'),
      patGrowth: average('patGrowth'),
      beats: coveredRows.filter(row => (row.salesGrowth ?? 0) > 0 && (row.patGrowth ?? 0) > 0).length,
      misses: coveredRows.filter(row => (row.salesGrowth ?? 0) < 0 || (row.patGrowth ?? 0) < 0).length,
    }
  }), [companyRows])

  const coveredRows = companyRows.filter(row => row.salesGrowth !== null && row.patGrowth !== null)
  const leaderboardRows = [...companyRows].sort((a, b) => {
    if (a[leaderboardMetric] === null) return b[leaderboardMetric] === null ? 0 : 1
    if (b[leaderboardMetric] === null) return -1
    return (b[leaderboardMetric] ?? 0) - (a[leaderboardMetric] ?? 0)
  })
  const declared = coveredRows.length
  const noCoverageCount = companyRows.length - declared
  const salesGrowth = declared ? coveredRows.reduce((sum, row) => sum + (row.salesGrowth ?? 0), 0) / declared : 0
  const patGrowth = declared ? coveredRows.reduce((sum, row) => sum + (row.patGrowth ?? 0), 0) / declared : 0
  const sectorPageCount = Math.max(1, Math.ceil(sectorSummaries.length / sectorPageSize))
  const sectorPageRows = sectorSummaries.slice((sectorPage - 1) * sectorPageSize, sectorPage * sectorPageSize)
  const leaderboardPageCount = Math.max(1, Math.ceil(leaderboardRows.length / leaderboardPageSize))
  const leaderboardPageRows = leaderboardRows.slice((leaderboardPage - 1) * leaderboardPageSize, leaderboardPage * leaderboardPageSize)
  useEffect(() => {
    if (activeView !== 'leaderboard') return
    const viewport = leaderboardViewportRef.current
    if (!viewport) return

    const measureRows = () => {
      const header = viewport.querySelector('thead')
      const row = viewport.querySelector('tbody tr')
      if (!row) return
      const rowHeight = row.getBoundingClientRect().height
      if (!rowHeight) return
      const headerHeight = header?.getBoundingClientRect().height ?? 0
      const nextPageSize = Math.max(1, Math.floor((viewport.clientHeight - headerHeight) / rowHeight))
      setLeaderboardPageSize(current => current === nextPageSize ? current : nextPageSize)
    }

    const observer = new ResizeObserver(measureRows)
    observer.observe(viewport)
    measureRows()
    return () => observer.disconnect()
  }, [activeView, leaderboardPageRows.length])
  useEffect(() => {
    setLeaderboardPage(currentPage => Math.min(currentPage, leaderboardPageCount))
  }, [leaderboardPageCount])
  const fiscalSuffix = fiscalYear?.slice(2) ?? ''
  const selectedQuarter = QUARTERS.find(item => item.id === quarter)
  const selectedSectorRows = selectedSector ? companyRows.filter(row => row.sector === selectedSector) : []
  const selectedSectorCoveredRows = selectedSectorRows.filter(row => row.salesGrowth !== null && row.patGrowth !== null)
  const selectedSectorBeats = selectedSectorCoveredRows.filter(row => (row.salesGrowth ?? 0) > 0 && (row.patGrowth ?? 0) > 0).length
  const selectedSectorMisses = selectedSectorCoveredRows.filter(row => (row.salesGrowth ?? 0) < 0 || (row.patGrowth ?? 0) < 0).length

  const chooseQuarter = (nextQuarter: QuarterId) => {
    setQuarter(nextQuarter)
    setSectorPage(1)
    setLeaderboardPage(1)
    setSelectedSector(null)
  }

  const breadcrumb = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.sub, fontSize: 12, marginBottom: 14, flexWrap: 'wrap' }}>
      <button onClick={() => { setFiscalYear(null); setQuarter(null); setSelectedSector(null) }} style={{ padding: 0, background: 'none', color: fiscalYear ? C.sub : C.blue, fontSize: 12, cursor: 'pointer' }}>Earnings Tracker</button>
      {fiscalYear && <><HiOutlineChevronRight size={12} /><button onClick={() => { setQuarter(null); setSelectedSector(null) }} style={{ padding: 0, background: 'none', color: quarter ? C.sub : C.blue, fontSize: 12, cursor: 'pointer' }}>{fiscalYear}</button></>}
      {quarter && <><HiOutlineChevronRight size={12} /><span style={{ color: C.blue }}>{quarter}</span></>}
      {selectedSector && <><HiOutlineChevronRight size={12} /><span style={{ color: C.blue }}>{selectedSector}</span></>}
    </div>
  )

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: isLeaderboardFullPage ? 'hidden' : 'auto', background: C.surface, color: C.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: isLeaderboardFullPage ? '20px 24px 8px' : '20px 24px 26px', maxWidth: 1600, margin: '0 auto', width: isLeaderboardFullPage ? '100%' : undefined, height: isLeaderboardFullPage ? '100%' : undefined, boxSizing: 'border-box', display: isLeaderboardFullPage ? 'flex' : undefined, flexDirection: isLeaderboardFullPage ? 'column' : undefined, minHeight: isLeaderboardFullPage ? 0 : undefined }}>
        {!quarter && breadcrumb}

        {!fiscalYear && (
          <>
            <h1 style={{ margin: '0 0 2px', fontSize: 18, lineHeight: 1.25, fontWeight: 600 }}>Earnings Tracker</h1>
            <p style={{ margin: '0 0 12px', fontSize: 10, lineHeight: 1.4, color: C.sub }}>Browse quarterly results, beat rates, and earnings trends by financial year.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 14 }}>
              {YEARS.map((year, i) => {
                const first = 2026 - i
                return <SurfaceButton key={year} onClick={() => setFiscalYear(year)}>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{year}</div>
                    <div style={{ marginTop: 7, color: C.sub, fontSize: 12 }}>Apr {first}–Mar {first + 1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 16, color: C.blue, fontSize: 11 }}>View quarterly results <HiOutlineArrowRight size={13} /></div>
                  </div>
                </SurfaceButton>
              })}
            </div>
          </>
        )}

        {fiscalYear && !quarter && (
          <>
            <button onClick={() => setFiscalYear(null)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: 0, background: 'none', color: C.sub, fontSize: 11, cursor: 'pointer' }}><HiOutlineArrowLeft size={13} /> All years</button>
            <h1 style={{ margin: '0 0 2px', fontSize: 18, lineHeight: 1.25, fontWeight: 600 }}>{fiscalYear} Earnings</h1>
            <p style={{ margin: '0 0 12px', fontSize: 10, lineHeight: 1.4, color: C.sub }}>Browse quarterly results, beat rates, and earnings trends for {fiscalYear}.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 14 }}>
              {QUARTERS.map(item => {
                const summary = quarterSummaries.find(row => row.id === item.id)!
                const fiscalStart = 2026 - YEARS.indexOf(fiscalYear)
                const dates = item.id === 'Q4' ? `Jan–Mar ${fiscalStart + 1}` : item.id === 'Q3' ? `Oct–Dec ${fiscalStart}` : item.id === 'Q2' ? `Jul–Sep ${fiscalStart}` : `Apr–Jun ${fiscalStart}`
                return <SurfaceButton key={item.id} onClick={() => { setQuarter(item.id); setActiveView('sectors') }}>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{item.id} {fiscalYear}</div>
                    <div style={{ marginTop: 7, color: C.sub, fontSize: 12 }}>{dates}</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 10 }}><span style={{ color: C.green }}>Sales {formatPercent(summary.salesGrowth)}</span><span style={{ color: summary.patGrowth >= 0 ? C.green : C.red }}>PAT {formatPercent(summary.patGrowth)}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, color: C.blue, fontSize: 11 }}>View quarterly results <HiOutlineArrowRight size={13} /></div>
                  </div>
                </SurfaceButton>
              })}
            </div>
          </>
        )}

        {fiscalYear && quarter && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: isLeaderboardFullPage ? 1 : undefined, minHeight: isLeaderboardFullPage ? 0 : undefined }}>
            <div style={{ paddingTop: 14, flexShrink: 0 }}>
            {breadcrumb}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <h1 style={{ margin: '0 0 2px', fontSize: 18, lineHeight: 1.25, fontWeight: 600 }}>{quarter} {fiscalYear} Earnings</h1>
                <p style={{ margin: 0, fontSize: 10, lineHeight: 1.4, color: C.sub }}>Quarterly results and earnings trends for {selectedQuarter?.period} {Number(fiscalSuffix) - 1 + 2000}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, flexWrap: 'wrap', marginLeft: 'auto' }}>
                <select value={index} onChange={event => { setIndex(event.target.value); setSectorPage(1); setLeaderboardPage(1) }} aria-label="Select an index" style={{ ...filterStyle, minWidth: 142, padding: '7px 9px' }}>
                  <option>All Companies</option><option>Nifty 50</option><option>BSE 500</option>
                </select>
                <select value={fiscalYear} onChange={event => { setFiscalYear(event.target.value); setSectorPage(1); setLeaderboardPage(1) }} aria-label="Select year" style={{ ...filterStyle, minWidth: 88, padding: '7px 9px' }}>{YEARS.map(year => <option key={year}>{year}</option>)}</select>
                <select value={quarter} onChange={event => chooseQuarter(event.target.value as QuarterId)} aria-label="Select quarter" style={{ ...filterStyle, minWidth: 76, padding: '7px 9px' }}>{QUARTERS.map(item => <option key={item.id} value={item.id}>{item.id}</option>)}</select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
              <MetricCard label="Declared" value={`${declared} / ${companyRows.length}`} caption={`${noCoverageCount} with no coverage`} />
              <MetricCard label="Sales Growth (YoY)" value={formatPercent(salesGrowth)} positive={salesGrowth >= 0} caption="Average of covered companies" />
              <MetricCard label="PAT Growth (YoY)" value={formatPercent(patGrowth)} positive={patGrowth >= 0} caption="Average of covered companies" />
            </div>
            </div>

            <div style={{ position: 'sticky', top: 0, zIndex: 5, flexShrink: 0, margin: '0 -24px', padding: '0 24px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: 22 }}>
                {(['sectors', 'leaderboard'] as const).map(view => <button key={view} onClick={() => { setActiveView(view); setSectorPage(1); setLeaderboardPage(1) }} style={{ padding: '8px 0', background: 'none', borderBottom: `2px solid ${activeView === view ? C.blue : 'transparent'}`, color: activeView === view ? C.blue : C.text, fontSize: 12, fontWeight: activeView === view ? 600 : 400, textTransform: 'capitalize', cursor: 'pointer' }}>{view === 'sectors' ? 'Sector Map' : 'Leaderboard'}</button>)}
              </div>
            </div>

            <div style={{ paddingTop: 14, flex: isLeaderboardFullPage ? 1 : undefined, minHeight: isLeaderboardFullPage ? 0 : undefined, display: isLeaderboardFullPage ? 'flex' : undefined, flexDirection: isLeaderboardFullPage ? 'column' : undefined }}>
            {activeView === 'sectors' ? (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
                {sectorPageRows.map(summary => <button key={summary.sector} onClick={() => setSelectedSector(summary.sector)} style={{ width: '100%', minWidth: 0, padding: 0, textAlign: 'left', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.surface, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
                  <div style={{ padding: '13px 14px 11px', background: C.soft, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: C.text, fontSize: 13, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.sector}</div>
                        <div style={{ marginTop: 4, color: C.sub, fontSize: 10 }}>{summary.declared}/{summary.companies} declared</div>
                      </div>
                      <CoverageRing beats={summary.beats} misses={summary.misses} noCoverage={summary.noCoverage} total={summary.companies} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
                      <CoverageLabel color={C.green} label="Beats" value={summary.beats} />
                      <CoverageLabel color={C.red} label="Misses" value={summary.misses} />
                      <CoverageLabel color={C.muted} label="No Coverage" value={summary.noCoverage} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    <GrowthCell label="Sales YoY" value={summary.salesGrowth} />
                    <GrowthCell label="Profit YoY" value={summary.patGrowth} />
                    <GrowthCell label="Sales QoQ" value={summary.salesGrowth === null ? null : summary.salesGrowth / 4} />
                    <GrowthCell label="Profit QoQ" value={summary.patGrowth === null ? null : summary.patGrowth / 4} />
                  </div>
                </button>)}
              </div>
              <Pagination page={sectorPage} pageCount={sectorPageCount} onChange={setSectorPage} />
              </>
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600 }}><HiOutlineTrophy size={15} color={C.blue} /> Growth leaderboard</div>
                  <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
                    {([{ id: 'salesGrowth', label: 'Sales Growth' }, { id: 'patGrowth', label: 'PAT Growth' }] as const).map(item => <button key={item.id} onClick={() => setLeaderboardMetric(item.id)} style={{ padding: '6px 9px', background: leaderboardMetric === item.id ? C.blueSoft : C.surface, color: leaderboardMetric === item.id ? C.blue : C.sub, borderRight: item.id === 'salesGrowth' ? `1px solid ${C.border}` : 'none', fontSize: 10, cursor: 'pointer' }}>{item.label}</button>)}
                  </div>
                </div>
                <div ref={leaderboardViewportRef} style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead><tr>{['#', 'Company', 'Sector', 'Sales Growth (YoY)', 'PAT Growth (YoY)'].map(label => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
                    <tbody>{leaderboardPageRows.map((row, i) => <tr key={row.name}>
                      <td style={tdStyle}>{(leaderboardPage - 1) * leaderboardPageSize + i + 1}</td><td style={tdStyle}><button onClick={() => onSelectCompany(row.name)} style={{ padding: 0, background: 'none', borderBottom: `1px dotted ${C.blue}`, color: C.text, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{row.name}</button></td><td style={tdStyle}>{row.sector}</td><td style={{ ...tdStyle, color: row.salesGrowth === null ? C.muted : row.salesGrowth >= 0 ? C.green : C.red }}>{formatPercent(row.salesGrowth)}</td><td style={{ ...tdStyle, color: row.patGrowth === null ? C.muted : row.patGrowth >= 0 ? C.green : C.red }}>{formatPercent(row.patGrowth)}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                <Pagination page={leaderboardPage} pageCount={leaderboardPageCount} onChange={setLeaderboardPage} compact />
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {selectedSector && (
        <div onClick={() => setSelectedSector(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, background: 'rgba(15,23,42,0.55)' }}>
          <div role="dialog" aria-modal="true" aria-label={`${selectedSector} earnings detail`} onClick={event => event.stopPropagation()} style={{ width: 'min(920px, 100%)', maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: C.surface, borderRadius: 9, overflow: 'hidden', boxShadow: '0 16px 42px rgba(15,23,42,0.2)' }}>
            <div style={{ padding: '14px 17px 11px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}><div><h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{selectedSector}</h2><div style={{ marginTop: 3, color: C.sub, fontSize: 11 }}>{quarter} {fiscalYear} company earnings</div></div><button onClick={() => setSelectedSector(null)} aria-label="Close sector details" style={{ padding: 4, display: 'flex', background: 'none', color: C.sub, cursor: 'pointer' }}><HiOutlineXMark size={17} /></button></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 9, fontSize: 10 }}><span style={{ color: C.green }}>● {selectedSectorBeats} Beats</span><span style={{ color: C.red }}>● {selectedSectorMisses} Misses</span><span style={{ color: C.muted }}>● {selectedSectorRows.length - selectedSectorCoveredRows.length} No Coverage</span><span style={{ marginLeft: 'auto', color: C.sub }}>{selectedSectorCoveredRows.length}/{selectedSectorRows.length} declared</span></div>
              <div style={{ height: 6, display: 'flex', overflow: 'hidden', borderRadius: 6, marginTop: 7, background: '#d1d5db' }}><div style={{ width: `${selectedSectorRows.length ? selectedSectorBeats / selectedSectorRows.length * 100 : 0}%`, background: '#22c55e' }} /><div style={{ width: `${selectedSectorRows.length ? selectedSectorMisses / selectedSectorRows.length * 100 : 0}%`, background: '#ef4444' }} /></div>
            </div>
            <div style={{ overflow: 'auto', padding: '0 17px 14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead><tr>{['Company', 'Sales', 'PAT', 'Sales Growth (YoY)', 'PAT Growth (YoY)'].map(label => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
                <tbody>{selectedSectorRows.map(row => <tr key={row.name}><td style={tdStyle}><button onClick={() => onSelectCompany(row.name)} style={{ padding: 0, background: 'none', borderBottom: `1px dotted ${C.blue}`, color: C.text, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{row.name}</button></td><td style={tdStyle}>{formatAmount(row.sales)}</td><td style={tdStyle}>{formatAmount(row.pat)}</td><td style={{ ...tdStyle, color: row.salesGrowth === null ? C.muted : row.salesGrowth >= 0 ? C.green : C.red }}>{formatPercent(row.salesGrowth)}</td><td style={{ ...tdStyle, color: row.patGrowth === null ? C.muted : row.patGrowth >= 0 ? C.green : C.red }}>{formatPercent(row.patGrowth)}</td></tr>)}</tbody>
              </table>
              {selectedSectorRows.length === 0 && <div style={{ padding: 26, textAlign: 'center', color: C.muted, fontSize: 12 }}>No companies are available for this sector in the selected index.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, caption, positive }: { label: string; value: string; caption: string; positive?: boolean }) {
  return <div style={{ minHeight: 76, padding: '9px 12px', background: C.soft, border: `1px solid ${C.soft}`, borderRadius: 7 }}>
    <div style={{ fontSize: 10, color: C.sub }}>{label}</div><div style={{ marginTop: 2, color: positive === undefined ? C.text : positive ? C.green : C.red, fontSize: 19, lineHeight: 1.2, fontWeight: 600 }}>{value}</div><div style={{ marginTop: 2, color: C.muted, fontSize: 9 }}>{caption}</div>
  </div>
}

function GrowthCell({ label, value }: { label: string; value: number | null }) {
  return <div style={{ minWidth: 0, padding: '9px 3px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}><div style={{ color: C.sub, fontSize: 8, lineHeight: 1.3 }}>{label}</div><div style={{ marginTop: 4, color: value === null ? C.muted : value >= 0 ? C.green : C.red, fontSize: 9, fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatPercent(value)}</div></div>
}

function CoverageRing({ beats, misses, noCoverage, total }: { beats: number; misses: number; noCoverage: number; total: number }) {
  const beatEnd = total ? beats / total * 100 : 0
  const missEnd = total ? (beats + misses) / total * 100 : 0
  const declaredPercent = total ? Math.round((beats + misses) / total * 100) : 0
  const ring = `conic-gradient(${C.green} 0% ${beatEnd}%, ${C.red} ${beatEnd}% ${missEnd}%, ${C.muted} ${missEnd}% 100%)`

  return (
    <div role="img" aria-label={`${beats} beats, ${misses} misses, ${noCoverage} with no coverage`} style={{ width: 48, height: 48, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', background: ring }}>
      <div style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: '50%', background: C.surface, color: C.text, fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{declaredPercent}%</div>
    </div>
  )
}

function CoverageLabel({ color, label, value }: { color: string; label: string; value: number }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 7px', border: `1px solid ${C.border}`, borderRadius: 5, color: C.sub, background: C.surface, fontSize: 9, lineHeight: 1 }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />{label}<strong style={{ color: C.text, fontWeight: 650 }}>{value}</strong>
  </span>
}

function Pagination({ page, pageCount, onChange, compact = false }: { page: number; pageCount: number; onChange: (page: number) => void; compact?: boolean }) {
  if (pageCount <= 1) return null
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: compact ? 6 : 8, padding: compact ? '2px 8px' : '12px 8px' }}>
    <button disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page" style={paginationButtonStyle(page === 1, compact)}><HiOutlineChevronLeft size={compact ? 11 : 13} /></button>
    <span style={{ color: C.sub, fontSize: compact ? 9 : 10 }}>Page {page} of {pageCount}</span>
    <button disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label="Next page" style={paginationButtonStyle(page === pageCount, compact)}><HiOutlineChevronRight size={compact ? 11 : 13} /></button>
  </div>
}

function paginationButtonStyle(disabled: boolean, compact = false): React.CSSProperties {
  return { width: compact ? 24 : 28, height: compact ? 24 : 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, borderRadius: 6, background: C.surface, color: disabled ? C.muted : C.text, cursor: disabled ? 'not-allowed' : 'pointer' }
}

const filterStyle: React.CSSProperties = { minWidth: 118, padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.surface, color: C.text, fontSize: 11, outline: 'none' }
const thStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 1, padding: '10px 12px', background: '#eef1f4', borderBottom: `1px solid ${C.border}`, color: C.sub, fontSize: 10, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: 11, whiteSpace: 'nowrap' }
