// Données fictives de la maquette, en attendant l'API.

export type MetierId =
  | "electricite"
  | "plomberie"
  | "maconnerie"
  | "menuiserie"
  | "mecanique"
  | "informatique"
  | "peinture"
  | "climatisation";

export interface Metier {
  id: MetierId;
  label: string;
  techniciens: number;
  demandes: number;
  actif: boolean;
}

export const METIERS: Metier[] = [
  { id: "electricite", label: "Électricité", techniciens: 124, demandes: 186, actif: true },
  { id: "plomberie", label: "Plomberie", techniciens: 98, demandes: 142, actif: true },
  { id: "maconnerie", label: "Maçonnerie", techniciens: 76, demandes: 64, actif: true },
  { id: "menuiserie", label: "Menuiserie", techniciens: 41, demandes: 38, actif: true },
  { id: "mecanique", label: "Mécanique", techniciens: 37, demandes: 45, actif: true },
  { id: "informatique", label: "Informatique", techniciens: 22, demandes: 29, actif: true },
  { id: "peinture", label: "Peinture", techniciens: 15, demandes: 18, actif: true },
  { id: "climatisation", label: "Climatisation", techniciens: 7, demandes: 10, actif: false },
];

export interface Zone {
  nom: string;
  ville: string;
  techniciens: number;
  demandes: number;
  actif: boolean;
}

export const ZONES_DETAIL: Zone[] = [
  { nom: "Kaloum", ville: "Conakry", techniciens: 64, demandes: 98, actif: true },
  { nom: "Dixinn", ville: "Conakry", techniciens: 71, demandes: 104, actif: true },
  { nom: "Matam", ville: "Conakry", techniciens: 58, demandes: 87, actif: true },
  { nom: "Ratoma", ville: "Conakry", techniciens: 112, demandes: 131, actif: true },
  { nom: "Matoto", ville: "Conakry", techniciens: 69, demandes: 76, actif: true },
  { nom: "Kagbelen", ville: "Kagbelen", techniciens: 18, demandes: 14, actif: true },
  { nom: "Dubréka", ville: "Dubréka", techniciens: 16, demandes: 12, actif: true },
  { nom: "Coyah", ville: "Coyah", techniciens: 12, demandes: 10, actif: false },
];

export const ZONES = ZONES_DETAIL.map((z) => z.nom);

/** 1 = identité vérifiée, 2 = compétence évaluée, 3 = recommandé */
export type Niveau = 1 | 2 | 3;

export const NIVEAUX: Record<Niveau, { label: string; description: string }> = {
  1: { label: "Identité vérifiée", description: "Pièce d'identité et numéro de téléphone contrôlés." },
  2: { label: "Compétence évaluée", description: "Diplômes, attestations ou test pratique validés." },
  3: { label: "Recommandé", description: "Missions réussies et avis clients excellents sur la durée." },
};

export interface Avis {
  id: string;
  auteur: string;
  note: number;
  commentaire: string;
  date: string;
  mission?: string;
}

export interface Technicien {
  id: string;
  nom: string;
  metier: MetierId;
  specialites: string[];
  zone: string;
  zonesIntervention: string[];
  note: number;
  nbAvis: number;
  niveau: Niveau;
  disponible: boolean;
  experience: number;
  missions: number;
  telephone: string;
  bio: string;
  disponibilites: string;
  /** Photo de profil (dossier public/images). */
  photo: string;
  realisations: { titre: string; categorie: string; image: string }[];
  avis: Avis[];
  inscrit: string;
  statut: "actif" | "suspendu" | "en_attente";
}

const AVIS_MAMADOU: Avis[] = [
  { id: "a1", auteur: "Abdoulaye Bah", note: 5, commentaire: "Très professionnel et rapide. Je recommande !", date: "12 oct. 2026", mission: "Installation électrique" },
  { id: "a2", auteur: "Fatoumata Sow", note: 5, commentaire: "Travail propre, ponctuel et prix correct. Il a tout expliqué avant de commencer.", date: "2 oct. 2026", mission: "Tableau électrique" },
  { id: "a3", auteur: "Ibrahima Touré", note: 4, commentaire: "Bon travail, juste un peu de retard au rendez-vous.", date: "20 sept. 2026", mission: "Dépannage" },
  { id: "a4", auteur: "Mariam Diallo", note: 5, commentaire: "Travail bien fait, très soigné.", date: "8 sept. 2026", mission: "Éclairage extérieur" },
];

