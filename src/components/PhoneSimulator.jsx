import { useState, useRef, useEffect } from "react";
import { askClaude } from "../lib/api.js";
import { saveCall } from "../lib/agents.js";
import CallSummary from "./CallSummary.jsx";

// ─── TTS navigateur (Web Speech) ────────────────────────────────────────────
// Patterns voix FEMININES (couvre Google, Microsoft, Apple, Samsung, Android)
const FEMALE_VOICE_PATTERNS = /amelie|aur[ée]lie|marie|chloe|chlo[ée]|virginie|c[ée]lest|c[ée]line|hortense|julie|sophie|isabelle|emma|elise|audrey|brigitte|female|femme|woman|girl|standard-a|standard-c|standard-e|wavenet-a|wavenet-c|wavenet-e|neural2-a|neural2-c|neural2-e|google\s*fran[çc]ais.*fran[çc]e|microsoft\s*denise|microsoft\s*julie|microsoft\s*hortense|samsung\s*female/i;

// Patterns voix MASCULINES — à éviter
const MALE_VOICE_PATTERNS = /thomas|mathieu|nicolas|paul|antoine|henri|jean|pierre|male\b|homme|man\b|standard-b|standard-d|wavenet-b|wavenet-d|neural2-b|neural2-d|microsoft\s*paul|microsoft\s*claude/i;

// Attend que les voix soient chargées (Android les charge async)
function waitForVoices(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve([]);
    let voices = synth.getVoices();
    if (voices.length) return resolve(voices);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.onvoiceschanged = null;
      resolve(synth.getVoices());
    };
    synth.onvoiceschanged = finish;
    setTimeout(finish, timeoutMs);
  });
}

// Détection de la plateforme
const IS_IOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
const IS_ANDROID = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

// Sur iOS la meilleure voix française est "Amélie" (fr-CA, locale)
// Sur Android on cherche les voix Google réseau de qualité (fr-CA puis fr-FR)
function pickBestVoice(voices, lang) {
  if (!voices.length) return null;

  // iOS : force "Amélie" si dispo (la meilleure voix française d'Apple)
  if (IS_IOS) {
    const amelie = voices.find(v => /am[ée]lie/i.test(v.name));
    if (amelie) return amelie;
    // Fallback iOS : autre voix française féminine (Audrey, Aurélie, Marie, Virginie)
    const iosFemale = voices.find(v => /audrey|aur[ée]lie|marie|virginie/i.test(v.name));
    if (iosFemale) return iosFemale;
  }

  // Android : prioriser Google network voices (fr-CA puis fr-FR)
  if (IS_ANDROID) {
    // Google fr-CA réseau (l'équivalent le plus proche d'Amélie)
    let pick = voices.find(v => /google/i.test(v.name) && /fr-CA/i.test(v.lang) && v.localService === false);
    if (pick) return pick;
    // Google fr-FR réseau
    pick = voices.find(v => /google/i.test(v.name) && /fr-FR/i.test(v.lang) && v.localService === false);
    if (pick) return pick;
    // N'importe quelle voix Google FR réseau
    pick = voices.find(v => /google/i.test(v.name) && /^fr/i.test(v.lang) && v.localService === false);
    if (pick) return pick;
    // Voix française féminine (réseau de préférence)
    pick = voices.find(v => /^fr/i.test(v.lang) && FEMALE_VOICE_PATTERNS.test(v.name) && v.localService === false)
        || voices.find(v => /^fr/i.test(v.lang) && FEMALE_VOICE_PATTERNS.test(v.name));
    if (pick) return pick;
  }

  // Desktop ou fallback : meilleure voix dans la langue demandée, non-masculine
  const langCode = lang.split("-")[0];
  const sameLang = voices.filter(v => v.lang === lang);
  const sameLangFamily = voices.filter(v => v.lang.startsWith(langCode));
  return sameLang.find(v => FEMALE_VOICE_PATTERNS.test(v.name))
      || sameLangFamily.find(v => FEMALE_VOICE_PATTERNS.test(v.name))
      || sameLang.find(v => /google/i.test(v.name))
      || sameLang.find(v => !MALE_VOICE_PATTERNS.test(v.name))
      || sameLangFamily.find(v => !MALE_VOICE_PATTERNS.test(v.name))
      || sameLang[0]
      || sameLangFamily[0]
      || voices[0];
}

