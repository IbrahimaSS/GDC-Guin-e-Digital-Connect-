"use client";

import { ArrowLeft, CheckCheck, ImagePlus, MessageSquareText, Phone, Search, Send, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { enter, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";
import { StatutDemandeBadge } from "@/components/shared/status";
import { Avatar, Card, cn, EmptyState } from "@/components/ui";
import { conversations, heureActuelle, nouvelId, REPONSES_DEMO, REPONSES_RAPIDES, useMessages, type Auteur, type Conversation, type Message } from "@/lib/messages";
import { notifier } from "@/lib/notifier";

const autre = (a: Auteur): Auteur => (a === "client" ? "technicien" : "client");

function Fil({ conv, vue }: { conv: Conversation; vue: Auteur }) {
  const [messages, setMessages] = useMessages(conv.demande.id);
  const [texte, setTexte] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [ecrit, setEcrit] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const nbPrecedent = useRef(messages.length);
  const interlocuteur = vue === "client" ? conv.technicien : conv.client;

  // Défilement en bas et apparition animée des nouveaux messages.
  useGSAP(
    () => {
      const el = fil.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: nbPrecedent.current ? "smooth" : "auto" });
      if (messages.length > nbPrecedent.current && !prefersReducedMotion()) {
        enter(el.querySelectorAll(".bulle:last-child"), { y: 16, scale: 0.94, autoAlpha: 0, duration: 0.4, ease: "back.out(2)" });
      }
      nbPrecedent.current = messages.length;
    },
    { dependencies: [messages.length, ecrit], scope: fil },
  );

  // Les messages reçus sont marqués comme lus à l'ouverture.
  useEffect(() => {
    if (messages.some((x) => x.auteur !== vue && !x.lu)) setMessages((liste) => liste.map((x) => (x.auteur !== vue ? { ...x, lu: true } : x)));
  }, [messages, vue, setMessages]);

  function envoyer(contenu: string, image?: string | null) {
    if (!contenu.trim() && !image) return;
    const message: Message = { id: nouvelId(), auteur: vue, texte: contenu.trim() || undefined, photo: image ?? undefined, heure: heureActuelle() };
    setMessages((l) => [...l, message]);
    setTexte("");
    setPhoto(null);
    if (vue === "client") notifier("nouveau_message", { client: conv.client, mission: conv.demande.titre });

    // Démonstration : réponse de l'interlocuteur après quelques secondes.
    window.setTimeout(() => setEcrit(true), 900);
    window.setTimeout(() => {
      setEcrit(false);
      const pool = REPONSES_DEMO[autre(vue)];
      setMessages((l) => [...l, { id: nouvelId(), auteur: autre(vue), texte: pool[l.length % pool.length], heure: heureActuelle() }]);
    }, 2800);
  }

  function soumettre(e: FormEvent) {
    e.preventDefault();
    envoyer(texte, photo);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <Link href={vue === "client" ? "/client/messages" : "/technicien/messages"} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Retour aux conversations">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar nom={interlocuteur} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{interlocuteur}</p>
          <p className="truncate text-xs text-slate-500">
            {conv.demande.reference} · {conv.demande.titre}
          </p>
        </div>
        <StatutDemandeBadge statut={conv.demande.statut} />
        <a href={`tel:${conv.demande.clientTel.replace(/\s/g, "")}`} className="rounded-xl bg-brand-50 p-2.5 text-brand-600 hover:bg-brand-100" aria-label="Appeler">
          <Phone className="size-4" />
        </a>
      </div>

      <div ref={fil} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-5">
        <p className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-[11px] text-slate-400 shadow-sm">Les échanges restent liés à la mission, pour votre sécurité.</p>
        {messages.map((msg) => {
          const moi = msg.auteur === vue;
          return (
            <div key={msg.id} className={cn("bulle flex", moi ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] overflow-hidden rounded-2xl text-sm shadow-sm",
                  moi ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-100",
                )}
              >
                {msg.photo && (
                  <span className="relative block h-44 w-64 max-w-full">
                    <Image src={msg.photo} alt="Photo envoyée" fill unoptimized={msg.photo.startsWith("blob:") || msg.photo.startsWith("data:")} sizes="256px" className="object-cover" />
                  </span>
                )}
                {msg.texte && <p className="whitespace-pre-wrap px-3.5 pt-2.5">{msg.texte}</p>}
                <p className={cn("flex items-center justify-end gap-1 px-3.5 pb-2 pt-1 text-[10px]", moi ? "text-brand-100" : "text-slate-400")}>
                  {msg.heure}
                  {moi && <CheckCheck className={cn("size-3.5", msg.lu ? "text-sky-300" : "")} />}
                </p>
              </div>
            </div>
          );
        })}
        {ecrit && (
          <div className="bulle flex justify-start">
            <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100" aria-label={`${interlocuteur} écrit…`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="scrollbar-none mb-2 flex gap-2 overflow-x-auto">
          {REPONSES_RAPIDES[vue].map((r) => (
            <button key={r} type="button" onClick={() => envoyer(r)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600">
              {r}
            </button>
          ))}
        </div>
        {photo && (
          <div className="relative mb-2 h-20 w-28 overflow-hidden rounded-xl ring-1 ring-slate-200">
            <Image src={photo} alt="" fill unoptimized className="object-cover" />
            <button type="button" onClick={() => setPhoto(null)} className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white" aria-label="Retirer la photo">
              <X className="size-3" />
            </button>
          </div>
        )}
        <form onSubmit={soumettre} className="flex items-end gap-2">
          <label className="cursor-pointer rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600" aria-label="Joindre une photo">
            <ImagePlus className="size-5" />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) return toast("Photo trop lourde (5 Mo maximum).", "error");
                // Conservée en data URL pour rester visible après rechargement de la page.
                const lecteur = new FileReader();
                lecteur.onload = () => setPhoto(String(lecteur.result));
                lecteur.readAsDataURL(f);
              }}
            />
          </label>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                envoyer(texte, photo);
              }
            }}
            rows={1}
            placeholder={`Écrire à ${interlocuteur.split(" ")[0]}…`}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={!texte.trim() && !photo}
            className="rounded-xl bg-accent-500 p-3 text-white shadow-sm transition-colors hover:bg-accent-600 disabled:opacity-40"
            aria-label="Envoyer"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Apercu({ conv, vue, actif, href }: { conv: Conversation; vue: Auteur; actif: boolean; href: string }) {
  const [messages] = useMessages(conv.demande.id);
  const dernier = messages[messages.length - 1];
  const nonLus = messages.filter((x) => x.auteur !== vue && !x.lu).length;
  const nom = vue === "client" ? conv.technicien : conv.client;
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-xl p-3 transition-colors", actif ? "bg-brand-50" : "hover:bg-slate-50")}>
      <Avatar nom={nom} className="size-11" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-bold text-slate-900">{nom}</p>
          <span className="shrink-0 text-[10px] text-slate-400">{dernier?.heure.split(" · ")[1] ?? ""}</span>
        </div>
        <p className="truncate text-xs font-medium text-brand-700">{conv.demande.titre}</p>
        <p className={cn("truncate text-xs", nonLus ? "font-semibold text-slate-800" : "text-slate-500")}>
          {dernier ? `${dernier.auteur === vue ? "Vous : " : ""}${dernier.texte ?? "📷 Photo"}` : "Démarrer la conversation"}
        </p>
      </div>
      {nonLus > 0 && <span className="rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white">{nonLus}</span>}
    </Link>
  );
}