export const TECHNICIENS: Technicien[] = [
  {
    id: "mamadou-diallo",
    photo: "/images/electricien-ampoule.jpg",
    nom: "Mamadou Diallo",
    metier: "electricite",
    specialites: ["Installation", "Dépannage", "Maintenance"],
    zone: "Kaloum",
    zonesIntervention: ["Kaloum", "Dixinn", "Matam"],
    note: 4.8,
    nbAvis: 32,
    niveau: 2,
    disponible: true,
    experience: 8,
    missions: 54,
    telephone: "+224 620 00 00 01",
    bio: "Technicien électricien avec plus de 8 ans d'expérience dans l'installation, le dépannage et la maintenance des systèmes électriques résidentiels et commerciaux.",
    disponibilites: "Lundi – Samedi (8h – 18h)",
    realisations: [
      { titre: "Tableau électrique villa", categorie: "Installation", image: "/images/electricien-tableau.jpg" },
      { titre: "Éclairage boutique", categorie: "Installation", image: "/images/electricien-ampoule.jpg" },
      { titre: "Câblage immeuble R+3", categorie: "Câblage", image: "/images/chantier.jpg" },
      { titre: "Groupe électrogène", categorie: "Maintenance", image: "/images/equipe-usine.jpg" },
      { titre: "Mise aux normes bureau", categorie: "Dépannage", image: "/images/electricienne.jpg" },
      { titre: "Éclairage extérieur", categorie: "Installation", image: "/images/technicien-antenne.jpg" },
    ],
    avis: AVIS_MAMADOU,
    inscrit: "14 janv. 2026",
    statut: "actif",
  },
  {
    id: "ibrahima-camara",
    photo: "/images/electricien-tableau.jpg",
    nom: "Ibrahima Camara",
    metier: "electricite",
    specialites: ["Câblage", "Maintenance"],
    zone: "Matam",
    zonesIntervention: ["Matam", "Ratoma"],
    note: 4.6,
    nbAvis: 18,
    niveau: 2,
    disponible: true,
    experience: 5,
    missions: 31,
    telephone: "+224 620 00 00 02",
    bio: "Électricien spécialisé dans le câblage de bâtiments neufs et la mise aux normes.",
    disponibilites: "Lundi – Vendredi (8h – 17h)",
    realisations: [
      { titre: "Câblage immeuble", categorie: "Câblage", image: "/images/chantier.jpg" },
      { titre: "Mise aux normes", categorie: "Maintenance", image: "/images/electricien-tableau.jpg" },
    ],
    avis: [{ id: "b1", auteur: "Mariama Barry", note: 5, commentaire: "Très bon conseil, travail soigné.", date: "8 oct. 2026" }],
    inscrit: "3 févr. 2026",
    statut: "actif",
  },
  {
    id: "sekou-bah",
    photo: "/images/technicien-antenne.jpg",
    nom: "Sékou Bah",
    metier: "electricite",
    specialites: ["Dépannage", "Installation"],
    zone: "Dixinn",
    zonesIntervention: ["Dixinn", "Kaloum"],
    note: 4.5,
    nbAvis: 12,
    niveau: 1,
    disponible: false,
    experience: 3,
    missions: 17,
    telephone: "+224 620 00 00 03",
    bio: "Dépannages rapides à domicile, installation de prises, luminaires et ventilateurs.",
    disponibilites: "Tous les jours (9h – 20h)",
    realisations: [{ titre: "Installation luminaires", categorie: "Installation", image: "/images/electricien-ampoule.jpg" }],
    avis: [{ id: "c1", auteur: "Oumar Sylla", note: 4, commentaire: "Intervention rapide.", date: "1 oct. 2026" }],
    inscrit: "22 mars 2026",
    statut: "actif",
  },
  {
    id: "aissatou-camara",
    photo: "/images/electricienne.jpg",
    nom: "Aïssatou Camara",
    metier: "electricite",
    specialites: ["Installation", "Sécurité électrique", "Solaire"],
    zone: "Ratoma",
    zonesIntervention: ["Ratoma", "Matoto"],
    note: 4.9,
    nbAvis: 27,
    niveau: 3,
    disponible: true,
    experience: 10,
    missions: 68,
    telephone: "+224 620 00 00 04",
    bio: "Électricienne certifiée, spécialisée en sécurité électrique et installations solaires.",
    disponibilites: "Lundi – Samedi (8h – 18h)",
    realisations: [
      { titre: "Kit solaire 3 kW", categorie: "Solaire", image: "/images/technicien-antenne.jpg" },
      { titre: "Audit sécurité", categorie: "Sécurité", image: "/images/electricienne.jpg" },
      { titre: "Installation bureau", categorie: "Installation", image: "/images/electricien-tableau.jpg" },
    ],
    avis: [{ id: "d1", auteur: "Kadiatou Diallo", note: 5, commentaire: "Excellente, très rigoureuse.", date: "15 oct. 2026" }],
    inscrit: "9 déc. 2025",
    statut: "actif",
  },
  {
    id: "alpha-conde",
    photo: "/images/plombier-portrait.jpg",
    nom: "Alpha Condé",
    metier: "plomberie",
    specialites: ["Fuites", "Sanitaires", "Chauffe-eau"],
    zone: "Matoto",
    zonesIntervention: ["Matoto", "Matam", "Kagbelen"],
    note: 4.7,
    nbAvis: 21,
    niveau: 2,
    disponible: true,
    experience: 7,
    missions: 40,
    telephone: "+224 620 00 00 05",
    bio: "Plombier expérimenté : réparation de fuites, installation de sanitaires et de chauffe-eau.",
    disponibilites: "Lundi – Samedi (7h – 18h)",
    realisations: [
      { titre: "Salle de bain complète", categorie: "Sanitaires", image: "/images/plombier-siphon.jpg" },
      { titre: "Réparation fuite", categorie: "Fuites", image: "/images/plombier-evier.jpg" },
    ],
    avis: [{ id: "e1", auteur: "Aminata Keita", note: 5, commentaire: "Fuite réparée en une heure, merci !", date: "10 oct. 2026" }],
    inscrit: "18 févr. 2026",
    statut: "actif",
  },
  {
    id: "moussa-kouyate",
    photo: "/images/chantier.jpg",
    nom: "Moussa Kouyaté",
    metier: "maconnerie",
    specialites: ["Construction", "Carrelage", "Rénovation"],
    zone: "Coyah",
    zonesIntervention: ["Coyah", "Dubréka", "Matoto"],
    note: 4.4,
    nbAvis: 9,
    niveau: 1,
    disponible: true,
    experience: 12,
    missions: 22,
    telephone: "+224 620 00 00 06",
    bio: "Maçon et carreleur, chantiers de construction et de rénovation.",
    disponibilites: "Lundi – Samedi (7h – 17h)",
    realisations: [
      { titre: "Carrelage terrasse", categorie: "Carrelage", image: "/images/chantier.jpg" },
      { titre: "Mur de clôture", categorie: "Construction", image: "/images/equipe-groupe.jpg" },
    ],
    avis: [{ id: "f1", auteur: "Thierno Diallo", note: 4, commentaire: "Bon carrelage, finitions correctes.", date: "28 sept. 2026" }],
    inscrit: "5 avr. 2026",
    statut: "en_attente",
  },
  {
    id: "mariama-soumah",
    photo: "/images/menuisiere.jpg",
    nom: "Mariama Soumah",
    metier: "menuiserie",
    specialites: ["Meubles sur mesure", "Placards", "Agencement"],
    zone: "Kaloum",
    zonesIntervention: ["Kaloum", "Dixinn"],
    note: 4.8,
    nbAvis: 15,
    niveau: 2,
    disponible: true,
    experience: 6,
    missions: 26,
    telephone: "+224 620 00 00 07",
    bio: "Menuisière : fabrication de meubles sur mesure, placards et agencement d'intérieur.",
    disponibilites: "Lundi – Vendredi (9h – 18h)",
    realisations: [
      { titre: "Placard trois portes", categorie: "Placards", image: "/images/menuisiere.jpg" },
      { titre: "Table en bois massif", categorie: "Meubles", image: "/images/menuisier-marche.jpg" },
    ],
    avis: [{ id: "g1", auteur: "Sory Camara", note: 5, commentaire: "Placards impeccables, finitions très soignées.", date: "5 oct. 2026" }],
    inscrit: "11 mai 2026",
    statut: "actif",
  },
  {
    id: "lansana-traore",
    photo: "/images/mecanicien.jpg",
    nom: "Lansana Traoré",
    metier: "mecanique",
    specialites: ["Freinage", "Moteur", "Diagnostic"],
    zone: "Ratoma",
    zonesIntervention: ["Ratoma", "Dixinn", "Matam"],
    note: 4.6,
    nbAvis: 19,
    niveau: 2,
    disponible: false,
    experience: 9,
    missions: 35,
    telephone: "+224 620 00 00 08",
    bio: "Mécanicien automobile : freinage, entretien moteur et diagnostic électronique.",
    disponibilites: "Lundi – Samedi (8h – 18h)",
    realisations: [
      { titre: "Remplacement des freins", categorie: "Freinage", image: "/images/mecanicien.jpg" },
    ],
    avis: [{ id: "h1", auteur: "Hawa Bangoura", note: 5, commentaire: "Voiture comme neuve, freins parfaits !", date: "9 oct. 2026" }],
    inscrit: "27 juin 2026",
    statut: "suspendu",
  },
  {
    id: "fode-camara",
    nom: "Fodé Camara",
    photo: "/images/menuisier-atelier.jpg",
    metier: "menuiserie",
    specialites: ["Portes", "Charpente", "Découpe"],
    zone: "Matoto",
    zonesIntervention: ["Matoto", "Kagbelen", "Dubréka"],
    note: 4.7,
    nbAvis: 14,
    niveau: 2,
    disponible: true,
    experience: 11,
    missions: 38,
    telephone: "+224 620 00 00 09",
    bio: "Menuisier en atelier : portes, fenêtres, charpente et découpe sur mesure.",
    disponibilites: "Lundi – Samedi (8h – 18h)",
    realisations: [
      { titre: "Portes d'entrée en bois", categorie: "Portes", image: "/images/menuisier-atelier.jpg" },
      { titre: "Charpente de hangar", categorie: "Charpente", image: "/images/menuisier-marche.jpg" },
    ],
    avis: [{ id: "i1", auteur: "Mariam Bah", note: 5, commentaire: "Porte solide et bien finie, livrée à temps.", date: "11 oct. 2026" }],
    inscrit: "8 juil. 2026",
    statut: "actif",
  },
  {
    id: "fatoumata-kaba",
    nom: "Fatoumata Kaba",
    photo: "/images/soudeuse.jpg",
    metier: "mecanique",
    specialites: ["Soudure", "Ferronnerie", "Portails"],
    zone: "Dixinn",
    zonesIntervention: ["Dixinn", "Ratoma", "Kaloum"],
    note: 4.8,
    nbAvis: 11,
    niveau: 2,
    disponible: true,
    experience: 6,
    missions: 24,
    telephone: "+224 620 00 00 10",
    bio: "Soudeuse et ferronnière : portails, grilles de sécurité et structures métalliques.",
    disponibilites: "Lundi – Samedi (8h – 17h)",
    realisations: [
      { titre: "Portail coulissant", categorie: "Portails", image: "/images/soudeuse.jpg" },
      { titre: "Grilles de fenêtres", categorie: "Ferronnerie", image: "/images/equipe-usine.jpg" },
    ],
    avis: [{ id: "j1", auteur: "Sékou Diallo", note: 5, commentaire: "Portail magnifique et très solide.", date: "14 oct. 2026" }],
    inscrit: "19 mai 2026",
    statut: "actif",
  },
];

