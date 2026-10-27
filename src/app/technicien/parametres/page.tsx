import type { Metadata } from "next";
import SettingsView from "@/components/shared/SettingsView";

export const metadata: Metadata = { title: "Paramètres du compte" };

export default function ParametresPage() {
  return <SettingsView role="technicien" />;
}
