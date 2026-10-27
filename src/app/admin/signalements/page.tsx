import type { Metadata } from "next";
import GestionSignalements from "./GestionSignalements";

export const metadata: Metadata = { title: "Signalements" };

export default function SignalementsPage() {
  return <GestionSignalements />;
}
