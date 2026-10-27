import {
  BadgeCheck,
  Cog,
  Droplets,
  Hammer,
  Monitor,
  Paintbrush,
  Snowflake,
  Star,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import Counter from "@/components/motion/Counter";
import Sparkline from "@/components/motion/Sparkline";
import { NIVEAUX, PHOTOS, type MetierId, type Niveau } from "@/lib/data";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ Marque */

export { default as Logo } from "./Logo";

export function GuineeFlag({ className = "h-3" }: { className?: string }) {
  return (
    <span className={cn("inline-flex overflow-hidden rounded-[3px]", className)} aria-hidden>
      <span className="w-1.5 bg-red-600" />
      <span className="w-1.5 bg-yellow-400" />
      <span className="w-1.5 bg-green-600" />
    </span>
  );
}

const METIER_ICONS: Record<MetierId, LucideIcon> = {
  electricite: Zap,
  plomberie: Droplets,
  maconnerie: Hammer,
  menuiserie: Wrench,
  mecanique: Cog,
  informatique: Monitor,
  peinture: Paintbrush,
  climatisation: Snowflake,
};

export function MetierIcon({ metier, className = "size-6" }: { metier: string; className?: string }) {
  const Icon = METIER_ICONS[metier as MetierId] ?? Wrench;
  return <Icon className={className} />;
}

/* --------------------------------------------------------------- Personnes */

const AVATAR_GRADIENTS = [
  "from-brand-500 to-brand-800",
  "from-accent-400 to-accent-600",
  "from-sky-400 to-brand-600",
  "from-emerald-400 to-emerald-700",
  "from-violet-400 to-violet-700",
  "from-rose-400 to-rose-600",
];

/** Photo de la personne si elle existe, sinon ses initiales. */
export function Avatar({ nom, photo, className = "size-11 text-sm" }: { nom: string; photo?: string; className?: string }) {
  const src = photo ?? PHOTOS[nom];
  if (src) {
    return (
      <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-full bg-slate-200", className)} aria-hidden>
        <Image src={src} alt="" fill sizes="160px" className="object-cover object-[50%_25%]" />
      </span>
    );
  }
  const initiales = nom
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const hash = [...nom].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
        AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length],
        className,
      )}
      aria-hidden
    >
      {initiales}
    </span>
  );
}

export function Rating({ note, nbAvis, className }: { note: number; nbAvis?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-slate-900">{note.toFixed(1)}</span>
      {nbAvis !== undefined && <span className="text-slate-500">({nbAvis} avis)</span>}
    </span>
  );
}

export function Stars({ note, className = "size-4" }: { note: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(className, i <= note ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------- Badges */

export type Tone = "blue" | "orange" | "green" | "red" | "slate" | "violet" | "amber";

const TONES: Record<Tone, string> = {
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  orange: "bg-accent-50 text-accent-600 ring-accent-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function Badge({ tone = "slate", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const NIVEAU_STYLES: Record<Niveau, string> = {
  1: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  2: "bg-brand-600 text-white",
  3: "bg-gradient-to-r from-accent-500 to-accent-400 text-white",
};

export function VerificationBadge({ niveau, long }: { niveau: Niveau; long?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold", NIVEAU_STYLES[niveau])}
      title={NIVEAUX[niveau].label}
    >
      <BadgeCheck className="size-3.5" />
      {long ? `Niveau ${niveau} – ${NIVEAUX[niveau].label}` : `Vérifié niveau ${niveau}`}
    </span>
  );
}

export function DispoBadge({ disponible }: { disponible: boolean }) {
  return disponible ? (
    <Badge tone="green" dot>
      Disponible
    </Badge>
  ) : (
    <Badge tone="slate" dot>
      Indisponible
    </Badge>
  );
}

/* ------------------------------------------------------------------ Boutons */

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent-500 text-white shadow-sm shadow-accent-500/30 hover:bg-accent-600 hover:shadow-md hover:shadow-accent-500/30",
  secondary: "bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700",
  outline: "border border-brand-600 text-brand-600 hover:bg-brand-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
  dark: "bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ------------------------------------------------------------------ Cartes */

export function Card({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, subtitle }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-500">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-950 md:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Pastille d'icône en dégradé plein + halo de couleur dans l'angle de la carte.
const STAT_TONES: Record<Tone, { icone: string; halo: string; trait: string }> = {
  blue: { icone: "from-brand-500 to-brand-700 shadow-brand-600/30", halo: "bg-brand-50", trait: "#0066cc" },
  orange: { icone: "from-accent-400 to-accent-600 shadow-accent-500/30", halo: "bg-accent-50", trait: "#ff8a00" },
  green: { icone: "from-emerald-400 to-emerald-600 shadow-emerald-500/30", halo: "bg-emerald-50", trait: "#10b981" },
  red: { icone: "from-rose-400 to-red-600 shadow-red-500/30", halo: "bg-red-50", trait: "#ef4444" },
  slate: { icone: "from-slate-400 to-slate-600 shadow-slate-500/30", halo: "bg-slate-100", trait: "#64748b" },
  violet: { icone: "from-violet-400 to-violet-600 shadow-violet-500/30", halo: "bg-violet-50", trait: "#8b5cf6" },
  amber: { icone: "from-amber-300 to-amber-500 shadow-amber-500/30", halo: "bg-amber-50", trait: "#f59e0b" },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  decimals,
  suffix,
  tone = "blue",
  trend,
  spark,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  tone?: Tone;
  trend?: string;
  /** Série courte affichée en mini-courbe de tendance. */
  spark?: number[];
}) {
  return (
    <Card className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <span className={cn("absolute -right-8 -top-8 size-28 rounded-full transition-transform duration-500 group-hover:scale-125", STAT_TONES[tone].halo)} aria-hidden />
      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            "rounded-xl bg-gradient-to-br p-2.5 text-white shadow-lg transition duration-300 group-hover:-rotate-6 group-hover:scale-110",
            STAT_TONES[tone].icone,
          )}
        >
          <Icon className="size-5" />
        </span>
        {trend && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">{trend}</span>}
      </div>
      <p className="relative mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        <Counter value={value} decimals={decimals} suffix={suffix} />
      </p>
      <div className="relative flex items-end justify-between gap-2">
        <p className="mt-0.5 text-sm text-slate-500">{label}</p>
        {spark && <Sparkline data={spark} color={STAT_TONES[tone].trait} className="-mb-1 h-9 w-24 shrink-0" />}
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="rounded-2xl bg-brand-50 p-4 text-brand-600">
        <Icon className="size-7" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Formulaires */

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputClass, "cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "min-h-28 resize-y", className)} {...props} />;
}
