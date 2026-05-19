import { useEffect, useState } from "react";
import { supabase, HAS_SUPABASE } from "./lib/supabase.js";
import { checkBackendHealth } from "./lib/api.js";
import AuthScreen      from "./components/AuthScreen.jsx";
import Dashboard       from "./components/Dashboard.jsx";
import AgentEditor     from "./components/AgentEditor.jsx";
import DeployTab       from "./components/DeployTab.jsx";
import PhoneSimulator  from "./components/PhoneSimulator.jsx";
import LandingPage     from "./components/LandingPage.jsx";
import StatsTab        from "./components/StatsTab.jsx";
import TemplatePicker  from "./components/TemplatePicker.jsx";
import OnboardingWizard from "./components/OnboardingWizard.jsx";
import PublicAgentPage  from "./components/PublicAgentPage.jsx";
import AdminPanel       from "./components/AdminPanel.jsx";
import SectorPage       from "./components/SectorPage.jsx";
import "./App.css";

// Routing simple sans react-router :
//   - non authentifie  => LandingPage (ou AuthScreen si user clique "Commencer")
//   - authentifie      => Dashboard

export default function App() {
  const [session, setSession]    = useState(null);
  const [ready, setReady]        = useState(false);
  const [view, setView]          = useState("landing");
  const [tab, setTab]            = useState("dashboard");
  const [calling, setCalling]    = useState(null);
  const [editing, setEditing]    = useState(null);
  const [pickingTemplate, setPickingTemplate] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sectorKey, setSectorKey] = useState(() => {
    if (typeof window === "undefined") return null;
    const h = window.location.hash || "";
    const m = h.match(/^#\/sector\/(.+)$/);
    return m ? m[1] : null;
  });
  const [publicAgentId, setPublicAgentId] = useState(() => {
    if (typeof window === "undefined") return null;
    const h = window.location.hash || "";
    const m = h.match(/^#\/p\/(.+)$/);
    return m ? m[1] : null;
  });
  const [refreshKey, setRefresh] = useState(0);
  const [health, setHealth]      = useState({ ok: false, hasAnthropicKey: false });
  const [theme, setTheme]        = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("callia-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("callia-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  useEffect(() => {
    // Restaure une session "simple" (bypass magic link) si email déjà saisi
    try {
      const savedEmail = localStorage.getItem("callia_user_email");
      if (savedEmail) {
        setSession({ user: { email: savedEmail, id: "local-" + savedEmail } });
        setView("app");
      }
    } catch {}

    if (!HAS_SUPABASE) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setView("app");
      }
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) {
        setSession(s);
        setView("app");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSimpleLogin = (email) => {
    setSession({ user: { email, id: "local-" + email } });
    setView("app");
  };

  useEffect(() => { checkBackendHealth().then(setHealth); }, []);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash || "";
      const mp = h.match(/^#\/p\/(.+)$/);
      const ms = h.match(/^#\/sector\/(.+)$/);
      setPublicAgentId(mp ? mp[1] : null);
      setSectorKey(ms ? ms[1] : null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);


  // Onboarding au premier passage dans l'app (apres login)
  useEffect(() => {
    if (!ready) return;
    if (view !== "app") return;
    const seen = typeof window !== "undefined" && localStorage.getItem("callia-onboarded");
    if (!seen) setShowOnboarding(true);
  }, [ready, view]);

  const closeOnboarding = (created) => {
    localStorage.setItem("callia-onboarded", "1");
    setShowOnboarding(false);
    if (created) setRefresh(k => k + 1);
  };


  if (sectorKey) {
    return <SectorPage
      sectorKey={sectorKey}
      onExit={() => { window.location.hash = ""; setSectorKey(null); }}
      onCTA={() => { window.location.hash = ""; setSectorKey(null); setView(HAS_SUPABASE ? "auth" : "app"); }}
    />;
  }

  if (publicAgentId) {
    return <PublicAgentPage agentId={publicAgentId} onExit={() => { window.location.hash = ""; setPublicAgentId(null); }} />;
  }

  if (!ready) return <LoadingShell />;

  if (view === "landing" && !session) {
    return <LandingPage onCTA={() => setView(HAS_SUPABASE ? "auth" : "app")} theme={theme} onToggleTheme={toggleTheme} />;
  }

  if (view === "auth" && !session) {
    return <AuthScreen onBackToLanding={() => setView("landing")} onLogin={handleSimpleLogin} />;
  }

  const userEmail = session?.user?.email;
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = !HAS_SUPABASE || (userEmail && ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  const signOut = async () => {
    try { localStorage.removeItem("callia_user_email"); } catch {}
    if (HAS_SUPABASE) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setSession(null);
    setView("landing");
  };

  if (editing) {
    return (
      <div className="app-shell">
        <div className="app-container">
          <Header
            userEmail={userEmail}
            onSignOut={signOut}
            demoMode={!HAS_SUPABASE}
            health={health}
            onHome={() => { setEditing(null); setView("landing"); }}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => setEditing(null)}
              style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", padding: "6px 0", fontFamily: "inherit" }}
            >
              &larr; Retour aux agents
            </button>
          </div>
          <AgentEditor
            initial={editing.agent || null}
            onSaved={() => { setEditing(null); setRefresh(k => k + 1); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "dashboard", label: "Mes agents" },
    { id: "stats",     label: "Statistiques" },
    { id: "deploy",    label: "Déployer en production" },
    ...(isAdmin ? [{ id: "admin", label: "🛡 Admin" }] : []),
  ];

  return (
    <div className="app-shell">
      <div className="app-container">
        <Header
          userEmail={userEmail}
          onSignOut={signOut}
          demoMode={!HAS_SUPABASE}
          health={health}
          onHome={() => setView("landing")}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {!health.hasAnthropicKey && (
          <Banner
            tone="warn"
            icon="!"
            title="Cle Anthropic manquante"
            message="Ajoute ANTHROPIC_API_KEY dans le fichier .env du serveur pour que l'agent puisse repondre. Voir .env.example."
          />
        )}
        {!HAS_SUPABASE && (
          <Banner
            tone="info"
            icon="i"
            title="Mode demo (sans persistance)"
            message="Pour passer en mode production : configure VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env, puis execute supabase/schema.sql."
          />
        )}

        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: "1.5rem",
            borderBottom: "1px solid var(--line)",
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                background: "transparent",
                color: tab === t.id ? "var(--accent)" : "var(--text-dim)",
                marginBottom: -1,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <Dashboard
            refreshKey={refreshKey}
            onCall={a => setCalling(a)}
            onEdit={a => setEditing({ mode: "edit", agent: a })}
            onNew={() => setPickingTemplate(true)}
          />
        )}
        {tab === "stats"  && <StatsTab />}
        {tab === "deploy" && <DeployTab />}
        {tab === "admin"  && isAdmin && <AdminPanel />}

        {showOnboarding && (
          <OnboardingWizard
            onDone={(created) => closeOnboarding(created)}
            onSkip={() => closeOnboarding(null)}
          />
        )}

        {pickingTemplate && (
          <TemplatePicker
            onPick={(tpl) => { setPickingTemplate(false); setEditing({ mode: "new", agent: tpl }); }}
            onClose={() => setPickingTemplate(false)}
          />
        )}

        {calling && (
          <PhoneSimulator
            agent={calling}
            onClose={() => setCalling(null)}
            persistCalls={HAS_SUPABASE}
          />
        )}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-0)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--cyan))",
          margin: "0 auto 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          animation: "pulseGlow 1.4s ease-in-out infinite",
          boxShadow: "0 0 40px var(--accent-glow)"
        }}><svg viewBox="0 0 24 24" fill="none" style={{ width: 32, height: 32 }} xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="9" x2="4" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="8" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="9" x2="20" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
        <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Chargement...</div>
      </div>
    </div>
  );
}

