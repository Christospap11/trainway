import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  Users,
  Banknote,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const adminNav: AdminNavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Submissions", href: "/admin/submissions", icon: ClipboardCheck },
  { label: "Trainers", href: "/admin/trainers", icon: Users },
  { label: "Payouts", href: "/admin/payouts", icon: Banknote },
];
