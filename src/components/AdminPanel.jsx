import { useEffect, useState } from "react";
import { listAgents } from "../lib/agents.js";
import { HAS_SUPABASE } from "../lib/supabase.js";

// ═══════════════════════════════════════════════════════════════════════════
// AdminPanel — Vue propriétaire SaaS : tenants, KPI globaux, modération
// Visible uniquement si email = ADMIN_EMAIL (configurable via VITE_ADMIN_EMAIL)
// En mode démo : utilise des données synthétiques pour montrer ce que ça donne
// ═══════════════════════════════════════════════════════════════════════════

const CARD = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 18,
};

// ─── Données synthétiques pour la démo admin ─────────────────────────────
function syntheticTenants() {
  const now = Date.now();
  const sectors = ["Restauration", "Santé", "Auto", "Beauté", "Immobilier", "BTP", "Juridique", "Hôtellerie"];
  const plans = ["Starter", "Pro", "Pro", "Pro", "Enterprise"];
  const cities = ["Lyon", "Paris", "Bordeaux", "Bruxelles", "Genève", "Abidjan", "Dakar", "Casablanca", "Marseille", "Toulouse", "Nantes", "Strasbourg"];
  const names = [
    "Boulangerie Au Pain Béni", "Cabinet Dr Lemoine", "Garage Modulauto",
    "Salon Coiffure Esprit", "Agence Immo Côté Sud", "Hôtel Le Belvédère",
    "Maître Dubois Avocat", "Restaurant Chez Lucette", "Coiffure Studio",
    "Cabinet Vétérinaire Pattes", "Pizzeria Bella", "Plomberie Express",
    "Pharmacie du Centre", "Auto-école Lib", "Crèche Les Petits Loups",
    "Optique Vision+", "Fleuriste Pétales", "Toiletteur Choubidou",
    "Studio Yoga Zenitude", "Brasserie Le Lion",
  ];

  return names.map((name, i) => {
    const seed = Math.sin(i * 7.3) * 10000;
    const rnd = (k) => { const x = Math.sin(seed + k) * 10000; return x - Math.floor(x); };
    return {
      id: "tenant-" + i,
      name,
      email: name.toLowerCase().replace(/[^a-z0-9]/g, ".") + "@email.com",
      sector: sectors[Math.floor(rnd(1) * sectors.length)],
      city: cities[Math.floor(rnd(2) * cities.length)],
      plan: plans[Math.floor(rnd(3) * plans.length)],
      agents: 1 + Math.floor(rnd(4) * 3),
      monthly_calls: 30 + Math.floor(rnd(5) * 500),
      mrr: [29, 79, 79, 79, 199][Math.floor(rnd(3) * plans.length)],
      created_at: new Date(now - Math.floor(rnd(6) * 90) * 86400000).toISOString(),
      last_active: new Date(now - Math.floor(rnd(7) * 7) * 86400000).toISOString(),
      status: rnd(8) > 0.95 ? "suspended" : "active",
    };
  });
}

