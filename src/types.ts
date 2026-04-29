export type QualityLevel = "standard" | "hd" | "fhd" | "original";

export type QualityProfile = {
  label: string;
  description: string;
  previewMaxSize: number;
  exportMaxSize: number;
  exportScale: number;
  warning?: string;
};

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  standard: {
    label: "标准",
    description: "速度快，适合预览",
    previewMaxSize: 1200,
    exportMaxSize: 1600,
    exportScale: 1,
  },
  hd: {
    label: "高清",
    description: "清晰度更好",
    previewMaxSize: 1600,
    exportMaxSize: 2400,
    exportScale: 1.5,
  },
  fhd: {
    label: "超清",
    description: "适合下载保存",
    previewMaxSize: 2000,
    exportMaxSize: 3200,
    exportScale: 2,
    warning: "处理时间会更长。",
  },
  original: {
    label: "原图优先",
    description: "尽量保留原图细节，处理较慢",
    previewMaxSize: 2400,
    exportMaxSize: 4096,
    exportScale: 3,
    warning: "会优先保留原图细节，处理时间会更长。",
  },
};

export type LineArtOptions = {
  backgroundColor: string;
  lineColor: string;
  lineStrength: number;
  detailLevel: number;
  smoothing: number;
  invert: boolean;
  keepTransparentBackground: boolean;
  qualityLevel: QualityLevel;
  fastPreviewMode: boolean;
};

export type ProcessedImageSource = {
  canvas: HTMLCanvasElement;
  imageData: ImageData;
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  hasTransparency: boolean;
};
