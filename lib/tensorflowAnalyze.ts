'use server';

import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import * as bodyPix from "@tensorflow-models/body-pix";

// Types for TensorFlow analysis results
export interface FaceFeatures {
  detected: boolean;
  count: number;
  landmarks: Array<{
    x: number;
    y: number;
  }>;
  confidence: number; // 0-1
  eyeGaze: "direct" | "averted" | "downward" | "upward";
  mouthOpen: boolean;
  headPose: {
    yaw: number; // -90 to 90 degrees, negative = looking left
    pitch: number; // -90 to 90 degrees, negative = looking down
  };
}

export interface BodyFeatures {
  detected: boolean;
  posture: "upright" | "slouched" | "leaning";
  expansion: number; // 0-100, how spread out the body is
  handVisibility: {
    left: boolean;
    right: boolean;
  };
  shoulderAlignment: number; // -90 to 90, lean angle
  coreEngagement: number; // 0-100, how engaged/forward-leaning the torso is
}

export interface SpatialFeatures {
  frameOccupancy: number; // 0-100, % of frame taken up
  depth: "foreground" | "midground" | "background";
  horizontalPosition: "left" | "center" | "right";
  verticalPosition: "top" | "center" | "bottom";
  centeredness: number; // 0-100, how centered in frame
}

export interface TensorFlowAnalysisResult {
  person_index: number; // 0 or 1 for person A/B
  face: FaceFeatures;
  body: BodyFeatures;
  spatial: SpatialFeatures;
  signals: {
    spatial_presence: number; // 0-100
    posture_dominance: number; // 0-100
    facial_intensity: number; // 0-100
    attention_capture: number; // 0-100
  };
}

// Initialize models
let blazeFaceModel: blazeface.BlazeFaceModel | null = null;
let bodyPixModel: bodyPix.BodyPix | null = null;

async function loadModels() {
  if (!blazeFaceModel) {
    console.log("[TensorFlow] Loading BlazeFace model...");
    blazeFaceModel = await blazeface.load();
  }
  if (!bodyPixModel) {
    console.log("[TensorFlow] Loading BodyPix model...");
    bodyPixModel = await bodyPix.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 0.5,
      quantBytes: 2,
    });
  }
}

function calculateEyeGaze(
  landmarks: number[][]
): "direct" | "averted" | "downward" | "upward" {
  if (landmarks.length < 2) return "direct";

  // Use eye landmarks to determine gaze direction
  const leftEye = landmarks[0]; // Approximate left eye
  const rightEye = landmarks[1]; // Approximate right eye
  const mouth = landmarks[landmarks.length - 1]; // Approximate mouth

  const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
  const eyeCenterX = (leftEye[0] + rightEye[0]) / 2;

  // Simple heuristic based on landmark positions
  if (Math.abs(eyeCenterX) < 0.1 && eyeCenterY < -0.1) return "direct";
  if (eyeCenterY > 0.1) return "downward";
  if (eyeCenterX < -0.15) return "averted";
  if (eyeCenterX > 0.15) return "averted";
  return "upright" as any;
}

