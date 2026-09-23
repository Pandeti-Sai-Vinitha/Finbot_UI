import { useState, useMemo } from 'react'
import {
  HiOutlineXMark, HiOutlineCheck, HiOutlineCpuChip,
  HiOutlineChevronDown, HiOutlineChevronRight,
  HiOutlineMagnifyingGlass, HiOutlineArrowsRightLeft,
  HiOutlineBookmark, HiOutlineArrowDownTray, HiOutlineArrowPath,
  HiOutlineExclamationTriangle, HiOutlineCheckCircle,
  HiOutlineMinusCircle, HiOutlineChevronLeft,
} from 'react-icons/hi2'
import type { BotConfig } from '../App'
import { SECTORS, SECTOR_COMPANIES, ANNUAL_METRIC_GROUPS, QUARTERLY_METRICS, YEARS, QUARTERS } from '../data/finData'

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

type CompareMode = 'choose' | 'existing' | 'manual' | 'result'

interface ManualForm {
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

interface CompareEntry {
  id: number
  label: string
  baseId: number
  compareConfig: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>
}

let historyId = 0

interface Props {
  baseConfig: BotConfig
  allConfigs: BotConfig[]
  onClose: () => void
  onSaveAsConfig: (cfg: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export default function CompareModal({ baseConfig, allConfigs, onClose, onSaveAsConfig }: Props) {
  const [mode, setMode] = useState<CompareMode>('choose')
  const [comparedConfig, setComparedConfig] = useState<Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'> | null>(null)
  const [comparedLabel, setComparedLabel] = useState('')
  const [configSearch, setConfigSearch] = useState('')
  const [history, setHistory] = useState<CompareEntry[]>([])
  const [manual, setManual] = useState<ManualForm>({
    name: 'Manual Compare', sectors: [], companies: [], timePeriod: 'annual',
    years: [], quarters: [], metrics: [], responseStyle: 'analytical', promptInstructions: '',
  })
  const [manualStep, setManualStep] = useState(0)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))

  const otherConfigs = allConfigs.filter(c => c.id !== baseConfig.id)
  const filteredConfigs = otherConfigs.filter(c =>
    !configSearch || c.name.toLowerCase().includes(configSearch.toLowerCase()) ||
    c.sectors.some(s => s.toLowerCase().includes(configSearch.toLowerCase()))
  )


  const selectExisting = (cfg: BotConfig) => {
    const compared: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: cfg.name, sectors: cfg.sectors, companies: cfg.companies,
      timePeriod: cfg.timePeriod, years: cfg.years, quarters: cfg.quarters,
      metrics: cfg.metrics, responseStyle: cfg.responseStyle, promptInstructions: cfg.promptInstructions,
    }
    setComparedConfig(compared)
    setComparedLabel(cfg.name)
    addHistory(compared, cfg.name)
    setMode('result')
  }

  const submitManual = () => {
    const compared: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'> = { ...manual }
    setComparedConfig(compared)
    setComparedLabel(manual.name || 'Manual Config')
    addHistory(compared, manual.name || 'Manual Config')
    setMode('result')
  }

  const addHistory = (cfg: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>, label: string) => {
    setHistory(h => [{ id: ++historyId, label, baseId: baseConfig.id, compareConfig: cfg }, ...h.slice(0, 9)])
  }

  const loadFromHistory = (entry: CompareEntry) => {
    setComparedConfig(entry.compareConfig)
    setComparedLabel(entry.label)
    setMode('result')
  }

