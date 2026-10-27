import DashboardShell from "@/components/layout/DashboardShell";

export default function Layout({ children }: LayoutProps<"/client">) {
  return <DashboardShell role="client">{children}</DashboardShell>;
}
