import { useState } from 'react'
import { RiSparklingLine } from 'react-icons/ri'
import {
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineXMark,
  HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser,
  HiOutlineCheckCircle, HiOutlineArrowLeft,
  HiOutlineBuildingOffice2, HiOutlineChartBar,
  HiOutlineCpuChip, HiOutlineGlobeAlt, HiOutlineArrowTrendingUp,
  HiOutlineShieldCheck, HiOutlinePresentationChartLine,
} from 'react-icons/hi2'
import type { User } from '../App'

interface Props { onLogin: (u: User) => void }
type AuthMode = 'login' | 'register' | 'forgot' | 'forgot-sent'
type UserRole = 'admin' | 'analyst'

const C = {
  accent: '#2563eb', accentDark: '#1d4ed8', accentTwo: '#4f46e5',
  accentSoft: 'rgba(37,99,235,0.08)', accentBorder: 'rgba(37,99,235,0.18)',
  text: '#0f172a', textSub: '#475569', textMuted: '#64748b', textFaint: '#94a3b8',
  card: '#fff', border: 'rgba(15,23,42,0.08)',
  red: '#dc2626', redSoft: '#fef2f2', redBorder: '#fecaca',
  green: '#16a34a', greenSoft: '#f0fdf4', greenBorder: '#bbf7d0',
  shadow: 'none',
  radius: 10,
}

const registered = new Map<string, { name: string; password: string }>()

const PREVIEW_SECTORS = ['Financial Services', 'Information Technology', 'Healthcare', 'Automobile', 'FMCG', 'Metals & Mining', 'Power', 'Chemicals', 'Realty', 'Telecommunication', 'Consumer Durables', 'Capital Goods', 'Construction', 'Textiles', 'Utilities']
const PREVIEW_METRICS_PL = ['Sales', 'Operating Profit', 'OPM %', 'Net Profit', 'EPS in Rs', 'Depreciation', 'Interest', 'PBT']
const PREVIEW_METRICS_BS = ['Total Assets', 'Equity Capital', 'Reserves', 'Borrowings', 'Fixed Assets']
const PREVIEW_METRICS_CF = ['Cash From Operations', 'Cash From Investing', 'Cash From Financing']

/* ─── Dashboard preview panel ───────────────────────────────────── */
function DashPreview() {
  const sectorBars = [
    { label: 'Financial Services', w: 88, color: '#2563eb' },
    { label: 'Information Technology', w: 76, color: '#4f46e5' },
    { label: 'Healthcare', w: 62, color: '#0891b2' },
    { label: 'FMCG', w: 55, color: '#059669' },
    { label: 'Automobile', w: 48, color: '#7c3aed' },
    { label: 'Metals & Mining', w: 42, color: '#b45309' },
  ]
  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(37,99,235,0.12)',
      borderRadius: 14, overflow: 'hidden', width: 290,
      transform: 'perspective(900px) rotateY(-10deg) rotateX(3deg)',
      transformOrigin: 'center center',
    }}>
      {/* Header */}
      <div style={{ background: C.accent, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <RiSparklingLine size={14} color="rgba(255,255,255,0.8)" />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'Instrument Sans, sans-serif' }}>FinBot — Sector Overview</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Mono, monospace' }}>22 SECTORS</span>
      </div>
      {/* Metric chips */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(37,99,235,0.07)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {['Sales', 'OPM %', 'Net Profit', 'EPS', 'Total Assets', 'Cash Flow'].map(m => (
          <span key={m} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb', fontFamily: 'DM Mono, monospace' }}>{m}</span>
        ))}
      </div>
      {/* Sector bars */}
      <div style={{ padding: '10px 14px 14px' }}>
        <div style={{ fontSize: 8, color: '#94a3b8', fontFamily: 'DM Mono, monospace', marginBottom: 8, letterSpacing: '0.06em' }}>SECTOR DISTRIBUTION</div>
        {sectorBars.map(({ label, w, color }) => (
          <div key={label} style={{ marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: '#475569' }}>{label}</span>
              <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>{w}%</span>
            </div>
            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 3, opacity: 0.75 }} />
            </div>
          </div>
        ))}
      </div>
      {/* Metric groups footer */}
      <div style={{ borderTop: '1px solid rgba(37,99,235,0.07)', padding: '8px 14px', display: 'flex', gap: 6 }}>
        {[['P&L', '#2563eb'], ['Balance Sheet', '#4f46e5'], ['Cash Flow', '#0891b2']].map(([label, color]) => (
          <span key={label} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: `${color}12`, border: `1px solid ${color}30`, color, fontWeight: 600 }}>{label}</span>
        ))}
      </div>
    </div>
  )
}

