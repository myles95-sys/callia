import { useEffect, useState, useRef } from "react";
import "../styles/landing.css";
import PhoneSimulator from "./PhoneSimulator.jsx";
import LiveSocialProof from "./LiveSocialProof.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// LandingPage — Site marketing futuriste pour Callia
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_AGENT = {
  id: "public-demo",
  name: "Boulangerie Le Croissant Doré",
  sector: "Restauration & commerce",
  description: "Boulangerie artisanale au cœur de Lyon depuis 2008, pains au levain naturel et pâtisseries faites maison sur place chaque matin.",
  services: "Pains traditionnels et spéciaux, viennoiseries, pâtisseries fines, sandwichs et formules midi, plateaux et gâteaux sur commande, café à emporter.",
  hours: "Mar-Sam 6h30-19h30, Dim 7h-13h, fermé le lundi",
  address: "12 rue Mercière, 69002 Lyon",
  phone: "+33 4 78 12 34 56",
  language: "fr-FR",
  agent_name: "Callia",
  tone: "chaleureux",
  calendly_url: "https://calendly.com/boulangerie-demo/commande",
  escalation_phone: "+33 6 12 34 56 78",
  faqs: [
    { question: "Quels sont vos horaires d'ouverture ?", answer: "Nous sommes ouverts du mardi au samedi de 6h30 à 19h30, et le dimanche de 7h à 13h. Nous sommes fermés le lundi." },
    { question: "Êtes-vous ouverts le dimanche ?", answer: "Oui, nous sommes ouverts le dimanche matin de 7h à 13h." },
    { question: "Êtes-vous ouverts le lundi ?", answer: "Non, nous sommes fermés tous les lundis. Notre prochaine ouverture sera le mardi à 6h30." },
    { question: "Où êtes-vous situés ? Quelle est votre adresse ?", answer: "Nous sommes au 12 rue Mercière, dans le 2e arrondissement de Lyon, juste à côté de la place des Jacobins." },
    { question: "Y a-t-il un parking à proximité ?", answer: "Le parking Cordeliers est à 2 minutes à pied, et il y a aussi du stationnement payant rue Mercière." },
    { question: "Faites-vous des commandes pour événements ou réunions ?", answer: "Oui, plateaux salés et sucrés sur commande avec 48h de préavis. À partir de 12 personnes. Vous pouvez réserver directement via notre lien Calendly." },
    { question: "Avez-vous des pains sans gluten ?", answer: "Oui, nous proposons un pain de sarrasin sans gluten les mercredis et samedis, sur réservation la veille au plus tard 18h." },
    { question: "Faites-vous des pains bio ?", answer: "Oui, tous nos pains au levain sont à base de farines bio T80 et T110 d'un moulin de la Drôme." },
    { question: "Acceptez-vous les tickets restaurant ?", answer: "Oui, nous acceptons les tickets restaurant papier et les cartes Swile, Edenred et Up, pour les achats jusqu'à 25 € par jour." },
    { question: "Acceptez-vous la carte bleue ?", answer: "Oui, nous acceptons toutes les cartes bancaires, le sans contact, Apple Pay et Google Pay, sans minimum d'achat." },
    { question: "Faites-vous des livraisons ?", answer: "Pour les commandes événementielles de plus de 50 €, nous livrons dans Lyon centre. Pour les commandes individuelles, nous sommes sur Uber Eats et Deliveroo." },
    { question: "Avez-vous des formules midi ou des sandwichs ?", answer: "Oui, nous proposons une formule à 9,90 € avec sandwich, boisson et dessert, disponible du mardi au samedi entre 11h30 et 14h30." },
    { question: "Faites-vous des gâteaux d'anniversaire sur commande ?", answer: "Bien sûr, nous réalisons des entremets personnalisés sur commande avec 72h de préavis. Comptez 30 à 60 € selon la taille et le décor." },
    { question: "Faites-vous la galette des rois en janvier ?", answer: "Oui, notre galette frangipane maison est disponible tout le mois de janvier, à 18 € pour 4 personnes et 26 € pour 6 personnes." },
    { question: "Faites-vous les bûches de Noël ?", answer: "Oui, notre carte de bûches sort mi-novembre. Sur commande uniquement, à retirer entre le 22 et le 31 décembre. À partir de 28 € pour 6 personnes." },
    { question: "Avez-vous des produits contenant des allergènes ?", answer: "Oui, beaucoup de nos produits contiennent du lait, des œufs ou des fruits à coque. Précisez-nous votre allergie en boutique, nous pourrons vous orienter." },
    { question: "Faites-vous du café à emporter ?", answer: "Oui, café à emporter à 1,80 € pour un expresso et 2,80 € pour un cappuccino. Avec votre propre mug, vous bénéficiez de 30 centimes de remise." },
    { question: "Y a-t-il des places assises sur place ?", answer: "Oui, nous avons une dizaine de places assises pour déguster vos achats sur place. Le Wi-Fi est gratuit avec le mot de passe affiché en caisse." },
    { question: "Faites-vous des cartes cadeau ?", answer: "Oui, cartes cadeau disponibles à partir de 10 € jusqu'à 100 €, valables 1 an dans notre boutique." },
    { question: "Recrutez-vous ? Acceptez-vous les stagiaires ?", answer: "Nous accueillons des apprentis CAP et BTM Boulanger toute l'année. Envoyez votre CV par mail à recrutement@croissant-dore.fr." },
    { question: "Quel est votre numéro de téléphone ou email ?", answer: "Vous nous appelez au +33 4 78 12 34 56, et notre email est bonjour@croissant-dore.fr. Réponse sous 24h en semaine." },
    { question: "Faites-vous des wedding cakes ou mariages ?", answer: "Oui, nous réalisons des pièces montées et wedding cakes sur devis personnalisé. Un rendez-vous dégustation est conseillé 2 mois à l'avance via notre Calendly." },
  ],
};