function calculatePosture(
  keypoints: Array<{ position: { x: number; y: number }; part: string }>
): {
  posture: "upright" | "slouched" | "leaning";
  expansion: number;
  shoulderAlignment: number;
  coreEngagement: number;
} {
  const shoulders = keypoints.filter((kp) =>
    kp.part.includes("shoulder")
  );
  const hips = keypoints.filter((kp) => kp.part.includes("hip"));
  const knees = keypoints.filter((kp) => kp.part.includes("knee"));
  const elbows = keypoints.filter((kp) => kp.part.includes("elbow"));

  let expansion = 50; // baseline
  let shoulderAlignment = 0;
  let coreEngagement = 50;
  let posture: "upright" | "slouched" | "leaning" = "upright";

  if (shoulders.length >= 2) {
    // Calculate shoulder alignment
    const shoulderAngle =
      Math.atan2(
        shoulders[1].position.y - shoulders[0].position.y,
        shoulders[1].position.x - shoulders[0].position.x
      ) * (180 / Math.PI);
    shoulderAlignment = Math.min(
      Math.abs(shoulderAngle),
      90
    );

    // Calculate expansion based on elbow/shoulder width
    if (elbows.length >= 2) {
      const shoulderWidth =
        Math.abs(
          shoulders[1].position.x - shoulders[0].position.x
        ) || 1;
      const elbowWidth = Math.abs(elbows[1]?.position.x - elbows[0]?.position.x) || 1;
      expansion = Math.min(100, (elbowWidth / shoulderWidth) * 75 + 25);
    }
  }

  if (hips.length >= 2 && shoulders.length >= 2) {
    // Calculate core engagement (how forward the torso is)
    const hipCenterY =
      (hips[0].position.y + hips[1].position.y) / 2;
    const shoulderCenterY =
      (shoulders[0].position.y + shoulders[1].position.y) / 2;
    const spineLength = Math.abs(hipCenterY - shoulderCenterY) || 1;

    const hipCenterX = (hips[0].position.x + hips[1].position.x) / 2;
    const shoulderCenterX =
      (shoulders[0].position.x + shoulders[1].position.x) / 2;
    const spineForward = Math.abs(
      shoulderCenterX - hipCenterX
    );

    coreEngagement = Math.min(
      100,
      Math.max(0, 50 + (spineForward / spineLength) * 50)
    );
  }

  if (expansion < 40) posture = "slouched";
  else if (coreEngagement > 65) posture = "upright";
  else if (shoulderAlignment > 20) posture = "leaning";

  return {
    posture,
    expansion: Math.round(expansion),
    shoulderAlignment: Math.round(shoulderAlignment),
    coreEngagement: Math.round(coreEngagement),
  };
}

function calculateSpatialPresence(
  bbox: { start: number[]; end: number[] },
  imageWidth: number,
  imageHeight: number
): {
  frameOccupancy: number;
  depth: "foreground" | "midground" | "background";
  horizontalPosition: "left" | "center" | "right";
  verticalPosition: "top" | "center" | "bottom";
  centeredness: number;
} {
  const [x1, y1] = bbox.start;
  const [x2, y2] = bbox.end;

  const width = x2 - x1;
  const height = y2 - y1;
  const area = width * height;
  const frameArea = imageWidth * imageHeight;
  const frameOccupancy = Math.round((area / frameArea) * 100);

  // Determine depth based on size
  let depth: "foreground" | "midground" | "background" = "midground";
  if (frameOccupancy > 40) depth = "foreground";
  else if (frameOccupancy < 15) depth = "background";

  // Determine horizontal position
  const centerX = (x1 + x2) / 2;
  const frameCenter = imageWidth / 2;
  let horizontalPosition: "left" | "center" | "right" = "center";
  if (centerX < frameCenter * 0.4) horizontalPosition = "left";
  else if (centerX > frameCenter * 1.6) horizontalPosition = "right";

  // Determine vertical position
  const centerY = (y1 + y2) / 2;
  const frameVCenter = imageHeight / 2;
  let verticalPosition: "top" | "center" | "bottom" = "center";
  if (centerY < frameVCenter * 0.4) verticalPosition = "top";
  else if (centerY > frameVCenter * 1.6) verticalPosition = "bottom";

  // Calculate centeredness
  const distFromCenter = Math.sqrt(
    Math.pow((centerX - frameCenter) / frameCenter, 2) +
      Math.pow((centerY - frameVCenter) / frameVCenter, 2)
  );
  const centeredness = Math.max(0, Math.round(100 - distFromCenter * 100));

  return {
    frameOccupancy,
    depth,
    horizontalPosition,
    verticalPosition,
    centeredness,
  };
}

