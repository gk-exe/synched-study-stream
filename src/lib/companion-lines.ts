/**
 * Companion line library
 * ---------------------------------------------------------------------
 * A small, context-tagged pool of things Sync can say across the app,
 * plus a `pickLine` helper that avoids repeating what it just said.
 *
 * Design goals:
 *   - Feel varied — each context has ≥ 4 alternates so the same phrase
 *     rarely surfaces twice in a session.
 *   - Stay short and emotionally intelligent — 2–8 words wherever it can.
 *   - Be composable — callers pass a list of context tags in priority
 *     order and we pick from the first tag that has a fresh line.
 *
 * Recent-history is kept in-module (Set with a small LRU cap). It's
 * intentionally global to the tab, so switching pages doesn't reset the
 * anti-repeat memory.
 */

export type LineTag =
  // Focus session outcomes
  | "focus.done.first"
  | "focus.done.small"
  | "focus.done.strong"
  | "focus.done.late"
  // Streak moments
  | "streak.new"
  | "streak.3"
  | "streak.7"
  | "streak.14"
  | "streak.30"
  | "streak.milestone"
  // Session count milestones
  | "sessions.10"
  | "sessions.25"
  | "sessions.50"
  | "sessions.100"
  // Saved / library
  | "saved"
  // Return after absence
  | "return.short"
  | "return.long"
  // Ambient / idle presence
  | "idle.morning"
  | "idle.afternoon"
  | "idle.evening"
  | "idle.night"
  | "idle.default"
  // Running-session ambient
  | "flow.focus"
  | "flow.break"
  // Momentum
  | "momentum.high"
  | "momentum.low"
  // Mood
  | "mood.tired"
  | "mood.anxious"
  | "mood.focused"
  | "mood.calm";

const LINES: Record<LineTag, string[]> = {
  "focus.done.first": [
    "First one down.",
    "Nice — the day has a start.",
    "That's the hardest one out of the way.",
    "Good opening move.",
  ],
  "focus.done.small": [
    "Nice work.",
    "That was a solid session.",
    "You showed up.",
    "Quiet progress.",
    "One more brick in the wall.",
    "That counted.",
  ],
  "focus.done.strong": [
    "Strong day.",
    "You're getting closer.",
    "That's real focus.",
    "Look at you go.",
    "Momentum is doing the lifting now.",
  ],
  "focus.done.late": [
    "Late session, still counts.",
    "Impressive — the world got quiet and you got to work.",
    "Small hours, real work.",
  ],

  "streak.new": [
    "New streak starting.",
    "Day one on the board.",
    "Something's beginning.",
  ],
  "streak.3": [
    "Three days in a row.",
    "The rhythm is forming.",
    "Three days — that's not luck anymore.",
  ],
  "streak.7": [
    "A full week. You really showed up.",
    "Seven days. That's a habit forming.",
    "One week. Quietly proud of you.",
  ],
  "streak.14": [
    "Two weeks strong.",
    "Fourteen days — this is who you're becoming.",
  ],
  "streak.30": [
    "A month. That's a whole shape of a life.",
    "Thirty days. This is discipline.",
  ],
  "streak.milestone": [
    "Another milestone. Steady on.",
    "This is who you're becoming.",
    "Consistency is doing its work.",
  ],

  "sessions.10": [
    "Ten sessions together. Momentum is building.",
    "Ten under your belt.",
  ],
  "sessions.25": [
    "Twenty-five sessions together. Steady progress.",
    "Twenty-five. Not a coincidence anymore.",
  ],
  "sessions.50": [
    "Fifty sessions. That's a body of work.",
    "Fifty deep. This is real practice.",
  ],
  "sessions.100": [
    "One hundred sessions. Take that in.",
    "A hundred. Quietly extraordinary.",
  ],

  saved: [
    "Saved. We can come back to it.",
    "Kept for later.",
    "Tucked into your library.",
    "Filed away. It'll be there.",
  ],

  "return.short": [
    "Welcome back.",
    "There you are.",
    "Ready when you are.",
  ],
  "return.long": [
    "It's been a minute. No judgment — let's just start.",
    "Good to see you. Small session is enough today.",
    "Welcome back. We pick up where we left off.",
  ],

  "idle.morning": [
    "Good morning. A quiet start?",
    "Slow mornings make good afternoons.",
    "Pick one thing. That's the first move.",
  ],
  "idle.afternoon": [
    "Afternoons are underrated.",
    "One clean session and today shifts.",
    "Let's steal thirty minutes.",
  ],
  "idle.evening": [
    "Evening focus hits different.",
    "One more before you close the day?",
    "Wind-down session? I'll be gentle.",
  ],
  "idle.night": [
    "Late one. Be kind to yourself.",
    "Short and honest — that's plenty tonight.",
    "One quiet session, then rest.",
  ],
  "idle.default": [
    "Ready when you are. No pressure.",
    "Here whenever you want to start.",
    "Take your time.",
  ],

  "flow.focus": [
    "You're in flow. I'm right here.",
    "Keep going. One line at a time.",
    "Don't look up. I've got the room.",
    "This is the good part.",
  ],
  "flow.break": [
    "Rest is part of the work.",
    "Let your mind wander a moment.",
    "Look at something far away.",
    "Breathe. The next one will be easier.",
  ],

  "momentum.high": [
    "You've been consistent lately.",
    "The last few days are stacking up.",
  ],
  "momentum.low": [
    "One small session today is enough.",
    "Small counts. Start tiny.",
    "Even five minutes will reset the day.",
  ],

  "mood.tired": [
    "Be gentle today. Small counts.",
    "Low battery is okay. We'll go easy.",
    "Half a session is still a session.",
  ],
  "mood.anxious": [
    "Inhale 4 · hold 4 · exhale 6. I'll wait.",
    "One breath. Then one line.",
    "Slow down first. The work waits.",
  ],
  "mood.focused": [
    "The room is yours. Go deep.",
    "You've got the good kind of quiet.",
  ],
  "mood.calm": [
    "Calm is the launchpad.",
    "Nice place to start from.",
  ],
};

const RECENT_CAP = 24;
const recent: string[] = [];

function remember(line: string) {
  recent.push(line);
  if (recent.length > RECENT_CAP) recent.shift();
}

/**
 * Pick a line from the first tag whose pool still has an option we
 * haven't shown recently. Falls back to the first tag if everything is
 * "recent" so we never return `undefined`.
 */
export function pickLine(tags: LineTag[]): string {
  for (const tag of tags) {
    const pool = LINES[tag];
    if (!pool || pool.length === 0) continue;
    const fresh = pool.filter((l) => !recent.includes(l));
    const candidates = fresh.length > 0 ? fresh : pool;
    const line = candidates[Math.floor(Math.random() * candidates.length)];
    remember(line);
    return line;
  }
  // Absolute fallback
  return "Here whenever you want to start.";
}

/** All non-recent lines across the given tags — useful for rotators. */
export function collectLines(tags: LineTag[]): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    for (const line of LINES[tag] ?? []) {
      if (!out.includes(line)) out.push(line);
    }
  }
  return out;
}

/** Local time-of-day tag. */
export function timeOfDayTag(now = new Date()): LineTag {
  const h = now.getHours();
  if (h < 5) return "idle.night";
  if (h < 12) return "idle.morning";
  if (h < 17) return "idle.afternoon";
  if (h < 22) return "idle.evening";
  return "idle.night";
}
