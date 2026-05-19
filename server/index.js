// ════════════════════════════════════════════════════════════════════════════
// Callia Backend — Express + proxy Anthropic + Twilio Voice
// La cle API ne quitte JAMAIS le serveur. Les endpoints :
//   GET  /api/health            healthcheck
//   POST /api/chat              proxy Claude (utilise par le simulateur navigateur)
//   POST /api/summarize         resume IA d'un appel
//   POST /api/suggest-faqs      generation FAQ par IA
//   POST /voice                 Twilio webhook : nouveau appel entrant
//   POST /respond               Twilio webhook : tour de parole
//   POST /voice-status          Twilio webhook : fin d'appel
// ════════════════════════════════════════════════════════════════════════════
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("\n[!] ANTHROPIC_API_KEY manquant - mode FALLBACK actif (fuzzy match FAQ).\n");
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Rate limiter (in-memory) ───────────────────────────────────────────
const RATE_LIMIT     = parseInt(process.env.RATE_LIMIT || "30", 10);
const RATE_WINDOW_MS = parseInt(process.env.RATE_WINDOW_MS || "60000", 10);
const rateBuckets    = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { count: 0, windowStart: now };
  if (now - bucket.windowStart > RATE_WINDOW_MS) { bucket.count = 0; bucket.windowStart = now; }
  bucket.count++;
  rateBuckets.set(ip, bucket);
  if (Math.random() < 0.01) {
    for (const [k, v] of rateBuckets.entries()) {
      if (now - v.windowStart > RATE_WINDOW_MS * 2) rateBuckets.delete(k);
    }
  }
  if (bucket.count > RATE_LIMIT) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - bucket.windowStart)) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "Trop de requetes. Reessayez dans " + retryAfter + "s.", retryAfter });
  }
  next();
}

// ─── Fuzzy matching FAQ ────────────────────────────────────────────────
const STOPWORDS = new Set([
  "le","la","les","un","une","des","de","du","au","aux","l","d",
  "vous","tu","je","il","elle","nous","ils","elles","on","me","te","se","lui",
  "est","etre","ete","etes","sont","sera","fait","faites","ai","as","ont","avez","avons","avoir",
  "ce","cette","ces","ca","cela","ceci","mon","ma","mes","ton","ta","tes","son","sa","ses","votre","vos","notre","nos",
  "ou","et","mais","si","car","donc","puis","alors","ni","or",
  "pour","par","sur","sous","dans","avec","sans","chez","vers","entre",
  "y","en","ne","pas","plus","moins","tres","bien","trop","aussi","encore","deja",
  "qu","que","qui","quoi","quel","quelle","quels","quelles","quand","comment","pourquoi",
  "a","oui","non","peut","peux","peut-etre","puis-je","merci","bonjour","salut","sil","plait","svp",
  "tout","tous","toute","toutes","faire","ait","aient"
]);

