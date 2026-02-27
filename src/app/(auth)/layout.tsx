import { BrandLogo } from "@/components/shared/brand-logo";
import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-gray/70 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo priority className="h-10 w-auto" />
          <p className="mt-2 text-sm text-charcoal">Fleet maintenance platform</p>
        </div>
        <div className="rounded-2xl border border-light-gray bg-white p-1 shadow-sm">{children}</div>
      </div>
      <Toaster />
    </div>
  );
}
