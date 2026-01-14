export type BackgroundType = "blur" | "mirror" | "color";

export type CanvasMode = "preset" | "original" | "custom";

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
}

export interface TextElementDragState {
  isDragging: boolean;
  elementId: string | null;
  trackId: string | null;
  startX: number;
  startY: number;
  initialElementX: number;
  initialElementY: number;
  currentX: number;
  currentY: number;
  elementWidth: number;
  elementHeight: number;
}

export type MediaTransformMode = "move" | "scale";
export type ScaleHandle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface MediaTransformState {
  isTransforming: boolean;
  mode: MediaTransformMode | null;
  scaleHandle: ScaleHandle | null;
  elementId: string | null;
  trackId: string | null;
  startX: number;
  startY: number;
  initialScale: number;
  initialOffsetX: number;
  initialOffsetY: number;
  // For scale: element center position and initial distance from handle to center
  elementCenterX: number;
  elementCenterY: number;
  initialDistance: number;
}

export type TextTransformMode = "move" | "resize-width" | "resize-scale";

export interface TextTransformState {
  isTransforming: boolean;
  mode: TextTransformMode | null;
  resizeHandle: ScaleHandle | null;
  elementId: string | null;
  trackId: string | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialScale: number;
  elementCenterX: number;
  elementCenterY: number;
  initialDistance: number;
}
