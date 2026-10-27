import DashboardShell from "@/components/layout/DashboardShell";

export default function Layout({ children }: LayoutProps<"/technicien">) {
  return <DashboardShell role="technicien">{children}</DashboardShell>;
}
