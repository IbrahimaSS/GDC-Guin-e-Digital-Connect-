// Génération de fichiers côté navigateur (export CSV, export de données).

/** Déclenche le téléchargement d'un contenu texte. */
export function telecharger(nom: string, contenu: string, type: string) {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * CSV lisible directement par Excel en français : séparateur « ; » et BOM UTF-8 pour les accents.
 */
export function telechargerCsv(nom: string, colonnes: string[], lignes: (string | number)[][]) {
  const cellule = (v: string | number) => {
    const t = String(v);
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = [colonnes, ...lignes].map((l) => l.map(cellule).join(";")).join("\r\n");
  telecharger(nom, String.fromCharCode(0xfeff) + csv, "text/csv;charset=utf-8");
}

/** Date du jour au format AAAA-MM-JJ, pour nommer les fichiers. */
export const dateFichier = () => new Date().toISOString().slice(0, 10);
