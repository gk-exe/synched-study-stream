import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getTheme } from "@/lib/companion-themes";

export type OrbState = "idle" | "listening" | "speaking" | "resting" | "celebrate";

/**
 * A silent, emotionally present companion.
 * - Idle: slow breathing + occasional blink
 * - Listening: gentle attentive ring
 * - Speaking: subtle inner pulse (no audio, just motion)
 * - Resting: dimmer, slower breath
 */
export function CompanionOrb({
  state = "idle",
  size = 200,
  themeId,
  className,
  expression = "soft",
}: {
  state?: OrbState;
  size?: number;
  themeId?: string | null;
  className?: string;
  /** Subtle face expression hint — currently controls the mouth arc. */
  expression?: "soft" | "smile" | "neutral";
}) {
  const [blink, setBlink] = useState(false);
  const [tilt, setTilt] = useState(0);
  const theme = getTheme(themeId);

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
            <Eye blink={blink} happy={showSmile} />
            <Eye blink={blink} happy={showSmile} />
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

function Eye({ blink, happy }: { blink: boolean; happy?: boolean }) {
  return (
    <motion.span
      className="block rounded-full bg-foreground/85"
      style={{ width: "42%", aspectRatio: "1 / 1", minWidth: 6 }}
      animate={{ scaleY: blink ? 0.08 : happy ? 0.55 : 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    />
  );
}