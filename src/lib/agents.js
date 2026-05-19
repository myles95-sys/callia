// CRUD sur les agents + FAQs + appels.
// Fonctionne avec Supabase si configure, sinon fallback en memoire (mode demo).
import { supabase, HAS_SUPABASE } from "./supabase.js";

// ─── Donnees de demo (mode sans Supabase) ─────────────────────────────────
const DEMO_AGENTS = [
  {
    id: "demo-1", name: "Boulangerie Le Croissant Dore", sector: "Restauration & commerce",
    description: "Boulangerie artisanale au coeur de Lyon, pains au levain et patisseries faites maison.",
    services: "Pains traditionnels, viennoiseries, patisseries, sandwichs et plateaux pour evenements.",
    hours: "Mar-Sam 6h30-19h30, Dim 7h-13h", address: "12 rue Merciere, 69002 Lyon",
    phone: "+33 4 78 12 34 56", country_code: "FR", language: "fr-FR",
    agent_name: "Callia", tone: "chaleureux", active: true, calls: 47, satisfaction: 96,
    calendly_url: "https://calendly.com/boulangerie-demo/commande",
    escalation_phone: "+33 6 12 34 56 78",
    faqs: [
      { question: "Faites-vous des commandes pour evenements ?", answer: "Oui, plateaux sales et sucres sur commande avec 48h de preavis minimum. A partir de 12 personnes." },
      { question: "Avez-vous des pains sans gluten ?", answer: "Nous proposons un pain de sarrasin sans gluten les mercredis et samedis, sur reservation la veille." },
      { question: "Acceptez-vous les tickets restaurant ?", answer: "Oui, nous acceptons les tickets restaurant papier et les cartes Swile, Edenred et Up." },
    ],
  },
  {
    id: "demo-2", name: "Cabinet Dentaire Dr Mboma", sector: "Sante",
    description: "Cabinet dentaire familial a Abidjan, soins generaux et orthodontie.",
    services: "Consultations, detartrage, plombages, protheses, orthodontie adulte et enfant, urgences.",
    hours: "Lun-Ven 8h-18h, Sam 8h-12h", address: "Cocody Riviera, Abidjan",
    phone: "+225 27 22 44 55 66", country_code: "CI", language: "fr-FR",
    agent_name: "Callia", tone: "formel", active: true, calls: 124, satisfaction: 91,
    calendly_url: "https://calendly.com/cabinet-mboma/consultation",
    escalation_phone: "+225 07 11 22 33 44",
    faqs: [
      { question: "Comment prendre rendez-vous ?", answer: "Par telephone aux horaires d'ouverture. Delai habituel : 3 a 7 jours pour une consultation, urgences traitees le jour meme." },
      { question: "Quels sont vos tarifs ?", answer: "Consultation 15 000 FCFA, detartrage 25 000 FCFA. Les protheses et l'orthodontie font l'objet d'un devis personnalise." },
      { question: "Acceptez-vous la CNAM ?", answer: "Oui, nous sommes conventionnes CNAM. Apportez votre carte lors du rendez-vous pour la prise en charge partielle." },
    ],
  },
  {
    id: "demo-3", name: "Garage Auto Express", sector: "Services automobiles",
    description: "Garage multimarques a Bruxelles, entretien, reparation et controle technique.",
    services: "Vidange, freins, embrayage, pneus, diagnostic electronique, pre-controle technique, depannage.",
    hours: "Lun-Ven 8h-18h, Sam 9h-13h", address: "Chaussee de Waterloo 234, 1060 Bruxelles",
    phone: "+32 2 345 67 89", country_code: "BE", language: "fr-FR",
    agent_name: "Callia", tone: "direct", active: true, calls: 89, satisfaction: 93,
    calendly_url: "https://calendly.com/garage-express/rdv",
    escalation_phone: "+32 475 12 34 56",
    faqs: [
      { question: "Combien coute une vidange ?", answer: "A partir de 79 EUR TTC main d'oeuvre + huile, selon le modele. Devis gratuit en 5 minutes par telephone." },
      { question: "Faites-vous le pre-controle technique ?", answer: "Oui, pre-controle gratuit si vous prenez le rendez-vous chez nous pour les reparations eventuelles." },
      { question: "Faites-vous le depannage ?", answer: "Oui, depannage 7j/7 dans un rayon de 30 km autour de Bruxelles. Forfait a partir de 65 EUR + kilometrage." },
    ],
  },
];

let demoStore     = JSON.parse(JSON.stringify(DEMO_AGENTS));
let demoCallStore = [];

