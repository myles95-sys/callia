import { useState } from "react";
import { TEMPLATES } from "../lib/templates.js";
import { createAgent, COUNTRIES } from "../lib/agents.js";

// ═══════════════════════════════════════════════════════════════════════════
// OnboardingWizard — 4 étapes guidées pour créer son 1er agent
// ═══════════════════════════════════════════════════════════════════════════

export default function OnboardingWizard({ onDone, onSkip }) {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState(null);
  const [data, setData] = useState({
    name: "",
    phone: "",
    address: "",
    country_code: "FR",
  });
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = 4;
  const next = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  // ─── Pickup template + générer FAQ AI ───
  const pickTemplate = async (tpl) => {
    setTemplate(tpl);
    setData(d => ({
      ...d,
      name: tpl.template.name,
    }));
    setFaqs(tpl.faqs.slice(0, 5));
    next();
  };

  // ─── Génération de FAQ par IA pour le template choisi ───
  const generateMoreFaqs = async () => {
    if (!template) return;
    setLoadingFaqs(true);
    try {
      const res = await fetch("/api/suggest-faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: template.template.sector,
          description: template.template.description,
          name: data.name || template.template.name,
        }),
      });
      const json = await res.json();
      if (json.faqs && json.faqs.length > 0) {
        setFaqs(prev => {
          const existing = new Set(prev.map(f => f.question.toLowerCase()));
          const fresh = json.faqs.filter(f => !existing.has(f.question.toLowerCase()));
          return [...prev, ...fresh].slice(0, 10);
        });
      }
    } catch { /* ignore */ }
    finally { setLoadingFaqs(false); }
  };

  const finalize = async () => {
    setCreating(true); setError("");
    try {
      const cleanFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
      const payload = {
        ...template.template,
        ...data,
        language: "fr-FR",
        agent_name: "Callia",
        greeting: "",
        calendly_url: "",
        escalation_phone: "",
        active: true,
      };
      const created = await createAgent(payload, cleanFaqs);
      onDone?.(created);
    } catch (e) {
      setError(e.message || "Échec de la création");
    } finally { setCreating(false); }
  };

  return (
    <div className="onboard-overlay">
      <div className="onboard-card">
        <div className="onboard-progress">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={"onboard-step-bar" + (i < step ? " done" : i === step ? " active" : "")} />
          ))}
        </div>

        <div className="onboard-body">

          {/* ═══ ÉTAPE 0 : Choix template ═══ */}
          {step === 0 && (
            <>
              <div className="onboard-eyebrow">Étape 1 sur 4</div>
              <h2 className="onboard-title">Quel est votre secteur ?</h2>
              <p className="onboard-lede">Choisissez le plus proche. Nous pré-remplissons tout le reste pour vous (vous pourrez modifier ensuite).</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginTop: 18 }}>
                {TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => pickTemplate(tpl)} className="tpl-card" style={{ "--tpl-color": tpl.color }}>
                    <div className="tpl-icon" style={{ background: `color-mix(in srgb, ${tpl.color} 18%, transparent)`, color: tpl.color }}>{tpl.icon}</div>
                    <div className="tpl-label">{tpl.label}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ═══ ÉTAPE 1 : Infos de base ═══ */}
          {step === 1 && template && (
            <>
              <div className="onboard-eyebrow">Étape 2 sur 4</div>
              <h2 className="onboard-title">Personnalisez votre {template.label.toLowerCase()}</h2>
              <p className="onboard-lede">Quelques infos pour que Callia puisse répondre correctement à vos clients.</p>

              <div className="onboard-form-row">
                <label>Nom de votre entreprise *</label>
                <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder={template.template.name} />
              </div>
              <div className="onboard-form-row">
                <label>Numéro de téléphone affiché</label>
                <input value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="+33 1 23 45 67 89" />
              </div>
              <div className="onboard-form-row">
                <label>Adresse</label>
                <input value={data.address} onChange={e => setData({ ...data, address: e.target.value })} placeholder="12 rue de la Paix, 75002 Paris" />
              </div>
              <div className="onboard-form-row">
                <label>Pays</label>
                <select value={data.country_code} onChange={e => setData({ ...data, country_code: e.target.value })}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.dial})</option>)}
                </select>
              </div>
            </>
          )}

          {/* ═══ ÉTAPE 2 : FAQ ═══ */}
          {step === 2 && template && (
            <>
              <div className="onboard-eyebrow">Étape 3 sur 4</div>
              <h2 className="onboard-title">Vos questions fréquentes</h2>
              <p className="onboard-lede">
                Nous avons pré-rempli {faqs.length} questions courantes pour votre secteur. Modifiez-les ou ajoutez-en, mais pas obligatoire — vous pourrez le faire après.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {faqs.map((f, i) => (
                  <div key={i} style={{ padding: 12, background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 10 }}>
                    <input
                      value={f.question}
                      onChange={e => setFaqs(prev => prev.map((x, idx) => idx === i ? { ...x, question: e.target.value } : x))}
                      placeholder="Question..."
                      style={{ width: "100%", fontSize: 13, fontWeight: 600, marginBottom: 6, padding: "6px 0", background: "transparent", border: "none" }}
                    />
                    <textarea
                      value={f.answer}
                      onChange={e => setFaqs(prev => prev.map((x, idx) => idx === i ? { ...x, answer: e.target.value } : x))}
                      placeholder="Réponse..."
                      style={{ width: "100%", fontSize: 12, padding: "4px 0", background: "transparent", border: "none", resize: "vertical", minHeight: 40 }}
                    />
                  </div>
                ))}
              </div>

              <button onClick={generateMoreFaqs} disabled={loadingFaqs}
                style={{ marginTop: 14, padding: "9px 16px", fontSize: 12, background: "linear-gradient(135deg, var(--accent), var(--cyan))", color: "#001a12", border: "none", borderRadius: 999, cursor: loadingFaqs ? "wait" : "pointer", fontWeight: 600, fontFamily: "inherit", opacity: loadingFaqs ? 0.6 : 1 }}>
                {loadingFaqs ? "Génération..." : "✨ Suggérer plus de questions"}
              </button>
            </>
          )}

          {/* ═══ ÉTAPE 3 : Confirmation et création ═══ */}
          {step === 3 && template && (
            <>
              <div className="onboard-eyebrow">Étape 4 sur 4</div>
              <h2 className="onboard-title">Tout est prêt !</h2>
              <p className="onboard-lede">
                Cliquez ci-dessous pour créer votre agent. Vous pourrez le tester immédiatement dans le simulateur, et le personnaliser à tout moment.
              </p>

              <div style={{ background: "var(--accent-soft)", border: "1px solid rgba(0,224,157,0.2)", borderRadius: 14, padding: 18, marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in srgb, ${template.color} 20%, transparent)`, color: template.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{template.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{data.name || template.template.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{template.template.sector}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
                  📞 {data.phone || "Téléphone non renseigné"}<br/>
                  📍 {data.address || "Adresse non renseignée"}<br/>
                  ✓ {faqs.filter(f => f.question.trim() && f.answer.trim()).length} questions configurées
                </div>
              </div>

              {error && (
                <div style={{ marginTop: 14, padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>⚠ {error}</div>
              )}
            </>
          )}
        </div>

        <div className="onboard-footer">
          <button className="onboard-skip" onClick={onSkip}>
            Passer l'introduction
          </button>
          <div className="onboard-nav">
            {step > 0 && (
              <button onClick={prev} className="btn btn-secondary">← Retour</button>
            )}
            {step > 0 && step < 3 && (
              <button onClick={next} className="btn btn-primary">Suivant →</button>
            )}
            {step === 3 && (
              <button onClick={finalize} disabled={creating} className="btn btn-primary">
                {creating ? "Création..." : "✓ Créer mon agent"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
