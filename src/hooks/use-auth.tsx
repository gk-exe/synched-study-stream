/**
 * Local, sign-in-free "user".
 * ---------------------------------------------------------------------
 * StudySync AI no longer has accounts. Every feature still wants a stable
 * id to hang progress off, so we hand out a single anonymous local user.
 * Nothing here talks to an auth service — no sessions, no listeners, no
 * redirects.
 */
import { createContext, useContext, useMemo } from "react";
import { LOCAL_USER_ID } from "@/lib/local-db";

export type LocalUser = {
  id: string;
  email: null;
  user_metadata: { full_name: string };
};

type AuthCtx = {
  user: LocalUser;
  session: null;
  loading: boolean;
};

const localUser: LocalUser = {
  id: LOCAL_USER_ID,
  email: null,
  user_metadata: { full_name: "Explorer" },
};

const Ctx = createContext<AuthCtx>({ user: localUser, session: null, loading: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AuthCtx>(() => ({ user: localUser, session: null, loading: false }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
