import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin · Numapetstore",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {children}
    </div>
  );
}
