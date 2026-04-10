'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
interface Briefing { greeting: string; date: string; level: number; levelTitle: string; xp: number; nextLevelXp: number; streakDays: number }
interface Priority { id: string; emoji: string; title: string; description: string; urgency: 'urgent' | 'important' | 'normal'; action: string }
interface Metric { id: string; name: string; value: number; target: number; unit: string; status: 'green' | 'yellow' | 'red' }
interface Employee { id: string; name: string; icon: string; status: 'active' | 'idle'; lastAction: string; lastActionTime: string }
interface Activity { id: string; employee: string; action: string; time: string; type: string }
interface Prediction { id: string; icon: string; title: string; detail: string; urgency: 'high' | 'medium' | 'low'; action: string }

interface DashboardData {
  briefing: Briefing
  priorities: Priority[]
  scorecard: Metric[]
  employees: Employee[]
  activity: Activity[]
  predictions: Prediction[]
}

const EMPTY_DATA: DashboardData = {
  briefing: {
    greeting: 'Welcome to Blade',
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    level: 1, levelTitle: 'Rookie', xp: 0, nextLevelXp: 100, streakDays: 0,
  },
  priorities: [{ id: 'loading', emoji: '⏳', title: 'Loading...', description: 'Connecting to Blade engine', urgency: 'normal', action: '' }],
  scorecard: [],
  employees: [],
  activity: [],
  predictions: [],
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 1000
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>
}

