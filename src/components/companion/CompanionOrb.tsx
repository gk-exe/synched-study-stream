import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getTheme } from "@/lib/companion-themes";
import { useCustomCompanion } from "@/hooks/use-custom-companion";

export type OrbState = "idle" | "listening" | "speaking" | "resting" | "celebrate";

/**
 * Sync — a small friendly study robot.
 *
 * Visual language: a soft glowing "head" with a tiny antenna and two
 * gentle ear-bumps that read as a mini robot without looking childish.
 * Eyes are luminous dots; mouth is a subtle smile that only shows on
 * celebrate/happy expressions so Sync stays calm by default.
 *
 * - Idle: slow breathing + occasional blink
 * - Listening: gentle attentive ring
 * - Speaking: subtle inner pulse (no audio, just motion)
 * - Resting: dimmer, slower breath
 * - Celebrate: brief sparkle ring + smile
 *
 * Lightweight by design: pure CSS + a handful of framer-motion tweens,
 * no canvas/webgl — keeps mobile silky-smooth.
 */
export function CompanionOrb({
  state = "idle",
  size = 200,
  themeId,
  className,
  expression = "soft",
  imageUrl,
  useCustom = true,
}: {
  state?: OrbState;
  size?: number;
  themeId?: string | null;
  className?: string;
  /** Subtle face expression hint — currently controls the mouth arc. */
  expression?: "soft" | "smile" | "neutral";
  /** Explicit custom render (used by the creator preview). */
  imageUrl?: string | null;
  /** Set false to always draw the default Sync robot (e.g. style pickers). */
  useCustom?: boolean;
}) {
  const [blink, setBlink] = useState(false);
  const [tilt, setTilt] = useState(0);
  const theme = getTheme(themeId);
  const { imageUrl: adoptedUrl } = useCustomCompanion();
  const custom = imageUrl ?? (useCustom ? adoptedUrl : null);

  // Natural-feeling blink loop
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      const next = 2800 + Math.random() * 3200;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, next);
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  // Rare, gentle head-tilt — keeps the orb feeling alive without being noisy.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      timeout = setTimeout(() => {
        const next = (Math.random() - 0.5) * 6; // -3°..+3°
        setTilt(next);
        setTimeout(() => setTilt(0), 1400);
        loop();
      }, 7000 + Math.random() * 6000);
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  const breathDuration =
    state === "resting" ? 6 : state === "speaking" ? 2.6 : 4.4;
  const breathScale =
    state === "resting" ? [1, 1.02, 1] : state === "speaking" ? [1, 1.05, 1] : [1, 1.035, 1];
  const glowOpacity =
    state === "resting" ? 0.35 : state === "listening" ? 0.85 : 0.65;
  const showSmile = state === "celebrate" || expression === "smile";

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Outer soft halo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: theme.halo }}
        animate={{
          opacity:
            state === "celebrate"
              ? [glowOpacity, 1, glowOpacity]
              : [glowOpacity * 0.7, glowOpacity, glowOpacity * 0.7],
        }}
        transition={{ duration: breathDuration, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Listening ring */}
      {state === "listening" && (
        <motion.div
          className="absolute inset-2 rounded-full border"
          style={{ borderColor: theme.accent }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Gentle float — adds life without distraction. */}
      <motion.div
        className="relative grid place-items-center"
        style={{ width: "100%", height: "100%" }}
        animate={{ y: [0, -2.5, 0], rotate: tilt }}
        transition={{
          y: { duration: 5.6, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 1.4, ease: "easeInOut" },
        }}
      >
      {/* Antenna — a tiny stalk with a glowing tip that pulses on speak. */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ top: `${size * 0.08}px`, height: `${size * 0.14}px` }}
      >
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-foreground/30"
          style={{ width: 2, height: `${size * 0.1}px` }}
        />
        <motion.span
          className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
          style={{
            width: size * 0.055,
            height: size * 0.055,
            background: theme.accent,
            boxShadow: `0 0 ${size * 0.06}px ${theme.accent}`,
          }}
          animate={{
            opacity:
              state === "speaking" ? [0.7, 1, 0.7] : [0.55, 0.9, 0.55],
            scale: state === "celebrate" ? [1, 1.25, 1] : [1, 1.08, 1],
          }}
          transition={{
            duration: state === "speaking" ? 1.1 : 2.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* The orb body — breathes */}
      <motion.div
        className="relative grid place-items-center rounded-full shadow-glow"
        style={{
          width: size * 0.66,
          height: size * 0.66,
          background: theme.body,
        }}
        animate={{ scale: breathScale }}
        transition={{ duration: breathDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Custom render — the user's own companion becomes the face. */}
        {custom && (
          <img
            src={custom}
            alt="Your companion"
            className="absolute inset-0 h-full w-full rounded-full object-cover"
          />
        )}
        {/* Ear-bumps — subtle robot side pieces (headphone-like). */}
        <span
          className="absolute top-1/2 -translate-y-1/2 rounded-full border border-foreground/10"
          style={{
            left: `-${size * 0.04}px`,
            width: size * 0.08,
            height: size * 0.18,
            background: "oklch(0 0 0 / 0.18)",
          }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 rounded-full border border-foreground/10"
          style={{
            right: `-${size * 0.04}px`,
            width: size * 0.08,
            height: size * 0.18,
            background: "oklch(0 0 0 / 0.18)",
          }}
        />

        {/* Inner speaking pulse (motion only — no audio) */}
        {state === "speaking" && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 60%, oklch(1 0 0 / 0.25), transparent 60%)",
            }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.04, 0.9] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Face */}
        <div className="relative flex flex-col items-center" style={{ width: "50%" }}>
          <div className="flex w-full items-center justify-between">
            <Eye blink={blink} happy={showSmile} accent={theme.accent} />
            <Eye blink={blink} happy={showSmile} accent={theme.accent} />
          </div>
          {/* Mouth */}
          <AnimatePresence>
            {showSmile && (
              <motion.span
                key="smile"
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: 0.85, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mt-[22%] block rounded-b-full border-b-[2px] border-foreground/70"
                style={{ width: "60%", height: "20%" }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Soft specular highlight */}
        <div
          className="absolute top-[12%] left-[18%] rounded-full bg-white/40 blur-md"
          style={{ width: "22%", height: "14%" }}
        />
      </motion.div>

      {/* Celebrate sparkles */}
      <AnimatePresence>
        {state === "celebrate" && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.4, 1, 0.6],
                  x: Math.cos((i / 6) * Math.PI * 2) * size * 0.42,
                  y: Math.sin((i / 6) * Math.PI * 2) * size * 0.42,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, delay: i * 0.05, ease: "easeOut" }}
                className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
                style={{ background: theme.accent, boxShadow: `0 0 12px ${theme.accent}` }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Eye({ blink, happy, accent }: { blink: boolean; happy?: boolean; accent: string }) {
  return (
    <motion.span
      className="block rounded-full"
      style={{
        width: "42%",
        aspectRatio: "1 / 1",
        minWidth: 6,
        background: "oklch(0.18 0.02 280)",
        boxShadow: `0 0 6px ${accent}, inset 0 0 2px oklch(1 0 0 / 0.6)`,
      }}
      animate={{ scaleY: blink ? 0.08 : happy ? 0.55 : 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    />
  );
}