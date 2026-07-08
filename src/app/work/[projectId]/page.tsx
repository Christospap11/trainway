import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWorkspace } from "@/lib/queries";
import { TaskWorkspace } from "@/components/work/task-workspace";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "TRAINER" && user.status !== "APPROVED") redirect("/dashboard");

  const data = await getWorkspace(projectId, user.id);
  if (!data) notFound();

  // must be qualified and the project must be open to work it
  if (!data.qualified || data.paused) {
    redirect(`/dashboard/projects/${projectId}`);
  }

  return (
    <TaskWorkspace
      project={data.project}
      kind={data.kind}
      tasks={data.tasks}
    />
  );
}
