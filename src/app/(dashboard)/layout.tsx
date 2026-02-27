import Link from "next/link";
import { OrgProvider } from "@/components/auth/org-provider";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { signOut } from "@/lib/auth/actions";
import { getActiveOrg, requireAuth } from "@/lib/auth/org-context";

const navigationLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/equipment", label: "Equipment" },
  { href: "/mechanics", label: "Mechanics" },
  { href: "/customers", label: "Customers" },
  { href: "/services", label: "Services" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAuth();
  const activeOrg = await getActiveOrg(currentUser);

  const displayName = currentUser.profile?.fullName ?? currentUser.authUser.email ?? "User";

  return (
    <OrgProvider
      value={{
        currentUser: {
          authUser: currentUser.authUser,
          profile: currentUser.profile,
        },
        memberships: currentUser.memberships,
        activeOrg,
      }}
    >
      <div className="min-h-screen bg-neutral-50">
        <header className="sticky top-0 z-50 border-b bg-white px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-red-600">Diesel-X</p>
              <p className="text-sm text-muted-foreground">
                {activeOrg?.organizationName ?? "No active organization"}
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
              {navigationLinks.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-red-600">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{displayName}</span>
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
        <Toaster richColors />
      </div>
    </OrgProvider>
  );
}
