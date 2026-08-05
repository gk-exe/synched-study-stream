/**
 * "Create your companion" — the premium personalization flow.
 *
 * Steps: Inspire (optional reference image) → Style → Describe →
 * Generate (streaming preview) → Adopt. The result becomes the app-wide
 * companion face via `useCustomCompanion`.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Coins,
  ImagePlus,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CompanionOrb } from "@/components/companion/CompanionOrb";
import { useAuth } from "@/hooks/use-auth";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useCustomCompanion } from "@/hooks/use-custom-companion";
import {
  CREATOR_FEATURE_ID,
  CREATOR_UNLOCK_COST,
  adoptConcept,
  attachRender,
  createConceptDraft,
  deleteConcept,
  listConcepts,
  markConceptFailed,
  retireAdopted,
  signedUrl,
  uploadReference,
  type CompanionConcept,
} from "@/lib/companion-creator";
import { COMPANION_STYLES, buildCompanionPrompt, getStyle } from "@/lib/companion-styles";
import { streamImage } from "@/lib/stream-image";
import { cn } from "@/lib/utils";

type Gallery = (CompanionConcept & { url: string | null })[];

export function CreateCompanionFlow() {
  const { user } = useAuth();
  const { stats, unlockFeature } = usePomodoro();
  const { concept: adopted, refresh: refreshAdopted } = useCustomCompanion();

  const unlocked = stats.unlockedFeatures.includes(CREATOR_FEATURE_ID);
  const canAfford = stats.coins >= CREATOR_UNLOCK_COST;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [styleId, setStyleId] = useState(COMPANION_STYLES[0]!.id as string);
  const [reference, setReference] = useState<{ file: File; url: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Gallery>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadGallery = useCallback(async () => {
    if (!user) return;
    setLoadingGallery(true);
    try {
      const rows = await listConcepts(user.id);
      const withUrls = await Promise.all(
        rows.map(async (r) => ({ ...r, url: await signedUrl(r.generated_asset_path) })),
      );
      setGallery(withUrls.filter((r) => r.url));
    } catch {
      /* non-fatal */
    } finally {
      setLoadingGallery(false);
    }
  }, [user]);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  function pickFile(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Keep inspiration under 8MB");
      return;
    }
    setReference({ file, url: URL.createObjectURL(file) });
  }

  const generate = useCallback(async () => {
    if (!user) {
      toast.error("Sign in to create your companion");
      return;
    }
    setGenerating(true);
    setError(null);
    setPreview(null);
    setSettled(false);
    let conceptId: string | null = null;
    try {
      let referencePath: string | null = null;
      if (reference) referencePath = await uploadReference(user.id, reference.file);

      const draft = await createConceptDraft(user.id, {
        name,
        prompt: description,
        style: styleId,
        referencePath,
      });
      conceptId = draft.id;

      const dataUrl = await streamImage(
        "/api/companion-image",
        buildCompanionPrompt(styleId, description),
        (frame, final) => {
          setPreview(frame);
          if (final) setSettled(true);
        },
      );

      await attachRender(user.id, draft.id, dataUrl);
      await loadGallery();
      toast.success("Your companion is here", {
        description: "Adopt them to make them your everyday presence.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setError(msg);
      if (conceptId) await markConceptFailed(conceptId, msg).catch(() => {});
      toast.error("Couldn't create your companion", { description: msg });
    } finally {
      setGenerating(false);
    }
  }, [user, reference, name, description, styleId, loadGallery]);

  async function adopt(id: string) {
    if (!user) return;
    try {
      await adoptConcept(user.id, id);
      await refreshAdopted();
      await loadGallery();
      toast.success("Companion adopted", { description: "They'll be with you everywhere now." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't adopt that companion");
    }
  }

  async function unadopt() {
    if (!user) return;
    await retireAdopted(user.id);
    await refreshAdopted();
    await loadGallery();
    toast.success("Back to Sync", { description: "Your original companion returns." });
  }

  async function remove(id: string) {
    try {
      await deleteConcept(id);
      await refreshAdopted();
      await loadGallery();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete");
    }
  }

  if (!unlocked) {
    return (
      <section className="glass shadow-glow rounded-3xl p-8 text-center">
        <CompanionOrb size={112} state="resting" useCustom={false} className="mx-auto" />
        <h2 className="mt-4 text-base font-semibold tracking-tight">Create your own companion</h2>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          Shape a one-of-one study partner — upload inspiration, pick a style,
          describe a vibe, and we'll render them for you.
        </p>
        <div className="mt-5">
          <Button
            onClick={() => {
              if (unlockFeature(CREATOR_FEATURE_ID, CREATOR_UNLOCK_COST)) {
                toast.success("Creator unlocked", {
                  description: "Let's make someone just for you.",
                });
              } else {
                toast.error("Not enough coins yet", {
                  description: `${CREATOR_UNLOCK_COST - stats.coins} more to go — keep showing up.`,
                });
              }
            }}
            disabled={!canAfford}
            className="bg-gradient-brand text-primary-foreground shadow-glow rounded-full disabled:opacity-60"
          >
            {canAfford ? <Coins className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Unlock for {CREATOR_UNLOCK_COST} coins
          </Button>
          <p className="text-muted-foreground mt-3 text-xs">
            You have <span className="text-foreground font-medium">{stats.coins}</span> coins.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — inspiration */}
      <section className="glass shadow-glow rounded-3xl p-6">
        <StepHeader n={1} title="Inspiration" hint="Optional — a mood board or a character you love." />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0]);
            }}
            className="border-border/70 bg-foreground/[0.02] hover:border-primary/50 grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed transition-colors"
          >
            {reference ? (
              <img src={reference.url} alt="Inspiration" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="text-muted-foreground h-5 w-5" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <div className="min-w-[12rem] flex-1">
            <p className="text-sm font-medium">Drop an image</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Stored privately to your account. It guides the mood of the render.
            </p>
            {reference && (
              <button
                onClick={() => setReference(null)}
                className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Step 2 — style */}
      <section className="glass shadow-glow rounded-3xl p-6">
        <StepHeader n={2} title="Style" hint="Pick the silhouette family." />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COMPANION_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyleId(s.id)}
              className={cn(
                "rounded-2xl border p-3 text-left transition-all",
                styleId === s.id
                  ? "border-primary/60 bg-primary/5 shadow-glow"
                  : "border-border/70 hover:border-primary/40",
              )}
            >
              <span
                className="block h-2 w-8 rounded-full"
                style={{ background: s.accent }}
              />
              <p className="mt-2 text-sm font-medium">{s.name}</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{s.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Step 3 — describe */}
      <section className="glass shadow-glow rounded-3xl p-6">
        <StepHeader n={3} title="Describe them" hint="A name, a feeling, a color." />
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,12rem)_1fr]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Luma)"
            maxLength={24}
            className="border-border/70 bg-background/50 placeholder:text-muted-foreground/70 h-10 rounded-xl border px-3 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
            placeholder="A calm fox with soft moonlight glow, quiet and patient…"
            className="border-border/70 bg-background/50 placeholder:text-muted-foreground/70 h-20 w-full resize-none rounded-xl border p-2.5 text-sm"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={generate}
            disabled={generating}
            className="bg-gradient-brand text-primary-foreground shadow-glow rounded-full"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {generating ? "Rendering…" : "Generate companion"}
          </Button>
          {error && (
            <Button onClick={generate} variant="outline" className="rounded-full">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          )}
          <span className="text-muted-foreground text-xs">
            {getStyle(styleId).name} · takes a few seconds
          </span>
        </div>
        {error && <p className="text-destructive mt-3 text-xs">{error}</p>}
      </section>

      {/* Live preview */}
      <AnimatePresence>
        {(generating || preview) && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass shadow-glow rounded-3xl p-6 text-center"
          >
            {preview ? (
              <img
                src={preview}
                alt="Companion preview"
                className={cn(
                  "mx-auto h-44 w-44 rounded-3xl object-cover transition-[filter] duration-700",
                  settled ? "blur-0" : "blur-xl",
                )}
              />
            ) : (
              <div className="bg-foreground/5 mx-auto grid h-44 w-44 animate-pulse place-items-center rounded-3xl">
                <Sparkles className="text-muted-foreground h-5 w-5" />
              </div>
            )}
            <p className="text-muted-foreground mt-3 text-xs">
              {settled ? "Ready — adopt them below." : "Taking shape…"}
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Gallery */}
      <section className="glass shadow-glow rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <StepHeader n={4} title="Your companions" hint="Adopt one to make them your presence." />
          {adopted && (
            <button
              onClick={unadopt}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Back to Sync
            </button>
          )}
        </div>
        {loadingGallery ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-foreground/5 h-36 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : gallery.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Nothing here yet — generate your first companion above.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((c) => {
              const isActive = adopted?.id === c.id;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "border-border/70 relative overflow-hidden rounded-2xl border p-2",
                    isActive && "ring-primary ring-2",
                  )}
                >
                  <img
                    src={c.url!}
                    alt={c.name ?? "Companion"}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                  <p className="mt-2 truncate text-xs font-medium">
                    {c.name ?? getStyle(c.style).name}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "outline"}
                      disabled={isActive}
                      onClick={() => adopt(c.id)}
                      className="h-7 flex-1 rounded-full text-[11px]"
                    >
                      {isActive ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                      {isActive ? "Active" : "Adopt"}
                    </Button>
                    <button
                      onClick={() => remove(c.id)}
                      aria-label="Delete companion"
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StepHeader({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-gradient-brand text-primary-foreground grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
        {n}
      </span>
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
    </div>
  );
}