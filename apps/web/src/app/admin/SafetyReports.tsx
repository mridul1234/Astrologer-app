"use client";
import { useCallback, useEffect, useState } from "react";

type Report = { id: string; messageId: string | null; reason: string; details: string; content: string | null; status: string; adminNote: string; createdAt: string; reporter: { name: string }; target: { name: string } };
export default function SafetyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch("/api/admin/reports"); if (!response.ok) throw new Error("Could not load reports"); setReports(await response.json()); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Request failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const update = async (report: Report, action?: string) => {
    setBusy(report.id); setError("");
    try {
      const response = await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: report.id, status: report.status, adminNote: report.adminNote, action }) });
      if (!response.ok) throw new Error((await response.json()).error || "Could not update report");
      await load();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Request failed"); }
    finally { setBusy(null); }
  };
  const edit = (id: string, patch: Partial<Report>) => setReports(current => current.map(report => report.id === id ? { ...report, ...patch } : report));
  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Safety Reports</h2><button disabled={loading || !!busy} onClick={() => void load()} className="border rounded px-4 py-2">Refresh</button></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p>Loading reports...</p> : !reports.length ? <p>No reports received.</p> : reports.map(report => <article key={report.id} className="border border-stone-200 rounded-lg bg-white p-4 space-y-3">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{report.reason}</h3><span className="text-sm text-stone-500">{new Date(report.createdAt).toLocaleString()}</span></div>
      <p className="text-sm">From {report.reporter.name} · Reported: {report.target.name}</p>
      <p className="whitespace-pre-wrap break-words">{report.details || "No additional details."}</p>
      {report.content && <ReportedContent content={report.content}/>}
      <div className="flex flex-wrap gap-3"><select aria-label="Report status" disabled={!!busy} value={report.status} onChange={event => edit(report.id, { status: event.target.value })} className="border rounded p-2">{["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"].map(value => <option key={value}>{value}</option>)}</select>
      <textarea aria-label="Moderation notes" disabled={!!busy} value={report.adminNote} maxLength={2000} onChange={event => edit(report.id, { adminNote: event.target.value })} placeholder="Record investigation and action taken" className="border rounded p-2 flex-1 min-w-48"/>
      <button disabled={!!busy} className="bg-amber-300 rounded px-4 py-2" onClick={() => void update(report)}>{busy === report.id ? "Saving..." : "Save review"}</button></div>
      <div className="flex flex-wrap gap-3">
        {report.messageId && <button disabled={!!busy} className="border border-red-300 rounded px-3 py-2 text-red-700" onClick={() => { if (window.confirm("Remove this message from the conversation? The report evidence is retained.")) void update(report, "REMOVE_MESSAGE"); }}>Remove reported message</button>}
        <button disabled={!!busy} className="border rounded px-3 py-2" onClick={() => { if (window.confirm("Block interaction between these participants and end active sessions?")) void update(report, "BLOCK_PAIR"); }}>Block further interaction</button>
      </div>
    </article>)}
  </section>;
}
function ReportedContent({ content }: { content: string }) {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "image" && typeof parsed.uri === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(parsed.uri)) {
      return <img alt="Reported attachment" src={parsed.uri} className="max-h-80 max-w-full object-contain"/>;
    }
  } catch { /* Plain-text content. */ }
  return <blockquote className="bg-stone-50 border-l-2 p-3 whitespace-pre-wrap break-words">{content.slice(0, 4000)}</blockquote>;
}
