import type { TimelineTrack, MediaElement } from "@/types/timeline";
import type { MediaFile } from "@/types/media";
import type { BlurIntensity } from "@/types/project";
import { videoCache } from "./video-cache";
import { drawCssBackground } from "./canvas-gradients";

// Helper to calculate draw dimensions with element transform
function calculateMediaDrawParams({
  mediaW,
  mediaH,
  canvasWidth,
  canvasHeight,
  element,
  scaleX,
  scaleY,
}: {
  mediaW: number;
  mediaH: number;
  canvasWidth: number;
  canvasHeight: number;
  element: MediaElement;
  scaleX: number;
  scaleY: number;
}): { drawX: number; drawY: number; drawW: number; drawH: number } {
  const containScale = Math.min(canvasWidth / mediaW, canvasHeight / mediaH);
  const elementScale = element.scale ?? 1;
  const finalScale = containScale * elementScale;

  const drawW = mediaW * finalScale;
  const drawH = mediaH * finalScale;

  // Center position + user offset (scaled to canvas)
  const offsetX = (element.offsetX ?? 0) * scaleX;
  const offsetY = (element.offsetY ?? 0) * scaleY;
  const drawX = (canvasWidth - drawW) / 2 + offsetX;
  const drawY = (canvasHeight - drawH) / 2 + offsetY;

  return { drawX, drawY, drawW, drawH };
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  time: number;
  canvasWidth: number;
  canvasHeight: number;
  tracks: TimelineTrack[];
  mediaFiles: MediaFile[];
  backgroundColor?: string;
  backgroundType?: "color" | "blur";
  blurIntensity?: BlurIntensity;
  projectCanvasSize?: { width: number; height: number };
}

const imageElementCache = new Map<string, HTMLImageElement>();

async function getImageElement(
  mediaItem: MediaFile
): Promise<HTMLImageElement> {
  const cacheKey = mediaItem.id;
  const cached = imageElementCache.get(cacheKey);
  if (cached) return cached;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = mediaItem.url || URL.createObjectURL(mediaItem.file);
  });
  imageElementCache.set(cacheKey, img);
  return img;
}

