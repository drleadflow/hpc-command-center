// Growth Engine — 8-stage customer acquisition journey
// Source: HPC Growth Engine Complete document

export interface SopStep {
  title: string;
  description: string;
  tag?: string;
}

export interface Script {
  label: string;
  text: string;
}

export interface Kpi {
  metric: string;
  target: string;
}

export interface Tool {
  name: string;
  usage: string;
}

export interface FailurePoint {
  warning: string;
  fix: string;
}

export interface GrowthStage {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  owner: string;
  trigger: string;
  cadence: string;
  isPowerStage: boolean;
  isWebinarTrack: boolean;
  sops: SopStep[];
  scripts: Script[];
  kpis: Kpi[];
  tools: Tool[];
  fails: FailurePoint[];
  extras?: Record<string, SopStep[] | Script[]>;
}

export const GROWTH_STAGES: GrowthStage[] = [
  {
    id: "awareness",
    num: "01",
    title: "Awareness",
    subtitle: "Right health business owners discover Health Pro CEO",
    owner: "Marketing Lead · Content Editor",
    trigger: "Ongoing — always on",
    cadence: "Daily content · Weekly cold outreach · Bi-weekly ad creative review",
    isPowerStage: false,
    isWebinarTrack: false,
    sops: [
      { title: "Define and document the ICP", description: "Any health business owner — medspa, dental, chiropractic, psychiatry, wellness clinic, physical therapy, weight loss clinic. Revenue $500K–$3M, 1–3 locations. Core pains: inconsistent patient lead flow, no automation, staff retention issues, operational overwhelm." },
      { title: "Weekly content calendar — 6 pieces minimum", description: "Plan 2 weeks ahead. Minimum weekly output: 2 Reels, 3 educational carousels, 1 case study or result post. Categories: pain-point, educational (AI + automation), social proof, authority content." },
      { title: "Instagram paid ads — webinar registration campaign", description: "Weekly paid campaign driving to webinar registration page. Ad angle: the outcome the webinar delivers. Test 3 creatives per cycle. Track cost per registrant. Rotate creative every 2 weeks." },
      { title: "Cold email outreach — separate sending domain only", description: "Source health business owner contacts via Apollo.io or Instantly. 5-step sequence. 30 sends/day per warmed domain. CTA: webinar registration or VSL page." },
      { title: "Case study and result bank maintenance", description: "After any client milestone: request a testimonial immediately. Testimonials should span multiple practice types. Store in Result Bank in Notion. Minimum 1 new result per active client per month." },
      { title: "Weekly performance audit", description: "Every Monday: pull reach, profile visits, bio link clicks, DM volume, ad CPR, email metrics. Flag anything below benchmark 2 weeks in a row." },
    ],
    scripts: [
      { label: "Webinar ad copy — primary hook", text: "Still trying to figure out where your next patients are coming from — without burning through your team?\n\nWe're hosting a free live training showing exactly how health business owners are using AI to fill their calendars and cut admin overhead — without adding more staff.\n\nSpots are limited. Register below." },
      { label: "Cold email — Step 1 opener", text: "Subject: Quick question about [Practice Name]\n\nHey [First Name] — I work with health business owners who are frustrated with inconsistent patient flow and the constant cost of managing staff for follow-ups and scheduling.\n\nWe install AI-powered systems specifically for health practices that handle this automatically.\n\nWould it be off base to share what that looks like for a practice like yours?" },
    ],
    kpis: [
      { metric: "Instagram profile visits/week", target: "500+" },
      { metric: "Webinar ad CPR", target: "Under $10" },
      { metric: "Cold email open rate", target: "40%+" },
      { metric: "Cold email reply rate", target: "8%+" },
      { metric: "Paid ad CTR", target: "2.5%+" },
      { metric: "Organic DMs/week", target: "15+ minimum" },
      { metric: "Content pieces/week", target: "6 minimum" },
    ],
    tools: [
      { name: "Instagram / Meta Ads", usage: "Paid webinar campaign + organic" },
      { name: "Apollo.io / Instantly", usage: "Cold email outreach" },
      { name: "Canva / CapCut", usage: "Content and ad creative" },
      { name: "Notion", usage: "ICP doc, result bank, content calendar" },
      { name: "Google Postmaster Tools", usage: "Cold email domain health" },
    ],
    fails: [
      { warning: "Webinar ad selling the event instead of the outcome", fix: "'Join our free webinar' gets ignored. Sell the transformation." },
      { warning: "Posting without a CTA", fix: "Awareness without capture is brand building with no ROI." },
      { warning: "Running cold email on your primary domain", fix: "This will get healthproceo.com flagged. Always use a separate sending domain." },
    ],
  },
  {
    id: "capture",
    num: "02",
    title: "Capture",
    subtitle: "Lead takes action — enters the Health Pro CEO ecosystem",
    owner: "Marketing Lead · Tech/Automation Specialist",
    trigger: "Prospect clicks any CTA from any awareness channel",
    cadence: "Funnels live 24/7 · Weekly conversion review · Monthly funnel audit",
    isPowerStage: false,
    isWebinarTrack: false,
    sops: [
      { title: "Webinar registration page — primary capture", description: "Required fields: first name, email, phone (required), practice name, practice type (dropdown), monthly revenue range. Target: 40%+ conversion on paid traffic." },
      { title: "VSL landing page — evergreen capture", description: "For cold email and non-webinar campaigns. Structure: hook (60 sec), problem, solution, proof, CTA. Same fields including practice type. Target: 25%+ on cold traffic." },
      { title: "Lead magnet — secondary capture", description: "PDF or short training behind an email gate. Gate with name, email, phone, practice type. Deliver via automated email within 60 seconds." },
      { title: "Source tagging — mandatory on every capture point", description: "Every opt-in fires a source tag in GHL: webinar-reg-paid-ig, webinar-reg-organic, VSL-page, lead-magnet, cold-email, referral. Also tag practice type on entry." },
      { title: "Confirmation sequence — fires within 60 seconds", description: "Webinar registrants: confirmation email + add-to-calendar link, SMS confirms. All other opt-ins: email delivers asset + SMS confirms." },
      { title: "Conversion rate testing", description: "Webinar reg target: 40%+ on paid. VSL target: 25%+ on cold. Test one element per funnel per quarter. All tests logged in the A/B testing log." },
    ],
    scripts: [
      { label: "Webinar registration confirmation — SMS", text: "You're registered! [First Name], we'll see you [Day] at [Time] CST for the Health Pro CEO Training. Add it to your calendar: [link]." },
      { label: "Webinar confirmation — email subject", text: "Subject: You're in, [First Name] — here's your link for [Day]" },
    ],
    kpis: [
      { metric: "Webinar reg page conversion (paid)", target: "40%+" },
      { metric: "VSL opt-in rate (cold)", target: "25%+" },
      { metric: "Lead magnet conversion", target: "30%+" },
      { metric: "Cost per webinar registrant", target: "Under $10" },
      { metric: "Source + practice type tagged", target: "100%" },
      { metric: "Confirmation delivery", target: "Under 60 seconds" },
    ],
    tools: [
      { name: "GoHighLevel", usage: "All funnels, forms, automations, confirmations" },
      { name: "Meta Ads Manager", usage: "Webinar registration campaign" },
      { name: "Zoom / StreamYard", usage: "Webinar hosting" },
      { name: "Calendly", usage: "Marketing audit call booking" },
    ],
    fails: [
      { warning: "No practice type captured at registration", fix: "Without practice type, setters send generic openers. Make it a required dropdown." },
      { warning: "No phone number captured", fix: "Without a phone number the marketing audit cannot be delivered via SMS." },
      { warning: "No source tag on registrations", fix: "You can't calculate ROI by channel without source tags." },
    ],
  },
  {
    id: "webinar",
    num: "03",
    title: "Webinar Track",
    subtitle: "Weekly live training — fast-track lane through the funnel",
    owner: "Webinar Host · Marketing Lead · Appointment Setter",
    trigger: "Weekly — every registrant enters at registration",
    cadence: "Weekly: pre-webinar → live event → post-webinar segmentation within 2 hours",
    isPowerStage: false,
    isWebinarTrack: true,
    sops: [
      { title: "Pre-webinar reminder sequence — 4 touches", description: "Immediate: confirmation email + SMS. Day before: reminder email. Morning of: SMS with Zoom link. 1 hour before: SMS final reminder. All 4 touches required." },
      { title: "Webinar structure — 60-minute framework", description: "0–5: Welcome, credibility, agenda. 5–20: The Problem. 20–40: The Solution — AI operating system. 40–50: Social proof. 50–60: Three offer paths + CTA + Q&A." },
      { title: "Post-webinar segmentation — within 2 hours", description: "Segment every registrant: Hot (stayed through offer + CTA click), Warm (30+ min, no CTA), Cold (left before 30 min), No-Show. Apply GHL tags. Trigger correct automation." },
      { title: "Replay sequence — within 24 hours", description: "Never send replay to hot leads. No-shows and cold leads get replay email with 48-hr expiry + SMS." },
      { title: "Weekly webinar debrief — within 24 hours", description: "Complete the Webinar Scorecard in Notion within 24 hours of every webinar. Review in Tuesday team meeting." },
    ],
    scripts: [
      { label: "Morning-of reminder — SMS", text: "Today's the day, [First Name]! The Health Pro CEO Training starts at [Time] CST. Join us here: [Zoom link]. See you soon." },
      { label: "Webinar CTA drop — in chat", text: "Ready to take the next step? Book your free strategy call here: [Calendly link]." },
      { label: "Replay email — no-show subject", text: "Subject: You missed it, [First Name] — here's the replay (expires in 48hrs)" },
    ],
    kpis: [
      { metric: "Show rate", target: "40%+" },
      { metric: "Avg watch time", target: "45+ min" },
      { metric: "Stayed through offer", target: "50%+ of attendees" },
      { metric: "CTA clicks during webinar", target: "20%+ of live attendees" },
      { metric: "Replay open rate (no-shows)", target: "30%+" },
      { metric: "Webinar scorecard completed", target: "100% within 24hrs" },
    ],
    tools: [
      { name: "Zoom / StreamYard", usage: "Live webinar hosting" },
      { name: "GoHighLevel", usage: "Pre/post sequences, segmentation" },
      { name: "Notion", usage: "Webinar script, scorecard tracker" },
      { name: "Canva", usage: "Webinar slide deck" },
    ],
    fails: [
      { warning: "Problem framing too narrow — only medspa language", fix: "Must resonate with dentist, chiropractor, and psych practice equally. Use 'health business owner' language." },
      { warning: "No engagement tracking during webinar", fix: "Without engagement data there is no post-webinar segmentation." },
      { warning: "Webinar scorecard not completed after every event", fix: "One scorecard isn't useful. The trend over 10+ webinars is where the learning lives." },
    ],
  },
  {
    id: "crm",
    num: "04",
    title: "CRM Entry",
    subtitle: "Every lead logged, tagged, scored, and assigned a pipeline stage",
    owner: "Tech/Automation Specialist · Operations Manager",
    trigger: "Any form submission, opt-in, or registration auto-syncs to GHL",
    cadence: "Real-time automation · Weekly hygiene audit every Monday",
    isPowerStage: false,
    isWebinarTrack: false,
    sops: [
      { title: "GHL pipeline structure", description: "Stages: New Lead → Nurtured → Setter Triggered → Marketing Audit Sent → Call Booked → Showed → Qualified → Proposal Sent → Closed Won (A/B/C) → Closed Lost → Reactivation Queue." },
      { title: "Source and practice type tagging on entry", description: "Tags applied automatically: source (webinar/social-dm/cold-email/lead-magnet/referral/VSL), practice type (medspa/dental/chiro/psych/wellness/PT/other), date, campaign. Both tags permanent and mandatory." },
      { title: "Contact scoring system", description: "Score 1–10. Revenue $500K–$1M = 2pts, $1M+ = 3pts. Locations 2+ = 2pts. Webinar 30+ min = 2pts. Clicked CTA = 3pts. Replied SMS = 2pts. Booked independently = 3pts. Score 7+ = setter priority." },
      { title: "Team notification triggers", description: "Score 7+ or webinar-hot → Slack alert to #dr-lead-flow within 5 minutes. Include name, source, practice type, business name, and score." },
      { title: "Weekly CRM hygiene — every Monday", description: "Pull contacts with no activity 14+ days. Move to Reactivation Queue. Tag stale-14d. Enter 90-day reactivation sequence." },
      { title: "Monthly pipeline report", description: "First of each month: leads by source, leads by practice type, stage conversion rates, closed won by path, MRR, loss reasons." },
    ],
    scripts: [
      { label: "Internal Slack alert — audit delivered", text: "MARKETING AUDIT DELIVERED\nName: [First Name Last Name]\nPractice: [Practice Name] · Type: [practice type]\nCall scheduled: [Date] at [Time]\nAction: Closer — review audit before call time" },
    ],
    kpis: [
      { metric: "CRM sync rate", target: "100%" },
      { metric: "Source + practice type tagged", target: "100%" },
      { metric: "Setter response time (score 7+)", target: "Under 2 hours" },
      { metric: "Stale lead rate", target: "Under 15%" },
      { metric: "Closed won tagged by path", target: "100%" },
    ],
    tools: [
      { name: "GoHighLevel", usage: "CRM, pipeline, tagging, automations" },
      { name: "Slack — Dr. Lead Flow", usage: "Internal lead alerts" },
      { name: "Google Sheets", usage: "Weekly export and dedup audit" },
    ],
    fails: [
      { warning: "No practice type tag on entry", fix: "Setters need to know if they're talking to a dentist or a medspa owner." },
      { warning: "No 'Marketing Audit Sent' stage in pipeline", fix: "Without this stage you can't track audit-to-call conversion." },
      { warning: "Setter not notified fast enough for hot leads", fix: "Hot leads have a 2-hour window. Build the automation." },
    ],
  },
  {
    id: "nurture",
    num: "05",
    title: "Nurture",
    subtitle: "Automated sequences build trust, authority, and buying intent",
    owner: "Marketing Lead · Tech/Automation Specialist",
    trigger: "Auto-triggers by source and engagement tag. Hot leads bypass this stage.",
    cadence: "Email: Day 1/3/5/8/14/21/30 · SMS: Day 1/4/10 · 90-day reactivation",
    isPowerStage: false,
    isWebinarTrack: false,
    sops: [
      { title: "Standard email nurture — 7 touches", description: "Day 1: Welcome + asset. Day 3: Pain story. Day 5: Education — how AI changes the game. Day 8: Client result. Day 14: Webinar re-registration. Day 21: Soft offer. Day 30: Breakup or reactivation." },
      { title: "SMS nurture — 3 touches", description: "Day 1: Asset or replay confirmation. Day 4: 'Quick question — are you currently running any patient lead gen at [Practice Name]?' Day 10: 'We ran a quick marketing audit on [Practice Name]'s online presence — want to see what we found?'" },
      { title: "Personalization by practice type", description: "Day 5 email should reference their practice type: 'How dental practices are...' or 'How chiropractic clinics are...' Build variants for top 3 practice types in pipeline." },
      { title: "Low-engagement re-routing", description: "No email open in 3 consecutive sends by Day 14 — tag low-engagement, 2-email last-chance sub-sequence. If still no open — enter 90-day reactivation." },
      { title: "90-day reactivation bucket", description: "Leads who: didn't open 3 consecutive nurture emails, completed 7-touch with no engagement, were tagged setter-no-response, or were tagged closed-lost." },
    ],
    scripts: [
      { label: "Day 4 SMS — opener", text: "Hey [First Name] — quick question. Are you currently running any automated follow-up or lead gen for [Practice Name]? Just curious what's working (or not) right now." },
      { label: "Day 10 SMS — audit pivot", text: "[First Name] — we ran a quick marketing audit on [Practice Name]'s online presence and found a few things worth flagging. Want me to send over what we found?" },
    ],
    kpis: [
      { metric: "Email open rate", target: "35%+" },
      { metric: "Email click rate", target: "6%+" },
      { metric: "SMS Day 4 reply rate", target: "15%+" },
      { metric: "SMS Day 10 reply rate", target: "20%+" },
      { metric: "Nurture → Setter Triggered rate", target: "20%+" },
    ],
    tools: [
      { name: "GoHighLevel", usage: "Email + SMS sequences and automation" },
      { name: "Loom", usage: "Video embeds and replay hosting" },
      { name: "Notion", usage: "Sequence copy master doc, A/B test log" },
      { name: "ZeroBounce", usage: "Email list verification" },
    ],
    fails: [
      { warning: "Generic email copy with no health business specificity", fix: "'Tips for growing your business' gets ignored. 'How one chiropractic clinic cut 15 staff hours per week using AI' gets opened." },
      { warning: "Sending hot leads into standard nurture", fix: "Hot leads skip nurture entirely. The automation must prevent this." },
      { warning: "No 90-day reactivation sequence", fix: "Leads going cold without reactivation are permanently lost revenue." },
    ],
  },
  {
    id: "setter",
    num: "06",
    title: "Setter Engagement",
    subtitle: "First human touch — marketing audit delivered, call booked",
    owner: "Appointment Setter",
    trigger: "Score 7+ · Webinar hot lead · SMS Day 10 reply · Replay click",
    cadence: "Hot leads: within 2 hours · All others: same day · Audit within 24hrs",
    isPowerStage: true,
    isWebinarTrack: false,
    sops: [
      { title: "Trigger monitoring — twice daily", description: "Morning and afternoon: review GHL for new 7+ score leads, webinar-hot tags, SMS Day 10 replies, email link clicks. Webinar hot leads take absolute first priority." },
      { title: "Practice type review before every outreach", description: "Before sending any opener: check the lead's practice type tag in GHL. Dental needs a different opener than medspa or chiropractic." },
      { title: "Marketing audit generation — on reply or booking", description: "The moment a prospect replies with interest OR books a call: generate the marketing audit. Review output for accuracy. Add manual observations specific to practice type." },
      { title: "Marketing audit delivery — via email before the call", description: "Send via email immediately. Subject: '[Practice Name] — Your Free Marketing Audit Is Ready.' SMS follow-up. Contact moves to Marketing Audit Sent stage." },
      { title: "Pre-call audit review — required before every call", description: "Review the marketing audit sent. Identify 3 biggest gaps. Note which offer path those gaps point toward. Paste summary into GHL contact notes." },
      { title: "Follow-up sequence — 3 touches maximum", description: "Day 1: opener. Day 3: audit reference. Day 7: final touch. Tag setter-no-response, return to nurture. No more than 3 follow-ups ever." },
    ],
    scripts: [
      { label: "Webinar hot lead opener — SMS", text: "Hey [First Name] — great having you on the Health Pro CEO training today. You stayed all the way through which tells me this is a real priority for [Practice Name] right now.\n\nI put together a quick marketing audit on your practice — mind if I send it over?" },
      { label: "Standard opener — SMS", text: "Hey [First Name] — quick question: what's the biggest challenge right now when it comes to getting consistent patients booked at [Practice Name]?" },
      { label: "Marketing audit delivery — SMS", text: "Hey [First Name] — just sent your [Practice Name] marketing audit to your email. Take a look before our call — we'll walk through it together on [Day] at [Time]." },
      { label: "Day 7 final touch", text: "Hey [First Name] — last follow-up from me. If the timing isn't right, completely understand. Wishing [Practice Name] a fully booked calendar." },
    ],
    kpis: [
      { metric: "Hot lead outreach within 2 hours", target: "100%" },
      { metric: "Opener reply rate", target: "30%+" },
      { metric: "Audit email open rate", target: "70%+" },
      { metric: "Audit-to-call-booked rate", target: "35%+" },
      { metric: "Max follow-up touches", target: "3 — never exceed" },
      { metric: "Pre-call intel completed", target: "100%" },
    ],
    tools: [
      { name: "GoHighLevel", usage: "Trigger monitoring, SMS, pipeline" },
      { name: "Marketing Audit Tool", usage: "Automated audit generation" },
      { name: "Calendly", usage: "Call booking links" },
      { name: "Notion", usage: "Pre-call intel sheet template" },
    ],
    fails: [
      { warning: "Sending a generic opener regardless of practice type", fix: "Check the practice type tag in GHL before every outreach." },
      { warning: "Sending the audit without reviewing it first", fix: "If the audit has inaccurate data and the setter didn't review it, the prospect will catch errors on the call." },
      { warning: "More than 3 follow-up touches", fix: "Three touches, then back to nurture → reactivation. No exceptions." },
    ],
  },
  {
    id: "close",
    num: "07",
    title: "Qualify & Close",
    subtitle: "Discovery call + marketing audit walkthrough converts to a paying client",
    owner: "Sales Closer",
    trigger: "Prospect shows for scheduled strategy call",
    cadence: "45–60 min call · Payment on call · Follow-up within 24hrs if not closed",
    isPowerStage: true,
    isWebinarTrack: false,
    sops: [
      { title: "Pre-call setup — 10 minutes before", description: "Open GHL: review source tag, practice type, marketing audit, pre-call intel. Have all three payment links queued. Pull up their website, Google listing, and social." },
      { title: "Source-aware opening", description: "Every lead's path to the call is different. Check the source tag in GHL before the call. Webinar attendees, cold email replies, referrals — each gets a different opener." },
      { title: "Discovery phase — first 10 minutes", description: "Do not pitch for the first 10 minutes. Ask: How long open? How many providers? Revenue range? Where do patients come from? What have you tried? For B/C: staff hours on follow-ups, hiring frequency." },
      { title: "Pain excavation", description: "'What happens if this problem doesn't get solved in 6 months?' Let them answer fully. Then: 'What is that costing you right now — in revenue, in stress, in staff hours?' Mirror their language in the close." },
      { title: "Marketing audit walkthrough", description: "After pain excavation: screen share the audit. Walk through all 4 sections. Anchor every finding to the pain they described." },
      { title: "3-question path qualifier", description: "Q1: DIY or done-for-you? → Path A or Q2. Q2: Managing own ads or want managed? → Path B or Q3. Q3: Ad budget set aside? → Path C or revisit B." },
      { title: "Close and collect payment on the call", description: "'Based on your audit and everything you've shared — [Path] is the right fit. Ready to get started today?' Send payment link via SMS during the call." },
      { title: "Post-call CRM update — mandatory", description: "Immediately after: update GHL stage, tag offer path and practice type, log notes and objections. Lost calls — tag loss reason." },
    ],
    scripts: [
      { label: "Audit walkthrough opener", text: "'I sent over your [Practice Name] marketing audit before this call — did you get a chance to look at it?'\n[If yes]: 'What stood out to you?'\n[If no]: 'No worries — let me pull it up right now.'" },
      { label: "3-question qualifier", text: "Q1: 'Are you someone who wants to learn and implement this yourself — or would you rather have it done for you?'\n\nQ2: 'Are you currently running paid ads, or is that something you'd want us to manage?'\n\nQ3: 'Do you have a monthly ad budget set aside?'" },
      { label: "Day 1 lost deal — SMS", text: "'Hey [First Name] — really enjoyed getting to learn about [Practice Name] today. Completely understand that [timing/budget/fit] makes this not the right moment. The door is always open — reach out anytime.'" },
    ],
    kpis: [
      { metric: "Show rate", target: "80%+" },
      { metric: "Close rate — Path A", target: "30%+" },
      { metric: "Close rate — Path B", target: "25%+" },
      { metric: "Close rate — Path C", target: "20%+" },
      { metric: "Payment collected on call", target: "70%+" },
      { metric: "Loss reason documented", target: "100%" },
      { metric: "Lost deal sequence enrolled", target: "100%" },
    ],
    tools: [
      { name: "Zoom / Google Meet", usage: "Discovery calls — screen share" },
      { name: "GoHighLevel", usage: "Pipeline, call logging, tagging" },
      { name: "Notion", usage: "Close script, objection library" },
      { name: "Stripe / GHL Payment Links", usage: "One per path — all queued" },
    ],
    fails: [
      { warning: "Skipping staff/operational pain in discovery (B & C)", fix: "If you only excavate lead gen pain, the offer presentation misses half of what they're buying." },
      { warning: "Not knowing the practice type before the call", fix: "Check the practice type tag in GHL before joining." },
      { warning: "No lost deal follow-up sequence", fix: "10–20% of lost deals come back within 6 months. Without a sequence, that revenue is permanently lost." },
    ],
  },
  {
    id: "handoff",
    num: "08",
    title: "Handoff",
    subtitle: "Closed client transitions into fulfillment based on their offer path",
    owner: "Sales Closer → Tech Specialist · CSM",
    trigger: "Payment confirmed in Stripe or GHL",
    cadence: "Welcome: 2–4 hours · Onboarding: 2–7 days · Full setup: 7–14 days (B & C)",
    isPowerStage: false,
    isWebinarTrack: false,
    sops: [
      { title: "Payment confirmation — immediate actions", description: "GHL auto-moves to Closed Won, tags offer path and practice type, fires path-specific welcome email. Slack alert to #dr-lead-flow with client name, offer path, practice type, and revenue tier." },
      { title: "Internal handoff brief — within 2 hours", description: "Closer completes Handoff Brief in Notion: client name, practice, type, path, revenue, locations, key pains, top 3 audit gaps. Fulfillment does not begin without this brief." },
      { title: "Path A welcome — Health Pro CEO Skool", description: "Email delivers Skool community link, group Slack invite, weekly coaching call schedule, orientation video. SMS same day. Tone: empowering." },
      { title: "Path B and C welcome — done-for-you track", description: "Email delivers onboarding call link and access request checklist. Path C additionally: ads team intro note. Welcome packet sets expectations before kickoff call." },
      { title: "Onboarding call — within 2–7 days", description: "Path B: 45-min kickoff. Path C: 60-min kickoff + ads strategy. All paths: record call and send Loom recap within 24 hours." },
      { title: "Month 3 renewal — begin at week 10", description: "Pull results snapshot. Schedule renewal call. Lead with operational relief AND growth numbers. Present continuation and expansion options. Never wait until month 4." },
    ],
    scripts: [
      { label: "Path A welcome SMS", text: "Hey [First Name] — welcome to Health Pro CEO! Check your email — your Skool access, group Slack invite, and weekly coaching call schedule are all in there." },
      { label: "Path B & C welcome SMS", text: "Hey [First Name] — so excited to have [Practice Name] on board! Check your email for your welcome packet and next steps. Kickoff call locked in within the next few days." },
      { label: "Handoff Slack alert", text: "CLIENT WIN — HEALTH PRO CEO\nName: [First Name Last Name]\nPractice: [Practice Name] · Type: [practice type]\nOffer Path: [A / B / C]\nTop audit gaps: [1. X  2. Y  3. Z]\nAction: Check Notion for full handoff brief" },
    ],
    kpis: [
      { metric: "Welcome within 2–4 hrs", target: "100%" },
      { metric: "Onboarding call within 2–7 days (B & C)", target: "100%" },
      { metric: "Path A — Skool + Slack same day", target: "100%" },
      { metric: "Handoff brief within 2hrs", target: "100%" },
      { metric: "Month 3 renewal rate (B & C)", target: "70–75%" },
    ],
    tools: [
      { name: "GoHighLevel", usage: "Welcome sequences, sub-account, pipeline" },
      { name: "Slack — Dr. Lead Flow", usage: "Internal handoff alerts" },
      { name: "Notion", usage: "Handoff brief template" },
      { name: "Loom", usage: "Onboarding recaps and walkthroughs" },
      { name: "Stripe", usage: "Payment confirmation and MRR" },
    ],
    fails: [
      { warning: "Handoff brief missing practice type or operational pain", fix: "If fulfillment only knows lead gen goals, they'll build the wrong system for B & C clients." },
      { warning: "Welcome delayed past 4 hours", fix: "Automate it — must fire the second payment clears." },
      { warning: "Renewal conversation starting at month 4", fix: "By month 4 the client has already decided. Start at week 10." },
    ],
  },
];

// Funnel stage counts (placeholder — would be live from GHL/pipeline in production)
export const FUNNEL_COUNTS: Record<string, number> = {
  awareness: 347,
  capture: 89,
  webinar: 52,
  crm: 52,
  nurture: 38,
  setter: 22,
  close: 14,
  handoff: 9,
};
