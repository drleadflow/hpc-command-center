export const runtime = 'nodejs'

export async function GET() {
  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // Defaults for Blade DB values (may be unavailable on Vercel)
  let level = 1, levelTitle = 'Commander', xp = 0, nextLevelXp = 100, streakDays = 0
  let allConversations: { id: string; title?: string; createdAt: string }[] = []
  let allEmployees: { slug: string; name: string; title: string; icon: string; active: number; pillar: string }[] = []
  let activeEmployees: typeof allEmployees = []
  let costTotalUsd = 0
  let priorities: { id: string; emoji: string; title: string; description: string; urgency: string; action: string; completed?: number }[] = []

  // Try Blade DB (SQLite — works locally, fails on Vercel serverless)
  let bladeAvailable = false
  try {
    const { ensureBlade } = await import('@/lib/blade')
    ensureBlade()
    bladeAvailable = true

    const { conversations, costEntries, employees: employeesDb } = await import('@/lib/blade')
    allConversations = conversations.list(50)
    const costSummary = costEntries.summary(30)
    costTotalUsd = costSummary.totalUsd
    allEmployees = employeesDb.list()
    activeEmployees = allEmployees.filter(e => e.active === 1)

    // Gamification
    try {
      const { getUserLevel, getStreaks } = await import('@/lib/blade')
      const ul = getUserLevel()
      if (ul) { level = ul.level; levelTitle = ul.title; xp = ul.currentXP; nextLevelXp = ul.nextLevelXP }
      const streaks = getStreaks()
      if (Array.isArray(streaks) && streaks.length > 0) {
        streakDays = Math.max(...streaks.map((s: { currentStreak: number }) => s.currentStreak))
      }
    } catch { /* gamification not initialized yet */ }

  } catch {
    // Blade DB unavailable (Vercel) — continue with external APIs only
  }

  // Load priorities (works on both SQLite and Supabase)
  try {
    const { listTodayPriorities } = await import('@/lib/data/priorities')
    const userPriorities = await listTodayPriorities()
    if (userPriorities.length > 0) {
      priorities = userPriorities.map(p => ({
        id: p.id,
        emoji: p.emoji,
        title: p.title,
        description: p.description ?? '',
        urgency: p.urgency,
        action: p.completed ? '✅ Done' : 'Mark Done',
        completed: p.completed,
      }))
    }
  } catch { /* priorities unavailable */ }

  // System-suggested priorities when none set
  if (priorities.length === 0 && bladeAvailable) {
    if (activeEmployees.length === 0) {
      priorities.push({ id: 'onboard', emoji: '👥', title: 'Set up your AI team', description: 'Pick the employees that will work for you', urgency: 'important', action: 'Start Setup' })
    }
    if (allConversations.length === 0) {
      priorities.push({ id: 'first-chat', emoji: '💬', title: 'Have your first conversation', description: 'Chat with Blade using the bar below', urgency: 'normal', action: 'Start Chat' })
    }
    if (priorities.length === 0) {
      priorities.push({ id: 'keep-going', emoji: '⚡', title: 'Keep building momentum', description: `You've had ${allConversations.length} conversations. Keep going!`, urgency: 'normal', action: 'Chat' })
    }
  }

  // If Blade DB unavailable, show helpful priorities instead of error
  if (!bladeAvailable && priorities.length === 0) {
    priorities.push(
      { id: 'add', emoji: '📝', title: 'Add your daily priorities', description: 'Type what you want to focus on today using the input below', urgency: 'important', action: 'Add' },
    )
  }

  // ── External APIs (work on both local and Vercel) ──

  // Fetch real content stats from Airtable
  let contentTotal = 0
  let contentScheduled = 0
  try {
    const { listContentItems } = await import('@/lib/data/content')
    const items = await listContentItems()
    contentTotal = items.length
    contentScheduled = items.filter(i =>
      i.status && ['📝 Draft', 'Draft', '🎬 In Production', 'In Production', '✅ Approved', 'Approved', 'Ready to Publish', 'Ready'].includes(i.status)
    ).length
  } catch { /* content data unavailable */ }

  // Fetch real ad metrics from Meta
  let adSpend = 0
  let adLeads = 0
  try {
    const metaToken = process.env.META_USER_TOKEN
    const adAccounts = ['act_2549125178703715', 'act_744129051650635', 'act_1707066474017114', 'act_361114249531815']
    if (metaToken) {
      const metaResults = await Promise.allSettled(
        adAccounts.map(acct =>
          fetch(`https://graph.facebook.com/v21.0/${acct}/insights?fields=spend,actions&date_preset=last_30d&access_token=${metaToken}`)
            .then(r => r.json())
        )
      )
      for (const result of metaResults) {
        if (result.status === 'fulfilled' && result.value?.data?.[0]) {
          const d = result.value.data[0]
          adSpend += parseFloat(d.spend || '0')
          const leadActions = (d.actions || []).filter((a: { action_type: string }) =>
            a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped'
          )
          for (const la of leadActions) adLeads += parseInt(la.value || '0', 10)
        }
      }
    }
  } catch { /* Meta API unavailable */ }

  // ── Build scorecard ──

  const scorecard = [
    {
      id: 'ad-spend',
      name: 'Ad Spend (30d)',
      value: Math.round(adSpend),
      target: 5000,
      unit: '$',
      status: adSpend >= 4000 ? 'green' : adSpend >= 2000 ? 'yellow' : 'red',
    },
    {
      id: 'ad-leads',
      name: 'Ad Leads (30d)',
      value: adLeads,
      target: 300,
      unit: '',
      status: adLeads >= 250 ? 'green' : adLeads >= 150 ? 'yellow' : 'red',
    },
    {
      id: 'content-total',
      name: 'Content Items',
      value: contentTotal,
      target: 50,
      unit: '',
      status: contentTotal >= 30 ? 'green' : contentTotal >= 10 ? 'yellow' : 'red',
    },
    {
      id: 'content-scheduled',
      name: 'Scheduled / Ready',
      value: contentScheduled,
      target: 10,
      unit: '',
      status: contentScheduled >= 5 ? 'green' : contentScheduled >= 2 ? 'yellow' : 'red',
    },
    {
      id: 'cost',
      name: 'AI Spend (30d)',
      value: Math.round(costTotalUsd * 100) / 100,
      target: 50,
      unit: '$',
      status: costTotalUsd < 30 ? 'green' : costTotalUsd < 45 ? 'yellow' : 'red',
    },
    {
      id: 'streak',
      name: 'Streak',
      value: streakDays,
      target: 30,
      unit: 'days',
      status: streakDays >= 7 ? 'green' : streakDays >= 3 ? 'yellow' : 'red',
    },
  ]

  // ── Build employee cards ──

  const employeeCards = allEmployees.length > 0
    ? allEmployees.map(e => ({
        id: e.slug,
        name: e.name,
        icon: e.icon || '🤖',
        status: e.active ? 'active' : 'idle',
        lastAction: e.active ? 'Ready to work' : 'Not activated yet',
        lastActionTime: '',
      }))
    : []

  // ── Build activity ──

  const activity = allConversations.slice(0, 6).map(c => ({
    id: c.id,
    employee: '💬',
    action: c.title || 'Conversation',
    time: new Date(c.createdAt).toLocaleString(),
    type: 'info',
  }))

  // ── Build predictions ──

  const predictions: { id: string; icon: string; title: string; detail: string; urgency: string; action: string }[] = []

  if (adSpend > 0 && adLeads > 0) {
    const cpl = adSpend / adLeads
    if (cpl > 40) {
      predictions.push({
        id: 'high-cpl',
        icon: '⚠️',
        title: 'CPL is above target',
        detail: `Current CPL is $${Math.round(cpl)} across all accounts. Target is $35. Review underperforming campaigns.`,
        urgency: 'high',
        action: 'View Ads',
      })
    }
  }

  if (contentScheduled === 0 && contentTotal > 0) {
    predictions.push({
      id: 'no-content-scheduled',
      icon: '📝',
      title: 'No content scheduled',
      detail: `You have ${contentTotal} content items but none are ready to publish. Move items through the pipeline.`,
      urgency: 'medium',
      action: 'Content OS',
    })
  }

  if (!bladeAvailable) {
    predictions.push({
      id: 'blade-offline',
      icon: '🔧',
      title: 'Blade engine offline',
      detail: 'Running in cloud mode — AI team, conversations, and gamification require the local Blade engine.',
      urgency: 'low',
      action: 'Learn More',
    })
  }

  return Response.json({
    briefing: { greeting, date, level, levelTitle, xp, nextLevelXp, streakDays },
    priorities,
    scorecard,
    employees: employeeCards,
    activity,
    predictions,
  })
}
