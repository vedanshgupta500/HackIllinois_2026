"use client";

import * as bodyPix from "@tensorflow-models/body-pix";
import type { PersonSignals } from "@/types/analysis";

export interface BodyScanResult {
  personIndex: number; // left-to-right order
  signals: PersonSignals;
  composite_score: number;
}

let model: bodyPix.BodyPix | null = null;

async function loadModel(): Promise<bodyPix.BodyPix> {
  if (!model) {
    model = await bodyPix.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 0.5,  // fastest/smallest
      quantBytes: 2,
    });
  }
  return model;
}

type Keypoint = { part: string; position: { x: number; y: number }; score: number };

function kp(keypoints: Keypoint[], part: string): Keypoint | undefined {
  return keypoints.find((k) => k.part === part);
}

function computeSignals(pose: { keypoints: Keypoint[] }, imgW: number, imgH: number): PersonSignals {
  const kps = pose.keypoints;
  const visible = kps.filter((k) => k.score > 0.25);

  // ── Spatial Presence ──
  // Body bounding box as % of frame — expand 40% to cover clothing/hair outside keypoints
  let spatial_presence = 35;
  if (visible.length > 0) {
    const xs = visible.map((k) => k.position.x);
    const ys = visible.map((k) => k.position.y);
    const bw = (Math.max(...xs) - Math.min(...xs)) * 1.4;
    const bh = (Math.max(...ys) - Math.min(...ys)) * 1.4;
    const occupancy = ((bw * bh) / (imgW * imgH)) * 100;
    spatial_presence = Math.min(95, Math.max(20, occupancy * 1.5 + 15));
  }

  // ── Posture Dominance ──
  // Combines: arm expansion, spine straightness, shoulder levelness
  const lS = kp(kps, "leftShoulder");
  const rS = kp(kps, "rightShoulder");
  const lH = kp(kps, "leftHip");
  const rH = kp(kps, "rightHip");
  const lE = kp(kps, "leftElbow");
  const rE = kp(kps, "rightElbow");

  let posture_dominance = 45;
  if (lS && rS && lS.score > 0.3 && rS.score > 0.3) {
    const shoulderW = Math.abs(rS.position.x - lS.position.x) || 1;

    // Arm expansion: wide elbows = expansive/dominant
    let expansionScore = 50;
    if (lE && rE && lE.score > 0.25 && rE.score > 0.25) {
      const elbowW = Math.abs(rE.position.x - lE.position.x);
      expansionScore = Math.min(100, (elbowW / shoulderW) * 65 + 15);
    }

    // Spine straightness: shoulder center directly above hip center
    let spineScore = 60;
    if (lH && rH && lH.score > 0.25 && rH.score > 0.25) {
      const sCX = (lS.position.x + rS.position.x) / 2;
      const hCX = (lH.position.x + rH.position.x) / 2;
      const sCY = (lS.position.y + rS.position.y) / 2;
      const hCY = (lH.position.y + rH.position.y) / 2;
      const spineLen = Math.abs(sCY - hCY) || 1;
      const lateralLean = Math.abs(sCX - hCX) / spineLen;
      spineScore = Math.max(15, 85 - lateralLean * 70);
    }

    // Level shoulders = confident
    const tilt = Math.abs(lS.position.y - rS.position.y) / shoulderW;
    const levelScore = Math.max(20, 85 - tilt * 80);

    posture_dominance = Math.min(
      95,
      expansionScore * 0.35 + spineScore * 0.40 + levelScore * 0.25
    );
  }

  // ── Facial Intensity ──
  // How confidently the face is detected (camera-facing = high confidence)
  const nose = kp(kps, "nose");
  const lEye = kp(kps, "leftEye");
  const rEye = kp(kps, "rightEye");
  const faceScores = [nose, lEye, rEye]
    .filter(Boolean)
    .map((k) => k!.score);
  const avgFaceConf =
    faceScores.length > 0
      ? faceScores.reduce((a, b) => a + b, 0) / faceScores.length
      : 0.4;
  let facial_intensity = Math.min(90, avgFaceConf * 75 + 20);
  // Bonus if both eyes clearly visible → facing camera
  if (lEye && rEye && lEye.score > 0.4 && rEye.score > 0.4) {
    facial_intensity = Math.min(95, facial_intensity + 10);
  }

  // ── Attention Capture ──
  // Centeredness + size + face prominence
  let attention_capture = 40;
  if (visible.length > 0) {
    const xs = visible.map((k) => k.position.x);
    const ys = visible.map((k) => k.position.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const dx = Math.abs(cx / imgW - 0.5) * 2;
    const dy = Math.abs(cy / imgH - 0.5) * 2;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2;
    const centeredness = Math.max(0, 100 - distFromCenter * 90);
    attention_capture = Math.min(
      90,
      centeredness * 0.45 + facial_intensity * 0.30 + spatial_presence * 0.25
    );
  }

  return {
    spatial_presence: Math.round(spatial_presence),
    posture_dominance: Math.round(posture_dominance),
    facial_intensity: Math.round(facial_intensity),
    attention_capture: Math.round(attention_capture),
  };
}

/**
 * Run BodyPix multi-person segmentation on the image.
 * Returns one result per detected person, sorted left-to-right.
 */
export async function scanBodies(imageSrc: string): Promise<BodyScanResult[]> {
  const net = await loadModel();

  const img = new Image();
  img.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    if (img.complete) { resolve(); return; }
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const segments = await net.segmentMultiPerson(img, {
    flipHorizontal: false,
    maxDetections: 6,
    scoreThreshold: 0.3,
    nmsRadius: 20,
    minKeypointScore: 0.25,
    refineSteps: 10,
  });

  if (!segments || segments.length === 0) return [];

  // Sort detected people left-to-right by left shoulder (or first keypoint)
  const sorted = segments
    .filter((seg) => seg.pose?.keypoints?.length > 0)
    .sort((a, b) => {
      const ax =
        a.pose.keypoints.find((k) => k.part === "leftShoulder")?.position.x ??
        a.pose.keypoints[0]?.position.x ?? 0;
      const bx =
        b.pose.keypoints.find((k) => k.part === "leftShoulder")?.position.x ??
        b.pose.keypoints[0]?.position.x ?? 0;
      return ax - bx;
    });

  return sorted.map((seg, idx) => {
    const signals = computeSignals(seg.pose, img.width, img.height);
    const composite_score =
      Math.round(
        (signals.spatial_presence * 0.3 +
          signals.posture_dominance * 0.25 +
          signals.facial_intensity * 0.25 +
          signals.attention_capture * 0.2) *
          10
      ) / 10;

    return { personIndex: idx, signals, composite_score };
  });
}
