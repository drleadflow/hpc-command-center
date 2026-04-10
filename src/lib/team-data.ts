// Team data — HR Hub source of truth
// Source: HPC HR Hub Complete document

import type { HpcRole } from "./types";

export interface RoleDefinition {
  num: string;
  hpcRole: HpcRole;
  title: string;
  rateType: string;
  reportsTo: string;
  manages: string;
  functions: string[];
  kpis: string[];
  isCombined?: boolean;
  combinedNote?: string;
  isFractional?: boolean;
  fractionalNote?: string;
}

export interface PolicySection {
  title: string;
  subtitle: string;
  items: string[];
}

export interface OnboardingStep {
  day: string;
  title: string;
  description: string;
}

export interface TouchpointItem {
  day: string;
  title: string;
  description: string;
}

export interface ReviewCycle {
  label: string;
  timing: string;
  description: string;
}

export interface ScalePhase {
  phase: string;
  trigger: string;
  actions: string[];
  color: string;
}

export const ROLES: RoleDefinition[] = [
  {
    num: "01", hpcRole: "ceo", title: "Chief Executive Officer (CEO)",
    rateType: "Equity / draw", reportsTo: "Self / Board", manages: "All department heads",
    functions: [
      "Brand vision, strategy, and long-term direction",
      "Final approval on offers, pricing, and partnerships",
      "Owns all sales Closer oversight and large deal strategy",
      "Sales culture and conversion standard-setting",
      "External partnerships and speaking engagements",
      "Level 3 crisis ownership — legal and reputational",
    ],
    kpis: [
      "Revenue growth month-over-month",
      "Client retention by path",
      "Brand reach and authority (webinar size, follower growth)",
      "New MRR per month",
      "Close rate maintained above 25%",
    ],
  },
  {
    num: "02", hpcRole: "ops_manager", title: "Operations Manager",
    rateType: "$X,XXX/mo retainer", reportsTo: "CEO", manages: "All functional contractors",
    functions: [
      "Day-to-day execution of all systems and SOPs",
      "Manages daily tracking form review and contractor performance",
      "Oversees all client delivery timelines",
      "Manages sub-contractor vetting list and overflow protocol",
      "Level 2 crisis coordination",
      "Churn analysis — monthly debrief",
      "All onboarding, offboarding (client and contractor)",
      "Weekly leadership sync with CEO",
    ],
    kpis: [
      "Build delivery within 7–14 days (95%+)",
      "Daily tracking compliance (100%)",
      "No client missed a weekly report",
      "Level 2 crisis first response under 1 hour",
      "Contractor 90-day retention rate",
    ],
  },
  {
    num: "03", hpcRole: "marketing_lead", title: "Marketing Lead",
    rateType: "$X,XXX/mo retainer", reportsTo: "CEO", manages: "Content Editor",
    functions: [
      "Brand voice and content strategy across all platforms",
      "All copywriting — email, SMS, scripts, ads",
      "Webinar host and weekly training delivery",
      "Paid ad strategy and oversight",
      "A/B test log ownership — email and content",
      "Weekly webinar scorecard completed within 24hrs",
      "Cold email sequence copy",
      "Instagram and organic content calendar",
    ],
    kpis: [
      "Webinar show rate 40%+",
      "CPR under $10",
      "Email open rate 35%+",
      "Cold email reply rate 8%+",
      "A/B test log maintained — minimum 1 active test/month",
    ],
  },
  {
    num: "04", hpcRole: "content_editor", title: "Content Editor",
    rateType: "$XXX–$X,XXX/mo", reportsTo: "Marketing Lead", manages: "N/A",
    functions: [
      "Video editing (Reels, webinar clips, case study videos)",
      "Graphic production (carousels, quote cards, case study assets)",
      "Content QA before publish — brand voice, visual standards",
      "Batch editing on weekly schedule",
      "Asset library management in Canva",
    ],
    kpis: [
      "6+ content pieces published per week",
      "Turnaround time under 24hrs per asset",
      "Zero brand standard violations",
      "Monthly batch completion on schedule",
    ],
  },
  {
    num: "05", hpcRole: "appointment_setter", title: "Appointment Setter",
    rateType: "$XXX base + bonuses", reportsTo: "Sales Closer / Ops Manager", manages: "N/A",
    functions: [
      "Daily trigger monitoring in GHL — morning and afternoon",
      "Opener sends by lead source and practice type — personalized",
      "Marketing audit generation and delivery within 24hrs of reply",
      "Call booking — Calendly link delivery",
      "Prospect follow-up: 3 touches maximum then back to nurture",
      "Pre-call intel sheet completed for every booked call",
      "90-day reactivation sequence monitoring and triggering",
    ],
    kpis: [
      "Webinar hot lead outreach within 2 hours (100%)",
      "Opener reply rate 30%+",
      "Audit email open rate 70%+",
      "Audit-to-call-booked rate 35%+",
      "Pre-call intel completed (100% of booked calls)",
    ],
  },
  {
    num: "06", hpcRole: "sales_closer", title: "Sales Closer",
    rateType: "Base + 10% commission", reportsTo: "CEO / Ops Manager", manages: "Appointment Setter",
    functions: [
      "Discovery calls — 45–60 min strategy call format",
      "Marketing audit walkthrough — screen share, practice-type specific",
      "3-question path qualifier",
      "Close and collect payment on the call",
      "Lost deal follow-up — Day 1 and Day 180 sends personally",
      "Post-call CRM update mandatory — loss reason tagged",
      "Handoff brief within 2hrs of every close",
      "Monthly commission log review with Bookkeeper",
    ],
    kpis: [
      "Close rate Path A 30%+",
      "Close rate Path B 25%+",
      "Close rate Path C 20%+",
      "Payment collected on call 70%+ of closes",
      "Loss reason documented 100%",
      "Handoff brief within 2hrs 100%",
    ],
  },
  {
    num: "07", hpcRole: "ai_tech_specialist", title: "AI & Tech Specialist",
    rateType: "$X,XXX/mo retainer", reportsTo: "Operations Manager", manages: "N/A",
    isCombined: true,
    combinedNote: "Combined role — splits at 15–20 active builds or when consistently at 3+ simultaneous builds for 2+ consecutive months",
    functions: [
      "GHL sub-account creation and build — all client Paths B & C",
      "Automation workflows — lead notification, nurture, booking",
      "AI chatbot installation and practice-type configuration",
      "Full QA before every client walkthrough",
      "AI system management — monitoring, optimization, updates",
      "Tool and platform research — identifies new capabilities",
      "Oversees all sub-contractor builds during overflow",
      "Weekly anomaly check — fix silently, notify proactively",
    ],
    kpis: [
      "Build within 7–14 days (95%+)",
      "Zero errors at client walkthrough (100%)",
      "Weekly anomaly check completed (100%)",
      "Capacity flag raised proactively — never reactively",
    ],
  },
  {
    num: "08", hpcRole: "csm_lead_coach", title: "CSM / Lead Coach",
    rateType: "$X,XXX/mo retainer", reportsTo: "Operations Manager", manages: "N/A",
    isCombined: true,
    combinedNote: "Combined role — CSM track splits from Lead Coach when Path A exceeds 50 members or coaching capacity",
    functions: [
      "Path B & C: dedicated Slack management, milestone tracking, monthly calls, results snapshot",
      "Path A: weekly group coaching call delivery, group Slack monitoring",
      "All path milestone celebrations — personal Loom within 24hrs",
      "Referral program introduction at first results milestone",
      "Upsell identification and flag to Sales Closer",
      "Level 2 crisis first contact — client satisfaction and retention",
      "Client offboarding — exit conversation and 60-day reactivation trigger",
    ],
    kpis: [
      "Path A 90-day retention 60%+",
      "Path B Month 3 renewal 70%+",
      "Path C Month 3 renewal 75%+",
      "Satisfaction score average 8+ all paths",
      "Milestone Loom within 24hrs (100%)",
      "Weekly group call held — no cancellations",
    ],
  },
  {
    num: "09", hpcRole: "bookkeeper", title: "Bookkeeper / Finance",
    rateType: "$XXX–$X,XXX/mo fractional", reportsTo: "CEO / Ops Manager", manages: "N/A",
    isFractional: true,
    fractionalNote: "Fractional role — approximately 10–15 hours/month",
    functions: [
      "Contractor invoice processing and payment (bi-weekly, within 5 business days)",
      "Commission log — updated within 24hrs of every closed deal",
      "Referral bonus payouts — processed automatically at 90-day confirmation",
      "Monthly P&L report by offer path",
      "MRR tracking — new, churned, retained",
      "Annual 1099-NEC filing for all contractors paid $600+",
      "Payment records archived 7 years minimum",
    ],
    kpis: [
      "All invoices paid within 5 business days",
      "Commission log updated within 24hrs of every close",
      "Monthly P&L delivered by the 5th",
      "1099s issued by January 31",
      "Zero payment discrepancies",
    ],
  },
];

