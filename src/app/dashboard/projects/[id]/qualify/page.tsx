import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuiz, quizKindForTaskType } from "@/lib/qualification";
import { QualificationQuiz } from "@/components/dashboard/qualification-quiz";

export const metadata: Metadata = { title: "Qualification" };

export default async function QualifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { slug: id },
    select: { id: true, slug: true, title: true, taskType: true },
  });
  if (!project) notFound();

  const kind = quizKindForTaskType(project.taskType);
  if (!kind) {
    // no quiz for this task type — nothing to qualify for here
    redirect(`/dashboard/projects/${id}`);
  }

  // already qualified → straight to the project
  const existing = await prisma.userQualification.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: project.id } },
    select: { passed: true },
  });
  if (existing?.passed) redirect(`/dashboard/projects/${id}`);

  return (
    <QualificationQuiz
      slug={project.slug}
      projectTitle={project.title}
      questions={getQuiz(kind)}
    />
  );
}