/* ─── Floating info card ─────────────────────────────────────────── */
function FloatCard({ icon, title, chips, delay, top, right, left, bottom }:
  { icon: React.ReactNode; title: string; chips: { label: string; color: string }[]; delay: string; top?: string; right?: string; left?: string; bottom?: string }) {
  return (
    <div style={{
      position: 'absolute', top, right, left, bottom,
      background: '#fff', border: '1px solid rgba(37,99,235,0.12)',
      borderRadius: 10, padding: '9px 11px', width: 154,
      animation: `floatCard 4s ease-in-out ${delay} infinite`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.text, fontFamily: 'Instrument Sans, sans-serif' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {chips.map(({ label, color }) => (
          <span key={label} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 6, background: `${color}12`, border: `1px solid ${color}25`, color, fontWeight: 500 }}>{label}</span>
        ))}
      </div>
    </div>
  )
}

/* ─── Stat pill ──────────────────────────────────────────────────── */
function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', marginRight: 14 }}>
      <span style={{ color: C.accent }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'Instrument Sans, sans-serif' }}>{value}</span>
      <span style={{ fontSize: 12, color: C.textSub }}>{label}</span>
    </div>
  )
}

/* ─── Main landing ───────────────────────────────────────────────── */
export default function Landing({ onLogin }: Props) {
  const [mode, setMode] = useState<AuthMode | null>(null)
  const [role, setRole] = useState<UserRole>('analyst')

  return (
    <div style={{
      height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative',
      background: 'radial-gradient(ellipse at 25% 35%, #dbeafe 0%, #eff6ff 45%, #f8faff 100%)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes floatCard { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes floatPreview { 0%,100%{transform:perspective(900px) rotateY(-10deg) rotateX(3deg) translateY(0px)} 50%{transform:perspective(900px) rotateY(-10deg) rotateX(3deg) translateY(-8px)} }
        @keyframes pulse2 { 0%,100%{opacity:0.25} 50%{opacity:0.55} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @media (max-width: 900px) {
          .landing-hero { flex-direction: column !important; align-items: center !important; justify-content: flex-start !important; overflow: auto !important; height: auto !important; min-height: calc(100vh - 53px) !important; padding: 24px 20px 72px !important; }
        }
      `}</style>

      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(37,99,235,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Soft glow blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-8%', right: '15%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', animation: 'pulse2 7s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', animation: 'pulse2 9s ease-in-out 2s infinite' }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 28px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiSparklingLine size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'Instrument Sans, sans-serif', letterSpacing: '-0.02em' }}>FinBot</span>
          <span style={{ fontSize: 8, color: C.textFaint, letterSpacing: '0.08em', fontWeight: 600 }}>BETA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button onClick={() => setMode('login')}
            style={{ padding: '5px 9px', background: 'transparent', border: 'none', borderRadius: 6, color: C.textSub, fontSize: 11.5, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.text }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textSub }}
          >Sign In</button>
          <button onClick={() => setMode('register')}
            style={{ padding: '5px 10px', background: C.accent, border: 'none', borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accentDark }}
            onMouseLeave={e => { e.currentTarget.style.background = C.accent }}
          >Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero" style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 40px 56px', height: 'calc(100vh - 53px)', maxWidth: 1160, margin: '0 auto', gap: 32, boxSizing: 'border-box' }}>

        {/* Left copy */}
        <div style={{ maxWidth: 460, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18, color: C.accent, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em' }}>
            <HiOutlineArrowTrendingUp size={13} />
            AI-powered · NSE / BSE
          </div>

          <h1 style={{ margin: '0 0 14px', fontSize: 38, fontWeight: 700, color: C.text, fontFamily: 'Instrument Sans, sans-serif', letterSpacing: '-0.03em', lineHeight: 1.12 }}>
            Financial analysis<br />
            <span style={{ color: C.accent }}>for Indian markets</span>
          </h1>

          <p style={{ margin: '0 0 24px', fontSize: 14, color: C.textSub, lineHeight: 1.65, maxWidth: 400 }}>
            Explore 22 sectors, 40+ financial metrics, and 5 years of annual &amp; quarterly data — with AI insights across NSE and BSE.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <StatPill icon={<HiOutlineBuildingOffice2 size={12} />} value="5,000+" label="Companies" />
            <StatPill icon={<HiOutlineChartBar size={12} />} value="22" label="Sectors" />
            <StatPill icon={<HiOutlineCpuChip size={12} />} value="40+" label="Metrics" />
            <StatPill icon={<HiOutlineGlobeAlt size={12} />} value="5 Yrs" label="History" />
          </div>
        </div>

        {/* Right: floating 3D preview */}
        <div style={{ position: 'relative', flexShrink: 0, width: 420, height: 400 }}>
          <div style={{ position: 'absolute', top: 36, left: 56, animation: 'floatPreview 5s ease-in-out infinite' }}>
            <DashPreview />
          </div>

          <FloatCard
            icon={<HiOutlineBuildingOffice2 size={11} color={C.accent} />}
            title="Sectors"
            chips={[
              { label: 'Financial Services', color: '#2563eb' },
              { label: 'IT', color: '#4f46e5' },
              { label: 'Healthcare', color: '#0891b2' },
              { label: '+19 more', color: '#64748b' },
            ]}
            delay="0s" top="0px" left="0px"
          />

          <FloatCard
            icon={<HiOutlineChartBar size={11} color="#059669" />}
            title="Annual Metrics"
            chips={[
              { label: 'Sales', color: '#059669' },
              { label: 'OPM %', color: '#0891b2' },
              { label: 'Net Profit', color: '#7c3aed' },
              { label: 'EPS in Rs', color: '#b45309' },
            ]}
            delay="1.4s" bottom="36px" right="0px"
          />

          <FloatCard
            icon={<HiOutlineArrowTrendingUp size={11} color="#7c3aed" />}
            title="Time Periods"
            chips={[
              { label: 'Annual', color: '#2563eb' },
              { label: '2021–2025', color: '#4f46e5' },
              { label: 'Quarterly', color: '#7c3aed' },
            ]}
            delay="0.7s" bottom="0px" left="10px"
          />
        </div>
      </div>

      {/* Sector marquee strip */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(37,99,235,0.07)', padding: '10px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'marquee 30s linear infinite', width: 'max-content' }}>
          {[...PREVIEW_SECTORS, ...PREVIEW_SECTORS].map((s, i) => (
            <span key={i} style={{ fontSize: 10, color: C.textFaint, whiteSpace: 'nowrap', padding: '0 24px', borderRight: '1px solid rgba(37,99,235,0.1)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Auth Modal */}
      {mode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setMode(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 340, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
            <button onClick={() => setMode(null)} style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 6, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', zIndex: 10 }}>
              <HiOutlineXMark size={14} />
            </button>
            {mode === 'login' && <LoginForm role={role} onRoleChange={setRole} onLogin={onLogin} onRegister={() => setMode('register')} onForgot={() => setMode('forgot')} />}
            {mode === 'register' && <RegisterForm role={role} onRoleChange={setRole} onLogin={onLogin} onSignIn={() => setMode('login')} />}
            {mode === 'forgot' && <ForgotForm onSent={() => setMode('forgot-sent')} onBack={() => setMode('login')} />}
            {mode === 'forgot-sent' && <ForgotSent onBack={() => setMode('login')} />}
          </div>
        </div>
      )}

    </div>
  )
}

/* ─── Auth shared ────────────────────────────────────────────────── */

function ModalHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '16px 18px 0' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: 'Instrument Sans, sans-serif', letterSpacing: '-0.02em', lineHeight: 1.25 }}>{title}</div>
      <div style={{ fontSize: 11, color: C.textSub, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, icon, error }: {
  label: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; icon: React.ReactNode; error?: string
}) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPass = type === 'password'
  const borderColor = error ? C.redBorder : focused ? C.accent : 'rgba(15,23,42,0.12)'
  const shadow = focused && !error ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none'
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 500, color: error ? C.red : C.textSub, display: 'block', marginBottom: 4 }}>{label.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: error ? C.red : focused ? C.accent : C.textFaint, display: 'flex', transition: 'color 0.15s' }}>{icon}</span>
        <input
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: '6px 26px', border: `1px solid ${borderColor}`, borderRadius: 6, fontSize: 11, color: C.text, background: error ? C.redSoft : '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', boxShadow: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', height: 30 }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPass && (
          <button onClick={() => setShow(s => !s)} type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textFaint, display: 'flex', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.textFaint}>
            {show ? <HiOutlineEyeSlash size={13} /> : <HiOutlineEye size={13} />}
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: C.red, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>{error}</div>}
    </div>
  )
}

function PrimaryBtn({ label, onClick, loading }: { label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{ width: '100%', padding: '5px 10px', background: loading ? '#93c5fd' : 'rgba(37,99,235,0.08)', color: C.accent, border: `1px solid rgba(37,99,235,0.18)`, borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: '-0.01em', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 30, boxShadow: 'none' }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(37,99,235,0.12)' } }}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'rgba(37,99,235,0.08)' } }}
    >
      {loading ? (
        <span style={{ display: 'flex', gap: 4 }}>
          <span className="thinking-dot" style={{ background: '#fff' }} />
          <span className="thinking-dot" style={{ background: '#fff' }} />
          <span className="thinking-dot" style={{ background: '#fff' }} />
        </span>
      ) : label}
    </button>
  )
}

function PasswordStrength({ pass }: { pass: string }) {
  if (!pass) return null
  const score = [pass.length >= 6, /[A-Z]/.test(pass), /[0-9]/.test(pass), /[^a-zA-Z0-9]/.test(pass)].filter(Boolean).length
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#94a3b8', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a']
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score] : '#e2e8f0', transition: 'background 0.3s' }} />)}
      </div>
      <div style={{ fontSize: 10, color: colors[score], fontFamily: 'DM Mono, monospace' }}>{labels[score]}</div>
    </div>
  )
}

/* ─── Role tabs shared component ────────────────────────────────── */
function RoleTabs({ role, onChange }: { role: UserRole; onChange: (r: UserRole) => void }) {
  const tabs: { id: UserRole; label: string; IconC: React.ElementType }[] = [
    { id: 'admin', label: 'Admin', IconC: HiOutlineShieldCheck },
    { id: 'analyst', label: 'Analyst', IconC: HiOutlinePresentationChartLine },
  ]
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, margin: '12px 18px 0' }}>
      {tabs.map(t => {
        const active = role === t.id
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 6px', border: 'none', borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent', background: 'transparent', color: active ? C.accent : C.textSub, fontSize: 11, fontWeight: active ? 600 : 500, marginBottom: -1, transition: 'color 0.15s', fontFamily: 'Instrument Sans, sans-serif' }}>
            <t.IconC size={12} color={active ? C.accent : C.textFaint} />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function LoginForm({ role, onRoleChange, onLogin, onRegister, onForgot }: { role: UserRole; onRoleChange: (r: UserRole) => void; onLogin: (u: User) => void; onRegister: () => void; onForgot: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = () => {
    setError('')
    if (!email.trim()) { setError('Email is required'); return }
    if (!pass) { setError('Password is required'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const stored = registered.get(email.toLowerCase())
      if (!stored) { setError('No account found. Please register first.'); return }
      if (stored.password !== pass) { setError('Incorrect password. Please try again.'); return }
      onLogin({ name: stored.name, email: email.toLowerCase(), role })
    }, 800)
  }
  return (
    <div>
      <ModalHeader title="Sign in" sub="Enter your credentials to continue" />
      <RoleTabs role={role} onChange={r => { onRoleChange(r); setError('') }} />
      <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<HiOutlineEnvelope size={15} />} />
        <Field label="Password" type="password" value={pass} onChange={setPass} placeholder="Your password" icon={<HiOutlineLockClosed size={15} />} />
        {error && <div style={{ fontSize: 12, color: C.red, background: C.redSoft, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -3 }}>
          <button onClick={onForgot} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 11, fontWeight: 500, padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = C.accent}
            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
            Forgot password?
          </button>
        </div>
        <PrimaryBtn label="Sign in" onClick={submit} loading={loading} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 2, fontSize: 11, color: C.textSub }}>
          No account?
          <button onClick={onRegister} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 500, fontSize: 11, padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = C.accentDark}
            onMouseLeave={e => e.currentTarget.style.color = C.accent}>Create one free</button>
        </div>
      </div>
    </div>
  )
}

function RegisterForm({ role, onRoleChange, onLogin, onSignIn }: { role: UserRole; onRoleChange: (r: UserRole) => void; onLogin: (u: User) => void; onSignIn: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Full name is required'
    if (!email.trim() || !email.includes('@')) e.email = 'Valid email is required'
    if (pass.length < 6) e.pass = 'Password must be at least 6 characters'
    if (pass !== confirm) e.confirm = 'Passwords do not match'
    if (registered.has(email.toLowerCase())) e.email = 'Account already exists — sign in instead'
    return e
  }
  const submit = () => {
    const e = validate(); setErrors(e)
    if (Object.keys(e).length > 0) return
    setLoading(true)
    setTimeout(() => {
      registered.set(email.toLowerCase(), { name: name.trim(), password: pass })
      onLogin({ name: name.trim(), email: email.toLowerCase(), role })
    }, 900)
  }
  return (
    <div>
      <ModalHeader title="Create a free account" sub="Choose your role and get started" />
      <RoleTabs role={role} onChange={onRoleChange} />
      <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Field label="Full name" type="text" value={name} onChange={setName} placeholder="Arjun Sharma" icon={<HiOutlineUser size={15} />} error={errors.name} />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<HiOutlineEnvelope size={15} />} error={errors.email} />
        <Field label="Password" type="password" value={pass} onChange={setPass} placeholder="Min. 6 characters" icon={<HiOutlineLockClosed size={15} />} error={errors.pass} />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" icon={<HiOutlineLockClosed size={15} />} error={errors.confirm} />
        <PasswordStrength pass={pass} />
        <PrimaryBtn label="Create account" onClick={submit} loading={loading} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 2, fontSize: 11, color: C.textSub }}>
          Already have an account?
          <button onClick={onSignIn} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 500, cursor: 'pointer', fontSize: 11, padding: 0 }}>Sign in</button>
        </div>
      </div>
    </div>
  )
}

function ForgotForm({ onSent, onBack }: { onSent: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = () => {
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true); setTimeout(() => { setLoading(false); onSent() }, 1000)
  }
  return (
    <div>
      <ModalHeader title="Reset password" sub="We'll send a reset link to your email" />
      <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Email" type="email" value={email} onChange={v => { setEmail(v); setError('') }} placeholder="you@example.com" icon={<HiOutlineEnvelope size={15} />} error={error} />
        <PrimaryBtn label="Send Reset Link" onClick={submit} loading={loading} />
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: 'none', color: C.textSub, fontSize: 12, cursor: 'pointer' }}>
          <HiOutlineArrowLeft size={12} /> Back to sign in
        </button>
      </div>
    </div>
  )
}

function ForgotSent({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <ModalHeader title="Check your inbox" sub="Password reset link sent" />
      <div style={{ padding: '12px 22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: C.radius, background: C.greenSoft, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiOutlineCheckCircle size={22} color={C.green} />
        </div>
        <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, maxWidth: 280 }}>
          If an account exists for that email, a reset link will arrive shortly. Check your spam folder too.
        </div>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
          <HiOutlineArrowLeft size={13} /> Back to sign in
        </button>
      </div>
    </div>
  )
}

/* suppress unused-variable lint for preview arrays used implicitly */
void PREVIEW_METRICS_PL; void PREVIEW_METRICS_BS; void PREVIEW_METRICS_CF
void DashPreview; void FloatCard
