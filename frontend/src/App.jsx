import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Upload, FileText, BookOpen, Sun, Moon, Send, X, ChevronRight,
  ChevronDown, Sparkles, Library, Layers, Settings as SettingsIcon,
  StickyNote, BarChart3, Mic, Copy, ExternalLink, Bookmark, ArrowRight,
  Check, Plus, Menu, ArrowUpRight, SlidersHorizontal, Clock,
} from "lucide-react";

/* ————————————————————————————————————————————————————————————————
   ATLAS RAG — design tokens
   Warm paper / deep ink base, one restrained accent (library green).
   Sans for interface chrome, serif for research content & headlines.
———————————————————————————————————————————————————————————————— */

const palette = {
  light: {
    bg: "#F6F4EE",
    panel: "#FFFFFF",
    panelAlt: "#EFEBE1",
    ink: "#1E1C17",
    inkSoft: "#5B564B",
    inkFaint: "#8C8676",
    rule: "#DDD6C6",
    ruleStrong: "#C7BEA8",
    accent: "#2F5233",
    accentSoft: "#E4EBDF",
    accentText: "#24421F",
    citation: "#8A6D3B",
    citationBg: "#F2E8D2",
    danger: "#8A3B2E",
  },
  dark: {
    bg: "#15140F",
    panel: "#1C1B15",
    panelAlt: "#24221A",
    ink: "#EFE9DA",
    inkSoft: "#B4AC98",
    inkFaint: "#7C7666",
    rule: "#332F24",
    ruleStrong: "#433D2D",
    accent: "#6FA477",
    accentSoft: "#20291F",
    accentText: "#9BC9A0",
    citation: "#D3B579",
    citationBg: "#2A2416",
    danger: "#C77A67",
  },
};

