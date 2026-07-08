"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/input";
import { addTask, addTasksBulk } from "@/app/admin/actions";
import { TaskDropzone } from "@/components/admin/task-dropzone";

export function AddTaskForm({
  slug,
  defaultKind = "RATING",
}: {
  slug: string;
  defaultKind?: "RATING" | "COMPARISON" | "WRITING";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"single" | "bulk">("single");

  // single
  const [kind, setKind] = useState<"RATING" | "COMPARISON" | "WRITING">(defaultKind);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [respA, setRespA] = useState("");
  const [respB, setRespB] = useState("");
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
    const csv =
      "kind,prompt,response,responseA,responseB,isGold,goldMin,goldMax,goldChoice\n" +
      'RATING,"Explain inflation in simple terms.","Inflation is the general rise in prices over time.",,,,,,\n' +
      'RATING,"How many continents are there?","There are five continents.",,,TRUE,1,3,\n' +
      'COMPARISON,"What is the capital of Australia?",,"Sydney is the capital.","Canberra is the capital.",TRUE,,,B\n';
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks-template.csv";
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
            {t === "single" ? "Add one task" : "Bulk upload (JSON)"}
          </button>
        ))}
      </div>

      {tab === "single" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="kind">Kind</FieldLabel>
              <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value as "RATING" | "COMPARISON" | "WRITING")}>
                <option value="RATING">Rating</option>
                <option value="COMPARISON">Comparison</option>
                <option value="WRITING">Writing (trainer writes the answer)</option>
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
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

          {kind !== "WRITING" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isGold} onChange={(e) => setIsGold(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
              Gold task (hidden QA check)
            </label>
          )}

          {kind !== "WRITING" && isGold &&
            (kind === "RATING" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="gmin">Acceptable min rating</FieldLabel>
                  <Input id="gmin" type="number" min="1" max="5" value={goldMin} onChange={(e) => setGoldMin(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="gmax">Acceptable max rating</FieldLabel>
                  <Input id="gmax" type="number" min="1" max="5" value={goldMax} onChange={(e) => setGoldMax(e.target.value)} />
                </div>
              </div>
            ) : (
              <div>
                <FieldLabel htmlFor="gc">Correct choice</FieldLabel>
                <Select id="gc" value={goldChoice} onChange={(e) => setGoldChoice(e.target.value as "A" | "tie" | "B")}>
                  <option value="A">A is better</option>
                  <option value="tie">Tie</option>
                  <option value="B">B is better</option>
                </Select>
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
              CSV columns:{" "}
              <code className="rounded bg-ink/10 px-1.5 py-0.5">kind,prompt,response,responseA,responseB,isGold,goldMin,goldMax,goldChoice</code>{" "}
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