  const exportComparison = () => {
    if (!comparedConfig) return
    const lines = [
      `FinBot Comparison Report`,
      `Base: ${baseConfig.name}  vs  Compare: ${comparedLabel}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      ...comparisonRows(baseConfig, comparedConfig).map(r =>
        `${r.field}: [A] ${r.a}  [B] ${r.b}  (${r.status})`
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'finbot-comparison.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: DS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background: DS.surface, borderRadius: 14, width: mode === 'result' ? 860 : 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)', border: `1px solid ${DS.border}`, transition: 'width 0.25s ease' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: DS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiOutlineArrowsRightLeft size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: DS.text }}>Compare Configuration</div>
            <div style={{ fontSize: 11, color: DS.textSub }}>Base: <span style={{ color: DS.accent, fontWeight: 600 }}>{baseConfig.name}</span></div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {mode !== 'choose' && (
              <button onClick={() => setMode('choose')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: `1px solid ${DS.borderMed}`, borderRadius: 8, background: DS.surface, color: DS.textSub, fontSize: 11, cursor: 'pointer' }}>
                <HiOutlineChevronLeft size={12} /> Back
              </button>
            )}
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textFaint }}>
              <HiOutlineXMark size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto' }}>

          {/* ── Choose mode ── */}
          {mode === 'choose' && (
            <div style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 12, color: DS.textSub, marginBottom: 18 }}>How would you like to compare <strong>{baseConfig.name}</strong>?</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                <ModeCard
                  icon={<HiOutlineCpuChip size={18} color={DS.accent} />}
                  bg={DS.accentSoft} border={DS.accentBorder}
                  title="Compare with Existing Config"
                  desc="Select a saved Bot Config and see a side-by-side difference table instantly."
                  onClick={() => setMode('existing')}
                  disabled={otherConfigs.length === 0}
                  disabledMsg="No other configs saved yet"
                />
                <ModeCard
                  icon={<HiOutlineArrowsRightLeft size={18} color={DS.purple} />}
                  bg={DS.purpleSoft} border={DS.purpleBorder}
                  title="Manual Comparison"
                  desc="Build a custom config by selecting Sector → Company → Time Period → Metrics and compare."
                  onClick={() => { setManualStep(0); setMode('manual') }}
                />
              </div>

              {/* History */}
              {history.filter(h => h.baseId === baseConfig.id).length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>RECENT COMPARISONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {history.filter(h => h.baseId === baseConfig.id).map(entry => (
                      <button key={entry.id} onClick={() => loadFromHistory(entry)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1px solid ${DS.border}`, borderRadius: 8, background: DS.surfaceHover, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.background = DS.accentSoft }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.surfaceHover }}
                      >
                        <HiOutlineArrowsRightLeft size={12} color={DS.textFaint} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: DS.text }}>{entry.label}</div>
                          <div style={{ fontSize: 10, color: DS.textFaint }}>{entry.compareConfig.sectors.slice(0,2).join(', ')} · {entry.compareConfig.metrics.length} metrics</div>
                        </div>
                        <span style={{ fontSize: 10, color: DS.accent }}>Re-run →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Existing config selection ── */}
          {mode === 'existing' && (
            <div style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 12, color: DS.textSub, marginBottom: 14 }}>Select a config to compare against <strong>{baseConfig.name}</strong></div>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <HiOutlineMagnifyingGlass size={13} color={DS.textFaint} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={configSearch} onChange={e => setConfigSearch(e.target.value)}
                  placeholder="Search configs…"
                  style={{ width: '100%', padding: '8px 12px 8px 32px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
                  onBlur={e => e.currentTarget.style.borderColor = DS.border}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {filteredConfigs.map(cfg => (
                  <button key={cfg.id} onClick={() => selectExisting(cfg)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${DS.border}`, borderRadius: 10, background: DS.surface, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.background = DS.accentSoft }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.surface }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HiOutlineCpuChip size={15} color={DS.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, marginBottom: 2 }}>{cfg.name}</div>
                      <div style={{ fontSize: 10, color: DS.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cfg.sectors.slice(0,3).join(', ')} · {cfg.timePeriod} · {cfg.metrics.length} metrics
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: DS.accent, fontWeight: 600, flexShrink: 0 }}>Compare →</span>
                  </button>
                ))}
                {filteredConfigs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: DS.textFaint, fontSize: 12 }}>No matching configs</div>
                )}
              </div>
            </div>
          )}

          {/* ── Manual build ── */}
          {mode === 'manual' && (
            <ManualBuilder
              manual={manual}
              setManual={setManual}
              step={manualStep}
              setStep={setManualStep}
              expandedGroups={expandedGroups}
              setExpandedGroups={setExpandedGroups}
              onSubmit={submitManual}
            />
          )}

          {/* ── Result / comparison table ── */}
          {mode === 'result' && comparedConfig && (
            <ComparisonResult
              base={baseConfig}
              compare={comparedConfig}
              compareLabel={comparedLabel}
              onSaveAsConfig={() => onSaveAsConfig(comparedConfig)}
              onExport={exportComparison}
              onReset={() => setMode('choose')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Mode picker card ──────────────────────────────────────────── */
function ModeCard({ icon, bg, border, title, desc, onClick, disabled, disabledMsg }: {
  icon: React.ReactNode; bg: string; border: string; title: string; desc: string
  onClick: () => void; disabled?: boolean; disabledMsg?: string
}) {
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px', border: `1px solid ${disabled ? DS.border : border}`, borderRadius: 12, background: disabled ? DS.surfaceHover : bg, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.15s', opacity: disabled ? 0.55 : 1, width: '100%', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.1)' } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: DS.surface, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: DS.text, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 11, color: DS.textSub, lineHeight: 1.5 }}>{disabled ? disabledMsg : desc}</div>
      </div>
      {!disabled && <span style={{ marginLeft: 'auto', color: DS.textFaint, marginTop: 10, flexShrink: 0 }}><HiOutlineChevronRight size={14} /></span>}
    </button>
  )
}

/* ─── Manual builder ────────────────────────────────────────────── */
const MANUAL_STEPS = ['Sector', 'Companies', 'Time Period', 'Metrics', 'Settings']

function ManualBuilder({ manual, setManual, step, setStep, expandedGroups, setExpandedGroups, onSubmit }: {
  manual: ManualForm; setManual: React.Dispatch<React.SetStateAction<ManualForm>>
  step: number; setStep: (n: number) => void
  expandedGroups: Set<string>; setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>
  onSubmit: () => void
}) {
  const canNext = [
    manual.sectors.length > 0,
    manual.companies.length > 0,
    manual.years.length > 0 && (manual.timePeriod === 'annual' || manual.quarters.length > 0),
    manual.metrics.length > 0,
    true,
  ]

  const toggleSector = (s: string) => setManual(f => {
    const nextSectors = f.sectors.includes(s) ? f.sectors.filter(x => x !== s) : [...f.sectors, s]
    const valid = nextSectors.flatMap(sec => SECTOR_COMPANIES[sec] ?? [])
    return { ...f, sectors: nextSectors, companies: f.companies.filter(c => valid.includes(c)) }
  })
  const toggleCompany = (c: string) => setManual(f => ({ ...f, companies: f.companies.includes(c) ? f.companies.filter(x => x !== c) : [...f.companies, c] }))
  const toggleYear = (y: string) => {
    if (manual.timePeriod === 'annual') setManual(f => ({ ...f, years: f.years.includes(y) ? f.years.filter(x => x !== y) : [...f.years, y] }))
    else setManual(f => ({ ...f, years: [y], quarters: [] }))
  }
  const toggleQuarter = (q: string) => setManual(f => ({ ...f, quarters: f.quarters.includes(q) ? f.quarters.filter(x => x !== q) : [...f.quarters, q] }))
  const toggleMetric = (m: string) => setManual(f => ({ ...f, metrics: f.metrics.includes(m) ? f.metrics.filter(x => x !== m) : [...f.metrics, m] }))
  const toggleGroup = (g: string) => setExpandedGroups(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n })

  const filteredMetrics = (list: string[]) => list

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Step dots */}
      <div style={{ padding: '12px 22px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {MANUAL_STEPS.map((lbl, i) => {
          const done = i < step; const active = i === step
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => { if (i < step) setStep(i) }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: i < step ? 'pointer' : 'default', padding: 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? DS.green : active ? DS.accent : 'transparent', border: `2px solid ${done ? DS.green : active ? DS.accent : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: done || active ? '#fff' : DS.textFaint, boxShadow: active ? `0 0 0 3px ${DS.accentSoft}` : 'none' }}>
                  {done ? <HiOutlineCheck size={10} /> : i + 1}
                </div>
                <span style={{ fontSize: 8, color: active ? DS.accent : done ? DS.green : DS.textFaint, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>{lbl}</span>
              </button>
              {i < MANUAL_STEPS.length - 1 && <div style={{ width: 32, height: 2, background: i < step ? DS.green : '#e2e8f0', margin: '0 4px', marginBottom: 16, borderRadius: 1 }} />}
            </div>
          )
        })}
      </div>

      {/* Step body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>

        {/* Step 0 — Sectors */}
        {step === 0 && (
          <div>
            <SH title="Choose Sectors" sub="Which sectors to include?" />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: DS.textFaint, marginTop: 14, marginBottom: 8 }}>SECTORS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
              {SECTORS.map(s => {
                const sel = manual.sectors.includes(s)
                return (
                  <button key={s} onClick={() => toggleSector(s)}
                    style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 6, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = DS.surfaceHover }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = DS.surface }}
                  >
                    <div style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0, border: `1px solid ${sel ? DS.accent : 'rgba(37,99,235,0.2)'}`, background: sel ? DS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <HiOutlineCheck size={8} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 10, lineHeight: 1.3 }}>{s}</span>
                  </button>
                )
              })}
            </div>
            {manual.sectors.length > 0 && <div style={{ marginTop: 10, fontSize: 11, color: DS.accent }}>{manual.sectors.length} selected</div>}
          </div>
        )}

        {/* Step 1 — Companies */}
        {step === 1 && (
          <div>
            <SH title="Choose Companies" sub="Pick companies from your selected sectors" />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: DS.textFaint, marginTop: 14, marginBottom: 8 }}>COMPANIES</div>
            {manual.sectors.map(sec => {
              const cos = SECTOR_COMPANIES[sec] ?? []
              if (!cos.length) return null
              const allSel = cos.every(c => manual.companies.includes(c))
              return (
                <div key={sec} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: DS.text }}>{sec}</div>
                    <button onClick={() => {
                      if (allSel) setManual(f => ({ ...f, companies: f.companies.filter(c => !cos.includes(c)) }))
                      else setManual(f => ({ ...f, companies: Array.from(new Set([...f.companies, ...cos])) }))
                    }} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                      {allSel ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
                    {cos.map(co => {
                      const sel = manual.companies.includes(co)
                      return (
                        <button key={co} onClick={() => toggleCompany(co)}
                          style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 6, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.background = DS.surfaceHover }}
                          onMouseLeave={e => { if (!sel) e.currentTarget.style.background = DS.surface }}
                        >
                          <div style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0, border: `1px solid ${sel ? DS.accent : 'rgba(37,99,235,0.2)'}`, background: sel ? DS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sel && <HiOutlineCheck size={8} color="#fff" />}
                          </div>
                          {co}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {manual.companies.length > 0 && <div style={{ fontSize: 11, color: DS.accent, marginTop: 4 }}>{manual.companies.length} compan{manual.companies.length > 1 ? 'ies' : 'y'} selected</div>}
          </div>
        )}

        {/* Step 2 — Time Period */}
        {step === 2 && (
          <div>
            <SH title="Time Period" sub="Annual or quarterly?" />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 16 }}>
              {(['annual', 'quarterly'] as const).map(tp => (
                <button key={tp} onClick={() => setManual(f => ({ ...f, timePeriod: tp, years: [], quarters: [] }))}
                  style={{ flex: 1, padding: '12px', borderRadius: 8, border: `2px solid ${manual.timePeriod === tp ? DS.accent : DS.border}`, background: manual.timePeriod === tp ? DS.accentSoft : DS.surface, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: manual.timePeriod === tp ? DS.accent : DS.text, marginBottom: 3, textTransform: 'capitalize' }}>{tp}</div>
                  <div style={{ fontSize: 11, color: DS.textSub }}>{tp === 'annual' ? 'Full year statements' : 'Quarter-by-quarter'}</div>
                </button>
              ))}
            </div>
            {manual.timePeriod === 'annual' && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>SELECT YEARS</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {YEARS.map(y => {
                    const sel = manual.years.includes(y)
                    return <button key={y} onClick={() => toggleYear(y)}
                      style={{ padding: '7px 16px', borderRadius: 8, border: `2px solid ${sel ? DS.accent : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}>{y}</button>
                  })}
                </div>
              </div>
            )}
            {manual.timePeriod === 'quarterly' && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>SELECT YEAR</div>
                <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
                  {YEARS.map(y => {
                    const sel = manual.years[0] === y
                    return <button key={y} onClick={() => toggleYear(y)}
                      style={{ padding: '7px 16px', borderRadius: 8, border: `2px solid ${sel ? DS.accent : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}>{y}</button>
                  })}
                </div>
                {manual.years.length > 0 && (
                  <>
                    <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>SELECT QUARTERS</div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {QUARTERS.map(q => {
                        const sel = manual.quarters.includes(q)
                        return <button key={q} onClick={() => toggleQuarter(q)}
                          style={{ flex: 1, padding: '9px', borderRadius: 8, border: `2px solid ${sel ? DS.accent : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer' }}>{q}</button>
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Metrics */}
        {step === 3 && (
          <div>
            <SH title="Select Metrics" sub="Which financial metrics to include?" />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: DS.textFaint, marginTop: 14, marginBottom: 8 }}>METRICS</div>
            {manual.timePeriod === 'annual' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {Object.entries(ANNUAL_METRIC_GROUPS).map(([group, metrics]) => {
                  const expanded = expandedGroups.has(group)
                  const allSel = metrics.every(m => manual.metrics.includes(m))
                  return (
                    <div key={group} style={{ border: `1px solid ${DS.border}`, borderRadius: 9, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', background: DS.surfaceHover, cursor: 'pointer', gap: 8 }} onClick={() => toggleGroup(group)}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: DS.text, flex: 1 }}>{group}</span>
                        <button onClick={e => { e.stopPropagation(); if (allSel) setManual(f => ({ ...f, metrics: f.metrics.filter(m => !metrics.includes(m)) })); else setManual(f => ({ ...f, metrics: Array.from(new Set([...f.metrics, ...metrics])) })) }}
                          style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: allSel ? DS.accentSoft : 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                          {allSel ? 'Deselect' : 'All'}
                        </button>
                        {expanded ? <HiOutlineChevronDown size={13} color={DS.textFaint} /> : <HiOutlineChevronRight size={13} color={DS.textFaint} />}
                      </div>
                      {expanded && (
                        <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {filteredMetrics(metrics).map(m => {
                            const sel = manual.metrics.includes(m)
                            return (
                              <button key={m} onClick={() => toggleMetric(m)}
                                style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                {sel && <HiOutlineCheck size={9} />}{m}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUARTERLY_METRICS.map(m => {
                  const sel = manual.metrics.includes(m)
                  return (
                    <button key={m} onClick={() => toggleMetric(m)}
                      style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      {sel && <HiOutlineCheck size={9} />}{m}
                    </button>
                  )
                })}
              </div>
            )}
            {manual.metrics.length > 0 && <div style={{ marginTop: 10, fontSize: 11, color: DS.accent }}>{manual.metrics.length} selected</div>}
          </div>
        )}

        {/* Step 4 — Settings */}
        {step === 4 && (
          <div>
            <SH title="Config Settings" sub="Name this comparison config and set the response style" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>NAME</label>
                <input value={manual.name} onChange={e => setManual(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: DS.text, background: DS.surfaceHover, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
                  onBlur={e => e.currentTarget.style.borderColor = DS.border}
                />
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 7 }}>RESPONSE STYLE</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {(['concise', 'detailed', 'analytical'] as const).map(st => (
                    <button key={st} onClick={() => setManual(f => ({ ...f, responseStyle: st }))}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${manual.responseStyle === st ? DS.accentBorder : DS.border}`, background: manual.responseStyle === st ? DS.accentSoft : 'transparent', color: manual.responseStyle === st ? DS.accent : DS.textSub, fontSize: 12, fontWeight: manual.responseStyle === st ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>PROMPT INSTRUCTIONS (optional)</label>
                <textarea value={manual.promptInstructions} onChange={e => setManual(f => ({ ...f, promptInstructions: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.surfaceHover, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
                  onBlur={e => e.currentTarget.style.borderColor = DS.border}
                  placeholder="Any custom instructions…"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 22px', borderTop: `1px solid ${DS.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', border: `1px solid ${DS.borderMed}`, borderRadius: 8, background: DS.surface, color: DS.textSub, fontSize: 12, cursor: 'pointer' }}>
            <HiOutlineChevronLeft size={12} /> Back
          </button>
        )}
        {step < MANUAL_STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext[step]}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: canNext[step] ? DS.accent : '#e2e8f0', color: canNext[step] ? '#fff' : '#cbd5e1', fontSize: 12, fontWeight: 600, cursor: canNext[step] ? 'pointer' : 'not-allowed', boxShadow: canNext[step] ? '0 1px 3px rgba(37,99,235,0.25)' : 'none' }}>
            Continue →
          </button>
        ) : (
          <button onClick={onSubmit}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: DS.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.18)' }}>
            Generate Comparison →
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Comparison data ───────────────────────────────────────────── */
type RowStatus = 'match' | 'partial' | 'diff'

interface CompareRow {
  field: string; a: string; b: string; status: RowStatus
}

function arrStatus(a: string[], b: string[]): RowStatus {
  if (a.length === 0 && b.length === 0) return 'match'
  if (a.length === 0 || b.length === 0) return 'diff'
  const overlap = a.filter(x => b.includes(x))
  if (overlap.length === a.length && overlap.length === b.length) return 'match'
  if (overlap.length > 0) return 'partial'
  return 'diff'
}

function strStatus(a: string, b: string): RowStatus {
  return a === b ? 'match' : 'diff'
}

function comparisonRows(base: BotConfig, compare: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>): CompareRow[] {
  return [
    { field: 'Sectors', a: base.sectors.join(', ') || '—', b: compare.sectors.join(', ') || '—', status: arrStatus(base.sectors, compare.sectors) },
    { field: 'Companies', a: base.companies.length ? `${base.companies.length} selected` : '—', b: compare.companies.length ? `${compare.companies.length} selected` : '—', status: arrStatus(base.companies, compare.companies) },
    { field: 'Time Period', a: base.timePeriod, b: compare.timePeriod, status: strStatus(base.timePeriod, compare.timePeriod) },
    { field: 'Years', a: base.years.join(', ') || '—', b: compare.years.join(', ') || '—', status: arrStatus(base.years, compare.years) },
    { field: 'Quarters', a: base.quarters.join(', ') || '—', b: compare.quarters.join(', ') || '—', status: arrStatus(base.quarters, compare.quarters) },
    { field: 'Metrics', a: `${base.metrics.length} selected`, b: `${compare.metrics.length} selected`, status: arrStatus(base.metrics, compare.metrics) },
    { field: 'Matching Metrics', a: '—', b: `${base.metrics.filter(m => compare.metrics.includes(m)).length} / ${base.metrics.length}`, status: base.metrics.every(m => compare.metrics.includes(m)) && compare.metrics.length === base.metrics.length ? 'match' : 'partial' },
    { field: 'Response Style', a: base.responseStyle, b: compare.responseStyle, status: strStatus(base.responseStyle, compare.responseStyle) },
    { field: 'Prompt Instructions', a: base.promptInstructions || '(none)', b: compare.promptInstructions || '(none)', status: strStatus(base.promptInstructions, compare.promptInstructions) },
  ]
}

/* ─── Comparison result ─────────────────────────────────────────── */
function ComparisonResult({ base, compare, compareLabel, onSaveAsConfig, onExport, onReset }: {
  base: BotConfig
  compare: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>
  compareLabel: string
  onSaveAsConfig: () => void
  onExport: () => void
  onReset: () => void
}) {
  const rows = useMemo(() => comparisonRows(base, compare), [base, compare])
  const matchCount = rows.filter(r => r.status === 'match').length
  const diffCount = rows.filter(r => r.status === 'diff').length
  const partialCount = rows.filter(r => r.status === 'partial').length

  const statusStyle = (s: RowStatus) => ({
    bg: s === 'match' ? DS.greenSoft : s === 'partial' ? DS.amberSoft : DS.redSoft,
    border: s === 'match' ? DS.greenBorder : s === 'partial' ? 'rgba(217,119,6,0.25)' : DS.redBorder,
    text: s === 'match' ? DS.green : s === 'partial' ? DS.amber : DS.red,
  })

  const [expandedMetrics, setExpandedMetrics] = useState(false)

  return (
    <div>
      {/* Summary bar */}
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${DS.border}`, background: DS.surfaceHover, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Badge icon={<HiOutlineCheckCircle size={12} />} count={matchCount} label="Matching" color={DS.green} bg={DS.greenSoft} border={DS.greenBorder} />
          <Badge icon={<HiOutlineExclamationTriangle size={12} />} count={partialCount} label="Partial" color={DS.amber} bg={DS.amberSoft} border="rgba(217,119,6,0.25)" />
          <Badge icon={<HiOutlineMinusCircle size={12} />} count={diffCount} label="Different" color={DS.red} bg={DS.redSoft} border={DS.redBorder} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
          <ActionBtn icon={<HiOutlineArrowPath size={12} />} label="Reset" onClick={onReset} />
          <ActionBtn icon={<HiOutlineArrowDownTray size={12} />} label="Export" onClick={onExport} />
          <button onClick={onSaveAsConfig}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', background: DS.accent, border: '1px solid rgba(37,99,235,0.12)', borderRadius: DS.radius, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(37,99,235,0.25)' }}>
            <HiOutlineBookmark size={12} /> Save as Config
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: DS.surfaceHover, position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: DS.textMuted, width: '20%', borderBottom: `1px solid ${DS.border}` }}>FIELD</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: DS.accent, width: '35%', borderBottom: `1px solid ${DS.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <HiOutlineCpuChip size={11} /> {base.name}
                </div>
              </th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: DS.purple, width: '35%', borderBottom: `1px solid ${DS.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <HiOutlineArrowsRightLeft size={11} /> {compareLabel}
                </div>
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: DS.textMuted, width: '10%', borderBottom: `1px solid ${DS.border}` }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const st = statusStyle(row.status)
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? DS.surface : DS.surfaceHover, borderBottom: `1px solid ${DS.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = DS.surfaceHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? DS.surface : DS.surfaceHover }}
                >
                  <td style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: DS.textSub }}>{row.field}</td>
                  <td style={{ padding: '10px 16px', color: DS.text, fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>{row.a}</td>
                  <td style={{ padding: '10px 16px', color: DS.text, fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>{row.b}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, background: st.bg, border: `1px solid ${st.border}`, color: st.text, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {row.status === 'match' ? <HiOutlineCheckCircle size={10} /> : row.status === 'partial' ? <HiOutlineExclamationTriangle size={10} /> : <HiOutlineMinusCircle size={10} />}
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Metric overlap detail */}
      <div style={{ padding: '14px 22px', borderTop: `1px solid ${DS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: DS.text }}>Metric Overlap Detail</div>
          <button onClick={() => setExpandedMetrics(e => !e)} style={{ fontSize: 10, color: DS.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {expandedMetrics ? 'Collapse ↑' : 'Expand ↓'}
          </button>
        </div>
        {expandedMetrics && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              {[
                { label: 'In both', items: base.metrics.filter(m => compare.metrics.includes(m)), color: DS.green, bg: DS.greenSoft, border: DS.greenBorder },
                { label: 'Only in base', items: base.metrics.filter(m => !compare.metrics.includes(m)), color: DS.red, bg: DS.redSoft, border: DS.redBorder },
                { label: 'Only in compare', items: compare.metrics.filter(m => !base.metrics.includes(m)), color: DS.purple, bg: DS.purpleSoft, border: DS.purpleBorder },
              ].map(({ label, items, color, bg, border }) => (
                <div key={label} style={{ flex: 1, padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 6 }}>{label.toUpperCase()} ({items.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {items.length === 0
                      ? <span style={{ fontSize: 10, color: DS.textFaint }}>—</span>
                      : items.map(m => <span key={m} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: DS.surface, border: `1px solid ${border}`, color }}>{m}</span>)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function SH({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: DS.text }}>{title}</div>
      <div style={{ fontSize: 11, color: DS.textSub, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function Badge({ icon, count, label, color, bg, border }: { icon: React.ReactNode; count: number; label: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 6 }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      <span style={{ fontSize: 10, color }}>{label}</span>
    </div>
  )
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', background: DS.surface, border: `1px solid ${DS.borderMed}`, borderRadius: 8, color: DS.textSub, fontSize: 11, cursor: 'pointer', transition: 'all 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = DS.borderMed; e.currentTarget.style.color = DS.textSub }}
    >{icon}{label}</button>
  )
}
