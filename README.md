# 👩🏾 SabrinaAI Platform

**Agents téléphoniques IA pour PME francophones** — France, Belgique, Suisse, Canada, Afrique francophone.

Crée un agent vocal IA en moins de 2 minutes : il décroche, comprend, répond, prend des messages, oriente vers tes services. 100% configurable depuis l'interface (FAQ, ton, langue, secteur).

---

## ✨ Fonctionnalités

- 🔐 **Authentification email** sans mot de passe (Supabase magic link)
- 🤖 **CRUD d'agents IA** : chaque PME crée et personnalise ses propres agents
- 📞 **Simulateur d'appel** dans le navigateur (voix + texte) — exactement le même backend que la prod
- 🎙️ **Voix synthétique française** (Web Speech API) + reconnaissance vocale
- 📊 **Historique d'appels** avec transcript complet et statistiques
- 🚀 **Code de déploiement prêt** : Twilio, Africa's Talking, WhatsApp Business
- 🔒 **Sécurité** : la clé API Claude reste sur le serveur (RLS Supabase pour chaque utilisateur)

---

## 🚀 Démarrage rapide (5 minutes)

### 1. Cloner et installer

```bash
git clone <ton-repo>
cd mon-app
npm install
```

### 2. Configurer les variables d'environnement

Copie `.env.example` vers `.env` puis remplis les valeurs :

- **`ANTHROPIC_API_KEY`** — obligatoire. Récupère ta clé sur [console.anthropic.com](https://console.anthropic.com)
- **`VITE_SUPABASE_URL`** et **`VITE_SUPABASE_ANON_KEY`** — optionnel.
  Sans ces variables, l'app tourne en **mode démo** (3 agents pré-remplis, rien sauvegardé).

### 3. (Optionnel) Configurer Supabase pour la persistance

1. Crée un projet gratuit sur [supabase.com](https://supabase.com)
2. Dans **SQL Editor**, colle le contenu de [`supabase/schema.sql`](./supabase/schema.sql) et exécute
3. Récupère l'URL et la clé `anon` dans **Settings > API**, mets-les dans `.env`
4. Vérifie que **Email auth** est activé dans **Authentication > Providers**

### 4. Lancer

```bash
npm run dev
```

Ça lance en parallèle le frontend Vite sur [http://localhost:5173](http://localhost:5173) et le backend Express sur [http://localhost:3001](http://localhost:3001).

Connecte-toi avec ton email → tu reçois un lien magique → tu crées ton premier agent.

---

## 🏗️ Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  Navigateur     │──────▶│  Backend Express │──────▶│  Anthropic API  │
│  (React + Vite) │       │  /api/chat       │       │  (Claude)       │
│                 │       │  Clé sécurisée   │       └─────────────────┘
│                 │
│                 │       ┌──────────────────┐
│                 │──────▶│  Supabase        │
│                 │       │  Auth + Postgres │
└─────────────────┘       └──────────────────┘
```

**Pourquoi un backend ?** L'appel direct depuis le navigateur à `api.anthropic.com` exposerait la clé API à tous les visiteurs et serait bloqué par CORS. Le backend (`server/index.js`) garde la clé côté serveur et fait office de proxy.

---

## 📁 Structure du projet

```
mon-app/
├── server/
│   └── index.js              ← Backend Express + proxy Anthropic
├── src/
│   ├── App.jsx               ← Root + routing (auth, tabs)
│   ├── components/
│   │   ├── AuthScreen.jsx    ← Login magic link
│   │   ├── Dashboard.jsx     ← Liste des agents + stats
│   │   ├── AgentEditor.jsx   ← Création/édition d'agent + FAQ
│   │   ├── PhoneSimulator.jsx← UI téléphone + appel /api/chat
│   │   └── DeployTab.jsx     ← Snippets Twilio/AT/WhatsApp
│   └── lib/
│       ├── api.js            ← fetch /api/chat
│       ├── agents.js         ← CRUD Supabase (+ fallback démo)
│       └── supabase.js       ← Client Supabase
├── supabase/
│   └── schema.sql            ← Tables + RLS à exécuter une fois
├── .env.example
└── package.json
```

---

## 🌍 Passer en production (vrai numéro de téléphone)

L'onglet **« Déployer en production »** affiche le code prêt à copier-coller pour 3 opérateurs :

| Opérateur | Recommandé pour | Tarif indicatif |
|-----------|-----------------|-----------------|
| **Twilio** | France, Belgique, Suisse, Canada, USA | ~0,015 €/min |
| **Africa's Talking** | RDC, Côte d'Ivoire, Sénégal, Cameroun, Mali | ~0,003 €/min |
| **WhatsApp Business** | Partout — canal n°1 en Afrique | gratuit < 1000 conv/mois |

### Déploiement du backend

```bash
npm run build && npm start   # serveur unique sur :3001 qui sert tout
```

Déploiable en 1 clic sur Railway, Render, Fly.io. N'oublie pas de configurer les variables d'env dans le dashboard de l'hébergeur.

---

## 🔐 Sécurité

- ✅ Clé Anthropic stockée uniquement côté serveur (jamais dans le bundle)
- ✅ Row Level Security (RLS) activée sur toutes les tables Supabase — chaque user ne voit que ses propres données
- ✅ Magic link email (pas de mot de passe à fuiter)
- ⚠️ Pour de la vraie production, ajoute du **rate limiting** sur `/api/chat` (ex: `express-rate-limit`)

---

## 🧰 Scripts npm

| Commande | Description |
|----------|-------------|
| `npm run dev` | Frontend + backend en parallèle (dev) |
| `npm run dev:client` | Seulement Vite |
| `npm run dev:server` | Seulement Express (watch mode) |
| `npm run build` | Build Vite (`dist/`) |
| `npm start` | Backend prod qui sert `dist/` (port 3001) |
| `npm run lint` | ESLint |

---

## 🤝 Idées d'amélioration

Ce projet est un point de départ solide. Idées pour aller plus loin : intégration calendrier (Calendly/Cal.com), transfert vers humain en cours d'appel, analytics avancées par FAQ, export CSV des transcripts, support multilingue (anglais, arabe, lingala…), notifications email après chaque appel.
