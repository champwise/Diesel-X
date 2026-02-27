"use client";

import { useTransition, useEffect, useMemo } from "react";
import {
  useForm,
  type ControllerRenderProps,
  type FieldPath,
  type SubmitHandler,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  equipmentFormSchema,
  type EquipmentFormValues,
  equipmentStatusOptions,
  equipmentTypeOptions,
  trackingUnitOptions,
} from "@/lib/validations/equipment";
import { createEquipment, updateEquipment } from "@/lib/actions/equipment";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type EquipmentCustomerOption = {
  id: string;
  name: string;
};

export type EquipmentFormMode = "create" | "edit";

type EquipmentFormProps = {
  organizationId: string;
  customers: EquipmentCustomerOption[];
  mode: EquipmentFormMode;
  equipmentId?: string;
  initialValues?: Partial<EquipmentFormValues>;
  onSuccess?: () => void;
};

const defaultBlankValues: EquipmentFormValues = {
  unitName: "",
  make: "",
  model: "",
  equipmentType: "other",
  customerId: "",
  trackingUnit: "hours",
  currentReading: 0,
  nextServiceDue: undefined,
  nextServiceType: "",
  serviceIntervalHours: undefined,
  serviceIntervalKms: undefined,
  taskCreationThreshold: undefined,
  vinSerial: "",
  status: "active",
  operatingStatus: "up",
  notes: "",
  year: undefined,
};

export function EquipmentForm({
  organizationId,
  customers,
  mode,
  equipmentId,
  initialValues,
  onSuccess,
}: EquipmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const hasCustomers = customers.length > 0;

  const resolvedDefaults = useMemo<EquipmentFormValues>(() => {
    const baseCustomerId =
      initialValues?.customerId ?? customers[0]?.id ?? defaultBlankValues.customerId;

    return {
      ...defaultBlankValues,
      ...initialValues,
      customerId: baseCustomerId,
      unitName: initialValues?.unitName ?? "",
      make: initialValues?.make ?? "",
      model: initialValues?.model ?? "",
      vinSerial: initialValues?.vinSerial ?? "",
      nextServiceType: initialValues?.nextServiceType ?? "",
      notes: initialValues?.notes ?? "",
    };
  }, [customers, initialValues]);

  const formResolver = zodResolver(
    equipmentFormSchema
  ) as Resolver<EquipmentFormValues>;

  const form = useForm<EquipmentFormValues>({
    resolver: formResolver,
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    form.reset(resolvedDefaults);
  }, [form, resolvedDefaults]);

  const trackingUnit = form.watch("trackingUnit");

  const handleSubmit: SubmitHandler<EquipmentFormValues> = (values) => {
    if (!hasCustomers) {
      toast.error("Add a customer before creating equipment.");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createEquipment(organizationId, values);
          toast.success("Equipment created.");
          form.reset({
            ...defaultBlankValues,
            customerId: values.customerId,
            trackingUnit: values.trackingUnit,
            status: values.status,
            operatingStatus: values.operatingStatus,
          });
        } else {
          if (!equipmentId) {
            throw new Error("Equipment ID is required for editing.");
          }
          await updateEquipment(organizationId, equipmentId, values);
          toast.success("Equipment updated.");
        }

        onSuccess?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save equipment."
        );
      }
    });
  };

  const renderNumberInput = <TFieldName extends FieldPath<EquipmentFormValues>>(
    field: ControllerRenderProps<EquipmentFormValues, TFieldName>,
    props: React.ComponentProps<typeof Input>
  ) => (
    <Input
      {...props}
      value={field.value ?? ""}
      onChange={(event) =>
        field.onChange(
          event.target.value === "" ? undefined : Number(event.target.value)
        )
      }
    />
  );

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="unitName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit #</FormLabel>
                <FormControl>
                  <Input placeholder="EX-042" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select
                  disabled={!hasCustomers}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hasCustomers && (
                  <p className="text-destructive text-sm">
                    Add a customer before creating equipment.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <FormControl>
                  <Input placeholder="Caterpillar" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="336 GC" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  {renderNumberInput(field, {
                    placeholder: "2022",
                    min: 1900,
                    max: new Date().getFullYear() + 1,
                    type: "number",
                  })}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="equipmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {equipmentTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {equipmentStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "active" ? "Active" : "Inactive"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operatingStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operating Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="up">Up</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trackingUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking Unit</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {trackingUnitOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === "hours" ? "Hours" : "Kilometers"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentReading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Current {trackingUnit === "hours" ? "Hours" : "Kms"}
                </FormLabel>
                <FormControl>
                  {renderNumberInput(field, {
                    type: "number",
                    min: 0,
                    placeholder: "4200",
                  })}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="nextServiceDue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Service Reading</FormLabel>
                <FormControl>
                  {renderNumberInput(field, {
                    type: "number",
                    min: 0,
                    placeholder: "4500",
                  })}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceIntervalHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Interval (Hours)</FormLabel>
                <FormControl>
                  {renderNumberInput(field, {
                    type: "number",
                    min: 0,
                    placeholder: "250",
                  })}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceIntervalKms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Interval (Kms)</FormLabel>
                <FormControl>
                  {renderNumberInput(field, {
                    type: "number",
                    min: 0,
                    placeholder: "10000",
                  })}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="taskCreationThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Creation Threshold</FormLabel>
                <FormControl>
                  {renderNumberInput(field, {
                    type: "number",
                    min: 0,
                    placeholder: "50",
                  })}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vinSerial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VIN / Serial</FormLabel>
                <FormControl>
                  <Input placeholder="CAT00A12345" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nextServiceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Service Type</FormLabel>
              <FormControl>
                <Input placeholder="250 Hour Service" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Internal notes..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending || !hasCustomers} className="w-full">
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Add Equipment"
            : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
