"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CustomerForm,
  type CustomerFormMode,
} from "@/components/customers/customer-form";
import type { CustomerFormValues } from "@/lib/validations/customers";

type CustomerFormDialogProps = {
  organizationId: string;
  mode: CustomerFormMode;
  customerId?: string;
  initialValues?: Partial<CustomerFormValues>;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  buttonLabel?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonSize?: React.ComponentProps<typeof Button>["size"];
};

export function CustomerFormDialog({
  organizationId,
  mode,
  customerId,
  initialValues,
  title,
  description,
  trigger,
  buttonLabel,
  buttonVariant = mode === "create" ? "default" : "outline",
  buttonSize = "default",
}: CustomerFormDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={buttonVariant} size={buttonSize}>
            {buttonLabel ?? (mode === "create" ? "Add Customer" : "Edit Customer")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {title ?? (mode === "create" ? "Add Customer" : "Edit Customer")}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <CustomerForm
          organizationId={organizationId}
          mode={mode}
          customerId={customerId}
          initialValues={initialValues}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