export async function listAgents() {
  if (!HAS_SUPABASE) return demoStore;
  const { data: agents, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = agents.map(a => a.id);
  if (ids.length === 0) return [];
  const { data: faqs } = await supabase
    .from("faqs").select("*").in("agent_id", ids).order("position");
  const { data: calls } = await supabase
    .from("calls").select("agent_id, satisfaction").in("agent_id", ids);
  const byAgent = {};
  for (const f of (faqs || [])) (byAgent[f.agent_id] ??= { faqs: [], calls: 0, sats: [] }).faqs.push(f);
  for (const c of (calls || [])) {
    const e = (byAgent[c.agent_id] ??= { faqs: [], calls: 0, sats: [] });
    e.calls += 1;
    if (c.satisfaction) e.sats.push(c.satisfaction);
  }
  return agents.map(a => {
    const ext = byAgent[a.id] || { faqs: [], calls: 0, sats: [] };
    const avg = ext.sats.length ? Math.round((ext.sats.reduce((s, x) => s + x, 0) / ext.sats.length) * 20) : null;
    return { ...a, faqs: ext.faqs, calls: ext.calls, satisfaction: avg };
  });
}

export async function createAgent(payload, faqs = []) {
  if (!HAS_SUPABASE) {
    const id = "demo-" + Date.now();
    const agent = { id, ...payload, faqs, calls: 0, satisfaction: null, active: true };
    demoStore = [agent, ...demoStore];
    return agent;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifie");
  const { data: agent, error } = await supabase.from("agents")
    .insert({ ...payload, owner_id: user.id }).select().single();
  if (error) throw error;
  if (faqs.length) {
    const rows = faqs.map((f, i) => ({ agent_id: agent.id, question: f.question, answer: f.answer, position: i }));
    const { error: fErr } = await supabase.from("faqs").insert(rows);
    if (fErr) throw fErr;
  }
  return { ...agent, faqs };
}

export async function updateAgent(id, patch, faqs) {
  if (!HAS_SUPABASE) {
    demoStore = demoStore.map(a => a.id === id ? { ...a, ...patch, faqs: faqs ?? a.faqs } : a);
    return demoStore.find(a => a.id === id);
  }
  const { error } = await supabase.from("agents").update(patch).eq("id", id);
  if (error) throw error;
  if (faqs) {
    await supabase.from("faqs").delete().eq("agent_id", id);
    if (faqs.length) {
      const rows = faqs.map((f, i) => ({ agent_id: id, question: f.question, answer: f.answer, position: i }));
      const { error: fErr } = await supabase.from("faqs").insert(rows);
      if (fErr) throw fErr;
    }
  }
  return true;
}

export async function deleteAgent(id) {
  if (!HAS_SUPABASE) {
    demoStore = demoStore.filter(a => a.id !== id);
    return true;
  }
  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function saveCall({ agent_id, transcript, duration_sec, source = "simulator" }) {
  if (!HAS_SUPABASE) {
    demoCallStore = [{ id: Date.now(), agent_id, transcript, duration_sec, source, created_at: new Date().toISOString() }, ...demoCallStore];
    return demoCallStore[0];
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("calls")
    .insert({ agent_id, owner_id: user.id, transcript, duration_sec, source })
    .select().single();
  if (error) throw error;
  return data;
}

export async function listRecentCalls(agent_id, limit = 10) {
  if (!HAS_SUPABASE) {
    return demoCallStore.filter(c => c.agent_id === agent_id).slice(0, limit);
  }
  const { data, error } = await supabase.from("calls")
    .select("*").eq("agent_id", agent_id)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export const SECTORS = [
  "Restauration & commerce",
  "Sante",
  "Services automobiles",
  "Banque & Finance",
  "Telecommunications",
  "Immobilier",
  "Hotellerie & Tourisme",
  "Beaute & Bien-etre",
  "Education & Formation",
  "Artisanat & BTP",
  "Juridique",
  "Autre",
];

export const COUNTRIES = [
  { code: "FR", name: "France",        dial: "+33"  },
  { code: "BE", name: "Belgique",      dial: "+32"  },
  { code: "CH", name: "Suisse",        dial: "+41"  },
  { code: "LU", name: "Luxembourg",    dial: "+352" },
  { code: "CA", name: "Canada",        dial: "+1"   },
  { code: "MA", name: "Maroc",         dial: "+212" },
  { code: "DZ", name: "Algerie",       dial: "+213" },
  { code: "TN", name: "Tunisie",       dial: "+216" },
  { code: "SN", name: "Senegal",       dial: "+221" },
  { code: "CI", name: "Cote d'Ivoire", dial: "+225" },
  { code: "CD", name: "RD Congo",      dial: "+243" },
  { code: "CM", name: "Cameroun",      dial: "+237" },
  { code: "ML", name: "Mali",          dial: "+223" },
  { code: "BF", name: "Burkina Faso",  dial: "+226" },
  { code: "BJ", name: "Benin",         dial: "+229" },
  { code: "TG", name: "Togo",          dial: "+228" },
  { code: "GA", name: "Gabon",         dial: "+241" },
];