/** Photo associée à un nom, pour les avatars. */
export const PHOTOS: Record<string, string> = Object.fromEntries(TECHNICIENS.map((t) => [t.nom, t.photo]));

/* ---------------------------------------------------------------- Demandes */

export type StatutDemande = "envoyee" | "acceptee" | "en_cours" | "terminee" | "annulee";

export const STATUTS_DEMANDE: Record<StatutDemande, string> = {
  envoyee: "En attente",
  acceptee: "Acceptée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

export interface EtapeChronologie {
  label: string;
  date?: string;
  fait: boolean;
}

export interface Demande {
  id: string;
  reference: string;
  titre: string;
  metier: MetierId;
  description: string;
  client: string;
  clientTel: string;
  technicienId?: string;
  zone: string;
  adresse: string;
  urgence: "normale" | "urgente";
  statut: StatutDemande;
  date: string;
  creneau: string;
  budget?: number;
  evaluee?: boolean;
  chronologie: EtapeChronologie[];
}

function chrono(statut: StatutDemande, dates: string[]): EtapeChronologie[] {
  const etapes = ["Demande créée", "Acceptée par le technicien", "Intervention en cours", "Mission terminée", "Évaluation"];
  const rang = { envoyee: 1, acceptee: 2, en_cours: 3, terminee: 4, annulee: 1 }[statut];
  return etapes.map((label, i) => ({ label, date: dates[i], fait: i < rang }));
}

export const DEMANDES: Demande[] = [
  {
    id: "d-1023",
    reference: "#1023",
    titre: "Réparation de climatisation",
    metier: "climatisation",
    description: "Le climatiseur du salon ne refroidit plus et fait un bruit anormal depuis deux jours.",
    client: "Mohamed Camara",
    clientTel: "+224 621 11 22 33",
    technicienId: "mamadou-diallo",
    zone: "Kaloum",
    adresse: "Quartier Almamya, rue KA-020",
    urgence: "urgente",
    statut: "en_cours",
    date: "20 oct. 2026",
    creneau: "21 oct. 2026 · 10h00",
    budget: 350000,
    chronologie: chrono("en_cours", ["20 oct. · 10h24", "20 oct. · 11h02", "21 oct. · 10h15"]),
  },
  {
    id: "d-1019",
    reference: "#1019",
    titre: "Installation électrique",
    metier: "electricite",
    description: "Installation de 6 prises et 4 points lumineux dans une extension de la maison.",
    client: "Mohamed Camara",
    clientTel: "+224 621 11 22 33",
    technicienId: "mamadou-diallo",
    zone: "Kaloum",
    adresse: "Quartier Almamya, rue KA-020",
    urgence: "normale",
    statut: "acceptee",
    date: "18 oct. 2026",
    creneau: "24 oct. 2026 · 09h00",
    budget: 800000,
    chronologie: chrono("acceptee", ["18 oct. · 09h12", "18 oct. · 14h40"]),
  },
  {
    id: "d-1012",
    reference: "#1012",
    titre: "Fuite d'eau cuisine",
    metier: "plomberie",
    description: "Fuite sous l'évier de la cuisine, le tuyau d'évacuation semble fissuré.",
    client: "Mohamed Camara",
    clientTel: "+224 621 11 22 33",
    technicienId: "alpha-conde",
    zone: "Kaloum",
    adresse: "Quartier Almamya, rue KA-020",
    urgence: "urgente",
    statut: "terminee",
    date: "10 oct. 2026",
    creneau: "10 oct. 2026 · 16h00",
    budget: 150000,
    chronologie: chrono("terminee", ["10 oct. · 08h03", "10 oct. · 08h30", "10 oct. · 16h05", "10 oct. · 17h20"]),
  },
  {
    id: "d-1004",
    reference: "#1004",
    titre: "Peinture appartement",
    metier: "peinture",
    description: "Peinture de deux chambres et du couloir (environ 60 m²).",
    client: "Mohamed Camara",
    clientTel: "+224 621 11 22 33",
    zone: "Kaloum",
    adresse: "Quartier Almamya, rue KA-020",
    urgence: "normale",
    statut: "envoyee",
    date: "19 oct. 2026",
    creneau: "À convenir",
    chronologie: chrono("envoyee", ["19 oct. · 18h47"]),
  },
  {
    id: "d-0998",
    reference: "#0998",
    titre: "Fabrication de placards",
    metier: "menuiserie",
    description: "Fabrication et pose de deux placards dans les chambres.",
    client: "Mohamed Camara",
    clientTel: "+224 621 11 22 33",
    technicienId: "mariama-soumah",
    zone: "Kaloum",
    adresse: "Immeuble Kaloum Center, 2e étage",
    urgence: "normale",
    statut: "terminee",
    evaluee: true,
    date: "28 sept. 2026",
    creneau: "30 sept. 2026 · 09h00",
    budget: 1200000,
    chronologie: chrono("terminee", ["28 sept. · 10h00", "28 sept. · 12h10", "30 sept. · 09h05", "30 sept. · 15h30", "30 sept. · 19h02"]).map((e) => ({ ...e, fait: true })),
  },
  {
    id: "d-0991",
    reference: "#0991",
    titre: "Menuiserie porte d'entrée",
    metier: "menuiserie",
    description: "Réparation de la porte d'entrée qui ferme mal.",
    client: "Mohamed Camara",
    clientTel: "+224 621 11 22 33",
    zone: "Kaloum",
    adresse: "Quartier Almamya, rue KA-020",
    urgence: "normale",
    statut: "annulee",
    date: "20 sept. 2026",
    creneau: "—",
    chronologie: chrono("annulee", ["20 sept. · 11h00"]),
  },
];

/** Demandes reçues par le technicien connecté (Mamadou Diallo). */
export const DEMANDES_RECUES: Demande[] = [
  DEMANDES[0],
  DEMANDES[1],
  {
    id: "d-1027",
    reference: "#1027",
    titre: "Panne de courant partielle",
    metier: "electricite",
    description: "Une partie de la maison n'a plus de courant depuis ce matin, le disjoncteur saute.",
    client: "Fatoumata Sow",
    clientTel: "+224 622 33 44 55",
    zone: "Dixinn",
    adresse: "Dixinn Port, près de la mosquée",
    urgence: "urgente",
    statut: "envoyee",
    date: "22 oct. 2026",
    creneau: "Aujourd'hui · dès que possible",
    budget: 200000,
    chronologie: chrono("envoyee", ["22 oct. · 07h41"]),
  },
  {
    id: "d-1026",
    reference: "#1026",
    titre: "Installation de ventilateurs",
    metier: "electricite",
    description: "Pose de 3 ventilateurs de plafond dans un appartement.",
    client: "Oumar Sylla",
    clientTel: "+224 623 44 55 66",
    zone: "Matam",
    adresse: "Matam, carrefour Bonfi",
    urgence: "normale",
    statut: "envoyee",
    date: "21 oct. 2026",
    creneau: "25 oct. 2026 · 14h00",
    budget: 300000,
    chronologie: chrono("envoyee", ["21 oct. · 20h15"]),
  },
  {
    id: "d-1015",
    reference: "#1015",
    titre: "Tableau électrique",
    metier: "electricite",
    description: "Remplacement d'un tableau électrique vétuste.",
    client: "Abdoulaye Bah",
    clientTel: "+224 624 55 66 77",
    zone: "Kaloum",
    adresse: "Boulbinet",
    urgence: "normale",
    statut: "terminee",
    date: "12 oct. 2026",
    creneau: "13 oct. 2026 · 08h00",
    budget: 1500000,
    chronologie: chrono("terminee", ["12 oct. · 09h00", "12 oct. · 10h00", "13 oct. · 08h10", "13 oct. · 16h45"]),
  },
];

export const TOUTES_DEMANDES = [...DEMANDES, ...DEMANDES_RECUES.filter((d) => !DEMANDES.includes(d))];

/* ----------------------------------------------------------- Notifications */

export type TypeNotification = "demande" | "mission" | "avis" | "verification" | "systeme";

export interface Notification {
  id: string;
  type: TypeNotification;
  titre: string;
  texte: string;
  date: string;
  lu: boolean;
}

export const NOTIFICATIONS_CLIENT: Notification[] = [
  { id: "n1", type: "mission", titre: "Intervention démarrée", texte: "Mamadou Diallo a commencé l'intervention « Réparation de climatisation ».", date: "Il y a 5 min", lu: false },
  { id: "n2", type: "demande", titre: "Demande acceptée", texte: "Votre demande « Installation électrique » a été acceptée par Mamadou Diallo.", date: "Il y a 2 h", lu: false },
  { id: "n3", type: "avis", titre: "Donnez votre avis", texte: "Comment s'est passée l'intervention « Fuite d'eau cuisine » ?", date: "Hier", lu: false },
  { id: "n4", type: "systeme", titre: "Bienvenue sur GDC", texte: "Complétez votre profil pour faciliter vos prochaines demandes.", date: "28 sept.", lu: true },
];

export const NOTIFICATIONS_TECHNICIEN: Notification[] = [
  { id: "t1", type: "demande", titre: "Nouvelle demande de service", texte: "Fatoumata Sow a besoin d'un électricien à Dixinn (urgent).", date: "Il y a 2 min", lu: false },
  { id: "t2", type: "mission", titre: "Mission acceptée", texte: "Votre intervention « Installation électrique » est confirmée pour le 24 oct.", date: "Il y a 15 min", lu: false },
  { id: "t3", type: "avis", titre: "Nouvel avis", texte: "Abdoulaye Bah vous a laissé un avis 5 étoiles.", date: "Il y a 1 h", lu: false },
  { id: "t4", type: "verification", titre: "Vérification en cours", texte: "Votre dossier niveau 3 est en cours d'évaluation.", date: "Il y a 3 h", lu: true },
  { id: "t5", type: "mission", titre: "Rappel de mission", texte: "Votre mission « Réparation de climatisation » commence aujourd'hui à 10h00.", date: "Ce matin", lu: true },
  { id: "t6", type: "systeme", titre: "Profil consulté 48 fois", texte: "Votre profil a été vu 48 fois cette semaine.", date: "Lundi", lu: true },
];

/* ---------------------------------------------------------- Administration */

export type Role = "client" | "technicien" | "admin";

export interface Utilisateur {
  id: string;
  nom: string;
  role: Role;
  telephone: string;
  zone: string;
  statut: "actif" | "suspendu" | "en_attente";
  inscrit: string;
  demandes: number;
}

export const UTILISATEURS: Utilisateur[] = [
  { id: "u1", nom: "Mohamed Camara", role: "client", telephone: "+224 621 11 22 33", zone: "Kaloum", statut: "actif", inscrit: "28 sept. 2026", demandes: 6 },
  { id: "u2", nom: "Mamadou Diallo", role: "technicien", telephone: "+224 620 00 00 01", zone: "Kaloum", statut: "actif", inscrit: "14 janv. 2026", demandes: 54 },
  { id: "u3", nom: "Fatoumata Sow", role: "client", telephone: "+224 622 33 44 55", zone: "Dixinn", statut: "actif", inscrit: "2 août 2026", demandes: 3 },
  { id: "u4", nom: "Ibrahima Camara", role: "technicien", telephone: "+224 620 00 00 02", zone: "Matam", statut: "actif", inscrit: "3 févr. 2026", demandes: 31 },
  { id: "u5", nom: "Oumar Sylla", role: "client", telephone: "+224 623 44 55 66", zone: "Matam", statut: "actif", inscrit: "17 juil. 2026", demandes: 2 },
  { id: "u6", nom: "Moussa Kouyaté", role: "technicien", telephone: "+224 620 00 00 06", zone: "Coyah", statut: "en_attente", inscrit: "5 avr. 2026", demandes: 22 },
  { id: "u7", nom: "Kadiatou Diallo", role: "client", telephone: "+224 625 66 77 88", zone: "Ratoma", statut: "actif", inscrit: "30 mai 2026", demandes: 4 },
  { id: "u8", nom: "Lansana Traoré", role: "technicien", telephone: "+224 620 00 00 08", zone: "Ratoma", statut: "suspendu", inscrit: "27 juin 2026", demandes: 35 },
  { id: "u9", nom: "Aminata Keita", role: "client", telephone: "+224 626 77 88 99", zone: "Matoto", statut: "actif", inscrit: "9 sept. 2026", demandes: 1 },
  { id: "u10", nom: "Thierno Diallo", role: "client", telephone: "+224 627 88 99 00", zone: "Coyah", statut: "suspendu", inscrit: "1 mars 2026", demandes: 5 },
  { id: "u11", nom: "Hawa Bangoura", role: "client", telephone: "+224 628 99 00 11", zone: "Ratoma", statut: "actif", inscrit: "12 oct. 2026", demandes: 1 },
  { id: "u12", nom: "Aïssatou Barry", role: "admin", telephone: "+224 629 00 11 22", zone: "Kaloum", statut: "actif", inscrit: "1 déc. 2025", demandes: 0 },
];

export type StatutVerification = "en_attente" | "en_cours" | "approuvee" | "refusee";

export const STATUTS_VERIFICATION: Record<StatutVerification, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  approuvee: "Approuvée",
  refusee: "Refusée",
};

