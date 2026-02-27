import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getEquipmentPublic,
  updateHoursKms,
} from "@/lib/actions/qr-portal";
import { EquipmentSummaryCard } from "@/components/qr/equipment-card";
import { StatusMessage } from "@/components/qr/status-message";
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Diesel-X</p>
        <h1 className="mt-1 text-2xl font-bold">Equipment Portal</h1>
        <p className="text-sm text-neutral-500">No login required — keep the fleet moving.</p>
      </header>

      <StatusMessage status={searchParams?.status} message={searchParams?.message} />

      <main className="mt-6 space-y-6">
        <EquipmentSummaryCard equipment={equipment} />

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Update {trackingLabel}</h2>
              <p className="text-sm text-neutral-500">
                New reading must be {">="} {equipment.currentReading.toLocaleString()}.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Latest</span>
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
            <Button type="submit" className="bg-red-600 text-white hover:bg-red-500">
              Save Reading
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {actionLinks.map((action) => (
              <Link key={action.href} href={action.href} className="group">
                <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-red-500 hover:bg-white">
                  <p className="text-lg font-semibold text-neutral-900 group-hover:text-red-600">
                    {action.label}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 text-center text-xs text-neutral-400">
        Field support · Powered by Diesel-X
      </footer>
    </div>
  );
}
