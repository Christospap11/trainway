/**
 * Mock task batches for the workspace demo. Stands in for client-uploaded data
 * until the backend exists. Greek-flavored to match the language wedge.
 *
 * `isGold` marks a hidden Gold Task (known-answer QA trap). The trainer never
 * sees this flag — it's used by QA to check they're paying attention.
 */
import type { TaskType } from "@/lib/mock-data";

export type WorkspaceKind =
  | "rating"
  | "comparison"
  | "writing"
  | "code_gen"
  | "code_refactor"
  | "code_debug"
  | "code_review"
  | "unsupported";

export type WorkspaceTask =
  | {
      id: string;
      kind: "rating";
      prompt: string;
      response: string;
      isGold?: boolean;
      // QA answer key (server-only, stripped before reaching the client):
      // the rating range a careful trainer should land in.
      goldAnswer?: { min?: number; max?: number };
    }
  | {
      id: string;
      kind: "comparison";
      prompt: string;
      responseA: string;
      responseB: string;
      isGold?: boolean;
      goldAnswer?: { choice: "A" | "tie" | "B" };
    }
  | {
      id: string;
      kind: "writing";
      prompt: string;
    }
  // ── coding ─────────────────────────────────────────────────────────
  // The prompt is the spec; `code` is what the AI generated for it. `aiResponse`
  // is the model's own explanation of its approach — optional, but when a
  // dataset has it the reasoning is part of what's being judged.
  | {
      id: string;
      kind: "code_gen";
      prompt: string;
      language?: string;
      code: string;
      aiResponse?: string;
    }
  // Judge the AI's refactor of `originalCode`. `aiResponse` is the model's own
  // explanation of what it changed — optional, but when a dataset has it the
  // reasoning is part of what's being judged, so it's shown.
  | {
      id: string;
      kind: "code_refactor";
      prompt: string;
      language?: string;
      originalCode: string;
      refactoredCode: string;
      aiResponse?: string;
    }
  // Judge the AI's diagnosis + fix for code that fails with `errorOutput`.
  | {
      id: string;
      kind: "code_debug";
      prompt: string;
      language?: string;
      buggyCode: string;
      errorOutput?: string;
      aiResponse: string;
    }
  // Review the AI's review of `code`.
  | {
      id: string;
      kind: "code_review";
      prompt: string;
      language?: string;
      code: string;
      aiReview: string;
    };

export function workspaceKindFor(taskType: TaskType): WorkspaceKind {
  if (taskType === "Response rating") return "rating";
  if (taskType === "Side-by-side comparison") return "comparison";
  if (taskType === "Response writing") return "writing";
  if (taskType === "Code generation") return "code_gen";
  if (taskType === "Code refactoring") return "code_refactor";
  if (taskType === "Code debugging") return "code_debug";
  if (taskType === "Code review") return "code_review";
  return "unsupported";
}

const ratingTasks: WorkspaceTask[] = [
  {
    id: "t1",
    kind: "rating",
    prompt: "Εξήγησε με απλά λόγια τι είναι ο πληθωρισμός.",
    response:
      "Ο πληθωρισμός είναι η γενική αύξηση των τιμών των αγαθών και υπηρεσιών με την πάροδο του χρόνου. Όταν υπάρχει πληθωρισμός, με το ίδιο ποσό χρημάτων αγοράζεις λιγότερα πράγματα από πριν — δηλαδή μειώνεται η αγοραστική δύναμη του χρήματος.",
  },
  {
    id: "t2",
    kind: "rating",
    prompt: "Πόσες ήπειροι υπάρχουν στον πλανήτη;",
    response:
      "Υπάρχουν πέντε ήπειροι: Ευρώπη, Ασία, Αφρική, Αμερική και Ωκεανία.",
    isGold: true, // intentionally questionable (commonly counted as 6 or 7)
    goldAnswer: { min: 1, max: 3 }, // factually shaky → a careful trainer rates it low
  },
  {
    id: "t3",
    kind: "rating",
    prompt: "Γράψε μια σύντομη, φιλική απάντηση σε πελάτη που ρωτά πώς να αλλάξει τον κωδικό του.",
    response:
      "Καλησπέρα! Για να αλλάξετε τον κωδικό σας, συνδεθείτε στον λογαριασμό σας, πηγαίνετε στις Ρυθμίσεις > Ασφάλεια και επιλέξτε «Αλλαγή κωδικού». Αν χρειαστείτε βοήθεια, είμαστε εδώ!",
  },
  {
    id: "t4",
    kind: "rating",
    prompt: "Ποια είναι τα οφέλη της τακτικής άσκησης;",
    response:
      "Η τακτική άσκηση κάνει καλό. Είναι ωραία και πρέπει να γυμνάζεσαι κάθε μέρα γιατί έτσι λένε οι γιατροί.",
  },
  {
    id: "t5",
    kind: "rating",
    prompt: "Μετάφρασε στα αγγλικά: «Καλή επιτυχία στις εξετάσεις σου».",
    response: "Good luck with your exams.",
  },
  {
    id: "t6",
    kind: "rating",
    prompt: "Τι είναι η φωτοσύνθεση;",
    response:
      "Η φωτοσύνθεση είναι η διαδικασία με την οποία τα φυτά μετατρέπουν το ηλιακό φως, το νερό και το διοξείδιο του άνθρακα σε ενέργεια (γλυκόζη), απελευθερώνοντας οξυγόνο.",
  },
];

