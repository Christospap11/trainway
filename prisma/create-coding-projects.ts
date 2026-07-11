import "dotenv/config";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { csvToTasks } from "../src/lib/parse-tasks";

/**
 * One-off: create the two Python coding projects and load their tasks.
 *
 * Mirrors what the admin UI does (createProject + addTasksBulk) but skips the
 * silent auto-align entirely — the kind is stated outright, so a project can't
 * be flipped to the wrong type again.
 *
 * Idempotent: if the slug already exists it is left completely alone.
 *
 *   npx tsx prisma/create-coding-projects.ts
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Row = {
  prompt?: string;
  language?: string;
  code?: string;
  originalCode?: string;
  refactoredCode?: string;
  aiResponse?: string;
  isGold?: boolean;
  goldMin?: number;
  goldMax?: number;
};

const PROJECTS = [
  {
    slug: "python-code-generation",
    title: "Python Code Generation — Quality Review",
    description:
      "Judge Python code an AI wrote against a real engineering spec. For each task you'll read the requirements, the code, and the model's own explanation of its approach, then score it on correctness, requirement coverage, code quality, efficiency, and overall — and say why. Half of these solutions contain a deliberate flaw; run the code if you can, because a solution that reads beautifully and is subtly wrong is exactly what we're hunting.",
    taskType: "CODE_GENERATION" as const,
    kind: "CODE_GEN" as const,
    file: "codegen_upload.csv",
    required: ["code"] as const,
  },
  {
    slug: "python-code-refactoring-review",
    title: "Python Code Refactoring — Quality Review",
    description:
      "Judge whether an AI's refactor is one you'd actually merge. You'll see the original code, the refactored version, and the model's plan. A refactor must change the shape of the code without changing what it does — a cleaner version that quietly breaks behavior is a failed refactor, no matter how good it looks. Score behavior preservation, readability, structure, regressions, and overall.",
    taskType: "CODE_REFACTORING" as const,
    kind: "CODE_REFACTOR" as const,
    file: "refactoring_upload.csv",
    required: ["originalCode", "refactoredCode"] as const,
  },
];

const PAY_CENTS = 3500; // $35/hr

function loadRows(file: string): Row[] {
  const raw = readFileSync(join(homedir(), "Downloads", file), "utf8");
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return csvToTasks(text) as Row[];
}

async function main() {
  for (const p of PROJECTS) {
    const existing = await prisma.project.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`⏭️  "${p.slug}" already exists — left untouched.`);
      continue;
    }

    const rows = loadRows(p.file);
    if (rows.length === 0) throw new Error(`${p.file}: no rows parsed`);

    // validate BEFORE writing anything — a half-loaded project is worse than none
    for (const [i, r] of rows.entries()) {
      if (!r.prompt?.trim()) throw new Error(`${p.file} row ${i + 1}: missing prompt`);
      for (const col of p.required) {
        if (!(r[col] ?? "").trim()) throw new Error(`${p.file} row ${i + 1}: missing ${col}`);
      }
    }

    const tasks = rows.map((r) => ({
      kind: p.kind,
      prompt: r.prompt!.trim(),
      data:
        p.kind === "CODE_GEN"
          ? { language: r.language, code: r.code, aiResponse: r.aiResponse || undefined }
          : {
              language: r.language,
              originalCode: r.originalCode,
              refactoredCode: r.refactoredCode,
              aiResponse: r.aiResponse || undefined,
            },
      isGold: !!r.isGold,
      goldAnswer: r.isGold ? { min: r.goldMin ?? 1, max: r.goldMax ?? 5 } : undefined,
    }));

    await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          slug: p.slug,
          title: p.title,
          description: p.description,
          taskType: p.taskType,
          difficulty: "ADVANCED",
          status: "AVAILABLE",
          payRateCents: PAY_CENTS,
          tasksAvailable: tasks.length,
        },
      });
      await tx.task.createMany({
        data: tasks.map((t) => ({ ...t, projectId: project.id })),
      });
    });

    const gold = tasks.filter((t) => t.isGold).length;
    console.log(`✅ ${p.title}\n   /${p.slug} · ${p.taskType} · ${tasks.length} tasks (${gold} gold) · $${PAY_CENTS / 100}/hr`);
  }
}

main()
  .catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
