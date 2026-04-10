export default function Loading() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Leads</h1>
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} />
          ))}
        </div>
        <div className="h-96 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} />
      </div>
    </div>
  );
}
