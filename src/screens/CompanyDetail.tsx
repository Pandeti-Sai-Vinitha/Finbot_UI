import React, { useRef, useState } from 'react'
import { HiOutlineArrowTrendingUp, HiOutlineArrowRight, HiOutlineNewspaper, HiOutlineChartBar, HiOutlineDocumentArrowDown } from 'react-icons/hi2'
import { ANNUAL_METRIC_GROUPS, QUARTERS, SECTOR_COMPANIES, SECTORS, YEARS, getAnnualData, getQuarterlyData } from '../data/finData'

type Cell = number | string
type Basis = 'consolidated' | 'standalone'
type StatementData = Record<string, Record<string, Cell>>

type Props = {
  company: string
  onBack: () => void
}

const colors = {
  bg: '#f4f6f9', surface: '#ffffff', soft: '#f8fafc', border: 'rgba(15,23,42,0.08)',
  text: '#0f172a', sub: '#475569', muted: '#64748b', faint: '#94a3b8', accent: '#2563eb',
  accentDark: '#1d4ed8', green: '#16a34a', red: '#dc2626', accentSoft: 'rgba(37,99,235,0.08)',
  accentBorder: 'rgba(37,99,235,0.18)'
}

function formatValue(value: Cell | undefined, metric: string): string {
  if (value === undefined || value === null || value === '') return '-'
  if (typeof value === 'string') return value
  if (metric.includes('%')) return `${value.toFixed(1)}%`
  if (metric === 'EPS in Rs') return value.toFixed(1)
  return value.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

function getStatementData(company: string, basis: Basis, quarterly = false): StatementData {
  const source = quarterly ? getQuarterlyData(company) : getAnnualData(company)
  if (basis === 'consolidated') return source
  const factor = quarterly ? 0.96 : 0.95
  const adjusted: StatementData = {}
  Object.entries(source).forEach(([period, row]) => {
    adjusted[period] = Object.fromEntries(Object.entries(row).map(([metric, value]) => {
      if (typeof value !== 'number' || metric.includes('%') || metric === 'EPS in Rs') return [metric, value]
      return [metric, +(value * factor).toFixed(1)]
    }))
  })
  return adjusted
}

function Section({ id, title, subtitle, children, action }: { id?: string; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden', scrollMarginTop: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px 8px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.accentSoft, color: colors.accent }}><HiOutlineChartBar size={13} /></div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 15, color: colors.text, fontWeight: 700 }}>{title}</h2>
          {subtitle && <div style={{ marginTop: 2, fontSize: 10, color: colors.muted }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function FinancialTable({ rows, data, years = YEARS }: { rows: string[]; data: Record<string, Record<string, Cell>>; years?: string[] }) {
  return (
    <div style={{ maxHeight: 360, overflow: 'auto' }}>
      <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', fontSize: 11 }}>
        <thead><tr style={{ background: colors.soft }}>
          <th style={{ position: 'sticky', left: 0, zIndex: 1, minWidth: 180, padding: '9px 12px', textAlign: 'left', background: colors.soft, color: colors.muted, fontSize: 11, fontWeight: 700 }}>METRIC</th>
          {years.map(year => <th key={year} style={{ padding: '9px 12px', textAlign: 'right', color: colors.muted, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{year}</th>)}
        </tr></thead>
        <tbody>{rows.map((metric, index) => {
          const isTotal = ['Operating Profit', 'Profit Before Tax', 'Net Profit', 'Total Liabilities', 'Total Assets', 'Net Cash Flow'].includes(metric)
          return <tr key={metric} style={{ background: index % 2 ? '#fcfcfd' : colors.surface, borderBottom: `1px solid ${colors.border}` }}>
            <td style={{ position: 'sticky', left: 0, background: index % 2 ? '#fcfcfd' : colors.surface, padding: '6px 10px', color: isTotal ? colors.text : colors.sub, fontWeight: isTotal ? 700 : 500, whiteSpace: 'nowrap' }}>{metric}</td>
            {years.map(year => {
              const value = data[year]?.[metric]
              const numeric = typeof value === 'number' ? value : Number(value)
              return <td key={year} style={{ padding: '6px 10px', textAlign: 'right', color: numeric < 0 ? colors.red : isTotal ? colors.text : colors.sub, fontWeight: isTotal ? 700 : 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatValue(value, metric)}</td>
            })}
          </tr>
        })}</tbody>
      </table>
    </div>
  )
}

function PeerComparison({ company, sector, basis }: { company: string; sector: string; basis: Basis }) {
  const peers = (SECTOR_COMPANIES[sector] ?? []).filter(name => name !== company).slice(0, 6)
  const companies = [company, ...peers]
  return <Section id="peers" title="Peer comparison" subtitle={`${sector} | ${basis === 'consolidated' ? 'Consolidated' : 'Standalone'} FY2025 figures`}>
    <div style={{ maxHeight: 260, overflow: 'auto' }}><table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 11 }}>
      <thead><tr style={{ background: colors.soft }}>
        {['Company', 'Sales', 'Net Profit', 'OPM %', 'EPS in Rs', 'Total Assets'].map(label => <th key={label} style={{ padding: '9px 12px', textAlign: label === 'Company' ? 'left' : 'right', color: colors.muted, fontSize: 11, fontWeight: 700 }}>{label}</th>)}
      </tr></thead>
      <tbody>{companies.map((name, index) => {
        const row = getStatementData(name, basis)['2025']
        return <tr key={name} style={{ background: name === company ? colors.accentSoft : index % 2 ? '#fcfcfd' : colors.surface, borderBottom: `1px solid ${colors.border}` }}>
          <td style={{ padding: '6px 10px', color: name === company ? colors.accent : colors.text, fontWeight: name === company ? 700 : 500 }}>{name}{name === company && <span style={{ marginLeft: 6, color: colors.faint, fontSize: 9 }}>Selected</span>}</td>
          {['Sales', 'Net Profit', 'OPM %', 'EPS in Rs', 'Total Assets'].map(metric => <td key={metric} style={{ padding: '6px 10px', textAlign: 'right', color: colors.sub, fontVariantNumeric: 'tabular-nums' }}>{formatValue(row?.[metric], metric)}</td>)}
        </tr>
      })}</tbody>
    </table></div>
  </Section>
}

function RatiosTable({ data }: { data: Record<string, Record<string, Cell>> }) {
  const rows = ['OPM %', 'Tax %', 'Profit Margin %', 'Asset Turnover']
  const ratioData: Record<string, Record<string, Cell>> = {}
  YEARS.forEach(year => {
    const row = data[year]
    const sales = Number(row?.Sales ?? 0)
    ratioData[year] = { 'OPM %': row?.['OPM %'], 'Tax %': row?.['Tax %'], 'Profit Margin %': sales ? +(Number(row?.['Net Profit'] ?? 0) / sales * 100).toFixed(1) : 0, 'Asset Turnover': Number(row?.['Total Assets'] ?? 0) ? +(sales / Number(row?.['Total Assets'])).toFixed(2) : 0 }
  })
  return <FinancialTable rows={rows} data={ratioData} />
}

function downloadPresentation(company: string, quarter: string, basis: Basis) {
  const title = `${company} ${quarter} Investor Presentation`
  const lines = [
    title,
    `${basis === 'consolidated' ? 'Consolidated' : 'Standalone'} results | 23 Sep 2026`,
    '',
    'Quarterly investor presentation',
    'This document contains the quarterly financial snapshot available in the FinBot dataset.',
    '',
    'Please verify figures against the original company filing before relying on them.',
  ]
  const escapePdf = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const content = ['BT', '/F1 16 Tf', '50 760 Td', ...lines.flatMap((line, index) => [index === 0 ? `(${escapePdf(line)}) Tj` : `0 -24 Td (${escapePdf(line)}) Tj`]), 'ET'].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${company.replace(/[^a-z0-9]+/gi, '_')}_${quarter.replace(/\s+/g, '_')}_Investor_Presentation.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}

function DocumentsSection({ company, basis }: { company: string; basis: Basis }) {
  const [selectedYear, setSelectedYear] = useState<string>(YEARS[YEARS.length - 1])
  const documents = QUARTERS.map(quarter => `${quarter} FY${selectedYear.slice(2)}`)

  const yearSelector = (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.muted, fontSize: 10, fontWeight: 600 }}>
      <span>Year</span>
      <select
        value={selectedYear}
        onChange={event => setSelectedYear(event.target.value)}
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: 5,
          background: colors.surface,
          color: colors.text,
          padding: '4px 7px',
          fontSize: 10,
          fontWeight: 700,
          outline: 'none',
        }}
      >
        {YEARS.slice().reverse().map(year => (
          <option key={year} value={year}>FY{year.slice(2)}</option>
        ))}
      </select>
    </label>
  )

  return (
    <Section
      id="documents"
      title="Documents"
      subtitle={`${basis === 'consolidated' ? 'Consolidated' : 'Standalone'} quarterly investor presentations`}
      action={yearSelector}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        {documents.map((quarter, index) => (
          <div
            key={quarter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 10px',
              borderRight: index < documents.length - 1 ? `1px solid ${colors.border}` : 'none',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ width: 25, height: 25, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.accentSoft, color: colors.accent }}>
              <HiOutlineDocumentArrowDown size={13} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: colors.text, fontSize: 11, fontWeight: 700 }}>{quarter}</div>
              <div style={{ color: colors.faint, fontSize: 9 }}>Investor presentation</div>
            </div>
            <button
              onClick={() => downloadPresentation(company, quarter, basis)}
              title={`Download ${quarter} presentation`}
              style={{
                border: `1px solid ${colors.accentBorder}`,
                borderRadius: 5,
                background: colors.accentSoft,
                color: colors.accent,
                padding: '4px 7px',
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              PDF
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default function CompanyDetail({ company, onBack }: Props) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const [activeTab, setActiveTab] = useState('peers')
  const [basis, setBasis] = useState<Basis>('consolidated')
  const [selectedNews, setSelectedNews] = useState<{ title: string; summary: string; date: string; documents: string[] } | null>(null)
  const annual = getStatementData(company, basis)
  const quarterly = getStatementData(company, basis, true)
  const sector = SECTORS.find(name => (SECTOR_COMPANIES[name] ?? []).includes(company)) ?? 'Services'
  const latest = annual['2025'] ?? {}
  const quarterlyPeriods = YEARS.flatMap(year => QUARTERS.map(quarter => `${quarter} FY${year.slice(2)}`))
  const quarterlyFigures: Record<string, Record<string, Cell>> = {}
  quarterlyPeriods.forEach(period => { quarterlyFigures[period] = quarterly[period] ?? {} })
  const summary = [
    ['Revenue', formatValue(latest.Sales, 'Sales')],
    ['Net profit', formatValue(latest['Net Profit'], 'Net Profit')],
    ['Operating margin', formatValue(latest['OPM %'], 'OPM %')],
    ['EPS', formatValue(latest['EPS in Rs'], 'EPS in Rs')],
  ]
  const news = [
    {
      title: `${company} reports resilient ${basis} performance in the latest financial year`,
      summary: `${company} continues to show disciplined execution, with margin stability and steady cash generation supporting the ${basis} earnings profile.`,
      date: '23 Sep 2026',
      documents: QUARTERS.map(quarter => `${quarter} FY${YEARS[YEARS.length - 1].slice(2)}`),
    },
    {
      title: `${company} remains in focus as ${basis} earnings and margins are tracked`,
      summary: `The market is monitoring ${company}'s operating leverage and working-capital discipline as analysts compare the most recent ${basis} results against peer benchmarks.`,
      date: '21 Sep 2026',
      documents: QUARTERS.map(quarter => `${quarter} FY${YEARS[YEARS.length - 2].slice(2)}`),
    },
    {
      title: `Analysts review ${company}'s ${basis} cash generation and balance sheet strength`,
      summary: `Investors are focusing on balance-sheet resilience, asset efficiency, and the consistency of ${basis} cash conversion within the current earnings cycle.`,
      date: '18 Sep 2026',
      documents: QUARTERS.map(quarter => `${quarter} FY${YEARS[YEARS.length - 3].slice(2)}`),
    },
  ]
  const tabs = [
    ['peers', 'Peer comparison'], ['quarterly', 'Quarterly Results'], ['profit-loss', 'Profit & Loss'],
    ['balance-sheet', 'Balance Sheet'], ['cash-flows', 'Cash Flows'], ['ratios', 'Ratios'], ['news', 'News'], ['documents', 'Documents'],
  ]
  const anchorStyle = { scrollMarginTop: 116 }
  const jumpToSection = (id: string) => {
    setActiveTab(id)
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <div style={{ height: '100%', overflowY: 'auto', background: colors.bg, color: colors.text, fontFamily: 'Inter, sans-serif' }}>
    <header style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '9px 14px 11px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div />
        <button onClick={onBack} style={{ border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.surface, padding: '5px 12px', color: colors.text, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Back</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 230 }}><div style={{ color: colors.muted, fontSize: 10, marginBottom: 2 }}>{sector}</div><h1 style={{ margin: 0, fontSize: 25, letterSpacing: '-0.04em', fontWeight: 700 }}>{company}</h1><div style={{ color: colors.faint, fontSize: 10, marginTop: 2 }}>{basis === 'consolidated' ? 'Consolidated' : 'Standalone'} figures in Rs. Crores | FY2021 - FY2025</div></div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{summary.map(([label, value]) => <div key={label} style={{ minWidth: 100, padding: '6px 8px', background: colors.soft, border: `1px solid ${colors.border}`, borderRadius: 6 }}><div style={{ color: colors.muted, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div><div style={{ marginTop: 1, color: colors.text, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div></div>)}</div>
      </div>
    </header>
    <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 10px', background: 'rgba(255,255,255,0.96)', borderBottom: `1px solid ${colors.border}`, backdropFilter: 'blur(8px)' }}>
      <nav style={{ display: 'flex', gap: 1, overflowX: 'auto', flex: 1 }}>
        {tabs.map(([id, label]) => <button key={id} onClick={() => jumpToSection(id)} style={{ flexShrink: 0, border: 'none', borderBottom: activeTab === id ? `2px solid ${colors.accent}` : '2px solid transparent', borderRadius: 0, background: 'transparent', padding: '5px 8px 4px', color: colors.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>)}
      </nav>
      <div style={{ display: 'inline-flex', padding: 2, gap: 2, background: colors.soft, border: `1px solid ${colors.border}`, borderRadius: 6, flexShrink: 0 }}>
        {(['consolidated', 'standalone'] as Basis[]).map(option => <button key={option} onClick={() => setBasis(option)} style={{ border: 'none', borderRadius: 4, padding: '4px 9px', background: basis === option ? colors.accent : 'transparent', color: basis === option ? '#fff' : colors.sub, fontSize: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{option}</button>)}
      </div>
    </div>
    <main style={{ maxWidth: 1440, margin: '0 auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div ref={node => { sectionRefs.current.peers = node }} style={anchorStyle}><PeerComparison company={company} sector={sector} basis={basis} /></div>
      <div ref={node => { sectionRefs.current.quarterly = node }} style={anchorStyle}><Section id="quarterly" title="Quarterly Results" subtitle="Q1-Q4 across the last five financial years"><FinancialTable rows={['Sales', 'Expenses', 'Operating Profit', 'OPM %', 'Other Income', 'Interest', 'Depreciation', 'Profit Before Tax', 'Tax %', 'Net Profit', 'EPS in Rs']} data={quarterlyFigures} years={quarterlyPeriods} /></Section></div>
      <div ref={node => { sectionRefs.current['profit-loss'] = node }} style={anchorStyle}><Section id="profit-loss" title="Profit & Loss" subtitle="Annual consolidated results"><FinancialTable rows={ANNUAL_METRIC_GROUPS['Profit & Loss'].filter(row => row !== 'Period')} data={annual} /></Section></div>
      <div ref={node => { sectionRefs.current['balance-sheet'] = node }} style={anchorStyle}><Section id="balance-sheet" title="Balance Sheet" subtitle="Annual consolidated position"><FinancialTable rows={ANNUAL_METRIC_GROUPS['Balance Sheet']} data={annual} /></Section></div>
      <div ref={node => { sectionRefs.current['cash-flows'] = node }} style={anchorStyle}><Section id="cash-flows" title="Cash Flows" subtitle="Annual cash flow statement"><FinancialTable rows={['Cash From Operating Activity', 'Cash From Investing Activity', 'Cash From Financing Activity']} data={annual} /></Section></div>
      <div ref={node => { sectionRefs.current.ratios = node }} style={anchorStyle}><Section id="ratios" title="Ratios" subtitle="Derived from the annual figures"><RatiosTable data={annual} /></Section></div>
      <div ref={node => { sectionRefs.current.news = node }} style={anchorStyle}><Section id="news" title="News" subtitle="Latest company coverage">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>{news.map((story, index) => <article key={story.title} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: 15, borderRight: index < news.length - 1 ? `1px solid ${colors.border}` : 'none' }}><div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.accent, fontSize: 10, fontWeight: 700 }}><HiOutlineNewspaper size={13} /> MARKET BRIEF</div><h3 style={{ margin: '8px 0 7px', fontSize: 13, lineHeight: 1.4, color: colors.text }}>{story.title}</h3><div style={{ color: colors.muted, fontSize: 10 }}>{story.date} · FinBot Research</div></div><button onClick={() => setSelectedNews(story)} title={`Open ${story.title}`} style={{ flexShrink: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.soft, color: colors.text, cursor: 'pointer' }}><HiOutlineArrowRight size={13} /></button></article>)}</div>
      </Section></div>
      {selectedNews && (
        <div onClick={() => setSelectedNews(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
          <div onClick={event => event.stopPropagation()} style={{ width: 'min(620px, 92vw)', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: '0 18px 45px rgba(15,23,42,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#eef2ff', borderBottom: `1px solid ${colors.accentBorder}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.accentSoft, color: colors.accent }}><HiOutlineNewspaper size={13} /></div>
              <div style={{ flex: 1, color: colors.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>NEWS ARTICLE</div>
              <button onClick={() => setSelectedNews(null)} style={{ width: 18, height: 18, borderRadius: 4, background: colors.accentSoft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: colors.textSub, flexShrink: 0, fontSize: 12 }}>×</button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ color: colors.muted, fontSize: 10, marginBottom: 8 }}>{selectedNews.date} · FinBot Research</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 18, lineHeight: 1.35, color: colors.text }}>{selectedNews.title}</h3>
                <p style={{ margin: 0, color: colors.sub, fontSize: 12, lineHeight: 1.75 }}>{selectedNews.summary}</p>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <div style={{ color: colors.text, fontSize: 12, fontWeight: 700 }}>Investor presentations</div>
                  <div style={{ color: colors.muted, fontSize: 10 }}>{selectedNews.documents.length} available</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                  {selectedNews.documents.map(doc => (
                    <div key={doc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: colors.soft, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 9px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: colors.text, fontSize: 10, fontWeight: 700 }}>{doc}</div>
                        <div style={{ color: colors.muted, fontSize: 9 }}>PDF download</div>
                      </div>
                      <button onClick={() => downloadPresentation(company, doc, basis)} style={{ border: `1px solid ${colors.accentBorder}`, borderRadius: 5, background: colors.accentSoft, color: colors.accent, padding: '4px 7px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>Download</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={node => { sectionRefs.current.documents = node }} style={anchorStyle}><DocumentsSection company={company} basis={basis} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.faint, fontSize: 10, paddingBottom: 8 }}><HiOutlineArrowTrendingUp size={13} /> Values are generated from the available company dataset.</div>
    </main>
  </div>
}