function normalize(s) {
  return String(s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[?,.!;:'"()\-_\/]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function tokenize(s) {
  return normalize(s).split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

function tokenMatch(a, b) {
  if (a === b) return 2;
  if (a.length >= 4 && b.length >= 4) {
    const sa = a.slice(0, Math.min(5, a.length - 1));
    const sb = b.slice(0, Math.min(5, b.length - 1));
    if (sa === sb) return 1.5;
    if (a.includes(b) || b.includes(a)) return 1.2;
    if (a.includes(sb) || b.includes(sa)) return 1;
  }
  if (a.length >= 4 && b.length >= 4 && Math.abs(a.length - b.length) <= 1) {
    let d = 0;
    const [s, l] = a.length <= b.length ? [a, b] : [b, a];
    for (let i = 0, j = 0; i < s.length && d <= 1; i++, j++) {
      if (s[i] !== l[j]) { d++; if (s.length < l.length) i--; }
    }
    if (d <= 1) return 0.9;
  }
  return 0;
}

function fuzzyScore(userTokens, faqTokens) {
  if (faqTokens.length === 0) return 0;
  let score = 0; const used = new Set();
  for (const ut of userTokens) {
    let best = 0, bestIdx = -1;
    faqTokens.forEach((ft, idx) => {
      if (used.has(idx)) return;
      const s = tokenMatch(ut, ft);
      if (s > best) { best = s; bestIdx = idx; }
    });
    if (best > 0) { score += best; used.add(bestIdx); }
  }
  return score / Math.max(faqTokens.length * 0.55, 1);
}

function extractContext(system) {
  const ctx = {};
  const grab = (re) => { const m = system.match(re); return m ? m[1].trim() : null; };
  ctx.name        = grab(/de "([^"]+)"/);
  ctx.description = grab(/Description\s*:\s*([^\n]+)/);
  ctx.services    = grab(/Services proposes\s*:\s*([^\n]+)/);
  ctx.hours       = grab(/Horaires\s*:\s*([^\n]+)/);
  ctx.address     = grab(/Adresse\s*:\s*([^\n]+)/);
  ctx.phone       = grab(/Telephone\s*:\s*([^\n]+)/);
  return ctx;
}

function fallbackReply(system, userMessage, history = []) {
  if (!system) return "Je suis en cours de configuration. Reessayez dans un instant.";
  const userT = tokenize(userMessage);
  const norm = normalize(userMessage);
  const greetings = ["bonjour","salut","bonsoir","coucou","allo","hello"];
  const isGreeting = greetings.some(g => norm.startsWith(g) || norm === g);

  const faqMatches = [...system.matchAll(/Q\d+:\s*([^\n]+)\s*\n\s*R\d+:\s*([^\n]+)/g)];
  let best = { score: 0, answer: null };
  for (const [, q, r] of faqMatches) {
    const score = fuzzyScore(userT, tokenize(q));
    if (score > best.score) best = { score, answer: r };
  }
  if (best.score >= 0.3 && best.answer) return best.answer;

  if (isGreeting && userT.length === 0) return "Bonjour ! Que puis-je faire pour vous aujourd'hui ?";

  const ctx = extractContext(system);
  if (/horair|ouvert|ouvre|ferm|heur/i.test(norm) && ctx.hours)    return "Nos horaires : " + ctx.hours + ".";
  if (/adress|situ|trouve|emplacement|localis/i.test(norm) && ctx.address) return "Nous sommes situes : " + ctx.address + ".";
  if (/telephone|numero|appel|joindre/i.test(norm) && ctx.phone)   return "Notre numero : " + ctx.phone + ".";
  if (/(quels? )?services?|propose|offre|vend|fait/i.test(norm) && ctx.services) return "Nous proposons : " + ctx.services;

  const fails = history.filter(m => m.role === "assistant" && typeof m.content === "string" &&
    (m.content.includes("reformuler") || m.content.includes("pas certaine"))).length;
  if (fails === 0) return "Je n'ai pas bien compris votre demande. Pouvez-vous reformuler ? Je peux vous renseigner sur nos horaires, services, tarifs ou prendre une commande.";
  if (fails === 1) return "Excusez-moi, je ne suis pas certaine de bien saisir. Voulez-vous des informations sur nos horaires, notre adresse, ou souhaitez-vous prendre rendez-vous ?";
  return "Je vois que je ne parviens pas a vous aider. Souhaitez-vous que je vous transfere a un conseiller humain ou que je prenne un message ?";
}

function detectIntent(text) {
  const t = (text || "").toLowerCase();
  if (/rendez.vous|rdv|reserver|planifier/i.test(t)) return "prise_rdv";
  if (/command|achet|livrais/i.test(t)) return "commande";
  if (/probleme|reclam|plain|mecontent/i.test(t)) return "plainte";
  if (/horaire|adresse|prix|tarif/i.test(t)) return "information";
  if (/humain|conseiller|manager|responsable/i.test(t)) return "transfert_demande";
  return "autre";
}

// ════════════════════════════════════════════════════════════════════════════
// TWILIO VOICE — Gestion des appels téléphoniques réels
// ════════════════════════════════════════════════════════════════════════════

// Sessions actives par CallSid (in-memory)
const callSessions = new Map();

// Nettoyage périodique : sessions de plus de 30 min
setInterval(() => {
  const now = Date.now();
  for (const [sid, s] of callSessions.entries()) {
    if (now - s.startedAt > 30 * 60 * 1000) {
      console.log("[CALL] Cleanup session expired " + sid);
      callSessions.delete(sid);
    }
  }
}, 60 * 1000);

// ─── Agent de fallback pour la démo Twilio (sans Supabase) ─────────────
// Si DEMO_TWILIO_NUMBER est dans .env, tous les appels y sont routes vers ce demo
const DEMO_AGENT_BOULANGERIE = {
  id: "demo-boulangerie",
  name: "Boulangerie Le Croissant Doré",
  sector: "Restauration & commerce",
  description: "Boulangerie artisanale au coeur de Lyon, pains au levain et patisseries faites maison.",
  services: "Pains traditionnels, viennoiseries, patisseries, sandwichs et plateaux pour evenements.",
  hours: "Mar-Sam 6h30-19h30, Dim 7h-13h, ferme le lundi",
  address: "12 rue Merciere, 69002 Lyon",
  phone: process.env.DEMO_TWILIO_NUMBER || "+33 4 78 12 34 56",
  language: "fr-FR",
  agent_name: "Callia",
  tone: "chaleureux",
  greeting: null,
  calendly_url: "",
  escalation_phone: process.env.DEMO_ESCALATION_PHONE || "",
  faqs: [
    { question: "Quels sont vos horaires d'ouverture ?",                answer: "Nous sommes ouverts du mardi au samedi de 6h30 a 19h30, et le dimanche de 7h a 13h. Nous sommes fermes le lundi." },
    { question: "Etes-vous ouverts le dimanche ?",                       answer: "Oui, nous sommes ouverts le dimanche matin de 7h a 13h." },
    { question: "Faites-vous des commandes pour evenements ?",           answer: "Oui, plateaux sales et sucres sur commande avec 48 heures de preavis. A partir de 12 personnes." },
    { question: "Avez-vous des pains sans gluten ?",                     answer: "Oui, nous proposons un pain de sarrasin sans gluten les mercredis et samedis, sur reservation la veille." },
    { question: "Acceptez-vous les tickets restaurant ?",                answer: "Oui, tickets restaurant papier et cartes Swile, Edenred et Up." },
    { question: "Acceptez-vous la carte bleue ?",                        answer: "Oui, nous acceptons toutes les cartes bancaires." },
  ],
};

// ─── Mapping numero Twilio (To) -> agent ─────────────────────────────
async function findAgentByPhone(toNumber) {
  // Demo mode : si le numero appele correspond au DEMO_TWILIO_NUMBER, on renvoie l'agent boulangerie
  if (process.env.DEMO_TWILIO_NUMBER && toNumber === process.env.DEMO_TWILIO_NUMBER) {
    return DEMO_AGENT_BOULANGERIE;
  }

  // Production : query Supabase via l'API REST (sans la lib pour eviter une dependance)
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/agents?phone=eq.${encodeURIComponent(toNumber)}&select=*&limit=1`;
      const r = await fetch(url, {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
        },
      });
      if (r.ok) {
        const arr = await r.json();
        if (arr.length > 0) {
          // Recuperer les FAQ aussi
          const faqUrl = `${process.env.VITE_SUPABASE_URL}/rest/v1/faqs?agent_id=eq.${arr[0].id}&order=position`;
          const faqR = await fetch(faqUrl, {
            headers: {
              "apikey": process.env.SUPABASE_SERVICE_KEY,
              "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
            },
          });
          arr[0].faqs = faqR.ok ? await faqR.json() : [];
          return arr[0];
        }
      }
    } catch (e) {
      console.error("[CALL] Supabase lookup error:", e.message);
    }
  }

  // Sinon, fallback sur l'agent demo (utile en dev)
  return DEMO_AGENT_BOULANGERIE;
}

// ─── Builder system prompt pour appels vocaux ─────────────────────────
function buildSystemPromptVoice(agent) {
  const toneMap = {
    chaleureux: "Adopte un ton chaleureux, amical et naturel comme a l'oral.",
    formel:     "Adopte un ton professionnel et formel mais courtois.",
    direct:     "Adopte un ton direct et efficace, va droit au but.",
  };
  const faqBlock = agent.faqs?.length
    ? "\n\nFAQ PRIORITAIRE — Utilise EXACTEMENT ces reponses si la question correspond :\n" +
      agent.faqs.map((f, i) => `Q${i+1}: ${f.question}\nR${i+1}: ${f.answer}`).join("\n\n")
    : "";

  const integrations = [];
  if (agent.calendly_url)     integrations.push(`Lien Calendly pour RDV : ${agent.calendly_url}. Propose-le si le client veut prendre RDV.`);
  if (agent.escalation_phone) integrations.push(`TRANSFERT HUMAIN (dernier recours uniquement) : si le client est enerve, demande explicitement un humain, ou apres 2 echecs, dis "Je vous transfere a un conseiller, ne quittez pas." Le systeme detectera cette phrase et basculera vers ${agent.escalation_phone}.`);
  const integBlock = integrations.length ? "\n\nINTEGRATIONS :\n- " + integrations.join("\n- ") : "";

  return `Tu es ${agent.agent_name || "Callia"}, l'assistante telephonique IA de "${agent.name}" (${agent.sector}).

Description : ${agent.description}
Services proposes : ${agent.services}
Horaires : ${agent.hours}
Adresse : ${agent.address}
Telephone : ${agent.phone}${faqBlock}${integBlock}

REGLES IMPORTANTES (CONVERSATION VOCALE) :
- Reponds en francais oral, 1 a 2 phrases COURTES (max 25 mots), comme au telephone.
- Pas d'enumeration en liste, pas de markdown, pas de caracteres speciaux.
- Si la question correspond a la FAQ (meme avec fautes), utilise la reponse FAQ.
- Si tu n'as pas l'info : "Je n'ai pas cette information sous la main, voulez-vous que je prenne un message ?"
- TRANSFERT = dernier recours. Pour horaires/services/prix simples, REPONDS toi-meme.
- Ne donne JAMAIS d'information que tu n'as pas recue ci-dessus.`;
}

// ─── TwiML helpers ────────────────────────────────────────────────────
function xmlEscape(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function twimlSay(text, voice = "Polly.Lea") {
  return `<Say voice="${voice}" language="fr-FR">${xmlEscape(text)}</Say>`;
}
function twimlGather(prompt, action = "/respond") {
  return `<Gather input="speech" language="fr-FR" speechTimeout="auto" action="${action}" method="POST">${twimlSay(prompt)}</Gather><Redirect method="POST">/no-input</Redirect>`;
}
function twimlResponse(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${content}</Response>`;
}

// ─── Detection de transfert dans la reponse de l'IA ───────────────────
function shouldTransfer(reply, agent) {
  if (!agent.escalation_phone) return false;
  return /\btransfer(?:e|er|ere|ation|onner)|conseiller|un humain|le manager|le responsable\b/i.test(reply);
}

// ─── Detection que le client veut raccrocher ───────────────────────────
function callerWantsHangup(speech) {
  return /au revoir|merci.*c'est tout|bonne journee.*au revoir|je raccroche|ca ira|c'est bon merci/i.test(speech);
}

// ════════════════════════════════════════════════════════════════════════════
// SETUP EXPRESS
// ════════════════════════════════════════════════════════════════════════════
const app = express();
app.set("trust proxy", true);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false })); // Pour Twilio webhooks

