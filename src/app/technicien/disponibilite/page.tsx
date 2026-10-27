import type { Metadata } from "next";
import DisponibiliteView from "./DisponibiliteView";

export const metadata: Metadata = { title: "Disponibilité" };

export default function DisponibilitePage() {
  return <DisponibiliteView />;
}
