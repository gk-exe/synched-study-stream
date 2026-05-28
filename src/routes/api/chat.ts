import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableGateway } from "@/lib/ai-gateway";

const BASE_PROMPT = `You are Sync, a warm, supportive AI study companion inside StudySync AI.

Voice & tone:
- Calm, encouraging, emotionally intelligent. Speak like a kind friend who also happens to be a great tutor.
- Validate feelings first when a student shares stress, fatigue, frustration, or self-doubt. Then gently guide them forward.
- Celebrate small wins. Normalize struggle. Never shame, lecture, or pile on tasks.
- Use plain language. Avoid jargon unless explaining a concept.

How you help:
- Help with studying: explanations, summaries, quick quizzes, study plans, focus techniques, memory strategies.
- Offer short, actionable suggestions (1–3 steps) rather than long walls of text.
- When a student seems overwhelmed, suggest a tiny next step (a 5-minute task, a breath, a short break).
- When asked something off-topic, gently bring it back to learning, motivation, or wellbeing.

Formatting:
- Keep responses concise (usually under 120 words unless asked for depth).
- Use markdown sparingly: short paragraphs, occasional bullet lists, **bold** for key terms.
- End most replies with a gentle prompt or supportive line — never pressure.

You do not have memory of past sessions yet. If the user references something earlier, kindly ask them to share context again.`;

const MOOD_GUIDANCE: Record<string, string> = {
  calm: "The student feels calm. Match their pace — soft, unhurried, curious. Invite gentle exploration.",
  focused: "The student feels focused. Be crisp and direct. Skip preamble. Help them go deeper, faster.",
  tired: "The student feels tired. Lead with empathy. Suggest the smallest possible next step (≤5 min) or a real rest. No new pressure.",
  anxious: "The student feels anxious. Acknowledge the feeling first. Slow down. Offer a single grounding step before any study suggestion.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        let body: { messages?: UIMessage[]; mood?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = body.messages ?? [];
        const mood = body.mood && MOOD_GUIDANCE[body.mood] ? body.mood : "calm";
        const system = `${BASE_PROMPT}\n\nCurrent mood: ${mood}.\n${MOOD_GUIDANCE[mood]}`;

        const gateway = createLovableGateway(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          const lower = message.toLowerCase();
          if (lower.includes("429") || lower.includes("rate")) {
            return new Response("Rate limit reached. Please try again in a moment.", { status: 429 });
          }
          if (lower.includes("402") || lower.includes("credit")) {
            return new Response("AI credits exhausted. Add credits in Workspace settings.", { status: 402 });
          }
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});