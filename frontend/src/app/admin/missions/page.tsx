import type { Metadata } from "next";
import GestionMissions from "./GestionMissions";

export const metadata: Metadata = { title: "Missions" };

export default function MissionsPage() {
  return <GestionMissions />;
}