/** Messagerie : liste des conversations et fil de discussion, pour le client ou le technicien. */
export default function MessagerieView({ vue }: { vue: Auteur }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const liste = conversations(vue);
  const [q, setQ] = useState("");
  const choisie = liste.find((c) => c.demande.id === params.get("c"));
  const visibles = liste.filter((c) => (c.demande.titre + c.client + c.technicien).toLowerCase().includes(q.toLowerCase()));

  // Sur grand écran, la première conversation s'ouvre d'office.
  useEffect(() => {
    if (!choisie && liste.length && window.matchMedia("(min-width: 1024px)").matches) router.replace(`${pathname}?c=${liste[0].demande.id}`, { scroll: false });
  }, [choisie, liste, pathname, router]);

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-950 md:text-[1.7rem]">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Échangez avec {vue === "client" ? "vos techniciens" : "vos clients"} au sujet de chaque mission.</p>
      </div>
      <Card className="grid h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className={cn("flex min-h-0 flex-col border-r border-slate-100", choisie && "hidden lg:flex")}>
          <label className="relative m-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une conversation"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:bg-white"
            />
          </label>
          <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {visibles.map((c) => (
              <Apercu key={c.demande.id} conv={c} vue={vue} actif={c.demande.id === choisie?.demande.id} href={`${pathname}?c=${c.demande.id}`} />
            ))}
          </div>
        </aside>
        <section className={cn("min-h-0", !choisie && "hidden lg:block")}>
          {choisie ? (
            <Fil key={choisie.demande.id} conv={choisie} vue={vue} />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState icon={MessageSquareText} title="Sélectionnez une conversation" text="Vos échanges avec chaque interlocuteur sont regroupés par mission." />
            </div>
          )}
        </section>
      </Card>
    </>
  );
}
