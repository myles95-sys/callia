import { useEffect, useState } from "react";
import { listAgents } from "../lib/agents.js";
import PhoneSimulator from "./PhoneSimulator.jsx";
import "../styles/landing.css";

// ═══════════════════════════════════════════════════════════════════════════
// PublicAgentPage — Page publique d'un agent (accessible via #/p/<id>)
// Idéale pour partage QR code en boutique
// ═══════════════════════════════════════════════════════════════════════════

const sectorIcon = (sector = "") => {
  const s = sector.toLowerCase();
  if (s.includes("restaur") || s.includes("commerce")) return "🥖";
  if (s.includes("sant"))      return "🏥";
  if (s.includes("auto"))      return "🚗";
  if (s.includes("banque"))    return "🏦";
  if (s.includes("immo"))      return "🏠";
  if (s.includes("hôtel") || s.includes("hotel") || s.includes("touris")) return "🏨";
  if (s.includes("beaut"))     return "💇";
  if (s.includes("éducation") || s.includes("education")) return "🎓";
  if (s.includes("artisan") || s.includes("btp")) return "🔨";
  if (s.includes("juridique")) return "⚖️";
  return "🏢";
};

export default function PublicAgentPage({ agentId, onExit }) {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simOpen, setSimOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const agents = await listAgents();
        const found = agents.find(a => a.id === agentId) || agents[0];
        setAgent(found);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [agentId]);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=001a12&margin=8`;

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "var(--text-dim)" }}>Chargement...</div>;
  if (!agent) return (
    <div className="public-agent-wrap landing-root">
      <div className="bg-grid" /><div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <div className="public-agent-card">
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Agent introuvable</div>
        <button onClick={onExit} className="btn btn-secondary" style={{ marginTop: 20 }}>← Retour à l'accueil</button>
      </div>
    </div>
  );

  return (
    <div className="public-agent-wrap landing-root">
      <div className="bg-grid" />
      <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>
      <div className="bg-noise" />

      <div style={{ position: "absolute", top: 20, left: 24, zIndex: 5 }}>
        <button onClick={onExit} style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--text-dim)", padding: "6px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          ← Callia
        </button>
      </div>

      <div className="public-agent-card">
        <div className="public-agent-icon">{sectorIcon(agent.sector)}</div>
        <div className="public-agent-name">{agent.name}</div>
        <div className="public-agent-sector">{agent.sector}</div>
        {agent.description && (
          <div className="public-agent-desc">{agent.description}</div>
        )}

        <div className="public-agent-grid">
          {agent.phone && (
            <div className="public-agent-grid-item">
              <div className="public-agent-grid-label">📞 Téléphone</div>
              <div className="public-agent-grid-value">{agent.phone}</div>
            </div>
          )}
          {agent.hours && (
            <div className="public-agent-grid-item">
              <div className="public-agent-grid-label">🕒 Horaires</div>
              <div className="public-agent-grid-value">{agent.hours}</div>
            </div>
          )}
          {agent.address && (
            <div className="public-agent-grid-item" style={{ gridColumn: agent.phone && agent.hours ? "1 / -1" : undefined }}>
              <div className="public-agent-grid-label">📍 Adresse</div>
              <div className="public-agent-grid-value">{agent.address}</div>
            </div>
          )}
          {agent.calendly_url && (
            <div className="public-agent-grid-item" style={{ gridColumn: "1 / -1" }}>
              <div className="public-agent-grid-label">📅 Prendre rendez-vous</div>
              <div className="public-agent-grid-value">
                <a href={agent.calendly_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                  {agent.calendly_url}
                </a>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setSimOpen(true)} className="btn btn-primary public-agent-cta">
          📞 Parler à {agent.agent_name || "Callia"} maintenant
        </button>

        <div className="public-agent-qr">
          <img src={qrUrl} alt="QR code de cette page" className="public-agent-qr-img" />
          <div className="public-agent-qr-label">
            Scannez pour rouvrir cette page · imprimez ce QR code pour vos clients
          </div>
        </div>
      </div>

      {simOpen && <PhoneSimulator agent={agent} onClose={() => setSimOpen(false)} persistCalls={false} />}
    </div>
  );
}