// Supprime emojis et autres caractères symboliques pour qu'ils ne soient pas lus à voix haute
function stripEmojis(text) {
  if (!text) return text;
  return text
    // Plages Unicode des emojis et pictogrammes
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")        // Symbols & Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")        // Chess, etc.
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")        // Symbols extended
    .replace(/[\u{2600}-\u{26FF}]/gu, "")          // Misc symbols (☀️ ⚡)
    .replace(/[\u{2700}-\u{27BF}]/gu, "")          // Dingbats (✓ ✗ ❤)
    .replace(/[\u{1F000}-\u{1F02F}]/gu, "")        // Mahjong/dominoes
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, "")        // Cartes à jouer
    .replace(/[\u{1F100}-\u{1F2FF}]/gu, "")        // Enclosed alphanum
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")          // Variation selectors
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")        // Drapeaux régionaux
    .replace(/[\u{200D}]/gu, "")                   // Zero-width joiner
    // Smileys ASCII courants : :), :-), ;), :D, etc.
    .replace(/(^|[\s.,!?])[:;=][\-^]?[\)\(\[\]DPpoO\\\/]+/g, "$1")
    .replace(/<3/g, "")
    // Nettoie les espaces multiples laissés
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

async function speak(text, lang = "fr-FR", onStart, onEnd) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  const synth = window.speechSynthesis;
  synth.cancel();

  // Toujours retirer les emojis avant de parler
  const clean = stripEmojis(text);
  if (!clean) { onEnd?.(); return; }

  const voices = await waitForVoices();
  const pick = pickBestVoice(voices, lang);

  const utt = new SpeechSynthesisUtterance(clean);
  // Si on a une voix iOS fr-CA (Amélie), on utilise sa locale native
  utt.lang = pick?.lang || lang;
  if (pick) {
    utt.voice = pick;
    console.log("[Callia TTS] Voice:", pick.name, "| local:", pick.localService, "| lang:", pick.lang);
  }

  // Pitch boost très léger seulement si voix clairement masculine
  const isMale = pick && MALE_VOICE_PATTERNS.test(pick.name);
  utt.pitch = isMale ? 1.2 : 1.0;
  // Rate plus lent sur mobile pour la clarté
  utt.rate = (IS_IOS || IS_ANDROID) ? 0.95 : 1.05;
  utt.volume = 1.0;

  utt.onstart = onStart;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  synth.speak(utt);
}


const LANGUAGE_DIRECTIVES = {
  "fr-FR": "Reponds UNIQUEMENT en francais naturel, comme a l'oral.",
  "en-US": "Respond ONLY in natural spoken English.",
  "es-ES": "Responde UNICAMENTE en espanol natural y oral.",
  "ar-MA": "أجب فقط بالعربية الفصحى المبسطة بلهجة طبيعية.",
  "de-DE": "Antworte AUSSCHLIESSLICH in natuerlichem gesprochenem Deutsch.",
  "it-IT": "Rispondi ESCLUSIVAMENTE in italiano naturale e parlato.",
  "pt-PT": "Responde APENAS em portugues natural e falado.",
  "nl-NL": "Antwoord UITSLUITEND in natuurlijk gesproken Nederlands.",
};

