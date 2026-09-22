import React, { useRef, useState } from 'react'
import type { Screen, BotConfig, WatchlistItem, User, ChatSession, SavedScreener } from '../App'
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlineChatBubbleLeftRight, HiOutlinePencilSquare,
  HiOutlineSquares2X2, HiOutlineBookmark, HiOutlineCog6Tooth, HiOutlinePower,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineAdjustmentsHorizontal,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { RiSparklingLine } from 'react-icons/ri'
import Dashboard from './Dashboard'
import AIChat from './AIChat'
import Admin, { AdminDashboard } from './Admin'
import Compare from './Compare'
import Screener from './Screener'

interface Props {
  screen: Screen
  navigate: (s: Screen) => void
  onBack: () => void
  user: User
  botConfigs: BotConfig[]
  activeBotConfigId: number | null
  onSetActiveBotConfig: (id: number | null) => void
  onAddBotConfig: (cfg: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>) => BotConfig
  onUpdateBotConfig: (id: number, patch: Partial<Omit<BotConfig, 'id' | 'createdAt'>>) => void
  onDeleteBotConfig: (id: number) => void
  watchlists: WatchlistItem[]
  activeWatchlistId: number
  onAddWatchlist: (w: Omit<WatchlistItem, 'id' | 'createdAt' | 'updatedAt'>) => WatchlistItem
  onUpdateWatchlist: (id: number, patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => void
  onDeleteWatchlist: (id: number) => void
  onSetActiveWatchlist: (id: number) => void
  savedScreeners: SavedScreener[]
  onAddSavedScreener: (s: SavedScreener) => void
  onDeleteSavedScreener: (id: number) => void
  recentScreenerRuns: { query: string; count: number; runAt: string }[]
  onScreenerRun: (query: string, count: number) => void
  recentChatMessages: string[]
  onChatMessage: (msg: string) => void
  chatSessions: ChatSession[]
  activeChatId: number
  onNewChat: () => void
  onSelectChat: (id: number) => void
  onDeleteChat: (id: number) => void
  onUpdateChat: (id: number, fn: (s: ChatSession) => ChatSession) => void
}

const ADMIN_NAV:  { id: Screen; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: HiOutlineSquares2X2 },
  { id: 'admin',     label: 'Admin',     icon: HiOutlineCog6Tooth },
]
const ANALYST_NAV: { id: Screen; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: HiOutlineSquares2X2 },
  { id: 'chat',      label: 'AI Chat',   icon: HiOutlineChatBubbleLeftRight },
  { id: 'compare',   label: 'Watchlist', icon: HiOutlineBookmark },
  { id: 'screener',  label: 'Screener',  icon: HiOutlineAdjustmentsHorizontal },
]

const DS = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  border: 'rgba(15,23,42,0.08)',
  borderStrong: 'rgba(37,99,235,0.18)',
  text: '#0f172a',
  textSub: '#475569',
  textFaint: '#94a3b8',
  accent: '#2563eb',
  accentTwo: '#4f46e5',
  accentSoft: 'rgba(37,99,235,0.08)',
  accentBorder: 'rgba(37,99,235,0.18)',
  hover: 'rgba(15,23,42,0.04)',
  shadow: 'none',
  radius: 10,
}

