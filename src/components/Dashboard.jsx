import { useEffect, useState } from "react";
import { listAgents, deleteAgent } from "../lib/agents.js";
import { exportAgentCallsToCSV } from "../lib/csv.js";

const sectorIcon = (sector = "") => {
  const s = sector.toLowerCase();
  if (s.includes("restaur") || s.includes("commerce")) return "🥖";
  if (s.includes("sant"))      return "🏥";
  if (s.includes("auto"))      return "🚗";
  if (s.includes("banque"))    return "🏦";
  if (s.includes("télé") || s.includes("tele")) return "📡";
  if (s.includes("immo"))      return "🏠";
  if (s.includes("hôtel") || s.includes("hotel") || s.includes("touris")) return "🏨";
  if (s.includes("beaut"))     return "💇";
  if (s.includes("éducation") || s.includes("education") || s.includes("formation")) return "🎓";
  if (s.includes("artisan") || s.includes("btp")) return "🔨";
  if (s.includes("juridique")) return "⚖️";
  return "🏢";
};

export default function Dashboard({ onCall, onEdit, onNew, refreshKey }) {
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listAgents();
        if (alive) setAgents(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  const remove = async (a) => {
    if (!confirm(`Supprimer l'agent "${a.name}" ? Cette action est definitive.`)) return;
    await deleteAgent(a.id);
    setAgents(prev => prev.filter(x => x.id !== a.id));
  };

  const exportCSV = async (a) => {
    try { await exportAgentCallsToCSV(a); }
    catch (e) { alert("Export echoue : " + e.message); }
  };

  const totalCalls   = agents.reduce((s, a) => s + (a.calls || 0), 0);
  const withSat      = agents.filter(a => a.satisfaction != null);
  const avgSat       = withSat.length ? Math.round(withSat.reduce((s, a) => s + a.satisfaction, 0) / withSat.length) : null;
  const activeCount  = agents.filter(a => a.active).length;

  const STAT_CARD = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
    border: "1px solid var(--line)",
    borderRadius: 14,
    padding: "16px 20px",
  };

  const ROW_CARD = {
    display: "flex", alignItems: "center", gap: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
    border: "1px solid var(--line)",
    borderRadius: 14,
    padding: "12px 16px",
    transition: "all 0.25s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <div style={STAT_CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📞</div>
            <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500 }}>Total appels</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", lineHeight: 1, fontFamily: "var(--mono)" }}>{totalCalls.toLocaleString("fr-FR")}</div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>Sur tous les agents</div>
        </div>
        <div style={STAT_CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>😊</div>
            <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500 }}>Satisfaction</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", lineHeight: 1, fontFamily: "var(--mono)" }}>{avgSat != null ? `${avgSat}%` : "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{avgSat != null ? "Moyenne ponderee" : "Pas encore de retours"}</div>
        </div>
        <div style={STAT_CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500 }}>Agents actifs</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", lineHeight: 1, fontFamily: "var(--mono)" }}>{activeCount}/{agents.length}</div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>Configurations en service</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--text)" }}>Mes agents IA</h3>
        <button onClick={onNew} className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>+ Nouvel agent</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 50, color: "var(--text-dim)", fontSize: 13 }}>Chargement...</div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,0.02)", border: "1px dashed var(--line)", borderRadius: 16 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>👩🏾‍💼</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>Pas encore d'agent</div>
          <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 18px" }}>Cree ton premier agent IA en moins de 2 minutes.</p>
          <button onClick={onNew} className="btn btn-primary">Creer mon premier agent</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {agents.map(a => (
            <div key={a.id} style={ROW_CARD}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: a.active ? "var(--accent-soft)" : "rgba(255,255,255,0.04)", border: a.active ? "1px solid rgba(0,224,157,0.25)" : "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>
                {sectorIcon(a.sector)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                  {a.sector} · {a.phone || "Pas de numero"} {a.calls > 0 && `· ${a.calls} appels`}{a.satisfaction != null && ` · ${a.satisfaction}%`}
                </div>
              </div>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: a.active ? "var(--accent-soft)" : "rgba(255,255,255,0.05)", color: a.active ? "var(--accent)" : "var(--text-faint)", fontWeight: 500, border: a.active ? "1px solid rgba(0,224,157,0.25)" : "1px solid var(--line)" }}>
                {a.active ? "Actif" : "Inactif"}
              </span>
              <button onClick={() => onCall(a)} className="btn btn-primary" style={{ padding: "6px 16px", fontSize: 12 }}>Tester</button>
              <button onClick={() => exportCSV(a)} title="Exporter les transcripts (CSV)"
                style={{ padding: "6px 10px", fontSize: 11, background: "transparent", color: "var(--text-dim)", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                ↓ CSV
              </button>
              <button onClick={() => { const url = `${window.location.origin}/#/p/${a.id}`; navigator.clipboard?.writeText(url).then(() => alert("Lien public copié : " + url)).catch(() => prompt("Copiez ce lien :", url)); }} title="Lien public (à partager / mettre en QR code)"
                style={{ padding: "6px 10px", fontSize: 11, background: "transparent", color: "var(--text-dim)", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                🔗 Public
              </button>
              <button onClick={() => onEdit(a)} title="Editer"
                style={{ padding: "6px 10px", fontSize: 12, background: "transparent", color: "var(--text-dim)", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                ✏️
              </button>
              <button onClick={() => remove(a)} title="Supprimer"
                style={{ padding: "6px 10px", fontSize: 12, background: "transparent", color: "#f87171", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
