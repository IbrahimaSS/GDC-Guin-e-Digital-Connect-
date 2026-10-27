import type { Metadata } from "next";
import ModerationAvis from "./ModerationAvis";

export const metadata: Metadata = { title: "Avis et modération" };

export default function AvisPage() {
  return <ModerationAvis />;
}
