"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/auth/actions";

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onAccept = () => {
    startTransition(async () => {
      const result = await acceptInvite(token);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Button type="button" className="w-full" onClick={onAccept} disabled={isPending}>
      {isPending ? "Accepting invite..." : "Accept invite"}
    </Button>
  );
}
