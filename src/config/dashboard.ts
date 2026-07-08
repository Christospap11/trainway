import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const dashboardNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Earnings", href: "/dashboard/earnings", icon: Wallet },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
];