export interface Verification {
  id: string;
  technicienId: string;
  niveau: Niveau;
  statut: StatutVerification;
  date: string;
  pieces: string[];
  commentaire?: string;
}

export const VERIFICATIONS: Verification[] = [
  { id: "v1", technicienId: "mamadou-diallo", niveau: 3, statut: "en_cours", date: "15 oct. 2026", pieces: ["CNI recto-verso", "Attestation de formation", "Portfolio (6 photos)", "2 recommandations"] },
  { id: "v2", technicienId: "moussa-kouyate", niveau: 1, statut: "en_attente", date: "20 oct. 2026", pieces: ["CNI recto-verso", "Selfie de contrôle"] },
  { id: "v3", technicienId: "sekou-bah", niveau: 2, statut: "en_attente", date: "19 oct. 2026", pieces: ["Diplôme CAP électricité", "Portfolio (3 photos)"] },
  { id: "v4", technicienId: "ibrahima-camara", niveau: 2, statut: "approuvee", date: "2 oct. 2026", pieces: ["BTS électrotechnique"], commentaire: "Diplôme authentifié auprès de l'établissement." },
  { id: "v5", technicienId: "alpha-conde", niveau: 2, statut: "approuvee", date: "28 sept. 2026", pieces: ["Attestation employeur", "Test pratique"] },
  { id: "v6", technicienId: "lansana-traore", niveau: 3, statut: "refusee", date: "21 sept. 2026", pieces: ["Recommandations"], commentaire: "Nombre de missions insuffisant pour le niveau 3." },
];

