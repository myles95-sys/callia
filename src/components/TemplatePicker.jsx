import { TEMPLATES, BLANK_TEMPLATE } from "../lib/templates.js";

// ═══════════════════════════════════════════════════════════════════════════
// TemplatePicker — Modal de choix de template au "Nouvel agent"
// ═══════════════════════════════════════════════════════════════════════════

export default function TemplatePicker({ onPick, onClose }) {
  const pick = (tpl) => {
    const initial = {
      ...tpl.template,
      country_code: "FR",
      language: "fr-FR",
      agent_name: "Callia",
      greeting: "",
      calendly_url: "",
      escalation_phone: "",
      active: true,
      faqs: tpl.faqs,
    };
    onPick(initial);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 220,
      background: "rgba(2, 5, 10, 0.85)",
      backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      animation: "simFadeIn 0.3s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: 880,
        background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.005))",
        border: "1px solid var(--line-strong)",
        borderRadius: 22,
        backdropFilter: "blur(20px)",
        boxShadow: "0 40px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px var(--accent-soft)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <div style={{ padding: "26px 30px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 6 }}>✨ Démarrage rapide</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text)" }}>Choisissez votre secteur</h2>
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 6 }}>Nous pré-remplissons tout pour vous. Vous pourrez tout modifier ensuite.</p>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)",
            color: "var(--text-dim)", fontSize: 20, cursor: "pointer", fontFamily: "inherit",
          }}>×</button>
        </div>

        <div style={{ padding: "24px 30px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => pick(tpl)}
              className="tpl-card"
              style={{ "--tpl-color": tpl.color }}
            >
              <div className="tpl-icon" style={{ background: `color-mix(in srgb, ${tpl.color} 18%, transparent)`, color: tpl.color }}>{tpl.icon}</div>
              <div className="tpl-label">{tpl.label}</div>
              <div className="tpl-faqs">{tpl.faqs.length} questions pré-remplies</div>
            </button>
          ))}
        </div>

        <div style={{ padding: "0 30px 26px" }}>
          <button onClick={() => pick(BLANK_TEMPLATE)} className="tpl-blank">
            <span style={{ fontSize: 18 }}>✨</span>
            <span>Démarrer d'une page vierge</span>
            <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontSize: 12 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
