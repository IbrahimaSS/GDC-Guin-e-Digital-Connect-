import type { Metadata } from "next";
import ParametresPlateforme from "./ParametresPlateforme";

export const metadata: Metadata = { title: "Paramètres de la plateforme" };

export default function ParametresPlateformePage() {
  return <ParametresPlateforme />;
}
