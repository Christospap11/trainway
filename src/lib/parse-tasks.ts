/**
 * Client-side parsing for bulk task uploads. Reads a dropped/selected file with
 * FileReader and turns it into an array of task objects shaped like AddTaskInput
 * — the same shape the paste-JSON box produces — so it can be handed straight to
 * the existing `addTasksBulk` server action (which re-validates everything).
 */

export type ParsedTasks = { rows: unknown[]; error?: string };

/** Read a File to text via FileReader (resolves on load, rejects on error). */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsText(file);
  });
}

/** Strip a leading UTF-8 BOM (common in Excel exports). */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Detect the delimiter from the header line. European/Greek Excel exports
 * default to ';' (and sometimes tab); US/plain CSV uses ','. Pick whichever
 * appears most in the first line.
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts: Record<string, number> = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ",";
}

/** RFC-4180-ish CSV → rows of cells, respecting quoted fields & escaped quotes. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } // escaped ""
        else inQuotes = false;
      } else field += c;
    } else if (c === '"' && field === "") {
      // a quote only opens a quoted field at the START of a field; a stray
      // quote mid-field (e.g. unescaped quotes in a prompt) is kept literal so
      // it can't run away and swallow the rest of the file into one row.
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // drop fully-empty rows
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const truthy = (v: string) => /^(true|1|yes|y)$/i.test(v.trim());

/** Map CSV rows (header + data) into AddTaskInput-shaped objects.
 *
 * Flexible: `kind` is optional (the server fills it from the project's task
 * type when absent), and common column names are accepted. An `input`/`context`
 * column is appended to the prompt (handles instruction+input datasets). */
export function csvToTasks(text: string): unknown[] {
  const rows = parseCsv(text, detectDelimiter(text));
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());

  return rows.slice(1).map((cols) => {
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (cols[idx] ?? "").trim() : "";
    };
    const firstOf = (...keys: string[]) => {
      for (const k of keys) {
        const v = get(k);
        if (v) return v;
      }
      return "";
    };

    const rawKind = get("kind").toUpperCase();
    const kind = [
      "RATING",
      "COMPARISON",
      "WRITING",
      "CODE_GEN",
      "CODE_REFACTOR",
      "CODE_DEBUG",
      "CODE_REVIEW",
      "AUTHORING",
    ].includes(rawKind)
      ? rawKind
      : "";

    let prompt = firstOf("prompt", "instruction", "question", "text", "task", "spec", "brief");
    const context = firstOf("input", "context");
    if (context) prompt = prompt ? `${prompt}\n\n${context}` : context;

    const task: Record<string, unknown> = { prompt };
    if (kind) task.kind = kind; // else server infers from the columns present

    const response = firstOf("response", "output", "answer", "completion");
    if (response) task.response = response;
    const ra = firstOf("responsea", "response_a");
    const rb = firstOf("responseb", "response_b");
    if (ra) task.responseA = ra;
    if (rb) task.responseB = rb;

    // ── coding columns ────────────────────────────────────────────
    const language = firstOf("language", "lang");
    if (language) task.language = language;
    const code = firstOf("code", "generated_code", "generatedcode");
    if (code) task.code = code;
    const original = firstOf("original_code", "originalcode", "before");
    const refactored = firstOf("refactored_code", "refactoredcode", "after");
    if (original) task.originalCode = original;
    if (refactored) task.refactoredCode = refactored;
    const buggy = firstOf("buggy_code", "buggycode", "broken_code");
    if (buggy) task.buggyCode = buggy;
    const errorOutput = firstOf("error_output", "erroroutput", "error", "stack_trace");
    if (errorOutput) task.errorOutput = errorOutput;
    const aiResponse = firstOf("ai_response", "airesponse", "diagnosis", "fix");
    if (aiResponse) task.aiResponse = aiResponse;
    const aiReview = firstOf("ai_review", "aireview", "review");
    if (aiReview) task.aiReview = aiReview;

    // ── authoring columns ─────────────────────────────────────────
    const repoUrl = firstOf("repo_url", "repourl", "repository", "clone_url", "repo");
    if (repoUrl) task.repoUrl = repoUrl;
    const category = firstOf("category", "cat");
    if (category) task.category = category;
    const subCategory = firstOf("sub_category", "subcategory", "subcat");
    if (subCategory) task.subCategory = subCategory;

    if (truthy(get("isgold"))) {
      task.isGold = true;
      const gc = get("goldchoice");
      if (gc) task.goldChoice = gc;
      const gmin = get("goldmin");
      const gmax = get("goldmax");
      if (gmin) task.goldMin = Number(gmin);
      if (gmax) task.goldMax = Number(gmax);
    }
    return task;
  });
}

/** Dispatch by extension → array of task objects (or a friendly error). */
export async function parseTasksFile(file: File): Promise<ParsedTasks> {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext !== "json" && ext !== "csv") {
    return { rows: [], error: "Please choose a .json or .csv file." };
  }

  let text: string;
  try {
    text = stripBom(await readFile(file));
  } catch {
    return { rows: [], error: "Could not read the file." };
  }

  if (ext === "json") {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return { rows: [], error: "JSON must be an array of tasks." };
      return { rows: parsed };
    } catch {
      return { rows: [], error: "That file isn't valid JSON." };
    }
  }

  // csv
  const rows = csvToTasks(text);
  if (rows.length === 0) return { rows: [], error: "No rows found (need a header row + at least one task)." };
  return { rows };
}
