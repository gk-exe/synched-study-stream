import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getTheme } from "@/lib/companion-themes";

export type OrbState = "idle" | "listening" | "speaking" | "resting";

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
}: {
  state?: OrbState;
  size?: number;
  themeId?: string | null;
  className?: string;
}) {
  const [blink, setBlink] = useState(false);
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

  const breathDuration =
    state === "resting" ? 6 : state === "speaking" ? 2.6 : 4.4;
  const breathScale =
    state === "resting" ? [1, 1.02, 1] : state === "speaking" ? [1, 1.05, 1] : [1, 1.035, 1];
  const glowOpacity =
    state === "resting" ? 0.35 : state === "listening" ? 0.85 : 0.65;

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
        animate={{ opacity: [glowOpacity * 0.7, glowOpacity, glowOpacity * 0.7] }}
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

        {/* Eyes */}
        <div className="relative flex items-center gap-[14%]" style={{ width: "44%" }}>
          <Eye blink={blink} />
          <Eye blink={blink} />
        </div>

        {/* Soft specular highlight */}
        <div
          className="absolute top-[12%] left-[18%] rounded-full bg-white/40 blur-md"
          style={{ width: "22%", height: "14%" }}
        />
      </motion.div>
    </div>
  );
}

function Eye({ blink }: { blink: boolean }) {
  return (
    <motion.span
      className="block flex-1 rounded-full bg-foreground/85"
      style={{ aspectRatio: "1 / 1" }}
      animate={{ scaleY: blink ? 0.08 : 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    />
  );
}