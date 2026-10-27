"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { enter, gsap, useGSAP } from "./gsap";

type ToastType = "success" | "info" | "error";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const EVENT = "gdc:toast";

/** Affiche une notification éphémère depuis n'importe quel composant client. */
export function toast(message: string, type: ToastType = "success") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, type } }));
}

const ICONS = { success: CheckCircle2, info: Info, error: XCircle };
const COLORS = { success: "text-emerald-500", info: "text-brand-600", error: "text-red-500" };

function Toast({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = ICONS[item.type];

  useGSAP(() => {
    gsap
      .timeline({ onComplete: () => onDone(item.id) })
      .add(enter(ref.current, { x: 60, autoAlpha: 0, duration: 0.5, ease: "back.out(1.6)" }))
      .fromTo(".toast-bar", { scaleX: 1 }, { scaleX: 0, duration: 3.2, ease: "none" }, "<")
      .to(ref.current, { x: 60, autoAlpha: 0, duration: 0.35, ease: "power2.in" });
  }, { scope: ref });

  return (
    <div
      ref={ref}
      role="status"
      className="pointer-events-auto relative flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${COLORS[item.type]}`} />
      <p className="text-sm font-medium text-slate-800">{item.message}</p>
      <span className="toast-bar absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent-500" />
    </div>
  );
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let id = 0;
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      setItems((prev) => [...prev, { id: ++id, message, type }]);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((item) => (
        <Toast key={item.id} item={item} onDone={(done) => setItems((prev) => prev.filter((t) => t.id !== done))} />
      ))}
    </div>
  );
}