function fmtDate(s) {
  const d = new Date(s);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function fmtRelative(s) {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return diff + "j";
  if (diff < 30) return Math.floor(diff / 7) + "sem";
  return Math.floor(diff / 30) + "mois";
}

export default function AdminPanel() {
  const [tenants, setTenants] = useState([]);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // En mode démo, on génère des tenants synthétiques pour montrer ce que ça donnera
      const data = syntheticTenants();
      // On ajoute aussi les agents réels existants comme "mon tenant"
      if (!HAS_SUPABASE) {
        try {
          const myAgents = await listAgents();
          if (myAgents.length > 0) {
            data.unshift({
              id: "tenant-self",
              name: "Mon compte (démo)",
              email: "vous@callia.com",
              sector: myAgents[0]?.sector || "Mixte",
              city: "—",
              plan: "Pro",
              agents: myAgents.length,
              monthly_calls: myAgents.reduce((s, a) => s + (a.calls || 0), 0),
              mrr: 79,
              created_at: new Date().toISOString(),
              last_active: new Date().toISOString(),
              status: "active",
              isSelf: true,
            });
          }
        } catch { /* ignore */ }
      }
      setTenants(data);
      setLoading(false);
    })();
  }, []);

  const filtered = tenants
    .filter(t => filter === "all" || t.status === filter)
    .filter(t => !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

  const totalTenants     = tenants.length;
  const activeTenants    = tenants.filter(t => t.status === "active").length;
  const totalAgents      = tenants.reduce((s, t) => s + t.agents, 0);
  const totalCalls       = tenants.reduce((s, t) => s + t.monthly_calls, 0);
  const totalMrr         = tenants.filter(t => t.status === "active").reduce((s, t) => s + t.mrr, 0);
  const totalArr         = totalMrr * 12;

  // Activité récente : derniers 5 signups + derniers 5 actifs
  const recentSignups = [...tenants].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const recentActive  = [...tenants].sort((a, b) => new Date(b.last_active) - new Date(a.last_active)).slice(0, 5);

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "var(--text-dim)" }}>Chargement...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text)" }}>Console admin</h3>
          <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "4px 0 0" }}>
            Vue d'ensemble de tous les comptes Callia · Données démo en mode local
          </p>
        </div>
        <span style={{ padding: "5px 12px", borderRadius: 999, background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.25)", color: "var(--warn)", fontSize: 11, fontWeight: 600 }}>
          🛡 Owner access
        </span>
      </div>

      {/* ─── KPI ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        <Kpi icon="🏢" label="Comptes" value={totalTenants} sub={activeTenants + " actifs"} />
        <Kpi icon="🤖" label="Agents IA" value={totalAgents} sub="déployés" color="var(--cyan)" />
        <Kpi icon="📞" label="Appels/mois" value={totalCalls.toLocaleString("fr-FR")} sub="trafic cumulé" color="var(--violet)" />
        <Kpi icon="💶" label="MRR" value={totalMrr.toLocaleString("fr-FR") + " €"} sub="Récurrent mensuel" color="var(--accent)" />
        <Kpi icon="📈" label="ARR" value={(totalArr / 1000).toFixed(0) + "k €"} sub="Projection annuelle" color="var(--accent)" />
      </div>

      {/* ─── Activité récente : 2 colonnes ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>🆕 Nouveaux comptes</span>
            <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>30 derniers jours</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentSignups.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.025)", borderRadius: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.sector} · {t.city}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--mono)", flexShrink: 0 }}>{fmtDate(t.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>⚡ Activité récente</span>
            <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>Connexions/appels</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentActive.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.025)", borderRadius: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.monthly_calls} appels · plan {t.plan}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--mono)", flexShrink: 0 }}>{fmtRelative(t.last_active)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Filtres + recherche ─── */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un compte par nom ou email..."
          style={{ flex: 1, padding: "10px 14px", fontSize: 13, borderRadius: 10, fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 10 }}>
          {[
            { id: "all", label: "Tous" },
            { id: "active", label: "Actifs" },
            { id: "suspended", label: "Suspendus" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: "6px 14px", fontSize: 12, fontWeight: 500, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
                background: filter === f.id ? "var(--accent)" : "transparent",
                color: filter === f.id ? "#001a12" : "var(--text-dim)" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Liste des tenants ─── */}
      <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", padding: "12px 18px", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          <div>Compte</div>
          <div>Plan</div>
          <div>Agents</div>
          <div>Appels/mois</div>
          <div>MRR</div>
          <div style={{ width: 100, textAlign: "right" }}>Actions</div>
        </div>
        {filtered.map(t => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", padding: "12px 18px", borderBottom: "1px solid var(--line)", alignItems: "center", fontSize: 13, background: t.isSelf ? "var(--accent-soft)" : "transparent" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.name} {t.isSelf && <span style={{ fontSize: 10, color: "var(--accent)", marginLeft: 6, fontWeight: 700 }}>(vous)</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.email}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: t.plan === "Enterprise" ? "rgba(168,85,247,0.15)" : t.plan === "Pro" ? "var(--accent-soft)" : "rgba(255,255,255,0.05)", color: t.plan === "Enterprise" ? "var(--violet)" : t.plan === "Pro" ? "var(--accent)" : "var(--text-dim)", fontWeight: 600 }}>
                {t.plan}
              </span>
            </div>
            <div style={{ color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{t.agents}</div>
            <div style={{ color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{t.monthly_calls.toLocaleString("fr-FR")}</div>
            <div style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontWeight: 600 }}>{t.mrr} €</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedTenant(t)} title="Voir détails"
                style={{ padding: "5px 10px", fontSize: 11, background: "transparent", color: "var(--text-dim)", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>👁</button>
              <button title="Suspendre"
                style={{ padding: "5px 10px", fontSize: 11, background: "transparent", color: t.status === "suspended" ? "var(--warn)" : "var(--text-dim)", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                {t.status === "suspended" ? "⏸" : "⊘"}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
            Aucun compte trouvé pour ces filtres.
          </div>
        )}
      </div>

      {/* ─── Modal détail tenant ─── */}
      {selectedTenant && (
        <div onClick={() => setSelectedTenant(null)} style={{ position: "fixed", inset: 0, background: "rgba(2,5,10,0.85)", backdropFilter: "blur(16px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, padding: 28, background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", border: "1px solid var(--line-strong)", borderRadius: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Détails du compte</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 }}>{selectedTenant.name}</h3>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>{selectedTenant.email}</div>
              </div>
              <button onClick={() => setSelectedTenant(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", color: "var(--text-dim)", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Plan" value={selectedTenant.plan} />
              <Field label="Statut" value={selectedTenant.status} />
              <Field label="Secteur" value={selectedTenant.sector} />
              <Field label="Ville" value={selectedTenant.city} />
              <Field label="Agents IA" value={selectedTenant.agents} />
              <Field label="Appels/mois" value={selectedTenant.monthly_calls.toLocaleString("fr-FR")} />
              <Field label="Inscription" value={fmtDate(selectedTenant.created_at)} />
              <Field label="Dernière activité" value={fmtRelative(selectedTenant.last_active)} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary">📧 Contacter</button>
              <button className="btn btn-secondary" style={{ color: "var(--warn)", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                ⊘ Suspendre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, sub, color = "var(--accent)" }) {
  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `color-mix(in srgb, ${color} 15%, transparent)`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
        <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1, fontFamily: "var(--mono)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ padding: 12, background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 10 }}>
      <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
