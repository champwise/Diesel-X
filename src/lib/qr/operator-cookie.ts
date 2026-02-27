import { cookies } from "next/headers";

import { OPERATOR_COOKIE_NAME } from "./constants";

export type OperatorIdentity = {
  name: string;
  phone?: string;
};

export async function getOperatorPrefill(): Promise<OperatorIdentity | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OPERATOR_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as OperatorIdentity;
    if (!parsed?.name) {
      return null;
    }

    return {
      name: parsed.name,
      phone: parsed.phone ?? "",
    };
  } catch {
    return null;
  }
}
