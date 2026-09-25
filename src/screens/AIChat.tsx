import { useState, useRef, useEffect, useMemo } from 'react'
import {
  HiOutlinePaperAirplane, HiOutlineClipboard, HiOutlineArrowDownTray,
  HiOutlineSparkles, HiOutlineCog6Tooth, HiOutlineXMark, HiOutlinePencilSquare,
  HiOutlineCheck, HiOutlineEye,
  HiOutlineChevronDown, HiOutlineChevronRight,
  HiOutlineLightBulb, HiOutlineArrowTrendingUp, HiOutlineTrash, HiOutlineTableCells, HiOutlineNewspaper,
  HiOutlineAdjustmentsHorizontal,
} from 'react-icons/hi2'
import { RiSparklingLine } from 'react-icons/ri'
import finbotLogo from '../../assets/FinBot_Logo.png'
import { DEFAULT_BOT_CONFIG_ID } from '../App'
import type { BotConfig, ChatSession, ChatMessage, SavedScreener } from '../App'
import {
  SECTORS, SECTOR_COMPANIES, ANNUAL_METRIC_GROUPS,
  FREQUENTLY_USED_METRICS,
  getAnnualData,
} from '../data/finData'

/* ─── Types ─────────────────────────────────────────────────────── */
interface BarPair { label: string; a: number; b: number }
interface MandateSection {
  num: number
  title: string
  intro?: string
  table?: { headers: string[]; rows: string[][] }
  barChart?: { title: string; aLabel: string; bLabel: string; bars: BarPair[] }
  snapshotRows?: { category: string; detail: string }[]
  qualifies?: string[]
  breaks?: string[]
  checklist?: { label: string; sub: string; pass: boolean | null }[]
  relatedQuestions?: string[]
}
interface RichContent {
  thoughtProcess: string[]
  thoughtSecs: number
  companyName: string
  ticker: string
  mandateTitle: string
  intro: string
  sections: MandateSection[]
  relatedQuestions: string[]
  referenceCompanies: string[]
  referenceMetrics: string[]
}

interface ConfigForm {
  name: string
  sectors: string[]
  companies: string[]
  timePeriod: 'annual' | 'quarterly'
  years: string[]
  quarters: string[]
  metrics: string[]
  responseStyle: 'concise' | 'detailed' | 'analytical'
  promptInstructions: string
}

interface Props {
  botConfigs: BotConfig[]
  activeBotConfigId: number | null
  onSetActiveBotConfig: (id: number | null) => void
  onAddBotConfig: (cfg: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>) => BotConfig
  onUpdateBotConfig: (id: number, patch: Partial<Omit<BotConfig, 'id' | 'createdAt'>>) => void
  onDeleteBotConfig: (id: number) => void
  chatSessions: ChatSession[]
  activeChatId: number
  onUpdateChat: (id: number, fn: (s: ChatSession) => ChatSession) => void
  onPersonalizeRef?: (fn: () => void) => void
  savedScreeners: SavedScreener[]
  onNavigateToScreener: () => void
  onMessageSent?: (msg: string) => void
}

/* ─── Constants ─────────────────────────────────────────────────── */
const DEFAULT_CFG: ConfigForm = {
  name: 'FinBot Default',
  sectors: ['Information Technology', 'Financial Services'],
  companies: ['TCS', 'Infosys', 'HDFC Bank', 'ICICI Bank'],
  timePeriod: 'annual',
  years: ['2023', '2024', '2025'],
  quarters: [],
  metrics: ['Sales', 'Net Profit', 'OPM %', 'EPS in Rs', 'Equity Capital', 'Borrowings'],
  responseStyle: 'analytical',
  promptInstructions: 'Focus on Indian equity markets — NSE/BSE listed companies.',
}

const THINK_STEPS = [
  'Parsing your query…',
  'Scanning financial databases and documents…',
  'Looking up financial statements and key metrics…',
  'Analyzing trends and generating insights…',
]

const SUGGESTIONS = [
  'Show 5-year ROCE trend for TCS',
  'Compare EBITDA margins across IT companies',
  'Generate investment thesis for Reliance Industries',
  'Quarterly EPS growth of Infosys FY2025',
  'Cash flow analysis for HDFC Bank vs ICICI Bank',
]

const PERSONALIZE_COACH_KEY = 'finbot_personalize_coach_seen_v3'

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

let _msgId = 0

/* ─── Mock response ──────────────────────────────────────────────── */
function fmtCr(v: number) { return `₹${v.toLocaleString('en-IN')} Cr` }

function generateRich(query: string, cfg: ConfigForm): RichContent {
  const co = cfg.companies[0] ?? 'TCS'
  const ticker = co.slice(0, 4).toUpperCase()
  const years = cfg.years.length >= 3 ? cfg.years.slice(-3) : ['2023', '2024', '2025']
  const fy = (y: string) => `FY${y.slice(-2)} (Dec-${y})`

  const getVal = (company: string, year: string, metric: string, fallback: number) => {
    try { return Number(getAnnualData(company)[year]?.[metric] ?? fallback) } catch { return fallback }
  }

  const rev = years.map((y, i) => getVal(co, y, 'Sales', 9000 + i * 1000))
  const op  = years.map((y, i) => getVal(co, y, 'Operating Profit', 1200 + i * 150))
  const opm = years.map((y, i) => getVal(co, y, 'OPM %', 13 + i * 0.5))
  const pbt = years.map((y, i) => getVal(co, y, 'Profit before tax', 1230 + i * 100))
  const ocf = years.map((_, i) => 820 + i * 360 + Math.round(Math.random() * 80))
  const icf = years.map((_, i) => -(15 + i * 280) - Math.round(Math.random() * 40))
  const fcf = years.map((_, i) => -(251 + i * 50))
  const ncf = years.map((_, i) => [92.9, 48.8, 991][i] ?? 200)

  return {
    thoughtProcess: THINK_STEPS,
    thoughtSecs: Math.floor(Math.random() * 20) + 14,
    companyName: co,
    ticker,
    mandateTitle: `Investment mandate (last ${years.length} years): ${co}`,
    intro: `20x IRR with moderate leverage and a ~2% dividend yield. Build exposure to a scaled IT services compounder with consistent revenue growth over the last ${years.length} years, stable operating profitability (mid-teens margin profile), reasonable valuation versus quality/historic profits, and a clear risk framework around cyclicality, client concentration, and margin sensitivity.`,
    sections: [
      {
        num: 1,
        title: 'Mandate objective',
        intro: `Build exposure to a scaled IT services compounder with:`,
        qualifies: [
          `Consistent revenue growth over the last ${years.length} years`,
          `Stable operating profitability (mid-teens margin profile)`,
          `Reasonable valuation versus quality/historic profits`,
          `A clear risk framework around cyclicality, client concentration, and margin sensitivity`,
        ],
      },
      {
        num: 2,
        title: `${years.length}-year operating track record (FY${years[0]?.slice(-2)}–FY${years[years.length - 1]?.slice(-2)})`,
        intro: `The table below summarises the last ${years.length} completed years (calendar year end numbers available), showing growth and profitability progression.`,
        table: {
          headers: ['Metric (₹ Cr)', ...years.map(fy)],
          rows: [
            ['Revenue', ...rev.map(v => fmtCr(Math.round(v)))],
            ['Operating Profit', ...op.map(v => fmtCr(Math.round(v)))],
            ['Operating Margin (%)', ...opm.map(v => `${v.toFixed(2)}%`)],
            ['Profit Before Tax', ...pbt.map(v => fmtCr(Math.round(v)))],
          ],
        },
        barChart: {
          title: `${co} (FY${years[0]?.slice(-2)}–FY${years[years.length - 1]?.slice(-2)}): Revenue vs Operating Profit (₹ Cr)`,
          aLabel: 'Revenue', bLabel: 'Operating Profit',
          bars: years.map((y, i) => ({ label: fy(y), a: Math.round(rev[i] ?? 0), b: Math.round(op[i] ?? 0) })),
        },
      },
      {
        num: 3,
        title: 'Cash-flow mandate (quality of earnings)',
        intro: `Your mandate should only qualify growth if it is backed by strong operating cash generation and disciplined capital allocation. Over the last ${years.length} completed years, operating cash flow stayed strong while financing cash outflows indicate shareholder returns/repayments; net cash flow varied year to year.`,
        table: {
          headers: ['Metric (₹ Cr)', ...years.map(fy)],
          rows: [
            ['Operating Cash Flow', ...ocf.map(v => fmtCr(v))],
            ['Investing Cash Flow', ...icf.map(v => fmtCr(v))],
            ['Financing Cash Flow', ...fcf.map(v => fmtCr(v))],
            ['Net Cash Flow', ...ncf.map(v => fmtCr(Math.round(v)))],
          ],
        },
      },
      {
        num: 4,
        title: 'Current "mandate fit" snapshot (valuation, returns, risk)',
        intro: `Use these as entry/monitoring guardrails (not as recommendations).`,
        snapshotRows: [
          { category: 'Valuation', detail: 'P/E (TTM) 25.4x, EV/S 5.0x, EV/EBITDA 14.0x — valuation bucket marked Reasonable.' },
          { category: 'Profitability / Returns', detail: 'ROCE (TTM) 30.02%, ROE (TTM) 25.87%, EBITDA margin (TTM) 15.53%, net income margin 9.52%.' },
          { category: 'Balance sheet / leverage', detail: 'Debt to equity (TTM) 0.0 (low).' },
          { category: 'Market risk', detail: 'Beta 0.87 — risk bucket flagged High Risk (driven by relative volatility ranking).' },
          { category: 'Shareholder returns', detail: 'Dividend yield 2.0%.' },
        ],
      },
      {
        num: 5,
        title: 'Mandate rules: what qualifies / what breaks the thesis',
        qualifies: [
          `Your mandate should continually qualify if operating margin stays broadly in the 13–16% band seen in FY${years[0]?.slice(-2)}–FY${years[years.length - 1]?.slice(-2)}.`,
          `ROE/ROCE remain around the current ~20% / ~24% zone, indicating returns are not being diluted by growth.`,
          `Valuation remains within a "reasonable" band relative to its own earnings delivery (currently mid-20x P/E).`,
        ],
        breaks: [
          `A sustained margin compression below the FY${years[0]?.slice(-2)} trough (<13% operating margin) without a clear recovery path.`,
          `Deterioration in cash conversion where operating cash flow meaningfully lags profit trajectory for multiple periods.`,
          `Material increase in leverage from the current low base (debt-to-equity moving structurally higher).`,
        ],
      },
      {
        num: 6,
        title: 'Investment checklist',
        checklist: [
          { label: 'Performance', sub: 'Market Leader', pass: true },
          { label: 'Valuation', sub: 'Reasonable', pass: null },
          { label: 'Growth', sub: 'Stable', pass: null },
          { label: 'Profitability', sub: 'Moderate Margin', pass: true },
          { label: 'Technicals', sub: 'Bearish', pass: false },
          { label: 'Risk', sub: 'High Risk', pass: false },
        ],
        relatedQuestions: [
          `Can you create a three-year investment mandate for ${co}?`,
          `Summarise ${co}'s financial performance and key ratios over the last three years`,
          `What are the main growth drivers and risks for ${co} recently?`,
          `How does ${co} compare with peers in its sector over three years?`,
        ],
      },
    ],
    relatedQuestions: [
      `Can you create a three-year investment mandate for ${co}?`,
      `Summarise ${co}'s financial performance and key ratios over the last three years`,
      `What are the main growth drivers and risks for ${co} recently?`,
      `How does ${co} compare with peers in ${cfg.sectors[0] ?? 'IT'} over three years?`,
      `Suggest portfolio allocation, entry levels, and exit triggers for ${co} investment`,
    ],
    referenceCompanies: cfg.companies,
    referenceMetrics: cfg.metrics,
  }
}

