import { localDb as supabase } from "@/lib/local-db";

const KEY = "studysync:onboarded:v1";

export function getCachedOnboarded(): boolean | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  if (v === "1") return true;
  if (v === "0") return false;
  return null;
}

export function setCachedOnboarded(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* noop */
  }
}

export function clearCachedOnboarded() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Returns true if the user has already completed onboarding. */
export async function fetchOnboarded(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  const onboarded = !!data?.onboarded;
  setCachedOnboarded(onboarded);
  return onboarded;
}

/** Decide post-auth landing route. */
export async function resolvePostAuthRoute(userId: string): Promise<"/dashboard" | "/onboarding"> {
  try {
    const onboarded = await fetchOnboarded(userId);
    return onboarded ? "/dashboard" : "/onboarding";
  } catch {
    // Fall back to cache, default to dashboard for returning users
    return getCachedOnboarded() ? "/dashboard" : "/onboarding";
  }
}