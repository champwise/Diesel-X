"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="text-brand-red size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "border-light-gray bg-white text-near-black",
          title: "font-heading text-sm font-bold text-near-black",
          description: "text-charcoal",
          success: "border-brand-red/35",
          error: "border-brand-red bg-brand-red/5 text-brand-red",
          loading: "border-brand-red/35",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#141415",
          "--normal-border": "#ececea",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
