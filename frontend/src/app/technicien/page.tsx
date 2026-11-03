import type { Metadata } from "next";
import TableauDeBordTechnicien from "./TableauDeBordTechnicien";

export const metadata: Metadata = { title: "Tableau de bord technicien" };

export default function TechnicienDashboard() {
  return <TableauDeBordTechnicien />;
}