function ScorecardCard({ metric }: { metric: Metric }) {
  const statusColors = {
    green: { dot: 'bg-emerald-400', glow: 'shadow-emerald-400/30', border: 'border-emerald-500/20' },
    yellow: { dot: 'bg-amber-400', glow: 'shadow-amber-400/30', border: 'border-amber-500/20' },
    red: { dot: 'bg-red-400', glow: 'shadow-red-400/30', border: 'border-red-500/20' },
  }
  const s = statusColors[metric.status]

  return (
    <div className={`relative overflow-hidden rounded-xl border ${s.border} p-4`} style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{metric.name}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${s.dot} ${s.glow} shadow-lg animate-pulse`} />
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        <AnimatedNumber value={metric.value} prefix={metric.unit === '$' ? '$' : ''} suffix={metric.unit !== '$' ? metric.unit : ''} />
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
        Target: {metric.unit === '$' ? '$' : ''}{metric.target.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
      </div>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
            background: metric.status === 'green' ? 'var(--success)' : metric.status === 'yellow' ? 'var(--warning)' : 'var(--danger)',
          }}
        />
      </div>
    </div>
  )
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const isActive = employee.status === 'active'
  return (
    <div
      className={`flex-shrink-0 w-48 rounded-xl border p-4 transition-all duration-300 ${isActive ? 'border-[var(--accent)]/30' : 'border-[var(--border)] opacity-60'}`}
      style={{ background: 'var(--surface)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{employee.icon}</span>
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
      </div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{employee.name}</div>
      <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{employee.lastAction}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{employee.lastActionTime}</div>
    </div>
  )
}

function PriorityCard({ priority, index, onComplete, onDelete }: {
  priority: Priority & { completed?: number }
  index: number
  onComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}) {
  const isCompleted = priority.completed === 1
  const urgencyStyles = {
    urgent: 'border-l-red-500 bg-red-500/5',
    important: 'border-l-amber-500 bg-amber-500/5',
    normal: 'border-l-blue-500 bg-blue-500/5',
  }

  return (
    <div
      className={`rounded-xl border-l-4 p-4 ${urgencyStyles[priority.urgency]} animate-fade-in ${isCompleted ? 'opacity-50' : ''}`}
      style={{ animationDelay: `${index * 150}ms`, background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{priority.emoji}</span>
          <div>
            <div className={`font-semibold ${isCompleted ? 'line-through' : ''}`} style={{ color: 'var(--text)' }}>{priority.title}</div>
            {priority.description && (
              <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{priority.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onComplete(priority.id, !isCompleted)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: isCompleted ? 'var(--border)' : 'var(--accent-bg)', color: isCompleted ? 'var(--muted)' : 'var(--accent-text)' }}
          >
            {isCompleted ? '↩ Undo' : '✓ Done'}
          </button>
          <button
            onClick={() => onDelete(priority.id)}
            className="text-xs px-2 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted)' }}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export function BladeCommandCenter() {
  const [chatInput, setChatInput] = useState('')
  const [newPriority, setNewPriority] = useState('')
  const [addingPriority, setAddingPriority] = useState(false)
  const [data, setData] = useState<DashboardData>(EMPTY_DATA)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [isSending, setIsSending] = useState(false)
  const chatPanelRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat panel when new messages arrive
  useEffect(() => {
    if (chatPanelRef.current) {
      chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight
    }
  }, [chatMessages])

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/blade/dashboard')
      if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`)
      const json = await res.json()
      // API returns data at top level (briefing, priorities, etc.) not wrapped in {success, data}
      if (json.briefing) {
        setData(json as DashboardData)
      } else if (json.success && json.data) {
        setData(json.data as DashboardData)
      }
    } catch (err) {
      console.error('[Blade] Dashboard fetch error:', err)
      // Fetch failed -- keep using current data
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  const addPriority = useCallback(async () => {
    const title = newPriority.trim()
    if (!title) return
    setAddingPriority(true)
    setNewPriority('')
    try {
      await fetch('/api/blade/priorities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      await fetchDashboard()
    } catch { /* silently fail */ }
    setAddingPriority(false)
  }, [newPriority, fetchDashboard])

  const completePriority = useCallback(async (id: string, complete: boolean) => {
    try {
      await fetch('/api/blade/priorities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: complete ? 'complete' : 'uncomplete' }),
      })
      await fetchDashboard()
    } catch { /* silently fail */ }
  }, [fetchDashboard])

  const deletePriority = useCallback(async (id: string) => {
    try {
      await fetch('/api/blade/priorities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' }),
      })
      await fetchDashboard()
    } catch { /* silently fail */ }
  }, [fetchDashboard])

  const sendChat = useCallback(async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || isSending) return
    setChatInput('')
    setIsSending(true)
    setChatMessages(prev => [...prev, { role: 'user', content: trimmed }])

    try {
      const res = await fetch('/api/blade/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!res.ok || !res.body) {
        throw new Error('Chat request failed')
      }

      // Read SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }])

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.text) {
                assistantText += parsed.text
                setChatMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                  return updated
                })
              } else if (parsed.finalResponse) {
                assistantText = parsed.finalResponse
                setChatMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                  return updated
                })
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not connect to the Blade engine right now. Please try again.' },
      ])
    } finally {
      setIsSending(false)
    }
  }, [chatInput, isSending])

  const { briefing, priorities, scorecard, employees, activity, predictions } = data

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pb-24 space-y-8">
      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            {briefing.greeting}, Dr. Emeka
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{briefing.date}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{briefing.streakDays} day streak</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--accent-text)' }}>
              Lvl {briefing.level} — {briefing.levelTitle}
            </span>
            <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${(briefing.xp / briefing.nextLevelXp) * 100}%`, background: 'var(--accent)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{briefing.xp} XP</span>
          </div>
        </div>
      </div>

      {/* Daily Priorities */}
      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          ⚡ Your Top 3 Today
        </h2>
        <div className="space-y-3">
          {priorities.map((p, i) => (
            <PriorityCard key={p.id} priority={p} index={i} onComplete={completePriority} onDelete={deletePriority} />
          ))}
        </div>
        {/* Add priority input */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addPriority() }}
            placeholder="Add a priority for today..."
            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            disabled={addingPriority}
          />
          <button
            onClick={addPriority}
            disabled={addingPriority || !newPriority.trim()}
            className="px-4 py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {addingPriority ? '...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Scorecard Row */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>📊 Scorecard</h2>
          <Link href="/scorecard" className="text-sm" style={{ color: 'var(--accent)' }}>View all →</Link>
        </div>
        {scorecard.length === 0 ? (
          <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No metrics yet. Complete onboarding to set your goals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {scorecard.map(m => (
              <ScorecardCard key={m.id} metric={m} />
            ))}
            {scorecard.length > 0 && scorecard.every(m => m.status === 'red') && (
              <div className="col-span-full text-center mt-2">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Don&apos;t worry -- these improve as you use Blade</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Employees */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>👥 Your Team</h2>
          <Link href="/agents" className="text-sm" style={{ color: 'var(--accent)' }}>Manage →</Link>
        </div>
        {employees.length === 0 ? (
          <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>No employees activated yet.</p>
            <Link href="/onboarding" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Set up your team &rarr;</Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {employees.map(e => (
              <EmployeeCard key={e.id} employee={e} />
            ))}
          </div>
        )}
      </div>

      {/* Two Column: Activity + Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>🔄 Live Activity</h2>
          <div className="space-y-2 rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {activity.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>Chat with Blade to see activity here</p>
            ) : (
              activity.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-lg flex-shrink-0">{a.employee}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm" style={{ color: 'var(--text)' }}>{a.action}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Predictions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>🔮 Predictions</h2>
          <div className="space-y-3">
            {predictions.length === 0 ? (
              <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Activate employees to get predictions</p>
              </div>
            ) : (
              predictions.map(p => {
                const borderColor = p.urgency === 'high' ? 'var(--danger)' : p.urgency === 'medium' ? 'var(--warning)' : 'var(--accent)'
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border-l-4 p-4"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeftColor: borderColor }}
                  >
                    <div className="flex items-start gap-2">
                      <span>{p.icon}</span>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.title}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{p.detail}</div>
                        <button className="text-xs font-medium mt-2" style={{ color: 'var(--accent)' }}>{p.action} &rarr;</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages (shown above the bar when there are messages) */}
      {chatMessages.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-6">
          <div ref={chatPanelRef} className="max-w-4xl mx-auto max-h-64 overflow-y-auto rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${msg.role === 'user' ? 'text-white' : ''}`}
                  style={{
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--border)',
                    color: msg.role === 'user' ? 'white' : 'var(--text)',
                  }}
                >
                  {msg.content || (isSending ? 'Blade is thinking...' : '')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed Chat Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-4 pt-2" style={{ background: 'linear-gradient(transparent, var(--bg) 30%)' }}>
        <div className="max-w-4xl mx-auto">
          <div
            className="flex items-center gap-3 rounded-2xl border px-5 py-3.5 backdrop-blur-xl"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder="Ask Blade anything... or type / for commands"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text)' }}
              disabled={isSending}
            />
            <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--muted)' }} title="Voice">
              🎤
            </button>
            <button
              onClick={sendChat}
              disabled={isSending || !chatInput.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
