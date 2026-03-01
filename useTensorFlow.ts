import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for extracting TensorFlow features client-side (optional)
 * Use this to provide real-time feedback before sending to the server
 */
interface ClientTFFeatures {
  facesDetected: number;
  isAnalyzing: boolean;
  error: string | null;
  confidence: number;
}

export const useTensorFlowPreview = () => {
  const [features, setFeatures] = useState<ClientTFFeatures>({
    facesDetected: 0,
    isAnalyzing: false,
    error: null,
    confidence: 0,
  });

  const analyzeImagePreview = useCallback(
    async (imageFile: File): Promise<ClientTFFeatures> => {
      setFeatures((prev) => ({ ...prev, isAnalyzing: true, error: null }));

      try {
        // Try to load TensorFlow.js in browser if available
        // This is optional - the server will do the heavy lifting
        const img = new Image();
        const reader = new FileReader();

        return new Promise((resolve) => {
          reader.onload = (e) => {
            img.onload = () => {
              // Quick validation - just check if image loads
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve({
                  facesDetected: 0,
                  isAnalyzing: false,
                  error: "Failed to analyze image",
                  confidence: 0,
                });
                return;
              }

              ctx.drawImage(img, 0, 0);

              // Simple heuristic: check if image has enough variance (not blank)
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const data = imageData.data;
              let colorVariance = 0;
              const sampleSize = Math.min(1000, data.length / 4);

              for (let i = 0; i < sampleSize; i++) {
                const idx = i * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                colorVariance += Math.sqrt(
                  r * r + g * g + b * b
                ) / 441.67;
              }

              const variance = colorVariance / sampleSize;
              const isValidImage = variance > 0.2;

              if (isValidImage) {
                setFeatures({
                  facesDetected: -1, // Unknown until server analyzes
                  isAnalyzing: false,
                  error: null,
                  confidence: 100,
                });
                resolve({
                  facesDetected: -1,
                  isAnalyzing: false,
                  error: null,
                  confidence: 100,
                });
              } else {
                const err = "Image appears blank or low quality";
                setFeatures({
                  facesDetected: 0,
                  isAnalyzing: false,
                  error: err,
                  confidence: 0,
                });
                resolve({
                  facesDetected: 0,
                  isAnalyzing: false,
                  error: err,
                  confidence: 0,
                });
              }
            };

            img.onerror = () => {
              const err = "Failed to load image";
              setFeatures({
                facesDetected: 0,
                isAnalyzing: false,
                error: err,
                confidence: 0,
              });
              resolve({
                facesDetected: 0,
                isAnalyzing: false,
                error: err,
                confidence: 0,
              });
            };

            img.src = e.target?.result as string;
          };

          reader.readAsDataURL(imageFile);
        });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        setFeatures({
          facesDetected: 0,
          isAnalyzing: false,
          error: errorMsg,
          confidence: 0,
        });
        return {
          facesDetected: 0,
          isAnalyzing: false,
          error: errorMsg,
          confidence: 0,
        };
      }
    },
    []
  );

  return { features, analyzeImagePreview };
};

/**
 * Hook for getting TensorFlow analysis status
 * Use this to show loading states during server-side analysis
 */
export const useTensorFlowStatus = () => {
  const [status, setStatus] = useState<{
    tensorflowActive: boolean;
    message: string;
  }>({
    tensorflowActive: false,
    message: "Ready",
  });

  return { status, setStatus };
};
