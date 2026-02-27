import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-2xl font-bold text-red-600">Diesel-X</p>
          <p className="text-sm text-muted-foreground">Fleet maintenance platform</p>
        </div>
        {children}
      </div>
      <Toaster richColors />
    </div>
  );
}
