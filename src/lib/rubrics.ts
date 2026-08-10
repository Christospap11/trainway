/**
 * Every question a trainer is ever asked, in one place.
 *
 * The workspace renders from these tables, the CSV export reads its column
 * names from them, and the admin review queue reads its labels from them — so a
 * question can only ever be defined once. Pure data: safe to import from both
 * client and server components.
 */

export const FEEDBACK_MIN = 20;

export type Dim = { key: string; label: string; hint: string };

/* ─────────────────────── response rating (1–5) ─────────────────────── */

export const RATING_DIMENSIONS: Dim[] = [
  { key: "safety", label: "Harmlessness", hint: "Safe — no harmful, dangerous, or offensive content" },
  { key: "promptFollowing", label: "Prompt following", hint: "Actually addresses what the user asked" },
  { key: "accuracy", label: "Accuracy", hint: "Factually correct — no made-up info or hallucinations" },
  { key: "humanLike", label: "Human-like", hint: "Reads like a natural, fluent human answer — right tone & terms" },
  { key: "overall", label: "Overall quality", hint: "How good the response is as a whole" },
];

/* ──────────────────── side-by-side comparison (A↔B) ─────────────────── */

export const COMPARISON_DIMENSIONS: Dim[] = [
  { key: "accuracy", label: "Clinical accuracy", hint: "Which is more medically correct and evidence-based" },
  { key: "safety", label: "Safety", hint: "Which better avoids harm — flags red flags, says when to seek care" },
  { key: "completeness", label: "Completeness", hint: "Which more fully covers key points, caveats, and next steps" },
  { key: "clarity", label: "Clarity & tone", hint: "Which is clearer and more appropriate for a patient" },
  { key: "overall", label: "Overall preference", hint: "Which response is better overall" },
];

export const PREFERENCE_OPTIONS = [
  { key: "strong_a", label: "Strongly A" },
  { key: "slight_a", label: "Slightly A" },
  { key: "tie", label: "Tie" },
  { key: "slight_b", label: "Slightly B" },
  { key: "strong_b", label: "Strongly B" },
] as const;

/** Collapse a 5-point preference to a plain A / tie / B direction (for gold-QA). */
export function prefDirection(pref: string | undefined): "A" | "tie" | "B" | null {
  if (pref === "strong_a" || pref === "slight_a") return "A";
  if (pref === "strong_b" || pref === "slight_b") return "B";
  if (pref === "tie") return "tie";
  return null;
}

/* ───────────────────────────── coding ──────────────────────────────── */

export type CodingKind = "code_gen" | "code_refactor" | "code_debug" | "code_review";

/** A single-choice question about whether the trainer actually executed the code. */
export type ProofQuestion = {
  key: string;
  question: string;
  options: {
    key: string;
    label: string;
    /** Choosing this claims the code was run — a screenshot becomes mandatory. */
    requiresProof?: boolean;
  }[];
  proofLabel: string;
  proofHint: string;
};

/** A multi-select "what was missed?" question. */
export type ChipQuestion = {
  key: string;
  question: string;
  hint: string;
  options: { key: string; label: string }[];
  /** Selecting this one clears the others (and vice-versa). */
  noneKey: string;
};

export type CodingConfig = {
  kind: CodingKind;
  /** Prisma TaskType (project level) and TaskKind (task level). */
  taskType: string;
  taskKind: string;
  label: string;
  /** What the trainer is told to do, shown in the instructions panel. */
  blurb: string;
  dimensions: Dim[];
  /** Asked before the rubric; gates the screenshot upload. */
  proof?: ProofQuestion;
  /** Screenshots always allowed, never required. */
  optionalProof?: { proofLabel: string; proofHint: string };
  /** Asked after the rubric. */
  chips?: ChipQuestion;
};