const comparisonTasks: WorkspaceTask[] = [
  {
    id: "c1",
    kind: "comparison",
    prompt: "Ποια είναι η πρωτεύουσα της Αυστραλίας;",
    responseA: "Η πρωτεύουσα της Αυστραλίας είναι το Σίδνεϊ.",
    responseB: "Η πρωτεύουσα της Αυστραλίας είναι η Καμπέρα.",
    isGold: true, // B is correct
    goldAnswer: { choice: "B" }, // Canberra, not Sydney
  },
  {
    id: "c2",
    kind: "comparison",
    prompt: "Δώσε μια σύντομη εξήγηση για το τι είναι ένα μαύρο τρύπα.",
    responseA:
      "Μια μαύρη τρύπα είναι μια περιοχή του διαστήματος όπου η βαρύτητα είναι τόσο ισχυρή που τίποτα, ούτε καν το φως, δεν μπορεί να ξεφύγει.",
    responseB:
      "Η μαύρη τρύπα είναι ένα σκοτεινό σημείο στον ουρανό που ρουφάει αστέρια σαν ηλεκτρική σκούπα.",
  },
  {
    id: "c3",
    kind: "comparison",
    prompt: "Γράψε ένα ευγενικό email για ακύρωση ραντεβού.",
    responseA:
      "Αγαπητέ/ή, σας ενημερώνω ότι δυστυχώς θα χρειαστεί να ακυρώσω το ραντεβού μας. Ζητώ συγγνώμη για την αναστάτωση και θα χαρώ να το επαναπρογραμματίσουμε σε χρόνο που σας βολεύει. Με εκτίμηση.",
    responseB: "Δεν μπορώ να έρθω, ακυρώστε το.",
  },
  {
    id: "c4",
    kind: "comparison",
    prompt: "Πόσο κάνει 15% του 200;",
    responseA: "Το 15% του 200 είναι 30.",
    responseB: "Το 15% του 200 είναι 35.",
  },
  {
    id: "c5",
    kind: "comparison",
    prompt: "Εξήγησε σε ένα παιδί τι είναι το διαδίκτυο.",
    responseA:
      "Το διαδίκτυο είναι σαν ένας τεράστιος αόρατος δρόμος που συνδέει υπολογιστές σε όλο τον κόσμο, ώστε να μπορούν να στέλνουν μηνύματα, εικόνες και βίντεο ο ένας στον άλλον.",
    responseB:
      "Το διαδίκτυο είναι ένα παγκόσμιο σύστημα διασυνδεδεμένων δικτύων υπολογιστών που χρησιμοποιεί τη σουίτα πρωτοκόλλων TCP/IP.",
  },
];

const batches: Record<string, WorkspaceTask[]> = {
  atlas: ratingTasks,
  nova: comparisonTasks,
};

export function getTasks(projectId: string): WorkspaceTask[] {
  return batches[projectId] ?? [];
}