// ─── Typewriter effect ─────────────────────────────────────────────────────
function useTypewriter(words, speed = 80, pause = 1800) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    let t;
    if (!del && text.length < current.length) {
      t = setTimeout(() => setText(current.slice(0, text.length + 1)), speed);
    } else if (!del && text.length === current.length) {
      t = setTimeout(() => setDel(true), pause);
    } else if (del && text.length > 0) {
      t = setTimeout(() => setText(current.slice(0, text.length - 1)), speed / 2);
    } else if (del && text.length === 0) {
      setDel(false);
      setWordIdx((wordIdx + 1) % words.length);
    }
    return () => clearTimeout(t);
  }, [text, del, wordIdx, words, speed, pause]);

  return text;
}

// ─── Hook : reveal on scroll ───────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Counter animé ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "", duration = 1500 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val.toLocaleString("fr-FR")}{suffix}</span>;
}


// ─── Calculateur ROI ─────────────────────────────────────────────────────
function RoiCalculator() {
  const [callsPerDay, setCallsPerDay] = useState(20);
  const [avgValue, setAvgValue]       = useState(50);

  // Calculs
  const annualCalls   = callsPerDay * 30 * 12;
  const missedRate    = 0.30; // 30% appels manques sans IA
  const recovered     = Math.round(annualCalls * missedRate);
  const revenueGain   = recovered * avgValue;
  const standardCost  = 2200 * 12; // standardiste annuel
  const calliaCost    = 79 * 12;   // Callia Pro annuel
  const monthSaving   = (2200 - 79);
  const yearSaving    = monthSaving * 12 + revenueGain;
  const roiMonths     = calliaCost > 0 ? Math.max(1, Math.round((calliaCost / yearSaving) * 12)) : 1;

  return (
    <div className="roi-card reveal">
      <div className="roi-inputs">
        <div className="roi-slider-row">
          <label>Appels reçus par jour</label>
          <div className="roi-slider-value">{callsPerDay}</div>
        </div>
        <input
          type="range" min="5" max="100" step="1"
          value={callsPerDay}
          onChange={e => setCallsPerDay(Number(e.target.value))}
          className="roi-slider"
        />
        <div className="roi-slider-row" style={{ marginTop: 18 }}>
          <label>Valeur moyenne d'un client</label>
          <div className="roi-slider-value">{avgValue} €</div>
        </div>
        <input
          type="range" min="10" max="500" step="10"
          value={avgValue}
          onChange={e => setAvgValue(Number(e.target.value))}
          className="roi-slider"
        />
      </div>

      <div className="roi-results">
        <div className="roi-big">
          <div className="roi-big-label">Économies annuelles avec Callia</div>
          <div className="roi-big-value">
            {yearSaving.toLocaleString("fr-FR")} €<span style={{ fontSize: "1.4rem", color: "var(--text-dim)", fontWeight: 500 }}>/an</span>
          </div>
        </div>
        <div className="roi-mini-grid">
          <div className="roi-mini">
            <div className="roi-mini-label">Appels récupérés</div>
            <div className="roi-mini-value">{recovered.toLocaleString("fr-FR")}<span className="roi-unit">/an</span></div>
          </div>
          <div className="roi-mini">
            <div className="roi-mini-label">CA additionnel estimé</div>
            <div className="roi-mini-value">{revenueGain.toLocaleString("fr-FR")} €</div>
          </div>
          <div className="roi-mini">
            <div className="roi-mini-label">Économie vs standardiste</div>
            <div className="roi-mini-value">{(monthSaving * 12).toLocaleString("fr-FR")} €</div>
          </div>
          <div className="roi-mini">
            <div className="roi-mini-label">Retour sur investissement</div>
            <div className="roi-mini-value">{roiMonths < 1 ? "Immédiat" : roiMonths + " mois"}</div>
          </div>
        </div>
        <div className="roi-disclaimer">
          * Estimation basée sur 30% d'appels manqués sans IA (moyenne secteur PME) et un coût standardiste moyen de 2 200 €/mois.
        </div>
      </div>
    </div>
  );
}