export type StatutAvis = "publie" | "en_attente" | "masque";

export interface AvisModeration {
  id: string;
  auteur: string;
  technicienId: string;
  note: number;
  texte: string;
  date: string;
  statut: StatutAvis;
  signale: boolean;
}

export const AVIS_MODERATION: AvisModeration[] = [
  { id: "m1", auteur: "Abdoulaye Bah", technicienId: "mamadou-diallo", note: 5, texte: "Très bon travail, rapide et propre.", date: "12 oct. 2026", statut: "publie", signale: false },
  { id: "m2", auteur: "Anonyme", technicienId: "sekou-bah", note: 1, texte: "Arnaqueur, ne venez jamais chez lui !!!", date: "18 oct. 2026", statut: "en_attente", signale: true },
  { id: "m3", auteur: "Mariam Diallo", technicienId: "mamadou-diallo", note: 5, texte: "Travail bien fait.", date: "8 sept. 2026", statut: "publie", signale: false },
  { id: "m4", auteur: "Oumar Sylla", technicienId: "sekou-bah", note: 4, texte: "Intervention rapide, prix un peu élevé.", date: "1 oct. 2026", statut: "publie", signale: false },
  { id: "m5", auteur: "Ibrahim K.", technicienId: "lansana-traore", note: 2, texte: "Service moyen, pas venu à l'heure prévue et pas prévenu.", date: "16 oct. 2026", statut: "en_attente", signale: false },
  { id: "m6", auteur: "Client test", technicienId: "alpha-conde", note: 5, texte: "Super super super, appelez le 620...", date: "14 oct. 2026", statut: "masque", signale: true },
];

