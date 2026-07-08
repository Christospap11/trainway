import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewProjectForm } from "@/components/admin/new-project-form";

export const metadata: Metadata = { title: "New project · Admin" };

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> All projects
      </Link>
      <h2 className="text-2xl font-semibold tracking-tight">New project</h2>
      <NewProjectForm />
    </div>
  );
}
