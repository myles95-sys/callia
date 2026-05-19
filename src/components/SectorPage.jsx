import { useEffect, useState } from "react";
import { SECTOR_PAGES, SECTOR_KEYS } from "../lib/sectorPages.js";
import PhoneSimulator from "./PhoneSimulator.jsx";
import LiveSocialProof from "./LiveSocialProof.jsx";
import "../styles/landing.css";

// ═══════════════════════════════════════════════════════════════════════════
// SectorPage — Landing dédiée par secteur (#/sector/<key>)
// Hero custom + témoignage ciblé + ROI préconfiguré + FAQ secteur
// ═══════════════════════════════════════════════════════════════════════════

function buildDemoAgent(sectorKey, page) {
  return {
    id: "sector-demo-" + sectorKey,
    name: page.testimonial.role.split("·")[0].trim(),
    sector: page.name,
    description: page.hero.sub,
    services: "Services adaptés à votre secteur",
    hours: "Lun-Sam 9h-19h",
    address: page.testimonial.role.split("·")[1]?.trim() || "France",
    phone: "+33 X XX XX XX XX",
    language: "fr-FR",
    agent_name: "Callia",
    tone: "chaleureux",
    calendly_url: "",
    escalation_phone: "",
    faqs: page.faqs.map(f => ({ question: f.q, answer: f.a })),
  };
}

