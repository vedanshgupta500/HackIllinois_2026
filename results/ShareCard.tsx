"use client";

import { useRef, useState } from "react";
import { Share2, Download, Check } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";
import { Button } from "@/components/ui/Button";

interface ShareCardProps {
  result: AnalysisResult;
}

function OffscreenCard({ result }: { result: AnalysisResult }) {
  const winner = result.people[0];
  return (
    <div
      style={{
        width: 1200, height: 630,
        background: "#0a0a0a",
        display: "flex", flexDirection: "column",
        padding: 64,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Subtle top border accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#7c3aed" }} />

      <p style={{ color: "#52525b", fontSize: 13, letterSpacing: "0.12em", fontWeight: 500, textTransform: "uppercase" }}>
        Who Runs This Frame?
      </p>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 12 }}>
        <p style={{ color: "#52525b", fontSize: 14, letterSpacing: "0.08em" }}>
          {result.is_tie ? "RESULT" : "DOMINATES THE FRAME"}
        </p>
        <h1 style={{ color: "#f5f5f5", fontSize: 88, fontWeight: 600, lineHeight: 1, margin: 0, letterSpacing: "-0.03em" }}>
          {result.is_tie ? "Tied" : winner.label}
        </h1>
        {!result.is_tie && (
          <p style={{ color: "#a78bfa", fontSize: 40, fontWeight: 600, margin: 0 }}>
            {winner.composite_score}/100
          </p>
        )}
      </div>

      {/* Score row */}
      <div style={{ display: "flex", gap: 32, paddingTop: 32, borderTop: "1px solid #1f1f1f", marginTop: 32 }}>
        {result.people.slice(0, 4).map((p, i) => (
          <div key={i}>
            <p style={{ color: "#3f3f46", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{p.label}</p>
            <p style={{ color: "#a1a1aa", fontSize: 22, fontWeight: 600, margin: "4px 0 0" }}>{p.composite_score}</p>
          </div>
        ))}
      </div>

      <p style={{ color: "#27272a", fontSize: 11, marginTop: 20 }}>
        Photographic composition only. Not a reflection of personal qualities.
      </p>
    </div>
  );
}

export function ShareCard({ result }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "done">("idle");

  async function capture(scale = 2) {
    const { default: html2canvas } = await import("html2canvas");
    return html2canvas(cardRef.current!, {
      backgroundColor: "#0a0a0a",
      scale,
      useCORS: true,
      logging: false,
    });
  }

  async function handleShare() {
    const canvas = await capture(1.5);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "frame-result.png", { type: "image/png" });
      const text = result.is_tie ? "It's a tie!" : `${result.people[0].label} dominates`;
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Who Runs This Frame?", text });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "frame-result.png"; a.click();
        URL.revokeObjectURL(url);
        setState("done");
        setTimeout(() => setState("idle"), 2000);
      }
    }, "image/png");
  }

  async function handleDownload() {
    const canvas = await capture(2);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "frame-result.png";
    a.click();
  }

  return (
    <>
      <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={cardRef}><OffscreenCard result={result} /></div>
      </div>
      <Button variant="secondary" onClick={handleShare}>
        {state === "done" ? <><Check size={14} /> Saved</> : <><Share2 size={14} /> Share</>}
      </Button>
      <button
        onClick={handleDownload}
        className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
        title="Download PNG"
      >
        <Download size={14} />
      </button>
    </>
  );
}
