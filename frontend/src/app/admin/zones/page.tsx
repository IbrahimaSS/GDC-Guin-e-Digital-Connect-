import type { Metadata } from "next";
import GestionZones from "./GestionZones";

export const metadata: Metadata = { title: "Zones" };

export default function ZonesPage() {
  return <GestionZones />;
}
