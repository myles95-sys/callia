// Données pour les 8 pages secteur (#/sector/<key>)
// Chacune contient : hero, cas client, ROI préconfig, FAQ secteur, pricing reco

export const SECTOR_PAGES = {
  boulangerie: {
    icon: "🥖",
    color: "#f59e0b",
    name: "Boulangeries & Pâtisseries",
    hero: {
      eyebrow: "Pour les boulangers·ères",
      title: "Plus jamais une commande de plateaux ratée.",
      sub: "Callia répond pendant que vous enfournez. Plateaux, gâteaux d'anniversaire, allergènes — elle sait tout, et prend la commande pour vous.",
    },
    testimonial: {
      name: "Élise Marchand",
      role: "Boulangerie Le Croissant Doré · Lyon 2e",
      quote: "On perdait 30% des appels en pleine rush du matin. Depuis Callia, zéro client raté. +18% de CA le mois suivant, j'ai pu embaucher un commis.",
      metric: "+18% CA en 30 jours",
      seed: "elise-boulangere",
    },
    roi: {
      callsPerDay: 35,
      avgValue: 25,
      context: "Une boulangerie type reçoit 30-50 appels/jour, valeur moyenne 20-35€ (plateau, commande). Callia récupère ceux que vous manquez pendant la rush.",
    },
    pricing_reco: "Pro",
    faqs: [
      { q: "Callia peut-elle prendre des commandes complexes (anniversaire, plateaux) ?", a: "Oui. Vous configurez votre catalogue + délais (48-72h), Callia note la commande, prend nom/numéro et confirme. Vous recevez tout par email." },
      { q: "Comment gère-t-elle les questions sur les allergènes ?", a: "Vous renseignez la liste de vos allergènes dans la FAQ. Callia répond précisément et propose toujours de transférer à un humain si la personne insiste." },
      { q: "Et le dimanche matin où je suis seul ?", a: "C'est précisément là où Callia brille. 24/7 sans relâche, elle décroche pendant que vous servez en boutique." },
      { q: "Peut-elle dire 'plus de croissants' en fin de matinée ?", a: "Avec la fonction inventory (Pro+), vous pouvez signaler 'rupture' depuis votre tableau de bord en 1 clic. Callia met à jour ses réponses en direct." },
      { q: "Mes clients âgés vont-ils comprendre ?", a: "Vous choisissez le ton 'chaleureux' qui fait des phrases courtes et naturelles. 96% des appelants 60+ ne réalisent pas que c'est une IA, selon nos clients pilotes." },
    ],
    cta: "Démarrer comme Le Croissant Doré",
  },

  medical: {
    icon: "🏥",
    color: "#06b6d4",
    name: "Cabinets médicaux & professions de santé",
    hero: {
      eyebrow: "Pour les professionnels de santé",
      title: "Concentrez-vous sur vos patients, pas sur le téléphone.",
      sub: "Callia prend les rendez-vous, qualifie les urgences et oriente vers Doctolib — tout en respectant le secret médical et le RGPD.",
    },
    testimonial: {
      name: "Dr Mboma Kalu",
      role: "Cabinet dentaire · Cocody, Abidjan",
      quote: "Je suis dentiste, pas standardiste. Callia qualifie les urgences et me transfère uniquement le critique. Mon assistante a retrouvé 6 heures par semaine pour s'occuper des patients sur place.",
      metric: "−6h/semaine d'admin",
      seed: "mboma-dentiste",
    },
    roi: {
      callsPerDay: 15,
      avgValue: 80,
      context: "Un cabinet médical reçoit 10-30 appels/jour, valeur consultation moyenne 30-150€. Callia libère votre secrétaire pour les patients présents.",
    },
    pricing_reco: "Pro",
    faqs: [
      { q: "Êtes-vous conformes RGPD pour les données de santé ?", a: "Oui. Hébergement européen, chiffrement bout-en-bout, audit trail complet. Aucun secret médical n'est jamais transmis : Callia se contente d'orienter et prend des messages neutres." },
      { q: "Peut-elle qualifier une urgence vitale ?", a: "Callia détecte les mots-clés d'urgence (douleur thoracique, perte de conscience, hémorragie...) et oriente immédiatement vers le 15. Pour les urgences non vitales, elle propose un transfert immédiat." },
      { q: "Compatible avec Doctolib / Maiia / Keldoc ?", a: "Oui. Callia partage votre lien de prise de RDV en ligne. Pour une intégration plus profonde (lecture des créneaux), c'est en cours, demandez-nous." },
      { q: "Et le secret médical, ça tient ?", a: "Callia ne conserve aucune info médicale identifiante par défaut. Vous pouvez activer le mode 'Cabinet médical' qui anonymise les transcripts automatiquement." },
      { q: "Comment elle gère les annulations / reports ?", a: "Elle note la demande, l'horodate, et vous l'envoie par email/SMS. Vous validez en 1 clic depuis votre téléphone." },
    ],
    cta: "Démarrer comme le Dr Mboma",
  },

  garage: {
    icon: "🚗",
    color: "#a855f7",
    name: "Garages & services automobiles",
    hero: {
      eyebrow: "Pour les garagistes",
      title: "Plus une seule demande de devis perdue dans la fosse.",
      sub: "Vidange, freins, embrayage, pneus, dépannage — Callia donne les tarifs, prend les rendez-vous et qualifie les dépannages urgents.",
    },
    testimonial: {
      name: "Karim Belkacem",
      role: "Garage Auto Express · Bruxelles",
      quote: "Avant, je passais 2h/jour au téléphone à donner des devis approximatifs. Maintenant Callia donne le prix exact en 10s et le client est rassuré. J'ai 30% de RDV en plus.",
      metric: "+30% de RDV",
      seed: "karim-garage",
    },
    roi: {
      callsPerDay: 25,
      avgValue: 180,
      context: "Un garage reçoit 20-40 appels/jour, valeur moyenne 120-300€ (vidange, freins). Callia donne instantanément les fourchettes de prix et qualifie l'urgence.",
    },
    pricing_reco: "Pro",
    faqs: [
      { q: "Callia donne-t-elle des devis exacts ?", a: "Elle donne des fourchettes que vous configurez (vidange 79-129€ selon modèle, freins 180-280€...). Pour un devis exact, elle propose un RDV ou prend les coordonnées." },
      { q: "Peut-elle gérer les dépannages d'urgence ?", a: "Oui. Elle qualifie l'urgence (panne sur route, en sécurité ?), prend la localisation, et vous transfère immédiatement avec toutes les infos en main." },
      { q: "Et le pré-contrôle technique ?", a: "Vous configurez 'CT à venir' comme option dans votre FAQ. Callia explique le tarif (souvent gratuit avec rendez-vous) et propose un créneau." },
      { q: "Compatible avec Planity / Garage.com ?", a: "Callia partage votre lien de prise de RDV en ligne quel qu'il soit. Si vous utilisez un agenda Outlook/Google, voir notre plan Enterprise." },
      { q: "Le client est mécontent de la facture, elle fait quoi ?", a: "Elle reconnait l'agacement, propose immédiatement un transfert vers vous, et marque l'appel comme 'litige potentiel' dans votre dashboard." },
    ],
    cta: "Démarrer comme Auto Express",
  },

  coiffure: {
    icon: "💇",
    color: "#ec4899",
    name: "Salons de coiffure & beauté",
    hero: {
      eyebrow: "Pour les coiffeurs·euses",
      title: "Prenez les RDV sans interrompre la coupe.",
      sub: "Pendant que vous faites un balayage, Callia décroche, prend les rendez-vous, donne les tarifs et envoie le lien Planity.",
    },
    testimonial: {
      name: "Yasmine Drahi",
      role: "Salon Studio · Marseille",
      quote: "Configuration en 10 minutes. Le soir même, ma première cliente prenait rendez-vous via Callia. Mes weekends m'appartiennent enfin et les RDV s'enchaînent.",
      metric: "0 RDV raté",
      seed: "yasmine-coiffure",
    },
    roi: {
      callsPerDay: 18,
      avgValue: 60,
      context: "Un salon reçoit 15-25 appels/jour, ticket moyen 35-95€. Callia récupère les clients qui appellent quand vous avez les mains pleines.",
    },
    pricing_reco: "Starter ou Pro",
    faqs: [
      { q: "Callia prend-elle vraiment les rendez-vous toute seule ?", a: "Avec le lien Planity/Treatwell connecté, oui. Sinon, elle prend nom + téléphone + créneau souhaité et vous l'envoie pour confirmation rapide." },
      { q: "Peut-elle donner les prix d'une couleur complexe ?", a: "Pour les coupes simples (femme 35€, homme 22€), oui directement. Pour les couleurs, mèches, balayages : fourchette + proposition de venir pour un diagnostic gratuit." },
      { q: "Et les mariages, c'est compliqué ?", a: "Vous renseignez 'Coiffure mariage à partir de X€, essai recommandé 1 mois avant'. Callia explique et oriente vers un RDV en cabinet." },
      { q: "Comment elle gère les annulations de dernière minute ?", a: "Elle accepte, l'horodate, et vous notifie immédiatement. Optionnel : facturer 50% en cas d'annulation < 24h, à activer dans les paramètres." },
      { q: "Mes habituées vont-elles continuer à m'appeler directement ?", a: "Vous gardez votre numéro habituel. Callia est sur un numéro dédié (ou pendant vos absences). Vos habituées appellent quand ça les arrange." },
    ],
    cta: "Démarrer comme Studio",
  },

  restaurant: {
    icon: "🍽️",
    color: "#ef4444",
    name: "Restaurants & bistrots",
    hero: {
      eyebrow: "Pour les restaurateurs",
      title: "Plus de table vide à 20h faute d'avoir décroché.",
      sub: "Callia gère les réservations, les groupes, les régimes spéciaux et les changements de dernière minute pendant que vous êtes en cuisine.",
    },
    testimonial: {
      name: "Antoine Lefèvre",
      role: "Bistrot du Marché · Toulouse",
      quote: "Le coup de feu du midi, c'est 30 appels en 1h. Avant je ratais la moitié. Maintenant Callia répond pendant que j'envoie les assiettes, et je passe les groupes/événements en filtre.",
      metric: "+22% de couverts",
      seed: "antoine-resto",
    },
    roi: {
      callsPerDay: 35,
      avgValue: 45,
      context: "Un restaurant reçoit 25-50 appels/jour en réservation, ticket moyen 30-70€. Callia se concentre sur le pic 11h-14h et 18h-21h.",
    },
    pricing_reco: "Pro",
    faqs: [
      { q: "Peut-elle gérer les grandes tables (12 personnes et +) ?", a: "Vous configurez 'au-delà de X couverts, prendre coordonnées et transférer'. Callia explique au client qu'un confirmation suivra dans la journée." },
      { q: "Régimes alimentaires (sans gluten, végan, allergies) ?", a: "Oui. Vous listez vos options dans la FAQ. Callia répond précisément et marque toujours les allergies dans la note de réservation." },
      { q: "Que se passe-t-il quand on est complet ?", a: "Vous mettez à jour 'COMPLET CE SOIR' dans votre dashboard en 1 clic. Callia propose alors une autre date ou inscrit la personne sur liste d'attente." },
      { q: "Compatible avec La Fourchette / TheFork ?", a: "Callia partage votre lien TheFork dans la conversation. Pour une intégration native (lecture créneaux), Enterprise uniquement pour l'instant." },
      { q: "Et les no-show ?", a: "Vous pouvez activer 'rappel SMS à J-1' pour les groupes. Callia peut aussi demander un dépôt via Stripe (plan Pro+) pour les réservations >6 personnes." },
    ],
    cta: "Démarrer comme le Bistrot du Marché",
  },

  immobilier: {
    icon: "🏠",
    color: "#10b981",
    name: "Agences immobilières",
    hero: {
      eyebrow: "Pour les agents immo",
      title: "Plus une visite ratée, plus un mandat perdu.",
      sub: "Callia répond aux appels de candidats, qualifie le projet (achat/location, budget), et programme les visites dans votre Calendly.",
    },
    testimonial: {
      name: "Sophie Martin",
      role: "Agence Côté Sud · Bordeaux",
      quote: "Les acheteurs appellent tous le même jour à la même heure. Avant je perdais 40% des leads. Callia les qualifie et me passe uniquement les profils sérieux. +12 mandats en 3 mois.",
      metric: "+12 mandats / 3 mois",
      seed: "sophie-immo",
    },
    roi: {
      callsPerDay: 22,
      avgValue: 350,
      context: "Une agence immo reçoit 15-30 appels/jour, valeur lead moyenne 200-600€ (5% honoraires sur biens 30-60k). Chaque lead manqué = un mandat raté.",
    },
    pricing_reco: "Pro",
    faqs: [
      { q: "Comment qualifie-t-elle un prospect sérieux ?", a: "Callia pose 4 questions : projet (achat/location), zone, budget, délai. Vous recevez la fiche complète. Ça filtre 60% des 'curieux'." },
      { q: "Peut-elle programmer une visite directement ?", a: "Oui via Calendly connecté. Sinon elle prend les disponibilités du client et vous laisse confirmer. Confirmation SMS automatique au client." },
      { q: "Et l'estimation gratuite ?", a: "Vous lui dites 'estimation gratuite sans engagement, RDV sur site en 48h'. Callia explique, prend les coordonnées et planifie." },
      { q: "Conformité loi Hoguet et RGPD ?", a: "Oui. Hébergement EU, droit d'oubli en 1 clic, et tous les transcripts contenant des données personnelles sont anonymisés après 12 mois." },
      { q: "Compatible CRM (Apimo, Hektor, etc.) ?", a: "Webhook disponible en plan Pro pour pousser les leads qualifiés directement dans votre CRM. Voir avec votre commercial pour la config." },
    ],
    cta: "Démarrer comme Côté Sud",
  },

  hotel: {
    icon: "🏨",
    color: "#3b82f6",
    name: "Hôtels & locations courte durée",
    hero: {
      eyebrow: "Pour l'hôtellerie",
      title: "Une réception 24h/24, sans embaucher de veilleur.",
      sub: "Callia répond la nuit, le weekend, vérifie la disponibilité, donne les tarifs et accepte les pré-réservations.",
    },
    testimonial: {
      name: "Léa Dupont",
      role: "Hôtel Le Belvédère · Annecy",
      quote: "Pour mes 12 chambres, payer un veilleur de nuit, c'était hors budget. Callia décroche à 3h du matin avec la même qualité qu'en pleine journée. Les clients adorent.",
      metric: "Réception 24/7",
      seed: "lea-hotel",
    },
    roi: {
      callsPerDay: 12,
      avgValue: 150,
      context: "Un hôtel reçoit 8-20 appels/jour de réservation, ticket moyen 80-250€. Beaucoup d'appels la nuit/weekend où vous n'avez personne.",
    },
    pricing_reco: "Pro",
    faqs: [
      { q: "Callia peut-elle voir mes disponibilités en temps réel ?", a: "Avec un PMS compatible (Mews, Cloudbeds, Bookea), oui via webhook. Sinon elle accepte une 'pré-réservation' que vous confirmez en 5 min depuis votre téléphone." },
      { q: "Et les late check-out / early check-in ?", a: "Vous configurez la politique (gratuit si dispo, ou 30€). Callia explique et vérifie si possible. Si elle ne sait pas, elle transfère." },
      { q: "Compatible Booking.com / Airbnb ?", a: "Callia est pour vos appels directs uniquement. Booking et Airbnb gèrent leurs propres messageries. Mais elle aide à récupérer les clients que vous renvoyez du direct." },
      { q: "Et si le client veut parler aux propriétaires (gîte) ?", a: "Vous configurez 'transfert urgent' pour certains mots-clés (problème, urgence, plainte). Callia explique le délai habituel et propose un rappel sous 2h." },
      { q: "Plusieurs langues, c'est possible ?", a: "Oui ! Callia parle français, anglais, espagnol, allemand, italien, néerlandais et arabe. Choisissez la langue par défaut ou demandez-lui de basculer." },
    ],
    cta: "Démarrer comme Le Belvédère",
  },

  avocat: {
    icon: "⚖️",
    color: "#6366f1",
    name: "Cabinets d'avocats & juridique",
    hero: {
      eyebrow: "Pour la profession juridique",
      title: "Plus une consultation potentielle perdue.",
      sub: "Callia répond, qualifie le dossier (matière, urgence, aide juridictionnelle), et programme la première consultation dans votre agenda.",
    },
    testimonial: {
      name: "Maître Camille Renaud",
      role: "Cabinet Renaud & Associés · Paris 8e",
      quote: "On recevait 50 appels/semaine, on traitait 30. Callia qualifie maintenant 100%. On ne voit que les dossiers sérieux, on a un taux de signature à 75% sur les premières consultations.",
      metric: "75% de signature en 1er RDV",
      seed: "camille-avocate",
    },
    roi: {
      callsPerDay: 10,
      avgValue: 250,
      context: "Un cabinet reçoit 6-15 appels/jour, valeur consultation moyenne 80-400€. Les premières consultations sont la principale source de mandat.",
    },
    pricing_reco: "Pro",
    faqs: [
      { q: "Callia respecte-t-elle le secret professionnel ?", a: "Oui. Aucun détail de dossier n'est conservé en clair. Les transcripts sont chiffrés et automatiquement anonymisés après 90 jours. Vous pouvez les supprimer à tout moment." },
      { q: "Comment qualifie-t-elle la matière ?", a: "Elle pose : droit civil, du travail, des affaires, pénal, famille. Si le dossier sort de vos spécialités, elle prend un message et propose un rappel pour orienter." },
      { q: "Aide juridictionnelle, c'est compliqué à expliquer ?", a: "Vous lui donnez une réponse type ('Oui acceptée, apportez attestation'). Callia répond mot pour mot, naturellement." },
      { q: "Première consultation payante ou gratuite ?", a: "Vous configurez votre politique. Callia annonce le tarif clairement, et si le client refuse, elle propose une alternative (devis écrit, rappel d'orientation gratuit)." },
      { q: "Compatible avec Secib / Cicero / Polyacte ?", a: "Webhook disponible en plan Pro pour pousser les nouveaux dossiers dans votre logiciel métier. Documentation technique sur demande." },
    ],
    cta: "Démarrer comme Renaud & Associés",
  },
};

export const SECTOR_KEYS = Object.keys(SECTOR_PAGES);