export const SCALE_PHASES: ScalePhase[] = [
  {
    phase: "Phase 1", color: "#639922",
    trigger: "AI & Tech Specialist consistently at 3+ active builds for 2+ consecutive months",
    actions: [
      "Split AI & Tech into two roles: AI & Tech Specialist + Automation Builder",
      "Ops Manager maintains vetted sub-contractor list until Phase 1 hire is complete",
    ],
  },
  {
    phase: "Phase 2", color: "#2D7DD2",
    trigger: "Path A exceeds 50 Skool members or Lead Coach hits coaching capacity",
    actions: [
      "Split CSM / Lead Coach into dedicated Lead Coach (Path A) and dedicated CSM (Paths B & C)",
      "Add Community Manager for Skool daily engagement at 100+ members",
    ],
  },
  {
    phase: "Phase 3", color: "#C4860A",
    trigger: "8–10 active Path C clients or 6+ new clients closing per month",
    actions: [
      "Add dedicated Paid Ads Manager (Path C only) to absorb ads work from Marketing Lead",
      "Add Onboarding Specialist when 6+ new clients per month — dedicated to first 14 days only",
    ],
  },
];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { day: "Day 0", title: "Contractor agreement via DocuSign", description: "Includes: scope, rate, NDA (2-year), non-solicitation (12 months), IP ownership, payment terms, 90-day probation, termination terms." },
  { day: "Day 0", title: "Onboarding form in GHL", description: "Captures: legal name, preferred name, contact info, time zone, emergency contact, payment info, equipment confirmation, hours confirmation." },
  { day: "Day 0–1", title: "System access — within 24hrs", description: "Slack invite, Notion workspace, GHL access (role-appropriate), Canva team (if applicable), all relevant tool invites." },
  { day: "Day 1–2", title: "Manager orientation call", description: "Direct manager reviews: role scope, daily tracking form, Slack expectations, first week priorities, open questions." },
  { day: "Week 1", title: "SOP library review", description: "Contractor reads all SOPs relevant to their role. Completes the SOP review checklist. Manager confirms receipt by end of Week 1." },
  { day: "Week 1–2", title: "Shadow period", description: "New contractor shadows their direct manager or senior equivalent. 5–10 business days depending on role complexity." },
  { day: "Week 1–2", title: "Position training", description: "Manager walks through: role-specific tools, GHL workflows, daily tracking form, invoice process. Recorded via Loom." },
  { day: "Week 1", title: "Daily tracking form setup", description: "Manager confirms contractor can access and submit the GHL daily tracking form. First submission required by end of Week 1." },
  { day: "Week 1", title: "Invoice process walkthrough", description: "Bookkeeper sends the invoice template and process. Contractor submits test invoice. Bi-weekly Friday deadline established." },
  { day: "Day 30", title: "30-day probationary check-in", description: "Manager reviews: SOP comprehension, tracking compliance, quality of work, communication, first deliverables." },
];

