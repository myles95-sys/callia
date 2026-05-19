// Wrapper pour /api/chat (backend Express)
// Le backend ajoute la clé Anthropic — jamais exposée au navigateur.

export async function askClaude({ system, history, userMessage }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      messages: history || [],
      userMessage,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  const data = await res.json();
  return data.reply || "";
}

export async function checkBackendHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}