/* ─── Charts ────────────────────────────────────────────────────── */
function PairBarChart({ title, aLabel, bLabel, bars }: { title: string; aLabel: string; bLabel: string; bars: BarPair[] }) {
  const maxV = Math.max(...bars.flatMap(b => [b.a, b.b]), 1)
  const W = 500, H = 160, padL = 48, padR = 12, barW = Math.min(28, (W - padL - padR) / bars.length / 2.8)
  const gap = (W - padL - padR) / bars.length
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: DS.textSub, marginBottom: 6, textAlign: 'center' }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: '100%', height: 'auto' }}>
        {gridLines.map(t => {
          const y = H - t * (H - 16)
          const v = Math.round(maxV * t)
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#94a3b8">{v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}</text>
            </g>
          )
        })}
        {bars.map((b, i) => {
          const cx = padL + i * gap + gap / 2
          const aH = (b.a / maxV) * (H - 16)
          const bH = (b.b / maxV) * (H - 16)
          return (
            <g key={i}>
              <rect x={cx - barW - 1} y={H - aH} width={barW} height={aH} fill="#3b82f6" rx={3} opacity={0.88} />
              <rect x={cx + 1} y={H - bH} width={barW} height={bH} fill="#22c55e" rx={3} opacity={0.88} />
              <text x={cx} y={H + 14} textAnchor="middle" fontSize={8} fill="#64748b">{b.label.replace('FY', 'FY').split(' ')[0]}</text>
              <text x={cx} y={H + 24} textAnchor="middle" fontSize={7} fill="#94a3b8">{b.label.split(' ')[1] ?? ''}</text>
            </g>
          )
        })}
        <rect x={padL} y={H + 30} width={9} height={7} fill="#3b82f6" rx={1} />
        <text x={padL + 12} y={H + 37} fontSize={9} fill="#64748b">{aLabel}</text>
        <rect x={padL + 80} y={H + 30} width={9} height={7} fill="#22c55e" rx={1} />
        <text x={padL + 93} y={H + 37} fontSize={9} fill="#64748b">{bLabel}</text>
      </svg>
    </div>
  )
}

