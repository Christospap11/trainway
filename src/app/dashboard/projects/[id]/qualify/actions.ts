"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeQuiz, quizKindForTaskType } from "@/lib/qualification";

export type QualifyResult = {
  ok: boolean;
  error?: string;
  passed?: boolean;
  score?: number;
  total?: number;
};

/**
 * Grades a qualification attempt server-side. On pass, marks the trainer
 * qualified for the project (unlocking it on their dashboard) and notifies them.
 * On fail, nothing is written — they can retry.
 */
export async function submitQualification(
  projectSlug: string,
  answers: number[],
): Promise<QualifyResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "You're not signed in." };

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true, title: true, taskType: true },
  });
  if (!project) return { ok: false, error: "Project not found." };

  const kind = quizKindForTaskType(project.taskType);
  if (!kind) return { ok: false, error: "This project has no qualification quiz yet." };

  const cleanAnswers = Array.isArray(answers) ? answers.map((a) => Number(a)) : [];
  const { passed, score, total } = gradeQuiz(kind, cleanAnswers);

  if (passed) {
    try {
      await prisma.userQualification.upsert({
        where: { userId_projectId: { userId: user.id, projectId: project.id } },
        create: { userId: user.id, projectId: project.id, passed: true },
        update: { passed: true },
      });
      await prisma.notification.create({
        data: {
          userId: user.id,
          kind: "PROJECT",
          title: "Qualification passed",
          body: `You're now qualified for ${project.title} — start working anytime.`,
        },
      });
    } catch {
      return { ok: false, error: "Could not save your result. Please try again." };
    }
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${projectSlug}`);
    revalidatePath("/dashboard/profile");
  }

  return { ok: true, passed, score, total };
}