// ─── Bouton remonter en haut ─────────────────────────────────────────────
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="scroll-top-btn"
      aria-label="Remonter en haut"
      title="Remonter en haut"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function LandingPage({ onCTA, theme, onToggleTheme }) {
  const [simOpen, setSimOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  useReveal();
  const typed = useTypewriter(
    ["décroche 24h/24.", "répond en 1 seconde.", "ne dort jamais.", "comprend vos clients.", "transforme l'attente en vente."],
    65, 1700
  );

  return (
    <div className="landing-root">
      {/* ─── Fond animé ─── */}
      <div className="bg-grid" />
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="bg-noise" />

      {/* ─── Navigation ─── */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <div className="land-logo">
            <div className="land-logo-mark"><svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="9" x2="4" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="8" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="9" x2="20" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
            Callia
          </div>
          <div className="land-nav-links">
            <a href="#features">Fonctionnalités</a>
            <a href="#how">Comment ça marche</a>
            <a href="#demo">Démo live</a>
            <a href="#pricing">Tarifs</a>
            <a href="#faq">FAQ</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onToggleTheme && (
              <button onClick={onToggleTheme} className="theme-toggle" title={theme === "dark" ? "Mode clair" : "Mode sombre"}>
                {theme === "dark" ? "☀" : "☽"}
              </button>
            )}
            <button className="btn btn-primary" onClick={onCTA}>
              Commencer →
            </button>
          </div>
        </div>
      </nav>

      <div className="landing-content">

        {/* ═══ HERO ═══ */}
        <section className="section hero">
          <div>
            <div className="hero-badge">
              <span className="dot" />
              Propulsé par Claude · Hébergé en France 🇪🇺
            </div>
            <h1 className="hero-title">
              Ne perdez plus jamais <br/>
              <span className="gradient">un appel client.</span>
            </h1>
            <p className="hero-plainspeak">
              Un <strong>employé virtuel</strong> qui décroche votre téléphone, répond à la place de votre standardiste, et <strong>ne dort jamais</strong>.
            </p>
            <p className="hero-subtitle">
              Pendant que vous travaillez, <strong style={{ color: "var(--text)" }}>Callia</strong> répond, prend des rendez-vous et oriente vos clients — 24h/24, en français naturel. Setup en 5 minutes.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={onCTA}>
                Créer mon agent gratuitement →
              </button>
              <button className="btn btn-secondary" onClick={() => setSimOpen(true)}>
                ▶ Tester en 30 secondes
              </button>
            </div>
            <div className="hero-trust-row">
              <div className="trust-pill"><span className="stars">★★★★★</span> 4.8/5</div>
              <div className="trust-pill"><strong>247</strong> PME actives</div>
              <div className="trust-pill">🛡 RGPD</div>
              <div className="trust-pill">💳 Sans CB</div>
              <div className="trust-pill">⚡ 5 min setup</div>
            </div>
          </div>

          {/* Phone mockup animé — cliquable pour ouvrir le simulateur */}
          <div className="phone-mock" onClick={() => setSimOpen(true)} style={{ cursor: "pointer" }} title="Cliquer pour tester">
            <div className="phone-try-hint">👆 Cliquez pour essayer</div>
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="phone-avatar"><svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }} xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="9" x2="4" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="8" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="9" x2="20" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
                <div className="phone-caller-name">Callia</div>
                <div className="phone-caller-sub">+33 4 78 12 34 56 · Boulangerie</div>
                <div className="phone-chat">
                  <div className="phone-msg user">Vous êtes ouverts dimanche ?</div>
                  <div className="phone-msg assistant">Oui, de 7h à 13h le dimanche matin.</div>
                  <div className="phone-msg user">Vous faites des plateaux ?</div>
                </div>
                <div className="phone-status">
                  <span className="dot" />
                  En appel · 00:32
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ MARQUEE secteurs ═══ */}
        <div className="marquee-wrap">
          <div className="marquee-label">Fait pour les PME de tous secteurs</div>
          <div className="marquee">
            {[...Array(2)].flatMap((_, i) => [
              { icn: "🥖", n: "Boulangeries" },
              { icn: "🏥", n: "Cabinets médicaux" },
              { icn: "🚗", n: "Garages" },
              { icn: "💇", n: "Salons de coiffure" },
              { icn: "🏠", n: "Agences immo" },
              { icn: "⚖️", n: "Cabinets d'avocats" },
              { icn: "🏨", n: "Hôtels & gîtes" },
              { icn: "🔨", n: "Artisans BTP" },
              { icn: "🎓", n: "Écoles & formations" },
              { icn: "🍽️", n: "Restaurants" },
            ].map((x, j) => (
              <div key={`${i}-${j}`} className="marquee-item">
                <span className="icn">{x.icn}</span> {x.n}
              </div>
            )))}
          </div>
        </div>

        {/* ═══ VIDEO DEMO ═══ */}
        <section className="section" id="demo-video">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>Voir en action</div>
            <h2 className="section-title" style={{ margin: "0 auto 18px" }}>Une démo qui parle d'elle-même.</h2>
            <p className="section-lede" style={{ margin: "0 auto 40px" }}>
              Plutôt que de lire 10 pages de doc — écoutez Callia répondre à un vrai appel client.
            </p>
          </div>

          <div className="video-frame reveal" onClick={() => setSimOpen(true)}>
            <div className="video-thumb">
              {/* Mock vidéo : grand téléphone en arrière-plan + boutons play */}
              <div className="video-bg-grid" />
              <div className="video-bg-orb video-bg-orb-1" />
              <div className="video-bg-orb video-bg-orb-2" />

              <div className="video-content">
                <div className="video-play-btn">
                  <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor">
                    <path d="M10 6 L26 16 L10 26 Z" />
                  </svg>
                  <span className="video-play-pulse" />
                </div>
                <div className="video-title">Appel typique d'un client</div>
                <div className="video-sub">Boulangerie Le Croissant Doré · 2 min 14</div>
              </div>

              <div className="video-badges">
                <span className="video-badge">📞 Décroche en 1s</span>
                <span className="video-badge">🇫🇷 Voix française</span>
                <span className="video-badge">✨ Prend RDV</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section className="section" id="features">
          <div className="reveal">
            <div className="section-eyebrow">Fonctionnalités</div>
            <h2 className="section-title">Tout ce qu'un standard humain fait. Sans pauses café.</h2>
            <p className="section-lede">
              Callia est aussi naturelle qu'un employé bien formé, mais elle ne tombe jamais malade, ne prend jamais de vacances, et coûte le prix d'un café par jour.
            </p>
          </div>

          <div className="features-grid">
            {[
              { icon: "🎙️", title: "Voix française naturelle", desc: "Reconnaissance vocale en temps réel et synthèse vocale naturelle. Vos clients ne se sentent jamais face à un robot." },
              { icon: "🧠", title: "Comprend vraiment", desc: "Propulsé par Claude (Anthropic), Callia comprend les nuances, les accents et les questions formulées en langage courant." },
              { icon: "📋", title: "FAQ personnalisée", desc: "Tu remplis un formulaire avec les questions de tes clients et tes vraies réponses. Callia les utilise mot pour mot." },
              { icon: "📞", title: "Numéro local", desc: "Connecte ton numéro existant ou obtiens un +33, +32, +41, +225, +243… via Twilio ou Africa's Talking." },
              { icon: "📊", title: "Historique complet", desc: "Chaque appel est transcrit, horodaté et sauvegardé. Tu sais exactement ce qui a été dit, à qui et quand." },
              { icon: "🔐", title: "Sécurisé bout-en-bout", desc: "Clé API serveur, Row Level Security Supabase, magic link. Tes données restent les tiennes." },
              { icon: "💬", title: "Multi-canal", desc: "Voix téléphonique, WhatsApp Business, SMS — Callia parle sur tous les canaux où tes clients sont." },
              { icon: "⚡", title: "5 minutes pour démarrer", desc: "Crée ton agent, remplis ta FAQ, teste dans le navigateur. En production le jour même." },
              { icon: "🌍", title: "17 pays francophones", desc: "France, Belgique, Suisse, Canada, Maroc, Sénégal, Côte d'Ivoire, RD Congo, Cameroun… Callia connaît les codes locaux." },
            ].map((f, i) => (
              <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>


        {/* ═══ ROI CALCULATOR ═══ */}
        <section className="section" id="roi">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>Calculateur ROI</div>
            <h2 className="section-title" style={{ margin: "0 auto 18px" }}>Combien Callia vous fait-elle économiser ?</h2>
            <p className="section-lede" style={{ margin: "0 auto 48px" }}>
              Bougez le curseur. Le résultat est calculé en temps réel.
            </p>
          </div>
          <RoiCalculator />
        </section>

        {/* ═══ AVANT / APRÈS ═══ */}
        <section className="section" id="avantapres">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>Avant · Après</div>
            <h2 className="section-title" style={{ margin: "0 auto 18px" }}>La différence est immédiate.</h2>
          </div>
          <div className="ba-grid">
            <div className="ba-col ba-before reveal">
              <div className="ba-header">
                <div className="ba-icon">❌</div>
                <div className="ba-title">Sans Callia</div>
                <div className="ba-sub">Standard téléphonique classique</div>
              </div>
              <ul className="ba-list">
                <li>30% des appels manqués en moyenne</li>
                <li>Disponible 8h-18h uniquement</li>
                <li>Coût standardiste : <strong>2 200 €/mois</strong></li>
                <li>File d'attente, clients frustrés</li>
                <li>Pas de transcript des appels</li>
                <li>Tombe malade, prend congé</li>
                <li>Demande 2 semaines de formation</li>
              </ul>
            </div>
            <div className="ba-col ba-after reveal" style={{ transitionDelay: "120ms" }}>
              <div className="ba-header">
                <div className="ba-icon">✓</div>
                <div className="ba-title">Avec Callia</div>
                <div className="ba-sub">Agent IA téléphonique</div>
              </div>
              <ul className="ba-list">
                <li><strong>0% d'appels manqués</strong> — décroche en 1 seconde</li>
                <li>Disponible <strong>24h/24, 7j/7</strong>, jours fériés inclus</li>
                <li>Coût Callia Pro : <strong>79 €/mois</strong> (96% moins cher)</li>
                <li>Réponse instantanée, ton naturel</li>
                <li>Transcript complet + résumé IA</li>
                <li>Ne dort jamais, ne tombe jamais malade</li>
                <li>Setup en <strong>5 minutes</strong>, sans formation</li>
              </ul>
            </div>
          </div>
        </section>

                {/* ═══ HOW IT WORKS ═══ */}
        <section className="section" id="how">
          <div className="reveal">
            <div className="section-eyebrow">Comment ça marche</div>
            <h2 className="section-title">De zéro à ton premier appel en 5 minutes.</h2>
            <p className="section-lede">Pas de code à écrire. Pas de jargon technique. Tu remplis un formulaire et Callia est prête.</p>
          </div>

          <div className="steps">
            {[
              { n: "1", title: "Décris ton entreprise", desc: "Nom, secteur, horaires, services, adresse. 2 minutes." },
              { n: "2", title: "Liste tes 5 questions fréquentes", desc: "Tu écris ce que tu réponds normalement au téléphone. Callia réutilise mot pour mot." },
              { n: "3", title: "Teste, déploie, encaisse", desc: "Simulateur intégré, puis branchement sur ton numéro réel. Tes clients ne raccrochent plus jamais." },
            ].map((s, i) => (
              <div key={i} className="step reveal" style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ DEMO ═══ */}
        <section className="section" id="demo">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>Démo live</div>
            <h2 className="section-title" style={{ margin: "0 auto 18px" }}>Appelle Callia maintenant.</h2>
            <p className="section-lede" style={{ margin: "0 auto 40px" }}>
              Pas d'inscription, pas de carte bancaire. Une vraie boulangerie fictive, une vraie conversation. Clique pour entendre Callia répondre à tes questions.
            </p>

            <button className="btn btn-primary" onClick={() => setSimOpen(true)} style={{ fontSize: "16px", padding: "16px 32px" }}>
              📞 Lancer un appel test
            </button>
          </div>
        </section>

        {/* ═══ STATS — Big hero stat ═══ */}
        <section className="section">
          <div className="big-stat reveal">
            <div className="big-stat-eyebrow">L'IMPACT EN CHIFFRES</div>
            <div className="big-stat-number">
              <Counter target={97} suffix="%" />
            </div>
            <div className="big-stat-label">
              d'appels traités <span style={{ color: "var(--accent)" }}>sans intervention humaine</span>
            </div>
            <div className="big-stat-mini">
              <div><strong><Counter target={1.2} suffix="s" /></strong> Temps de réponse</div>
              <div><strong>24/7</strong> Disponibilité</div>
              <div><strong><Counter target={17} /></strong> Pays francophones</div>
              <div><strong><Counter target={247} /></strong> PME actives</div>
            </div>
          </div>
        </section>

        {/* ═══ INDUSTRIES ═══ */}
        <section className="section">
          <div className="reveal">
            <div className="section-eyebrow">Industries</div>
            <h2 className="section-title">Adapté à ton métier, quel qu'il soit.</h2>
            <p className="section-lede">Plus de 200 PME francophones utilisent déjà Callia dans des secteurs très variés.</p>
          </div>

          <div className="industries-grid">
            {[
              { icon: "🥖", name: "Boulangerie", key: "boulangerie" },
              { icon: "🏥", name: "Santé", key: "medical" },
              { icon: "🚗", name: "Auto", key: "garage" },
              { icon: "💇", name: "Beauté", key: "coiffure" },
              { icon: "🏠", name: "Immobilier", key: "immobilier" },
              { icon: "⚖️", name: "Juridique", key: "avocat" },
              { icon: "🏨", name: "Hôtellerie", key: "hotel" },
              { icon: "🔨", name: "BTP" },
              { icon: "🎓", name: "Formation" },
              { icon: "🍽️", name: "Restauration", key: "restaurant" },
              { icon: "💼", name: "Conseil" },
              { icon: "🛒", name: "E-commerce" },
            ].map((s, i) => (
              <a
                key={i}
                className="industry-card reveal"
                href={s.key ? `#/sector/${s.key}` : "#"}
                onClick={e => { if (!s.key) e.preventDefault(); }}
                style={{ transitionDelay: `${i * 40}ms`, textDecoration: "none", display: "block", position: "relative" }}
                title={s.key ? `Voir la page ${s.name}` : "Bientôt disponible"}
              >
                <div className="industry-icon">{s.icon}</div>
                <div className="industry-name">{s.name}</div>
                {s.key && <div className="industry-link-hint">Voir →</div>}
              </a>
            ))}
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section className="section" id="pricing">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>Tarifs</div>
            <h2 className="section-title" style={{ margin: "0 auto 18px" }}>Moins cher qu'un café par jour.</h2>
            <p className="section-lede" style={{ margin: "0 auto 56px" }}>
              Aucun engagement. Annule en un clic. Premier mois gratuit pour tester.
            </p>
          </div>

          <div className="pricing-grid">
            <div className="price-card reveal">
              <div className="price-name">Starter</div>
              <div className="price-amount"><span className="currency">€</span>29<span className="period">/mois</span></div>
              <div className="price-tag">Pour démarrer, jusqu'à 100 appels/mois</div>
              <ul className="price-features">
                <li>1 agent IA</li>
                <li>100 appels inclus</li>
                <li>Numéro standard</li>
                <li>Historique 30 jours</li>
                <li>Support par email</li>
              </ul>
              <button className="btn btn-secondary" onClick={onCTA}>Commencer</button>
            </div>

            <div className="price-card featured reveal">
              <div className="price-badge">⭐ POPULAIRE</div>
              <div className="price-name">Pro</div>
              <div className="price-amount"><span className="currency">€</span>79<span className="period">/mois</span></div>
              <div className="price-tag">Pour les PME actives, jusqu'à 500 appels/mois</div>
              <ul className="price-features">
                <li>3 agents IA</li>
                <li>500 appels inclus</li>
                <li>Numéro local au choix</li>
                <li>WhatsApp Business inclus</li>
                <li>Historique illimité</li>
                <li>Support prioritaire</li>
                <li>Statistiques avancées</li>
              </ul>
              <button className="btn btn-primary" onClick={onCTA}>Essayer 30 jours</button>
            </div>

            <div className="price-card reveal">
              <div className="price-name">Enterprise</div>
              <div className="price-amount">Sur mesure</div>
              <div className="price-tag">Pour gros volume ou besoins spécifiques</div>
              <ul className="price-features">
                <li>Agents illimités</li>
                <li>Appels illimités</li>
                <li>Intégration CRM (HubSpot, Salesforce…)</li>
                <li>Custom branding</li>
                <li>SLA 99,9%</li>
                <li>Account manager dédié</li>
                <li>Formation équipe</li>
              </ul>
              <button className="btn btn-secondary" onClick={onCTA}>Nous contacter</button>
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="section">
          <div className="reveal">
            <div className="section-eyebrow">Témoignages</div>
            <h2 className="section-title">Ils ne décrochent plus le téléphone (et c'est tant mieux).</h2>
          </div>

          <div className="testimonials">
            {[
              { quote: "On perdait au moins 30% des appels en pleine rush. Depuis Callia, zéro client raté.", name: "Élise Marchand", role: "Boulangerie · Lyon", seed: "elise-m", metric: "+18% CA" },
              { quote: "Je suis dentiste, pas standardiste. Callia qualifie les urgences et me transfère uniquement le critique.", name: "Dr Mboma Kalu", role: "Cabinet dentaire · Abidjan", seed: "mboma-k", metric: "−6h/semaine" },
              { quote: "Configuration en 10 minutes. Le soir même, ma première cliente prenait rendez-vous via Callia.", name: "Yasmine Drahi", role: "Salon de coiffure · Marseille", seed: "yasmine-d", metric: "0 RDV raté" },
            ].map((t, i) => (
              <div key={i} className="testimonial reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="testimonial-metric">{t.metric}</div>
                <div className="testimonial-quote">« {t.quote} »</div>
                <div className="testimonial-author">
                  <img className="testimonial-avatar-img" src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${t.seed}&backgroundColor=00e09d,06b6d4,a855f7&radius=50`} alt={t.name} />
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="section" id="faq">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>FAQ</div>
            <h2 className="section-title" style={{ margin: "0 auto 18px" }}>Vos questions, nos réponses.</h2>
          </div>

          <div className="faq-list reveal">
            {[
              { q: "Callia remplace-t-elle vraiment un humain ?",
                a: "Pour 95% des appels entrants (questions sur horaires, services, tarifs, prise de RDV simple), oui. Pour les cas complexes ou émotionnels, elle prend un message et te le transfère immédiatement par email/SMS." },
              { q: "Combien de temps pour la mettre en place ?",
                a: "5 à 10 minutes. Tu remplis un formulaire avec les infos de ton entreprise et tes questions fréquentes, tu testes dans le navigateur, c'est prêt. Brancher un vrai numéro prend 1h supplémentaire." },
              { q: "Mes clients vont-ils savoir que c'est une IA ?",
                a: "Callia ne se cache pas, mais elle est si naturelle que beaucoup de tes clients ne s'en rendront pas compte. Tu peux choisir un ton chaleureux, formel, ou direct selon ton image." },
              { q: "Quels pays sont supportés ?",
                a: "17 pays francophones : France, Belgique, Suisse, Luxembourg, Canada, Maroc, Algérie, Tunisie, Sénégal, Côte d'Ivoire, RD Congo, Cameroun, Mali, Burkina Faso, Bénin, Togo, Gabon." },
              { q: "Que se passe-t-il si Callia ne sait pas répondre ?",
                a: "Elle reconnaît ses limites — elle propose de prendre un message, de transférer vers un conseiller, ou de programmer un rappel. Elle n'invente jamais de réponse." },
              { q: "Mes données sont-elles en sécurité ?",
                a: "Hébergement européen, chiffrement bout-en-bout, Row Level Security (chaque client n'accède qu'à ses données). Conformité RGPD. Les transcripts t'appartiennent à 100%." },
            ].map((f, i) => (
              <div key={i} className={"faq-item" + (faqOpen === i ? " open" : "")}>
                <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                  {f.q}
                  <span className="chevron">⌄</span>
                </button>
                {faqOpen === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CTA finale ═══ */}
        <section className="section">
          <div className="final-cta reveal">
            <h2>Prêt à ne plus jamais rater un client ?</h2>
            <p>Crée ton agent en 5 minutes. Teste gratuitement. Annule en un clic si ça ne te plaît pas.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={onCTA} style={{ fontSize: "16px", padding: "16px 32px" }}>
                Créer mon agent gratuitement →
              </button>
              <button className="btn btn-secondary" onClick={() => setSimOpen(true)} style={{ fontSize: "16px", padding: "16px 32px" }}>
                Tester d'abord
              </button>
            </div>
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="land-footer">
          <div className="land-footer-inner">
            <div>© 2026 Callia · Propulsé par Claude (Anthropic)</div>
            <div style={{ display: "flex", gap: 18 }}>
              <a href="#">Confidentialité</a>
              <a href="#">CGU</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Bouton flottant persistent — tester depuis n'importe où */}
      {!simOpen && (
        <button className="floating-cta" onClick={() => setSimOpen(true)} aria-label="Tester Callia maintenant">
          <span className="floating-cta-icon">📞</span>
          <span className="floating-cta-text">Essayer Callia</span>
          <span className="floating-cta-pulse" />
        </button>
      )}

      <ScrollToTopButton />

      {/* Social proof temps reel */}
      {!simOpen && <LiveSocialProof />}

      {/* Simulateur public */}
      {simOpen && <PhoneSimulator agent={DEMO_AGENT} onClose={() => setSimOpen(false)} persistCalls={false} />}
    </div>
  );
}
