import type { Metadata } from "next";
import TableauDeBordClient from "./TableauDeBordClient";

export const metadata: Metadata = { title: "Tableau de bord client" };

export default function ClientDashboard() {
  return <TableauDeBordClient />;
}