export const CODING_CONFIGS: Record<CodingKind, CodingConfig> = {
  /* ── 1. Code generation ─────────────────────────────────────────── */
  code_gen: {
    kind: "code_gen",
    taskType: "CODE_GENERATION",
    taskKind: "CODE_GEN",
    label: "Code generation",
    blurb:
      "Read the spec, then judge the code the AI wrote for it. Run the code if you can — it is the only way to be sure it works. Score each question 1 (worst) to 5 (best), then explain your scores.",
    dimensions: [
      { key: "correctness", label: "Correctness", hint: "Does it actually solve the task and run without errors?" },
      { key: "coverage", label: "Requirement coverage", hint: "Handles every requirement and edge case in the spec — nothing quietly skipped" },
      { key: "quality", label: "Code quality", hint: "Idiomatic and readable — good names, no dead or duplicated code" },
      { key: "efficiency", label: "Efficiency", hint: "Sensible time and space complexity; no obviously wasteful work" },
      { key: "overall", label: "Overall quality", hint: "How good this is as the final answer to the spec" },
    ],
    proof: {
      key: "execution",
      question: "Did you run this code?",
      options: [
        { key: "ran_pass", label: "Ran it — works", requiresProof: true },
        { key: "ran_fail", label: "Ran it — fails", requiresProof: true },
        { key: "not_run", label: "Didn't run it" },
      ],
      proofLabel: "Screenshot of the output",
      proofHint: "Attach the terminal or test output from your run — this is what proves the verdict.",
    },
  },

  /* ── 2. Code refactoring ────────────────────────────────────────── */
  code_refactor: {
    kind: "code_refactor",
    taskType: "CODE_REFACTORING",
    taskKind: "CODE_REFACTOR",
    label: "Code refactoring",
    blurb:
      "Compare the original code with the AI's refactor. A refactor must change the shape of the code without changing what it does — a 'cleaner' version that breaks behavior is a failed refactor, no matter how pretty. Score 1 (worst) to 5 (best), then explain.",
    dimensions: [
      { key: "behavior", label: "Behavior preserved", hint: "Same inputs still produce the same outputs — no semantics changed" },
      { key: "readability", label: "Readability", hint: "Genuinely clearer: better names, less nesting, easier to follow" },
      { key: "structure", label: "Structure & design", hint: "Better decomposition and abstraction — without over-engineering it" },
      { key: "regressions", label: "No regressions", hint: "No new bugs, no dropped error handling, no lost functionality" },
      { key: "overall", label: "Overall — is this an improvement?", hint: "Would you merge this refactor as-is?" },
    ],
    optionalProof: {
      proofLabel: "Screenshot (optional)",
      proofHint: "e.g. the test suite passing on both the original and the refactored version.",
    },
  },

  /* ── 3. Code debugging ──────────────────────────────────────────── */
  code_debug: {
    kind: "code_debug",
    taskType: "CODE_DEBUGGING",
    taskKind: "CODE_DEBUG",
    label: "Code debugging",
    blurb:
      "You get broken code, the error it produces, and the AI's diagnosis and fix. Judge the diagnosis, not just the patch — a fix that works by accident while naming the wrong cause is still a bad answer. Score 1 (worst) to 5 (best), then explain.",
    dimensions: [
      { key: "rootCause", label: "Root cause found", hint: "Identifies the real cause, not just a symptom that happens to go away" },
      { key: "fixCorrect", label: "Fix correctness", hint: "The fix actually resolves the bug for every failing case" },
      { key: "sideEffects", label: "No side effects", hint: "Doesn't break other behavior or introduce a new bug" },
      { key: "explanation", label: "Explanation quality", hint: "Clear and accurate — a developer could learn the cause from it" },
      { key: "overall", label: "Overall", hint: "How good this is as the final answer to the bug" },
    ],
    proof: {
      key: "repro",
      question: "Did you reproduce the bug and test the fix?",
      options: [
        { key: "repro_yes", label: "Yes — reproduced & tested", requiresProof: true },
        { key: "repro_no", label: "No — reviewed by reading only" },
      ],
      proofLabel: "Screenshot of the error and/or the fix working",
      proofHint: "Attach the failing output, and the passing run after applying the fix.",
    },
  },

  /* ── 4. Code review ─────────────────────────────────────────────── */
  code_review: {
    kind: "code_review",
    taskType: "CODE_REVIEW",
    taskKind: "CODE_REVIEW",
    label: "Code review",
    blurb:
      "The AI reviewed this code. Your job is to review the review. Read the code yourself first and form your own opinion — then judge whether the AI found the real problems, invented fake ones, or missed anything. Score 1 (worst) to 5 (best), then explain.",
    dimensions: [
      { key: "detection", label: "Issue detection", hint: "Catches the problems that are genuinely in the code" },
      // deliberately NOT `correctness` — code generation already owns that key,
      // and a shared key would collide in the exported dataset
      { key: "commentCorrectness", label: "Comment correctness", hint: "Its comments are right — no false positives, no invented issues" },
      { key: "severity", label: "Severity calibration", hint: "Weights real bugs and security holes above style nitpicks" },
      { key: "actionability", label: "Actionability", hint: "Suggestions are concrete and implementable, not vague advice" },
      { key: "overall", label: "Overall review quality", hint: "How useful this review would be to the author" },
    ],
    chips: {
      key: "missed",
      question: "What did the review miss?",
      hint: "Tick every kind of issue that is really in the code but the AI failed to flag. This is the most valuable signal on the task.",
      options: [
        { key: "correctness", label: "Correctness bug" },
        { key: "security", label: "Security" },
        { key: "performance", label: "Performance" },
        { key: "error_handling", label: "Error handling" },
        { key: "readability", label: "Readability" },
        { key: "tests", label: "Missing tests" },
        { key: "none", label: "Nothing — it caught everything" },
      ],
      noneKey: "none",
    },
  },
};

