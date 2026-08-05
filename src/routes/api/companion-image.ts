import { createFileRoute } from "@tanstack/react-router";

/**
 * Streaming image generation for custom companions.
 *
 * Typed RPC (`createServerFn`) cannot stream a Response, so the
 * companion renderer lives on a raw server route. The upstream body is
 * passed straight through so partial frames reach the client while the
 * render is still resolving.
 */
export const Route = createFileRoute("/api/companion-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || !prompt.trim()) {
          return new Response("Missing prompt", { status: 400 });
        }
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
              stream: true,
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text();
          if (upstream.status === 429)
            return new Response("Rate limit reached. Try again in a moment.", { status: 429 });
          if (upstream.status === 402)
            return new Response("AI credits exhausted. Add credits to keep creating.", { status: 402 });
          return new Response(text || "Image generation failed", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});