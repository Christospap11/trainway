import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getProjectsForUser } from "@/lib/queries";
import { ProjectsBrowser } from "@/components/dashboard/projects-browser";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await getSession();
  if (!user) return null;
  const projects = await getProjectsForUser(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
        <p className="mt-1 text-muted">
          Browse projects you can work on and qualify for new ones.
        </p>
      </div>

      <ProjectsBrowser projects={projects} />
    </div>
  );
}
