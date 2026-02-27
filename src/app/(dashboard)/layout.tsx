import Link from "next/link";
import { OrgProvider } from "@/components/auth/org-provider";
import { DashboardNav } from "@/components/navigation/dashboard-nav";
import { BrandLogo } from "@/components/shared/brand-logo";
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
      <div className="min-h-screen bg-light-gray/45">
        <header className="sticky top-0 z-50 border-b border-light-gray bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-[220px] flex-col gap-1">
              <Link href="/dashboard" className="inline-flex w-fit items-center">
                <BrandLogo priority className="h-8 w-auto" />
              </Link>
              <p className="text-xs text-mid-gray">
                {activeOrg?.organizationName ?? "No active organization"}
              </p>
            </div>

            <DashboardNav links={navigationLinks} />

            <div className="flex items-center gap-3">
              <span className="text-sm text-charcoal">{displayName}</span>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-light-gray text-charcoal hover:border-brand-red hover:text-brand-red"
                >
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
        <Toaster />
      </div>
    </OrgProvider>
  );
}
