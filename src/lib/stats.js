// Calcul de statistiques sur les appels d'un agent.
// Travaille avec les données Supabase OU avec des données synthétiques en mode démo.
import { listRecentCalls } from "./agents.js";
import { HAS_SUPABASE } from "./supabase.js";

// ─── Génération données synthétiques pour la démo ───────────────────────
function syntheticCalls(agent) {
  const total = agent.calls || 50;
  const seed = (agent.id || "x").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const rng = (i) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };
  const calls = [];
  const now = Date.now();
  for (let i = 0; i < total; i++) {
    const daysAgo = Math.floor(rng(i) * 30);
    const hour = Math.floor(rng(i + 100) * 12) + 8; // 8h-20h
    const date = new Date(now - daysAgo * 86400000);
    date.setHours(hour, Math.floor(rng(i + 200) * 60));
    const duration = Math.floor(40 + rng(i + 300) * 180); // 40-220s
    const transferred = rng(i + 400) < 0.08; // 8% transferts
    // Question simulée tirée des FAQ
    const faqs = agent.faqs || [];
    const faqIdx = faqs.length > 0 ? Math.floor(rng(i + 500) * faqs.length) : 0;
    const question = faqs[faqIdx]?.question || "Question diverse";
    calls.push({
      id: "synth-" + i,
      agent_id: agent.id,
      created_at: date.toISOString(),
      duration_sec: duration,
      source: "simulator",
      transcript: [{ role: "user", content: question }],
      _synthetic: true,
      _transferred: transferred,
      _question: question,
    });
  }
  return calls;
}

// ─── Stats globales ───────────────────────────────────────────────────
export async function computeStats(agents) {
  let allCalls = [];

  for (const agent of agents) {
    let calls;
    if (HAS_SUPABASE) {
      try { calls = await listRecentCalls(agent.id, 500); }
      catch { calls = []; }
      // Si pas de vraies données, on génère du synthétique pour la démo
      if (!calls || calls.length === 0) calls = syntheticCalls(agent);
    } else {
      calls = syntheticCalls(agent);
    }
    calls.forEach(c => { c._agent_name = agent.name; c._agent_faqs = agent.faqs || []; });
    allCalls = allCalls.concat(calls);
  }

  const total          = allCalls.length;
  const totalDuration  = allCalls.reduce((s, c) => s + (c.duration_sec || 0), 0);
  const avgDuration    = total ? Math.round(totalDuration / total) : 0;
  const transferred    = allCalls.filter(c => c._transferred || isTransferredTranscript(c.transcript)).length;
  const transferRate   = total ? Math.round((transferred / total) * 100) : 0;

  // ─── Répartition par jour (30 derniers jours) ───
  const byDay = new Array(30).fill(0);
  const now = Date.now();
  for (const c of allCalls) {
    const daysAgo = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < 30) byDay[29 - daysAgo]++;
  }

  // ─── Répartition par heure (0-23) ───
  const byHour = new Array(24).fill(0);
  for (const c of allCalls) {
    const h = new Date(c.created_at).getHours();
    byHour[h]++;
  }

  // ─── Top questions par fréquence ───
  const questionCounts = {};
  for (const c of allCalls) {
    const q = c._question || extractFirstUserQuestion(c.transcript) || "Question diverse";
    questionCounts[q] = (questionCounts[q] || 0) + 1;
  }
  const topQuestions = Object.entries(questionCounts)
    .map(([question, count]) => ({ question, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ─── Performance par agent ───
  const perAgent = agents.map(a => {
    const aCalls = allCalls.filter(c => c.agent_id === a.id);
    return {
      id: a.id,
      name: a.name,
      calls: aCalls.length,
      avg_duration: aCalls.length ? Math.round(aCalls.reduce((s, c) => s + (c.duration_sec || 0), 0) / aCalls.length) : 0,
    };
  }).sort((a, b) => b.calls - a.calls);

  return {
    total,
    avgDuration,
    transferRate,
    transferred,
    byDay,
    byHour,
    topQuestions,
    perAgent,
    allCalls,
  };
}

function isTransferredTranscript(transcript) {
  if (!Array.isArray(transcript)) return false;
  return transcript.some(m =>
    typeof m.content === "string" &&
    /transf[eé]r|conseiller|humain/i.test(m.content) &&
    m.role !== "user"
  );
}

function extractFirstUserQuestion(transcript) {
  if (!Array.isArray(transcript)) return null;
  const userMsg = transcript.find(m => m.role === "user");
  return userMsg?.content?.slice(0, 60) || null;
}

export function formatDurationFull(sec) {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m${String(s).padStart(2, "0")}` : `${s}s`;
}
