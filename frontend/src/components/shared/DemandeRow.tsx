import { CalendarDays, ChevronRight, MapPin, Zap } from "lucide-react";
import Link from "next/link";
import { Avatar, MetierIcon } from "@/components/ui";
import { getTechnicien, type Demande } from "@/lib/data";
import { StatutDemandeBadge } from "./status";

/** Ligne de demande cliquable, utilisée côté client et côté technicien. */
export default function DemandeRow({ demande, href, vue = "client" }: { demande: Demande; href: string; vue?: "client" | "technicien" }) {
  const tech = demande.technicienId ? getTechnicien(demande.technicienId) : undefined;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
    >
      <span className="hidden rounded-xl bg-accent-50 p-3 text-accent-500 transition group-hover:bg-accent-500 group-hover:text-white sm:block">
        <MetierIcon metier={demande.metier} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-bold text-slate-900">{demande.titre}</p>
          {demande.urgence === "urgente" && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">
              <Zap className="size-3" /> Urgent
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{demande.reference}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {demande.zone}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" /> {demande.creneau}
          </span>
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        {vue === "client" ? (
          tech ? (
            <>
              <Avatar nom={tech.nom} className="size-8 text-[10px]" />
              <span className="text-sm font-medium text-slate-700">{tech.nom}</span>
            </>
          ) : (
            <span className="text-sm italic text-slate-400">En recherche de technicien</span>
          )
        ) : (
          <>
            <Avatar nom={demande.client} className="size-8 text-[10px]" />
            <span className="text-sm font-medium text-slate-700">{demande.client}</span>
          </>
        )}
      </div>
      <StatutDemandeBadge statut={demande.statut} />
      <ChevronRight className="size-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
    </Link>
  );
}
