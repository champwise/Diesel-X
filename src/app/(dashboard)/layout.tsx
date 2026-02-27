import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* TODO: Sidebar nav + Header with notification bell, settings, user menu */}
      <header className="sticky top-0 z-50 border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-red-600">Diesel-X</h1>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/dashboard" className="hover:text-red-600">Dashboard</a>
            <a href="/schedule" className="hover:text-red-600">Schedule</a>
            <a href="/equipment" className="hover:text-red-600">Equipment</a>
            <a href="/mechanics" className="hover:text-red-600">Mechanics</a>
            <a href="/customers" className="hover:text-red-600">Customers</a>
            <a href="/services" className="hover:text-red-600">Services</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* TODO: Notification bell, Settings, User menu */}
          </div>
        </div>
      </header>
      <main className="p-6">{children}</main>
      <Toaster />
    </div>
  );
}
