import { useState } from "react";
import "../styles/landing.css";

export default function AuthScreen({ onBackToLanding, onLogin }) {
  const [email, setEmail]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");

  const send = async (e) => {
    e.preventDefault();
    setError(""); setLoad(true);
    // Bypass magic link : accepte n'importe quel email valide et envoie direct au dashboard
    try {
      // Sauvegarde l'email localement pour le contexte de session simulée
      localStorage.setItem("callia_user_email", email);
    } catch {}
    setLoad(false);
    onLogin?.(email);
  };

  return (
    <div className="landing-root auth-screen-root" style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", position: "relative" }}>
      <div className="bg-grid" />
      <div className="bg-orbs">
        <div className="orb orb-1" style={{ top: "10%", left: "10%" }} />
        <div className="orb orb-2" style={{ bottom: "10%", right: "10%" }} />
      </div>
      <div className="bg-noise" />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 440 }}>

        {onBackToLanding && (
          <button onClick={onBackToLanding}
            style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 13, cursor: "pointer", padding: "6px 0", marginBottom: 18, fontFamily: "inherit" }}>
            &larr; Retour a l'accueil
          </button>
        )}

        <div className="auth-card" style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          border: "1px solid var(--line-strong)",
          borderRadius: 20,
          padding: "clamp(22px, 5vw, 38px)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px var(--accent-soft)"
        }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, var(--accent), var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 16px", boxShadow: "0 0 50px var(--accent-glow)" }}><svg viewBox="0 0 24 24" fill="none" style={{ width: 32, height: 32 }} xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="9" x2="4" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="8" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="9" x2="20" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text)" }}>Bienvenue sur Callia</h1>
            <p style={{ fontSize: 14, color: "var(--text-dim)", margin: "8px 0 0" }}>Connecte-toi pour gerer tes agents IA</p>
          </div>

          <form onSubmit={send}>
            <label style={{ display: "block", fontSize: 13, color: "var(--text-dim)", marginBottom: 8, fontWeight: 500 }}>Adresse email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
              style={{ width: "100%", padding: "12px 16px", fontSize: 14, borderRadius: 10, marginBottom: 16, fontFamily: "inherit", boxSizing: "border-box" }} />

            {error && (
              <div style={{ color: "#fca5a5", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                &#9888; {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: 14, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Connexion..." : "Accéder à mon espace →"}
            </button>

            <p style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
              Aucun mot de passe — accès immédiat avec votre email.<br/>
              Première visite = création automatique de votre espace.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
