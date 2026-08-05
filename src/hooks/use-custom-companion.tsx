/**
 * Custom companion presence
 * ---------------------------------------------------------------------
 * Exposes the user's adopted custom companion render (if any) to the
 * whole app. `CompanionOrb` reads this context by default, so adopting
 * a concept instantly changes Sync's face on the dashboard, focus mode,
 * chat header and the floating presence widget — no prop drilling.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getAdoptedConcept,
  signedUrl,
  type CompanionConcept,
} from "@/lib/companion-creator";

type Ctx = {
  concept: CompanionConcept | null;
  /** Signed URL of the adopted render, or null when using the default orb. */
  imageUrl: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const CustomCompanionCtx = createContext<Ctx>({
  concept: null,
  imageUrl: null,
  loading: false,
  refresh: async () => {},
});

export function CustomCompanionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [concept, setConcept] = useState<CompanionConcept | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setConcept(null);
      setImageUrl(null);
      return;
    }
    setLoading(true);
    try {
      const c = await getAdoptedConcept(user.id);
      setConcept(c);
      setImageUrl(c ? await signedUrl(c.generated_asset_path) : null);
    } catch {
      /* non-fatal — fall back to the default orb */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const value = useMemo(
    () => ({ concept, imageUrl, loading, refresh }),
    [concept, imageUrl, loading, refresh],
  );

  return (
    <CustomCompanionCtx.Provider value={value}>{children}</CustomCompanionCtx.Provider>
  );
}

export function useCustomCompanion() {
  return useContext(CustomCompanionCtx);
}