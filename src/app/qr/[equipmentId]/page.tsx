import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getEquipmentPublic,
  updateHoursKms,
} from "@/lib/actions/qr-portal";
import { EquipmentSummaryCard } from "@/components/qr/equipment-card";
import { StatusMessage } from "@/components/qr/status-message";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageProps = {
  params: { equipmentId: string };
  searchParams?: { status?: string; message?: string };
};

export default async function QrPortalPage({ params, searchParams }: PageProps) {
  const { equipmentId } = params;
  const equipment = await getEquipmentPublic(equipmentId).catch(() => null);

  if (!equipment) {
    notFound();
  }

  const updateAction = updateHoursKms.bind(null, equipmentId);
  const trackingLabel = equipment.trackingUnit === "hours" ? "Hours" : "Kilometers";

  const actionLinks = [
    {
      href: `/qr/${equipmentId}/pre-start`,
      label: "Pre-Start Check",
      description: "Complete the daily checklist",
    },
    {
      href: `/qr/${equipmentId}/defect`,
      label: "Report Defect",
      description: "Log an issue and photos",
    },
    {
      href: `/qr/${equipmentId}/breakdown`,
      label: "Report Breakdown",
      description: "Equipment is not operational",
    },
    {
      href: `/qr/${equipmentId}/history`,
      label: "Pre-Start History",
      description: "View submissions from last 30 days",
    },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-light-gray/35 px-4 py-8">
      <header className="text-center">
        <BrandLogo priority className="mx-auto h-8 w-auto" />
        <h1 className="font-heading mt-3 text-2xl font-extrabold text-near-black">Equipment Portal</h1>
        <p className="text-sm text-charcoal">No login required. Keep the fleet moving.</p>
      </header>

      <StatusMessage status={searchParams?.status} message={searchParams?.message} />

      <main className="mt-6 space-y-6">
        <EquipmentSummaryCard equipment={equipment} />

        <section className="rounded-2xl border border-light-gray bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-extrabold text-near-black">Update {trackingLabel}</h2>
              <p className="text-sm text-charcoal">
                New reading must be {">="} {equipment.currentReading.toLocaleString()}.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">Latest</span>
          </div>
          <form
            action={updateAction}
            className="mt-4 flex flex-col gap-3"
            method="post"
          >
            <Input
              name="reading"
              type="number"
              inputMode="numeric"
              min={equipment.currentReading}
              placeholder={`Enter current ${trackingLabel.toLowerCase()}`}
              aria-label={`Current ${trackingLabel}`}
              required
            />
            <Button type="submit" className="h-11">
              Save Reading
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mid-gray">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {actionLinks.map((action) => (
              <Link key={action.href} href={action.href} className="group">
                <div className="flex h-full flex-col rounded-2xl border border-light-gray bg-white p-4 transition hover:border-brand-red/45 hover:bg-light-gray/20">
                  <p className="font-heading text-lg font-extrabold text-near-black transition-colors group-hover:text-brand-red">
                    {action.label}
                  </p>
                  <p className="mt-1 text-sm text-charcoal">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 text-center text-xs text-mid-gray">
        Field support · Powered by Diesel-X
      </footer>
    </div>
  );
}
