"use client";

import { useState, useCallback, useRef } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { DropZone } from "@/components/upload/DropZone";
import { LoadingOverlay } from "@/components/processing/LoadingOverlay";
import { FaceLabelStep } from "@/components/steps/FaceLabelStep";
import { ResultsView } from "@/components/results/ResultsView";
import { EmptyFaceState } from "@/components/results/EmptyFaceState";
import { Navbar } from "@/components/ui/Navbar";
import { ScanCounter } from "@/components/ui/ScanCounter";
import { Button } from "@/components/ui/Button";
import { detectFaces, generateScores } from "@/lib/faceDetection";
import type { Face, Person, AppStep, AnalysisResult } from "@/types/analysis";

const SIGNALS = [
  { label: "Spatial Presence", desc: "Frame area occupied" },
  { label: "Posture",          desc: "Body orientation"   },
  { label: "Facial Intensity", desc: "Gaze & expression"  },
  { label: "Attention Capture", desc: "Compositional pull" },
];

export default function HomePage() {
  const { file, preview, error: uploadError, clear: clearUpload, ...uploadProps } = useImageUpload();

  const [step, setStep] = useState<AppStep>("upload");
  const [faces, setFaces] = useState<Face[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [persons, setPersons] = useState<Person[]>([]);
  const [apiResult, setApiResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | undefined>();
  const startTimeRef = useRef(0);

  /* ── Reset everything ── */
  const resetAll = useCallback(() => {
    clearUpload();
    setStep("upload");
    setFaces([]);
    setNames({});
    setPersons([]);
    setApiResult(null);
    setError(null);
    setProcessingTime(undefined);
  }, [clearUpload]);

  /* ── Step 1→2: Start face detection ── */
  const handleAnalyze = useCallback(async () => {
    if (!file || !preview) return;
    setError(null);
    setStep("detecting");
    startTimeRef.current = Date.now();

    try {
      const detected = await detectFaces(preview);
      setFaces(detected);

      if (detected.length === 0) {
        // Show empty state — step stays "detecting" briefly then moves
        setStep("results"); // ResultsView handles 0-face case via EmptyFaceState
        return;
      }

      // Initialize default names
      const defaultNames: Record<string, string> = {};
      detected.forEach((f, i) => {
        defaultNames[f.id] = `Person ${i + 1}`;
      });
      setNames(defaultNames);
      setStep("labeling");
    } catch {
      setError("Face detection failed. Please try a different image.");
      setStep("upload");
    }
  }, [file, preview]);

  /* ── Step 2→3: Names confirmed, run analysis ── */
  const handleNamesConfirmed = useCallback(async (confirmedNames: Record<string, string>) => {
    setNames(confirmedNames);
    setStep("analyzing");

    try {
      // Generate client-side scores from face positions
      const img = new Image();
      img.src = preview!;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        if (img.complete) resolve();
      });

      const personData: Person[] = faces.map((face, i) => {
        const { scores, totalScore } = generateScores(face, img.width, img.height);
        return {
          faceId: face.id,
          name: confirmedNames[face.id] || `Person ${i + 1}`,
          scores,
          totalScore,
        };
      });

      // Sort by total score descending to determine ranks
      const sorted = [...personData].sort((a, b) => b.totalScore - a.totalScore);
      sorted.forEach((p, i) => {
        const original = personData.find((o) => o.faceId === p.faceId)!;
        // Assign rank — we keep it on the person data for ResultsView
        (original as Person & { rank?: number }).totalScore = p.totalScore;
      });

      setPersons(personData);

      // Also call the API for explanation text
      let explanation = "";
      let disclaimer = "Analysis covers photographic composition only — not attractiveness or personal qualities.";

      try {
        const base64 = await fileToBase64(file!);
        const mimeType = file!.type as "image/jpeg" | "image/png" | "image/webp";
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType }),
        });
        const result = await response.json();
        if (result.success) {
          setApiResult(result.data);
          explanation = result.data.explanation || "";
          disclaimer = result.data.disclaimer || disclaimer;

          // Optionally blend API scores with face-detection scores
          if (result.data.people && result.data.people.length >= 2) {
            // Use API scores for better accuracy when available
            const apiPeople = result.data.people;
            personData.forEach((p, i) => {
              if (apiPeople[i]) {
                p.scores = apiPeople[i].signals;
                p.totalScore = apiPeople[i].composite_score;
              }
            });
            // Re-sort after blending
            const reSorted = [...personData].sort((a, b) => b.totalScore - a.totalScore);
            reSorted.forEach((p, i) => {
              const original = personData.find((o) => o.faceId === p.faceId)!;
              original.totalScore = p.totalScore;
            });
            setPersons([...personData]);
          }
        }
      } catch {
        // API failed — use client-side scores (already set)
        console.warn("[page] API analysis failed, using client-side scores");
      }

      setProcessingTime(Date.now() - startTimeRef.current);

      // Build a "fake" apiResult for ResultsView if API didn't return one
      if (!apiResult) {
        setApiResult({
          people: personData.map((p, i) => ({
            label: confirmedNames[p.faceId] || `Person ${i + 1}`,
            position: "center",
            signals: p.scores,
            composite_score: p.totalScore,
            rank: i + 1,
          })),
          winner_index: 0,
          is_tie: personData.length >= 2 && Math.abs(personData[0].totalScore - personData[1].totalScore) < 3,
          explanation,
          disclaimer,
          processing_time_ms: Date.now() - startTimeRef.current,
        });
      }

      setStep("results");
    } catch {
      setError("Analysis failed. Please try again.");
      setStep("upload");
    }
  }, [faces, preview, file, apiResult]);

  /* ── Name change handler (from results screen) ── */
  const handleNameChange = useCallback((faceId: string, name: string) => {
    setNames((prev) => ({ ...prev, [faceId]: name }));
    setPersons((prev) =>
      prev.map((p) => (p.faceId === faceId ? { ...p, name } : p))
    );
  }, []);

  /* ── Render based on current step ── */

  // Loading: detecting faces
  if (step === "detecting") {
    return <LoadingOverlay preview={preview} mode="detecting" />;
  }

  // Loading: analyzing
  if (step === "analyzing") {
    return <LoadingOverlay preview={preview} mode="analyzing" />;
  }

  // Face labeling modal
  if (step === "labeling") {
    return (
      <FaceLabelStep
        faces={faces}
        onConfirm={handleNamesConfirmed}
        onBack={() => {
          setStep("upload");
          setFaces([]);
        }}
      />
    );
  }

  // Results
  if (step === "results") {
    // 0 faces → empty state
    if (faces.length === 0) {
      return (
        <>
          <Navbar onUploadNew={resetAll} />
          <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6">
            <EmptyFaceState onRetry={resetAll} />
          </main>
        </>
      );
    }

    // Compute ranks from sorted persons
    const sorted = [...persons].sort((a, b) => b.totalScore - a.totalScore);
    const rankedPersons = sorted.map((p, i) => ({
      ...p,
      rank: i + 1,
    }));

    return (
      <ResultsView
        faces={faces}
        names={names}
        persons={rankedPersons}
        explanation={apiResult?.explanation || ""}
        disclaimer={apiResult?.disclaimer || "Analysis covers photographic composition only — not attractiveness or personal qualities."}
        processingTime={processingTime}
        originalImage={preview}
        onReset={resetAll}
        onNameChange={handleNameChange}
      />
    );
  }

  // Upload step (default)
  return (
    <>
      <Navbar />

      <main className="min-h-[calc(100vh-56px)] flex flex-col relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        
        {/* ── Hero ── */}
        <section className="flex-1 flex flex-col items-center justify-center py-16 px-6 relative z-10">
          <div className="w-full max-w-prose flex flex-col items-center gap-8 animate-fade-in">

            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                Compositional AI
              </p>
              <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Headline */}
            <div className="text-center space-y-3">
              <h1 className="text-zinc-50 text-gradient animate-float">
                Who Runs This Frame?
              </h1>
              <p className="text-zinc-400 text-base max-w-sm mx-auto leading-relaxed">
                Upload a photo with 2–6 people. AI scores who commands the frame.
              </p>
            </div>

            {/* Upload area */}
            <div className="w-full">
              <DropZone preview={preview} error={uploadError} clear={clearUpload} {...uploadProps} />
            </div>

            {/* Primary CTA */}
            {file && !error && (
              <Button size="lg" onClick={handleAnalyze} className="w-full">
                Analyze Frame
              </Button>
            )}

            {/* Error */}
            {error && (
              <div className="w-full p-4 rounded-xl border border-red-900/60 bg-red-950/30 text-center animate-fade-in">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={resetAll}
                  className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
                >
                  Try a different image
                </button>
              </div>
            )}

            {/* Scan counter */}
            <ScanCounter />

          </div>
        </section>

        {/* ── Signal legend ── */}
        <section className="border-t border-zinc-900 py-8">
          <div className="container">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900 rounded-xl overflow-hidden border border-zinc-900">
              {SIGNALS.map((s) => (
                <div key={s.label} className="bg-zinc-950 px-4 py-4">
                  <p className="text-zinc-300 text-xs font-medium">{s.label}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-900 py-5">
          <div className="container">
            <p className="text-zinc-700 text-xs text-center">
              Analysis covers photographic composition only — not attractiveness or personal qualities.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

/* ── Helpers ── */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}
