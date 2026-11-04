import type { ReactNode } from "react";
import GardeInscription from "./GardeInscription";

export default function InscriptionLayout({ children }: { children: ReactNode }) {
  return <GardeInscription>{children}</GardeInscription>;
}