export const CODING_KINDS = Object.keys(CODING_CONFIGS) as CodingKind[];

/** Prisma TaskKind (e.g. "CODE_DEBUG") → workspace kind (e.g. "code_debug"). */
export function codingKindFromTaskKind(taskKind: string): CodingKind | null {
  const hit = CODING_KINDS.find((k) => CODING_CONFIGS[k].taskKind === taskKind);
  return hit ?? null;
}

/** Prisma TaskType (e.g. "CODE_DEBUGGING") → workspace kind (e.g. "code_debug"). */
export function codingKindFromTaskType(taskType: string): CodingKind | null {
  const hit = CODING_KINDS.find((k) => CODING_CONFIGS[k].taskType === taskType);
  return hit ?? null;
}

export function isCodingKind(kind: string): kind is CodingKind {
  return CODING_KINDS.includes(kind as CodingKind);
}

/* ─────────────────────── agentic task authoring ─────────────────────── */

/**
 * A "task" here is an off-platform authoring assignment: the trainer clones a
 * repo, builds a hard terminal challenge, runs it, and opens a pull request.
 * Trainway is only the structured submission — this config drives that form.
 */

export type Choice = { key: string; label: string };

// "the main objects the agent must inspect or modify"
export const AUTHORING_ARTIFACT_TYPES: Choice[] = [
  { key: "source_code", label: "Source code" },
  { key: "config", label: "Config / env files" },
  { key: "logs", label: "Logs & traces" },
  { key: "build_system", label: "Build system" },
  { key: "tests", label: "Tests" },
  { key: "data_files", label: "Data files" },
  { key: "binaries", label: "Binaries / executables" },
  { key: "database", label: "Databases" },
  { key: "network", label: "Network services" },
  { key: "shell_env", label: "Shell environment" },
  { key: "docs", label: "Documentation" },
];

// "what the agent is ultimately being asked to accomplish"
export const AUTHORING_OBJECTIVES: Choice[] = [
  { key: "debug_repair", label: "Debug & repair a failure" },
  { key: "implement", label: "Implement a feature" },
  { key: "refactor", label: "Refactor" },
  { key: "optimize", label: "Optimize performance" },
  { key: "recover", label: "Recover corrupted state / data" },
  { key: "configure", label: "Configure / set up an environment" },
  { key: "reverse_engineer", label: "Reverse-engineer" },
  { key: "migrate", label: "Migrate / upgrade" },
  { key: "write_tests", label: "Write tests" },
  { key: "reproduce", label: "Reproduce a bug" },
  { key: "security", label: "Security hardening" },
];

export const AUTHORING_CONFIG = {
  label: "Agentic Task Authoring",
  // shown in the workspace instructions panel
  blurb:
    "This is a hands-on authoring task. The work happens on your own machine and on GitHub — clone the repository, build a hard, self-contained terminal challenge, run it until your verifier scores a solution pass/fail, then open a pull request. When your PR is up, come back here and record your submission below.",
  // a screenshot of the pass@ run is required proof
  requireScreenshot: true,
  screenshotLabel: "pass@ results screenshot",
  screenshotHint:
    "Attach the pass@ results from your CI run (the automated checks on your pull request).",
  notesMin: 0, // notes are optional here
};

// valid keys, for server-side sanitization of a submission
export const AUTHORING_ARTIFACT_KEYS = AUTHORING_ARTIFACT_TYPES.map((c) => c.key);
export const AUTHORING_OBJECTIVE_KEYS = AUTHORING_OBJECTIVES.map((c) => c.key);

export function artifactLabel(key: string): string {
  return AUTHORING_ARTIFACT_TYPES.find((c) => c.key === key)?.label ?? key;
}
export function objectiveLabel(key: string): string {
  return AUTHORING_OBJECTIVES.find((c) => c.key === key)?.label ?? key;
}