export default function AppShell({
  screen, navigate, onBack, user,
  botConfigs, activeBotConfigId, onSetActiveBotConfig,
  onAddBotConfig, onUpdateBotConfig, onDeleteBotConfig,
  watchlists, activeWatchlistId, onAddWatchlist, onUpdateWatchlist, onDeleteWatchlist, onSetActiveWatchlist,
  savedScreeners, onAddSavedScreener, onDeleteSavedScreener,
  recentScreenerRuns, onScreenerRun, recentChatMessages, onChatMessage,
  chatSessions, activeChatId, onNewChat, onSelectChat, onDeleteChat, onUpdateChat,
}: Props) {
  const activeBotConfig = botConfigs.find(c => c.id === activeBotConfigId) ?? null
  const personalizeOpenerRef = useRef<(() => void) | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const navItems = user.role === 'analyst' ? ANALYST_NAV : ADMIN_NAV
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: DS.bg }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 56 : 188,
        flexShrink: 0,
        background: DS.surface,
        borderRight: `1px solid ${DS.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Logo row */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 9px' : '0 12px',
          gap: 8,
          borderBottom: `1px solid ${DS.border}`,
          flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: DS.surface,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: DS.radius,
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <HiOutlineSparkles size={15} color="#fff" />
          </div>

          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: DS.text, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Instrument Sans, sans-serif' }}>FinBot</div>
                <div style={{ fontSize: 9, color: DS.textFaint, marginTop: 2, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' as const }}>
                  {user.role === 'admin' ? 'Admin' : 'Analyst'}
                </div>
              </div>
              <span style={{
                fontSize: 8, color: DS.accent, border: `1px solid ${DS.accentBorder}`,
                borderRadius: 6, padding: '3px 5px', fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0, background: DS.accentSoft,
              }}>
                BETA
              </span>
            </>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{
              width: 24, height: 24, borderRadius: 7,
              background: 'transparent',
              border: `1px solid ${DS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: DS.textFaint,
              flexShrink: 0,
              marginLeft: collapsed ? 'auto' : 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textFaint }}
          >
            {collapsed ? <HiOutlineChevronRight size={11} /> : <HiOutlineChevronLeft size={11} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '10px 8px 8px', flexShrink: 0 }}>
          {navItems.map(item => {
            const active = screen === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: 8,
                  padding: collapsed ? '8px 0' : '8px 10px',
                  borderRadius: DS.radius,
                  marginBottom: 2,
                  background: active ? DS.accentSoft : 'transparent',
                  border: `1px solid ${active ? DS.accentBorder : 'transparent'}`,
                  color: active ? DS.accent : DS.textSub,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(15,23,42,0.03)'; e.currentTarget.style.color = DS.text } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.textSub } }}
              >
                <item.icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.72 }} />
                {!collapsed && item.label}
              </button>
            )
          })}
        </nav>

        {/* Chat history — analyst only */}
        {!collapsed && user.role !== 'admin' && (
          <>
            <div style={{ height: 1, background: DS.border, margin: '0 10px' }} />
            <div style={{ padding: '8px 8px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 6px' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: DS.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                  Chat History
                </span>
                <button
                  onClick={onNewChat}
                  title="New Chat"
                  style={{ width: 20, height: 20, borderRadius: 6, background: 'transparent', border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.textFaint }}
                  onMouseEnter={e => { e.currentTarget.style.background = DS.accentSoft; e.currentTarget.style.borderColor = DS.accentBorder; e.currentTarget.style.color = DS.accent }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.color = DS.textFaint }}
                >
                  <HiOutlinePlus size={11} />
                </button>
              </div>

              <div style={{ height: 180, overflowY: 'auto' }}>
                {chatSessions.map(sess => {
                  const isActive = sess.id === activeChatId && screen === 'chat'
                  return (
                    <div
                      key={sess.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        borderRadius: 8,
                        background: isActive ? DS.accentSoft : 'transparent',
                        border: `1px solid ${isActive ? DS.accentBorder : 'transparent'}`,
                        marginBottom: 1,
                        minHeight: 42,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = DS.hover }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <button
                        onClick={() => onSelectChat(sess.id)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', background: 'none', border: 'none', textAlign: 'left', minWidth: 0 }}
                      >
                        <HiOutlineChatBubbleLeftRight size={12} color={isActive ? DS.accent : DS.textFaint} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: isActive ? DS.accent : DS.textSub, fontWeight: isActive ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                            {sess.title}
                          </div>
                          <div style={{ fontSize: 9, color: DS.textFaint, lineHeight: 1.3, marginTop: 1 }}>
                            {sess.messages.length > 0 ? `${sess.messages.length} msg${sess.messages.length > 1 ? 's' : ''}` : 'Empty'} · {sess.createdAt}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => onDeleteChat(sess.id)}
                        style={{ width: 20, height: 20, flexShrink: 0, margin: '0 4px', borderRadius: 5, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'transparent'; e.currentTarget.style.background = 'transparent' }}
                      >
                        <HiOutlineTrash size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${DS.border}`, padding: collapsed ? '10px 6px' : '10px 10px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Active config chip — analyst only */}
          {!collapsed && user.role !== 'admin' && (
            <div style={{
              padding: '8px 10px',
              background: DS.accentSoft,
              border: `1px solid ${DS.accentBorder}`,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <RiSparklingLine size={11} color={DS.accent} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8, color: DS.textFaint, letterSpacing: '0.07em', marginBottom: 1, fontWeight: 700, textTransform: 'uppercase' as const }}>Active Config</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: DS.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeBotConfig?.name ?? 'FinBot Default'}
                </div>
              </div>
              <button
                onClick={() => { navigate('chat'); personalizeOpenerRef.current?.() }}
                title="Personalize"
                style={{ width: 22, height: 22, borderRadius: 6, background: 'transparent', border: `1px solid ${DS.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.accent, flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = DS.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = DS.accent }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.accent; e.currentTarget.style.borderColor = DS.accentBorder }}
              >
                <HiOutlinePencilSquare size={11} />
              </button>
            </div>
          )}

          {/* User identity */}
          {collapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: DS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {initials}
              </div>
              <button
                onClick={onBack}
                title="Sign Out"
                style={{ width: 28, height: 28, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
              >
                <HiOutlinePower size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: DS.surfaceAlt, border: `1px solid ${DS.border}`, borderRadius: DS.radius }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: DS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em' }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{user.name}</div>
                <div style={{ fontSize: 10, color: DS.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <button
                onClick={onBack}
                title="Sign Out"
                style={{ width: 26, height: 26, borderRadius: 8, background: 'transparent', border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.textFaint, flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.textFaint; e.currentTarget.style.borderColor = DS.border }}
              >
                <HiOutlinePower size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: DS.bg }}>
        {screen === 'dashboard' && user.role === 'analyst' && (
          <Dashboard
            onNavigate={navigate}
            watchlists={watchlists}
            activeWatchlistId={activeWatchlistId}
            onUpdateWatchlist={onUpdateWatchlist}
            recentScreenerRuns={recentScreenerRuns}
            recentChatMessages={recentChatMessages}
          />
        )}
        {screen === 'dashboard' && user.role === 'admin' && (
          <AdminDashboard botConfigs={botConfigs} />
        )}
        {screen === 'chat' && (
          <AIChat
            botConfigs={botConfigs}
            activeBotConfigId={activeBotConfigId}
            onSetActiveBotConfig={onSetActiveBotConfig}
            onAddBotConfig={onAddBotConfig}
            onUpdateBotConfig={onUpdateBotConfig}
            onDeleteBotConfig={onDeleteBotConfig}
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            onUpdateChat={onUpdateChat}
            onPersonalizeRef={fn => { personalizeOpenerRef.current = fn }}
            savedScreeners={savedScreeners}
            onNavigateToScreener={() => navigate('screener')}
            onMessageSent={onChatMessage}
          />
        )}
        {screen === 'compare' && (
          <Compare
            watchlists={watchlists}
            activeWatchlistId={activeWatchlistId}
            onAdd={onAddWatchlist}
            onUpdate={onUpdateWatchlist}
            onDelete={onDeleteWatchlist}
            onSetActive={onSetActiveWatchlist}
            botConfigs={botConfigs}
          />
        )}
        {screen === 'admin' && (
          <Admin
            watchlists={watchlists}
            onUpdateWatchlist={onUpdateWatchlist}
            botConfigs={botConfigs}
            onUpdateBotConfig={onUpdateBotConfig}
          />
        )}
        {screen === 'screener' && (
          <Screener
            watchlists={watchlists}
            activeWatchlistId={activeWatchlistId}
            onUpdateWatchlist={onUpdateWatchlist}
            onNavigateToChat={() => navigate('chat')}
            savedScreeners={savedScreeners}
            onAddSavedScreener={onAddSavedScreener}
            onDeleteSavedScreener={onDeleteSavedScreener}
            onRunComplete={onScreenerRun}
          />
        )}
      </main>
    </div>
  )
}