// ─── /api/health ─────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    twilioReady: !!process.env.DEMO_TWILIO_NUMBER,
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
    rateLimit: { max: RATE_LIMIT, windowMs: RATE_WINDOW_MS },
  });
});

// ─── /api/chat (simulateur navigateur) ────────────────────────────────
app.post("/api/chat", rateLimit, async (req, res) => {
  const { system, messages = [], userMessage } = req.body || {};
  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return res.status(400).json({ error: "userMessage requis." });
  }
  if (userMessage.length > 2000) {
    return res.status(400).json({ error: "Message trop long (max 2000 caracteres)." });
  }
  if (!anthropic) {
    return res.json({ reply: fallbackReply(system, userMessage, messages), fallback: true });
  }
  try {
    const completion = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: system || "Tu es une assistante telephonique IA polie et concise.",
      messages: [...messages, { role: "user", content: userMessage }],
    });
    res.json({ reply: completion.content?.[0]?.text?.trim() || "" });
  } catch (err) {
    console.error("Anthropic error:", err?.message);
    res.status(err?.status || 500).json({ error: err?.message || "Erreur Claude" });
  }
});

// ─── /api/summarize ───────────────────────────────────────────────────
app.post("/api/summarize", rateLimit, async (req, res) => {
  const { transcript, agent } = req.body || {};
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: "transcript requis" });
  }
  const dialogue = transcript.filter(m => m.role !== "system")
    .map(m => (m.role === "user" ? "Client : " : "Agent : ") + m.content).join("\n");

  if (!anthropic) {
    const userMsgs = transcript.filter(m => m.role === "user");
    return res.json({
      summary: "Appel de " + userMsgs.length + " echange(s). Premiere demande : \"" + (userMsgs[0]?.content || "").slice(0, 100) + "\".",
      intent: detectIntent(userMsgs[0]?.content),
      action: "Verifier le transcript pour determiner l'action.",
      fallback: true,
    });
  }
  try {
    const completion = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: "Tu analyses des transcripts d'appels. Retourne STRICTEMENT un JSON avec : summary (2 phrases max), intent (information|prise_rdv|commande|plainte|transfert_demande|autre), action (1 phrase courte). Pas de markdown.",
      messages: [{ role: "user", content: "Entreprise : " + (agent?.name || "Inconnue") + "\nSecteur : " + (agent?.sector || "") + "\n\nTranscript :\n" + dialogue }],
    });
    const raw = completion.content?.[0]?.text?.trim() || "{}";
    let parsed;
    try { const m = raw.match(/\{[\s\S]*\}/); parsed = JSON.parse(m ? m[0] : raw); }
    catch { parsed = { summary: raw, intent: "autre", action: "Voir transcript" }; }
    res.json(parsed);
  } catch (err) {
    console.error("Summarize error:", err?.message);
    res.status(500).json({ error: err?.message || "Erreur resume" });
  }
});

