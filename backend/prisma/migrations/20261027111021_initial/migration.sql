-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'TECHNICIEN', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('ACTIF', 'SUSPENDU', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('PARTICULIER', 'ENTREPRISE');

-- CreateEnum
CREATE TYPE "StatutVerification" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'APPROUVEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('ENVOYEE', 'ACCEPTEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutDevis" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'PAYE');

-- CreateEnum
CREATE TYPE "MoyenPaiement" AS ENUM ('ORANGE', 'MTN', 'ESPECES');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHOUE', 'REVERSE');

-- CreateEnum
CREATE TYPE "StatutAvis" AS ENUM ('PUBLIE', 'EN_ATTENTE', 'MASQUE');

-- CreateEnum
CREATE TYPE "StatutSignalement" AS ENUM ('OUVERT', 'EN_COURS', 'RESOLU');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "googleId" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "statut" "StatutCompte" NOT NULL DEFAULT 'ACTIF',
    "photoUrl" TEXT,
    "typeClient" "TypeClient",
    "entreprise" TEXT,
    "zoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeOtp" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "essais" INTEGER NOT NULL DEFAULT 0,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "appareil" TEXT,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "revoqueLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metier" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "specialites" TEXT[],
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilTechnicien" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metierId" TEXT NOT NULL,
    "specialites" TEXT[],
    "experience" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT NOT NULL DEFAULT '',
    "niveau" INTEGER NOT NULL DEFAULT 0,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "disponibilites" TEXT NOT NULL DEFAULT 'Lundi – Samedi (8h – 18h)',
    "note" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nbAvis" INTEGER NOT NULL DEFAULT 0,
    "nbMissions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilTechnicien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Realisation" (
    "id" TEXT NOT NULL,
    "technicienId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Realisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "technicienId" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL,
    "statut" "StatutVerification" NOT NULL DEFAULT 'EN_ATTENTE',
    "pieces" JSONB NOT NULL DEFAULT '[]',
    "message" TEXT,
    "commentaire" TEXT,
    "decideurId" TEXT,
    "decideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demande" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "technicienId" TEXT,
    "metierId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "dateSouhaitee" TIMESTAMP(3),
    "creneau" TEXT,
    "budget" INTEGER,
    "photos" TEXT[],
    "statut" "StatutDemande" NOT NULL DEFAULT 'ENVOYEE',
    "codeIntervention" TEXT NOT NULL,
    "accepteeLe" TIMESTAMP(3),
    "demarreeLe" TIMESTAMP(3),
    "termineeLe" TIMESTAMP(3),
    "annuleeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Demande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "statut" "StatutDevis" NOT NULL DEFAULT 'BROUILLON',
    "deplacement" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "envoyeLe" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneDevis" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneDevis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "moyen" "MoyenPaiement" NOT NULL,
    "numero" TEXT,
    "montant" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "confirmeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "texte" TEXT,
    "photoUrl" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "technicienId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "criteres" JSONB,
    "tags" TEXT[],
    "commentaire" TEXT,
    "recommande" BOOLEAN,
    "reponse" TEXT,
    "statut" "StatutAvis" NOT NULL DEFAULT 'PUBLIE',
    "signale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signalement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cible" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "priorite" TEXT NOT NULL DEFAULT 'moyenne',
    "statut" "StatutSignalement" NOT NULL DEFAULT 'OUVERT',
    "auteurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signalement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvoiNotification" (
    "id" TEXT NOT NULL,
    "evenement" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'envoye',
    "erreur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvoiNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeleNotification" (
    "evenement" TEXT NOT NULL,
    "canaux" TEXT[],
    "texte" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeleNotification_pkey" PRIMARY KEY ("evenement")
);

-- CreateTable
CREATE TABLE "Parametre" (
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parametre_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "_ZonesIntervention" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ZonesIntervention_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telephone_key" ON "User"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_role_statut_idx" ON "User"("role", "statut");

-- CreateIndex
CREATE INDEX "CodeOtp_telephone_createdAt_idx" ON "CodeOtp"("telephone", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Metier_label_key" ON "Metier"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_nom_key" ON "Zone"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilTechnicien_userId_key" ON "ProfilTechnicien"("userId");

-- CreateIndex
CREATE INDEX "ProfilTechnicien_metierId_disponible_niveau_idx" ON "ProfilTechnicien"("metierId", "disponible", "niveau");

-- CreateIndex
CREATE INDEX "Verification_statut_idx" ON "Verification"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Demande_numero_key" ON "Demande"("numero");

-- CreateIndex
CREATE INDEX "Demande_clientId_statut_idx" ON "Demande"("clientId", "statut");

-- CreateIndex
CREATE INDEX "Demande_technicienId_statut_idx" ON "Demande"("technicienId", "statut");

-- CreateIndex
CREATE INDEX "Demande_zoneId_metierId_statut_idx" ON "Demande"("zoneId", "metierId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_demandeId_key" ON "Devis"("demandeId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_devisId_key" ON "Paiement"("devisId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_reference_key" ON "Paiement"("reference");

-- CreateIndex
CREATE INDEX "Message_demandeId_createdAt_idx" ON "Message"("demandeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Avis_demandeId_key" ON "Avis"("demandeId");

-- CreateIndex
CREATE INDEX "Avis_technicienId_statut_idx" ON "Avis"("technicienId", "statut");

-- CreateIndex
CREATE INDEX "Notification_userId_lu_createdAt_idx" ON "Notification"("userId", "lu", "createdAt");

-- CreateIndex
CREATE INDEX "EnvoiNotification_createdAt_idx" ON "EnvoiNotification"("createdAt");

-- CreateIndex
CREATE INDEX "_ZonesIntervention_B_index" ON "_ZonesIntervention"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilTechnicien" ADD CONSTRAINT "ProfilTechnicien_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilTechnicien" ADD CONSTRAINT "ProfilTechnicien_metierId_fkey" FOREIGN KEY ("metierId") REFERENCES "Metier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Realisation" ADD CONSTRAINT "Realisation_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "ProfilTechnicien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "ProfilTechnicien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_decideurId_fkey" FOREIGN KEY ("decideurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "ProfilTechnicien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_metierId_fkey" FOREIGN KEY ("metierId") REFERENCES "Metier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "Demande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneDevis" ADD CONSTRAINT "LigneDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "Demande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "Demande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "ProfilTechnicien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ZonesIntervention" ADD CONSTRAINT "_ZonesIntervention_A_fkey" FOREIGN KEY ("A") REFERENCES "ProfilTechnicien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ZonesIntervention" ADD CONSTRAINT "_ZonesIntervention_B_fkey" FOREIGN KEY ("B") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