export default function SectorPage({ sectorKey, onExit, onCTA }) {
  const page = SECTOR_PAGES[sectorKey];
  const [simOpen, setSimOpen] = useState(false);
  const [callsPerDay, setCallsPerDay] = useState(page?.roi?.callsPerDay || 20);
  const [avgValue, setAvgValue] = useState(page?.roi?.avgValue || 50);
  const [faqOpen, setFaqOpen] = useState(0);

  useEffect(() => {
    document.title = page ? `Callia — ${page.name}` : "Callia";
  }, [page]);

  if (!page) {
    return (
      <div className="landing-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="bg-grid" />
        <div style={{ textAlign: "center", zIndex: 2 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>Secteur introuvable</h2>
          <p style={{ color: "var(--text-dim)", marginTop: 8, marginBottom: 20 }}>
            Disponibles : {SECTOR_KEYS.join(" · ")}
          </p>
          <button onClick={onExit} className="btn btn-primary">← Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  const demoAgent = buildDemoAgent(sectorKey, page);

  // ROI calc
  const annualCalls   = callsPerDay * 30 * 12;
  const recovered     = Math.round(annualCalls * 0.30);
  const revenueGain   = recovered * avgValue;
  const monthSaving   = 2200 - (page.pricing_reco === "Starter" ? 29 : 79);
  const yearSaving    = monthSaving * 12 + revenueGain;

  return (
    <div className="landing-root">
      <div className="bg-grid" />
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="bg-noise" />

      {/* Nav */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <button onClick={onExit} className="land-logo" style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", padding: 0 }}>
            <div className="land-logo-mark" style={{ background: `linear-gradient(135deg, ${page.color}, var(--cyan))` }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="9" x2="4" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="8" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="9" x2="20" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            Callia
          </button>
          <div className="land-nav-links">
            <button onClick={onExit} style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>← Vue d'ensemble</button>
          </div>
          <button className="btn btn-primary" onClick={onCTA} style={{ background: `linear-gradient(135deg, ${page.color}, var(--cyan))`, color: "#001a12" }}>
            Commencer →
          </button>
        </div>
      </nav>

      <div className="landing-content">

        {/* HERO sector */}
        <section className="section sector-hero">
          <div className="sector-hero-icon" style={{ background: `color-mix(in srgb, ${page.color} 18%, transparent)`, color: page.color, borderColor: page.color }}>
            <span>{page.icon}</span>
          </div>
          <div className="sector-hero-eyebrow" style={{ color: page.color }}>{page.hero.eyebrow}</div>
          <h1 className="sector-hero-title">{page.hero.title}</h1>
          <p className="sector-hero-sub">{page.hero.sub}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={onCTA} style={{ fontSize: 15, padding: "14px 28px", background: `linear-gradient(135deg, ${page.color}, var(--cyan))`, color: "#001a12" }}>
              {page.cta} →
            </button>
            <button className="btn btn-secondary" onClick={() => setSimOpen(true)} style={{ fontSize: 15, padding: "14px 28px" }}>
              ▶ Tester sur ce secteur
            </button>
          </div>
        </section>

        {/* Testimonial */}
        <section className="section" style={{ maxWidth: 880, padding: "40px 32px" }}>
          <div className="sector-testimonial" style={{ borderColor: `color-mix(in srgb, ${page.color} 30%, transparent)` }}>
            <div className="sector-testimonial-metric" style={{ background: `color-mix(in srgb, ${page.color} 18%, transparent)`, color: page.color, borderColor: `color-mix(in srgb, ${page.color} 35%, transparent)` }}>
              {page.testimonial.metric}
            </div>
            <div className="sector-testimonial-quote">« {page.testimonial.quote} »</div>
            <div className="sector-testimonial-author">
              <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${page.testimonial.seed}&backgroundColor=00e09d,06b6d4,a855f7&radius=50`} alt={page.testimonial.name} style={{ width: 52, height: 52, borderRadius: "50%" }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{page.testimonial.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{page.testimonial.role}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI précalibré */}
        <section className="section">
          <div className="reveal" style={{ textAlign: "center", marginBottom: 30 }}>
            <div className="section-eyebrow" style={{ justifyContent: "center", color: page.color }}>
              <span style={{ background: page.color, display: "inline-block", width: 24, height: 1 }} />
              Calculé pour votre secteur
            </div>
            <h2 className="section-title" style={{ margin: "0 auto 14px" }}>Votre économie estimée</h2>
            <p style={{ fontSize: 14, color: "var(--text-dim)", maxWidth: 600, margin: "0 auto" }}>{page.roi.context}</p>
          </div>

          <div className="roi-card reveal" style={{ maxWidth: 980, margin: "0 auto" }}>
            <div className="roi-inputs">
              <div className="roi-slider-row">
                <label>Appels reçus par jour</label>
                <div className="roi-slider-value" style={{ color: page.color }}>{callsPerDay}</div>
              </div>
              <input type="range" min="1" max="100" step="1" value={callsPerDay} onChange={e => setCallsPerDay(Number(e.target.value))} className="roi-slider" />
              <div className="roi-slider-row" style={{ marginTop: 18 }}>
                <label>Valeur moyenne client</label>
                <div className="roi-slider-value" style={{ color: page.color }}>{avgValue} €</div>
              </div>
              <input type="range" min="5" max="500" step="5" value={avgValue} onChange={e => setAvgValue(Number(e.target.value))} className="roi-slider" />
            </div>
            <div className="roi-results">
              <div className="roi-big">
                <div className="roi-big-label">Économies annuelles avec Callia</div>
                <div className="roi-big-value" style={{ background: `linear-gradient(135deg, ${page.color}, var(--cyan))`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  {yearSaving.toLocaleString("fr-FR")} €<span style={{ fontSize: "1.4rem", color: "var(--text-dim)", fontWeight: 500 }}>/an</span>
                </div>
              </div>
              <div className="roi-mini-grid">
                <div className="roi-mini">
                  <div className="roi-mini-label">Plan reco</div>
                  <div className="roi-mini-value" style={{ color: page.color }}>Callia {page.pricing_reco}</div>
                </div>
                <div className="roi-mini">
                  <div className="roi-mini-label">CA récupéré/an</div>
                  <div className="roi-mini-value">{revenueGain.toLocaleString("fr-FR")} €</div>
                </div>
                <div className="roi-mini">
                  <div className="roi-mini-label">Appels rattrapés</div>
                  <div className="roi-mini-value">{recovered.toLocaleString("fr-FR")}</div>
                </div>
                <div className="roi-mini">
                  <div className="roi-mini-label">ROI</div>
                  <div className="roi-mini-value">{"< 1 mois"}</div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={onCTA} style={{ width: "100%", marginTop: 18, background: `linear-gradient(135deg, ${page.color}, var(--cyan))`, color: "#001a12" }}>
                {page.cta} →
              </button>
            </div>
          </div>
        </section>

        {/* FAQ secteur */}
        <section className="section" style={{ maxWidth: 880 }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 30 }}>
            <div className="section-eyebrow" style={{ justifyContent: "center", color: page.color }}>FAQ {page.icon}</div>
            <h2 className="section-title" style={{ margin: "0 auto 14px" }}>Vraies questions, vraies réponses.</h2>
            <p style={{ fontSize: 14, color: "var(--text-dim)" }}>Spécifiquement pour {page.name.toLowerCase()}.</p>
          </div>

          <div className="faq-list">
            {page.faqs.map((f, i) => (
              <div key={i} className={"faq-item" + (faqOpen === i ? " open" : "")} style={faqOpen === i ? { borderColor: `color-mix(in srgb, ${page.color} 30%, transparent)`, background: `color-mix(in srgb, ${page.color} 6%, transparent)` } : {}}>
                <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                  {f.q}
                  <span className="chevron" style={{ color: page.color }}>⌄</span>
                </button>
                {faqOpen === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="section">
          <div className="final-cta reveal" style={{ background: `radial-gradient(circle at 30% 0%, color-mix(in srgb, ${page.color} 15%, transparent), transparent 50%), radial-gradient(circle at 70% 100%, rgba(168, 85, 247, 0.15), transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))` }}>
            <h2>Prêt pour votre {page.name.toLowerCase().split(" ")[0]} ?</h2>
            <p>Setup en 5 minutes. Gratuit pendant 30 jours. Sans carte bancaire.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={onCTA} style={{ fontSize: 16, padding: "16px 32px", background: `linear-gradient(135deg, ${page.color}, var(--cyan))`, color: "#001a12" }}>
                {page.cta} →
              </button>
              <button className="btn btn-secondary" onClick={onExit} style={{ fontSize: 16, padding: "16px 32px" }}>
                Voir tous les secteurs
              </button>
            </div>
          </div>
        </section>

        <footer className="land-footer">
          <div className="land-footer-inner">
            <div>© 2026 Callia · Propulsé par Claude (Anthropic)</div>
            <div style={{ display: "flex", gap: 18 }}>
              <button onClick={onExit} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>← Vue d'ensemble</button>
            </div>
          </div>
        </footer>
      </div>

      {!simOpen && <LiveSocialProof />}
      {simOpen && <PhoneSimulator agent={demoAgent} onClose={() => setSimOpen(false)} persistCalls={false} />}
    </div>
  );
}