const sans = { fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif" };
const serif = { fontFamily: "'Source Serif 4', 'Georgia', serif" };

/* ————————————————————————————————————————————————————————————————
   Mock data
———————————————————————————————————————————————————————————————— */

const DOCS = [
  { id: "d1", name: "Attention Is All You Need", type: "Research Paper", date: "Jun 2017", pages: 15, collection: "Research Papers" },
  { id: "d2", name: "Retrieval-Augmented Generation for Knowledge-Intensive NLP", type: "Research Paper", date: "May 2020", pages: 19, collection: "Research Papers" },
  { id: "d3", name: "A Survey of Vector Database Architectures", type: "Report", date: "Jan 2025", pages: 42, collection: "Reports" },
  { id: "d4", name: "Large Language Models: A Field Guide", type: "Book", date: "2024", pages: 312, collection: "Books" },
  { id: "d5", name: "FAISS: A Library for Efficient Similarity Search", type: "Research Paper", date: "Feb 2019", pages: 11, collection: "Research Papers" },
  { id: "d6", name: "Clinical Outcomes in Early-Stage Intervention", type: "Research Paper", date: "Sep 2023", pages: 24, collection: "Research Papers" },
];

const SOURCES = [
  { n: 1, doc: "Retrieval-Augmented Generation for Knowledge-Intensive NLP", page: 4, chunk: "#118", similarity: 0.91,
    passage: "Parametric memory alone struggles to represent knowledge precisely, revise facts, or explain provenance; combining a parametric model with a non-parametric retriever addresses each limitation." },
  { n: 2, doc: "A Survey of Vector Database Architectures", page: 18, chunk: "#204", similarity: 0.87,
    passage: "Approximate nearest-neighbor indexes trade a small amount of recall for substantial gains in query latency, which is the dominant factor in interactive retrieval settings." },
  { n: 3, doc: "FAISS: A Library for Efficient Similarity Search", page: 6, chunk: "#041", similarity: 0.83,
    passage: "Inverted-file indexes partition the vector space into coarse cells, restricting search to a small number of candidate cells at query time." },
];

const CHAT_DEMO = [
  {
    role: "user",
    text: "Summarize how retrieval-augmented generation improves on standard language models, and note what makes retrieval fast enough for interactive use.",
  },
  {
    role: "assistant",
    answer:
      "Retrieval-augmented systems pair a language model with a non-parametric memory of documents, which lets answers stay grounded in retrievable evidence rather than only what was memorized during training. [1] This matters most where facts need to be current, precise, or traceable back to a source.",
    findings: [
      "Retrieval separates factual memory from language generation, so knowledge can be updated without retraining.",
      "Approximate nearest-neighbor search keeps retrieval fast enough for interactive, sub-second use. [2]",
      "Index structures like inverted files narrow the search space before any distance is computed. [3]",
    ],
    citedSources: [1, 2, 3],
    confidence: 0.93,
    latency: "1.28s",
  },
];

const RETRIEVAL = {
  query: "How does retrieval stay fast enough for interactive use?",
  candidates: [
    { doc: "A Survey of Vector Database Architectures", score: 0.91 },
    { doc: "FAISS: A Library for Efficient Similarity Search", score: 0.87 },
    { doc: "Retrieval-Augmented Generation for Knowledge-Intensive NLP", score: 0.84 },
    { doc: "Large Language Models: A Field Guide", score: 0.69 },
  ],
  initialCandidates: 10,
  finalContext: 4,
  chunks: ["#118", "#204", "#041", "#332"],
};

const EVAL_METRICS = [
  { label: "Context Precision", value: 0.91 },
  { label: "Context Recall", value: 0.87 },
  { label: "Answer Relevance", value: 0.93 },
  { label: "Faithfulness", value: 0.95 },
];

const NAV_ITEMS = [
  { id: "research", label: "Research", icon: Sparkles },
  { id: "documents", label: "Documents", icon: Library },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "evaluation", label: "Evaluation", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* ————————————————————————————————————————————————————————————————
   Small building blocks
———————————————————————————————————————————————————————————————— */

function Logo({ c }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div
        className="w-6 h-6 flex items-center justify-center rounded-sm text-[13px] font-semibold"
        style={{ background: c.accent, color: c.panel, ...serif }}
      >
        A
      </div>
      <span className="text-[15px] font-semibold tracking-tight" style={sans}>
        Atlas <span style={{ color: c.inkSoft, fontWeight: 400 }}>RAG</span>
      </span>
    </div>
  );
}

function Pill({ children, c, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[12.5px] px-2.5 py-1 rounded-full transition-colors"
      style={{
        ...sans,
        color: active ? c.accentText : c.inkSoft,
        background: active ? c.accentSoft : "transparent",
        border: `1px solid ${active ? c.accent : "transparent"}`,
      }}
    >
      {children}
    </button>
  );
}

function ScoreBar({ value, c }) {
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: c.rule }}>
      <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: c.accent }} />
    </div>
  );
}

/* ————————————————————————————————————————————————————————————————
   Landing page
———————————————————————————————————————————————————————————————— */

