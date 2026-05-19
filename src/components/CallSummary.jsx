import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// CallSummary — Modal qui affiche un résumé IA d'un appel + envoi email
// ═══════════════════════════════════════════════════════════════════════════

const INTENT_META = {
  prise_rdv:          { icon: "📅", label: "Prise de RDV",        color: "var(--cyan)" },
  commande:           { icon: "🛒", label: "Commande",            color: "var(--accent)" },
  plainte:            { icon: "⚠",  label: "Plainte",             color: "var(--error)" },
  information:        { icon: "ℹ",  label: "Demande d'info",     color: "var(--text-dim)" },
  transfert_demande:  { icon: "↗",  label: "Transfert demandé",   color: "var(--warn)" },
  autre:              { icon: "💬", label: "Autre",                color: "var(--text-dim)" },
};

export default function CallSummary({ agent, transcript, callDate, onClose }) {
  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const [error, setError]  = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, agent }),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message || "Échec du résumé");
      } finally {
        setLoad(false);
      }
    })();
  }, [transcript, agent]);

  const formatDialogue = () => transcript
    .filter(m => m.role !== "system")
    .map(m => (m.role === "user" ? "Client" : (agent?.agent_name || "Callia")) + " : " + m.content)
    .join("\n");

  const emailBody = () => {
    if (!data) return "";
    return `Bonjour,

Voici le résumé d'un appel récent pour ${agent?.name || "votre entreprise"}.

📋 RÉSUMÉ
${data.summary}

🎯 INTENTION DÉTECTÉE
${INTENT_META[data.intent]?.label || data.intent}

✅ ACTION SUGGÉRÉE
${data.action}

📞 TRANSCRIPT COMPLET
${formatDialogue()}

—
Envoyé par Callia · ${new Date().toLocaleString("fr-FR")}`;
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`Résumé d'appel — ${agent?.name || "Callia"}`);
    const body = encodeURIComponent(emailBody());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(emailBody());
      alert("Résumé copié dans le presse-papier !");
    } catch { alert("Copie impossible — sélectionnez le texte manuellement."); }
  };

  const intent = data ? (INTENT_META[data.intent] || INTENT_META.autre) : null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250,
      background: "rgba(2, 5, 10, 0.85)",
      backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      animation: "simFadeIn 0.3s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: 580,
        background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.005))",
        border: "1px solid var(--line-strong)",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--accent-soft)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>
              📋 Résumé IA d'appel
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{agent?.name || "Callia"}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2, fontFamily: "var(--mono)" }}>
              {callDate ? new Date(callDate).toLocaleString("fr-FR") : new Date().toLocaleString("fr-FR")}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--line)",
            color: "var(--text-dim)", fontSize: 18, cursor: "pointer", fontFamily: "inherit",
          }}>×</button>
        </div>

        <div style={{ padding: "22px 26px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-dim)", fontSize: 14 }}>
              <div style={{ fontSize: 26, marginBottom: 12, animation: "float 1.5s ease-in-out infinite" }}>✨</div>
              L'IA analyse l'appel...
            </div>
          )}
          {error && (
            <div style={{ padding: 14, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 10, color: "#fca5a5", fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {data && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Intent + action */}
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 99,
                  background: `color-mix(in srgb, ${intent.color} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${intent.color} 30%, transparent)`,
                  color: intent.color, fontSize: 12, fontWeight: 600,
                }}>
                  {intent.icon} {intent.label}
                </span>
              </div>

              {/* Résumé */}
              <div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>Résumé</div>
                <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{data.summary}</div>
              </div>

              {/* Action suggérée */}
              <div style={{
                padding: 14,
                background: "var(--accent-soft)",
                border: "1px solid rgba(0, 224, 157, 0.2)",
                borderRadius: 12,
              }}>
                <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 6 }}>✓ Action suggérée</div>
                <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{data.action}</div>
              </div>

              {/* Transcript repliable */}
              <details style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px" }}>
                <summary style={{ fontSize: 12, color: "var(--text-dim)", cursor: "pointer", fontWeight: 500 }}>
                  📞 Voir le transcript complet ({transcript.filter(m => m.role !== "system").length} messages)
                </summary>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {transcript.filter(m => m.role !== "system").map((m, i) => (
                    <div key={i} style={{ fontSize: 12, lineHeight: 1.5 }}>
                      <strong style={{ color: m.role === "user" ? "var(--violet)" : "var(--accent)" }}>
                        {m.role === "user" ? "Client" : (agent?.agent_name || "Callia")}
                      </strong>
                      <span style={{ color: "var(--text-faint)", margin: "0 6px" }}>·</span>
                      <span style={{ color: "var(--text)" }}>{m.content}</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
                <button onClick={sendEmail} className="btn btn-primary" style={{ flex: 1 }}>
                  📧 Envoyer par email
                </button>
                <button onClick={copyToClipboard} className="btn btn-secondary">
                  📋 Copier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
