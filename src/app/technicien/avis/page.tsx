import type { Metadata } from "next";
import AvisRecus from "./AvisRecus";

export const metadata: Metadata = { title: "Avis reçus" };

export default function AvisRecusPage() {
  return <AvisRecus />;
}