// ─── /api/suggest-faqs ────────────────────────────────────────────────
app.post("/api/suggest-faqs", rateLimit, async (req, res) => {
  const { sector, description, name } = req.body || {};
  if (!sector || !description) return res.status(400).json({ error: "sector et description requis" });
  if (!anthropic) {
    return res.json({ faqs: [
      { question: "Quels sont vos horaires d'ouverture ?", answer: "[A remplir]" },
      { question: "Quels sont vos tarifs ?",               answer: "[A remplir]" },
      { question: "Comment prendre rendez-vous ?",         answer: "[A remplir]" },
      { question: "Quelle est votre adresse ?",            answer: "[A remplir]" },
    ], fallback: true });
  }
  try {
    const completion = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: "Tu es expert CRM PME. Genere 10 questions frequentes et reponses TYPE pour cette entreprise. Reponses concises (1-2 phrases), naturelles. Retourne STRICTEMENT { \"faqs\": [{ \"question\": \"...\", \"answer\": \"...\" }] } sans markdown.",
      messages: [{ role: "user", content: "Entreprise : " + (name || "Sans nom") + "\nSecteur : " + sector + "\nDescription : " + description }],
    });
    const raw = completion.content?.[0]?.text?.trim() || "{}";
    let parsed;
    try { const m = raw.match(/\{[\s\S]*\}/); parsed = JSON.parse(m ? m[0] : raw); }
    catch { parsed = { faqs: [] }; }
    res.json({ faqs: parsed.faqs || [] });
  } catch (err) {
    console.error("Suggest FAQs error:", err?.message);
    res.status(500).json({ error: err?.message || "Erreur generation FAQ" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// TWILIO ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// ─── POST /voice : appel entrant ──────────────────────────────────────
app.post("/voice", async (req, res) => {
  const callSid    = req.body.CallSid;
  const toNumber   = req.body.To;
  const fromNumber = req.body.From;

  console.log(`[CALL ${callSid}] INCOMING ${fromNumber} -> ${toNumber}`);

  const agent = await findAgentByPhone(toNumber);
  if (!agent) {
    return res.type("text/xml").send(twimlResponse(
      twimlSay("Bonjour, ce numero n'est pas encore configure. Au revoir.") + "<Hangup/>"
    ));
  }

  // Cree la session
  callSessions.set(callSid, {
    agent,
    history: [],
    startedAt: Date.now(),
    callerNumber: fromNumber,
    silenceCount: 0,
    systemPrompt: buildSystemPromptVoice(agent),
  });

  // Annonce d'accueil + mention RGPD
  const greeting = agent.greeting ||
    `Bonjour, ${agent.agent_name || "Callia"} a l'appareil pour ${agent.name}. Cette conversation peut etre traitee par un assistant vocal. Comment puis-je vous aider ?`;

  res.type("text/xml").send(twimlResponse(twimlGather(greeting)));
});

// ─── POST /respond : tour de parole ───────────────────────────────────
app.post("/respond", async (req, res) => {
  const callSid    = req.body.CallSid;
  const userSpeech = (req.body.SpeechResult || "").trim();
  const session    = callSessions.get(callSid);

  if (!session) {
    return res.type("text/xml").send(twimlResponse(
      twimlSay("Desole, votre session a expire. Veuillez rappeler.") + "<Hangup/>"
    ));
  }

  // Silence detecte
  if (!userSpeech) {
    session.silenceCount++;
    if (session.silenceCount >= 2) {
      console.log(`[CALL ${callSid}] TIMEOUT 2 silences`);
      callSessions.delete(callSid);
      return res.type("text/xml").send(twimlResponse(
        twimlSay("Je n'arrive pas a vous entendre. Au revoir.") + "<Hangup/>"
      ));
    }
    return res.type("text/xml").send(twimlResponse(twimlGather("Excusez-moi, vous m'entendez ?")));
  }
  session.silenceCount = 0;

  console.log(`[CALL ${callSid}] USER: ${userSpeech.slice(0, 80)}`);

  // Client veut raccrocher ?
  if (callerWantsHangup(userSpeech)) {
    console.log(`[CALL ${callSid}] caller hangup`);
    callSessions.delete(callSid);
    return res.type("text/xml").send(twimlResponse(
      twimlSay("Tres bien, je vous remercie. Bonne journee, au revoir !") + "<Hangup/>"
    ));
  }

  // Generer la reponse (avec timeout 10s)
  let reply;
  try {
    if (anthropic) {
      const completion = await Promise.race([
        anthropic.messages.create({
          model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: session.systemPrompt,
          messages: [...session.history, { role: "user", content: userSpeech }],
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("claude timeout")), 10000)),
      ]);
      reply = completion.content?.[0]?.text?.trim() || "Pouvez-vous repeter s'il vous plait ?";
    } else {
      reply = fallbackReply(session.systemPrompt, userSpeech, session.history);
    }
  } catch (e) {
    console.error(`[CALL ${callSid}] error:`, e.message);
    reply = "Un instant je verifie cette information, ne quittez pas.";
  }

  // Nettoyer la reponse pour la voix (retirer markdown au cas ou)
  reply = reply.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").replace(/#+/g, "").trim();

  console.log(`[CALL ${callSid}] ASSISTANT: ${reply.slice(0, 80)}`);

  // Sauvegarder dans l'historique
  session.history.push(
    { role: "user", content: userSpeech },
    { role: "assistant", content: reply }
  );

  // Transfert detecte ?
  if (shouldTransfer(reply, session.agent)) {
    console.log(`[CALL ${callSid}] TRANSFER -> ${session.agent.escalation_phone}`);
    return res.type("text/xml").send(twimlResponse(
      twimlSay(reply) +
      `<Dial timeout="20" callerId="${xmlEscape(session.agent.phone || "")}">${xmlEscape(session.agent.escalation_phone)}</Dial>` +
      twimlSay("Le conseiller n'est pas joignable pour l'instant. Vous pouvez nous rappeler plus tard. Au revoir.") +
      "<Hangup/>"
    ));
  }

  // Continuer la conversation
  res.type("text/xml").send(twimlResponse(twimlGather(reply)));
});

// ─── POST /no-input : timeout du <Gather> ───────────────────────────
app.post("/no-input", (req, res) => {
  const callSid = req.body.CallSid;
  const session = callSessions.get(callSid);
  if (session) {
    session.silenceCount = (session.silenceCount || 0) + 1;
    if (session.silenceCount >= 2) {
      callSessions.delete(callSid);
      return res.type("text/xml").send(twimlResponse(
        twimlSay("Je n'arrive pas a vous entendre. N'hesitez pas a rappeler. Au revoir.") + "<Hangup/>"
      ));
    }
  }
  res.type("text/xml").send(twimlResponse(twimlGather("Vous m'entendez ?")));
});

// ─── POST /voice-status : fin de l'appel (Twilio callback) ───────────
app.post("/voice-status", async (req, res) => {
  const callSid    = req.body.CallSid;
  const status     = req.body.CallStatus;
  const duration   = parseInt(req.body.CallDuration || "0", 10);
  const session    = callSessions.get(callSid);

  if (session) {
    const userMsgs = session.history.filter(m => m.role === "user").length;
    console.log(`[CALL ${callSid}] ENDED status=${status} duration=${duration}s exchanges=${userMsgs}`);

    // Sauvegarder l'appel dans Supabase si configure
    if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/calls`, {
          method: "POST",
          headers: {
            "apikey": process.env.SUPABASE_SERVICE_KEY,
            "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            agent_id:     session.agent.id,
            owner_id:     session.agent.owner_id || null,
            source:       "twilio",
            transcript:   session.history.map(m => ({ ...m, ts: new Date().toISOString() })),
            duration_sec: duration,
            caller_id:    session.callerNumber,
          }),
        });
      } catch (e) { console.error("[CALL save] error:", e.message); }
    }
    callSessions.delete(callSid);
  }
  res.sendStatus(200);
});

// ════════════════════════════════════════════════════════════════════════════
// STATIC + LISTEN
// ════════════════════════════════════════════════════════════════════════════
if (IS_PROD) {
  const distDir = path.join(__dirname, "..", "dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  Callia Backend ready on :${PORT}${" ".repeat(Math.max(0, 36 - String(PORT).length))}║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║  Mode               ${IS_PROD ? "prod" : "dev "}${" ".repeat(40)}║`);
  console.log(`║  Anthropic key      ${process.env.ANTHROPIC_API_KEY ? "✓ configured" : "✗ MISSING (fallback)"}${" ".repeat(20)}║`);
  console.log(`║  Twilio number      ${process.env.DEMO_TWILIO_NUMBER || "(none)"}${" ".repeat(Math.max(0, 40 - String(process.env.DEMO_TWILIO_NUMBER || "(none)").length))}║`);
  console.log(`║  Supabase           ${process.env.VITE_SUPABASE_URL ? "✓ enabled" : "✗ disabled"}${" ".repeat(28)}║`);
  console.log(`║  Rate limit         ${RATE_LIMIT}/${RATE_WINDOW_MS/1000}s${" ".repeat(36)}║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
});
