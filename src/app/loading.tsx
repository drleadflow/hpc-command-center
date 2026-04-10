export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg" style={{ backgroundColor: 'var(--border)' }} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-32 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} />
        ))}
      </div>
      <div className="h-64 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} />
    </div>
  );
}
