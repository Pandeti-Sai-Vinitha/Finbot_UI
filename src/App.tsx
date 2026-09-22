import { useState } from 'react'
import Landing from './screens/Landing'
import AppShell from './screens/AppShell'

export type Screen = 'dashboard' | 'chat' | 'admin' | 'compare' | 'screener'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  time: string
  id: number
  rich?: unknown
}

export interface ChatSession {
  id: number
  title: string
  messages: ChatMessage[]
  createdAt: string
}

export interface BotConfig {
  id: number
  name: string
  sectors: string[]
  companies: string[]
  timePeriod: 'annual' | 'quarterly'
  years: string[]
  quarters: string[]
  metrics: string[]
  promptInstructions: string
  responseStyle: 'concise' | 'detailed' | 'analytical'
  createdAt: string
  updatedAt: string
}

export interface WatchlistItem {
  id: number
  name: string
  companies: string[]
  metrics: string[]
  createdAt: string
  updatedAt: string
}

export interface SavedScreener {
  id: number
  name: string
  query: string
  results: Array<{ company: string; price: string; marketCap: string; values: Record<string, string> }>
}

export interface User {
  name: string
  email: string
  role: 'admin' | 'analyst'
}

const mkTs = () => {
  const d = new Date()
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const DEFAULT_BOT_CONFIG_ID = 1
export const DEFAULT_WATCHLIST_ID = 1000

function makeDefaultConfig(): BotConfig {
  const now = mkTs()
  return {
    id: DEFAULT_BOT_CONFIG_ID,
    name: 'FinBot Default',
    sectors: ['Information Technology', 'Financial Services'],
    companies: ['TCS', 'Infosys', 'HDFC Bank', 'ICICI Bank'],
    timePeriod: 'annual',
    years: ['2023', '2024', '2025'],
    quarters: [],
    metrics: ['Sales', 'Net Profit', 'OPM %', 'EPS in Rs', 'Equity Capital', 'Borrowings'],
    responseStyle: 'analytical',
    promptInstructions: 'Focus on Indian equity markets — NSE/BSE listed companies.',
    createdAt: now,
    updatedAt: now,
  }
}

function makeDefaultWatchlist(): WatchlistItem {
  const now = mkTs()
  return {
    id: DEFAULT_WATCHLIST_ID,
    name: 'Core Watchlist',
    companies: [],
    metrics: [],
    createdAt: now,
    updatedAt: now,
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [screen, setScreen] = useState<Screen>('chat')

  // AI Chat personalization — independent from Watchlist
  const [botConfigs, setBotConfigs] = useState<BotConfig[]>(() => [makeDefaultConfig()])
  const [activeBotConfigId, setActiveBotConfigId] = useState<number | null>(DEFAULT_BOT_CONFIG_ID)

  // Watchlist — independent from AI Chat personalization
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>(() => [makeDefaultWatchlist()])
  const [activeWatchlistId, setActiveWatchlistId] = useState<number>(DEFAULT_WATCHLIST_ID)

  // Saved screeners — lifted so they persist across screen switches
  const [savedScreeners, setSavedScreeners] = useState<SavedScreener[]>([])

  // Dashboard activity feeds
  const [recentScreenerRuns, setRecentScreenerRuns] = useState<{ query: string; count: number; runAt: string }[]>([])
  const [recentChatMessages, setRecentChatMessages] = useState<string[]>([])

  const handleScreenerRun = (query: string, count: number) =>
    setRecentScreenerRuns(prev => [{ query, count, runAt: 'Just now' }, ...prev].slice(0, 5))

  const handleChatMessage = (msg: string) =>
    setRecentChatMessages(prev => [msg, ...prev].slice(0, 5))

  // Chat sessions
  const initSession = (): ChatSession => ({ id: Date.now(), title: 'New Chat', messages: [], createdAt: mkTs() })
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => [initSession()])
  const [activeChatId, setActiveChatId] = useState<number>(chatSessions[0].id)

  const goBack = () => { setUser(null); setScreen('chat') }

  const ts = mkTs

  // BotConfig CRUD — fully independent, no paired watchlist creation
  const addBotConfig = (cfg: Omit<BotConfig, 'id' | 'createdAt' | 'updatedAt'>): BotConfig => {
    const cfgId = Math.max(Date.now(), DEFAULT_BOT_CONFIG_ID + 1)
    const next: BotConfig = { ...cfg, id: cfgId, createdAt: ts(), updatedAt: ts() }
    setBotConfigs(prev => [...prev, next])
    setActiveBotConfigId(cfgId)
    return next
  }
  const updateBotConfig = (id: number, patch: Partial<Omit<BotConfig, 'id' | 'createdAt'>>) => {
    setBotConfigs(prev => prev.map(c => c.id === id ? { ...c, ...patch, updatedAt: ts() } : c))
  }
  const deleteBotConfig = (id: number) => {
    setBotConfigs(prev => prev.filter(c => c.id !== id))
    if (activeBotConfigId === id) setActiveBotConfigId(null)
  }

  // WatchlistItem CRUD — fully independent, no paired BotConfig creation
  const addWatchlist = (w: Omit<WatchlistItem, 'id' | 'createdAt' | 'updatedAt'>): WatchlistItem => {
    const wlId = Math.max(Date.now(), DEFAULT_WATCHLIST_ID + 1)
    const newWL: WatchlistItem = { ...w, id: wlId, createdAt: ts(), updatedAt: ts() }
    setWatchlists(prev => [...prev, newWL])
    setActiveWatchlistId(wlId)
    return newWL
  }
  const updateWatchlist = (id: number, patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => {
    setWatchlists(prev => prev.map(w => w.id === id ? { ...w, ...patch, updatedAt: ts() } : w))
  }
  const deleteWatchlist = (id: number) => {
    setWatchlists(prev => {
      const next = prev.filter(w => w.id !== id)
      if (activeWatchlistId === id) setActiveWatchlistId(next[0]?.id ?? DEFAULT_WATCHLIST_ID)
      return next.length > 0 ? next : [makeDefaultWatchlist()]
    })
  }

  const handleSetActiveWatchlist = (id: number) => {
    setActiveWatchlistId(id)
  }

  // SavedScreener CRUD
  const addSavedScreener = (s: SavedScreener) => setSavedScreeners(prev => [...prev, s])
  const deleteSavedScreener = (id: number) => setSavedScreeners(prev => prev.filter(s => s.id !== id))

  // Chat session CRUD
  const addChatSession = (): ChatSession => {
    const s = initSession()
    setChatSessions(prev => [s, ...prev])
    setActiveChatId(s.id)
    setScreen('chat')
    return s
  }
  const selectChatSession = (id: number) => { setActiveChatId(id); setScreen('chat') }
  const deleteChatSession = (id: number) => {
    setChatSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (next.length === 0) {
        const s = initSession(); setActiveChatId(s.id); return [s]
      }
      if (activeChatId === id) setActiveChatId(next[0].id)
      return next
    })
  }
  const updateChatSession = (id: number, fn: (s: ChatSession) => ChatSession) => {
    setChatSessions(prev => prev.map(s => s.id === id ? fn(s) : s))
  }

  if (!user) return <Landing onLogin={(u) => { setUser(u); setScreen(u.role === 'analyst' ? 'screener' : 'admin') }} />

  return (
    <AppShell
      screen={screen}
      navigate={setScreen}
      onBack={goBack}
      user={user}
      botConfigs={botConfigs}
      activeBotConfigId={activeBotConfigId}
      onSetActiveBotConfig={setActiveBotConfigId}
      onAddBotConfig={addBotConfig}
      onUpdateBotConfig={updateBotConfig}
      onDeleteBotConfig={deleteBotConfig}
      watchlists={watchlists}
      activeWatchlistId={activeWatchlistId}
      onAddWatchlist={addWatchlist}
      onUpdateWatchlist={updateWatchlist}
      onDeleteWatchlist={deleteWatchlist}
      onSetActiveWatchlist={handleSetActiveWatchlist}
      savedScreeners={savedScreeners}
      onAddSavedScreener={addSavedScreener}
      onDeleteSavedScreener={deleteSavedScreener}
      recentScreenerRuns={recentScreenerRuns}
      onScreenerRun={handleScreenerRun}
      recentChatMessages={recentChatMessages}
      onChatMessage={handleChatMessage}
      chatSessions={chatSessions}
      activeChatId={activeChatId}
      onNewChat={addChatSession}
      onSelectChat={selectChatSession}
      onDeleteChat={deleteChatSession}
      onUpdateChat={updateChatSession}
    />
  )
}
