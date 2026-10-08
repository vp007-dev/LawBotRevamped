import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, FileText, FileUp, Loader2, MessageCircle, Mic, Phone, Scale, Send, ShieldCheck, Sparkles, Upload, WandSparkles, X } from "lucide-react";
import GeminiLiveLawyer from "../components/GeminiLiveLawyer";
import aiService from "../services/aiService";
import contractAnalysisService from "../services/contractAnalysisService";
import documentService from "../services/documentService";
import "./LandingWorkspace.css";
import "./LandingWorkspaceNotice.css";
import "./LandingWorkspaceMarkdown.css";
import "./LandingWorkspaceLive.css";
import "./LandingWorkspaceAnalysis.css";

function makePdf(text, filename) {
  const escape = (value) => value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const lines = text.split(/\r?\n/).flatMap((line) => {
    const output = []; let rest = line || " ";
    while (rest.length > 88) { output.push(rest.slice(0, 88)); rest = rest.slice(88); }
    return [...output, rest];
  });
  const pages = [];
  for (let index = 0; index < lines.length; index += 42) pages.push(lines.slice(index, index + 42));
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>"];
  objects[1] = `<< /Type /Pages /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  pages.forEach((page, index) => {
    const pageId = 4 + index * 2; const streamId = pageId + 1;
    const stream = `BT\n/F1 11 Tf\n50 790 Td\n${page.map((line, lineIndex) => `${lineIndex ? "0 -17 Td\n" : ""}(${escape(line)}) Tj`).join("\n")}\nET`;
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`;
    objects[streamId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 800);
}

function DetailCard({ label, value }) {
  if (!value) return null;
  return <p><span>{label}</span>{value}</p>;
}

function cleanDocumentOutput(value) {
  let content = value.trim().replace(/^```(?:[a-z]+)?\s*/i, "").replace(/\s*```$/, "");
  const documentStart = /^(?:\*\*)?(?:IN THE COURT|BEFORE THE|TO,|APPLICATION(?:\s+FOR)?|PETITION(?:\s+FOR)?|LEGAL NOTICE|AFFIDAVIT|COMPLAINT|FIR|DEED OF|AGREEMENT|MEMORANDUM OF|POWER OF ATTORNEY)/im;
  const match = content.match(documentStart);
  if (match && match.index > 0) content = content.slice(match.index);
  return content.replaceAll("**", "").replace(/^---\s*/m, "").trim();
}

