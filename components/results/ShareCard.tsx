"use client";

import { useRef, useState } from "react";
import { Share2, Download, Check } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";

interface ShareCardProps {
  result: AnalysisResult;
}

// Off-screen card rendered for html2canvas capture
function OffscreenShareCard({ result }: { result: AnalysisResult }) {
  const isTie = result.winner === "tie";
  const winnerLabel = isTie ? "TIED" : result.winner === "person_a" ? "PERSON A" : "PERSON B";
  const winnerScore = isTie
    ? null
    : result.winner === "person_a"
    ? result.person_a.composite_score
    : result.person_b.composite_score;

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: "linear-gradient(135deg, #09090b 0%, #18071a 100%)",
        display: "flex",
        flexDirection: "column",
        padding: 60,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        }}
      />

      {/* App name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "auto" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(139,92,246,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ⚡
        </div>
        <span style={{ color: "#71717a", fontSize: 14, letterSpacing: "0.15em", fontWeight: 600 }}>
          WHO RUNS THIS FRAME?
        </span>
      </div>

      {/* Winner */}
      <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#71717a", fontSize: 16, letterSpacing: "0.1em", marginBottom: 12 }}>
          DOMINATES THE FRAME
        </p>
        <h1 style={{ color: "#ffffff", fontSize: 96, fontWeight: 900, lineHeight: 1, margin: 0 }}>
          {winnerLabel}
        </h1>
        {winnerScore !== null && (
          <p style={{ color: "#8b5cf6", fontSize: 48, fontWeight: 900, marginTop: 8 }}>
            {winnerScore}/100
          </p>
        )}
        <p style={{ color: "#52525b", fontSize: 14, marginTop: 12 }}>
          {result.margin.toFixed(1)} pt margin · {result.confidence}% confidence
        </p>
      </div>

      {/* Score strip */}
      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          marginTop: "auto",
          marginBottom: 20,
        }}
      >
        {[
          { label: "Spatial", a: result.person_a.signals.spatial_presence, b: result.person_b.signals.spatial_presence },
          { label: "Posture", a: result.person_a.signals.posture_dominance, b: result.person_b.signals.posture_dominance },
          { label: "Facial", a: result.person_a.signals.facial_intensity, b: result.person_b.signals.facial_intensity },
          { label: "Attention", a: result.person_a.signals.attention_capture, b: result.person_b.signals.attention_capture },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ color: "#52525b", fontSize: 11, letterSpacing: "0.1em" }}>{s.label.toUpperCase()}</p>
            <p style={{ color: "#8b5cf6", fontSize: 18, fontWeight: 700 }}>{s.a}</p>
            <p style={{ color: "#52525b", fontSize: 11 }}>vs</p>
            <p style={{ color: "#f59e0b", fontSize: 18, fontWeight: 700 }}>{s.b}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p style={{ color: "#3f3f46", fontSize: 11, textAlign: "center" }}>
        Analysis based on photographic composition only. Not a reflection of personal qualities.
      </p>
    </div>
  );
}

export function ShareCard({ result }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current!, {
        backgroundColor: "#09090b",
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "who-runs-this-frame.png", { type: "image/png" });

        const winnerLabel =
          result.winner === "tie"
            ? "It's a tie!"
            : result.winner === "person_a"
            ? "Person A dominates"
            : "Person B dominates";

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Who Runs This Frame?",
            text: `${winnerLabel} — analyzed by Who Runs This Frame?`,
          });
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "who-runs-this-frame.png";
          a.click();
          URL.revokeObjectURL(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }, "image/png");
    } catch (err) {
      console.error("Share failed:", err);
    }
  }

  return (
    <>
      {/* Off-screen card for capture */}
      <div
        style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <div ref={cardRef}>
          <OffscreenShareCard result={result} />
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all duration-150 hover:-translate-y-0.5"
      >
        {copied ? (
          <>
            <Check size={16} className="text-green-400" />
            Downloaded!
          </>
        ) : (
          <>
            <Share2 size={16} />
            Share Result
          </>
        )}
      </button>

      {/* Download button (always visible) */}
      <button
        onClick={async () => {
          const { default: html2canvas } = await import("html2canvas");
          const canvas = await html2canvas(cardRef.current!, {
            backgroundColor: "#09090b",
            scale: 2,
            useCORS: true,
            logging: false,
          });
          const url = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = url;
          a.download = "who-runs-this-frame.png";
          a.click();
        }}
        className="flex items-center gap-2 px-4 py-3 text-zinc-400 hover:text-white transition-colors"
        title="Download as PNG"
      >
        <Download size={16} />
      </button>
    </>
  );
}
