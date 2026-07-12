// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// - tanstackStart.server.entry: routes TanStack Start's bundled server entry through
//   our SSR error wrapper at src/server.ts (see tanstack-ssr-error-handling).
// - nitro: true: force-enable the nitro deploy plugin so the build always emits a
//   Cloudflare-ready Worker bundle (with TanStack Start's virtual modules —
//   #tanstack-router-entry, tanstack-start-manifest:v, etc. — pre-resolved).
//   Without this, external CI (e.g. Cloudflare Workers Builds running
//   `npx wrangler deploy`) fails to resolve those virtuals because the plugin
//   auto-skips itself when no Lovable build context is detected. Lovable's own
//   Publish pipeline already supplies that context, so enabling this is a no-op
//   there and unblocks self-managed Cloudflare deploys.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: true,
});
