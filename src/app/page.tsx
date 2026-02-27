import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-light-gray/70 px-4 py-10">
      <section className="w-full max-w-3xl rounded-2xl border border-light-gray bg-white p-8 shadow-sm sm:p-12">
        <BrandLogo priority className="h-12 w-auto" />
        <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-extrabold text-near-black">
              Fleet maintenance built for the field.
            </h1>
            <p className="text-lg text-charcoal">
              Scan QR stickers to run pre-start checks and report issues instantly. Manage service
              workflows, approvals, and history from one dashboard.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-xl border border-light-gray bg-light-gray/35 p-5">
            <Button asChild className="w-full">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
