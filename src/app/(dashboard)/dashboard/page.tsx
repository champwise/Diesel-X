import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  Clock3Icon,
  type LucideIcon,
  ShieldAlertIcon,
  TruckIcon,
  WrenchIcon,
} from "lucide-react";

import {
  getAttentionItems,
  getDashboardStats,
  getEquipmentAlerts,
  getRecentActivity,
  type AttentionTaskItem,
  type CriticalDefectItem,
  type EquipmentAlertItem,
} from "@/lib/actions/dashboard";
import { getOrganizationContext } from "@/lib/auth/organization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard | Diesel-X",
};

export default async function DashboardPage() {
  const { organizationId } = await getOrganizationContext();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-extrabold text-near-black">Dashboard</h1>
        <p className="text-charcoal">
          Fleet health, task momentum, and high-priority items across your organization.
        </p>
      </header>

      <QuickActionsCard />

      <Suspense fallback={<StatsCardsFallback />}>
        <StatsCardsSection organizationId={organizationId} />
      </Suspense>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Suspense fallback={<SectionCardFallback rows={8} />}>
            <RecentActivitySection organizationId={organizationId} />
          </Suspense>

          <Suspense fallback={<SectionCardFallback rows={7} />}>
            <AttentionSection organizationId={organizationId} />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<SectionCardFallback rows={8} />}>
            <EquipmentAlertsSection organizationId={organizationId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function QuickActionsCard() {
  return (
    <Card className="gap-3">
      <CardHeader className="gap-1">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>
          Jump into common workflows without leaving the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/schedule">Create Task</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/equipment">Add Equipment</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/schedule" className="inline-flex items-center gap-1.5">
            View All Tasks
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/equipment" className="inline-flex items-center gap-1.5">
            View All Equipment
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

async function StatsCardsSection({ organizationId }: { organizationId: string }) {
  const stats = await getDashboardStats(organizationId);

  const monthName = format(new Date(), "LLLL");
  const dueRate = formatPercent(stats.dueForService, stats.totalEquipment);
  const overdueRate = formatPercent(stats.overdueTasks, stats.activeTasks);
  const completionRate = formatPercent(
    stats.completedThisMonth,
    stats.activeTasks + stats.completedThisMonth
  );

  const cards: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    indicator: string;
    tone?: "default" | "alert" | "success";
  }> = [
    {
      label: "Total Equipment",
      value: stats.totalEquipment,
      icon: TruckIcon,
      indicator: `${stats.dueForService} currently due for service`,
    },
    {
      label: "Active Tasks",
      value: stats.activeTasks,
      icon: ClipboardListIcon,
      indicator: `${stats.overdueTasks} overdue and pending`,
    },
    {
      label: "Tasks Completed This Month",
      value: stats.completedThisMonth,
      icon: CheckCircle2Icon,
      indicator: `${completionRate} completion rate in ${monthName}`,
      tone: "success",
    },
    {
      label: "Equipment Due for Service",
      value: stats.dueForService,
      icon: WrenchIcon,
      indicator: `${dueRate} of active fleet`,
      tone: stats.dueForService > 0 ? "alert" : "default",
    },
    {
      label: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertTriangleIcon,
      indicator: `${overdueRate} of active tasks`,
      tone: stats.overdueTasks > 0 ? "alert" : "default",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="gap-3 py-5">
          <CardContent className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-charcoal">{card.label}</p>
              <p className="font-heading text-3xl font-extrabold text-near-black">
                {numberFormatter.format(card.value)}
              </p>
              <p
                className={cn(
                  "text-xs",
                  card.tone === "alert" && "text-brand-red",
                  card.tone === "success" && "text-emerald-700",
                  !card.tone || card.tone === "default" ? "text-mid-gray" : null
                )}
              >
                {card.indicator}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex rounded-lg border p-2",
                card.tone === "alert" && "border-brand-red/35 bg-brand-red/10 text-brand-red",
                card.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                (!card.tone || card.tone === "default") &&
                  "border-light-gray bg-light-gray/60 text-charcoal"
              )}
            >
              <card.icon className="size-4" />
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

async function RecentActivitySection({ organizationId }: { organizationId: string }) {
  const activity = await getRecentActivity(organizationId, 10);

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest task updates and creations across the fleet.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-charcoal">
                  No activity yet.
                </TableCell>
              </TableRow>
            ) : (
              activity.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/tasks/${item.id}`}
                        className="max-w-[320px] truncate font-medium text-near-black hover:text-brand-red"
                      >
                        {item.description}
                      </Link>
                      <span className="text-xs text-mid-gray">
                        {item.activityType === "updated" ? "Updated" : "Created"} {relativeTime(item.activityAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/equipment/${item.equipmentId}`}
                      className="font-medium text-charcoal hover:text-brand-red"
                    >
                      {item.equipmentName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-mid-gray">
                    {formatTimestamp(item.activityAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function AttentionSection({ organizationId }: { organizationId: string }) {
  const attention = await getAttentionItems(organizationId);

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-lg">Tasks Needing Attention</CardTitle>
        <CardAction>
          <Badge className="border-brand-red/30 bg-brand-red/10 text-brand-red">
            {attention.total}
          </Badge>
        </CardAction>
        <CardDescription>
          Approval requests, overdue work, and critical QR reports waiting for action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AttentionTaskGroup
          title="Awaiting Approval"
          emptyState="No tasks waiting for approval."
          items={attention.createdTasks}
          emphasis="default"
          primaryLabel="Approve"
        />

        <AttentionTaskGroup
          title="Overdue Tasks"
          emptyState="No overdue tasks."
          items={attention.overdueTasks}
          emphasis="alert"
          primaryLabel="View"
        />

        <CriticalDefectGroup items={attention.criticalDefects} />
      </CardContent>
    </Card>
  );
}

function AttentionTaskGroup({
  title,
  emptyState,
  items,
  emphasis,
  primaryLabel,
}: {
  title: string;
  emptyState: string;
  items: AttentionTaskItem[];
  emphasis: "default" | "alert";
  primaryLabel: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-near-black">{title}</h3>
        <Badge variant="outline" className="text-xs text-charcoal">
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-light-gray px-3 py-2 text-sm text-charcoal">
          {emptyState}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-lg border p-3",
                emphasis === "alert"
                  ? "border-brand-red/30 bg-brand-red/5"
                  : "border-light-gray bg-light-gray/20"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <Link
                    href={`/tasks/${item.id}`}
                    className="font-medium text-near-black hover:text-brand-red"
                  >
                    {item.description}
                  </Link>
                  <p className="text-xs text-charcoal">
                    {item.equipmentName} · {item.customerName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-mid-gray">
                    <StatusBadge status={item.status} />
                    {item.scheduledDate ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock3Icon className="size-3.5" />
                        Scheduled {formatTimestamp(item.scheduledDate)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">Not scheduled</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="xs">
                    <Link href={`/tasks/${item.id}`}>{primaryLabel}</Link>
                  </Button>
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/tasks/${item.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CriticalDefectGroup({ items }: { items: CriticalDefectItem[] }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-near-black">
          Critical QR Defects (Unlinked)
        </h3>
        <Badge className="border-brand-red/30 bg-brand-red/10 text-brand-red">
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-light-gray px-3 py-2 text-sm text-charcoal">
          No unlinked critical defects.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-brand-red/30 bg-brand-red/5 p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-near-black">{item.description}</p>
                  <p className="text-xs text-charcoal">
                    {item.equipmentName} · {item.customerName}
                  </p>
                  <p className="text-xs text-mid-gray">
                    Reported by {item.operatorName} {relativeTime(item.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="xs">
                    <Link href={`/equipment/${item.equipmentId}`}>View</Link>
                  </Button>
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/equipment/${item.equipmentId}`}>Create Task</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function EquipmentAlertsSection({ organizationId }: { organizationId: string }) {
  const alerts = await getEquipmentAlerts(organizationId);

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-lg">Equipment Alerts</CardTitle>
        <CardAction>
          <Badge className="border-brand-red/30 bg-brand-red/10 text-brand-red">
            {alerts.length}
          </Badge>
        </CardAction>
        <CardDescription>Approaching service intervals and active breakdown units.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead>Alert</TableHead>
              <TableHead className="text-right">Reading</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-charcoal">
                  No equipment alerts.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={`${alert.alertType}-${alert.equipmentId}`}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/equipment/${alert.equipmentId}`}
                        className="font-medium text-near-black hover:text-brand-red"
                      >
                        {alert.equipmentName}
                      </Link>
                      <span className="text-xs text-mid-gray">{alert.customerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AlertBadge alert={alert} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-mid-gray">
                    {renderAlertReading(alert)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AlertBadge({ alert }: { alert: EquipmentAlertItem }) {
  if (alert.alertType === "broken_down") {
    return (
      <Badge className="gap-1 border-brand-red/35 bg-brand-red/10 text-brand-red">
        <ShieldAlertIcon className="size-3" />
        Broken Down
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 border-amber-300 bg-amber-50 text-amber-800">
      <WrenchIcon className="size-3" />
      Service Approaching
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "capitalize",
        status === "completed" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "created" && "border-brand-red/30 bg-brand-red/10 text-brand-red",
        status === "in_progress" && "border-sky-200 bg-sky-50 text-sky-700",
        status !== "completed" && status !== "created" && status !== "in_progress"
          ? "border-light-gray bg-light-gray/70 text-charcoal"
          : null
      )}
    >
      {humanizeStatus(status)}
    </Badge>
  );
}

function StatsCardsFallback() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="py-5">
          <CardContent className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-light-gray" />
            <div className="h-8 w-16 animate-pulse rounded bg-light-gray" />
            <div className="h-3 w-32 animate-pulse rounded bg-light-gray" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function SectionCardFallback({ rows }: { rows: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-44 animate-pulse rounded bg-light-gray" />
        <div className="h-4 w-64 animate-pulse rounded bg-light-gray" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-9 animate-pulse rounded bg-light-gray/70" />
        ))}
      </CardContent>
    </Card>
  );
}

function renderAlertReading(alert: EquipmentAlertItem): string {
  if (alert.alertType === "broken_down") {
    return formatReading(alert.currentReading, alert.trackingUnit);
  }

  if (alert.remainingReading === null) {
    return "Approaching";
  }

  const unitLabel = alert.trackingUnit === "hours" ? "h" : "km";
  return `${numberFormatter.format(alert.remainingReading)} ${unitLabel} to due`;
}

function formatReading(value: number, unit: "hours" | "kilometers") {
  return `${numberFormatter.format(value)} ${unit === "hours" ? "h" : "km"}`;
}

function relativeTime(value: Date) {
  return formatDistanceToNow(value, { addSuffix: true });
}

function formatTimestamp(value: Date) {
  return format(value, "d MMM yyyy, h:mm a");
}

function humanizeStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  const percent = (value / total) * 100;
  return `${Math.round(percent)}%`;
}

const numberFormatter = new Intl.NumberFormat("en-US");
