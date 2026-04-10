'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = [
  { id: 'agency', icon: '🏢', title: 'Agency Owner', subtitle: 'Managing clients, team, and growth' },
  { id: 'clinic', icon: '🏥', title: 'Clinic Manager', subtitle: 'Patients, scheduling, and reviews' },
  { id: 'solo', icon: '🚀', title: 'Solo Entrepreneur', subtitle: 'Doing it all — sales, marketing, delivery' },
  { id: 'creator', icon: '🎬', title: 'Content Creator', subtitle: 'Building audience and monetizing' },
  { id: 'sales', icon: '💰', title: 'Sales Professional', subtitle: 'Closing deals and managing pipeline' },
  { id: 'life', icon: '👨‍👩‍👧‍👦', title: 'Life & Family', subtitle: 'Balancing work, health, and relationships' },
]

const TOOLS = {
  CRM: ['GoHighLevel', 'HubSpot', 'Salesforce', 'Pipedrive'],
  Social: ['Instagram', 'LinkedIn', 'Twitter/X', 'TikTok', 'YouTube'],
  Project: ['GitHub', 'Linear', 'Notion', 'Asana'],
  Finance: ['QuickBooks', 'Stripe', 'FreshBooks'],
}

const EMPLOYEES_BY_ROLE: Record<string, string[]> = {
  agency: ['closer', 'nurture-engine', 'operator', 'marketer'],
  clinic: ['support-rep', 'nurture-engine', 'operator', 'wellness-coach'],
  solo: ['closer', 'marketer', 'operator', 'wealth-strategist'],
  creator: ['marketer', 'operator', 'wealth-strategist', 'reflector'],
  sales: ['closer', 'nurture-engine', 'cash-machine', 'operator'],
  life: ['wellness-coach', 'wealth-strategist', 'connector', 'reflector'],
}

