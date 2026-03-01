"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  uploadUI: React.ReactNode;
  onImageFile: (file: File) => void;
};

export default function ImageSourceToggle({ uploadUI, onImageFile }: Props) {
  const [mode, setMode] = useState<"upload" | "camera">("upload");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (mode !== "camera") stopCamera();
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Webcam is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setIsCameraOn(true);
    } catch (err: unknown) {
      setIsCameraOn(false);
      const message =
        typeof err === "object" && err && "name" in err && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow access and try again."
          : "Could not access the camera. Try another browser or device.";
      setCameraError(message);
    }
  };

  const capture = async () => {
    setCameraError(null);
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError("Camera is not ready yet. Try again in a second.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Capture failed. Please try again.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );

    if (!blob) {
      setCameraError("Capture failed. Please try again.");
      return;
    }

    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    onImageFile(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
            mode === "upload"
              ? "border-zinc-500 bg-zinc-800 text-zinc-100"
              : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          Upload
        </button>

        <button
          type="button"
          onClick={() => setMode("camera")}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
            mode === "camera"
              ? "border-zinc-500 bg-zinc-800 text-zinc-100"
              : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          Camera
        </button>
      </div>

      {mode === "upload" ? (
        <>{uploadUI}</>
      ) : (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {!isCameraOn ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-2 rounded-lg text-sm border border-zinc-600 text-zinc-100 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Start camera
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={capture}
                  className="px-3 py-2 rounded-lg text-sm border border-zinc-600 text-zinc-100 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Capture
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 rounded-lg text-sm border border-zinc-600 text-zinc-100 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Stop
                </button>
              </>
            )}
          </div>

          {cameraError && (
            <p className="mt-2 text-sm text-red-400">{cameraError}</p>
          )}

          <div className="mt-3 rounded-lg overflow-hidden border border-zinc-800 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full max-h-[420px] bg-black object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
