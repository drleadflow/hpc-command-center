export const runtime = 'nodejs'

import { NextRequest } from 'next/server'

const EMPLOYEE_META: Record<string, { name: string; title: string; pillar: string; description: string; icon: string }> = {
  closer: { name: 'The Closer', title: 'Sales Agent', pillar: 'revenue', description: 'Handles sales conversations with psychology-backed techniques', icon: '🎯' },
  'nurture-engine': { name: 'Nurture Engine', title: 'Follow-Up Agent', pillar: 'revenue', description: 'Follows up with every lead on a proven 7-day cadence', icon: '📬' },
  'cash-machine': { name: 'Cash Machine', title: 'Revenue Agent', pillar: 'revenue', description: 'Runs quarterly revenue plays that double your average deal size', icon: '💵' },
  marketer: { name: 'The Marketer', title: 'Marketing Agent', pillar: 'growth', description: 'Creates content, runs ads, and monitors your competitors', icon: '📱' },
  operator: { name: 'The Operator', title: 'Operations Agent', pillar: 'operations', description: 'Tracks your metrics, streamlines systems, and delegates effectively', icon: '📊' },
  'support-rep': { name: 'Support Rep', title: 'Support Agent', pillar: 'operations', description: 'Responds to customers in under 60 seconds with your brand voice', icon: '💬' },
  'code-agent': { name: 'Code Agent', title: 'Developer Agent', pillar: 'operations', description: 'Writes code, opens PRs, deploys — your AI developer', icon: '💻' },
  'wellness-coach': { name: 'Wellness Coach', title: 'Wellness Agent', pillar: 'personal', description: 'Tracks workouts, sleep, habits, and keeps you mentally strong', icon: '💪' },
  'wealth-strategist': { name: 'Wealth Strategist', title: 'Finance Agent', pillar: 'personal', description: 'Monitors your finances, Rule of 100, and wealth-building goals', icon: '💰' },
  connector: { name: 'The Connector', title: 'Relationship Agent', pillar: 'personal', description: 'Manages relationships — birthdays, follow-ups, networking', icon: '🤝' },
  reflector: { name: 'The Reflector', title: 'Reflection Agent', pillar: 'personal', description: 'Weekly reflections, morning intentions, values alignment', icon: '🙏' },
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json()
    const { role, tools, employees: selectedEmployees, goals, archetype } = body as {
      role: string
      tools: string[]
      employees: string[]
      goals: { revenue: string; leads: string; content: string; personal: string }
      archetype: string
    }

    const { ensureBlade, employees, memories } = await import('@/lib/blade')
    ensureBlade()

    // Upsert each selected employee as active
    for (const slug of selectedEmployees) {
      const meta = EMPLOYEE_META[slug]
      if (meta) {
        employees.upsert({
          slug,
          name: meta.name,
          title: meta.title,
          pillar: meta.pillar,
          description: meta.description,
          icon: meta.icon,
          active: true,
          archetype,
          onboardingAnswers: { role, tools: tools.join(', ') },
        })
      }
    }

    // Save goals as memories
    if (goals.revenue) {
      memories.create({
        type: 'goal',
        content: `Monthly revenue target: $${goals.revenue}`,
        tags: ['goal', 'revenue', 'onboarding'],
        source: 'onboarding',
        confidence: 0.9,
      })
    }

    if (goals.leads) {
      memories.create({
        type: 'goal',
        content: `Monthly leads target: ${goals.leads}`,
        tags: ['goal', 'leads', 'onboarding'],
        source: 'onboarding',
        confidence: 0.9,
      })
    }

    if (goals.content) {
      memories.create({
        type: 'goal',
        content: `Weekly content posts target: ${goals.content}`,
        tags: ['goal', 'content', 'onboarding'],
        source: 'onboarding',
        confidence: 0.9,
      })
    }

    if (goals.personal) {
      memories.create({
        type: 'goal',
        content: `Personal goal: ${goals.personal}`,
        tags: ['goal', 'personal', 'onboarding'],
        source: 'onboarding',
        confidence: 0.9,
      })
    }

    // Save role and archetype as memories
    memories.create({
      type: 'preference',
      content: `User role: ${role}. Communication archetype: ${archetype}.`,
      tags: ['role', 'archetype', 'onboarding'],
      source: 'onboarding',
      confidence: 1.0,
    })

    if (tools.length > 0) {
      memories.create({
        type: 'preference',
        content: `User tools: ${tools.join(', ')}`,
        tags: ['tools', 'onboarding'],
        source: 'onboarding',
        confidence: 0.9,
      })
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Onboarding failed'
    console.error(`[blade/onboard] Error: ${errorMessage}`)
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
