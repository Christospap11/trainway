"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/input";
import { addTask, addTasksBulk } from "@/app/admin/actions";
import { TaskDropzone } from "@/components/admin/task-dropzone";

export type Kind =
  | "RATING"
  | "COMPARISON"
  | "WRITING"
  | "CODE_GEN"
  | "CODE_REFACTOR"
  | "CODE_DEBUG"
  | "CODE_REVIEW";

const KIND_LABELS: [Kind, string][] = [
  ["RATING", "Rating"],
  ["COMPARISON", "Comparison"],
  ["WRITING", "Writing (trainer writes the answer)"],
  ["CODE_GEN", "Code generation"],
  ["CODE_REFACTOR", "Code refactoring"],
  ["CODE_DEBUG", "Code debugging"],
  ["CODE_REVIEW", "Code review"],
];

const CODING_KINDS: Kind[] = ["CODE_GEN", "CODE_REFACTOR", "CODE_DEBUG", "CODE_REVIEW"];
const isCoding = (k: Kind) => CODING_KINDS.includes(k);

/** The exact header + one example row for each kind, so the template a user
 *  downloads always matches the project they're standing in. */
const CSV_TEMPLATES: Record<Kind, string> = {
  RATING:
    "prompt,response,isGold,goldMin,goldMax\n" +
    '"Explain inflation in simple terms.","Inflation is the general rise in prices over time.",,,\n' +
    '"How many continents are there?","There are five continents.",TRUE,1,3\n',
  COMPARISON:
    "prompt,response_a,response_b,isGold,goldChoice\n" +
    '"What is the capital of Australia?","Sydney is the capital.","Canberra is the capital.",TRUE,B\n',
  WRITING: "prompt\n" + '"Write a friendly reply to a customer asking for a refund."\n',
  CODE_GEN:
    "prompt,language,code,isGold,goldMin,goldMax\n" +
    '"Write a function that returns the median of a list of numbers. It must handle an empty list by raising ValueError.",python,"def median(xs):\n    xs = sorted(xs)\n    n = len(xs)\n    return xs[n // 2]",TRUE,1,2\n',
  CODE_REFACTOR:
    "prompt,language,original_code,refactored_code,isGold,goldMin,goldMax\n" +
    '"Refactor this to remove the duplicated branches.",python,"def fee(kind, amt):\n    if kind == \'a\':\n        return amt * 0.1\n    if kind == \'b\':\n        return amt * 0.1\n    return 0","RATES = {\'a\': 0.1, \'b\': 0.1}\n\ndef fee(kind, amt):\n    return amt * RATES.get(kind, 0)",,,\n',
  CODE_DEBUG:
    "prompt,language,buggy_code,error_output,ai_response,isGold,goldMin,goldMax\n" +
    '"This crashes on the last element. Find and fix the bug.",python,"def last(xs):\n    return xs[len(xs)]","IndexError: list index out of range","The bug is an off-by-one error: len(xs) is one past the final index. Use xs[len(xs) - 1], or simply xs[-1].",TRUE,4,5\n',
  CODE_REVIEW:
    "prompt,language,code,ai_review,isGold,goldMin,goldMax\n" +
    '"Review this login handler.",python,"def login(u, p):\n    q = \\"SELECT * FROM users WHERE name = \'\\" + u + \\"\'\\"\n    return db.exec(q)","Looks good overall. Consider renaming `u` and `p` to `username` and `password` for readability.",TRUE,1,2\n',
};