const ALL_EMPLOYEES = [
  { id: 'closer', icon: '🎯', name: 'The Closer', what: 'Handles your sales conversations with psychology-backed techniques' },
  { id: 'nurture-engine', icon: '📬', name: 'Nurture Engine', what: 'Follows up with every lead on a proven 7-day cadence' },
  { id: 'cash-machine', icon: '💵', name: 'Cash Machine', what: 'Runs quarterly revenue plays that double your average deal size' },
  { id: 'marketer', icon: '📱', name: 'The Marketer', what: 'Creates content, runs ads, and monitors your competitors' },
  { id: 'operator', icon: '📊', name: 'The Operator', what: 'Tracks your metrics, streamlines systems, and delegates effectively' },
  { id: 'support-rep', icon: '💬', name: 'Support Rep', what: 'Responds to customers in under 60 seconds with your brand voice' },
  { id: 'code-agent', icon: '💻', name: 'Code Agent', what: 'Writes code, opens PRs, deploys — your AI developer' },
  { id: 'wellness-coach', icon: '💪', name: 'Wellness Coach', what: 'Tracks workouts, sleep, habits, and keeps you mentally strong' },
  { id: 'wealth-strategist', icon: '💰', name: 'Wealth Strategist', what: 'Monitors your finances, Rule of 100, and wealth-building goals' },
  { id: 'connector', icon: '🤝', name: 'The Connector', what: 'Manages relationships — birthdays, follow-ups, networking' },
  { id: 'reflector', icon: '🙏', name: 'The Reflector', what: 'Weekly reflections, morning intentions, values alignment' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [goals, setGoals] = useState({ revenue: '', leads: '', content: '', personal: '' })
  const [archetype, setArchetype] = useState<'coach' | 'operator'>('operator')
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState<string[]>([])

  const totalSteps = 6

  function handleRoleSelect(id: string) {
    setRole(id)
    setSelectedEmployees(EMPLOYEES_BY_ROLE[id] ?? [])
  }

  function toggleTool(tool: string) {
    setTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool])
  }

  function toggleEmployee(id: string) {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  async function handleFinish() {
    setActivating(true)
    // Simulate activation with staggered reveals
    for (const emp of selectedEmployees) {
      await new Promise(r => setTimeout(r, 600))
      setActivated(prev => [...prev, emp])
    }
    await new Promise(r => setTimeout(r, 800))

    // Save onboarding data to DB
    try {
      await fetch('/api/blade/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          tools,
          employees: selectedEmployees,
          goals,
          archetype,
        }),
      })
    } catch {
      // Onboarding save failed silently -- user can still proceed
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === step ? 'scale-125' : ''}`}
            style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }}
          />
        ))}
      </div>

      <div className="w-full max-w-3xl">
        {/* Step 0: Role */}
        {step === 0 && (
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>What best describes you?</h1>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>This helps us activate the right AI employees for you</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${role === r.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                  style={{
                    background: 'var(--surface)',
                    borderColor: role === r.id ? 'var(--accent)' : 'var(--border)',
                    boxShadow: role === r.id ? '0 0 20px color-mix(in srgb, var(--accent) 20%, transparent)' : 'none',
                  }}
                >
                  <span className="text-3xl">{r.icon}</span>
                  <div className="mt-3 font-semibold" style={{ color: 'var(--text)' }}>{r.title}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{r.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Tools */}
        {step === 1 && (
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>What tools do you use?</h1>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>We&apos;ll auto-connect what we can</p>
            <div className="space-y-6 text-left">
              {Object.entries(TOOLS).map(([category, items]) => (
                <div key={category}>
                  <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{category}</div>
                  <div className="flex flex-wrap gap-2">
                    {items.map(tool => (
                      <button
                        key={tool}
                        onClick={() => toggleTool(tool)}
                        className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                        style={{
                          background: tools.includes(tool) ? 'var(--accent-bg)' : 'var(--surface)',
                          borderColor: tools.includes(tool) ? 'var(--accent)' : 'var(--border)',
                          color: tools.includes(tool) ? 'var(--accent-text)' : 'var(--text)',
                        }}
                      >
                        {tools.includes(tool) ? '✓ ' : ''}{tool}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Meet Your Team */}
        {step === 2 && (
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Meet your AI team</h1>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>We&apos;ve pre-selected based on your role. Add or remove as you like.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {ALL_EMPLOYEES.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className="flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left"
                  style={{
                    background: 'var(--surface)',
                    borderColor: selectedEmployees.includes(emp.id) ? 'var(--accent)' : 'var(--border)',
                    opacity: selectedEmployees.includes(emp.id) ? 1 : 0.6,
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{emp.icon}</span>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>{emp.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{emp.what}</div>
                  </div>
                  {selectedEmployees.includes(emp.id) && (
                    <span className="ml-auto text-sm" style={{ color: 'var(--accent)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Set your goals</h1>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>These become your scorecard metrics</p>
            <div className="space-y-4 max-w-md mx-auto text-left">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Revenue target /month</label>
                <div className="flex items-center mt-1 rounded-xl border px-4 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>$</span>
                  <input type="number" value={goals.revenue} onChange={e => setGoals({ ...goals, revenue: e.target.value })} placeholder="50,000" className="bg-transparent outline-none ml-2 w-full" style={{ color: 'var(--text)' }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Leads target /month</label>
                <input type="number" value={goals.leads} onChange={e => setGoals({ ...goals, leads: e.target.value })} placeholder="30" className="w-full mt-1 rounded-xl border px-4 py-3 bg-transparent outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }} />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Content posts /week</label>
                <input type="number" value={goals.content} onChange={e => setGoals({ ...goals, content: e.target.value })} placeholder="3" className="w-full mt-1 rounded-xl border px-4 py-3 bg-transparent outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }} />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Personal goal</label>
                <input type="text" value={goals.personal} onChange={e => setGoals({ ...goals, personal: e.target.value })} placeholder="Exercise 5x/week, be present with family" className="w-full mt-1 rounded-xl border px-4 py-3 bg-transparent outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Archetype */}
        {step === 4 && (
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Choose your style</h1>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>How should Blade talk to you?</p>
            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
              <button
                onClick={() => setArchetype('coach')}
                className="p-8 rounded-2xl border-2 text-center transition-all"
                style={{
                  background: archetype === 'coach' ? 'color-mix(in srgb, #d97706 8%, var(--surface))' : 'var(--surface)',
                  borderColor: archetype === 'coach' ? '#d97706' : 'var(--border)',
                }}
              >
                <span className="text-5xl">🤝</span>
                <div className="text-xl font-bold mt-4" style={{ color: 'var(--text)' }}>The Coach</div>
                <div className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Encouraging, asks questions, celebrates wins, gentle accountability</div>
              </button>
              <button
                onClick={() => setArchetype('operator')}
                className="p-8 rounded-2xl border-2 text-center transition-all"
                style={{
                  background: archetype === 'operator' ? 'color-mix(in srgb, #dc2626 8%, var(--surface))' : 'var(--surface)',
                  borderColor: archetype === 'operator' ? '#dc2626' : 'var(--border)',
                }}
              >
                <span className="text-5xl">⚔️</span>
                <div className="text-xl font-bold mt-4" style={{ color: 'var(--text)' }}>The Operator</div>
                <div className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Direct, data-driven, no BS, pushes hard, calls out excuses</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Ready */}
        {step === 5 && (
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Your command center is ready</h1>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>Your AI employees are activating...</p>
            <div className="space-y-3 max-w-md mx-auto text-left">
              {selectedEmployees.map((empId, i) => {
                const emp = ALL_EMPLOYEES.find(e => e.id === empId)
                if (!emp) return null
                const isActivated = activated.includes(empId)
                return (
                  <div
                    key={empId}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all duration-500"
                    style={{
                      background: isActivated ? 'var(--success-bg)' : 'var(--surface)',
                      border: `1px solid ${isActivated ? 'var(--success)' : 'var(--border)'}`,
                      opacity: activating && !isActivated ? 0.5 : 1,
                      animationDelay: `${i * 600}ms`,
                    }}
                  >
                    <span className="text-xl">{emp.icon}</span>
                    <span className="font-medium" style={{ color: 'var(--text)' }}>{emp.name}</span>
                    <span className="ml-auto text-sm" style={{ color: isActivated ? 'var(--success)' : 'var(--muted)' }}>
                      {isActivated ? '✓ Active' : activating ? 'Activating...' : 'Ready'}
                    </span>
                  </div>
                )
              })}
            </div>
            {!activating && (
              <button
                onClick={handleFinish}
                className="mt-8 px-8 py-4 rounded-2xl text-lg font-bold text-white transition-all hover:scale-105"
                style={{ background: 'var(--accent)' }}
              >
                Enter Your Command Center →
              </button>
            )}
            {activated.length === selectedEmployees.length && activating && (
              <button
                onClick={() => router.push('/')}
                className="mt-8 px-8 py-4 rounded-2xl text-lg font-bold text-white transition-all hover:scale-105 animate-pulse"
                style={{ background: 'var(--accent)' }}
              >
                Enter Your Command Center →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8">
        {step > 0 && step < 5 && (
          <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
            Back
          </button>
        )}
        {step < 5 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && !role}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
            style={{ background: 'var(--accent)' }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
