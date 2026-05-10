import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Bistro Warszawa",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-sm bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold font-heading">
              BW
            </div>
            <span className="font-heading font-medium tracking-widest uppercase text-sm">Dashboard</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
