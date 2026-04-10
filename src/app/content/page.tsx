import { ContentBoard } from "./ContentBoard";

export const dynamic = "force-dynamic";

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif themed-text" style={{ fontWeight: 400 }}>✍️ Content OS</h1>
        <p className="text-sm themed-muted mt-1">Your full content pipeline — live from Airtable. Click any card to expand, update status, or access links.</p>
      </div>
      <ContentBoard />
    </div>
  );
}
