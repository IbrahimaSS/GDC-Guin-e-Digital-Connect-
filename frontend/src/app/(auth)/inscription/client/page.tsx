import type { Metadata } from "next";
import { Suspense } from "react";
import InscriptionClientForm from "./InscriptionClientForm";

export const metadata: Metadata = { title: "Inscription client" };

export default function InscriptionClientPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-50" />}>
      <InscriptionClientForm />
    </Suspense>
  );
}