/* ─── Rich response renderer ────────────────────────────────────── */
function RichResponse({ rich }: { rich: RichContent }) {
  const [thoughtOpen, setThoughtOpen] = useState(false)
  const [openQ, setOpenQ] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, fontSize: 13, color: DS.text, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Thought process ── */}
      <div style={{ border: `1px solid ${DS.purpleBorder}`, borderRadius: 12, overflow: 'hidden', background: DS.purpleSoft, marginBottom: 14 }}>
        <button onClick={() => setThoughtOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <RiSparklingLine size={12} color={DS.purple} />
          <span style={{ fontSize: 11, color: DS.purple, fontWeight: 600 }}>Thought for {rich.thoughtSecs}s</span>
          <span style={{ marginLeft: 'auto', color: DS.textFaint }}>{thoughtOpen ? <HiOutlineChevronDown size={12} /> : <HiOutlineChevronRight size={12} />}</span>
        </button>
        {thoughtOpen && (
          <div style={{ padding: '4px 12px 10px', borderTop: `1px solid rgba(124,58,237,0.12)` }}>
            {rich.thoughtProcess.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginTop: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: DS.purple, marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#6d28d9', lineHeight: 1.55 }}>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mandate title + intro ── */}
      <div style={{ fontWeight: 800, fontSize: 15, color: DS.text, marginBottom: 6 }}>
        {rich.mandateTitle} —{' '}
        <span style={{ color: DS.accent, fontWeight: 700 }}>{rich.companyName}</span>
      </div>
      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: DS.textSub, lineHeight: 1.8 }}>{rich.intro}</p>

      {/* ── Sections ── */}
      {rich.sections.map(sec => (
        <div key={sec.num} style={{ marginBottom: 22 }}>
          {/* Section heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #1e3a8a, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{sec.num}</div>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: DS.text }}>{sec.title}</span>
          </div>

          {/* Intro paragraph */}
          {sec.intro && <p style={{ margin: '0 0 10px', fontSize: 12.5, color: DS.textSub, lineHeight: 1.8 }}>{sec.intro}</p>}

          {/* Qualifies bullets (green) */}
          {sec.qualifies && !sec.breaks && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
              {sec.qualifies.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: DS.accent, marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.7 }}>{q}</span>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {sec.table && (
            <div style={{ border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {sec.table.headers.map((h, i) => (
                      <th key={i} style={{ padding: '8px 11px', textAlign: i === 0 ? 'left' : 'right', color: DS.textSub, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${DS.border}`, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sec.table.rows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafbff' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '7px 11px', textAlign: ci === 0 ? 'left' : 'right', color: ci === 0 ? DS.textSub : DS.text, fontSize: 12, borderBottom: `1px solid ${DS.border}`, fontWeight: ci === 0 ? 500 : 400, fontVariantNumeric: ci > 0 ? 'tabular-nums' : undefined }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bar chart */}
          {sec.barChart && (
            <div style={{ padding: '14px', background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, marginBottom: 10 }}>
              <PairBarChart {...sec.barChart} />
            </div>
          )}

          {/* Snapshot table */}
          {sec.snapshotRows && (
            <div style={{ border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '7px 11px', textAlign: 'left', fontSize: 11, color: DS.textSub, fontWeight: 600, borderBottom: `1px solid ${DS.border}`, width: '28%' }}>Category</th>
                    <th style={{ padding: '7px 11px', textAlign: 'left', fontSize: 11, color: DS.textSub, fontWeight: 600, borderBottom: `1px solid ${DS.border}` }}>Current snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.snapshotRows.map((r, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafbff' }}>
                      <td style={{ padding: '8px 11px', fontWeight: 600, fontSize: 12, color: DS.text, borderBottom: `1px solid ${DS.border}`, verticalAlign: 'top' }}>{r.category}</td>
                      <td style={{ padding: '8px 11px', fontSize: 12, color: DS.textSub, lineHeight: 1.65, borderBottom: `1px solid ${DS.border}`, fontVariantNumeric: 'tabular-nums' }} dangerouslySetInnerHTML={{ __html: r.detail.replace(/(\d+\.?\d*%|\d+\.?\d*x)/g, '<strong style="color:#0f172a">$1</strong>') }} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Qualifies + Breaks two-column */}
          {sec.qualifies && sec.breaks && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: DS.green, letterSpacing: '0.07em', marginBottom: 8 }}>QUALIFIES (KEEP/ACCUMULATE)</div>
                {sec.qualifies.map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: DS.green, marginTop: 7, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: '#14532d', lineHeight: 1.65 }}>{q}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: DS.redSoft, border: `1px solid ${DS.redBorder}`, borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: DS.red, letterSpacing: '0.07em', marginBottom: 8 }}>BREAKS (REDUCE/EXIT)</div>
                {sec.breaks.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: DS.red, marginTop: 7, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: '#7f1d1d', lineHeight: 1.65 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investment checklist */}
          {sec.checklist && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                {sec.checklist.map((item, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: DS.surface, border: `1px solid ${item.pass === true ? DS.greenBorder : item.pass === false ? DS.redBorder : DS.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 9, color: DS.textFaint, fontWeight: 600, letterSpacing: '0.06em' }}>{item.label.toUpperCase()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: item.pass === true ? DS.green : item.pass === false ? DS.red : '#92400e' }}>{item.sub}</span>
                      <span style={{ fontSize: 14 }}>{item.pass === true ? '✓' : item.pass === false ? '✗' : '~'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ── Related questions ── */}
      {rich.relatedQuestions.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <HiOutlineLightBulb size={11} /> RELATED QUESTIONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {rich.relatedQuestions.map((q, i) => (
              <div key={i} style={{ border: `1px solid ${DS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setOpenQ(openQ === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', background: '#fafbff', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: '#334155', gap: 8 }}>
                  <span>{q}</span>
                  {openQ === i ? <HiOutlineChevronDown size={12} color={DS.textFaint} /> : <HiOutlineChevronRight size={12} color={DS.textFaint} />}
                </button>
                {openQ === i && (
                  <div style={{ padding: '9px 13px', background: DS.surface, borderTop: `1px solid ${DS.border}`, fontSize: 12, color: DS.textSub, lineHeight: 1.7 }}>
                    Ask this question in the chat to get a full AI-generated response with detailed financial analysis.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Thinking bubble ────────────────────────────────────────────── */
function ThinkingBubble({ phase }: { phase: number }) {
  return (
    <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <RiSparklingLine size={13} color={DS.purple} />
        <span style={{ fontSize: 11, color: DS.purple, fontWeight: 600 }}>Analyzing…</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: DS.purple, animation: `pulse 1.1s ease-in-out ${i * 0.2}s infinite` }} />)}
        </div>
      </div>
      {THINK_STEPS.slice(0, phase + 1).map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: i < phase ? DS.green : DS.accentSoft, border: `1px solid ${i < phase ? DS.green : DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {i < phase ? <HiOutlineCheck size={8} color={DS.green} /> : <div style={{ width: 4, height: 4, borderRadius: '50%', background: DS.accent }} />}
          </div>
          <span style={{ fontSize: 11, color: i < phase ? DS.textSub : DS.text }}>{step}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Config modal ───────────────────────────────────────────────── */
type CfgMode = 'existing' | 'new'

function SL({ label }: { label: string }) {
  return <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.08em', marginBottom: 7, marginTop: 16 }}>{label}</div>
}

function ConfigModal({ form, setForm, botConfigs, activeBotConfigId, onClose, onSaveNew, onUpdate, onDelete, onActivate, savedScreeners, onNavigateToScreener }: {
  form: ConfigForm; setForm: React.Dispatch<React.SetStateAction<ConfigForm>>
  botConfigs: BotConfig[]; activeBotConfigId: number | null
  onClose: () => void
  onSaveNew: (data?: { name: string; sectors: string[]; companies: string[]; metrics: string[]; responseStyle: 'concise' | 'detailed' | 'analytical' }) => void
  onUpdate: (id: number) => void
  onDelete: (id: number) => void
  onActivate: (id: number | null) => void
  savedScreeners: SavedScreener[]
  onNavigateToScreener: () => void
}) {
  const [mode, setMode] = useState<CfgMode>('existing')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)
  const [metricSearch, setMetricSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))
  const [companiesSectorTab, setCompaniesSectorTab] = useState<string>('')
  const [formCompanySearch, setFormCompanySearch] = useState('')

  // Create New state
  const [createSource, setCreateSource] = useState<'screener' | 'scratch'>('screener')
  const [selectedScreenerId, setSelectedScreenerId] = useState<number | null>(null)
  const [createCompanies, setCreateCompanies] = useState<string[]>([])
  const [createCompanySearch, setCreateCompanySearch] = useState('')
  const [createMetrics, setCreateMetrics] = useState<string[]>([])
  const [createName, setCreateName] = useState('')
  const [createMetricSearch, setCreateMetricSearch] = useState('')
  const [createExpandedGroups, setCreateExpandedGroups] = useState<Set<string>>(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))

  const switchMode = (m: CfgMode) => {
    setMode(m); setEditingId(null)
    if (m === 'new') { setSelectedScreenerId(null); setCreateCompanies([]); setCreateCompanySearch(''); setCreateMetrics([]); setCreateName(''); setCreateSource('screener') }
    if (m === 'existing') setForm({ ...DEFAULT_CFG })
  }

  const startEdit = (cfg: BotConfig) => {
    setEditingId(cfg.id)
    setFormCompanySearch('')
    setForm({ name: cfg.name, sectors: cfg.sectors, companies: cfg.companies, timePeriod: cfg.timePeriod, years: cfg.years, quarters: cfg.quarters, metrics: cfg.metrics, responseStyle: cfg.responseStyle, promptInstructions: cfg.promptInstructions })
    setMode('existing')
  }

  const toggleSector = (s: string) => setForm(f => {
    const sectorIn = f.sectors.includes(s)
    const newSectors = sectorIn ? f.sectors.filter(x => x !== s) : [...f.sectors, s]
    const newCos = Array.from(new Set(newSectors.flatMap(sec => SECTOR_COMPANIES[sec] ?? [])))
    return { ...f, sectors: newSectors, companies: newCos }
  })
  const toggleM = (m: string) => setForm(f => ({ ...f, metrics: f.metrics.includes(m) ? f.metrics.filter(x => x !== m) : [...f.metrics, m] }))
  const toggleGrp = (g: string) => setExpandedGroups(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n })
  const fmtMetrics = (list: string[]) => metricSearch ? list.filter(m => m.toLowerCase().includes(metricSearch.toLowerCase())) : list

  const toggleCreateM = (m: string) => setCreateMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  const toggleCreateGrp = (g: string) => setCreateExpandedGroups(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n })
  const fmtCreateMetrics = (list: string[]) => createMetricSearch ? list.filter(m => m.toLowerCase().includes(createMetricSearch.toLowerCase())) : list

  // Infer sectors from companies
  const inferSectors = (companies: string[]) =>
    Object.entries(SECTOR_COMPANIES)
      .filter(([, members]) => members.some(c => companies.includes(c)))
      .map(([sec]) => sec)

  const selectScreener = (sc: SavedScreener | null) => {
    if (!sc) { setSelectedScreenerId(null); setCreateCompanies([]); setCreateCompanySearch(''); setCreateName(''); return }
    setSelectedScreenerId(sc.id)
    setCreateCompanySearch('')
    setCreateCompanies(sc.results.map(r => r.company))
    setCreateName(`From ${sc.name}`)
  }

  const handleCreateNew = () => {
    if (!createName.trim() || createCompanies.length === 0) return
    const sectors = inferSectors(createCompanies)
    const metrics = createMetrics.length ? createMetrics : FREQUENTLY_USED_METRICS
    onSaveNew({ name: createName, sectors, companies: createCompanies, metrics, responseStyle: 'analytical' })
    onClose()
  }

  const handleCreateFromScratch = () => {
    if (!form.name.trim()) return
    onSaveNew(); onClose()
  }

  const Chip = ({ label, sel, onClick }: { label: string; sel: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ textAlign: 'left', padding: '4px 8px', minHeight: 24, borderRadius: 6, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : '#475569', fontSize: 10, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      <div style={{ width: 11, height: 11, borderRadius: 3, border: `1px solid ${sel ? DS.accent : 'rgba(100,116,139,0.3)'}`, background: sel ? DS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {sel && <HiOutlineCheck size={7} color="#fff" />}
      </div>
      {label}
    </button>
  )

  const showForm = editingId !== null

  return (
    <div style={{ position: 'fixed', inset: 0, background: DS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div className="finbot-config-modal" style={{ background: DS.surface, borderRadius: 12, width: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 28px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.03)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '14px 18px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: DS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HiOutlineCog6Tooth size={14} color="#fff" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: DS.text }}>Personalize FinBot</div>
            <button onClick={onClose} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textSub }}>
              <HiOutlineXMark size={14} />
            </button>
          </div>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
            {(['existing', 'new'] as CfgMode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                style={{ flex: 1, padding: '5px 10px', minHeight: 26, borderRadius: 6, border: 'none', background: mode === m ? DS.surface : 'transparent', color: mode === m ? DS.accent : DS.textSub, fontSize: 11, fontWeight: mode === m ? 700 : 500, cursor: 'pointer', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {m === 'existing' ? <RiSparklingLine size={12} color={mode === m ? DS.accent : DS.textFaint} /> : <HiOutlineSparkles size={12} color={mode === m ? DS.accent : DS.textFaint} />}
                {m === 'existing' ? 'Existing' : 'Create New'}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: DS.border, margin: '12px -18px 0' }} />
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 18px 18px' }}>

          {/* ── EXISTING tab ── */}
          {mode === 'existing' && !showForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {botConfigs.map(cfg => {
                const isDefault = cfg.id === DEFAULT_BOT_CONFIG_ID
                const isActive = cfg.id === activeBotConfigId
                const confirmingDelete = deleteConfirmId === cfg.id
                const isExpanded = expandedCardId === cfg.id
                const summary = [
                  cfg.sectors.length > 0 ? `${cfg.sectors.length} sector${cfg.sectors.length > 1 ? 's' : ''}` : null,
                  `${cfg.companies.length} companies`,
                  `${cfg.metrics.length} metrics`,
                  cfg.responseStyle,
                ].filter(Boolean).join(' · ')
                return (
                  <div key={cfg.id} style={{ border: `1px solid ${isActive ? DS.accentBorder : DS.border}`, borderRadius: 8, padding: '7px 9px', background: isActive ? 'rgba(37,99,235,0.03)' : DS.surface, boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      {isDefault && <RiSparklingLine size={11} color={isActive ? DS.accent : DS.textFaint} style={{ flexShrink: 0 }} />}
                      <span style={{ fontWeight: 700, fontSize: 12, color: isActive ? DS.accent : DS.text, flex: 1 }}>{cfg.name}</span>
                      {isDefault && <span style={{ fontSize: 8, color: DS.purple, background: DS.purpleSoft, padding: '1px 5px', borderRadius: 5, fontWeight: 700 }}>DEFAULT</span>}
                      {isActive && <span style={{ fontSize: 8, color: DS.green, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, padding: '1px 5px', borderRadius: 5, fontWeight: 700 }}>ACTIVE</span>}
                      <button onClick={() => setExpandedCardId(isExpanded ? null : cfg.id)}
                        style={{ width: 24, height: 24, borderRadius: 6, background: isExpanded ? DS.accentSoft : 'transparent', border: `1px solid ${isExpanded ? DS.accentBorder : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isExpanded ? DS.accent : DS.textFaint, flexShrink: 0, transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent }}
                        onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = DS.textFaint } }}>
                        <HiOutlineEye size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: DS.textFaint, marginBottom: 6 }}>{summary || 'No settings configured'}</div>
                    {isExpanded && (
                      <div style={{ background: DS.surfaceHover, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '9px 11px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                          { label: 'SECTORS', value: cfg.sectors.join(', ') || '—' },
                          { label: 'COMPANIES', value: cfg.companies.slice(0, 6).join(', ') + (cfg.companies.length > 6 ? ` +${cfg.companies.length - 6}` : '') || '—' },
                          { label: 'METRICS', value: cfg.metrics.slice(0, 6).join(' · ') + (cfg.metrics.length > 6 ? ` +${cfg.metrics.length - 6}` : '') || '—' },
                          { label: 'STYLE', value: cfg.responseStyle },
                          ...(cfg.promptInstructions ? [{ label: 'NOTES', value: cfg.promptInstructions }] : []),
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 9, fontWeight: 600, color: DS.textFaint, width: 66, flexShrink: 0, paddingTop: 1.5 }}>{row.label}</span>
                            <span style={{ fontSize: 11, color: DS.text, lineHeight: 1.5, flex: 1 }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {confirmingDelete ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { onDelete(cfg.id); setDeleteConfirmId(null) }} style={{ flex: 1, padding: '4px 9px', minHeight: 24, borderRadius: 6, border: `1px solid ${DS.redBorder}`, background: DS.redSoft, color: DS.red, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Confirm Delete</button>
                        <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '4px 9px', minHeight: 24, borderRadius: 6, border: `1px solid ${DS.border}`, background: 'transparent', color: DS.textSub, fontSize: 10, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(cfg)} style={{ flex: 1, padding: '4px 9px', minHeight: 24, borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: 'transparent', color: DS.accent, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                        {!isActive && <button onClick={() => onActivate(cfg.id)} style={{ flex: 1, padding: '4px 9px', minHeight: 24, borderRadius: 6, border: 'none', background: DS.accent, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Activate</button>}
                        {isActive && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: DS.green, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, borderRadius: 6, padding: '4px 9px', minHeight: 24 }}><HiOutlineCheck size={11} /> Active</div>}
                        {!isDefault && <button onClick={() => setDeleteConfirmId(cfg.id)} style={{ width: 28, height: 24, borderRadius: 6, border: `1px solid ${DS.border}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textFaint }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = DS.redBorder; e.currentTarget.style.background = DS.redSoft; e.currentTarget.style.color = DS.red }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.textFaint }}>
                          <HiOutlineTrash size={12} />
                        </button>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── EDIT FORM (existing config) ── */}
          {mode === 'existing' && showForm && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => { setEditingId(null) }} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: DS.textSub, fontSize: 11 }}>
                ← Back to Existing
              </button>

              {/* SECTORS */}
              <SL label="SECTORS" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: DS.textFaint }}>{form.sectors.length > 0 ? `${form.sectors.length} selected` : 'None selected'}</span>
                <button onClick={() => setForm(f => ({ ...f, sectors: SECTORS.every(s => f.sectors.includes(s)) ? [] : [...SECTORS] }))}
                  style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                  {SECTORS.every(s => form.sectors.includes(s)) ? 'Clear all' : 'Select all'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                {SECTORS.map(s => <Chip key={s} label={s} sel={form.sectors.includes(s)} onClick={() => toggleSector(s)} />)}
              </div>

              {/* COMPANIES — sector tabs */}
              <SL label="COMPANIES" />
              {form.sectors.length === 0 ? (
                <div style={{ fontSize: 11, color: DS.textFaint, fontStyle: 'italic', marginBottom: 10 }}>Select sectors above to see companies</div>
              ) : (() => {
                const activeSec = form.sectors.includes(companiesSectorTab) ? companiesSectorTab : form.sectors[0]
                const secCos = SECTOR_COMPANIES[activeSec] ?? []
                const allCos = Array.from(new Set(form.sectors.flatMap(s => SECTOR_COMPANIES[s] ?? [])))
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: DS.textFaint }}>{form.companies.length} of {allCos.length} selected</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setForm(f => ({ ...f, companies: Array.from(new Set(f.sectors.flatMap(s => SECTOR_COMPANIES[s] ?? []))) }))}
                          style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>All</button>
                        <button onClick={() => setForm(f => ({ ...f, companies: [] }))}
                          style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.border}`, background: DS.surface, color: DS.textSub, cursor: 'pointer', fontWeight: 600 }}>None</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${DS.border}`, gap: 0 }}>
                      {form.sectors.map(sec => {
                        const isSel = sec === activeSec
                        const cnt = (SECTOR_COMPANIES[sec] ?? []).filter(co => form.companies.includes(co)).length
                        return (
                          <button key={sec} onClick={() => setCompaniesSectorTab(sec)}
                            style={{ padding: '7px 11px', background: 'none', border: 'none', borderBottom: isSel ? `2px solid ${DS.accent}` : '2px solid transparent', color: isSel ? DS.accent : DS.textSub, fontSize: 10, fontWeight: isSel ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            {sec}
                            <span style={{ fontSize: 8, background: isSel ? DS.accentBorder : '#e2e8f0', color: isSel ? DS.accent : DS.textFaint, borderRadius: 6, padding: '0 5px', lineHeight: '14px' }}>{cnt}/{SECTOR_COMPANIES[sec]?.length ?? 0}</span>
                          </button>
                        )
                      })}
                    </div>
                    <input value={formCompanySearch} onChange={e => setFormCompanySearch(e.target.value)} placeholder="Search companies…"
                      style={{ width: '100%', padding: '5px 9px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 10, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box', margin: '6px 0' }} />
                    <div style={{ maxHeight: 150, overflowY: 'auto', padding: 5, border: `1px solid ${DS.border}`, borderRadius: 7, marginBottom: 2 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {secCos.filter(co => co.toLowerCase().includes(formCompanySearch.toLowerCase())).map(co => {
                        const sel = form.companies.includes(co)
                        return (
                          <label key={co} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 7px', border: `1px solid ${sel ? DS.accentBorder : DS.border}`, borderRadius: 6, cursor: 'pointer', background: sel ? DS.accentSoft : DS.surface }}>
                            <input type="checkbox" checked={sel} onChange={() => setForm(f => ({ ...f, companies: sel ? f.companies.filter(c => c !== co) : [...f.companies, co] }))} style={{ accentColor: DS.accent, width: 12, height: 12, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: sel ? DS.accent : DS.text, fontWeight: sel ? 600 : 400, whiteSpace: 'nowrap' }}>{co}</span>
                          </label>
                        )
                      })}
                      </div>
                    </div>
                  </>
                )
              })()}

              {/* METRICS */}
              <SL label="METRICS" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {FREQUENTLY_USED_METRICS.map(m => {
                  const sel = form.metrics.includes(m)
                  return <button key={m} onClick={() => toggleM(m)} style={{ padding: '4px 9px', borderRadius: 6, fontSize: 10, background: sel ? DS.accent : DS.accentSoft, border: `1px solid ${sel ? DS.accent : DS.accentBorder}`, color: sel ? '#fff' : DS.accent, fontWeight: 600, cursor: 'pointer' }}>{m}</button>
                })}
              </div>
              <input value={metricSearch} onChange={e => setMetricSearch(e.target.value)} placeholder="Search metrics…"
                style={{ width: '100%', padding: '6px 10px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 11, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box', marginBottom: 7 }}
                onFocus={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }} onBlur={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(ANNUAL_METRIC_GROUPS).map(([grp, mlist]) => {
                  const vis = fmtMetrics(mlist); if (!vis.length) return null
                  const expanded = expandedGroups.has(grp)
                  const allSel = vis.every(m => form.metrics.includes(m))
                  return (
                    <div key={grp} style={{ border: `1px solid ${DS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: DS.surfaceHover, cursor: 'pointer', gap: 7 }} onClick={() => toggleGrp(grp)}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: DS.text, flex: 1 }}>{grp}</span>
                        <button onClick={e => { e.stopPropagation(); setForm(f => allSel ? ({ ...f, metrics: f.metrics.filter(m => !vis.includes(m)) }) : ({ ...f, metrics: Array.from(new Set([...f.metrics, ...vis])) })) }}
                          style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DS.accentBorder}`, background: 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                          {allSel ? 'Deselect' : 'All'}
                        </button>
                        {expanded ? <HiOutlineChevronDown size={10} color={DS.textFaint} /> : <HiOutlineChevronRight size={10} color={DS.textFaint} />}
                      </div>
                      {expanded && (
                        <div style={{ padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {vis.map(m => {
                            const sel = form.metrics.includes(m)
                            return <button key={m} onClick={() => toggleM(m)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : '#475569', fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>{sel && <HiOutlineCheck size={7} />}{m}</button>
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {form.metrics.length > 0 && <div style={{ marginTop: 5, fontSize: 10, color: DS.accent }}>{form.metrics.length} selected</div>}

              {/* RESPONSE STYLE */}
              <SL label="RESPONSE STYLE" />
              <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                {(['concise', 'detailed', 'analytical'] as const).map(st => (
                  <button key={st} onClick={() => setForm(f => ({ ...f, responseStyle: st }))}
                    style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1px solid ${form.responseStyle === st ? DS.accentBorder : DS.border}`, background: form.responseStyle === st ? DS.accentSoft : 'transparent', color: form.responseStyle === st ? DS.accent : DS.textSub, fontSize: 11, fontWeight: form.responseStyle === st ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>{st}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── CREATE NEW tab ── */}
          {mode === 'new' && (
            <div style={{ marginTop: 12 }}>
              {/* Source cards */}
              <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 8 }}>CHOOSE A STARTING POINT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
                {([
                  { id: 'screener' as const, icon: <HiOutlineAdjustmentsHorizontal size={22} />, title: 'From Screener', desc: 'Use an existing saved screener as the company base' },
                  { id: 'scratch' as const, icon: <HiOutlinePencilSquare size={22} />, title: 'From Scratch', desc: 'Manually pick sectors, companies, and metrics' },
                ] as const).map(opt => {
                  const isSel = createSource === opt.id
                  return (
                    <button key={opt.id} onClick={() => setCreateSource(opt.id)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '8px 9px', borderRadius: 8, border: `1px solid ${isSel ? DS.accentBorder : DS.border}`, background: isSel ? DS.accentSoft : '#fafafa', cursor: 'pointer', textAlign: 'left', transition: 'all 0.14s', boxShadow: isSel ? '0 2px 8px rgba(37,99,235,0.08)' : 'none' }}
                      onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.background = 'rgba(37,99,235,0.03)' } }}
                      onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = '#fafafa' } }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: isSel ? DS.accent : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.14s' }}>
                        <span style={{ color: isSel ? '#fff' : DS.textFaint }}>{opt.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? DS.accent : DS.text, marginBottom: 2 }}>{opt.title}</div>
                        <div style={{ fontSize: 9, color: DS.textFaint, lineHeight: 1.4 }}>{opt.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {createSource === 'screener' && (
                <>
              {/* Step 1: Pick a screener */}
              <SL label="STEP 1 — SELECT A SCREENER" />
              {savedScreeners.length === 0 ? (
                <div style={{ background: DS.surfaceHover, border: `1px dashed ${DS.accentBorder}`, borderRadius: 10, padding: '18px 16px', textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: DS.textSub, marginBottom: 10, lineHeight: 1.6 }}>No saved screeners yet. Run a screener and save it first, then come back here to create a personalization from it.</div>
                  <button onClick={onNavigateToScreener}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: DS.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(37,99,235,0.25)' }}>
                    <HiOutlineSparkles size={13} /> Go to Screener
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 132, overflowY: 'auto', marginBottom: 10, paddingRight: 2 }}>
                  {savedScreeners.map(sc => {
                    const isSel = selectedScreenerId === sc.id
                    return (
                      <button key={sc.id} onClick={() => selectScreener(isSel ? null : sc)}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6, border: `1px solid ${isSel ? DS.accentBorder : DS.border}`, background: isSel ? DS.accentSoft : DS.surface, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: isSel ? DS.accent : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <HiOutlineAdjustmentsHorizontal size={12} color={isSel ? '#fff' : DS.textFaint} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? DS.accent : DS.text }}>{sc.name}</div>
                          <div style={{ fontSize: 9, color: DS.textFaint, marginTop: 1 }}>{sc.results.length} companies · {sc.query.slice(0, 40)}{sc.query.length > 40 ? '…' : ''}</div>
                        </div>
                        {isSel && <HiOutlineCheck size={14} color={DS.accent} />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Step 2: Companies auto-shown from screener */}
              {selectedScreenerId !== null && (() => {
                const sc = savedScreeners.find(s => s.id === selectedScreenerId)!
                const sectors = inferSectors(createCompanies)
                return (
                  <>
                    <SL label="STEP 2 — COMPANIES (FROM SCREENER)" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <span style={{ fontSize: 10, color: DS.textFaint }}>{createCompanies.length} of {sc.results.length} selected</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setCreateCompanies(sc.results.map(r => r.company))}
                          style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>All</button>
                        <button onClick={() => setCreateCompanies([])}
                          style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.border}`, background: DS.surface, color: DS.textSub, cursor: 'pointer', fontWeight: 600 }}>None</button>
                      </div>
                    </div>
                    {/* Group by inferred sectors */}
                    {sectors.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {sectors.map(sec => <span key={sec} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent }}>{sec.split(' ')[0]}</span>)}
                        </div>
                      </div>
                    )}
                    <input value={createCompanySearch} onChange={e => setCreateCompanySearch(e.target.value)} placeholder="Search companies…"
                      style={{ width: '100%', padding: '5px 9px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 10, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
                    <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 10, padding: 5, border: `1px solid ${DS.border}`, borderRadius: 7 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {sc.results.filter(r => r.company.toLowerCase().includes(createCompanySearch.toLowerCase())).map(r => {
                          const sel = createCompanies.includes(r.company)
                          return (
                            <label key={r.company} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 7px', border: `1px solid ${sel ? DS.accentBorder : DS.border}`, borderRadius: 6, cursor: 'pointer', background: sel ? DS.accentSoft : DS.surface, maxWidth: '100%' }}>
                              <input type="checkbox" checked={sel}
                                onChange={() => setCreateCompanies(prev => sel ? prev.filter(c => c !== r.company) : [...prev, r.company])}
                                style={{ accentColor: DS.accent, width: 12, height: 12, flexShrink: 0 }} />
                              <span style={{ fontSize: 10, color: sel ? DS.accent : DS.text, fontWeight: sel ? 600 : 400, whiteSpace: 'nowrap' }}>{r.company}</span>
                              <span style={{ fontSize: 8, color: DS.textFaint, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>₹{r.price}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Step 3: Metrics */}
                    <SL label="STEP 3 — METRICS" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {FREQUENTLY_USED_METRICS.map(m => {
                        const sel = createMetrics.includes(m)
                        return <button key={m} onClick={() => toggleCreateM(m)} style={{ padding: '4px 9px', borderRadius: 6, fontSize: 10, background: sel ? DS.accent : DS.accentSoft, border: `1px solid ${sel ? DS.accent : DS.accentBorder}`, color: sel ? '#fff' : DS.accent, fontWeight: 600, cursor: 'pointer' }}>{m}</button>
                      })}
                    </div>
                    <input value={createMetricSearch} onChange={e => setCreateMetricSearch(e.target.value)} placeholder="Search metrics…"
                      style={{ width: '100%', padding: '6px 10px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 11, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box', marginBottom: 7 }}
                      onFocus={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }} onBlur={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                      {Object.entries(ANNUAL_METRIC_GROUPS).map(([grp, mlist]) => {
                        const vis = fmtCreateMetrics(mlist); if (!vis.length) return null
                        const expanded = createExpandedGroups.has(grp)
                        const allSel = vis.every(m => createMetrics.includes(m))
                        return (
                          <div key={grp} style={{ border: `1px solid ${DS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: DS.surfaceHover, cursor: 'pointer', gap: 7 }} onClick={() => toggleCreateGrp(grp)}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: DS.text, flex: 1 }}>{grp}</span>
                              <button onClick={e => { e.stopPropagation(); setCreateMetrics(prev => allSel ? prev.filter(m => !vis.includes(m)) : Array.from(new Set([...prev, ...vis]))) }}
                                style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DS.accentBorder}`, background: 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                                {allSel ? 'Deselect' : 'All'}
                              </button>
                              {expanded ? <HiOutlineChevronDown size={10} color={DS.textFaint} /> : <HiOutlineChevronRight size={10} color={DS.textFaint} />}
                            </div>
                            {expanded && (
                              <div style={{ padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {vis.map(m => {
                                  const sel = createMetrics.includes(m)
                                  return <button key={m} onClick={() => toggleCreateM(m)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : '#475569', fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>{sel && <HiOutlineCheck size={7} />}{m}</button>
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {createMetrics.length > 0 && <div style={{ fontSize: 10, color: DS.accent, marginBottom: 12 }}>{createMetrics.length} metrics selected</div>}

                    {/* Step 4: Name */}
                    <SL label="STEP 4 — NAME" />
                    <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g., IT Growth Config"
                      style={{ width: '100%', padding: '8px 11px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }} onBlur={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }} />
                  </>
                )
              })()}
                </>
              )}

              {/* ── FROM SCRATCH flow ── */}
              {createSource === 'scratch' && (
                <div>
                  {/* SECTORS */}
                  <SL label="SECTORS" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <span style={{ fontSize: 10, color: DS.textFaint }}>{form.sectors.length > 0 ? `${form.sectors.length} selected` : 'None selected'}</span>
                    <button onClick={() => setForm(f => ({ ...f, sectors: SECTORS.every(s => f.sectors.includes(s)) ? [] : [...SECTORS] }))}
                      style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                      {SECTORS.every(s => form.sectors.includes(s)) ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 12 }}>
                    {SECTORS.map(s => <Chip key={s} label={s} sel={form.sectors.includes(s)} onClick={() => toggleSector(s)} />)}
                  </div>

                  {/* COMPANIES */}
                  <SL label="COMPANIES" />
                  {form.sectors.length === 0 ? (
                    <div style={{ fontSize: 11, color: DS.textFaint, fontStyle: 'italic', marginBottom: 10 }}>Select sectors above to see companies</div>
                  ) : (() => {
                    const activeSec = form.sectors.includes(companiesSectorTab) ? companiesSectorTab : form.sectors[0]
                    const secCos = SECTOR_COMPANIES[activeSec] ?? []
                    const allCos = Array.from(new Set(form.sectors.flatMap(s => SECTOR_COMPANIES[s] ?? [])))
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: DS.textFaint }}>{form.companies.length} of {allCos.length} selected</span>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => setForm(f => ({ ...f, companies: Array.from(new Set(f.sectors.flatMap(s => SECTOR_COMPANIES[s] ?? []))) }))}
                              style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>All</button>
                            <button onClick={() => setForm(f => ({ ...f, companies: [] }))}
                              style={{ fontSize: 9, padding: '2px 9px', borderRadius: 6, border: `1px solid ${DS.border}`, background: DS.surface, color: DS.textSub, cursor: 'pointer', fontWeight: 600 }}>None</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${DS.border}`, gap: 0 }}>
                          {form.sectors.map(sec => {
                            const isSel = sec === activeSec
                            const cnt = (SECTOR_COMPANIES[sec] ?? []).filter(co => form.companies.includes(co)).length
                            return (
                              <button key={sec} onClick={() => setCompaniesSectorTab(sec)}
                                style={{ padding: '7px 11px', background: 'none', border: 'none', borderBottom: isSel ? `2px solid ${DS.accent}` : '2px solid transparent', color: isSel ? DS.accent : DS.textSub, fontSize: 10, fontWeight: isSel ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                {sec}
                                <span style={{ fontSize: 8, background: isSel ? DS.accentBorder : '#e2e8f0', color: isSel ? DS.accent : DS.textFaint, borderRadius: 6, padding: '0 5px', lineHeight: '14px' }}>{cnt}/{SECTOR_COMPANIES[sec]?.length ?? 0}</span>
                              </button>
                            )
                          })}
                        </div>
                        <input value={formCompanySearch} onChange={e => setFormCompanySearch(e.target.value)} placeholder="Search companies…"
                          style={{ width: '100%', padding: '5px 9px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 10, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box', margin: '6px 0' }} />
                        <div style={{ maxHeight: 130, overflowY: 'auto', padding: 5, border: `1px solid ${DS.border}`, borderRadius: 7, marginBottom: 10 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {secCos.filter(co => co.toLowerCase().includes(formCompanySearch.toLowerCase())).map(co => {
                            const sel = form.companies.includes(co)
                            return (
                              <label key={co} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 7px', border: `1px solid ${sel ? DS.accentBorder : DS.border}`, borderRadius: 6, cursor: 'pointer', background: sel ? DS.accentSoft : DS.surface }}>
                                <input type="checkbox" checked={sel} onChange={() => setForm(f => ({ ...f, companies: sel ? f.companies.filter(c => c !== co) : [...f.companies, co] }))} style={{ accentColor: DS.accent, width: 12, height: 12, flexShrink: 0 }} />
                                <span style={{ fontSize: 10, color: sel ? DS.accent : DS.text, fontWeight: sel ? 600 : 400, whiteSpace: 'nowrap' }}>{co}</span>
                              </label>
                            )
                          })}
                          </div>
                        </div>
                      </>
                    )
                  })()}

                  {/* METRICS */}
                  <SL label="METRICS" />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {FREQUENTLY_USED_METRICS.map(m => {
                      const sel = form.metrics.includes(m)
                      return <button key={m} onClick={() => toggleM(m)} style={{ padding: '4px 9px', borderRadius: 6, fontSize: 10, background: sel ? DS.accent : DS.accentSoft, border: `1px solid ${sel ? DS.accent : DS.accentBorder}`, color: sel ? '#fff' : DS.accent, fontWeight: 600, cursor: 'pointer' }}>{m}</button>
                    })}
                  </div>
                  <input value={metricSearch} onChange={e => setMetricSearch(e.target.value)} placeholder="Search metrics…"
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 11, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box', marginBottom: 7 }}
                    onFocus={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }} onBlur={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {Object.entries(ANNUAL_METRIC_GROUPS).map(([grp, mlist]) => {
                      const vis = fmtMetrics(mlist); if (!vis.length) return null
                      const expanded = expandedGroups.has(grp)
                      const allSel = vis.every(m => form.metrics.includes(m))
                      return (
                        <div key={grp} style={{ border: `1px solid ${DS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: DS.surfaceHover, cursor: 'pointer', gap: 7 }} onClick={() => toggleGrp(grp)}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: DS.text, flex: 1 }}>{grp}</span>
                            <button onClick={e => { e.stopPropagation(); setForm(f => allSel ? ({ ...f, metrics: f.metrics.filter(m => !vis.includes(m)) }) : ({ ...f, metrics: Array.from(new Set([...f.metrics, ...vis])) })) }}
                              style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DS.accentBorder}`, background: 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                              {allSel ? 'Deselect' : 'All'}
                            </button>
                            {expanded ? <HiOutlineChevronDown size={10} color={DS.textFaint} /> : <HiOutlineChevronRight size={10} color={DS.textFaint} />}
                          </div>
                          {expanded && (
                            <div style={{ padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {vis.map(m => {
                                const sel = form.metrics.includes(m)
                                return <button key={m} onClick={() => toggleM(m)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : '#475569', fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>{sel && <HiOutlineCheck size={7} />}{m}</button>
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {form.metrics.length > 0 && <div style={{ fontSize: 10, color: DS.accent, marginBottom: 10 }}>{form.metrics.length} metrics selected</div>}

                  {/* NAME */}
                  <SL label="NAME" />
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., My IT Config"
                    style={{ width: '100%', padding: '8px 11px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }} onBlur={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = 'none' }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '9px 18px', borderTop: `1px solid ${DS.border}`, display: 'flex', gap: 7, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '5px 10px', minHeight: 26, border: `1px solid ${DS.borderMed}`, borderRadius: 6, background: DS.surface, color: DS.textSub, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
          {mode === 'existing' && showForm && editingId !== null && (
            <button onClick={() => { onUpdate(editingId); setEditingId(null) }}
              style={{ flex: 1, padding: '5px 10px', minHeight: 26, border: 'none', borderRadius: 6, background: DS.accent, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(37,99,235,0.25)' }}>
              Save Changes
            </button>
          )}
          {mode === 'new' && createSource === 'screener' && selectedScreenerId !== null && (
            <button onClick={handleCreateNew} disabled={!createName.trim() || createCompanies.length === 0}
              style={{ flex: 1, padding: '5px 10px', minHeight: 26, border: 'none', borderRadius: 6, background: createName.trim() && createCompanies.length > 0 ? DS.accent : '#e2e8f0', color: createName.trim() && createCompanies.length > 0 ? '#fff' : '#94a3b8', fontSize: 11, fontWeight: 700, cursor: createName.trim() && createCompanies.length > 0 ? 'pointer' : 'not-allowed', boxShadow: createName.trim() && createCompanies.length > 0 ? '0 3px 12px rgba(37,99,235,0.25)' : 'none' }}>
              Create Personalization
            </button>
          )}
          {mode === 'new' && createSource === 'scratch' && (
            <button onClick={handleCreateFromScratch} disabled={!form.name.trim() || form.companies.length === 0}
              style={{ flex: 1, padding: '5px 10px', minHeight: 26, border: 'none', borderRadius: 6, background: form.name.trim() && form.companies.length > 0 ? DS.accent : '#e2e8f0', color: form.name.trim() && form.companies.length > 0 ? '#fff' : '#94a3b8', fontSize: 11, fontWeight: 700, cursor: form.name.trim() && form.companies.length > 0 ? 'pointer' : 'not-allowed', boxShadow: form.name.trim() && form.companies.length > 0 ? '0 3px 12px rgba(37,99,235,0.25)' : 'none' }}>
              Create Personalization
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Local import for Screener icon needed in Create New tab

/* ─── PDF export ────────────────────────────────────────────────── */
function richToHTML(rich: RichContent): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const sectionHTML = (sec: MandateSection) => {
    let html = `<div class="section">
      <div class="sec-head"><span class="num">${sec.num}</span><span>${esc(sec.title)}</span></div>`
    if (sec.intro) html += `<p>${esc(sec.intro)}</p>`
    if (sec.qualifies && !sec.breaks) {
      html += '<ul>' + sec.qualifies.map(q => `<li>${esc(q)}</li>`).join('') + '</ul>'
    }
    if (sec.table) {
      html += '<table><thead><tr>' + sec.table.headers.map(h => `<th>${esc(h)}</th>`).join('') + '</tr></thead><tbody>'
      html += sec.table.rows.map((row, ri) => `<tr class="${ri % 2 ? 'alt' : ''}">${row.map((c, ci) => `<td class="${ci > 0 ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')
      html += '</tbody></table>'
    }
    if (sec.snapshotRows) {
      html += '<table><thead><tr><th>Category</th><th>Current snapshot</th></tr></thead><tbody>'
      html += sec.snapshotRows.map((r, ri) => `<tr class="${ri % 2 ? 'alt' : ''}"><td><strong>${esc(r.category)}</strong></td><td>${esc(r.detail)}</td></tr>`).join('')
      html += '</tbody></table>'
    }
    if (sec.qualifies && sec.breaks) {
      html += '<div class="two-col">'
      html += '<div class="green-box"><div class="box-head">QUALIFIES</div>' + sec.qualifies.map(q => `<div class="bullet">• ${esc(q)}</div>`).join('') + '</div>'
      html += '<div class="red-box"><div class="box-head">BREAKS</div>' + sec.breaks.map(b => `<div class="bullet">• ${esc(b)}</div>`).join('') + '</div>'
      html += '</div>'
    }
    if (sec.checklist) {
      html += '<div class="checklist">'
      html += sec.checklist.map(item => `<div class="check-item ${item.pass === true ? 'pass' : item.pass === false ? 'fail' : 'neutral'}"><div class="check-label">${esc(item.label)}</div><div class="check-val">${esc(item.sub)} ${item.pass === true ? '✓' : item.pass === false ? '✗' : '~'}</div></div>`).join('')
      html += '</div>'
    }
    html += '</div>'
    return html
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(rich.mandateTitle)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #0f172a; margin: 32px 40px; line-height: 1.7; }
  h1 { font-size: 17px; font-weight: 800; margin: 0 0 4px; }
  .sub { color: #64748b; margin: 0 0 18px; font-size: 12px; }
  .section { margin-bottom: 22px; page-break-inside: avoid; }
  .sec-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  .num { background: #1e3a8a; color: #fff; border-radius: 5px; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
  p { color: #475569; margin: 0 0 10px; }
  ul { margin: 0 0 10px; padding-left: 18px; } li { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
  th { background: #f1f5f9; padding: 7px 10px; text-align: left; font-size: 10px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
  td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
  td.num { text-align: right; font-family: monospace; font-variant-numeric: tabular-nums; }
  tr.alt td { background: #fafbff; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .green-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px 12px; }
  .red-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; }
  .box-head { font-size: 9px; font-weight: 700; letter-spacing: .07em; margin-bottom: 7px; color: #64748b; }
  .green-box .box-head { color: #16a34a; } .red-box .box-head { color: #dc2626; }
  .bullet { font-size: 11px; margin-bottom: 5px; }
  .green-box .bullet { color: #14532d; } .red-box .bullet { color: #7f1d1d; }
  .checklist { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-bottom: 12px; }
  .check-item { border: 1px solid #e2e8f0; border-radius: 7px; padding: 8px 10px; }
  .check-item.pass { border-color: #86efac; } .check-item.fail { border-color: #fecaca; }
  .check-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px; }
  .check-val { font-size: 11px; font-weight: 700; }
  .check-item.pass .check-val { color: #16a34a; } .check-item.fail .check-val { color: #dc2626; } .check-item.neutral .check-val { color: #92400e; }
  @media print { body { margin: 16px 20px; } }
</style></head><body>
<h1>${esc(rich.mandateTitle)}</h1>
<p class="sub">${esc(rich.intro)}</p>
${rich.sections.map(sectionHTML).join('')}
</body></html>`
}

function downloadPDF(rich: RichContent) {
  const html = richToHTML(rich)
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.onload = () => { w.focus(); w.print() }
}

function downloadInvestorDeck(company: string, quarter: string) {
  const lines = [
    `${company} ${quarter} Investor Presentation`,
    'FinBot Research | Investor briefing',
    '',
    'This investor presentation is part of the reference data set and should be reviewed alongside the primary filings.',
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

/* ─── Reference table ───────────────────────────────────────────── */
/* Transposed: metrics as rows, companies as columns */
function RefTable({ rich, onClose, tableOnly = false }: { rich: RichContent; onClose?: () => void; tableOnly?: boolean }) {
  const fmt = (v: unknown) => (v !== undefined && v !== null && v !== '') ? String(v) : '—'
  const metrics = rich.referenceMetrics
  const companies = rich.referenceCompanies.slice(0, 6)
  const companyData = companies.map(co => {
    const data = getAnnualData(co)
    const yd = (data['2025'] ?? data['2024'] ?? data['2023'] ?? {}) as Record<string, unknown>
    return { co, yd }
  })
  const [tablePopup, setTablePopup] = useState(false)
  const [selectedNews, setSelectedNews] = useState<{ title: string; summary: string; date: string } | null>(null)
  const newsHeadlines = [
    {
      title: `${companies[0]} reports resilient performance in the latest financial year`,
      summary: `${companies[0]} continues to show consistent earnings quality, stable operating margins, and disciplined cash generation across the latest reporting periods.`,
      date: '23 Sep 2026',
    },
    {
      title: `${companies[0]} remains in focus as sector earnings and margins are tracked`,
      summary: `The market is monitoring ${companies[0]}'s operating leverage, working-capital discipline, and relative earnings quality against sector peers.`,
      date: '21 Sep 2026',
    },
    {
      title: `Analysts review ${companies[0]}'s cash generation and balance sheet strength`,
      summary: `Investors are focusing on the resilience of ${companies[0]}'s balance sheet, asset efficiency, and consistency of cash conversion in the current cycle.`,
      date: '18 Sep 2026',
    },
  ]
  const investorPresentations = ['Q1 FY2025', 'Q2 FY2025', 'Q3 FY2025', 'Q4 FY2025']
  if (companies.length === 0 || metrics.length === 0) return null
  return (
    <div style={{ width: tableOnly ? 'fit-content' : undefined, maxWidth: '100%', border: `1px solid ${DS.border}`, borderRadius: 10, overflow: 'hidden', background: DS.surface, boxShadow: '0 2px 8px rgba(37,99,235,0.04)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0 }}>
      <div style={{ border: `1px solid ${DS.border}`, borderRadius: 0, overflow: 'hidden', background: DS.surface, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#eef2ff', gap: 8, borderBottom: `1px solid ${DS.accentBorder}` }}>
        <HiOutlineTableCells size={12} color={DS.accent} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: DS.accent, letterSpacing: '0.06em' }}>REFERENCE DATA</span>
        {!tableOnly && <button onClick={() => setTablePopup(true)} title="Open reference table" aria-label="Open reference table" style={{ width: 20, height: 20, borderRadius: 4, background: DS.accentSoft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textSub, flexShrink: 0 }}>
          <HiOutlineChevronRight size={11} />
        </button>
        }
        {onClose && (
          <button onClick={onClose} style={{ width: 18, height: 18, borderRadius: 4, background: DS.accentSoft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textSub, flexShrink: 0 }}>
            <HiOutlineXMark size={10} />
          </button>
        )}
      </div>
      <div style={{ maxWidth: '100%', minHeight: 0, overflowX: 'auto', overflowY: 'auto', maxHeight: tableOnly ? 'min(55vh, 420px)' : 260, overscrollBehavior: 'contain' }}>
        <table style={{ width: 'max-content', minWidth: 650, borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f0f4ff' }}>
              <th style={{ padding: '6px 12px', textAlign: 'left', color: DS.textSub, fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap', minWidth: 130, position: 'sticky', top: 0, left: 0, zIndex: 2, background: '#f0f4ff' }}>Metric</th>
              {companyData.map(({ co }) => (
                <th key={co} style={{ padding: '6px 10px', textAlign: 'right', color: DS.accent, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 80, position: 'sticky', top: 0, zIndex: 1, background: '#f0f4ff' }}>{co}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={m} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                <td style={{ padding: '6px 12px', color: DS.text, fontWeight: 600, borderBottom: `1px solid ${DS.border}`, whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'inherit', fontSize: 10 }}>{m}</td>
                {companyData.map(({ co, yd }) => (
                  <td key={co} style={{ padding: '6px 10px', textAlign: 'right', color: fmt(yd[m]) === '—' ? DS.textFaint : DS.text, borderBottom: `1px solid ${DS.border}`, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(yd[m])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
        {!tableOnly && <>
        <div style={{ borderTop: `1px solid ${DS.border}`, background: DS.surface }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.accentSoft, color: DS.accent }}><HiOutlineNewspaper size={13} /></div>
            <div>
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>News</div>
              <div style={{ marginTop: 1, color: DS.textMuted, fontSize: 10 }}>Latest company coverage</div>
            </div>
          </div>
          <div style={{ maxWidth: '100%', maxHeight: 210, overflowX: 'auto', overflowY: 'auto', overscrollBehavior: 'contain' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', minWidth: 660 }}>
            {newsHeadlines.map((story, index) => (
              <button key={story.title} onClick={() => setSelectedNews(selectedNews && selectedNews.title === story.title ? null : story)} style={{ display: 'block', width: '100%', background: selectedNews?.title === story.title ? DS.accentSoft : DS.surface, border: 'none', borderRight: index < 2 ? `1px solid ${DS.border}` : 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: DS.accent, fontSize: 10, fontWeight: 700 }}><HiOutlineNewspaper size={12} /> MARKET BRIEF</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 7 }}><div style={{ color: DS.text, fontSize: 12, fontWeight: 500, lineHeight: 1.4, flex: 1 }}>{story.title}</div><HiOutlineChevronRight size={14} color={DS.accent} style={{ flexShrink: 0, marginTop: 2 }} /></div>
                <div style={{ marginTop: 7, color: DS.textMuted, fontSize: 9 }}>{story.date} · FinBot Research</div>
              </button>
            ))}
            </div>
          </div>
          {selectedNews !== null && (
            <div onClick={() => setSelectedNews(null)} style={{ position: 'fixed', inset: 0, background: DS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
              <div onClick={event => event.stopPropagation()} style={{ width: 'min(560px, 92vw)', background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, boxShadow: '0 18px 45px rgba(15,23,42,0.18)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#eef2ff', borderBottom: `1px solid ${DS.accentBorder}` }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.accentSoft, color: DS.accent }}><HiOutlineNewspaper size={13} /></div>
                  <div style={{ flex: 1, color: DS.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>NEWS ARTICLE</div>
                  <button onClick={() => setSelectedNews(null)} style={{ width: 18, height: 18, borderRadius: 4, background: DS.accentSoft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textSub, flexShrink: 0, fontSize: 12 }}>×</button>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ color: DS.textMuted, fontSize: 10, marginBottom: 8 }}>{selectedNews.date} · FinBot Research</div>
                  <div style={{ color: DS.text, fontSize: 18, fontWeight: 700, lineHeight: 1.35, marginBottom: 10 }}>{selectedNews.title}</div>
                  <div style={{ color: DS.textSub, fontSize: 12, lineHeight: 1.75 }}>{selectedNews.summary}</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${DS.border}`, background: DS.surfaceHover, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <div style={{ color: DS.text, fontSize: 12, fontWeight: 700 }}>Investor presentations</div>
              <div style={{ color: DS.textMuted, fontSize: 10 }}>{investorPresentations.length} available</div>
            </div>
            <div style={{ maxHeight: 150, overflowX: 'auto', overflowY: 'auto', overscrollBehavior: 'contain' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
              {investorPresentations.map(doc => (
                <div key={doc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 9px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: DS.text, fontSize: 10, fontWeight: 700 }}>{doc}</div>
                    <div style={{ color: DS.textMuted, fontSize: 9 }}>PDF download</div>
                  </div>
                  <button onClick={() => downloadInvestorDeck(companies[0], doc)} style={{ border: `1px solid ${DS.accentBorder}`, borderRadius: 5, background: DS.accentSoft, color: DS.accent, padding: '4px 7px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                    Download
                  </button>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
        </>}
      {tablePopup && (
        <div onClick={() => setTablePopup(false)} style={{ position: 'fixed', inset: 0, background: DS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
          <div onClick={event => event.stopPropagation()} style={{ width: 'fit-content', maxWidth: 'calc(100vw - 32px)', maxHeight: 'min(70vh, 520px)', overflow: 'hidden', borderRadius: 12 }}>
            <RefTable rich={rich} tableOnly onClose={() => setTablePopup(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function AIChat({
  botConfigs, activeBotConfigId, onSetActiveBotConfig,
  onAddBotConfig, onUpdateBotConfig, onDeleteBotConfig,
  chatSessions, activeChatId, onUpdateChat, onPersonalizeRef,
  savedScreeners, onNavigateToScreener, onMessageSent,
}: Props) {
  const ts = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkPhase, setThinkPhase] = useState(0)
  const [copied, setCopied] = useState<number | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [showRef, setShowRef] = useState<number | null>(null)
  const [showCoach, setShowCoach] = useState(() => !sessionStorage.getItem(PERSONALIZE_COACH_KEY))
  const bottomRef = useRef<HTMLDivElement>(null)
  const referenceMessageRef = useRef<HTMLDivElement>(null)

  // Register opener so sidebar's personalize button can trigger it
  useEffect(() => { onPersonalizeRef?.(() => setShowConfig(true)) }, [onPersonalizeRef])

  const activeCfg = botConfigs.find(c => c.id === activeBotConfigId)
  const effectiveCfg: ConfigForm = useMemo(() => {
    if (activeCfg) return { name: activeCfg.name, sectors: activeCfg.sectors, companies: activeCfg.companies, timePeriod: activeCfg.timePeriod, years: activeCfg.years, quarters: activeCfg.quarters, metrics: activeCfg.metrics, responseStyle: activeCfg.responseStyle, promptInstructions: activeCfg.promptInstructions }
    return { ...DEFAULT_CFG }
  }, [activeCfg])

  const [configForm, setConfigForm] = useState<ConfigForm>({ ...DEFAULT_CFG })

  const activeSession = chatSessions.find(s => s.id === activeChatId)
  const msgs = (activeSession?.messages ?? []) as (ChatMessage & { rich?: RichContent })[]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])
  useEffect(() => {
    if (showRef !== null) {
      requestAnimationFrame(() => referenceMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }, [showRef])

  const send = (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    const now = ts()
    const userMsg: ChatMessage = { role: 'user', text: msg, time: now, id: ++_msgId }
    onUpdateChat(activeChatId, s => ({
      ...s,
      title: s.messages.length === 0 ? msg.slice(0, 38) : s.title,
      messages: [...s.messages, userMsg],
    }))
    setInput(''); setLoading(true); setThinkPhase(0)
    onMessageSent?.(msg)
    const phases = [1, 2, 3]; phases.forEach((ph, i) => setTimeout(() => setThinkPhase(ph), 480 + i * 480))
    setTimeout(() => {
      const rich = generateRich(msg, effectiveCfg)
      const botMsg: ChatMessage = { role: 'assistant', text: msg, time: now, id: ++_msgId, rich: rich as unknown }
      onUpdateChat(activeChatId, s => ({ ...s, messages: [...s.messages, botMsg] }))
      setLoading(false)
    }, 2000)
  }

  const saveConfig = (override?: { name: string; sectors: string[]; companies: string[]; metrics: string[]; responseStyle: 'concise' | 'detailed' | 'analytical' }) => {
    const src = override ?? configForm
    const cos = src.companies.length ? src.companies : src.sectors.flatMap(s => SECTOR_COMPANIES[s] ?? [])
    const mets = src.metrics.length ? src.metrics : FREQUENTLY_USED_METRICS
    const cfg = onAddBotConfig({ name: src.name, sectors: src.sectors, companies: cos, timePeriod: configForm.timePeriod, years: configForm.years, quarters: configForm.quarters, metrics: mets, responseStyle: src.responseStyle, promptInstructions: configForm.promptInstructions })
    onSetActiveBotConfig(cfg.id)
  }
  const updateConfig = (id: number) => {
    const cos = configForm.companies.length ? configForm.companies : configForm.sectors.flatMap(s => SECTOR_COMPANIES[s] ?? [])
    const mets = configForm.metrics.length ? configForm.metrics : FREQUENTLY_USED_METRICS
    onUpdateBotConfig(id, { name: configForm.name, sectors: configForm.sectors, companies: cos, timePeriod: configForm.timePeriod, years: configForm.years, quarters: configForm.quarters, metrics: mets, responseStyle: configForm.responseStyle, promptInstructions: configForm.promptInstructions })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: DS.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DS.text, letterSpacing: '-0.02em', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeSession?.title ?? 'FinBot AI'}
            </div>
            <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 1 }}>NSE/BSE · Indian equities assistant</div>
          </div>

          {/* Active config chip */}
          <div style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: activeBotConfigId !== null ? DS.accentSoft : DS.purpleSoft, border: `1px solid ${activeBotConfigId !== null ? DS.accentBorder : DS.purpleBorder}`, borderRadius: 999 }}>
            <RiSparklingLine size={11} color={activeBotConfigId !== null ? DS.accent : DS.purple} />
            <span style={{ fontSize: 11, color: activeBotConfigId !== null ? DS.accent : DS.purple, fontWeight: 600 }}>
              {activeBotConfigId !== null ? (activeCfg?.name ?? 'Config') : 'Default'}
            </span>
          </div>

          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button onClick={() => { setConfigForm({ ...effectiveCfg }); setShowConfig(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', minHeight: 26, background: showCoach ? DS.accentSoft : DS.surface, border: `1px solid ${showCoach ? DS.accent : DS.borderMed}`, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: showCoach ? DS.accent : DS.textSub, transition: 'all 0.15s', boxShadow: showCoach ? `0 0 0 3px rgba(37,99,235,0.12)` : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent; e.currentTarget.style.background = DS.accentSoft }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = showCoach ? DS.accent : DS.borderMed; e.currentTarget.style.color = showCoach ? DS.accent : DS.textSub; e.currentTarget.style.background = showCoach ? DS.accentSoft : DS.surface }}
            >
              <HiOutlinePencilSquare size={13} /> Personalize
            </button>

            {/* Coach mark */}
            {showCoach && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 238, boxSizing: 'border-box', background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 8, padding: '10px', boxShadow: '0 8px 20px rgba(15,23,42,0.12)', zIndex: 200, color: DS.text }}>
                {/* Arrow */}
                <div style={{ position: 'absolute', top: -5, right: 18, width: 10, height: 10, background: DS.surface, borderLeft: `1px solid ${DS.borderMed}`, borderTop: `1px solid ${DS.borderMed}`, transform: 'rotate(45deg)' }} />
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: DS.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HiOutlinePencilSquare size={12} color={DS.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'block' }}>
                    <div style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 3, color: DS.text, whiteSpace: 'normal' }}>Personalize your data</div>
                    <div style={{ display: 'block', width: '100%', fontSize: 10, color: DS.textSub, lineHeight: 1.45, whiteSpace: 'normal', overflowWrap: 'break-word' }}>Choose sectors, companies, and metrics to focus on, or explore with the default config.</div>
                  </div>
                </div>
                <button onClick={() => { sessionStorage.setItem(PERSONALIZE_COACH_KEY, '1'); setShowCoach(false) }}
                  style={{ width: '100%', padding: '6px 8px', background: DS.accent, border: `1px solid ${DS.accent}`, borderRadius: 6, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: msgs.length === 0 ? '12px 16px 8px' : '10px 16px', position: 'relative', background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.07), transparent 55%)' }}>
        {msgs.length === 0 && (
          <div style={{ maxWidth: 760, margin: '2vh auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(37,99,235,0.12)', marginBottom: 10 }}>
              <img src={finbotLogo} alt="FinBot" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: DS.text, marginBottom: 5, letterSpacing: '-0.03em', fontFamily: 'Instrument Sans, sans-serif', textAlign: 'center' }}>Hello! I&apos;m FinBot.</div>
            <div style={{ fontSize: 12.5, color: DS.textSub, lineHeight: 1.55, textAlign: 'center', maxWidth: 520, marginBottom: 10 }}>Your AI analytics assistant for Indian equities — theses, comparisons, mandate analysis, and filings-backed insights for NSE/BSE companies.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginBottom: 12 }}>
              {['Analysis', 'Comparisons', 'Investment Thesis', 'Cash Flow', 'Risk'].map(c => (
                <span key={c} style={{ fontSize: 11, color: DS.accent, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 999, padding: '4px 10px', fontWeight: 600 }}>{c}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: DS.textFaint, letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10, alignSelf: 'stretch' }}>TRY A QUERY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%' }}>
              {SUGGESTIONS.map((sug, i) => (
                <button key={i} onClick={() => send(sug)}
                  style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 6, padding: '5px 8px', minHeight: 28, color: DS.textSub, fontSize: 10.5, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent; e.currentTarget.style.background = '#f8faff'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub; e.currentTarget.style.background = DS.surface; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)' }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: DS.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HiOutlineArrowTrendingUp size={11} color={DS.accent} />
                  </span>
                  <span style={{ lineHeight: 1.45 }}>{sug}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: showRef !== null ? '100%' : 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map(m => {
            const refOpen = m.role === 'assistant' && showRef === m.id && !!m.rich
            return (
              <div ref={refOpen ? referenceMessageRef : undefined} key={m.id} style={{ display: 'flex', gap: 11, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', scrollMarginTop: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.22)' }}>
                  {m.role === 'user' ? <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>U</span> : <img src={finbotLogo} alt="FinBot" style={{ width: 32, height: 32, objectFit: 'cover', objectPosition: '50% 28%' }} />}
                </div>
                {/* Split layout when reference is open */}
                {refOpen ? (
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Left: response + actions */}
                    <div style={{ flex: '0 0 52%', minWidth: 0, overflowY: 'auto', maxHeight: 500 }}>
                      <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: '4px 12px 12px 12px', padding: '12px 14px', boxShadow: '0 1px 4px rgba(37,99,235,0.04)' }}>
                        {m.rich ? <RichResponse rich={m.rich as RichContent} /> : <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{m.text}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: DS.textFaint }}>{m.time}</span>
                        <button onClick={() => { navigator.clipboard.writeText(m.text); setCopied(m.id); setTimeout(() => setCopied(null), 1600) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: copied === m.id ? DS.greenSoft : DS.surface, border: `1px solid ${copied === m.id ? '#86efac' : DS.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: copied === m.id ? DS.green : DS.textSub, transition: 'all 0.15s' }}>
                          <HiOutlineClipboard size={10} />{copied === m.id ? 'Copied' : 'Copy'}
                        </button>
                        {m.rich && (
                          <button onClick={() => downloadPDF(m.rich as RichContent)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: DS.textSub, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent; e.currentTarget.style.background = DS.accentSoft }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub; e.currentTarget.style.background = DS.surface }}>
                            <HiOutlineArrowDownTray size={10} />PDF
                          </button>
                        )}
                        <button onClick={() => setShowRef(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: DS.accent }}>
                          <HiOutlineTableCells size={10} />Reference
                        </button>
                      </div>
                    </div>
                    {/* Right: reference panel */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <RefTable rich={m.rich as RichContent} onClose={() => setShowRef(null)} />
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {m.role === 'user' ? (
                      <div style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '10px 10px 3px 10px', padding: '6px 10px', display: 'inline-block', maxWidth: '72%', float: 'right', boxShadow: '0 3px 10px rgba(37,99,235,0.16)' }}>
                        <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.45 }}>{m.text}</div>
                      </div>
                    ) : (
                      <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: '4px 16px 16px 16px', padding: '14px 16px', boxShadow: '0 2px 10px rgba(15,23,42,0.04)' }}>
                        {m.rich ? <RichResponse rich={m.rich as RichContent} /> : <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{m.text}</div>}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', clear: 'both' }}>
                      <span style={{ fontSize: 9, color: DS.textFaint }}>{m.time}</span>
                      {m.role === 'assistant' && (
                        <>
                          <button onClick={() => { navigator.clipboard.writeText(m.text); setCopied(m.id); setTimeout(() => setCopied(null), 1600) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: copied === m.id ? DS.greenSoft : DS.surface, border: `1px solid ${copied === m.id ? '#86efac' : DS.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: copied === m.id ? DS.green : DS.textSub, transition: 'all 0.15s' }}>
                            <HiOutlineClipboard size={10} />{copied === m.id ? 'Copied' : 'Copy'}
                          </button>
                          {m.rich && (
                            <button onClick={() => downloadPDF(m.rich as RichContent)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: DS.textSub, transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent; e.currentTarget.style.background = DS.accentSoft }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub; e.currentTarget.style.background = DS.surface }}>
                              <HiOutlineArrowDownTray size={10} />PDF
                            </button>
                          )}
                          {m.rich && (
                            <button onClick={() => setShowRef(showRef === m.id ? null : m.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: DS.textSub, transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent; e.currentTarget.style.background = DS.accentSoft }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub; e.currentTarget.style.background = DS.surface }}>
                              <HiOutlineTableCells size={10} />Reference
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: DS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={finbotLogo} alt="FinBot" style={{ width: 30, height: 30, objectFit: 'cover', objectPosition: '50% 28%' }} />
              </div>
              <div style={{ flex: 1, maxWidth: 460 }}>
                <ThinkingBubble phase={thinkPhase} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '6px 16px 8px', flexShrink: 0, background: 'linear-gradient(180deg, rgba(244,246,249,0) 0%, #f4f6f9 28%)' }}>
        <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 6, background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 8, padding: '5px 7px 5px 9px', transition: 'all 0.2s', boxShadow: '0 5px 16px rgba(15,23,42,0.05)' }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = DS.borderMed; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.06)' }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = DS.borderMed; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.06)' }}
        >
          <textarea className="no-focus-glow" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask FinBot anything about Indian equities…"
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 12.5, fontFamily: 'Inter, sans-serif', resize: 'none', lineHeight: 1.5, maxHeight: 110, overflowY: 'auto', padding: '4px 0' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() && !loading ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : '#e2e8f0', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', flexShrink: 0, boxShadow: input.trim() && !loading ? '0 6px 14px rgba(37,99,235,0.32)' : 'none', transition: 'all 0.15s' }}>
            <HiOutlinePaperAirplane size={13} color={input.trim() && !loading ? '#fff' : '#94a3b8'} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: DS.textFaint, marginTop: 8, textAlign: 'center' }}>FinBot may make errors · Verify with original filings · Enter to send</div>
      </div>

      {showConfig && (
        <ConfigModal
          form={configForm} setForm={setConfigForm}
          botConfigs={botConfigs} activeBotConfigId={activeBotConfigId}
          onClose={() => setShowConfig(false)}
          onSaveNew={saveConfig}
          onUpdate={updateConfig}
          onDelete={id => { onDeleteBotConfig(id); if (activeBotConfigId === id) onSetActiveBotConfig(null) }}
          onActivate={id => { onSetActiveBotConfig(id); if (id === null) setConfigForm({ ...DEFAULT_CFG }) }}
          savedScreeners={savedScreeners}
          onNavigateToScreener={() => { setShowConfig(false); onNavigateToScreener() }}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }
        textarea { scrollbar-width: thin }
      `}</style>
    </div>
  )
}

