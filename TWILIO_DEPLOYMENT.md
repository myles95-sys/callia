# 📞 Brancher Callia à un VRAI numéro de téléphone

Guide complet pour passer du simulateur navigateur à un vrai standard téléphonique en production.

**Temps estimé total : ~30-45 minutes**

---

## 🎯 Vue d'ensemble

```
[Client appelle +33 9 XX XX XX XX]
       ↓
   [Twilio reçoit l'appel]
       ↓ HTTP POST
[Ton backend Railway]
       ↓                              [Anthropic Claude]
[Cherche l'agent par numéro]                  ↑
       ↓                                      │
[Construit le prompt système]                 │
       ↓                                      ↓
[Demande la réponse à Claude] ────────────────┘
       ↓
[Renvoie du TwiML à Twilio]
       ↓
[Twilio fait parler Polly.Lea au client]
```

---

## Étape 1 — Créer un compte Twilio (5 min)

1. Va sur [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Inscription avec ton email professionnel
3. Vérification de ton numéro de mobile (SMS)
4. Tu obtiens **15$ de crédit gratuit** (suffisant pour ~12h d'appels test)

Une fois connecté, dans le **Console Dashboard**, tu verras :
- `Account SID` : `ACxxxxxxxxxxxxxxxxxxxxxx`
- `Auth Token` : (cliquer "Show")

Garde-les sous le coude (tu n'en auras pas besoin pour le webhook simple, mais utile plus tard).

---

## Étape 2 — Acheter un numéro français (3 min)

1. Console Twilio → **Phone Numbers** → **Buy a number**
2. Pays : **France**
3. Type : **Local** (préférable) ou **Mobile**
4. Capacités : **Voice** (obligatoire) — SMS optionnel
5. Choisis un numéro qui te plaît
6. **Buy** — ~5€/mois

Format obtenu : `+33 9 XX XX XX XX` (notation E.164 : `+339XXXXXXXX`)

---

## Étape 3 — Récupérer une clé Anthropic (2 min)

1. [https://console.anthropic.com](https://console.anthropic.com) → inscription
2. Add **payment method** (Anthropic donne 5$ gratuit la première fois)
3. **API Keys** → **Create key**
4. Copie la clé `sk-ant-api03-xxx...` quelque part — **tu ne pourras plus la revoir !**

---

## Étape 4 — Déployer le backend sur Railway (10 min)

Railway hébergera ton serveur Express pour qu'il soit accessible par Twilio.

### 4.1 — Push le code sur GitHub

```bash
cd C:\Users\myles\OneDrive\Bureau\mon-app
git init
git add .
git commit -m "Callia ready for production"
# Crée un repo sur github.com puis :
git remote add origin git@github.com:tonuser/callia.git
git push -u origin main
```

### 4.2 — Créer le projet Railway

1. Va sur [https://railway.app](https://railway.app) → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo** → sélectionne `callia`
3. Railway détecte automatiquement Node.js et lance `npm install` + `npm start`

### 4.3 — Configurer les variables d'environnement

Dans Railway → **ton projet** → **Variables** → ajoute :

```
ANTHROPIC_API_KEY     = sk-ant-api03-xxx... (l'étape 3)
DEMO_TWILIO_NUMBER    = +33986XXXXX (le numéro acheté à l'étape 2, sans espaces)
NODE_ENV              = production
CLAUDE_MODEL          = claude-sonnet-4-20250514
```

**Optionnel** (si tu veux la persistance Supabase) :
```
VITE_SUPABASE_URL       = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY  = eyJ...
SUPABASE_SERVICE_KEY    = eyJ... (la service_role key, pas la anon !)
```

### 4.4 — Récupérer ton URL publique

Railway → **Settings** → **Domains** → **Generate domain**

Tu obtiens quelque chose comme : `https://callia-production-xxx.up.railway.app`

**Test rapide** : ouvre `https://callia-production-xxx.up.railway.app/api/health` dans ton navigateur — tu devrais voir un JSON avec `"ok": true` et `"hasAnthropicKey": true`.

---

## Étape 5 — Connecter Twilio au backend (3 min)

1. Console Twilio → **Phone Numbers** → **Manage** → **Active Numbers** → clique sur ton numéro
2. Scroll jusqu'à **Voice Configuration**
3. **A call comes in** :
   - Type : **Webhook**
   - URL : `https://callia-production-xxx.up.railway.app/voice`
   - Method : **HTTP POST**
4. **Call status changes** (optionnel mais recommandé pour logs) :
   - URL : `https://callia-production-xxx.up.railway.app/voice-status`
   - Method : **HTTP POST**
   - Events : cocher **Completed**
5. **Save configuration**

---

## Étape 6 — Tester ! (1 min)

📱 **Sors ton mobile et compose le numéro Twilio que tu as acheté.**

Tu devrais entendre :
> *« Bonjour, Callia à l'appareil pour Boulangerie Le Croissant Doré. Cette conversation peut être traitée par un assistant vocal. Comment puis-je vous aider ? »*

Pose une question : *"Vous êtes ouverts dimanche ?"*

Callia devrait répondre en ~2-3 secondes : *« Oui, nous sommes ouverts le dimanche matin de 7h à 13h. »*

🎉 **C'est en production.**

---

## 🔧 Personnalisation rapide

### Changer l'agent par défaut (sans Supabase)

L'agent **boulangerie** est codé en dur dans `server/index.js` (constante `DEMO_AGENT_BOULANGERIE`). Pour le changer, modifie ce bloc et redéploie (`git push` → Railway redéploie auto).

### Mapper plusieurs numéros à plusieurs agents (avec Supabase)

1. Configure Supabase (voir `README.md`)
2. Crée tes agents depuis l'interface web Callia
3. Pour chaque agent, mets le **vrai** numéro Twilio dans le champ `phone`
4. La fonction `findAgentByPhone` matchera automatiquement

### Changer la voix Polly

Dans `server/index.js`, fonction `twimlSay`, remplace `Polly.Lea` par :
- `Polly.Brigitte` (voix française alternative)
- `Polly.Mathieu` (voix masculine FR)
- `man` ou `woman` (voix Twilio basique, moins bonne)

Liste complète : [Twilio TTS Voices](https://www.twilio.com/docs/voice/twiml/say/text-speech)

### Voix ultra-naturelle (ElevenLabs)

Si tu veux une voix vraiment humaine (~0,002€/mot), il faut :
1. Compte ElevenLabs + clé API
2. Remplacer `<Say>` par `<Play>` qui pointe vers un fichier audio généré à la volée
3. C'est ~30 lignes de code à ajouter — dis-moi si tu veux que je le code

---

## 💰 Suivi des coûts

| Service | Coût | Comment surveiller |
|---------|------|--------------------|
| Twilio (n° + minutes) | ~5€/mois + 0,013€/min | Console Twilio → Usage |
| Anthropic (Claude) | ~0,015€/appel de 2 min | console.anthropic.com → Usage |
| Railway (hébergement) | Gratuit jusqu'à 500h/mois | Railway → Usage |
| Supabase (DB) | Gratuit < 500 Mo | Supabase → Reports |

**Pour 1 000 appels/mois × 2 min :**
- Twilio : 5€ + 26€ + 17€ (TTS) + 30€ (STT) = **78€/mois**
- Anthropic : **15€/mois**
- Railway + Supabase : **0€/mois**
- **Total opérationnel : ~93€/mois**

À ce niveau, **il faut absolument facturer 149€/mois** (pas 79€) pour avoir de la marge.

---

## 🐛 Dépannage

**Problème : "Application error" quand j'appelle**
→ Vérifie les logs Railway. Souvent : ANTHROPIC_API_KEY manquante.

**Problème : Callia parle anglais**
→ Twilio essaie de deviner la langue. Vérifie que `<Say language="fr-FR">` est bien dans le TwiML — c'est le cas dans le code mais re-vérifie tes logs.

**Problème : Latence > 5 secondes**
→ Normal pour la première requête (cold start Railway). Active **Always-on** dans Railway Settings (payant) pour éviter ça.

**Problème : Pas de transcription du speech**
→ Twilio Speech-to-text par défaut est `Google.LangPack/fr-FR-Standard-A`. C'est OK mais limité. Pour mieux, active **Enhanced** dans le code (ajoute `enhanced="true"` au `<Gather>`) — ~2× plus cher mais bien meilleur.

**Problème : Le bouton Transférer ne marche pas**
→ Vérifie que `DEMO_ESCALATION_PHONE` est bien défini dans Railway et au format E.164 (`+33612345678`).

---

## 🎓 Next steps après ton premier test réussi

1. **Imprime ton numéro Twilio sur un flyer** et donne-le à 5 commerçants de ton quartier en disant *"appelez ce numéro pour découvrir Callia"*
2. **Analyse les transcripts** : qu'est-ce qui ne marche pas ? Quelles questions Callia loupe ?
3. **Ajoute du SMS de confirmation** : à la fin de l'appel, envoyer un SMS automatique avec le résumé (Twilio SMS = 0,07€/sms en France)
4. **Active Supabase + multi-tenants** : ton service est prêt à accueillir 100 PME
5. **Stripe pour facturer** : crée tes plans 29€/79€/199€ dans Stripe Checkout

---

## 📞 Une vraie démo ?

Imprime ton numéro Twilio. Mets-le sur une carte de visite. Appelle-le devant tes prospects. **En 30 secondes ils sont convaincus.**

C'est le moment magique du pitch que tu attendais.

Bonne chance ! 🚀
