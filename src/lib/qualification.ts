/**
 * Trainer qualification quizzes. The answer key (`correct`) is SERVER-ONLY —
 * `getQuiz()` strips it before anything reaches the client, and `gradeQuiz()`
 * runs on the server. Never import the BANK into a "use client" component.
 */

export type QuizQuestion = { q: string; options: string[]; correct: number };
export type ClientQuestion = { q: string; options: string[] };
export type QuizKind = "rating" | "comparison" | "writing";

export const QUIZ_PASS_RATIO = 0.75; // need 3 of 4

const BANK: Record<QuizKind, QuizQuestion[]> = {
  rating: [
    {
      q: "When rating an AI response, what should you reward most?",
      options: ["Accuracy and helpfulness", "Longer answers", "A confident tone", "Nice formatting"],
      correct: 0,
    },
    {
      q: "A response sounds confident but is factually wrong. You should…",
      options: ["Rate it low — it's inaccurate", "Rate it high for confidence", "Always skip it", "Give it an average score"],
      correct: 0,
    },
    {
      q: "What are the issue tags for?",
      options: ["To explain why a score is low", "To finish tasks faster", "Decoration only", "Only for perfect answers"],
      correct: 0,
    },
    {
      q: "Two answers are equally correct, but one is much longer. The longer one is…",
      options: ["Not automatically better", "Always better", "Always worse", "Something to flag"],
      correct: 0,
    },
  ],
  comparison: [
    {
      q: "When choosing between two responses, what matters most?",
      options: ["Accuracy and helpfulness", "Which one is longer", "Which one is shown first", "Which has better formatting"],
      correct: 0,
    },
    {
      q: "When should you pick 'Tie'?",
      options: ["When they're genuinely equal", "Whenever you're unsure", "Never", "To move faster"],
      correct: 0,
    },
    {
      q: "Before deciding, you should always…",
      options: ["Read both responses fully", "Pick A by default", "Pick the longer one", "Skip the prompt"],
      correct: 0,
    },
    {
      q: "Response A is in the first position. Should its position affect your choice?",
      options: ["No", "Yes, always prefer A", "Yes, always prefer B", "Only when it's a tie"],
      correct: 0,
    },
  ],
  writing: [
    {
      q: "What makes a good written response?",
      options: ["Accurate, clear, and complete", "As long as possible", "Full of complex words", "Just restating the prompt"],
      correct: 0,
    },
    {
      q: "If you're unsure of the correct answer, you should…",
      options: ["Reason carefully and give your best accurate answer", "Guess randomly", "Always skip", "Copy the prompt text"],
      correct: 0,
    },
    {
      q: "Your response should always…",
      options: ["Directly address what the prompt asks", "Go off-topic but in detail", "Be a single word", "Match other trainers' answers"],
      correct: 0,
    },
    {
      q: "Code or technical answers should be…",
      options: ["Correct and functional", "Made to look complex", "As short as possible regardless of correctness", "Left untested"],
      correct: 0,
    },
  ],
};

/** Questions WITHOUT the answer key — safe to send to the client. */
export function getQuiz(kind: QuizKind): ClientQuestion[] {
  return (BANK[kind] ?? []).map(({ q, options }) => ({ q, options }));
}

/** Server-side grading. */
export function gradeQuiz(
  kind: QuizKind,
  answers: number[],
): { passed: boolean; score: number; total: number } {
  const bank = BANK[kind] ?? [];
  const score = bank.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const total = bank.length;
  return { passed: total > 0 && score / total >= QUIZ_PASS_RATIO, score, total };
}

/** Map a Prisma TaskType enum to a quiz kind (or null if no quiz exists). */
export function quizKindForTaskType(taskType: string): QuizKind | null {
  if (taskType === "RESPONSE_RATING") return "rating";
  if (taskType === "SIDE_BY_SIDE") return "comparison";
  if (taskType === "RESPONSE_WRITING") return "writing";
  return null;
}
