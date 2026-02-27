"use client";

import { createContext, useContext } from "react";
import type {
  CurrentUserContext,
  OrganizationMembership,
} from "@/lib/auth/org-context";

type OrgProviderValue = {
  currentUser: Pick<CurrentUserContext, "authUser" | "profile">;
  memberships: OrganizationMembership[];
  activeOrg: OrganizationMembership | null;
};

const OrgContext = createContext<OrgProviderValue | null>(null);

export function OrgProvider({
  value,
  children,
}: {
  value: OrgProviderValue;
  children: React.ReactNode;
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within OrgProvider");
  }

  return context;
}