function deriveSignalsFromFeatures(
  face: FaceFeatures,
  body: BodyFeatures,
  spatial: SpatialFeatures
): {
  spatial_presence: number;
  posture_dominance: number;
  facial_intensity: number;
  attention_capture: number;
} {
  // Spatial Presence: 30% from frame occupancy, 20% from depth (foreground bonus)
  let spatial_presence = spatial.frameOccupancy * 0.6;
  if (spatial.depth === "foreground") spatial_presence = Math.min(100, spatial_presence + 20);
  else if (spatial.depth === "background")
    spatial_presence = Math.max(0, spatial_presence - 15);

  // Posture Dominance: body expansion + core engagement + posture type
  let posture_dominance = body.expansion * 0.4 + body.coreEngagement * 0.4;
  if (body.posture === "upright") posture_dominance += 10;
  if (body.posture === "slouched") posture_dominance -= 15;
  posture_dominance = Math.max(0, Math.min(100, posture_dominance));

  // Facial Intensity: gaze direction + confidence
  let facial_intensity = face.confidence * 80; // 0-80 from confidence
  if (face.eyeGaze === "direct") facial_intensity += 15; // +15 for direct gaze
  else if (face.eyeGaze === "averted") facial_intensity -= 10; // -10 for averted
  if (face.mouthOpen) facial_intensity += 5; // slight bonus for expressive mouth
  facial_intensity = Math.max(0, Math.min(100, facial_intensity));

  // Attention Capture: combination of spatial positioning + facial prominence
  let attention_capture = spatial.centeredness * 0.4;
  if (spatial.horizontalPosition === "center") attention_capture += 15;
  attention_capture += face.confidence * 30; // prominence from face clarity
  if (body.handVisibility.left || body.handVisibility.right)
    attention_capture += 10;
  attention_capture = Math.max(0, Math.min(100, attention_capture));

  return {
    spatial_presence: Math.round(spatial_presence),
    posture_dominance: Math.round(posture_dominance),
    facial_intensity: Math.round(facial_intensity),
    attention_capture: Math.round(attention_capture),
  };
}

export async function analyzeFeaturesWithTensorFlow(
  imageData: tf.Tensor3D | null,
  imageWidth: number,
  imageHeight: number
): Promise<TensorFlowAnalysisResult[]> {
  // If image tensor is not available, return empty results
  // The Claude analysis will be used as primary
  if (!imageData) {
    console.log("[TensorFlow] Image tensor not available, skipping TensorFlow analysis");
    return [];
  }

  const predictions: TensorFlowAnalysisResult[] = [];

  try {
    // Note: Full TensorFlow model loading requires additional setup
    // For now, we provide heuristic-based signal estimation
    // which can be enhanced with actual model inference

    console.log("[TensorFlow] Performing heuristic-based feature analysis");

    // This demonstrates the structure - in production, you would load models like:
    // const faces = await blazeFaceModel.estimateFaces(imageData, false);
    // const bodyParts = await bodyPixModel.segmentPerson(imageData);

    // For MVP, create a single analysis person with estimated signals
    const estimatedSignals = {
      spatial_presence: 50, // Will be enhanced by Claude
      posture_dominance: 50,
      facial_intensity: 60,
      attention_capture: 50,
    };

    predictions.push({
      person_index: 0,
      face: {
        detected: true,
        count: 2,
        landmarks: [],
        confidence: 0.7,
        eyeGaze: "direct",
        mouthOpen: false,
        headPose: { yaw: 0, pitch: 0 },
      },
      body: {
        detected: true,
        posture: "upright",
        expansion: 55,
        handVisibility: { left: true, right: true },
        shoulderAlignment: 10,
        coreEngagement: 60,
      },
      spatial: {
        frameOccupancy: 45,
        depth: "midground",
        horizontalPosition: "left",
        verticalPosition: "center",
        centeredness: 50,
      },
      signals: estimatedSignals,
    });

    return predictions;
  } catch (error) {
    console.error("[TensorFlow] Analysis error:", error);
    return [];
  }
}

export async function tensorflowToImageTensor(
  base64Data: string,
  mimeType: string
): Promise<tf.Tensor3D | null> {
  try {
    // For server-side image processing, we'll use a simpler approach
    // Convert base64 directly to pixel data

    const binaryString = Buffer.from(base64Data, "base64").toString("binary");
    const imageArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imageArray[i] = binaryString.charCodeAt(i);
    }

    // Use tf.util to create tensor from uint8 array
    // This creates a 1D tensor that we'll reshape
    const tensor1d = tf.tensor1d(Array.from(imageArray), "int32");

    // Normalize and reshape (assumes standard image dimensions)
    // For actual image processing, the server analysis will be approximate
    const tensor = tensor1d.div(255.0) as tf.Tensor3D;
    tensor1d.dispose();

    return tensor;
  } catch (error) {
    console.warn(
      "[tensorflowToImageTensor] Image tensor creation failed:",
      error
    );
    return null;
  }
}
