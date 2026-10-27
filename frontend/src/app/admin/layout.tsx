import DashboardShell from "@/components/layout/DashboardShell";

export default function Layout({ children }: LayoutProps<"/admin">) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
