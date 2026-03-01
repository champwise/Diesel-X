"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import {
  createCustomer,
  updateCustomer,
} from "@/lib/actions/customers";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/lib/validations/customers";
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
import { Textarea } from "@/components/ui/textarea";

export type CustomerFormMode = "create" | "edit";

type CustomerFormProps = {
  organizationId: string;
  mode: CustomerFormMode;
  customerId?: string;
  initialValues?: Partial<CustomerFormValues>;
  onSuccess?: () => void;
};

const defaultBlankValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

export function CustomerForm({
  organizationId,
  mode,
  customerId,
  initialValues,
  onSuccess,
}: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();

  const resolvedDefaults = useMemo<CustomerFormValues>(
    () => ({
      ...defaultBlankValues,
      ...initialValues,
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      address: initialValues?.address ?? "",
      notes: initialValues?.notes ?? "",
    }),
    [initialValues]
  );

  const formResolver = zodResolver(customerFormSchema) as Resolver<CustomerFormValues>;

  const form = useForm<CustomerFormValues>({
    resolver: formResolver,
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    form.reset(resolvedDefaults);
  }, [form, resolvedDefaults]);

  const handleSubmit: SubmitHandler<CustomerFormValues> = (values) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createCustomer(organizationId, values);
          toast.success("Customer created.");
          form.reset(defaultBlankValues);
        } else {
          if (!customerId) {
            throw new Error("Customer ID is required for editing.");
          }
          await updateCustomer(organizationId, customerId, values);
          toast.success("Customer updated.");
        }

        onSuccess?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save customer."
        );
      }
    });
  };

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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Earthworks" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="fleet@acme.com"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 555 0123"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 Main St, Houston, TX"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Customer preferences, site access info, billing contacts..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Add Customer"
            : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