export type StatutSignalement = "ouvert" | "en_cours" | "resolu";

export interface Signalement {
  id: string;
  type: "Profil suspect" | "Avis frauduleux" | "Contenu inapproprié" | "Usurpation d'identité" | "Litige mission";
  cible: string;
  auteur: string;
  motif: string;
  date: string;
  statut: StatutSignalement;
  priorite: "haute" | "moyenne" | "basse";
}

export const SIGNALEMENTS: Signalement[] = [
  { id: "s1", type: "Profil suspect", cible: "Sékou Bah", auteur: "Oumar Sylla", motif: "Les photos du portfolio semblent provenir d'internet.", date: "21 oct. 2026", statut: "ouvert", priorite: "haute" },
  { id: "s2", type: "Avis frauduleux", cible: "Avis #m6", auteur: "Alpha Condé", motif: "Avis rédigé par un concurrent, numéro de téléphone inclus.", date: "15 oct. 2026", statut: "en_cours", priorite: "moyenne" },
  { id: "s3", type: "Litige mission", cible: "Mission #1012", auteur: "Mohamed Camara", motif: "Désaccord sur le montant final de l'intervention.", date: "11 oct. 2026", statut: "resolu", priorite: "moyenne" },
  { id: "s4", type: "Usurpation d'identité", cible: "Lansana Traoré", auteur: "Système", motif: "Le numéro de pièce d'identité est déjà utilisé par un autre compte.", date: "20 oct. 2026", statut: "ouvert", priorite: "haute" },
  { id: "s5", type: "Contenu inapproprié", cible: "Thierno Diallo", auteur: "Moussa Kouyaté", motif: "Messages insultants envoyés après la mission.", date: "9 oct. 2026", statut: "resolu", priorite: "basse" },
];

