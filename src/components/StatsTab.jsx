import { useEffect, useState } from "react";
import { listAgents } from "../lib/agents.js";
import { computeStats, formatDurationFull } from "../lib/stats.js";

// ═══════════════════════════════════════════════════════════════════════════
// StatsTab — Tableau de bord statistiques avec graphiques SVG inline
// ═══════════════════════════════════════════════════════════════════════════

const CARD = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 20,
};

// ─── Mini bar chart SVG ────────────────────────────────────────────────
function BarChart({ data, labels, color = "var(--accent)", height = 140, width = 720 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barWidth = width / data.length;
  const innerHeight = height - 28; // espace pour labels

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const h = max > 0 ? (v / max) * innerHeight : 0;
        const x = i * barWidth + barWidth * 0.15;
        const y = innerHeight - h;
        const w = barWidth * 0.7;
        return (
          <g key={i}>
            <rect
              x={x} y={y}
              width={w} height={h || 1}
              fill="url(#barGrad)"
              rx={Math.min(w / 4, 4)}
              opacity={v > 0 ? 1 : 0.2}
            >
              <title>{labels ? labels[i] : ""}: {v}</title>
            </rect>
            {labels && (i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0) && (
              <text
                x={x + w / 2} y={height - 6}
                fill="var(--text-faint)"
                fontSize="10" textAnchor="middle"
                fontFamily="var(--mono)"
              >
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Gauge (transfer rate) ─────────────────────────────────────────────
function Gauge({ value, max = 100, label, color = "var(--accent)" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto" }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r="38" stroke="var(--line)" strokeWidth="8" fill="none" />
        <circle
          cx="50" cy="50" r="38"
          stroke={color}
          strokeWidth="8" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "var(--mono)" }}>{value}%</div>
        {label && <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>}
      </div>
    </div>
  );
}

// ─── Kpi card ──────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = "var(--accent)" }) {
  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `color-mix(in srgb, ${color} 15%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", lineHeight: 1, fontFamily: "var(--mono)" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const agents = await listAgents();
        const s = await computeStats(agents);
        if (alive) setStats(s);
      } catch (e) {
        console.error("Stats:", e);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>Calcul des statistiques...</div>;
  if (!stats || stats.total === 0) return (
    <div style={{ ...CARD, textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Aucune donnée pour le moment</div>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 6 }}>Les statistiques apparaîtront après vos premiers appels.</p>
    </div>
  );

  // Labels jour : "J-29", "J-22", ... "J-0"
  const dayLabels = Array.from({ length: 30 }, (_, i) => i === 29 ? "Auj." : `J-${29 - i}`);
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard icon="📞" label="Total appels"   value={stats.total.toLocaleString("fr-FR")} sub="30 derniers jours" />
        <KpiCard icon="⏱"  label="Durée moyenne" value={formatDurationFull(stats.avgDuration)} sub="Par appel" color="var(--cyan)" />
        <KpiCard icon="↗"  label="Taux transfert" value={`${stats.transferRate}%`} sub={`${stats.transferred} appels transférés`} color="var(--warn)" />
        <KpiCard icon="✓"  label="Auto-résolus"   value={`${100 - stats.transferRate}%`} sub="Sans intervention humaine" color="var(--accent)" />
      </div>

      {/* Graphique : appels par jour */}
      <div style={CARD}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Volume d'appels — 30 derniers jours</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Tendance quotidienne</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-faint)" }}>
            <span>Max : <strong style={{ color: "var(--accent)" }}>{Math.max(...stats.byDay)}</strong>/jour</span>
            <span>Moy : <strong style={{ color: "var(--accent)" }}>{Math.round(stats.byDay.reduce((s, v) => s + v, 0) / 30)}</strong>/jour</span>
          </div>
        </div>
        <BarChart data={stats.byDay} labels={dayLabels} />
      </div>

      {/* Graphique : appels par heure */}
      <div style={CARD}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Heures de pointe</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Répartition sur 24h</div>
          </div>
        </div>
        <BarChart data={stats.byHour} labels={hourLabels} />
      </div>

      {/* Top questions + Performance par agent */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div style={CARD}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Top 5 — Questions les plus fréquentes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.topQuestions.map((q, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, color: "var(--text)", flex: 1, marginRight: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>
                    {q.question}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--mono)", flexShrink: 0 }}>
                    {q.count} <span style={{ color: "var(--text-faint)" }}>({q.pct}%)</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${q.pct}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--cyan))",
                    borderRadius: 3,
                    boxShadow: "0 0 8px var(--accent-glow)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Performance globale</div>
          <Gauge value={100 - stats.transferRate} label="Résolution IA" color="var(--accent)" />
          <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.5 }}>
            L'IA répond seule à <strong style={{ color: "var(--accent)" }}>{100 - stats.transferRate}%</strong> des appels.<br/>
            Estimation économies : <strong style={{ color: "var(--text)" }}>{Math.round(stats.total * (100 - stats.transferRate) / 100 * 3.5)} €/mois</strong> en temps employé.
          </div>
        </div>
      </div>

      {/* Performance par agent */}
      {stats.perAgent.length > 1 && (
        <div style={CARD}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Performance par agent</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.perAgent.map(a => (
              <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 2fr", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{a.calls} appels</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{formatDurationFull(a.avg_duration)}</div>
                <div style={{ height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(a.calls / stats.perAgent[0].calls) * 100}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--violet))",
                    borderRadius: 3,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