function buildSystemPrompt(agent) {
  const toneMap = {
    chaleureux: "Adopte un ton chaleureux, amical et naturel comme a l'oral.",
    formel: "Adopte un ton professionnel et formel mais courtois.",
    direct: "Adopte un ton direct et efficace, va droit au but.",
  };
  const faqBlock = agent.faqs?.length
    ? "\n\nFAQ PRIORITAIRE — Utilise EXACTEMENT ces reponses si la question correspond, meme avec des fautes d'orthographe ou une formulation differente :\n" +
      agent.faqs.map((f, i) => `Q${i+1}: ${f.question}\nR${i+1}: ${f.answer}`).join("\n\n")
    : "";

  const integrations = [];
  if (agent.calendly_url) {
    integrations.push(`- Lien Calendly pour prise de RDV ou commande planifiee : ${agent.calendly_url}\n  Propose-le PROACTIVEMENT quand le client veut prendre un RDV, planifier une commande pour une date future, ou demande "comment commander".`);
  }
  if (agent.escalation_phone) {
    integrations.push(`- Numero de transfert humain : ${agent.escalation_phone}\n  TRANSFERT = DERNIER RECOURS ABSOLU. Ne propose ce transfert QUE dans ces cas :\n    1. Le client est clairement enerve, mecontent, ou demande explicitement "un humain" / "un conseiller" / "le manager".\n    2. Tu as deja tente de repondre 2 fois sans succes et le client insiste.\n    3. La demande est une urgence reelle (medicale, securite) ou une plainte formelle / litige / negociation de prix.\n  Pour TOUT le reste (horaires, services, prix listes, commandes, FAQ) : tu reponds TOI-MEME, jamais de transfert.`);
  }
  const integrationsBlock = integrations.length
    ? "\n\nINTEGRATIONS DISPONIBLES :\n" + integrations.join("\n\n")
    : "";

  return `Tu es ${agent.agent_name || "Callia"}, l'assistante telephonique IA de "${agent.name}" (${agent.sector}).

Description : ${agent.description}
Services proposes : ${agent.services}
Horaires : ${agent.hours}
Adresse : ${agent.address}
Telephone : ${agent.phone}${faqBlock}${integrationsBlock}

REGLES IMPORTANTES :
- ${toneMap[agent.tone] || toneMap.chaleureux}
- Reponds en francais naturel, comme a l'oral : 1 a 3 phrases courtes, jamais plus.
- Evite les formules robotiques ("Je suis la pour vous aider" est interdit).
- Si la question correspond a la FAQ (meme avec fautes), utilise la reponse FAQ.
- Si tu ne trouves pas en FAQ : tente d'aider avec les infos generales (description, services, horaires, adresse).
- Si tu n'as VRAIMENT pas l'info : reponds "Je ne suis pas sure de cela, voulez-vous que je prenne un message pour le responsable ?" — NE TRANSFERE PAS systematiquement.
- TRANSFERT HUMAIN = uniquement les 3 cas listes plus haut (enerve / 2 echecs / urgence-plainte). JAMAIS pour une simple question.
- Ne donne JAMAIS d'information que tu n'as pas recue ci-dessus.`;
}


// ─── Mini composant : barres audio reactives ─────────────────────────────
function AudioBars({ active, count = 16 }) {
  return (
    <div className="audio-bars" data-active={active ? "1" : "0"}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ animationDelay: (i * 60) + "ms" }} />
      ))}
    </div>
  );
}

// ─── Formatage durée ────────────────────────────────────────────────────
function formatDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

