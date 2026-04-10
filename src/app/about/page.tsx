export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          DR. LEAD FLOW
        </p>
        <h1 className="text-4xl font-serif" style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}>
          The Mission
        </h1>
      </div>

      {/* Mission Statement */}
      <div className="card p-10" style={{ borderLeft: "3px solid var(--accent)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--accent)" }}>
          WHY WE EXIST
        </p>
        <h2 className="text-3xl font-serif mb-8" style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.4px", lineHeight: "1.4" }}>
          We exist for one reason: to put the most transformative clinics in front of the people who need them most.
        </h2>
        <div className="space-y-5 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <p>
            Every patient who doesn't find you is a life that doesn't change. Every clinic that stays invisible is a gift the world never receives.
          </p>
          <p>
            We're not here to run ads. We're here to make sure the healers, the innovators, the practitioners who are actually changing lives —{" "}
            <em style={{ color: "var(--text)", fontStyle: "italic" }}>get found</em>. Get chosen. Get to scale.
          </p>
          <p className="text-base font-medium pt-2" style={{ color: "var(--text)" }}>
            Because when great clinics grow, more people heal. And that's a mission worth fighting for.
          </p>
        </div>
      </div>

      {/* Who We Serve */}
      <div className="card p-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--muted)" }}>
          WHO WE SERVE
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🏥",
              label: "Medical Spas",
              desc: "Aesthetic clinics that deserve a patient base as premium as their treatments.",
            },
            {
              icon: "⚕️",
              label: "Wellness Clinics",
              desc: "IV therapy, functional medicine, and regenerative practices changing how people think about health.",
            },
            {
              icon: "🔬",
              label: "Specialty Practices",
              desc: "Innovative practitioners offering care that patients don't know to search for — until now.",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>{item.label}</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What We Do */}
      <div className="card p-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--muted)" }}>
          HOW WE DO IT
        </p>
        <div className="space-y-4">
          {[
            { step: "01", label: "AI-Driven Lead Generation", desc: "Meta ad systems that find the right patients before they know they're looking." },
            { step: "02", label: "Automated Nurture Workflows", desc: "GHL pipelines that convert leads into booked appointments without manual follow-up." },
            { step: "03", label: "Content at Scale", desc: "Consistent, on-brand content across every channel — built once, running always." },
            { step: "04", label: "Reporting That Tells the Story", desc: "Clear performance data so clients see exactly what's working and why." },
          ].map((item) => (
            <div key={item.step} className="flex gap-5 items-start rounded-2xl p-5"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-serif flex-shrink-0" style={{ color: "var(--muted)", fontWeight: 300 }}>{item.step}</div>
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>{item.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer callout */}
      <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
        <p className="text-sm" style={{ color: "var(--accent-text)" }}>
          <strong>Dr. Lead Flow</strong> — Built to grow the practices that are worth growing.
        </p>
      </div>
    </div>
  );
}
