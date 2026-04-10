import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Campaign Performance Report — Dr. Lead Flow",
  description: "Client campaign performance portal",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body style={{ margin: 0, padding: 0, background: "#f8f9fb", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
