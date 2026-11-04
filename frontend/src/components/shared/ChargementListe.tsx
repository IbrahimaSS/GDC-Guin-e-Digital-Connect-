/** Emplacements gris animés pendant le chargement d'une liste. */
export default function ChargementListe({ lignes = 3 }: { lignes?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}