function Landing({ c, onEnter, isDark, toggleDark }) {
  return (
    <div style={{ background: c.bg, color: c.ink, minHeight: "100vh", ...sans }}>
      <header
        className="flex items-center justify-between px-6 md:px-12 py-5 border-b"
        style={{ borderColor: c.rule }}
      >
        <Logo c={c} />
        <div className="flex items-center gap-6">
          <span className="hidden md:inline text-[13px]" style={{ color: c.inkSoft }}>
            Documents
          </span>
          <span className="hidden md:inline text-[13px]" style={{ color: c.inkSoft }}>
            Evaluation
          </span>
          <button onClick={toggleDark} aria-label="Toggle theme" style={{ color: c.inkSoft }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={onEnter}
            className="text-[13px] px-3.5 py-1.5 rounded-sm"
            style={{ background: c.ink, color: c.bg }}
          >
            Start Researching
          </button>
        </div>
      </header>

      <main className="px-6 md:px-12">
        <div className="max-w-4xl mx-auto pt-20 pb-16 text-center">
          <p className="text-[12.5px] tracking-wide mb-5" style={{ color: c.inkFaint }}>
            Your documents. Your questions. Evidence-backed answers.
          </p>
          <h1
            className="text-[40px] md:text-[58px] leading-[1.08] mb-6"
            style={{ ...serif, color: c.ink }}
          >
            Research faster.
            <br />
            Understand deeper.
          </h1>
          <p
            className="max-w-xl mx-auto text-[16px] leading-relaxed mb-9"
            style={{ color: c.inkSoft }}
          >
            Atlas RAG turns your papers, reports, and books into a research workspace.
            Ask a question and trace every sentence of the answer back to the page it
            came from.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 text-[14px] px-5 py-2.5 rounded-sm"
              style={{ background: c.accent, color: "#fff" }}
            >
              Start Researching <ArrowRight size={15} />
            </button>
            <button
              className="flex items-center gap-2 text-[14px] px-5 py-2.5 rounded-sm border"
              style={{ borderColor: c.ruleStrong, color: c.ink }}
            >
              View Architecture
            </button>
          </div>
        </div>

        {/* Hero visual: a miniature of the actual workspace */}
        <div className="max-w-5xl mx-auto mb-24">
          <div
            className="rounded-md border overflow-hidden shadow-sm"
            style={{ borderColor: c.rule, background: c.panel }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ borderColor: c.rule }}
            >
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: c.rule }} />
                <span className="w-2 h-2 rounded-full" style={{ background: c.rule }} />
                <span className="w-2 h-2 rounded-full" style={{ background: c.rule }} />
              </div>
              <span className="text-[11.5px] ml-2" style={{ color: c.inkFaint }}>
                Research Workspace
              </span>
            </div>
            <div className="grid grid-cols-12 h-[340px]">
              <div className="col-span-3 border-r p-3 space-y-2" style={{ borderColor: c.rule }}>
                <div className="text-[10.5px] uppercase tracking-wide mb-2" style={{ color: c.inkFaint }}>
                  Documents
                </div>
                {DOCS.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center gap-2">
                    <FileText size={11} style={{ color: c.inkFaint }} />
                    <div className="h-2 rounded-full flex-1" style={{ background: c.panelAlt }} />
                  </div>
                ))}
              </div>
              <div className="col-span-6 p-4 space-y-3">
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: c.inkFaint }}>
                  Answer
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 rounded-full" style={{ background: c.panelAlt, width: "95%" }} />
                  <div className="h-2.5 rounded-full" style={{ background: c.panelAlt, width: "88%" }} />
                  <div className="h-2.5 rounded-full" style={{ background: c.panelAlt, width: "70%" }} />
                </div>
                <div
                  className="inline-block text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: c.citationBg, color: c.citation }}
                >
                  [1]
                </div>
              </div>
              <div className="col-span-3 border-l p-3 space-y-3" style={{ borderColor: c.rule }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: c.inkFaint }}>
                  Sources
                </div>
                {[1, 2].map((n) => (
                  <div key={n} className="rounded border p-2" style={{ borderColor: c.rule }}>
                    <div className="text-[10px]" style={{ color: c.accentText }}>Source 0{n}</div>
                    <div className="h-1.5 rounded-full mt-1.5" style={{ background: c.panelAlt, width: "80%" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 pb-20">
          {[
            { t: "Grounded answers", d: "Every claim links to the passage that supports it, page and chunk included." },
            { t: "Transparent retrieval", d: "Inspect what was retrieved, reranked, and passed to the model." },
            { t: "A real library", d: "Papers, reports, and books, organized and searchable in one place." },
          ].map((f) => (
            <div key={f.t}>
              <h3 className="text-[15px] mb-2" style={{ ...serif, color: c.ink }}>{f.t}</h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: c.inkSoft }}>{f.d}</p>
            </div>
          ))}
        </div>

        {/* About */}
        <div
          className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1.4fr] gap-6 md:gap-10 pb-24 border-t pt-14 md:pt-16"
          style={{ borderColor: c.rule }}
        >
          <div>
            <p className="text-[12.5px] tracking-wide mb-3" style={{ color: c.inkFaint }}>
              About
            </p>
            <h2 className="text-[24px] md:text-[26px] leading-tight" style={{ ...serif, color: c.ink }}>
              Built for people who need to trust what they read.
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-[14.5px] leading-relaxed" style={{ color: c.inkSoft }}>
              Atlas RAG started from a simple frustration: chat-based AI tools sound
              confident, but rarely show their work. Researchers, analysts, and
              writers need more than a plausible-sounding answer — they need to
              know exactly which page, paragraph, or figure it came from.
            </p>
            <p className="text-[14.5px] leading-relaxed" style={{ color: c.inkSoft }}>
              We built Atlas around retrieval first, generation second. Every
              answer is assembled from passages you can open, verify, and cite
              yourself — a research tool you can't check isn't actually saving
              you any time.
            </p>
            <p className="text-[14.5px] leading-relaxed" style={{ color: c.inkSoft }}>
              It's a small team of engineers and former researchers, and we use
              Atlas on our own reading every week — literature reviews, technical
              reports, and the occasional three-hundred-page spec.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ————————————————————————————————————————————————————————————————
   Answer text with clickable citation markers
———————————————————————————————————————————————————————————————— */

function CitedText({ text, c, onCite }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          const n = Number(m[1]);
          return (
            <button
              key={i}
              onClick={() => onCite(n)}
              className="text-[11px] align-super mx-0.5 px-1 rounded"
              style={{ background: c.citationBg, color: c.citation }}
            >
              {n}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ————————————————————————————————————————————————————————————————
   Research Workspace — the three-column core
———————————————————————————————————————————————————————————————— */

function DocumentsSidebar({ c, selected, setSelected, collapsed }) {
  const [filter, setFilter] = useState("All Documents");
  const filters = ["All Documents", "Research Papers", "Reports", "Books"];
  const filtered = DOCS.filter((d) => filter === "All Documents" || d.collection === filter);

  if (collapsed) return null;

  return (
    <aside
      className="w-full md:w-[240px] shrink-0 border-r flex flex-col"
      style={{ borderColor: c.rule, background: c.panel }}
    >
      <div className="p-3 border-b" style={{ borderColor: c.rule }}>
        <button
          className="w-full flex items-center justify-center gap-1.5 text-[13px] py-2 rounded-sm"
          style={{ background: c.accent, color: "#fff" }}
        >
          <Plus size={14} /> Upload Documents
        </button>
      </div>
      <div className="px-3 pt-3 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <Pill key={f} c={c} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Pill>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10.5px] uppercase tracking-wide mb-1.5 mt-1" style={{ color: c.inkFaint }}>
          Recent
        </div>
        {filtered.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelected(d.id)}
            className="w-full text-left px-2.5 py-2 rounded-sm flex items-start gap-2"
            style={{ background: selected === d.id ? c.accentSoft : "transparent" }}
          >
            <FileText size={14} className="mt-0.5 shrink-0" style={{ color: selected === d.id ? c.accentText : c.inkFaint }} />
            <div className="min-w-0">
              <div
                className="text-[13px] leading-tight truncate"
                style={{ color: selected === d.id ? c.accentText : c.ink }}
              >
                {d.name}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: c.inkFaint }}>
                {d.type} · {d.date}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function AnswerBlock({ c, msg, onCite }) {
  return (
    <div className="max-w-2xl">
      <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: c.inkFaint }}>
        Answer
      </div>
      <p className="text-[15.5px] leading-relaxed mb-4" style={{ ...serif, color: c.ink }}>
        <CitedText text={msg.answer} c={c} onCite={onCite} />
      </p>

      <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: c.inkFaint }}>
        Key findings
      </div>
      <div className="space-y-2.5 mb-5">
        {msg.findings.map((f, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-[12px] mt-0.5 tabular-nums" style={{ color: c.inkFaint }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-[14px] leading-relaxed" style={{ color: c.inkSoft }}>
              <CitedText text={f} c={c} onCite={onCite} />
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 text-[11.5px]" style={{ color: c.inkFaint }}>
        <span>Confidence {(msg.confidence * 100).toFixed(0)}%</span>
        <span>·</span>
        <span>{msg.latency}</span>
        <span>·</span>
        <button className="flex items-center gap-1 hover:underline">
          <Bookmark size={11} /> Save to Notes
        </button>
      </div>
    </div>
  );
}

function ResearchPanel({ c, onCite, activeDoc }) {
  const [value, setValue] = useState("");
  const examples = [
    "Summarize the methodology used in this paper.",
    "What are the main findings?",
    "What limitations do the authors identify?",
  ];

  return (
    <section className="flex-1 min-w-0 flex flex-col" style={{ background: c.bg }}>
      <div
        className="px-6 py-3.5 border-b flex items-center justify-between"
        style={{ borderColor: c.rule }}
      >
        <div>
          <div className="text-[13.5px] font-medium" style={{ color: c.ink }}>
            AI Research Assistant
          </div>
          <div className="text-[11.5px]" style={{ color: c.inkFaint }}>
            {activeDoc ? `Scoped to ${activeDoc.name}` : "Searching your entire library"}
          </div>
        </div>
        <button className="text-[12px] flex items-center gap-1" style={{ color: c.inkSoft }}>
          New session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        <div>
          <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: c.inkFaint }}>
            Question
          </div>
          <p className="text-[15px] max-w-2xl" style={{ ...serif, color: c.ink }}>
            {CHAT_DEMO[0].text}
          </p>
        </div>
        <AnswerBlock c={c} msg={CHAT_DEMO[1]} onCite={onCite} />
      </div>

      <div className="p-4 border-t" style={{ borderColor: c.rule }}>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {examples.map((e) => (
            <button
              key={e}
              onClick={() => setValue(e)}
              className="text-[11.5px] px-2 py-1 rounded-full border"
              style={{ borderColor: c.rule, color: c.inkSoft }}
            >
              {e}
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-2 rounded-sm border px-3 py-2"
          style={{ borderColor: c.ruleStrong, background: c.panel }}
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask a question about your documents…"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: c.ink }}
          />
          <button aria-label="Voice input" style={{ color: c.inkFaint }}>
            <Mic size={16} />
          </button>
          <button
            aria-label="Send question"
            className="w-7 h-7 rounded-sm flex items-center justify-center"
            style={{ background: c.accent, color: "#fff" }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}

function SourcesPanel({ c, activeCitation, setActiveCitation, showInspector, setShowInspector, inspectorView, setInspectorView }) {
  return (
    <aside
      className="w-full md:w-[300px] shrink-0 border-l flex flex-col"
      style={{ borderColor: c.rule, background: c.panel }}
    >
      <div className="px-4 py-3.5 border-b flex items-center justify-between" style={{ borderColor: c.rule }}>
        <span className="text-[13.5px] font-medium" style={{ color: c.ink }}>Sources</span>
        <button
          onClick={() => setShowInspector((s) => !s)}
          className="text-[11.5px] flex items-center gap-1"
          style={{ color: c.inkSoft }}
        >
          <SlidersHorizontal size={12} /> Inspector
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {SOURCES.map((s) => (
          <button
            key={s.n}
            onClick={() => setActiveCitation(s.n)}
            className="w-full text-left rounded-sm border p-3 transition-colors"
            style={{
              borderColor: activeCitation === s.n ? c.accent : c.rule,
              background: activeCitation === s.n ? c.accentSoft : "transparent",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[11px] w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: c.citationBg, color: c.citation }}
              >
                {s.n}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: c.inkFaint }}>
                {(s.similarity * 100).toFixed(0)}% match
              </span>
            </div>
            <div className="text-[13px] leading-snug mb-1" style={{ color: c.ink }}>
              {s.doc}
            </div>
            <div className="text-[11px] mb-2" style={{ color: c.inkFaint }}>
              Page {s.page} · Chunk {s.chunk}
            </div>
            {activeCitation === s.n && (
              <p className="text-[12.5px] leading-relaxed pt-2 border-t" style={{ ...serif, color: c.inkSoft, borderColor: c.rule }}>
                "{s.passage}"
              </p>
            )}
            <ScoreBar value={s.similarity} c={c} />
            {activeCitation === s.n && (
              <div className="flex items-center gap-3 mt-2.5 text-[11px]" style={{ color: c.inkFaint }}>
                <span className="flex items-center gap-1"><ExternalLink size={11} /> Open document</span>
                <span className="flex items-center gap-1"><Copy size={11} /> Copy citation</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {showInspector && (
        <div className="border-t p-3.5" style={{ borderColor: c.rule }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12.5px] font-medium" style={{ color: c.ink }}>Retrieval Inspector</span>
            <div className="flex text-[10.5px] rounded-full overflow-hidden border" style={{ borderColor: c.rule }}>
              {["Simple", "Technical"].map((v) => (
                <button
                  key={v}
                  onClick={() => setInspectorView(v)}
                  className="px-2 py-1"
                  style={{
                    background: inspectorView === v ? c.accent : "transparent",
                    color: inspectorView === v ? "#fff" : c.inkSoft,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {inspectorView === "Simple" ? (
            <p className="text-[12px] leading-relaxed" style={{ color: c.inkSoft }}>
              Checked {RETRIEVAL.initialCandidates} passages across your library and kept the{" "}
              {RETRIEVAL.finalContext} most relevant to answer this question.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-[10.5px] uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>
                  Retrieved documents
                </div>
                <div className="space-y-1.5">
                  {RETRIEVAL.candidates.map((cand) => (
                    <div key={cand.doc} className="flex items-center justify-between gap-2">
                      <span className="text-[11.5px] truncate" style={{ color: c.inkSoft }}>{cand.doc}</span>
                      <span className="text-[11px] tabular-nums shrink-0" style={{ color: c.inkFaint }}>{cand.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11.5px]" style={{ color: c.inkSoft }}>
                <span>Initial candidates</span>
                <span className="tabular-nums">{RETRIEVAL.initialCandidates}</span>
              </div>
              <div className="flex items-center justify-between text-[11.5px]" style={{ color: c.inkSoft }}>
                <span>Final context</span>
                <span className="tabular-nums">{RETRIEVAL.finalContext}</span>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>Context chunks</div>
                <div className="flex flex-wrap gap-1.5">
                  {RETRIEVAL.chunks.map((ch) => (
                    <span key={ch} className="text-[10.5px] px-1.5 py-0.5 rounded" style={{ background: c.panelAlt, color: c.inkSoft }}>
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function ResearchWorkspace({ c }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeCitation, setActiveCitation] = useState(1);
  const [showInspector, setShowInspector] = useState(false);
  const [inspectorView, setInspectorView] = useState("Simple");
  const [showDocs, setShowDocs] = useState(true);

  const activeDoc = DOCS.find((d) => d.id === selectedDoc) || null;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="hidden md:block">
        <DocumentsSidebar c={c} selected={selectedDoc} setSelected={setSelectedDoc} collapsed={false} />
      </div>
      <ResearchPanel c={c} onCite={setActiveCitation} activeDoc={activeDoc} />
      <div className="hidden lg:block">
        <SourcesPanel
          c={c}
          activeCitation={activeCitation}
          setActiveCitation={setActiveCitation}
          showInspector={showInspector}
          setShowInspector={setShowInspector}
          inspectorView={inspectorView}
          setInspectorView={setInspectorView}
        />
      </div>
    </div>
  );
}

/* ————————————————————————————————————————————————————————————————
   Documents library page
———————————————————————————————————————————————————————————————— */

function DocumentsPage({ c }) {
  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: c.bg }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[24px] mb-1" style={{ ...serif, color: c.ink }}>Research Library</h1>
        <p className="text-[13.5px] mb-6" style={{ color: c.inkSoft }}>
          {DOCS.length} documents indexed and ready to query.
        </p>

        <div
          className="rounded-md border-2 border-dashed p-8 text-center mb-8"
          style={{ borderColor: c.ruleStrong, background: c.panel }}
        >
          <Upload size={20} className="mx-auto mb-3" style={{ color: c.inkFaint }} />
          <p className="text-[14px] mb-1" style={{ color: c.ink }}>Drop your documents here</p>
          <p className="text-[12.5px] mb-3" style={{ color: c.inkFaint }}>or browse files</p>
          <button
            className="text-[12.5px] px-3.5 py-1.5 rounded-sm border"
            style={{ borderColor: c.ruleStrong, color: c.ink }}
          >
            Browse files
          </button>
          <p className="text-[11px] mt-3" style={{ color: c.inkFaint }}>PDF · DOCX · TXT · MD</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {DOCS.map((d) => (
            <div key={d.id} className="rounded-sm border p-4" style={{ borderColor: c.rule, background: c.panel }}>
              <div className="flex items-start gap-3">
                <FileText size={16} className="mt-0.5" style={{ color: c.inkFaint }} />
                <div className="min-w-0">
                  <div className="text-[13.5px] leading-snug" style={{ color: c.ink }}>{d.name}</div>
                  <div className="text-[11.5px] mt-1" style={{ color: c.inkFaint }}>
                    {d.type} · {d.date} · {d.pages} pages
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ————————————————————————————————————————————————————————————————
   Notes page
———————————————————————————————————————————————————————————————— */

function NotesPage({ c }) {
  const notes = [
    {
      doc: "Retrieval-Augmented Generation for Knowledge-Intensive NLP",
      page: 4,
      passage: "Combining a parametric model with a non-parametric retriever addresses precision, revision, and provenance limitations.",
      note: "Good framing for the retrieval section of my thesis intro.",
    },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: c.bg }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[24px] mb-1" style={{ ...serif, color: c.ink }}>My Research Notes</h1>
        <p className="text-[13.5px] mb-6" style={{ color: c.inkSoft }}>
          Passages and answers you've saved while researching.
        </p>
        {notes.map((n, i) => (
          <div key={i} className="rounded-sm border p-4 mb-3" style={{ borderColor: c.rule, background: c.panel }}>
            <div className="text-[12.5px] mb-1" style={{ color: c.accentText }}>
              {n.doc} · Page {n.page}
            </div>
            <p className="text-[14px] leading-relaxed mb-3" style={{ ...serif, color: c.inkSoft }}>
              "{n.passage}"
            </p>
            <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>My note</div>
            <p className="text-[13px]" style={{ color: c.ink }}>{n.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ————————————————————————————————————————————————————————————————
   Evaluation dashboard
———————————————————————————————————————————————————————————————— */

function EvaluationPage({ c }) {
  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: c.bg }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[24px] mb-1" style={{ ...serif, color: c.ink }}>RAG Evaluation</h1>
        <p className="text-[13.5px] mb-8" style={{ color: c.inkSoft }}>
          How the retrieval and generation pipeline performs, measured continuously.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {EVAL_METRICS.map((m) => (
            <div key={m.label} className="rounded-sm border p-4" style={{ borderColor: c.rule, background: c.panel }}>
              <div className="text-[12px] mb-2" style={{ color: c.inkFaint }}>{m.label}</div>
              <div className="text-[26px] mb-2 tabular-nums" style={{ ...serif, color: c.ink }}>
                {m.value.toFixed(2)}
              </div>
              <ScoreBar value={m.value} c={c} />
            </div>
          ))}
          <div className="rounded-sm border p-4" style={{ borderColor: c.rule, background: c.panel }}>
            <div className="text-[12px] mb-2" style={{ color: c.inkFaint }}>Average Latency</div>
            <div className="text-[26px] tabular-nums" style={{ ...serif, color: c.ink }}>1.42s</div>
          </div>
        </div>

        <h2 className="text-[15px] mb-3" style={{ ...serif, color: c.ink }}>FAISS vs ChromaDB</h2>
        <div className="rounded-sm border overflow-hidden" style={{ borderColor: c.rule }}>
          <table className="w-full text-[13px]" style={{ color: c.ink }}>
            <thead>
              <tr style={{ background: c.panelAlt }}>
                <th className="text-left font-normal px-3.5 py-2.5" style={{ color: c.inkFaint }}></th>
                <th className="text-left font-normal px-3.5 py-2.5" style={{ color: c.inkFaint }}>FAISS</th>
                <th className="text-left font-normal px-3.5 py-2.5" style={{ color: c.inkFaint }}>ChromaDB</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Query latency", "24 ms", "31 ms"],
                ["Top-K retrieval", "Exact / approximate", "Approximate"],
                ["Persistence", "Manual", "Built-in"],
                ["Ease of use", "Library-level", "Server + client"],
              ].map((row, i) => (
                <tr key={row[0]} style={{ borderTop: `1px solid ${c.rule}` }}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3.5 py-2.5" style={{ color: j === 0 ? c.inkSoft : c.ink }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ————————————————————————————————————————————————————————————————
   Settings page
———————————————————————————————————————————————————————————————— */

function SettingRow({ label, hint, c, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: c.rule }}>
      <div>
        <div className="text-[13.5px]" style={{ color: c.ink }}>{label}</div>
        {hint && <div className="text-[11.5px] mt-0.5" style={{ color: c.inkFaint }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, c }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-5 rounded-full relative transition-colors"
      style={{ background: on ? c.accent : c.rule }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: on ? "18px" : "2px" }}
      />
    </button>
  );
}

function SettingsPage({ c, isDark, toggleDark }) {
  const [rerank, setRerank] = useState(true);
  const [debug, setDebug] = useState(false);
  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: c.bg }}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-[24px] mb-8" style={{ ...serif, color: c.ink }}>Settings</h1>

        <div className="mb-8">
          <h2 className="text-[11px] uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>General</h2>
          <SettingRow label="Dark mode" hint="Switch the interface theme" c={c}>
            <Toggle on={isDark} onClick={toggleDark} c={c} />
          </SettingRow>
        </div>

        <div className="mb-8">
          <h2 className="text-[11px] uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>Retrieval</h2>
          <SettingRow label="Top K" hint="Passages considered per query" c={c}>
            <span className="text-[13px] tabular-nums" style={{ color: c.inkSoft }}>10</span>
          </SettingRow>
          <SettingRow label="Chunk size" hint="Tokens per indexed passage" c={c}>
            <span className="text-[13px] tabular-nums" style={{ color: c.inkSoft }}>512</span>
          </SettingRow>
          <SettingRow label="Reranking" hint="Reorder candidates before generation" c={c}>
            <Toggle on={rerank} onClick={() => setRerank((v) => !v)} c={c} />
          </SettingRow>
        </div>

        <div className="mb-8">
          <h2 className="text-[11px] uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>Knowledge Base</h2>
          <SettingRow label="Vector database" c={c}>
            <span className="text-[13px]" style={{ color: c.inkSoft }}>FAISS</span>
          </SettingRow>
          <SettingRow label="Embedding model" c={c}>
            <span className="text-[13px]" style={{ color: c.inkSoft }}>text-embedding-3</span>
          </SettingRow>
        </div>

        <div>
          <h2 className="text-[11px] uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>Advanced</h2>
          <SettingRow label="Retrieval debugging" hint="Show the inspector by default" c={c}>
            <Toggle on={debug} onClick={() => setDebug((v) => !v)} c={c} />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

/* ————————————————————————————————————————————————————————————————
   App shell
———————————————————————————————————————————————————————————————— */

export default function App() {
  const [entered, setEntered] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState("research");

  const c = isDark ? palette.dark : palette.light;

  if (!entered) {
    return (
      <Landing c={c} onEnter={() => setEntered(true)} isDark={isDark} toggleDark={() => setIsDark((v) => !v)} />
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: c.bg, color: c.ink, ...sans }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: c.rule, background: c.panel }}
      >
        <div className="flex items-center gap-6">
          <Logo c={c} />
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-sm"
                style={{
                  color: view === item.id ? c.accentText : c.inkSoft,
                  background: view === item.id ? c.accentSoft : "transparent",
                }}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-sm border"
            style={{ borderColor: c.rule }}
          >
            <Search size={13} style={{ color: c.inkFaint }} />
            <input
              placeholder="Search documents…"
              className="bg-transparent outline-none text-[12.5px] w-36"
              style={{ color: c.ink }}
            />
          </div>
          <button onClick={() => setIsDark((v) => !v)} aria-label="Toggle theme" style={{ color: c.inkSoft }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px]"
            style={{ background: c.accentSoft, color: c.accentText }}
          >
            R
          </div>
        </div>
      </header>

      {/* View body */}
      {view === "research" && <ResearchWorkspace c={c} />}
      {view === "documents" && <DocumentsPage c={c} />}
      {view === "notes" && <NotesPage c={c} />}
      {view === "evaluation" && <EvaluationPage c={c} />}
      {view === "settings" && <SettingsPage c={c} isDark={isDark} toggleDark={() => setIsDark((v) => !v)} />}

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden flex items-center justify-around border-t py-2 shrink-0"
        style={{ borderColor: c.rule, background: c.panel }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="flex flex-col items-center gap-1 px-2"
            style={{ color: view === item.id ? c.accentText : c.inkFaint }}
          >
            <item.icon size={17} />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}