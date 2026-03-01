"use client";

import * as faceapi from 'face-api.js';
import type { Face, BBox } from "@/types/analysis";

// Cache the model loading state
let modelLoaded = false;

async function loadModels(): Promise<void> {
  if (modelLoaded) return;
  
  try {
    console.log('[FaceAPI] Loading TinyFaceDetector model...');
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    modelLoaded = true;
    console.log('[FaceAPI] Model loaded successfully');
  } catch (error) {
    console.error('[FaceAPI] Failed to load model:', error);
    throw error;
  }
}

function cropFace(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  bbox: BBox
): string {
  const PAD = 0.35; // 35% padding around face
  const padX = bbox.w * PAD;
  const padY = bbox.h * PAD;
  const sx = Math.max(0, bbox.x - padX);
  const sy = Math.max(0, bbox.y - padY);
  const sw = Math.min(img.width - sx, bbox.w + padX * 2);
  const sh = Math.min(img.height - sy, bbox.h + padY * 2);

  const size = 200;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Detect faces in an image using face-api.js TinyFaceDetector
 * Uses very sensitive parameters to detect all faces including small or partially visible ones
 */
export async function detectFaces(imageSrc: string): Promise<Face[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        // Load the face-api.js model
        await loadModels();
        
        // Run face detection with very sensitive parameters
        console.log('[FaceAPI] Running face detection...');
        
        // TinyFaceDetector options - use very low threshold to catch all faces
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,      // Higher resolution for better detection
          scoreThreshold: 0.3  // Very low threshold to detect all faces (default is 0.5)
        });
        
        const detections = await faceapi.detectAllFaces(img, options);
        console.log(`[FaceAPI] Detected ${detections.length} faces`);
        
        if (detections.length === 0) {
          resolve([]);
          return;
        }
        
        // Convert face-api.js detections to our Face format
        const cropCanvas = document.createElement("canvas");
        const faces: Face[] = detections.map((detection, i) => {
          const box = detection.box;
          
          const bbox: BBox = {
            x: box.x,
            y: box.y,
            w: box.width,
            h: box.height,
          };
          
          const cropUrl = cropFace(cropCanvas, img, bbox);
          
          return {
            id: `face_${i}`,
            bbox,
            cropUrl,
            confidence: detection.score,
          };
        });
        
        // Sort faces left-to-right
        faces.sort((a, b) => a.bbox.x - b.bbox.x);
        // Re-number IDs after sorting
        faces.forEach((f, i) => (f.id = `face_${i}`));
        
        console.log(`[detectFaces] Detected ${faces.length} faces:`, faces.map(f => ({
          id: f.id,
          position: `(${Math.round(f.bbox.x)}, ${Math.round(f.bbox.y)})`,
          size: `${Math.round(f.bbox.w)}x${Math.round(f.bbox.h)}`,
          confidence: f.confidence.toFixed(2)
        })));
        
        resolve(faces);
      } catch (error) {
        console.error('[FaceAPI] Error detecting faces:', error);
        resolve([]);
      }
    };
    img.onerror = () => {
      console.error('[FaceAPI] Error loading image');
      resolve([]);
    };
    img.src = imageSrc;
  });
}

/**
 * Generate deterministic pseudo-scores from a face's bounding box.
 * Stable across refreshes for the same image.
 */
export function generateScores(face: Face, imgWidth: number, imgHeight: number) {
  // Simple hash from bbox
  const seed = face.bbox.x * 7 + face.bbox.y * 13 + face.bbox.w * 31 + face.bbox.h * 37;
  const hash = (v: number) => ((Math.sin(v) * 10000) % 1 + 1) % 1; // 0-1

  const frameRatio = (face.bbox.w * face.bbox.h) / (imgWidth * imgHeight);
  const centerX = (face.bbox.x + face.bbox.w / 2) / imgWidth;
  const centerDist = Math.abs(centerX - 0.5);

  const spatial = Math.round(
    Math.min(95, Math.max(30, frameRatio * 400 + hash(seed + 1) * 20 + 35))
  );
  const posture = Math.round(
    Math.min(95, Math.max(25, 50 + hash(seed + 2) * 30 + (1 - centerDist) * 15))
  );
  const facial = Math.round(
    Math.min(95, Math.max(30, face.confidence * 60 + hash(seed + 3) * 25 + 15))
  );
  const attention = Math.round(
    Math.min(95, Math.max(25, (1 - centerDist) * 50 + hash(seed + 4) * 25 + 20))
  );

  const total =
    Math.round(
      (spatial * 0.3 + posture * 0.25 + facial * 0.25 + attention * 0.2) * 10
    ) / 10;

  return {
    scores: {
      spatial_presence: spatial,
      posture_dominance: posture,
      facial_intensity: facial,
      attention_capture: attention,
    },
    totalScore: total,
  };
}