/* --------------------------------------------------------------- Statistiques */

export const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const ACTIVITE_SEMAINE = {
  demandes: [62, 78, 71, 94, 88, 105, 34],
  missions: [48, 61, 58, 72, 70, 86, 31],
};

export const MOIS = ["Nov", "Déc", "Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct"];
export const CROISSANCE = {
  utilisateurs: [80, 140, 210, 290, 380, 470, 590, 720, 850, 990, 1120, 1248],
  techniciens: [30, 55, 90, 130, 170, 205, 250, 290, 330, 365, 395, 420],
};

export const STATS_ADMIN = {
  utilisateurs: 1248,
  techniciens: 420,
  profilsCompletes: 78,
  verificationsEnAttente: 186,
  demandes: 532,
  missions: 428,
  satisfaction: 4.3,
  alertes: 12,
};

export const REVENUS_MOIS = [1.2, 1.8, 2.1, 2.9, 3.4, 4.0, 4.6, 5.3, 6.1, 6.8, 7.4, 8.2]; // millions GNF

export const DEPENSES_CLIENT = [
  { mois: "Mai", montant: 0.2 },
  { mois: "Juin", montant: 0.45 },
  { mois: "Juil", montant: 0.3 },
  { mois: "Août", montant: 0.8 },
  { mois: "Sept", montant: 1.2 },
  { mois: "Oct", montant: 1.35 },
]; // millions GNF

/* -------------------------------------------------------- Utilisateurs connectés */

export const CLIENT_CONNECTE = {
  nom: "Mohamed Camara",
  prenom: "Mohamed",
  telephone: "+224 621 11 22 33",
  email: "mohamed.camara@exemple.gn",
  zone: "Kaloum",
  adresse: "Quartier Almamya, rue KA-020",
  type: "Particulier",
};

export const TECHNICIEN_CONNECTE = TECHNICIENS[0];

/* ------------------------------------------------------------------- Helpers */

export const getMetier = (id: MetierId) => METIERS.find((m) => m.id === id)!;
export const getTechnicien = (id: string) => TECHNICIENS.find((t) => t.id === id);
export const getDemande = (id: string) => TOUTES_DEMANDES.find((d) => d.id === id);

export const formatGNF = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/\p{Zs}/gu, String.fromCharCode(160))} GNF`;
