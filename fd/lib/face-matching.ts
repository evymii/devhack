/**
 * face-matching.ts
 * Production-grade face detection & matching logic using face-api.js.
 *
 * Key improvements:
 *  - Full-face boundary validation (warns when face is partially out of frame)
 *  - Mirror-corrected canvas capture (camera CSS is -scale-x-100, canvas corrects back)
 *  - Promise.all parallel descriptor hydration for speed
 *  - Tunable strict threshold (0.40–0.45)
 *  - 68-landmark detection via withFaceLandmarks()
 *  - Typed errors for graceful UI feedback
 */

"use client";

import * as faceapi from "face-api.js";
import type { Ticket } from "@/lib/tickets";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Euclidean distance threshold. Lower = stricter. */
export const FACE_MATCH_THRESHOLD = 0.42;
export const FACE_MATCH_THRESHOLD_MIN = 0.4;
export const FACE_MATCH_THRESHOLD_MAX = 0.45;

/**
 * How much of the face bounding box must be inside the frame (0–1).
 * 0.92 = face may be up to 8% outside before we warn the user.
 */
const FACE_FRAME_MARGIN = 0.92;
const MIN_FACE_SIZE_PX = 200;

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchConfidence = "high" | "medium" | "low";

export type TicketDescriptor = {
  ticket: Ticket;
  descriptor: Float32Array;
};

export type MatchResult = {
  ticket: Ticket;
  distance: number;
  confidence: MatchConfidence;
};

export type FaceDescriptorResult = {
  descriptor: Float32Array;
  faceCount: number;
  usedLargestFace: boolean;
};

/** Reason why face detection failed. */
export type FaceDetectionFailure =
  | "no-face"          // No face detected at all
  | "partial-face"     // Face detected but clipped by frame edge
  | "outside-focus-area"
  | "face-too-small";

export type FaceDetectionError = {
  reason: FaceDetectionFailure;
  message: string;
};

type WeightManifest = { paths?: string[] };

// ─── Detector options ─────────────────────────────────────────────────────────

/**
 * TinyFaceDetector options — fast, good enough for live camera.
 * inputSize 416 gives better accuracy than 320 for partial faces.
 */
function toTinyFaceOptions(): faceapi.TinyFaceDetectorOptions {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.42,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickConfidence(distance: number): MatchConfidence {
  if (distance < 0.38) return "high";
  if (distance < 0.50) return "medium";
  return "low";
}

/**
 * Checks whether the detected face's bounding box is fully (within margin)
 * inside the input dimensions.
 */
function isFaceFullyInFrame(
  box: faceapi.Box,
  inputWidth: number,
  inputHeight: number,
): boolean {
  const { x, y, width, height } = box;
  const right = x + width;
  const bottom = y + height;

  // Allow a small tolerance so faces near the edge still pass
  const tolerance = 1 - FACE_FRAME_MARGIN;
  const minX = -inputWidth * tolerance;
  const minY = -inputHeight * tolerance;
  const maxX = inputWidth * (1 + tolerance);
  const maxY = inputHeight * (1 + tolerance);

  return x >= minX && y >= minY && right <= maxX && bottom <= maxY;
}

function isInsideFocusArea(
  box: faceapi.Box,
  frameWidth: number,
  frameHeight: number,
): boolean {
  const focus = {
    xMin: frameWidth * 0.24,
    xMax: frameWidth * 0.76,
    yMin: frameHeight * 0.12,
    yMax: frameHeight * 0.88,
  };
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  return (
    centerX >= focus.xMin &&
    centerX <= focus.xMax &&
    centerY >= focus.yMin &&
    centerY <= focus.yMax
  );
}

function isFaceLargeEnough(box: faceapi.Box): boolean {
  return box.width >= MIN_FACE_SIZE_PX && box.height >= MIN_FACE_SIZE_PX;
}

// ─── Model loading ────────────────────────────────────────────────────────────

/**
 * Validates all manifest + shard files exist before loading weights.
 * Uses Promise.all for parallel manifest checks.
 */
export async function loadModels(): Promise<void> {
  const modelUrl = "/models";
  const manifestFiles = [
    "tiny_face_detector_model-weights_manifest.json",
    "face_landmark_68_model-weights_manifest.json",
    "face_recognition_model-weights_manifest.json",
  ];

  // Validate all manifests in parallel
  await Promise.all(
    manifestFiles.map(async (manifestFile) => {
      const manifestResponse = await fetch(`${modelUrl}/${manifestFile}`, {
        cache: "force-cache",
      });
      if (!manifestResponse.ok) {
        throw new Error(`Model manifest файл олдсонгүй: ${manifestFile}`);
      }

      const manifest = (await manifestResponse.json()) as WeightManifest[];
      const shardPaths = manifest.flatMap((item) => item.paths ?? []);

      // Validate all shards in parallel
      await Promise.all(
        shardPaths.map(async (shardPath) => {
          const shardResponse = await fetch(`${modelUrl}/${shardPath}`, {
            method: "HEAD",
            cache: "force-cache",
          });
          if (!shardResponse.ok) {
            throw new Error(`Model weight файл олдсонгүй: ${shardPath}`);
          }
        }),
      );
    }),
  );

  // Load all 3 model weights in parallel
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
  ]);
}

