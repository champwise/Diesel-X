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
  EquipmentForm,
  type EquipmentFormMode,
  type EquipmentCustomerOption,
} from "./equipment-form";
import type { EquipmentFormValues } from "@/lib/validations/equipment";

type EquipmentFormDialogProps = {
  organizationId: string;
  customers: EquipmentCustomerOption[];
  mode: EquipmentFormMode;
  equipmentId?: string;
  initialValues?: Partial<EquipmentFormValues>;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  buttonLabel?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonSize?: React.ComponentProps<typeof Button>["size"];
};

export function EquipmentFormDialog({
  organizationId,
  customers,
  mode,
  equipmentId,
  initialValues,
  title,
  description,
  trigger,
  buttonLabel,
  buttonVariant = mode === "create" ? "default" : "outline",
  buttonSize = "default",
}: EquipmentFormDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={buttonVariant} size={buttonSize}>
            {buttonLabel ?? (mode === "create" ? "Add Equipment" : "Edit Equipment")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {title ?? (mode === "create" ? "Add Equipment" : "Edit Equipment")}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <EquipmentForm
          organizationId={organizationId}
          customers={customers}
          mode={mode}
          equipmentId={equipmentId}
          initialValues={initialValues}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