function ContractAnalysisModal({ analysis, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const structured = analysis.structuredData || {};
  const summary = structured.executiveSummary || analysis.plainLanguageAnalysis;
  const hasStructuredContent = structured.keyClauses?.length || structured.hiddenRisks?.length || structured.unfairTerms?.length || Object.keys(structured.complianceScores || {}).length || structured.recommendations?.length;

  return (
    <div className="lw-report-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="lw-report-modal" role="dialog" aria-modal="true" aria-labelledby="lw-report-title">
        <header className="lw-report-header">
          <div>
            <p className="lw-label">CONTRACT REVIEW</p>
            <h2 id="lw-report-title">{analysis.fileName}</h2>
            <div className="lw-report-meta">
              <span className={`risk-${analysis.riskLevel?.toLowerCase()}`}>{analysis.riskLevel || "Unrated"} risk</span>
              <span>Risk score {analysis.riskScore ?? "N/A"}/100</span>
              {analysis.analyzedAt && <span>{new Date(analysis.analyzedAt).toLocaleDateString()}</span>}
            </div>
          </div>
          <button type="button" className="lw-report-close" onClick={onClose} aria-label="Close contract report"><X size={19} /></button>
        </header>

        <div className="lw-report-content">
          {summary && <section className="lw-report-summary"><p className="lw-label">AT A GLANCE</p><div className="lw-markdown"><ReactMarkdown>{summary}</ReactMarkdown></div></section>}

          {hasStructuredContent && <div className="lw-report-grid">
            {structured.keyClauses?.length > 0 && <section className="lw-report-panel lw-report-panel-wide"><div className="lw-report-section-heading"><FileText size={18} /><h3>Key clauses</h3></div><div className="lw-clause-list">{structured.keyClauses.map((clause, index) => <article className="lw-detail-card" key={`${clause.name}-${index}`}><div className="lw-detail-card-head"><h4>{clause.name || "Contract clause"}</h4><span className={`risk-${clause.riskLevel?.toLowerCase()}`}>{clause.riskLevel || "Review"}</span></div><DetailCard label="In brief" value={clause.summary} /><DetailCard label="What it means" value={clause.details} /></article>)}</div></section>}

            {structured.hiddenRisks?.length > 0 && <section className="lw-report-panel"><div className="lw-report-section-heading"><AlertTriangle size={18} /><h3>Risks to consider</h3></div><div className="lw-clause-list">{structured.hiddenRisks.map((risk, index) => <article className="lw-detail-card" key={`${risk.risk}-${index}`}><div className="lw-detail-card-head"><h4>{risk.risk || "Potential risk"}</h4><span className={`risk-${risk.severity?.toLowerCase()}`}>{risk.severity || "Review"}</span></div><DetailCard label="Possible impact" value={risk.impact} /><DetailCard label="Suggested action" value={risk.recommendation} /></article>)}</div></section>}

            {structured.unfairTerms?.length > 0 && <section className="lw-report-panel"><div className="lw-report-section-heading"><Scale size={18} /><h3>Terms that need attention</h3></div><div className="lw-clause-list">{structured.unfairTerms.map((term, index) => <article className="lw-detail-card" key={`${term.term}-${index}`}><h4>{term.term || "Term to review"}</h4><DetailCard label="Legal concern" value={term.legalIssue} /><DetailCard label="Relevant law" value={term.applicableLaw} /><DetailCard label="Likely enforceability" value={term.enforceability} /><DetailCard label="A fairer option" value={term.alternative} /></article>)}</div></section>}

            {Object.keys(structured.complianceScores || {}).length > 0 && <section className="lw-report-panel"><div className="lw-report-section-heading"><ShieldCheck size={18} /><h3>Compliance check</h3></div><div className="lw-compliance-list">{Object.entries(structured.complianceScores).map(([label, score]) => <div className="lw-compliance-item" key={label}><div><span>{label}</span><b>{score}/100</b></div><i><i style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></i></div>)}</div></section>}

            {structured.recommendations?.length > 0 && <section className="lw-report-panel lw-report-panel-wide"><div className="lw-report-section-heading"><CheckCircle2 size={18} /><h3>Recommended next steps</h3></div><ol className="lw-recommendations">{structured.recommendations.map((recommendation, index) => <li key={`${recommendation}-${index}`}>{recommendation}</li>)}</ol></section>}
          </div>}

          <details className="lw-report-detail" open={!hasStructuredContent}><summary className="lw-report-section-heading"><FileText size={18} /><h3>Full legal analysis</h3><span>Read analysis</span></summary><div className="lw-markdown lw-report-markdown"><ReactMarkdown>{analysis.analysis || summary || "No detailed analysis was returned."}</ReactMarkdown></div></details>
          {analysis.extractedText && <details className="lw-report-source"><summary>View extracted contract text</summary><pre>{analysis.extractedText}</pre></details>}
        </div>

        <footer className="lw-report-footer"><span>Use this review to prepare questions or negotiate terms.</span><button type="button" onClick={onClose}>Close report</button></footer>
      </section>
    </div>
  );
}

export default function LandingWorkspace() {
  const [active, setActive] = useState("overview");
  const [messages, setMessages] = useState([{ role: "assistant", content: "Tell me what is happening. I will help you organize the facts and find a useful next step." }]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);
  const fileInput = useRef(null);
  const [draftRequest, setDraftRequest] = useState("");
  const [details, setDetails] = useState({ name: "", address: "", phone: "" });
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const title = useMemo(() => ({ overview: "Your legal workspace", chat: "Legal AI chat", voice: "AI voice assistant", contract: "Contract analysis", draft: "Document drafting" }[active]), [active]);
  const open = (section) => setActive(section);

  const ask = async (event) => {
    event?.preventDefault();
    if (!question.trim() || chatLoading) return;
    const content = question.trim();
    setMessages((items) => [...items, { role: "user", content }]);
    setQuestion("");
    setChatLoading(true);
    try {
      const reply = await aiService.sendMessage(content);
      if (!reply?.success || !reply.response) throw new Error(reply?.error || "No provider response");
      setMessages((items) => [...items, { role: "assistant", content: reply.response }]);
    } catch (error) {
      setMessages((items) => [...items, { role: "assistant", content: "The legal guide could not connect. Please check the configured AI provider and try again." }]);
      setNotice(error.message || "The Legal AI request could not be completed.");
    } finally {
      setChatLoading(false);
    }
  };

  const analyze = async (file) => {
    if (!file) return;
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/tiff", "text/plain"];
    if (!validTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setNotice("Upload a PDF, Word, image, or text file smaller than 10MB.");
      return;
    }
    setAnalysisLoading(true);
    setAnalysis(null);
    setShowAnalysisReport(false);
    try {
      const result = await contractAnalysisService.analyzeContract(file);
      if (!result?.analysis) throw new Error("The contract review did not return an analysis. Please try again.");
      setAnalysis(result);
      setShowAnalysisReport(true);
    } catch (error) {
      setNotice(error.message || "Unable to analyze this contract. Please try another file.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const generate = async (event) => {
    event.preventDefault();
    if (!draftRequest.trim()) {
      setNotice("Describe the document you need and why you need it before creating a draft.");
      return;
    }
    setDraftLoading(true);
    try {
      const result = await aiService.draftDocument(draftRequest, details);
      if (!result?.success || !result.response) throw new Error(result?.error || "No draft was returned");
      const documentContent = cleanDocumentOutput(result.response);
      if (!documentContent) throw new Error("The document generator returned an empty draft.");
      setDraft(documentContent);
      const saved = documentService.saveDocument({ type: "custom_legal_document", title: `Legal document – ${draftRequest.slice(0, 56)}`, content: documentContent });
      if (!saved) setNotice("Your draft was generated, but it could not be saved to the document store.");
    } catch (error) {
      setNotice(error.message || "Unable to generate the legal draft.");
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className="landing-workspace">
      <aside className="lw-sidebar">
        <a href="/" className="lw-brand"><span>L<sup>+</sup></span> lawbot<em>360</em></a>
        <p className="lw-label">YOUR TOOLS</p>
        {[["overview", Sparkles, "Overview"], ["chat", MessageCircle, "Legal AI chat"], ["voice", Mic, "AI voice assistant"], ["contract", FileUp, "Contract analysis"], ["draft", FileText, "Document drafting"]].map(([key, Icon, label]) => <button key={key} onClick={() => open(key)} className={active === key ? "active" : ""}><Icon size={16} /><span>{label}</span></button>)}
        <div className="lw-side-note"><Sparkles size={15} /><b>Clearer steps, calmer decisions.</b><small>Your files and drafts stay in the workspace.</small></div>
      </aside>

      <main className="lw-main">
        <header><div><p className="lw-label">LAWBot360 WORKSPACE</p><h1>{title}</h1></div><span className="lw-status"><i /> Main-project services connected</span></header>
        {notice && <div className="lw-notice" role="status"><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div>}

        {active === "overview" && <section className="lw-overview"><div className="lw-hero"><div><p className="lw-label">A CLEARER NEXT STEP</p><h2>What would feel<br />most helpful today?</h2><p></p></div><span className="lw-hero-mark">L<sup>+</sup></span></div><div className="lw-tools">{[["chat", Bot, "Ask a legal question", "Get a structured response from the Legal AI"], ["voice", Mic, "Start an AI voice session", "Talk to an AI legal-information assistant"], ["offline-call", Phone, "Call for offline help", "Reach support without an internet connection"], ["contract", FileUp, "Review a contract", "Analyze a real document for risks"], ["draft", WandSparkles, "Draft a legal document", "Describe what you need, then edit and download"]].map(([key, Icon, label, copy]) => key === "offline-call" ? <a className="lw-tool-call" key={key} href="tel:+917965480318"><Icon /><span><b>{label}</b><small>{copy}</small></span><ArrowRight size={15} /></a> : <button key={key} onClick={() => open(key)}><Icon /><span><b>{label}</b><small>{copy}</small></span><ArrowRight size={15} /></button>)}</div></section>}

        {active === "chat" && <section className="lw-tool-page"><div className="lw-intro"><h2>Start with the question<br />on your mind.</h2><p>The same configured LawBot360 AI service used by the main project responds here, with its conversation context and provider fallback.</p></div><div className="lw-chat"><div className="lw-messages">{messages.map((message, index) => <div key={index} className={`lw-message ${message.role}`}>{message.role === "assistant" ? <div className="lw-markdown"><ReactMarkdown>{message.content}</ReactMarkdown></div> : message.content}</div>)}{chatLoading && <div className="lw-message assistant"><Loader2 size={15} className="spin" /> Thinking through the details…</div>}</div><form onSubmit={ask}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask in your own words…" /><button aria-label="Send legal question"><Send size={16} /></button></form></div></section>}

        {active === "voice" && <section className="lw-tool-page"><div className="lw-intro"><h2>Talk it through,<br />naturally.</h2><p>Speak with an AI legal-information assistant for India. It can explain legal concepts and suggest questions to consider; it does not present itself as a lawyer.</p></div><div className="lw-voice"><GeminiLiveLawyer variant="landing" /><a className="lw-offline-call" href="tel:+917965480318"><Phone size={18} /><span><b>Need help without internet?</b><small>Call +91 79654 80318</small></span><ArrowRight size={16} /></a></div></section>}

        {active === "contract" && <section className="lw-tool-page"><div className="lw-intro"><h2>Read between<br />the legal lines.</h2><p>Upload a real contract. The existing extraction, OCR fallback, AI analysis, risk scoring, and local analysis storage are used here.</p></div><div className="lw-contract"><button className="lw-upload" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); analyze(event.dataTransfer.files[0]); }}><Upload size={32} /><b>{analysisLoading ? "Analyzing your document…" : "Drop a contract here"}</b><small>or choose a PDF, Word document, image, or text file</small><span>Choose document</span></button><input ref={fileInput} hidden type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={(event) => analyze(event.target.files[0])} />{analysis && <article className="lw-analysis"><div><span>RISK LEVEL</span><b className={`risk-${analysis.riskLevel?.toLowerCase()}`}>{analysis.riskLevel} · {analysis.riskScore}/100</b></div><h3>{analysis.fileName}</h3><p>{analysis.structuredData?.executiveSummary || analysis.plainLanguageAnalysis || analysis.analysis}</p><button type="button" className="lw-report-open" onClick={() => setShowAnalysisReport(true)}><FileText size={15} /> View full analysis report <ArrowRight size={15} /></button></article>}</div></section>}

        {active === "draft" && <section className="lw-draft"><form className="lw-details" onSubmit={generate}><p className="lw-label">1 · DESCRIBE WHAT YOU NEED</p><label>Document request<textarea className="lw-request" value={draftRequest} onChange={(event) => setDraftRequest(event.target.value)} placeholder="For example: I need an application to my landlord about returning my security deposit. The tenancy ended on 15 June and the deposit was ₹25,000." /></label><p className="lw-draft-hint">Describe the document or application, the reason, who it is for, and any important dates or facts. We will choose the format for you.</p><details className="lw-draft-context"><summary>Add personal details for autofill</summary>{[["name", "Full name"], ["address", "Address"], ["phone", "Phone number"]].map(([key, label]) => <label key={key}>{label}<input value={details[key]} onChange={(event) => setDetails({ ...details, [key]: event.target.value })} /></label>)}</details><button className="lw-primary" disabled={draftLoading}>{draftLoading ? <Loader2 size={15} className="spin" /> : <WandSparkles size={15} />} Create my document</button></form><section className="lw-paper-wrap"><div className="lw-paper-head"><span>EDITABLE PREVIEW</span><span>Review before download</span></div>{draft ? <article className="lw-paper" contentEditable suppressContentEditableWarning onInput={(event) => setDraft(event.currentTarget.innerText)}>{draft}</article> : <div className="lw-paper-placeholder"><FileText size={28} /><p>Describe the document you need and we will prepare an editable first draft.</p></div>}<div className="lw-paper-actions"><span><i>✓</i> Saved to the document store when generated.</span><button disabled={!draft} onClick={() => makePdf(draft, "legal-document-draft.pdf")}>Download PDF ↓</button></div></section></section>}
      </main>
      {showAnalysisReport && analysis && <ContractAnalysisModal analysis={analysis} onClose={() => setShowAnalysisReport(false)} />}
    </div>
  );
}
