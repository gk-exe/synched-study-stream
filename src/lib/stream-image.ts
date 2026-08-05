/**
 * Minimal SSE reader for the Lovable AI image endpoint.
 *
 * Emits partial frames as they arrive (so the UI can show a blurred
 * preview settling into the final render) and resolves with the final
 * data URL.
 */
export async function streamImage(
  url: string,
  prompt: string,
  onFrame: (dataUrl: string, final: boolean) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error((await res.text()) || "Generation failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let last = "";

  const take = (payload: string) => {
    if (!payload || payload === "[DONE]") return;
    try {
      const json = JSON.parse(payload);
      const b64 =
        json?.data?.[0]?.b64_json ??
        json?.choices?.[0]?.delta?.images?.[0]?.image_url?.url ??
        json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
        json?.b64_json;
      if (!b64) return;
      const dataUrl = String(b64).startsWith("data:")
        ? String(b64)
        : `data:image/png;base64,${b64}`;
      last = dataUrl;
      onFrame(dataUrl, false);
    } catch {
      /* partial frame — ignore */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      take(trimmed.slice(5).trim());
    }
  }

  if (!last) throw new Error("No image returned");
  onFrame(last, true);
  return last;
}