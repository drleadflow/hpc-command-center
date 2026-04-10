"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="rounded-xl p-8 max-w-md" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Failed to load ad performance data</h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{error.message}</p>
        <button onClick={reset} className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)' }}>
          Try again
        </button>
      </div>
    </div>
  );
}
