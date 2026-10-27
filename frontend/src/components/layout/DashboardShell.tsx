"use client";

import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Flag,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareText,
  MessagesSquare,
  PlusCircle,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  User,
  UserCog,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { enter, gsap, useGSAP } from "@/components/motion/gsap";
import PageTransition from "@/components/motion/PageTransition";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Avatar, cn, Logo } from "@/components/ui";
import type { Role } from "@/lib/data";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const NAV: Record<Role, { sections: { titre?: string; items: NavItem[] }[]; user: { nom: string; role: string } }> = {
  client: {
    user: { nom: "Mohamed Camara", role: "Client" },
    sections: [
      {
        items: [
          { href: "/client", label: "Tableau de bord", icon: LayoutDashboard },
          { href: "/client/demandes", label: "Mes demandes", icon: ClipboardList, badge: 4 },
          { href: "/client/demandes/nouvelle", label: "Nouvelle demande", icon: PlusCircle },
          { href: "/client/messages", label: "Messages", icon: MessagesSquare, badge: 1 },
          { href: "/recherche", label: "Trouver un pro", icon: Search },
        ],
      },
      {
        titre: "Compte",
        items: [
          { href: "/client/notifications", label: "Notifications", icon: Bell, badge: 3 },
          { href: "/client/profil", label: "Mon profil", icon: User },
          { href: "/client/parametres", label: "Paramètres", icon: Settings },
        ],
      },
    ],
  },
  technicien: {
    user: { nom: "Mamadou Diallo", role: "Électricien · Niveau 2" },
    sections: [
      {
        items: [
          { href: "/technicien", label: "Tableau de bord", icon: LayoutDashboard },
          { href: "/technicien/demandes", label: "Demandes reçues", icon: Inbox, badge: 2 },
          { href: "/technicien/messages", label: "Messages", icon: MessagesSquare, badge: 2 },
          { href: "/technicien/disponibilite", label: "Disponibilité", icon: CalendarClock },
        ],
      },
      {
        titre: "Mon activité",
        items: [
          { href: "/technicien/profil", label: "Profil professionnel", icon: UserCog },
          { href: "/technicien/portfolio", label: "Portfolio", icon: Images },
          { href: "/technicien/avis", label: "Avis reçus", icon: Star },
          { href: "/technicien/verification", label: "Vérification", icon: ShieldCheck },
          { href: "/technicien/qr-code", label: "Mon QR code", icon: QrCode },
        ],
      },
      {
        titre: "Compte",
        items: [
          { href: "/technicien/notifications", label: "Notifications", icon: Bell, badge: 3 },
          { href: "/technicien/parametres", label: "Paramètres", icon: Settings },
        ],
      },
    ],
  },
  admin: {
    user: { nom: "Aïssatou Barry", role: "Administratrice" },
    sections: [
      {
        items: [
          { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
          { href: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
        ],
      },
      {
        titre: "Gestion",
        items: [
          { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
          { href: "/admin/techniciens", label: "Techniciens", icon: Wrench },
          { href: "/admin/verifications", label: "Vérifications", icon: ShieldCheck, badge: 3 },
          { href: "/admin/missions", label: "Missions", icon: BriefcaseBusiness },
        ],
      },
      {
        titre: "Modération",
        items: [
          { href: "/admin/avis", label: "Avis", icon: MessageSquareText, badge: 2 },
          { href: "/admin/signalements", label: "Signalements", icon: Flag, badge: 2 },
        ],
      },
      {
        titre: "Référentiels",
        items: [
          { href: "/admin/metiers", label: "Métiers", icon: SlidersHorizontal },
          { href: "/admin/zones", label: "Zones", icon: MapPinned },
          { href: "/admin/parametres", label: "Paramètres", icon: Settings },
        ],
      },
    ],
  },
};

const HOME: Record<Role, string> = { client: "/client", technicien: "/technicien", admin: "/admin" };
const ESPACE: Record<Role, string> = { client: "Espace client", technicien: "Espace technicien", admin: "Back-office" };

/** Fil d'Ariane déduit de la navigation : Espace › Rubrique (› Détail pour les pages plus profondes). */
function FilAriane({ role }: { role: Role }) {
  const pathname = usePathname();
  const active = activeHref(pathname, role);
  const item = NAV[role].sections.flatMap((sec) => sec.items).find((i) => i.href === active);
  if (!item || item.href === HOME[role]) return null;
  const detail = pathname !== item.href;
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
      <Link href={HOME[role]} className="transition-colors hover:text-brand-600">
        {ESPACE[role]}
      </Link>
      <ChevronRight className="size-3.5" />
      {detail ? (
        <>
          <Link href={item.href} className="transition-colors hover:text-brand-600">
            {item.label}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-slate-600">Détail</span>
        </>
      ) : (
        <span className="text-slate-600">{item.label}</span>
      )}
    </nav>
  );
}

function activeHref(pathname: string, role: Role) {
  const all = NAV[role].sections.flatMap((s) => s.items.map((i) => i.href));
  return all
    .filter((h) => pathname === h || pathname.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];
}

function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeHref(pathname, role);
  // Barre bleue GDC (dégradé) pour les espaces client et back-office ; bleu nuit pour l'espace technicien.
  const bleue = role === "client" || role === "admin";
  const conf = NAV[role];

  return (
    <div
      className={cn(
        "flex h-full flex-col text-brand-100",
        bleue ? "bg-gradient-to-b from-brand-700 via-brand-800 to-brand-950" : "bg-brand-950",
      )}
    >
      <div className="flex h-16 items-center px-6">
        <Link href={HOME[role]} onClick={onNavigate}>
          <Logo light />
        </Link>
      </div>
      <nav className="scrollbar-none flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {conf.sections.map((s, si) => (
          <div key={si}>
            {s.titre && (
              <p className={cn("sb-item mb-2 px-3 text-[11px] font-bold uppercase tracking-wider", "text-brand-100/50")}>
                {s.titre}
              </p>
            )}
            <ul className="space-y-0.5">
              {s.items.map((item) => {
                const isActive = item.href === active;
                return (
                  <li key={item.href} className="sb-item">
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-[color,background-color,box-shadow] duration-200",
                        isActive
                          ? bleue
                            ? "bg-[#fff] text-[#0052a3] shadow-lg shadow-brand-950/30"
                            : "bg-brand-600 text-white shadow-lg shadow-brand-900/50"
                          : "hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <item.icon className="size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[11px] font-bold",
                            isActive ? (bleue ? "bg-brand-600 text-white" : "bg-white/25 text-white") : "bg-accent-500 text-white",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className={cn("m-3 rounded-2xl p-4", "bg-white/10")}>
        <p className={cn("text-sm font-bold", "text-white")}>Besoin d&apos;aide ?</p>
        <p className={cn("mt-0.5 text-xs", "text-brand-100/70")}>Notre équipe répond 7j/7.</p>
        <Link href="/a-propos" className="mt-2 inline-block text-xs font-bold text-accent-500 hover:underline">
          Contacter le support →
        </Link>
      </div>
    </div>
  );
}

function UserMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = NAV[role];

  // Referme le menu quand la page est masquée (navigation conservée par Activity).
  useLayoutEffect(() => () => setOpen(false), []);

  useGSAP(
    () => {
      if (open) gsap.fromTo(".um-panel", { y: -8, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.3 });
    },
    { dependencies: [open], scope: ref },
  );

  const base = HOME[role];
  const liens =
    role === "admin"
      ? [{ href: "/admin/parametres", label: "Paramètres", icon: Settings }]
      : [
          { href: `${base}/profil`, label: "Mon profil", icon: User },
          { href: `${base}/parametres`, label: "Paramètres", icon: Settings },
        ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-slate-100"
        aria-expanded={open}
      >
        <Avatar nom={user.nom} className="size-9 text-xs" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-bold leading-tight text-slate-900">{user.nom}</span>
          <span className="block text-xs text-slate-500">{user.role}</span>
        </span>
        <ChevronDown className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="um-panel absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {liens.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <l.icon className="size-4 text-slate-400" /> {l.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-slate-100" />
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="size-4" /> Déconnexion
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifHref = role === "admin" ? "/admin/signalements" : `${HOME[role]}/notifications`;

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.set(root.current, { autoAlpha: 1 }).add(enter(".shell-aside .sb-item", { x: -18, autoAlpha: 0, stagger: 0.035, duration: 0.5 }))
        .add(enter(".shell-top > *", { y: -10, autoAlpha: 0, stagger: 0.06, duration: 0.4 }), 0.1)
        .fromTo(".bell-icon", { rotate: 0 }, { rotate: 14, duration: 0.1, repeat: 5, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 0%" }, 0.8);
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!mobileOpen) return;
      gsap.fromTo(".mob-overlay", { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(".mob-panel", { xPercent: -100 }, { xPercent: 0, duration: 0.45, ease: "power4.out" });
      enter(".mob-panel .sb-item", { x: -16, autoAlpha: 0, stagger: 0.03, duration: 0.35, delay: 0.15 });
    },
    { dependencies: [mobileOpen], scope: root },
  );

  return (
    <div ref={root} data-page-transition className="min-h-screen bg-slate-50">
      <aside className="shell-aside fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar role={role} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="mob-overlay absolute inset-0 bg-brand-950/50" onClick={() => setMobileOpen(false)} />
          <div className="mob-panel absolute inset-y-0 left-0 w-72 shadow-2xl">
            <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg bg-white/10 p-1.5 text-white"
              aria-label="Fermer le menu"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
          <div className="shell-top flex h-16 items-center gap-3 px-4 md:px-8">
            <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </button>
            <label className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder={role === "admin" ? "Rechercher un utilisateur, une mission…" : "Rechercher…"}
                className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pl-9 pr-3 text-sm outline-none transition focus:border-brand-200 focus:bg-white focus:ring-4 focus:ring-brand-50"
              />
            </label>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link href={notifHref} className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Notifications">
                <Bell className="bell-icon size-5" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-accent-500 ring-2 ring-white" />
              </Link>
              <UserMenu role={role} />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">
          <PageTransition className="mx-auto max-w-[1600px]">
            <FilAriane role={role} />
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
