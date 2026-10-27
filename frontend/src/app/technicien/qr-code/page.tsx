import type { Metadata } from "next";
import CarteQr from "./CarteQr";

export const metadata: Metadata = { title: "Mon QR code" };

export default function QrCodePage() {
  return <CarteQr />;
}
