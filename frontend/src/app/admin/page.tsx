import type { Metadata } from "next";
import TableauDeBordAdmin from "./TableauDeBordAdmin";

export const metadata: Metadata = { title: "Back-office – Tableau de bord" };

export default function AdminDashboard() {
  return <TableauDeBordAdmin />;
}
