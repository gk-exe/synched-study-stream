import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableGateway } from "@/lib/ai-gateway";

const SYSTEM_PROMPT = `You are Sync, a warm, supportive AI study companion inside StudySync AI.

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

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        let body: { messages?: UIMessage[] };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = body.messages ?? [];

        const gateway = createLovableGateway(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        try {
          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});