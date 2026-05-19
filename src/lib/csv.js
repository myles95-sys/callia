// Helper export CSV des transcripts d'appels
import { listRecentCalls } from "./agents.js";

function csvEscape(val) {
  if (val == null) return "";
  const s = String(val);
  if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function formatTranscript(transcript) {
  if (!Array.isArray(transcript)) return "";
  return transcript.map(m => {
    const author = m.role === "user" ? "Client" : (m.role === "system" ? "Système" : "Callia");
    return `[${m.ts || ""}] ${author}: ${m.content}`;
  }).join(" | ");
}

function formatDuration(sec) {
  if (!sec) return "";
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + "m" + String(s).padStart(2, "0") + "s";
}

export async function exportAgentCallsToCSV(agent, limit = 500) {
  const calls = await listRecentCalls(agent.id, limit);
  if (!calls || calls.length === 0) {
    alert("Aucun appel à exporter pour cet agent.");
    return;
  }

  const headers = [
    "Date", "Heure", "Source", "Durée", "Nb messages",
    "Numéro appelant", "Satisfaction", "Transcript complet"
  ];

  const rows = calls.map(c => {
    const d = new Date(c.created_at);
    const messages = Array.isArray(c.transcript) ? c.transcript : [];
    return [
      d.toLocaleDateString("fr-FR"),
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      c.source || "simulator",
      formatDuration(c.duration_sec),
      messages.filter(m => m.role !== "system").length,
      c.caller_id || "",
      c.satisfaction != null ? c.satisfaction + "/5" : "",
      formatTranscript(messages),
    ];
  });

  const csv = [headers, ...rows]
    .map(r => r.map(csvEscape).join(","))
    .join("\n");

  // BOM UTF-8 pour qu'Excel lise correctement les accents
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (agent.name || "agent").replace(/[^a-zA-Z0-9-_]/g, "_");
  a.href = url;
  a.download = `appels_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
