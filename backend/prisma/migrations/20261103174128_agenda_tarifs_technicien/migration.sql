-- AlterTable
ALTER TABLE "ProfilTechnicien" ADD COLUMN     "agenda" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "tarifs" JSONB NOT NULL DEFAULT '[]';
