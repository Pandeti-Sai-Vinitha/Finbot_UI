import { useState } from 'react'
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
  HiOutlineBolt, HiOutlineCheck, HiOutlineCpuChip,
  HiOutlineXMark, HiOutlineChevronLeft,
  HiOutlineChevronDown, HiOutlineChevronRight,
  HiOutlineArrowsRightLeft,
} from 'react-icons/hi2'
import type { BotConfig } from '../App'
import {
  SECTORS,
  SECTOR_COMPANIES,
  ANNUAL_METRIC_GROUPS,
  QUARTERLY_METRICS,
  YEARS,
  QUARTERS,
  FREQUENTLY_USED_METRICS,
} from '../data/finData'

interface Props {
  botConfigs: BotConfig[]
  activeBotConfigId: number | null
  onSetActive: (id: number | null) => void
  onAdd: (cfg: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>) => BotConfig
  onUpdate: (id: number, patch: Partial<Omit<BotConfig, 'id' | 'createdAt'>>) => void
  onDelete: (id: number) => void
  onCompare: (id: number) => void
}

const DS = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  overlay: 'rgba(15,23,42,0.45)',
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
  shadow: 'none',
  radius: 10,
}

type WStep = 0 | 1 | 2 | 3 | 4
const STEP_LABELS = ['Sectors', 'Companies', 'Time Period', 'Metrics', 'Summary']
const styleMap = { concise: 'Concise', detailed: 'Detailed', analytical: 'Analytical' }