// Render a single element (shared logic)
async function renderSingleElement({
  ctx,
  time,
  canvasWidth,
  canvasHeight,
  element,
  mediaItem,
  scaleX,
  scaleY,
}: {
  ctx: CanvasRenderingContext2D;
  time: number;
  canvasWidth: number;
  canvasHeight: number;
  element: TimelineTrack["elements"][number];
  mediaItem: MediaFile | null;
  scaleX: number;
  scaleY: number;
}): Promise<void> {
  if (element.type === "media" && mediaItem) {
    if (mediaItem.type === "video") {
      try {
        const localTime = time - element.startTime + element.trimStart;
        const frame = await videoCache.getFrameAt(
          mediaItem.id,
          mediaItem.file,
          localTime
        );
        if (!frame) return;

        const mediaW = Math.max(1, mediaItem.width || canvasWidth);
        const mediaH = Math.max(1, mediaItem.height || canvasHeight);
        const { drawX, drawY, drawW, drawH } = calculateMediaDrawParams({
          mediaW,
          mediaH,
          canvasWidth,
          canvasHeight,
          element,
          scaleX,
          scaleY,
        });
        ctx.drawImage(frame.canvas, drawX, drawY, drawW, drawH);
      } catch (error) {
        console.warn(
          `Failed to render video frame for ${mediaItem.name}:`,
          error
        );
      }
    }
    if (mediaItem.type === "image") {
      const img = await getImageElement(mediaItem);
      const mediaW = Math.max(
        1,
        mediaItem.width || img.naturalWidth || canvasWidth
      );
      const mediaH = Math.max(
        1,
        mediaItem.height || img.naturalHeight || canvasHeight
      );
      const { drawX, drawY, drawW, drawH } = calculateMediaDrawParams({
        mediaW,
        mediaH,
        canvasWidth,
        canvasHeight,
        element,
        scaleX,
        scaleY,
      });
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  }
  if (element.type === "text") {
    const text = element;
    const posX = canvasWidth / 2 + text.x * scaleX;
    const posY = canvasHeight / 2 + text.y * scaleY;
    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate((text.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, Math.min(1, text.opacity));
    const px = text.fontSize * scaleX;
    const weight = text.fontWeight === "bold" ? "bold " : "";
    const style = text.fontStyle === "italic" ? "italic " : "";
    ctx.font = `${style}${weight}${px}px ${text.fontFamily}`;
    ctx.fillStyle = text.color;
    ctx.textAlign = text.textAlign as CanvasTextAlign;
    ctx.textBaseline = "middle";
    const metrics = ctx.measureText(text.content);
    const hasBoxMetrics =
      "actualBoundingBoxAscent" in metrics &&
      "actualBoundingBoxDescent" in metrics;
    const ascent = hasBoxMetrics
      ? (
          metrics as TextMetrics & {
            actualBoundingBoxAscent: number;
            actualBoundingBoxDescent: number;
          }
        ).actualBoundingBoxAscent
      : px * 0.8;
    const descent = hasBoxMetrics
      ? (
          metrics as TextMetrics & {
            actualBoundingBoxAscent: number;
            actualBoundingBoxDescent: number;
          }
        ).actualBoundingBoxDescent
      : px * 0.2;
    const textW = metrics.width;
    const textH = ascent + descent;
    const padX = 8 * scaleX;
    const padY = 4 * scaleX;
    if (text.backgroundColor) {
      ctx.save();
      ctx.fillStyle = text.backgroundColor;
      let bgLeft = -textW / 2;
      if (ctx.textAlign === "left") bgLeft = 0;
      if (ctx.textAlign === "right") bgLeft = -textW;
      ctx.fillRect(
        bgLeft - padX,
        -textH / 2 - padY,
        textW + padX * 2,
        textH + padY * 2
      );
      ctx.restore();
    }
    ctx.fillText(text.content, 0, 0);
    ctx.restore();
  }
}

export interface RenderTrackContext {
  ctx: CanvasRenderingContext2D;
  time: number;
  canvasWidth: number;
  canvasHeight: number;
  track: TimelineTrack;
  mediaFiles: MediaFile[];
  projectCanvasSize?: { width: number; height: number };
}

// Render a single track to a canvas layer
export async function renderTrackFrame({
  ctx,
  time,
  canvasWidth,
  canvasHeight,
  track,
  mediaFiles,
  projectCanvasSize,
}: RenderTrackContext): Promise<void> {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const scaleX = projectCanvasSize ? canvasWidth / projectCanvasSize.width : 1;
  const scaleY = projectCanvasSize
    ? canvasHeight / projectCanvasSize.height
    : 1;
  const idToMedia = new Map(mediaFiles.map((m) => [m.id, m] as const));

  for (const element of track.elements) {
    if (element.hidden) continue;
    const elementStart = element.startTime;
    const elementEnd =
      element.startTime +
      (element.duration - element.trimStart - element.trimEnd);
    if (time >= elementStart && time < elementEnd) {
      let mediaItem: MediaFile | null = null;
      if (element.type === "media") {
        mediaItem =
          element.mediaId === "test"
            ? null
            : idToMedia.get(element.mediaId) || null;
      }
      await renderSingleElement({
        ctx,
        time,
        canvasWidth,
        canvasHeight,
        element,
        mediaItem,
        scaleX,
        scaleY,
      });
    }
  }
}

export interface RenderBackgroundContext {
  ctx: CanvasRenderingContext2D;
  time: number;
  canvasWidth: number;
  canvasHeight: number;
  tracks: TimelineTrack[];
  mediaFiles: MediaFile[];
  backgroundColor?: string;
  backgroundType?: "color" | "blur";
  blurIntensity?: BlurIntensity;
}

// Render background layer only
export async function renderBackgroundFrame({
  ctx,
  time,
  canvasWidth,
  canvasHeight,
  tracks,
  mediaFiles,
  backgroundColor,
  backgroundType,
  blurIntensity,
}: RenderBackgroundContext): Promise<void> {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (
    backgroundColor &&
    backgroundColor !== "transparent" &&
    !backgroundColor.includes("gradient")
  ) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (backgroundColor && backgroundColor.includes("gradient")) {
    drawCssBackground(ctx, canvasWidth, canvasHeight, backgroundColor);
  }

  if (backgroundType === "blur") {
    const blurPx = Math.max(0, blurIntensity ?? 8);
    const idToMedia = new Map(mediaFiles.map((m) => [m.id, m] as const));

    // Find active media element for blur background
    let bgCandidate: { element: MediaElement; mediaItem: MediaFile } | null =
      null;
    for (let t = tracks.length - 1; t >= 0; t -= 1) {
      const track = tracks[t];
      for (const element of track.elements) {
        if (element.hidden || element.type !== "media") continue;
        const elementStart = element.startTime;
        const elementEnd =
          element.startTime +
          (element.duration - element.trimStart - element.trimEnd);
        if (time >= elementStart && time < elementEnd) {
          const mediaItem =
            element.mediaId === "test"
              ? null
              : idToMedia.get(element.mediaId) || null;
          if (
            mediaItem &&
            (mediaItem.type === "video" || mediaItem.type === "image")
          ) {
            bgCandidate = { element, mediaItem };
            break;
          }
        }
      }
      if (bgCandidate) break;
    }

    if (bgCandidate) {
      const { element, mediaItem } = bgCandidate;
      try {
        if (mediaItem.type === "video") {
          const localTime = time - element.startTime + element.trimStart;
          const frame = await videoCache.getFrameAt(
            mediaItem.id,
            mediaItem.file,
            Math.max(0, localTime)
          );
          if (frame) {
            const mediaW = Math.max(1, mediaItem.width || canvasWidth);
            const mediaH = Math.max(1, mediaItem.height || canvasHeight);
            const coverScale = Math.max(
              canvasWidth / mediaW,
              canvasHeight / mediaH
            );
            const drawW = mediaW * coverScale;
            const drawH = mediaH * coverScale;
            const drawX = (canvasWidth - drawW) / 2;
            const drawY = (canvasHeight - drawH) / 2;
            ctx.save();
            ctx.filter = `blur(${blurPx}px)`;
            ctx.drawImage(frame.canvas, drawX, drawY, drawW, drawH);
            ctx.restore();
          }
        } else if (mediaItem.type === "image") {
          const img = await getImageElement(mediaItem);
          const mediaW = Math.max(
            1,
            mediaItem.width || img.naturalWidth || canvasWidth
          );
          const mediaH = Math.max(
            1,
            mediaItem.height || img.naturalHeight || canvasHeight
          );
          const coverScale = Math.max(
            canvasWidth / mediaW,
            canvasHeight / mediaH
          );
          const drawW = mediaW * coverScale;
          const drawH = mediaH * coverScale;
          const drawX = (canvasWidth - drawW) / 2;
          const drawY = (canvasHeight - drawH) / 2;
          ctx.save();
          ctx.filter = `blur(${blurPx}px)`;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();
        }
      } catch {
        // Ignore background blur failures
      }
    }
  }
}

export async function renderTimelineFrame({
  ctx,
  time,
  canvasWidth,
  canvasHeight,
  tracks,
  mediaFiles,
  backgroundColor,
  backgroundType,
  blurIntensity,
  projectCanvasSize,
}: RenderContext): Promise<void> {
  // Render background
  await renderBackgroundFrame({
    ctx,
    time,
    canvasWidth,
    canvasHeight,
    tracks,
    mediaFiles,
    backgroundColor,
    backgroundType,
    blurIntensity,
  });

  const scaleX = projectCanvasSize ? canvasWidth / projectCanvasSize.width : 1;
  const scaleY = projectCanvasSize
    ? canvasHeight / projectCanvasSize.height
    : 1;
  const idToMedia = new Map(mediaFiles.map((m) => [m.id, m] as const));

  // Render tracks from bottom to top
  for (let t = tracks.length - 1; t >= 0; t -= 1) {
    const track = tracks[t];
    for (const element of track.elements) {
      if (element.hidden) continue;
      const elementStart = element.startTime;
      const elementEnd =
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd);
      if (time >= elementStart && time < elementEnd) {
        let mediaItem: MediaFile | null = null;
        if (element.type === "media") {
          mediaItem =
            element.mediaId === "test"
              ? null
              : idToMedia.get(element.mediaId) || null;
        }
        await renderSingleElement({
          ctx,
          time,
          canvasWidth,
          canvasHeight,
          element,
          mediaItem,
          scaleX,
          scaleY,
        });
      }
    }
  }
}
