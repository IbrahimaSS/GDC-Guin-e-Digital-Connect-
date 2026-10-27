// Code de début d'intervention : le client le présente, le technicien le scanne ou le saisit à son arrivée.
// Il prouve que l'intervention a bien eu lieu chez le client (base des avis vérifiés).
// En production, le code est généré et vérifié par le serveur ; ici il est dérivé de la référence.

export function codeMission(demandeId: string): string {
  let h = 0;
  for (const c of demandeId) h = (h * 31 + c.charCodeAt(0)) % 9000;
  return String(1000 + h);
}

const PREFIXE = "GDC-MISSION";

/** Contenu du QR code de début d'intervention. */
export const qrMission = (demandeId: string) => `${PREFIXE}:${demandeId}:${codeMission(demandeId)}`;

/** Vérifie un QR code scanné ou un code saisi pour une mission donnée. */
export function verifierCode(demandeId: string, saisie: string): boolean {
  const t = saisie.trim();
  if (t.startsWith(PREFIXE)) {
    const [, id, code] = t.split(":");
    return id === demandeId && code === codeMission(demandeId);
  }
  return t.replace(/\D/g, "") === codeMission(demandeId);
}