export default function PhoneSimulator({ agent, onClose, persistCalls = true }) {
  const [phase, setPhase]   = useState("ringing");  // ringing | active | ended
  const [msgs, setMsgs]     = useState([]);
  const [status, setStatus] = useState("waiting");  // waiting | listening | thinking | speaking
  const [input, setInput]   = useState("");
  const [hasSR, setHasSR]   = useState(false);
  const [duration, setDuration] = useState(0);
  const [transferred, setTransferred] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const apiHist     = useRef([]);
  const msgEnd      = useRef(null);
  const reco        = useRef(null);
  const callStart   = useRef(null);
  const durationTimer = useRef(null);
  const systemPrompt = useRef(buildSystemPrompt(agent));

  useEffect(() => { setHasSR("webkitSpeechRecognition" in window || "SpeechRecognition" in window); }, []);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => {
    if (phase === "active") {
      durationTimer.current = setInterval(() => {
        if (callStart.current) setDuration(Math.floor((Date.now() - callStart.current) / 1000));
      }, 1000);
      return () => clearInterval(durationTimer.current);
    }
  }, [phase]);

  const addMsg = (role, content, opts = {}) =>
    setMsgs(p => [...p, {
      role, content,
      ts: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      ...opts,
    }]);

  const answer = () => {
    setPhase("active");
    callStart.current = Date.now();
    const greeting = agent.greeting ||
      `${agent.name}, bonjour ! ${agent.agent_name || "Callia"} a l'appareil, que puis-je faire pour vous ?`;
    addMsg("assistant", greeting);
    apiHist.current = [{ role: "user", content: "Bonjour" }, { role: "assistant", content: greeting }];
    setStatus("speaking");
    speak(greeting, agent.language || "fr-FR", () => setStatus("speaking"), () => setStatus("waiting"));
  };

  const hangup = async () => {
    window.speechSynthesis?.cancel();
    reco.current?.abort();
    setPhase("ended");
    setStatus("waiting");
    if (persistCalls && msgs.filter(m => m.role === "user").length > 0) {
      try {
        const dur = callStart.current ? Math.round((Date.now() - callStart.current) / 1000) : null;
        await saveCall({ agent_id: agent.id, transcript: msgs, duration_sec: dur });
      } catch (e) { console.warn("Sauvegarde appel echouee:", e.message); }
    }
  };

  const respond = async (txt) => {
    addMsg("user", txt);
    setStatus("thinking");
    try {
      const reply = await askClaude({
        system: systemPrompt.current,
        history: apiHist.current,
        userMessage: txt,
      });
      apiHist.current = [...apiHist.current, { role: "user", content: txt }, { role: "assistant", content: reply }];
      addMsg("assistant", reply);
      setStatus("speaking");
      speak(reply, agent.language || "fr-FR", () => setStatus("speaking"), () => setStatus("waiting"));
    } catch (err) {
      const fallback = err.message?.includes("429")
        ? "Trop de requetes en rafale. Patiente quelques secondes."
        : "Desolee, une erreur s'est produite. Pouvez-vous repeter ?";
      addMsg("assistant", fallback);
      setStatus("waiting");
    }
  };

  const listen = () => {
    if (!hasSR || status !== "waiting") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); r.lang = agent.language || "fr-FR"; r.interimResults = false;
    reco.current = r;
    r.onresult = e => { setStatus("waiting"); respond(e.results[0][0].transcript); };
    r.onerror = () => setStatus("waiting");
    r.start(); setStatus("listening");
  };

  const sendText = () => {
    const t = input.trim(); if (!t || status !== "waiting") return;
    setInput(""); respond(t);
  };

  // Transfert vers humain
  const transferToHuman = () => {
    if (!agent.escalation_phone || transferred) return;
    setTransferred(true);
    const msg = `Je vous transfere a un conseiller au ${agent.escalation_phone}. Ne quittez pas, un instant je vous prie.`;
    addMsg("assistant", msg, { kind: "transfer" });
    setStatus("speaking");
    speak(msg, agent.language || "fr-FR", () => setStatus("speaking"), () => {
      setStatus("waiting");
      setTimeout(() => {
        addMsg("system", `Appel transfere vers ${agent.escalation_phone}`, { kind: "system" });
      }, 800);
    });
  };

  // Envoi de lien Calendly
  const sendCalendly = () => {
    if (!agent.calendly_url) return;
    const msg = `Je vous envoie le lien pour prendre rendez-vous en ligne : ${agent.calendly_url}`;
    addMsg("assistant", msg, { kind: "calendly", link: agent.calendly_url });
    apiHist.current = [...apiHist.current, { role: "assistant", content: msg }];
    setStatus("speaking");
    speak("Je vous envoie le lien pour prendre rendez-vous en ligne.", agent.language || "fr-FR", () => setStatus("speaking"), () => setStatus("waiting"));
  };

  const STATUS_LABEL = { waiting: "Connecte", listening: "Ecoute", thinking: "Reflechit", speaking: "Parle" };
  const STATUS_COLOR = { waiting: "var(--accent)", listening: "var(--cyan)", thinking: "var(--violet)", speaking: "var(--magenta)" };

  return (
    <div className="sim-overlay">
      <button className="sim-close" onClick={onClose} aria-label="Fermer">×</button>

      <div className="sim-stage">

        {/* ═══ PANNEAU GAUCHE : "TELEPHONE" futuriste ═══ */}
        <div className="sim-phone">
          <div className="sim-phone-aura" />

          <div className="sim-phone-inner">
            {/* Top status bar */}
            <div className="sim-statusbar">
              <span>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              <div className="sim-statusbar-right">
                <span className="sim-sig"><i /><i /><i /><i /></span>
                <span>5G</span>
                <span className="sim-batt" />
              </div>
            </div>

            {phase === "ringing" && (
              <div className="sim-ringing">
                <div className="sim-avatar-ring">
                  <div className="sim-avatar">{agent.agent_name?.[0] || "S"}</div>
                  <span className="sim-ring sim-ring-1" />
                  <span className="sim-ring sim-ring-2" />
                  <span className="sim-ring sim-ring-3" />
                </div>
                <div className="sim-callname">Appel entrant</div>
                <div className="sim-callfrom">{agent.agent_name || "Callia"} · {agent.name}</div>
                <div className="sim-callnum">{agent.phone}</div>

                <div className="sim-ringing-actions">
                  <button className="sim-action-btn decline" onClick={onClose} aria-label="Refuser">
                    <span>✕</span>
                  </button>
                  <button className="sim-action-btn accept" onClick={answer} aria-label="Decrocher">
                    <span>✓</span>
                  </button>
                </div>
              </div>
            )}

            {phase === "active" && (
              <>
                <div className="sim-active-head">
                  <div className="sim-avatar-active" style={{ borderColor: STATUS_COLOR[status] }}>
                    {agent.agent_name?.[0] || "S"}
                  </div>
                  <div className="sim-active-name">{agent.agent_name || "Callia"}</div>
                  <div className="sim-active-sub">{agent.name}</div>
                  <div className="sim-timer">{formatDuration(duration)}</div>
                </div>

                <AudioBars active={status === "listening" || status === "speaking"} />

                <div className="sim-status-pill" style={{ background: "color-mix(in srgb, " + STATUS_COLOR[status] + " 15%, transparent)", borderColor: "color-mix(in srgb, " + STATUS_COLOR[status] + " 35%, transparent)", color: STATUS_COLOR[status] }}>
                  <span className="dot" style={{ background: STATUS_COLOR[status] }} />
                  {STATUS_LABEL[status]}
                </div>

                <div className="sim-actions">
                  {hasSR && (
                    <button className="sim-action-btn mic" disabled={status !== "waiting"} onClick={listen}
                      title="Appuyer pour parler">
                      🎤
                    </button>
                  )}
                  <button className="sim-action-btn hangup" onClick={hangup} title="Raccrocher">
                    📵
                  </button>
                </div>
              </>
            )}

            {phase === "ended" && (
              <div className="sim-ended">
                <div className="sim-ended-icon">✓</div>
                <div className="sim-ended-title">Appel termine</div>
                <div className="sim-ended-sub">Duree : {formatDuration(duration)} · {msgs.filter(m => m.role !== "system").length} messages</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
                  <button onClick={() => setShowSummary(true)} className="btn btn-primary" style={{ width: "100%" }}>
                    ✨ Générer un résumé IA
                  </button>
                  <div className="sim-ringing-actions" style={{ marginTop: 4 }}>
                    <button className="sim-action-btn decline" onClick={onClose} style={{ width: "auto", height: "auto", padding: "10px 20px", borderRadius: 999, fontSize: 13, animation: "none" }}>Fermer</button>
                  <button className="sim-action-btn accept" onClick={() => {
                    setPhase("ringing"); setMsgs([]); apiHist.current = []; setStatus("waiting");
                    callStart.current = null; setDuration(0); setTransferred(false);
                  }}>Rappeler</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ PANNEAU DROIT : TRANSCRIPT + OUTILS ═══ */}
        {phase === "active" && (
          <div className="sim-side">
            <div className="sim-side-head">
              <div>
                <div className="sim-side-title">Conversation en direct</div>
                <div className="sim-side-sub">Transcript temps reel</div>
              </div>
              <div className="sim-side-stats">
                <div className="sim-stat-num">{msgs.filter(m => m.role !== "system").length}</div>
                <div className="sim-stat-label">messages</div>
              </div>
            </div>

            <div className="sim-transcript">
              {msgs.length === 0 && (
                <div className="sim-empty">L'appel commence...</div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={"sim-msg sim-msg-" + (m.kind === "system" ? "system" : m.role)}>
                  {m.kind !== "system" && (
                    <div className="sim-msg-meta">
                      <span className="sim-msg-author">{m.role === "user" ? "Client" : (m.kind === "transfer" ? "Transfert" : (agent.agent_name || "Callia"))}</span>
                      <span className="sim-msg-time">{m.ts}</span>
                    </div>
                  )}
                  <div className={"sim-msg-bubble" + (m.kind === "calendly" ? " calendly" : "") + (m.kind === "transfer" ? " transfer" : "")}>
                    {m.content}
                    {m.kind === "calendly" && m.link && (
                      <a href={m.link} target="_blank" rel="noreferrer" className="sim-msg-link">Ouvrir le lien ↗</a>
                    )}
                  </div>
                </div>
              ))}
              <div ref={msgEnd} />
            </div>

            {/* Outils rapides */}
            <div className="sim-tools">
              {agent.calendly_url && (
                <button className="sim-tool" onClick={sendCalendly} disabled={status !== "waiting"}>
                  📅 Envoyer Calendly
                </button>
              )}
              {agent.escalation_phone && !transferred && (
                <button className="sim-tool danger" onClick={transferToHuman} disabled={status !== "waiting"}>
                  ↗ Transferer humain
                </button>
              )}
            </div>


            {/* Input texte */}
            <div className="sim-input-row">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendText()}
                placeholder="Taper un message (ou utilise le micro)..."
                disabled={status !== "waiting"}
                className="sim-input"
              />
              <button onClick={sendText} disabled={!input.trim() || status !== "waiting"} className="sim-send">→</button>
            </div>
          </div>
        )}

        {/* Side panel "ended" : recap */}
        {phase === "ended" && msgs.length > 0 && (
          <div className="sim-side">
            <div className="sim-side-head">
              <div>
                <div className="sim-side-title">Recap de l'appel</div>
                <div className="sim-side-sub">Sauvegarde automatique</div>
              </div>
            </div>
            <div className="sim-transcript" style={{ maxHeight: "100%" }}>
              {msgs.map((m, i) => (
                <div key={i} className={"sim-msg sim-msg-" + (m.kind === "system" ? "system" : m.role)}>
                  <div className="sim-msg-meta">
                    <span className="sim-msg-author">{m.role === "user" ? "Client" : (agent.agent_name || "Callia")}</span>
                    <span className="sim-msg-time">{m.ts}</span>
                  </div>
                  <div className="sim-msg-bubble">{m.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      {showSummary && (
        <CallSummary
          agent={agent}
          transcript={msgs}
          callDate={callStart.current}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
