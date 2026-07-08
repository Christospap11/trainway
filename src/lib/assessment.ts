/**
 * Application assessment. The answer key (`correct`) is SERVER-ONLY — the wizard
 * receives only questions via `getAssessment()`, and scoring runs server-side in
 * `gradeAssessment()`. Never import BANK into a "use client" component, and never
 * trust a client-computed score for the approval decision.
 */

export type AssessmentQuestion = { q: string; options: string[] };

const BANK = [
  {
    q: "Choose the grammatically correct sentence.",
    options: ["She don't like coffee.", "She doesn't like coffee.", "She not like coffee.", "She didn't likes coffee."],
    correct: 1,
  },
  {
    q: "Which word is the closest synonym for “concise”?",
    options: ["verbose", "brief", "complicated", "lengthy"],
    correct: 1,
  },
  {
    q: "“All roses are flowers. Some flowers fade quickly.” What follows?",
    options: ["All roses fade quickly.", "No roses fade quickly.", "We cannot conclude that any roses fade quickly.", "Most roses fade quickly."],
    correct: 2,
  },
  {
    q: "An AI answer states a confident but false fact. The best label is:",
    options: ["Helpful", "Hallucination", "Creative", "Concise"],
    correct: 1,
  },
];

/** Questions WITHOUT the answer key — safe to send to the client. */
export function getAssessment(): AssessmentQuestion[] {
  return BANK.map(({ q, options }) => ({ q, options }));
}

export const ASSESSMENT_LENGTH = BANK.length;

/** Server-side scoring → percentage (0–100). */
export function gradeAssessment(answers: number[]): number {
  const correct = BANK.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  return BANK.length ? Math.round((correct / BANK.length) * 100) : 0;
}