interface FormState {
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

const defaultForm = (): FormState => ({
  name: '', sectors: [], companies: [], timePeriod: 'annual', years: [], quarters: [],
  metrics: [], responseStyle: 'analytical', promptInstructions: '',
})

export default function BotConfigurations({ botConfigs, activeBotConfigId, onSetActive, onAdd, onUpdate, onDelete, onCompare }: Props) {
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [wStep, setWStep] = useState<WStep>(0)
  const [sectorSearch, setSectorSearch] = useState('')
  const [metricSearch, setMetricSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))
  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set())
  const [expandedMetrics, setExpandedMetrics] = useState<Set<number>>(new Set())

  const filteredSectors = SECTORS.filter(s => !sectorSearch || s.toLowerCase().includes(sectorSearch.toLowerCase()))
  const allMetricsFlat = form.timePeriod === 'annual'
    ? Object.values(ANNUAL_METRIC_GROUPS).flat()
    : QUARTERLY_METRICS
  const filteredMetrics = (list: string[]) =>
    metricSearch ? list.filter(m => m.toLowerCase().includes(metricSearch.toLowerCase())) : list

  const openCreate = () => {
    setForm({ ...defaultForm(), name: `Config ${botConfigs.length + 1}` })
    setWStep(0); setSectorSearch(''); setMetricSearch('')
    setExpandedGroups(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))
    setModal('create')
  }

  const openEdit = (cfg: BotConfig) => {
    setEditId(cfg.id)
    setForm({
      name: cfg.name,
      sectors: cfg.sectors,
      companies: cfg.companies,
      timePeriod: cfg.timePeriod,
      years: cfg.years,
      quarters: cfg.quarters,
      metrics: cfg.metrics,
      responseStyle: cfg.responseStyle,
      promptInstructions: cfg.promptInstructions,
    })
    setWStep(4); setSectorSearch(''); setMetricSearch('')
    setExpandedGroups(new Set(Object.keys(ANNUAL_METRIC_GROUPS)))
    setModal('edit')
  }

  const openDelete = (id: number) => { setDeleteId(id); setModal('delete') }

  const save = () => {
    const payload: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: form.name.trim() || `Config ${botConfigs.length + 1}`,
      sectors: form.sectors,
      companies: form.companies,
      timePeriod: form.timePeriod,
      years: form.years,
      quarters: form.timePeriod === 'quarterly' ? form.quarters : [],
      metrics: form.metrics,
      responseStyle: form.responseStyle,
      promptInstructions: form.promptInstructions,
    }
    if (modal === 'create') {
      onAdd(payload)
    } else if (modal === 'edit' && editId) {
      onUpdate(editId, payload)
    }
    setModal(null)
  }

  const confirmDelete = () => { if (deleteId) onDelete(deleteId); setModal(null) }

  const toggleSector = (s: string) => setForm(f => {
    const nextSectors = f.sectors.includes(s) ? f.sectors.filter(x => x !== s) : [...f.sectors, s]
    const validCos = nextSectors.flatMap(sec => SECTOR_COMPANIES[sec] ?? [])
    return { ...f, sectors: nextSectors, companies: f.companies.filter(c => validCos.includes(c)) }
  })
  const toggleCompany = (c: string) => setForm(f => ({ ...f, companies: f.companies.includes(c) ? f.companies.filter(x => x !== c) : [...f.companies, c] }))
  const toggleMetric = (m: string) => setForm(f => ({ ...f, metrics: f.metrics.includes(m) ? f.metrics.filter(x => x !== m) : [...f.metrics, m] }))
  const toggleYear = (y: string) => {
    if (form.timePeriod === 'annual') {
      setForm(f => ({ ...f, years: f.years.includes(y) ? f.years.filter(x => x !== y) : [...f.years, y] }))
    } else {
      setForm(f => ({ ...f, years: [y], quarters: [] }))
    }
  }
  const toggleQuarter = (q: string) => setForm(f => ({ ...f, quarters: f.quarters.includes(q) ? f.quarters.filter(x => x !== q) : [...f.quarters, q] }))
  const toggleGroup = (g: string) => setExpandedGroups(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n })

  const setTimePeriod = (tp: 'annual' | 'quarterly') => setForm(f => ({ ...f, timePeriod: tp, years: [], quarters: [] }))

  const sectorCompanies = form.sectors.flatMap(s => SECTOR_COMPANIES[s] ?? [])

  const canNext: Record<WStep, boolean> = {
    0: form.sectors.length >= 1,
    1: form.companies.length >= 1,
    2: form.years.length >= 1 && (form.timePeriod === 'annual' || form.quarters.length >= 1),
    3: form.metrics.length >= 1,
    4: true,
  }

  const timeSummary = form.timePeriod === 'annual'
    ? `Annual · ${form.years.join(', ')}`
    : `Quarterly · ${form.years[0] ?? '—'} · ${form.quarters.join(', ')}`

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: DS.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: DS.text }}>Bot Configurations</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: DS.textSub }}>{botConfigs.length} configuration{botConfigs.length !== 1 ? 's' : ''} · Controls AI Chat behaviour</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: DS.accent, border: `1px solid ${DS.accent}`, borderRadius: DS.radius, color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
          onMouseLeave={e => e.currentTarget.style.background = DS.accent}
        >
          <HiOutlinePlus size={14} /> New Configuration
        </button>
      </div>

      {/* Empty state */}
      {botConfigs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: DS.surface, border: `1px dashed ${DS.border}`, borderRadius: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <HiOutlineCpuChip size={28} color={DS.accent} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: DS.text, marginBottom: 6 }}>No configurations yet</div>
          <div style={{ fontSize: 13, color: DS.textSub, marginBottom: 24, textAlign: 'center', maxWidth: 340 }}>Create your first bot configuration to personalise FinBot for specific sectors and time periods.</div>
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: DS.accent, border: '1px solid rgba(37,99,235,0.12)', borderRadius: DS.radius, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <HiOutlinePlus size={14} /> Create First Config
          </button>
        </div>
      )}

      {/* Cards grid */}
      {botConfigs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {botConfigs.map(cfg => {
            const isActive = cfg.id === activeBotConfigId
            const sectorsExpanded = expandedSectors.has(cfg.id)
            const metricsExpanded = expandedMetrics.has(cfg.id)
            const periodLabel = cfg.timePeriod === 'annual'
              ? `Annual · ${cfg.years.slice(0, 3).join(', ')}${cfg.years.length > 3 ? '…' : ''}`
              : `Quarterly · ${cfg.years[0] ?? ''} · ${cfg.quarters.join(', ')}`
            return (
              <div key={cfg.id} style={{ background: DS.surface, border: `1px solid ${isActive ? DS.accentBorder : DS.border}`, borderRadius: 12, padding: '14px 16px', boxShadow: isActive ? '0 0 0 3px rgba(37,99,235,0.06)' : '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)', transition: 'all 0.2s' }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <HiOutlineCpuChip size={15} color={isActive ? DS.accent : DS.textFaint} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: DS.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.name}</span>
                  {isActive && <span style={{ fontSize: 8, color: DS.accent, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, borderRadius: 4, padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>ACTIVE</span>}
                  <span style={{ fontSize: 8, color: DS.textFaint, background: '#f1f5f9', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', flexShrink: 0 }}>{cfg.responseStyle}</span>
                </div>

                {/* Sectors */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 7 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 56, paddingTop: 3 }}>SECTORS</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {(sectorsExpanded ? cfg.sectors : cfg.sectors.slice(0, 2)).map(s =>
                      <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, fontWeight: 500 }}>{s}</span>
                    )}
                    {cfg.sectors.length > 2 && (
                      <button onClick={() => setExpandedSectors(p => { const n = new Set(p); sectorsExpanded ? n.delete(cfg.id) : n.add(cfg.id); return n })}
                        style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                        {sectorsExpanded ? 'less ↑' : `+${cfg.sectors.length - 2} more`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Companies count */}
                {cfg.companies.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 56 }}>COMPANIES</span>
                    <span style={{ fontSize: 10, color: DS.textSub }}>{cfg.companies.length} selected</span>
                  </div>
                )}

                {/* Time period */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 56 }}>TIME</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: DS.greenSoft, border: `1px solid ${DS.greenBorder}`, color: DS.green, fontWeight: 500 }}>{periodLabel}</span>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 56, paddingTop: 3 }}>METRICS ({cfg.metrics.length})</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {(metricsExpanded ? cfg.metrics : cfg.metrics.slice(0, 3)).map(m =>
                      <span key={m} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: DS.bg, border: `1px solid ${DS.border}`, color: DS.textSub }}>{m}</span>
                    )}
                    {cfg.metrics.length > 3 && (
                      <button onClick={() => setExpandedMetrics(p => { const n = new Set(p); metricsExpanded ? n.delete(cfg.id) : n.add(cfg.id); return n })}
                        style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                        {metricsExpanded ? 'less ↑' : `+${cfg.metrics.length - 3} more`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: `1px solid ${DS.border}` }}>
                  {!isActive ? (
                    <button onClick={() => onSetActive(cfg.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', border: `1px solid ${DS.accentBorder}`, borderRadius: 8, background: DS.accentSoft, color: DS.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = DS.accentHover}
                      onMouseLeave={e => e.currentTarget.style.background = DS.accentSoft}
                    ><HiOutlineBolt size={12} /> Set Active</button>
                  ) : (
                    <button onClick={() => onSetActive(null)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', border: `1px solid ${DS.greenBorder}`, borderRadius: 8, background: DS.greenSoft, color: DS.green, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      <HiOutlineCheck size={12} /> Active
                    </button>
                  )}
                  <button onClick={() => openEdit(cfg)} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.surface, border: `1px solid ${DS.border}`, color: DS.textSub, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub }}
                  ><HiOutlinePencil size={12} /></button>
                  <button onClick={() => onCompare(cfg.id)}
                    title="Compare"
                    style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.surface, border: `1px solid ${DS.border}`, color: DS.textSub, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'; e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub; e.currentTarget.style.background = DS.surface }}
                  ><HiOutlineArrowsRightLeft size={12} /></button>
                  <button onClick={() => openDelete(cfg.id)} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.surface, border: `1px solid ${DS.border}`, color: DS.textSub, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = DS.redBorder; e.currentTarget.style.color = DS.red; e.currentTarget.style.background = DS.redSoft }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textSub; e.currentTarget.style.background = DS.surface }}
                  ><HiOutlineTrash size={12} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit wizard modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: DS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setModal(null)}>
          <div style={{ background: DS.surface, borderRadius: 14, width: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)', border: `1px solid ${DS.border}` }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DS.text }}>{modal === 'create' ? 'New Configuration' : 'Edit Configuration'}</div>
                <div style={{ fontSize: 11, color: DS.textSub, marginTop: 2 }}>{form.name}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DS.textSub }}><HiOutlineXMark size={15} /></button>
            </div>

            {/* Step dots */}
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {STEP_LABELS.map((lbl, i) => {
                const done = i < wStep; const active = i === wStep
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => { if (i < wStep) setWStep(i as WStep) }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: i < wStep ? 'pointer' : 'default', padding: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: done ? DS.green : active ? DS.accent : DS.border, transition: 'all 0.2s', boxShadow: active ? `0 0 0 3px rgba(37,99,235,0.12)` : 'none' }} />
                      <span style={{ fontSize: 11, color: active ? DS.text : DS.textFaint, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>{lbl}</span>
                    </button>
                    {i < STEP_LABELS.length - 1 && <div style={{ width: 44, height: 2, background: i < wStep ? DS.green : DS.border, margin: '0 6px', marginBottom: 18, borderRadius: 1, transition: 'background 0.3s' }} />}
                  </div>
                )
              })}
            </div>

            {/* Step body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

              {/* Step 0 — Sectors */}
              {wStep === 0 && (
                <div>
                  <SHead title="Select Sectors" sub="Choose one or more sectors to focus on" />
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 12, alignItems: 'center' }}>
                    <input value={sectorSearch} onChange={e => setSectorSearch(e.target.value)} placeholder="Search sectors…"
                      style={{ flex: 1, padding: '8px 12px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.bg, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
                      onBlur={e => e.currentTarget.style.borderColor = DS.border}
                    />
                    <button onClick={() => {
                      const allSel = filteredSectors.every(s => form.sectors.includes(s))
                      if (allSel) {
                        setForm(f => ({ ...f, sectors: f.sectors.filter(s => !filteredSectors.includes(s)) }))
                      } else {
                        setForm(f => ({ ...f, sectors: Array.from(new Set([...f.sectors, ...filteredSectors])) }))
                      }
                    }} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {filteredSectors.every(s => form.sectors.includes(s)) && filteredSectors.length > 0 ? 'Clear All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                    {filteredSectors.map(sec => {
                      const sel = form.sectors.includes(sec)
                      return (
                        <button key={sec} onClick={() => toggleSector(sec)}
                          style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 8, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 6 }}
                          onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.background = DS.surfaceHover } }}
                          onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.surface } }}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1px solid ${sel ? DS.accent : DS.borderMed}`, background: sel ? DS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                            {sel && <HiOutlineCheck size={9} color="#fff" />}
                          </div>
                          <span style={{ fontSize: 11, lineHeight: 1.3 }}>{sec}</span>
                        </button>
                      )
                    })}
                  </div>
                  {filteredSectors.length === 0 && <div style={{ fontSize: 12, color: DS.textFaint, padding: '20px 0', textAlign: 'center' }}>No sectors match</div>}
                  {form.sectors.length > 0 && <div style={{ marginTop: 12, fontSize: 11, color: DS.accent }}>{form.sectors.length} sector{form.sectors.length > 1 ? 's' : ''} selected</div>}
                </div>
              )}

              {/* Step 1 — Companies */}
              {wStep === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <SHead title="Select Companies" sub="Pick the companies to analyse from your sectors" />
                    <SChip label={`${form.sectors.length} sector${form.sectors.length > 1 ? 's' : ''}`} onEdit={() => setWStep(0)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, marginBottom: 10 }}>
                    <button onClick={() => setForm(f => ({ ...f, companies: sectorCompanies }))}
                      style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Select All</button>
                    <button onClick={() => setForm(f => ({ ...f, companies: [] }))}
                      style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${DS.border}`, background: 'transparent', color: DS.textSub, fontSize: 11, cursor: 'pointer' }}>Clear</button>
                  </div>
                  {form.sectors.map(sec => {
                    const cos = SECTOR_COMPANIES[sec] ?? []
                    if (!cos.length) return null
                    const allSel = cos.every(c => form.companies.includes(c))
                    return (
                      <div key={sec} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: DS.text }}>{sec}</div>
                          <button onClick={() => {
                            if (allSel) setForm(f => ({ ...f, companies: f.companies.filter(c => !cos.includes(c)) }))
                            else setForm(f => ({ ...f, companies: Array.from(new Set([...f.companies, ...cos])) }))
                          }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: DS.accentSoft, color: DS.accent, cursor: 'pointer', fontWeight: 600 }}>
                            {allSel ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                          {cos.map(co => {
                            const sel = form.companies.includes(co)
                            return (
                              <button key={co} onClick={() => toggleCompany(co)}
                                style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 8, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontSize: 12, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 8 }}
                                onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.background = DS.surfaceHover } }}
                                onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.surface } }}
                              >
                                <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, border: `1px solid ${sel ? DS.accent : DS.borderMed}`, background: sel ? DS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                                  {sel && <HiOutlineCheck size={9} color="#fff" />}
                                </div>
                                {co}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {form.companies.length > 0 && <div style={{ fontSize: 11, color: DS.accent, marginTop: 4 }}>{form.companies.length} compan{form.companies.length > 1 ? 'ies' : 'y'} selected</div>}
                </div>
              )}

              {/* Step 2 — Time Period */}
              {wStep === 2 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <SHead title="Time Period" sub="Choose reporting period and years" />
                    <SChip label={`${form.sectors.length} sector${form.sectors.length > 1 ? 's' : ''}`} onEdit={() => setWStep(0)} />
                  </div>

                  {/* Period type radio cards */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    {(['annual', 'quarterly'] as const).map(tp => (
                      <button key={tp} onClick={() => setTimePeriod(tp)}
                        style={{ flex: 1, padding: '14px', borderRadius: 8, border: `2px solid ${form.timePeriod === tp ? DS.accent : DS.border}`, background: form.timePeriod === tp ? DS.accentSoft : DS.surface, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                        onMouseEnter={e => { if (form.timePeriod !== tp) e.currentTarget.style.borderColor = DS.accentBorder }}
                        onMouseLeave={e => { if (form.timePeriod !== tp) e.currentTarget.style.borderColor = DS.border }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${form.timePeriod === tp ? DS.accent : '#cbd5e1'}`, background: form.timePeriod === tp ? DS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {form.timePeriod === tp && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: form.timePeriod === tp ? DS.accent : DS.text, textTransform: 'capitalize' }}>{tp}</span>
                        </div>
                        <div style={{ fontSize: 11, color: DS.textSub, marginTop: 6, marginLeft: 24 }}>
                          {tp === 'annual' ? 'Full year financial statements' : 'Quarter-by-quarter performance'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Annual: multi-select years */}
                  {form.timePeriod === 'annual' && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>SELECT YEARS</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {YEARS.map(y => {
                          const sel = form.years.includes(y)
                          return (
                            <button key={y} onClick={() => toggleYear(y)}
                              style={{ padding: '9px 18px', borderRadius: 8, border: `2px solid ${sel ? DS.accent : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 13, fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s' }}
                              onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = DS.accentBorder }}
                              onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = DS.border }}
                            >{y}</button>
                          )
                        })}
                      </div>
                      {form.years.length > 0 && <div style={{ marginTop: 10, fontSize: 11, color: DS.accent }}>{form.years.length} year{form.years.length > 1 ? 's' : ''} selected</div>}
                    </div>
                  )}

                  {/* Quarterly: radio year then quarters */}
                  {form.timePeriod === 'quarterly' && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>SELECT YEAR</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                        {YEARS.map(y => {
                          const sel = form.years[0] === y
                          return (
                            <button key={y} onClick={() => toggleYear(y)}
                              style={{ padding: '9px 18px', borderRadius: 8, border: `2px solid ${sel ? DS.accent : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 13, fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 7 }}
                              onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = DS.accentBorder }}
                              onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = DS.border }}
                            >
                              <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${sel ? DS.accent : '#cbd5e1'}`, background: sel ? DS.accent : 'transparent', flexShrink: 0 }} />
                              {y}
                            </button>
                          )
                        })}
                      </div>
                      {form.years.length > 0 && (
                        <>
                          <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>SELECT QUARTERS</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {QUARTERS.map(q => {
                              const sel = form.quarters.includes(q)
                              return (
                                <button key={q} onClick={() => toggleQuarter(q)}
                                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${sel ? DS.accent : DS.border}`, background: sel ? DS.accentSoft : DS.surface, color: sel ? DS.accent : DS.textSub, fontSize: 13, fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s' }}
                                  onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = DS.accentBorder }}
                                  onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = DS.border }}
                                >{q}</button>
                              )
                            })}
                          </div>
                          {form.quarters.length > 0 && <div style={{ marginTop: 10, fontSize: 11, color: DS.accent }}>{form.quarters.length} quarter{form.quarters.length > 1 ? 's' : ''} selected</div>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 — Metrics */}
              {wStep === 3 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <SHead title="Select Metrics" sub="Choose financial metrics to track" />
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <SChip label={`${form.sectors.length} sector${form.sectors.length > 1 ? 's' : ''}`} onEdit={() => setWStep(0)} />
                      <SChip label={form.timePeriod === 'annual' ? 'Annual' : 'Quarterly'} onEdit={() => setWStep(2)} />
                    </div>
                  </div>

                  {/* Frequently used */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>FREQUENTLY USED</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {FREQUENTLY_USED_METRICS.filter(m => allMetricsFlat.includes(m)).map(m => {
                        const sel = form.metrics.includes(m)
                        return (
                          <button key={m} onClick={() => toggleMetric(m)}
                            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, background: sel ? DS.accent : DS.accentSoft, border: `1px solid ${sel ? DS.accent : DS.accentBorder}`, color: sel ? '#fff' : DS.accent, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}
                          >{m}</button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Search */}
                  <input value={metricSearch} onChange={e => setMetricSearch(e.target.value)} placeholder="Search metrics…"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.bg, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
                    onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
                    onBlur={e => e.currentTarget.style.borderColor = DS.border}
                  />

                  {/* Annual: collapsible groups */}
                  {form.timePeriod === 'annual' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(ANNUAL_METRIC_GROUPS).map(([group, metrics]) => {
                        const visible = filteredMetrics(metrics)
                        if (visible.length === 0) return null
                        const expanded = expandedGroups.has(group)
                        const allSel = visible.every(m => form.metrics.includes(m))
                        return (
                          <div key={group} style={{ border: `1px solid ${DS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: DS.bg, cursor: 'pointer', gap: 10 }} onClick={() => toggleGroup(group)}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: DS.text, flex: 1 }}>{group}</span>
                              <button onClick={e => { e.stopPropagation(); if (allSel) { setForm(f => ({ ...f, metrics: f.metrics.filter(m => !visible.includes(m)) })) } else { setForm(f => ({ ...f, metrics: Array.from(new Set([...f.metrics, ...visible])) })) } }}
                                style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, border: `1px solid ${DS.accentBorder}`, background: allSel ? DS.accentSoft : 'transparent', color: DS.accent, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {allSel ? 'Deselect all' : 'Select all'}
                              </button>
                              <span style={{ color: DS.textFaint }}>{expanded ? <HiOutlineChevronDown size={14} /> : <HiOutlineChevronRight size={14} />}</span>
                            </div>
                            {expanded && (
                              <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {visible.map(m => {
                                  const sel = form.metrics.includes(m)
                                  return (
                                    <button key={m} onClick={() => toggleMetric(m)}
                                      style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 4 }}
                                      onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = DS.accentBorder }}
                                      onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = DS.border }}
                                    >
                                      {sel && <HiOutlineCheck size={10} />}{m}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Quarterly: flat pill list */}
                  {form.timePeriod === 'quarterly' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {filteredMetrics(QUARTERLY_METRICS).map(m => {
                        const sel = form.metrics.includes(m)
                        return (
                          <button key={m} onClick={() => toggleMetric(m)}
                            style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, background: sel ? DS.accentSoft : DS.surface, border: `1px solid ${sel ? DS.accentBorder : DS.border}`, color: sel ? DS.accent : DS.textSub, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 5 }}
                            onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = DS.accentBorder }}
                            onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = DS.border }}
                          >
                            {sel && <HiOutlineCheck size={11} />}{m}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {form.metrics.length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: DS.accent }}>{form.metrics.length} selected</div>}
                </div>
              )}

              {/* Step 4 — Summary */}
              {wStep === 4 && (
                <div>
                  <SHead title="Review & Name" sub="Confirm settings, then save" />
                  <div style={{ marginTop: 18, marginBottom: 14 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>CONFIGURATION NAME</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '10px 13px', border: `1px solid ${DS.borderMed}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: DS.text, background: DS.bg, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
                      onBlur={e => e.currentTarget.style.borderColor = DS.borderMed}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Sectors */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 72, paddingTop: 2 }}>SECTORS</span>
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {form.sectors.map(s => <span key={s} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, color: DS.accent }}>{s}</span>)}
                      </div>
                      <button onClick={() => setWStep(0)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, color: DS.accent, cursor: 'pointer', flexShrink: 0 }}>Edit</button>
                    </div>
                    {/* Companies */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 72, paddingTop: 2 }}>COMPANIES</span>
                      <span style={{ fontSize: 12, color: '#334155', flex: 1, lineHeight: 1.5 }}>{form.companies.length} selected: {form.companies.slice(0, 4).join(', ')}{form.companies.length > 4 ? '...' : ''}</span>
                      <button onClick={() => setWStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, color: DS.accent, cursor: 'pointer', flexShrink: 0 }}>Edit</button>
                    </div>
                    {/* Time */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 72, paddingTop: 2 }}>TIME</span>
                      <span style={{ fontSize: 12, color: '#334155', flex: 1, lineHeight: 1.5 }}>{timeSummary}</span>
                      <button onClick={() => setWStep(2)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, color: DS.accent, cursor: 'pointer', flexShrink: 0 }}>Edit</button>
                    </div>
                    {/* Metrics */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DS.textFaint, minWidth: 72, paddingTop: 2 }}>METRICS</span>
                      <span style={{ fontSize: 12, color: '#334155', flex: 1, lineHeight: 1.5 }}>{form.metrics.length} selected: {form.metrics.slice(0, 4).join(', ')}{form.metrics.length > 4 ? '...' : ''}</span>
                      <button onClick={() => setWStep(3)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: DS.accentSoft, border: `1px solid ${DS.accentBorder}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, color: DS.accent, cursor: 'pointer', flexShrink: 0 }}>Edit</button>
                    </div>
                  </div>
                  {/* Response style */}
                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>RESPONSE STYLE</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['concise', 'detailed', 'analytical'] as const).map(st => (
                        <button key={st} onClick={() => setForm(f => ({ ...f, responseStyle: st }))} style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${form.responseStyle === st ? DS.accentBorder : DS.border}`, background: form.responseStyle === st ? DS.accentSoft : 'transparent', color: form.responseStyle === st ? DS.accent : DS.textSub, fontSize: 12, fontWeight: form.responseStyle === st ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s' }}>
                          {styleMap[st]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Prompt instructions */}
                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>PROMPT INSTRUCTIONS (optional)</label>
                    <textarea value={form.promptInstructions} onChange={e => setForm(f => ({ ...f, promptInstructions: e.target.value }))} rows={3} placeholder="Additional context or instructions..."
                      style={{ width: '100%', padding: '10px 13px', border: `1px solid ${DS.borderMed}`, borderRadius: 8, fontSize: 12, color: DS.text, background: DS.bg, outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                      onFocus={e => e.currentTarget.style.borderColor = DS.accentBorder}
                      onBlur={e => e.currentTarget.style.borderColor = DS.borderMed}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${DS.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
              {wStep > 0 && (
                <button onClick={() => setWStep(s => (s - 1) as WStep)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 18px', border: `1px solid ${DS.borderMed}`, borderRadius: 8, background: DS.surface, color: DS.textSub, fontSize: 13, cursor: 'pointer' }}>
                  <HiOutlineChevronLeft size={13} /> Back
                </button>
              )}
              {wStep < 4 ? (
                <button onClick={() => setWStep(s => (s + 1) as WStep)} disabled={!canNext[wStep]}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 8, background: canNext[wStep] ? DS.accent : '#e2e8f0', color: canNext[wStep] ? '#fff' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: canNext[wStep] ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: canNext[wStep] ? '0 4px 16px rgba(37,99,235,0.25)' : 'none' }}>
                  {wStep === 0
                    ? `Continue with ${form.sectors.length} sector${form.sectors.length === 1 ? '' : 's'}`
                    : wStep === 1
                    ? `Continue with ${form.companies.length} compan${form.companies.length === 1 ? 'y' : 'ies'}`
                    : wStep === 2
                    ? `Continue → ${form.timePeriod === 'annual' ? `${form.years.length} year${form.years.length === 1 ? '' : 's'}` : `${form.years[0] ?? ''} ${form.quarters.join(', ')}`}`
                    : `Continue with ${form.metrics.length} metric${form.metrics.length === 1 ? '' : 's'}`} →
                </button>
              ) : (
                <button onClick={save} style={{ flex: 1, padding: '10px', border: `1px solid ${DS.accent}`, borderRadius: DS.radius, background: DS.accent, color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  {modal === 'create' ? `Create "${form.name}"` : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {modal === 'delete' && (
        <div style={{ position: 'fixed', inset: 0, background: DS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setModal(null)}>
          <div style={{ background: DS.surface, borderRadius: 14, width: 400, padding: '28px', boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)', border: `1px solid ${DS.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: DS.redSoft, border: `1px solid ${DS.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <HiOutlineTrash size={20} color={DS.red} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DS.text, marginBottom: 6 }}>Delete Configuration</div>
            <div style={{ fontSize: 13, color: DS.textSub, marginBottom: 22, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>"{botConfigs.find(c => c.id === deleteId)?.name}"</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', border: `1px solid ${DS.borderMed}`, borderRadius: 8, background: DS.surface, color: DS.textSub, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: DS.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

function SChip({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)', color: '#2563eb', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
      Edit {label}
    </button>
  )
}
