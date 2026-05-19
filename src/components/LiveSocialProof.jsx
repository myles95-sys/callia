import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// LiveSocialProof — Toast rotatif "Marie de Lyon vient de tester Callia"
// Affichage en bas à gauche, rotation toutes les 7s
// ═══════════════════════════════════════════════════════════════════════════

const FIRST_NAMES = [
  "Marie", "Pierre", "Sophie", "Thomas", "Élise", "Lucas", "Camille",
  "Antoine", "Yasmine", "Karim", "Léa", "Mathieu", "Aïcha", "Nicolas",
  "Sarah", "Hugo", "Chloé", "Mehdi", "Julie", "David", "Aminata",
];

const CITIES = [
  "Lyon", "Paris", "Bordeaux", "Bruxelles", "Genève", "Abidjan", "Marseille",
  "Toulouse", "Nantes", "Strasbourg", "Lille", "Casablanca", "Dakar",
  "Montréal", "Genève", "Nice", "Rennes", "Liège", "Tunis", "Yaoundé",
];

const SECTORS = [
  { name: "boulangerie", emoji: "🥖" },
  { name: "cabinet médical", emoji: "🏥" },
  { name: "salon de coiffure", emoji: "💇" },
  { name: "garage auto", emoji: "🚗" },
  { name: "restaurant", emoji: "🍽️" },
  { name: "hôtel", emoji: "🏨" },
  { name: "agence immo", emoji: "🏠" },
  { name: "pharmacie", emoji: "💊" },
];

function pick(arr, seed) {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

function generateEvents(count = 30) {
  const events = [];
  for (let i = 0; i < count; i++) {
    const s = Math.sin(i * 13.7 + 100) * 10000;
    const r = (k) => { const x = Math.sin(s + k) * 10000; return x - Math.floor(x); };
    const type = ["signup", "test", "saving", "call", "deploy", "qr"][Math.floor(r(1) * 6)];
    const name = pick(FIRST_NAMES, r(2));
    const city = pick(CITIES, r(3));
    const sector = pick(SECTORS, r(4));
    const seconds = Math.floor(r(5) * 90) + 5;
    const ago = seconds < 60 ? `il y a ${seconds}s` : `il y a ${Math.floor(seconds / 60)} min`;

    let evt;
    switch (type) {
      case "signup":
        evt = { icon: "🆕", text: `${name} de ${city} vient de créer son agent Callia`, sub: `${sector.emoji} ${sector.name} · ${ago}` };
        break;
      case "test":
        evt = { icon: "📞", text: `${name} de ${city} teste Callia en ce moment`, sub: `${sector.emoji} ${sector.name} · ${ago}` };
        break;
      case "saving":
        evt = { icon: "💶", text: `Une ${sector.name} de ${city} a économisé ${(800 + Math.floor(r(6) * 2000)).toLocaleString("fr-FR")} € ce mois-ci`, sub: `Plan Pro · ${ago}` };
        break;
      case "call":
        evt = { icon: "✓", text: `Callia vient de traiter un appel pour ${name}`, sub: `${sector.emoji} ${city} · ${ago}` };
        break;
      case "deploy":
        evt = { icon: "🚀", text: `${name} a connecté son numéro Twilio à Callia`, sub: `${sector.emoji} ${city} · ${ago}` };
        break;
      case "qr":
        evt = { icon: "📱", text: `Une ${sector.name} de ${city} a généré son QR code public`, sub: `Plan Pro · ${ago}` };
        break;
      default:
        evt = { icon: "✓", text: "Callia est actif", sub: "Maintenant" };
    }
    events.push(evt);
  }
  return events;
}

export default function LiveSocialProof({ delay = 4000, interval = 7000 }) {
  const [events] = useState(() => generateEvents(40));
  const [idx, setIdx] = useState(-1);    // -1 = pas encore affiché
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Affichage initial après le délai
    const t0 = setTimeout(() => {
      setIdx(0);
      setVisible(true);
    }, delay);
    return () => clearTimeout(t0);
  }, [delay]);

  useEffect(() => {
    if (idx < 0) return;
    // Cache après 5s, puis affiche le suivant après interval - 5s
    const hideAt = setTimeout(() => setVisible(false), 5500);
    const nextAt = setTimeout(() => {
      setIdx(i => (i + 1) % events.length);
      setVisible(true);
    }, interval);
    return () => { clearTimeout(hideAt); clearTimeout(nextAt); };
  }, [idx, events.length, interval]);

  if (idx < 0) return null;
  const evt = events[idx];

  return (
    <div className={"live-proof" + (visible ? " visible" : "")} aria-hidden={!visible}>
      <div className="live-proof-pulse" />
      <div className="live-proof-icon">{evt.icon}</div>
      <div className="live-proof-content">
        <div className="live-proof-text">{evt.text}</div>
        <div className="live-proof-sub">{evt.sub}</div>
      </div>
    </div>
  );
}
