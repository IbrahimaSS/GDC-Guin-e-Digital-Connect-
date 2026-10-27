"use client";

import { ArrowRight, User, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { Button, cn } from "@/components/ui";

const TYPES = [
  { id: "client", icon: User, titre: "Je suis client", texte: "Je cherche un professionnel pour mes travaux." },
  { id: "technicien", icon: Wrench, titre: "Je suis technicien ou artisan", texte: "Je propose mes services et je veux plus de missions." },
] as const;

export default function ChoixCompte() {
  const router = useRouter();
  const [choix, setChoix] = useState<"client" | "technicien">("client");

  return (
    <Reveal stagger={0.08}>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-950">Créer un compte</h1>
        <p className="mt-2 text-slate-500">Quel type de compte souhaitez-vous créer ?</p>
      </div>

      <div className="mt-8 space-y-3" role="radiogroup">
        {TYPES.map(({ id, icon: Icon, titre, texte }) => {
          const actif = choix === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => setChoix(id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors duration-200",
                actif ? "border-brand-600 bg-brand-50/60" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className={cn("rounded-xl p-3 transition-colors", actif ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500")}>
                <Icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-slate-900">{titre}</span>
                <span className="block text-sm text-slate-500">{texte}</span>
              </span>
              <span className={cn("flex size-5 items-center justify-center rounded-full border-2", actif ? "border-brand-600" : "border-slate-300")}>
                {actif && <span className="size-2.5 rounded-full bg-brand-600" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <Button size="lg" className="w-full" onClick={() => router.push(`/inscription/${choix}`)}>
          Continuer <ArrowRight className="size-4" />
        </Button>
        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-bold text-brand-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </Reveal>
  );
}
