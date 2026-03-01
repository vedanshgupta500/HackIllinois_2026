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

interface SkinRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  density: number;
}

function findSkinRegions(
  imageData: ImageData,
  gridSize: number = 16
): SkinRegion[] {
  const { data, width, height } = imageData;
  const cols = Math.floor(width / gridSize);
  const rows = Math.floor(height / gridSize);
  const grid: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );

  // Build skin density grid
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      let skinPixels = 0;
      let total = 0;
      for (let py = 0; py < gridSize; py++) {
        for (let px = 0; px < gridSize; px++) {
          const ix = gx * gridSize + px;
          const iy = gy * gridSize + py;
          if (ix >= width || iy >= height) continue;
          const idx = (iy * width + ix) * 4;
          total++;
          if (isSkinTone(data[idx], data[idx + 1], data[idx + 2])) {
            skinPixels++;
          }
        }
      }
      grid[gy][gx] = total > 0 ? skinPixels / total : 0;
    }
  }

  // Flood-fill connected high-density cells
  const visited = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );
  const regions: SkinRegion[] = [];
  const THRESHOLD = 0.15; // Lower threshold to detect more faces

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      if (visited[gy][gx] || grid[gy][gx] < THRESHOLD) continue;
      // BFS
      const queue = [[gx, gy]];
      visited[gy][gx] = true;
      let minX = gx,
        maxX = gx,
        minY = gy,
        maxY = gy;
      let totalDensity = 0;
      let cellCount = 0;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        totalDensity += grid[cy][cx];
        cellCount++;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (
            nx >= 0 &&
            nx < cols &&
            ny >= 0 &&
            ny < rows &&
            !visited[ny][nx] &&
            grid[ny][nx] >= THRESHOLD
          ) {
            visited[ny][nx] = true;
            queue.push([nx, ny]);
          }
        }
      }

      const regionW = (maxX - minX + 1) * gridSize;
      const regionH = (maxY - minY + 1) * gridSize;
      const avgDensity = cellCount > 0 ? totalDensity / cellCount : 0;

      // Face-like aspect ratio check: more permissive
      const aspect = regionW / (regionH || 1);
      const minArea = width * height * 0.002; // at least 0.2% of frame (smaller faces)
      const area = regionW * regionH;

      if (
        area >= minArea &&
        aspect > 0.3 &&
        aspect < 2.5 &&
        avgDensity > 0.2
      ) {
        regions.push({
          x: minX * gridSize,
          y: minY * gridSize,
          w: regionW,
          h: regionH,
          density: avgDensity,
        });
      }
    }
  }

  // Sort by density descending, take top N
  regions.sort((a, b) => b.density - a.density);
  return regions;
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
 * Detect faces in an image using TensorFlow BlazeFace model
 */
export async function detectFaces(imageSrc: string): Promise<Face[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        // Load the BlazeFace model
        const model = await loadModel();
        
        // Run face detection
        console.log('[BlazeFace] Running face detection...');
        const predictions = await model.estimateFaces(img, false);
        console.log(`[BlazeFace] Detected ${predictions.length} faces`);
        
        if (predictions.length === 0) {
          resolve([]);
          return;
        }
        
        // Convert BlazeFace predictions to our Face format
        const cropCanvas = document.createElement("canvas");
        const faces: Face[] = predictions.map((prediction, i) => {
          // BlazeFace returns: topLeft, bottomRight, landmarks, probability
          const start = prediction.topLeft as [number, number];
          const end = prediction.bottomRight as [number, number];
          
          const bbox: BBox = {
            x: start[0],
            y: start[1],
            w: end[0] - start[0],
            h: end[1] - start[1],
          };
          
          const cropUrl = cropFace(cropCanvas, img, bbox);
          
          return {
            id: `face_${i}`,
            bbox,
            cropUrl,
            confidence: Array.isArray(prediction.probability) 
              ? prediction.probability[0] 
              : prediction.probability,
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
        console.error('[BlazeFace] Error detecting faces:', error);
        resolve([]);
      }
    };
    img.onerror = () => {
      console.error('[BlazeFace] Error loading image');
      resolve([]);
    };
    img.src = imageSrc;
  });
}

function mergeOverlapping(regions: SkinRegion[]): SkinRegion[] {
  if (regions.length <= 1) return regions;
  const merged: SkinRegion[] = [];
  const used = new Set<number>();

  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;
    let r = { ...regions[i] };
    for (let j = i + 1; j < regions.length; j++) {
      if (used.has(j)) continue;
      const other = regions[j];
      // Check overlap
      const ox = Math.max(r.x, other.x);
      const oy = Math.max(r.y, other.y);
      const ox2 = Math.min(r.x + r.w, other.x + other.w);
      const oy2 = Math.min(r.y + r.h, other.y + other.h);
      if (ox < ox2 && oy < oy2) {
        // Merge
        const nx = Math.min(r.x, other.x);
        const ny = Math.min(r.y, other.y);
        r = {
          x: nx,
          y: ny,
          w: Math.max(r.x + r.w, other.x + other.w) - nx,
          h: Math.max(r.y + r.h, other.y + other.h) - ny,
          density: Math.max(r.density, other.density),
        };
        used.add(j);
      }
    }
    merged.push(r);
  }
  return merged;
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
