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
import { scanBodies } from "@/lib/bodyScanning";
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

  /* ── Step 2→3: Names confirmed, run body scan + analysis ── */
  const handleNamesConfirmed = useCallback(async (confirmedNames: Record<string, string>) => {
    setNames(confirmedNames);
    setStep("analyzing");

    try {
      // Run BodyPix body scan + image load in parallel
      const img = new Image();
      img.src = preview!;
      const [bodyScanResults] = await Promise.all([
        scanBodies(preview!).catch(() => []),
        new Promise<void>((resolve) => {
          if (img.complete) { resolve(); return; }
          img.onload = () => resolve();
        }),
      ]);

      // Build person data — BodyPix body signals as primary, face bbox as fallback
      // Both face-api and BodyPix sort left-to-right so indices align
      const personData: Person[] = faces.map((face, i) => {
        const body = bodyScanResults[i];
        if (body) {
          return {
            faceId: face.id,
            name: confirmedNames[face.id] || `Person ${i + 1}`,
            scores: body.signals,
            totalScore: body.composite_score,
          };
        }
        // Fallback: bbox heuristic from face-api detection
        const { scores, totalScore } = generateScores(face, img.width, img.height);
        return {
          faceId: face.id,
          name: confirmedNames[face.id] || `Person ${i + 1}`,
          scores,
          totalScore,
        };
      });

      setPersons(personData);

      // Claude API: get explanation text + blend signals for even better accuracy
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
          explanation = result.data.explanation || "";
          disclaimer = result.data.disclaimer || disclaimer;

          // Blend: Claude knows image context, BodyPix knows actual body metrics
          if (result.data.people && result.data.people.length >= 2) {
            const apiPeople = result.data.people;
            personData.forEach((p, i) => {
              const api = apiPeople[i];
              const body = bodyScanResults[i];
              if (!api) return;
              if (body) {
                // Posture dominance: trust BodyPix more (real keypoints)
                // Spatial/facial/attention: trust Claude more (scene context)
                p.scores = {
                  spatial_presence:   Math.round(api.signals.spatial_presence   * 0.6 + body.signals.spatial_presence   * 0.4),
                  posture_dominance:  Math.round(api.signals.posture_dominance  * 0.4 + body.signals.posture_dominance  * 0.6),
                  facial_intensity:   Math.round(api.signals.facial_intensity   * 0.6 + body.signals.facial_intensity   * 0.4),
                  attention_capture:  Math.round(api.signals.attention_capture  * 0.5 + body.signals.attention_capture  * 0.5),
                };
              } else {
                p.scores = api.signals;
              }
              p.totalScore = Math.round(
                (p.scores.spatial_presence  * 0.30 +
                 p.scores.posture_dominance * 0.25 +
                 p.scores.facial_intensity  * 0.25 +
                 p.scores.attention_capture * 0.20) * 10
              ) / 10;
            });
            setPersons([...personData]);
          }

          setApiResult(result.data);
        }
      } catch {
        console.warn("[page] API analysis failed, using body scan scores");
      }

      setProcessingTime(Date.now() - startTimeRef.current);

      if (!apiResult) {
        const sorted = [...personData].sort((a, b) => b.totalScore - a.totalScore);
        setApiResult({
          people: sorted.map((p, i) => ({
            label: p.name,
            position: "center",
            signals: p.scores,
            composite_score: p.totalScore,
            rank: i + 1,
          })),
          winner_index: 0,
          is_tie: sorted.length >= 2 && Math.abs(sorted[0].totalScore - sorted[1].totalScore) < 3,
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
        preview={preview}
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
        {/* Background image - ASU frat leader with fade animation */}
        {/* TODO: Add image URL when provided */}
        {/* <div className="absolute inset-0 z-0 animate-background-fade">
          <img 
            src="/your-image.jpg" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
        </div> */}
        
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
                Inspired from ASU frat leader
              </p>
              <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Headline */}
            <div className="text-center space-y-3">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-zinc-50 text-gradient animate-float leading-tight">
                Mog.GPT
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
