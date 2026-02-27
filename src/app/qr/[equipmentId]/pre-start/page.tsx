import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getEquipmentPublic,
  getPrestartTemplateForEquipment,
  submitPrestartCheck,
  type PrestartTemplateSummary,
} from "@/lib/actions/qr-portal";
import { StatusMessage } from "@/components/qr/status-message";
import { EquipmentSummaryCard } from "@/components/qr/equipment-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOperatorPrefill } from "@/lib/qr/operator-cookie";

type PageProps = {
  params: { equipmentId: string };
  searchParams?: { status?: string; message?: string };
};

export default async function PreStartPage({ params, searchParams }: PageProps) {
  const { equipmentId } = params;
  const [equipment, template, operator] = await Promise.all([
    getEquipmentPublic(equipmentId).catch(() => null),
    getPrestartTemplateForEquipment(equipmentId),
    getOperatorPrefill(),
  ]);

  if (!equipment) {
    notFound();
  }

  const trackingLabel = equipment.trackingUnit === "hours" ? "Hours" : "Kilometers";
  const action = submitPrestartCheck.bind(null, equipmentId);

  if (!template) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Diesel-X</p>
          <h1 className="text-2xl font-bold">Pre-Start Check</h1>
        </header>
        <StatusMessage status={searchParams?.status} message={searchParams?.message} />
        <div className="mt-6 space-y-4">
          <EquipmentSummaryCard equipment={equipment} />
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
            <p className="font-semibold text-neutral-900">No pre-start template configured.</p>
            <p className="mt-2 text-sm text-neutral-500">Let your office know so they can assign one.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/qr/${equipmentId}`}>Back to equipment portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Diesel-X</p>
        <h1 className="text-2xl font-bold">Pre-Start Check</h1>
        <p className="text-sm text-neutral-500">Complete every item before operating.</p>
      </header>

      <StatusMessage status={searchParams?.status} message={searchParams?.message} />

      <div className="mt-6 space-y-6">
        <EquipmentSummaryCard equipment={equipment} />

        <form
          action={action}
          method="post"
          className="space-y-5"
          encType="multipart/form-data"
        >
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Operator details</h2>
              <p className="text-sm text-neutral-500">We remember these for next time.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="operatorName">
                  Operator name
                </label>
                <Input
                  id="operatorName"
                  name="operatorName"
                  defaultValue={operator?.name}
                  placeholder="e.g. Alex Reid"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="operatorPhone">
                  Phone (optional)
                </label>
                <Input
                  id="operatorPhone"
                  name="operatorPhone"
                  defaultValue={operator?.phone}
                  placeholder="04xx xxx xxx"
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="equipmentReading">
                  Current {trackingLabel}
                </label>
                <Input
                  id="equipmentReading"
                  name="equipmentReading"
                  type="number"
                  inputMode="numeric"
                  min={equipment.currentReading}
                  defaultValue={equipment.currentReading}
                  required
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Must be {"\u2265"} {equipment.currentReading.toLocaleString()}.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">{template.template.name}</h2>
              {template.template.description && (
                <p className="text-sm text-neutral-500">{template.template.description}</p>
              )}
            </div>

            <div className="space-y-4">
              {template.items.map((item) => (
                <ChecklistField key={item.id} item={item} />
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="flex-1 bg-red-600 text-white hover:bg-red-500">
              Submit pre-start
            </Button>
            <Button asChild variant="secondary" className="flex-1">
              <Link href={`/qr/${equipmentId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChecklistField({ item }: { item: PrestartTemplateSummary["items"][number] }) {
  const baseName = `item-${item.id}`;
  const resultName = `${baseName}-result`;
  const notesName = `${baseName}-notes`;
  const mediaName = `${baseName}-media`;
  const criticalLabel = item.isCritical ? "Critical — fail will mark equipment down" : "Fail will create a defect task";

  return (
    <fieldset className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
      <legend className="text-base font-semibold text-neutral-900">{item.label}</legend>
      <p className="text-xs text-neutral-500">
        {item.isCritical ? "Critical check" : "Standard check"}
        {item.isRequired ? " • Required" : ""}
      </p>

      <div className="mt-3">
        {item.fieldType === "pass_fail" && (
          <ChoiceField
            resultName={resultName}
            notesName={notesName}
            mediaName={mediaName}
            required={item.isRequired}
            positiveLabel="Pass"
            negativeLabel="Fail"
            positiveValue="pass"
            negativeValue="fail"
            helperText={criticalLabel}
          />
        )}
        {item.fieldType === "yes_no" && (
          <ChoiceField
            resultName={resultName}
            notesName={notesName}
            mediaName={mediaName}
            required={item.isRequired}
            positiveLabel="Yes"
            negativeLabel="No"
            positiveValue="yes"
            negativeValue="no"
            helperText={criticalLabel}
          />
        )}
        {item.fieldType === "text" && (
          <div className="space-y-2">
            <Textarea
              name={resultName}
              minLength={item.isRequired ? 2 : undefined}
              placeholder="Enter details"
              required={item.isRequired}
            />
          </div>
        )}
        {item.fieldType === "number" && (
          <Input
            name={resultName}
            type="number"
            inputMode="numeric"
            required={item.isRequired}
          />
        )}
      </div>
    </fieldset>
  );
}

type ChoiceFieldProps = {
  resultName: string;
  notesName: string;
  mediaName: string;
  required: boolean;
  positiveLabel: string;
  negativeLabel: string;
  positiveValue: string;
  negativeValue: string;
  helperText: string;
};

function ChoiceField({
  resultName,
  notesName,
  mediaName,
  required,
  positiveLabel,
  negativeLabel,
  positiveValue,
  negativeValue,
  helperText,
}: ChoiceFieldProps) {
  const passId = `${resultName}-${positiveValue}`;
  const failId = `${resultName}-${negativeValue}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            id={passId}
            type="radio"
            name={resultName}
            value={positiveValue}
            className="peer sr-only"
            required={required}
          />
          <label
            htmlFor={passId}
            className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-semibold text-neutral-800"
          >
            {positiveLabel}
          </label>
        </div>
        <div className="flex-1">
          <input
            id={failId}
            type="radio"
            name={resultName}
            value={negativeValue}
            className="peer sr-only"
            required={required}
          />
          <label
            htmlFor={failId}
            className="block rounded-xl border border-red-200 bg-white px-4 py-3 text-center font-semibold text-red-600"
          >
            {negativeLabel}
          </label>
          <div className="mt-3 hidden space-y-2 rounded-xl border border-dashed border-red-200 bg-red-50/60 p-3 text-sm text-red-700 peer-checked:block">
            <p className="text-sm font-semibold">{helperText}</p>
            <label className="text-xs font-medium" htmlFor={`${notesName}-field`}>
              Describe the issue
            </label>
            <Textarea
              id={`${notesName}-field`}
              name={notesName}
              placeholder="Where is the fault? What did you see?"
              minLength={10}
            />
            <div className="space-y-1 text-xs text-red-700">
              <label className="font-medium" htmlFor={`${mediaName}-input`}>
                Attach media (photos or short videos)
              </label>
              <input
                id={`${mediaName}-input`}
                name={mediaName}
                type="file"
                multiple
                accept="image/*,video/*"
                className="text-xs text-neutral-700"
              />
              <p>Up to 5 photos and 2 videos (max 2 min each).</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Choosing {negativeLabel} will alert the maintenance team: {helperText}.
      </p>
    </div>
  );
}
