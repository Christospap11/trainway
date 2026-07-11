/**
 * Trainer qualification quizzes. The answer key (`correct`) is SERVER-ONLY —
 * `getQuiz()` strips it before anything reaches the client, and `gradeQuiz()`
 * runs on the server. Never import the BANK into a "use client" component.
 */

export type QuizQuestion = { q: string; options: string[]; correct: number };
export type ClientQuestion = { q: string; options: string[] };
export type QuizKind =
  | "rating"
  | "comparison"
  | "writing"
  | "code_gen"
  | "code_refactor"
  | "code_debug"
  | "code_review";

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

  /* ─────────────────────────── coding ─────────────────────────── */

  code_gen: [
    {
      q: "The code is clean and well-named, but it crashes on the empty input the spec explicitly required. Overall quality should be…",
      options: [
        "Low — it doesn't meet the spec",
        "High — the code is clean",
        "Average — it's half right",
        "Not your call; only judge the style",
      ],
      correct: 0,
    },
    {
      q: "You answer “Ran it — works”. What must you do?",
      options: [
        "Attach a screenshot of the output as proof",
        "Nothing else",
        "Paste the code again",
        "Link to your GitHub",
      ],
      correct: 0,
    },
    {
      q: "The spec says negative numbers must be handled, and the code silently ignores them. That is…",
      options: [
        "A requirement-coverage failure",
        "Fine — it's just an edge case",
        "Only a style problem",
        "An efficiency problem",
      ],
      correct: 0,
    },
    {
      q: "Two solutions are both correct, but one is O(n²) where an easy O(n) exists. The O(n²) one should lose points on…",
      options: ["Efficiency", "Harmlessness", "Requirement coverage", "Nothing at all"],
      correct: 0,
    },
  ],

  code_refactor: [
    {
      q: "A refactor is much prettier, but it changes what the function returns for one input. It should…",
      options: [
        "Score low — a refactor must preserve behavior",
        "Score high — it's cleaner",
        "Score high if the change is small",
        "Be skipped",
      ],
      correct: 0,
    },
    {
      q: "What is a refactor supposed to change?",
      options: [
        "The structure of the code, not what it does",
        "Both the structure and the behavior",
        "Only the comments",
        "The output of the program",
      ],
      correct: 0,
    },
    {
      q: "The refactor deletes error handling that was catching a real failure case. That is…",
      options: ["A regression", "Good — less code", "A readability win", "Irrelevant to the score"],
      correct: 0,
    },
    {
      q: "The refactor splits one clear 10-line function into six one-line functions. This is most likely…",
      options: [
        "Over-engineering — worse, not better",
        "Always an improvement",
        "Required by every style guide",
        "A behavior change",
      ],
      correct: 0,
    },
  ],

  code_debug: [
    {
      q: "The AI's patch makes the error disappear, but it names the wrong cause and just wraps everything in a catch-all. “Root cause found” should be…",
      options: [
        "Low — it never found the real cause",
        "High — the error is gone",
        "Average",
        "5 — anything that works is correct",
      ],
      correct: 0,
    },
    {
      q: "You answer “Yes — reproduced & tested”. What must you do?",
      options: [
        "Attach a screenshot showing the failure and/or the fix working",
        "Nothing else",
        "Rewrite the fix yourself",
        "Skip the task",
      ],
      correct: 0,
    },
    {
      q: "The fix resolves the reported bug but breaks a different function. Which question does that hit hardest?",
      options: ["No side effects", "Explanation quality", "Root cause found", "None of them"],
      correct: 0,
    },
    {
      q: "You have no way to run the code. You should…",
      options: [
        "Answer “reviewed by reading only” and score honestly",
        "Claim you ran it anyway",
        "Give every question a 3",
        "Attach any screenshot you have",
      ],
      correct: 0,
    },
  ],

  code_review: [
    {
      q: "The AI's review flags a “SQL injection risk” in code that never touches a database. That is…",
      options: [
        "A false positive — mark comment correctness down",
        "Good — it's being careful",
        "A severity problem, not a correctness one",
        "Fine, and shouldn't affect the score",
      ],
      correct: 0,
    },
    {
      q: "The review lists five style nitpicks and never mentions a crash-on-null bug. Severity calibration should be…",
      options: ["Low", "High", "Average", "Unaffected — it did find issues"],
      correct: 0,
    },
    {
      q: "The code has a real security hole the AI never mentioned. You should…",
      options: [
        "Tick “Security” under what the review missed",
        "Ignore it — you're only judging the review",
        "Flag the task as broken",
        "Give overall quality a 5 anyway",
      ],
      correct: 0,
    },
    {
      q: "“This function could probably be better” is an example of…",
      options: [
        "A comment that isn't actionable",
        "A false positive",
        "A severity mistake",
        "Excellent, concrete feedback",
      ],
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
  if (taskType === "CODE_GENERATION") return "code_gen";
  if (taskType === "CODE_REFACTORING") return "code_refactor";
  if (taskType === "CODE_DEBUGGING") return "code_debug";
  if (taskType === "CODE_REVIEW") return "code_review";
  return null;
}