export function AddTaskForm({
  slug,
  defaultKind = "RATING",
}: {
  slug: string;
  defaultKind?: Kind;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"single" | "bulk">("single");

  // single
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [respA, setRespA] = useState("");
  const [respB, setRespB] = useState("");
  // coding
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [refactoredCode, setRefactoredCode] = useState("");
  const [buggyCode, setBuggyCode] = useState("");
  const [errorOutput, setErrorOutput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiReview, setAiReview] = useState("");

  const [isGold, setIsGold] = useState(false);
  const [goldMin, setGoldMin] = useState("1");
  const [goldMax, setGoldMax] = useState("3");
  const [goldChoice, setGoldChoice] = useState<"A" | "tie" | "B">("B");

  // bulk
  const [bulk, setBulk] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const reset = () => {
    setPrompt("");
    setResponse("");
    setRespA("");
    setRespB("");
    setCode("");
    setOriginalCode("");
    setRefactoredCode("");
    setBuggyCode("");
    setErrorOutput("");
    setAiResponse("");
    setAiReview("");
    setIsGold(false);
  };

  const submitSingle = async () => {
    setBusy(true);
    setMsg(null);
    const res = await addTask(slug, {
      kind,
      prompt,
      response,
      responseA: respA,
      responseB: respB,
      language,
      code,
      originalCode,
      refactoredCode,
      buggyCode,
      errorOutput,
      aiResponse,
      aiReview,
      isGold,
      goldMin: Number(goldMin),
      goldMax: Number(goldMax),
      goldChoice,
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Task added." });
      reset();
      router.refresh();
    } else setMsg({ ok: false, text: res.error ?? "Could not add task." });
  };

  // Shared upload path: serialize the array exactly as the paste box would and
  // hand it to the existing addTasksBulk action (which re-validates everything).
  const uploadRows = async (rows: unknown[]): Promise<boolean> => {
    setBusy(true);
    setMsg(null);
    const res = await addTasksBulk(slug, JSON.stringify(rows));
    setBusy(false);
    if (res.ok) {
      const switched = res.switchedTo
        ? ` This project was set to "${res.switchedTo.replace(/_/g, " ").toLowerCase()}" to match your file.`
        : "";
      setMsg({ ok: true, text: `Added ${res.added} task(s).${switched}` });
      setBulk("");
      router.refresh();
      return true;
    }
    setMsg({ ok: false, text: res.error ?? "Upload failed." });
    return false;
  };

  const downloadTemplate = () => {
    const csv = "﻿" + CSV_TEMPLATES[defaultKind];
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${defaultKind.toLowerCase()}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitBulk = async () => {
    let rows: unknown;
    try {
      rows = JSON.parse(bulk);
    } catch {
      setMsg({ ok: false, text: "That isn't valid JSON." });
      return;
    }
    if (!Array.isArray(rows)) {
      setMsg({ ok: false, text: "JSON must be an array of tasks." });
      return;
    }
    await uploadRows(rows);
  };

  // header line of the template = the columns this project's file needs
  const expectedColumns = CSV_TEMPLATES[defaultKind].split("\n")[0];

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
      <div className="mb-5 flex gap-2">
        {(["single", "bulk"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === t ? "bg-ink/[0.08] text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t === "single" ? "Add one task" : "Bulk upload (CSV / JSON)"}
          </button>
        ))}
      </div>

      {tab === "single" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="kind">Kind</FieldLabel>
              <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
                {KIND_LABELS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            {isCoding(kind) && (
              <div>
                <FieldLabel htmlFor="lang">Language (optional)</FieldLabel>
                <Input
                  id="lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="python"
                />
              </div>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="prompt">
              {isCoding(kind) ? "Task / spec" : "Prompt"}
            </FieldLabel>
            <Textarea id="prompt" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>

          {kind === "RATING" && (
            <div>
              <FieldLabel htmlFor="resp">AI response</FieldLabel>
              <Textarea id="resp" rows={3} value={response} onChange={(e) => setResponse(e.target.value)} />
            </div>
          )}

          {kind === "COMPARISON" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="ra">Response A</FieldLabel>
                <Textarea id="ra" rows={3} value={respA} onChange={(e) => setRespA(e.target.value)} />
              </div>
              <div>
                <FieldLabel htmlFor="rb">Response B</FieldLabel>
                <Textarea id="rb" rows={3} value={respB} onChange={(e) => setRespB(e.target.value)} />
              </div>
            </div>
          )}

          {kind === "WRITING" && (
            <p className="rounded-lg border border-ink/10 bg-ink/[0.02] px-3 py-2 text-sm text-muted">
              The trainer will write the response — no answer needed here.
            </p>
          )}

          {kind === "CODE_GEN" && (
            <div>
              <FieldLabel htmlFor="code">AI-generated code</FieldLabel>
              <Textarea
                id="code"
                rows={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          )}

          {kind === "CODE_REFACTOR" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="oc">Original code</FieldLabel>
                <Textarea id="oc" rows={8} value={originalCode} onChange={(e) => setOriginalCode(e.target.value)} className="font-mono text-xs" />
              </div>
              <div>
                <FieldLabel htmlFor="rc">AI&apos;s refactor</FieldLabel>
                <Textarea id="rc" rows={8} value={refactoredCode} onChange={(e) => setRefactoredCode(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
          )}

          {kind === "CODE_DEBUG" && (
            <>
              <div>
                <FieldLabel htmlFor="bc">Broken code</FieldLabel>
                <Textarea id="bc" rows={7} value={buggyCode} onChange={(e) => setBuggyCode(e.target.value)} className="font-mono text-xs" />
              </div>
              <div>
                <FieldLabel htmlFor="eo">Error output (optional)</FieldLabel>
                <Textarea id="eo" rows={3} value={errorOutput} onChange={(e) => setErrorOutput(e.target.value)} className="font-mono text-xs" placeholder="IndexError: list index out of range" />
              </div>
              <div>
                <FieldLabel htmlFor="ar">AI&apos;s diagnosis &amp; fix</FieldLabel>
                <Textarea id="ar" rows={6} value={aiResponse} onChange={(e) => setAiResponse(e.target.value)} className="font-mono text-xs" />
              </div>
            </>
          )}

          {kind === "CODE_REVIEW" && (
            <>
              <div>
                <FieldLabel htmlFor="cr">Code under review</FieldLabel>
                <Textarea id="cr" rows={8} value={code} onChange={(e) => setCode(e.target.value)} className="font-mono text-xs" />
              </div>
              <div>
                <FieldLabel htmlFor="rv">AI&apos;s review comments</FieldLabel>
                <Textarea id="rv" rows={6} value={aiReview} onChange={(e) => setAiReview(e.target.value)} className="font-mono text-xs" />
              </div>
            </>
          )}

          {kind !== "WRITING" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isGold} onChange={(e) => setIsGold(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
              Gold task (hidden QA check)
            </label>
          )}

          {kind !== "WRITING" && isGold &&
            (kind === "COMPARISON" ? (
              <div>
                <FieldLabel htmlFor="gc">Correct choice</FieldLabel>
                <Select id="gc" value={goldChoice} onChange={(e) => setGoldChoice(e.target.value as "A" | "tie" | "B")}>
                  <option value="A">A is better</option>
                  <option value="tie">Tie</option>
                  <option value="B">B is better</option>
                </Select>
              </div>
            ) : (
              // rating + every coding kind are graded on their `overall` score
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="gmin">Acceptable min (overall)</FieldLabel>
                  <Input id="gmin" type="number" min="1" max="5" value={goldMin} onChange={(e) => setGoldMin(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="gmax">Acceptable max (overall)</FieldLabel>
                  <Input id="gmax" type="number" min="1" max="5" value={goldMax} onChange={(e) => setGoldMax(e.target.value)} />
                </div>
              </div>
            ))}

          <SubmitRow busy={busy} msg={msg} onClick={submitSingle} label="Add task" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* primary: drag & drop / browse */}
          <TaskDropzone onUpload={uploadRows} busy={busy} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              CSV columns for this project:{" "}
              <code className="rounded bg-ink/10 px-1.5 py-0.5">{expectedColumns}</code>{" "}
              (comma or semicolon).
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink/10"
            >
              <Download size={13} /> CSV template
            </button>
          </div>

          {msg && (
            <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>
          )}

          {/* secondary: paste JSON manually */}
          <details className="group rounded-xl border border-ink/10 bg-ink/[0.02]">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground">
              Or paste JSON manually
            </summary>
            <div className="space-y-3 border-t border-ink/10 p-4">
              <Textarea
                rows={6}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder='[ { "kind": "RATING", "prompt": "…", "response": "…" } ]'
                className="font-mono text-xs"
              />
              <SubmitRow busy={busy} msg={null} onClick={submitBulk} label="Upload pasted JSON" />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function SubmitRow({
  busy,
  msg,
  onClick,
  label,
}: {
  busy: boolean;
  msg: { ok: boolean; text: string } | null;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={busy}
        className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? "Saving…" : label}
      </button>
      {msg && <span className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</span>}
    </div>
  );
}