export const TOUCHPOINTS: TouchpointItem[] = [
  { day: "Daily", title: "Async daily tracking form", description: "All contractors submit by 5pm CST via GHL. Manager reviews same day. Ops Manager reviews weekly." },
  { day: "Monday", title: "Weekly 1:1 — 30 minutes", description: "Every contractor meets with direct manager. Contractor prepares brief status update. Manager provides feedback." },
  { day: "Tuesday", title: "Department sync", description: "Marketing, Sales, and Fulfillment hold brief department syncs. Ops Manager reviews weekly performance data." },
  { day: "Tuesday", title: "Leadership sync — CEO + Ops Manager", description: "CEO and Ops Manager review growth metrics, delivery status, contractor performance flags, and pipeline." },
  { day: "1st Tuesday", title: "Monthly all-hands — 45 minutes", description: "All contractors. Agenda: business update (MRR, retention), what's working, adjustments, recognitions, questions. CEO leads." },
];

export const REVIEW_CYCLES: ReviewCycle[] = [
  { label: "30-day check-in", timing: "End of first month", description: "Probationary calibration. Focus: SOP comprehension, tracking compliance, communication quality, first deliverables." },
  { label: "90-day review", timing: "End of probationary period", description: "Formal go/no-go on continued engagement. Review all KPIs. If continued: confirm rate, scope, role adjustments." },
  { label: "Monthly pulse check", timing: "Last week of every month", description: "Manager reviews monthly KPI performance vs targets. Celebrates wins. Addresses emerging gaps." },
  { label: "Quarterly comprehensive", timing: "End of each quarter", description: "Full review of all KPIs, role contribution, working relationship quality, growth conversation, rate review." },
  { label: "Performance Improvement Notice", timing: "2+ consecutive months of missed KPIs", description: "Specific: expected, gap, improvement timeline, consequence. CEO and Ops Manager must both approve before issuing." },
];

export const CORE_POLICIES: string[] = [
  "Agreement required Day 1 — no work begins without a signed contractor agreement.",
  "Payment terms — bi-weekly invoices submitted by Friday 5pm CST. Payment within 5 business days.",
  "NDA — 2 years post-contract. Covers all client information, company systems, proprietary processes.",
  "Non-solicitation — 12 months post-contract. No soliciting of HPC clients, contractors, or partners.",
  "IP ownership — all work produced under contract is owned exclusively by Doctor Lead Flow LLC.",
  "90-day probationary period — formal go/no-go review at Day 90.",
  "Termination without cause — 14 days written notice from either party.",
  "Termination with cause — immediate. Causes: NDA breach, client solicitation, fraud, consistent non-performance.",
  "Company tools — GHL, Slack, Notion, Canva for HPC work only. All access revoked on final day.",
  "Tax responsibility — contractors responsible for own taxes. HPC issues 1099-NEC by January 31.",
];

export const COMMISSION_TABLE = [
  { path: "Path A — $997/mo", deal: "$997 first month", rate: "10%", earned: "$99.70", bonus: "+$50 if payment collected on call" },
  { path: "Path B — $3K/mo", deal: "$3,000 first month", rate: "10%", earned: "$300", bonus: "+$100 if payment collected on call" },
  { path: "Path C — $5K/mo", deal: "$5,000 first month", rate: "10%", earned: "$500", bonus: "+$150 if payment collected on call" },
];
