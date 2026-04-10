import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div
        className="rounded-xl p-8 max-w-md"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-5xl font-bold" style={{ color: 'var(--accent)' }}>404</h1>
        <h2 className="mt-4 text-xl font-bold" style={{ color: 'var(--text)' }}>Page not found</h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