// ─── Descriptor computation ───────────────────────────────────────────────────

/**
 * Detects face(s) from a live video element.
 * Returns null if no face found.
 * Returns a FaceDetectionError object (via thrown Error) when face is partial.
 *
 * NOTE: The video element has CSS -scale-x-100 (mirror). We draw the video
 * onto a hidden canvas with a horizontal flip to get the corrected (non-mirrored)
 * pixels before running detection. This ensures landmark coordinates are correct.
 */
export async function computeDescriptorFromVideo(
  video: HTMLVideoElement,
): Promise<FaceDescriptorResult | null> {
  // Create an off-screen canvas with mirror-corrected pixels
  const { width, height } = { width: video.videoWidth, height: video.videoHeight };
  if (!width || !height) return null;

  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  // Mirror-correct: flip horizontally so that CSS -scale-x-100 is undone
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset

  const detection = await faceapi
    .detectSingleFace(offscreen, toTinyFaceOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  // Full-face boundary check using 68-landmark extreme points
  const landmarks = detection.landmarks;
  const positions = landmarks.positions;
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const landmarkBox = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };

  if (!isFaceFullyInFrame(landmarkBox as faceapi.Box, width, height)) {
    // Throw a typed error that the page can catch and display
    const err = new Error("partial-face") as Error & { code: FaceDetectionFailure };
    err.code = "partial-face";
    throw err;
  }

  if (!isFaceLargeEnough(landmarkBox as faceapi.Box)) {
    const err = new Error("face-too-small") as Error & { code: FaceDetectionFailure };
    err.code = "face-too-small";
    throw err;
  }

  if (!isInsideFocusArea(landmarkBox as faceapi.Box, width, height)) {
    const err = new Error("outside-focus-area") as Error & { code: FaceDetectionFailure };
    err.code = "outside-focus-area";
    throw err;
  }

  return {
    descriptor: detection.descriptor,
    faceCount: 1,
    usedLargestFace: false,
  };
}

export async function isFaceInsideFocusAreaFromVideo(
  video: HTMLVideoElement,
): Promise<boolean | null> {
  const detection = await faceapi.detectSingleFace(video, toTinyFaceOptions());
  if (!detection) return null;
  return isInsideFocusArea(detection.box, video.videoWidth, video.videoHeight);
}

/**
 * Computes a face descriptor from a stored image (base64 data-url or URL).
 * Used for hydrating ticket descriptors.
 * Uses detectSingleFace + withFaceLandmarks + withFaceDescriptor (68 points).
 */
export async function computeDescriptorFromImage(
  imageSource: string,
): Promise<Float32Array | null> {
  try {
    const image = await faceapi.fetchImage(imageSource);
    const detection = await faceapi
      .detectSingleFace(image, toTinyFaceOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection?.descriptor ?? null;
  } catch {
    return null;
  }
}

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Finds the best matching ticket for a live face descriptor.
 * Returns null if no candidate is within FACE_MATCH_THRESHOLD.
 */
export function findBestMatch(
  liveDescriptor: Float32Array,
  candidates: TicketDescriptor[],
  threshold: number = FACE_MATCH_THRESHOLD,
): MatchResult | null {
  const safeThreshold = Math.min(
    FACE_MATCH_THRESHOLD_MAX,
    Math.max(FACE_MATCH_THRESHOLD_MIN, threshold),
  );
  let best: MatchResult | null = null;

  for (const candidate of candidates) {
    const distance = faceapi.euclideanDistance(
      liveDescriptor,
      candidate.descriptor,
    );

    if (!best || distance < best.distance) {
      best = {
        ticket: candidate.ticket,
        distance,
        confidence: pickConfidence(distance),
      };
    }
  }

  if (!best || best.distance >= safeThreshold) {
    return null;
  }

  return best;
}

/**
 * Hydrates a list of valid tickets with face descriptors in parallel.
 * Invalid tickets (no face in photo) are silently skipped.
 */
export async function hydrateDescriptors(
  tickets: Ticket[],
): Promise<TicketDescriptor[]> {
  const validTickets = tickets.filter((t) => t.status === "valid");

  const results = await Promise.all(
    validTickets.map(async (ticket): Promise<TicketDescriptor | null> => {
      try {
        const descriptor = await computeDescriptorFromImage(
          ticket.biometric.snapshot,
        );
        if (!descriptor) return null;
        return { ticket, descriptor };
      } catch {
        return null;
      }
    }),
  );

  return results.filter((r): r is TicketDescriptor => r !== null);
}
