import type { Metadata } from "next";
import { Suspense } from "react";
import MessagerieView from "@/components/shared/MessagerieView";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-[520px] animate-pulse rounded-2xl bg-white" />}>
      <MessagerieView vue="client" />
    </Suspense>
  );
}