function Header({ userEmail, onSignOut, demoMode, health, onHome, theme, onToggleTheme }) {
  const online = health.ok && health.hasAnthropicKey;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "1.75rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid var(--line)"
    }}>
      <button onClick={onHome} style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontFamily: "inherit",
        color: "inherit"
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "linear-gradient(135deg, var(--accent), var(--cyan))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          boxShadow: "0 0 25px var(--accent-glow)"
        }}><svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }} xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="9" x2="4" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="8" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="18" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="9" x2="20" y2="15" stroke="#001a12" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1, color: "var(--text)" }}>
            Callia <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-dim)" }}>Platform</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Agents telephoniques IA pour PME francophones</div>
        </div>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          fontSize: 11,
          padding: "4px 10px",
          borderRadius: 99,
          background: online ? "var(--accent-soft)" : "rgba(245, 158, 11, 0.15)",
          color: online ? "var(--accent)" : "var(--warn)",
          fontWeight: 500,
          border: online ? "1px solid rgba(0, 224, 157, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)"
        }}>
          {online ? "En ligne" : "Config incomplete"}
        </span>
        <button onClick={onToggleTheme} className="theme-toggle" title={theme === "dark" ? "Mode clair" : "Mode sombre"}>{theme === "dark" ? "☀" : "☽"}</button>
        {userEmail && (
          <>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{userEmail}</span>
            <button onClick={onToggleTheme} className="theme-toggle" title={theme === "dark" ? "Mode clair" : "Mode sombre"}>{theme === "dark" ? "☀" : "☽"}</button>
            <button onClick={onSignOut} title="Se deconnecter" style={{
              background: "transparent",
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              color: "var(--text-dim)",
              cursor: "pointer",
              fontFamily: "inherit"
            }}>Deconnexion</button>
          </>
        )}
        {demoMode && (
          <span style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 99,
            background: "rgba(245, 158, 11, 0.15)",
            color: "var(--warn)",
            fontWeight: 500,
            border: "1px solid rgba(245, 158, 11, 0.25)"
          }}>Mode demo</span>
        )}
      </div>
    </div>
  );
}

function Banner({ tone, icon, title, message }) {
  const colors = tone === "warn"
    ? { bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)", title: "var(--warn)", text: "#fcd34d" }
    : { bg: "rgba(6, 182, 212, 0.08)", border: "rgba(6, 182, 212, 0.25)", title: "var(--cyan)", text: "#67e8f9" };
  return (
    <div style={{
      background: colors.bg,
      border: "1px solid " + colors.border,
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 16,
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.title, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: colors.text, lineHeight: 1.5, opacity: 0.85 }}>{message}</div>
      </div>
    </div>
  );
}
