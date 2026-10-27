"use client";

import { Menu, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { enter, gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { cn, LinkButton, Logo } from "@/components/ui";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Deux parcours principaux : chercher un professionnel ou publier un besoin.
const NAV: { href: string; label: string; actif?: string[] }[] = [
  { href: "/", label: "Accueil" },
  { href: "/recherche", label: "Trouver un technicien", actif: ["/recherche", "/resultats", "/techniciens"] },
  { href: "/#metiers", label: "Métiers" },
  { href: "/#comment-ca-marche", label: "Comment ça marche ?" },
  { href: "/devenir-technicien", label: "Devenir technicien", actif: ["/devenir-technicien", "/inscription/technicien"] },
  { href: "/a-propos", label: "À propos", actif: ["/a-propos"] },
];

const PUBLIER = "/publier-une-demande";

export default function PublicHeader() {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  // Ombre + fond opaque dès que l'on fait défiler la page.
  useGSAP(
    () => {
      ScrollTrigger.create({
        start: 8,
        onToggle: (self) => header.current?.classList.toggle("is-scrolled", self.isActive),
      });
      gsap.set(header.current, { autoAlpha: 1 });
      enter(".hd-item", { y: -14, autoAlpha: 0, stagger: 0.05, duration: 0.6, delay: 0.1 });
    },
    { scope: header },
  );

  useGSAP(
    () => {
      if (!open) return;
      gsap.fromTo(".mm-panel", { height: 0 }, { height: "auto", duration: 0.45, ease: "power3.out" });
      enter(".mm-item", { x: -16, autoAlpha: 0, stagger: 0.05, duration: 0.4, delay: 0.1 });
    },
    { dependencies: [open], scope: header },
  );

  // Ancres de la page d’accueil : défilement fluide avec GSAP plutôt que le scroll-behavior CSS,
  // qui fausse les mesures de ScrollTrigger.
  function allerA(e: React.MouseEvent, href: string) {
    setOpen(false);
    const [chemin, ancre] = href.split("#");
    if (!ancre || pathname !== (chemin || "/")) return;
    e.preventDefault();
    gsap.to(window, { scrollTo: { y: `#${ancre}`, offsetY: 80 }, duration: 0.9, ease: "power3.inOut" });
    history.replaceState(null, "", href);
  }

  const isActive = (item: (typeof NAV)[number]) =>
    item.href === "/" ? pathname === "/" : (item.actif ?? []).some((p) => pathname.startsWith(p));

  return (
    <header
      ref={header}
      data-page-transition
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_12px_rgba(11,42,91,0.06)] backdrop-blur-xl transition-shadow duration-300 [&.is-scrolled]:shadow-[0_4px_20px_rgba(11,42,91,0.10)]"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-6">
        <Link href="/" aria-label="Accueil GDC" className="hd-item shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center xl:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={(e) => allerA(e, n.href)}
              className={cn(
                "hd-item relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isActive(n) ? "text-accent-500" : "text-slate-600 hover:text-brand-600",
              )}
            >
              {n.label}
              {isActive(n) && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent-500" />}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <ThemeToggle className="hd-item" />
          <LinkButton href="/connexion" variant="ghost" className="hd-item text-brand-600">
            Se connecter
          </LinkButton>
          <LinkButton href={PUBLIER} className="hd-item">
            <Send className="size-4" /> Publier une demande
          </LinkButton>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <ThemeToggle />
          <LinkButton href={PUBLIER} size="sm" className="hidden sm:inline-flex">
            Publier une demande
          </LinkButton>
          <button className="rounded-lg p-2" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mm-panel overflow-hidden border-t border-slate-200 bg-white xl:hidden">
          <div className="flex flex-col gap-1 px-4 py-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={(e) => allerA(e, n.href)}
                className={cn("mm-item rounded-lg px-3 py-2.5 text-sm font-semibold", isActive(n) ? "bg-accent-50 text-accent-600" : "text-slate-700")}
              >
                {n.label}
              </Link>
            ))}
            <div className="mm-item mt-2 grid grid-cols-2 gap-2">
              <LinkButton href="/connexion" variant="outline" onClick={() => setOpen(false)}>
                Se connecter
              </LinkButton>
              <LinkButton href={PUBLIER} onClick={() => setOpen(false)}>
                Publier une demande
              </LinkButton>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
