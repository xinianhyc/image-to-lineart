import type { LineArtOptions, ProcessedImageSource } from "../types";

type ResizedDimensions = {
  width: number;
  height: number;
};

type EdgePixelResult = {
  mask: Uint8ClampedArray;
  alphaMask: Uint8ClampedArray;
};

type RenderOptions = Pick<
  LineArtOptions,
  "backgroundColor" | "lineColor" | "invert" | "keepTransparentBackground"
> & {
  originalAlphaMask?: Uint8ClampedArray;
};

export async function loadImageToCanvas(
  file: File,
  maxSize = 1600,
  pixelRatio = 1,
): Promise<ProcessedImageSource> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("图片加载失败，请重试。"));
      nextImage.src = imageUrl;
    });

    const displayDimensions = resizeImageIfNeeded(image, maxSize);
    const width = Math.min(
      image.naturalWidth,
      Math.max(1, Math.round(displayDimensions.width * pixelRatio)),
    );
    const height = Math.min(
      image.naturalHeight,
      Math.max(1, Math.round(displayDimensions.height * pixelRatio)),
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("当前浏览器不支持 Canvas 2D。");
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const hasTransparency = imageData.data.some(
      (_, index) => index % 4 === 3 && imageData.data[index] < 255,
    );

    return {
      canvas,
      imageData,
      width,
      height,
      displayWidth: displayDimensions.width,
      displayHeight: displayDimensions.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      hasTransparency,
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function resizeImageIfNeeded(
  image: HTMLImageElement,
  maxSize = 1600,
): ResizedDimensions {
  const { naturalWidth, naturalHeight } = image;
  const maxDimension = Math.max(naturalWidth, naturalHeight);

  if (maxDimension <= maxSize) {
    return {
      width: naturalWidth,
      height: naturalHeight,
    };
  }

  const scale = maxSize / maxDimension;
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

export function toGrayscale(imageData: ImageData): Uint8ClampedArray {
  const source = imageData.data;
  const grayData = new Uint8ClampedArray(imageData.width * imageData.height);

  for (let pixelIndex = 0, grayIndex = 0; pixelIndex < source.length; pixelIndex += 4, grayIndex += 1) {
    const r = source[pixelIndex];
    const g = source[pixelIndex + 1];
    const b = source[pixelIndex + 2];
    grayData[grayIndex] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return grayData;
}

export function boxBlur(
  grayData: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray {
  if (radius <= 0) {
    return new Uint8ClampedArray(grayData);
  }

  const output = new Uint8ClampedArray(grayData.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let total = 0;
      let samples = 0;

      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        const sampleY = y + offsetY;
        if (sampleY < 0 || sampleY >= height) {
          continue;
        }

        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const sampleX = x + offsetX;
          if (sampleX < 0 || sampleX >= width) {
            continue;
          }

          total += grayData[sampleY * width + sampleX];
          samples += 1;
        }
      }

      output[y * width + x] = Math.round(total / samples);
    }
  }

  return output;
}

export function sobelEdgeDetect(
  grayData: Uint8ClampedArray,
  width: number,
  height: number,
): Float32Array {
  const edgeData = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const p00 = grayData[(y - 1) * width + (x - 1)];
      const p01 = grayData[(y - 1) * width + x];
      const p02 = grayData[(y - 1) * width + (x + 1)];
      const p10 = grayData[y * width + (x - 1)];
      const p12 = grayData[y * width + (x + 1)];
      const p20 = grayData[(y + 1) * width + (x - 1)];
      const p21 = grayData[(y + 1) * width + x];
      const p22 = grayData[(y + 1) * width + (x + 1)];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      edgeData[y * width + x] = magnitude;
    }
  }

  return edgeData;
}

export function thresholdEdges(
  edgeData: Float32Array,
  threshold: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(edgeData.length);

  for (let index = 0; index < edgeData.length; index += 1) {
    output[index] = edgeData[index] >= threshold ? 255 : 0;
  }

  return output;
}

export function renderLineArt(
  edgeData: Uint8ClampedArray,
  width: number,
  height: number,
  options: RenderOptions,
): ImageData {
  const pixels = new Uint8ClampedArray(width * height * 4);
  const background = hexToRgb(options.backgroundColor);
  const stroke = hexToRgb(options.lineColor);

  for (let index = 0; index < edgeData.length; index += 1) {
    const isEdge = edgeData[index] === 255;
    const useLineColor = options.invert ? !isEdge : isEdge;
    const pixelIndex = index * 4;

    if (useLineColor) {
      pixels[pixelIndex] = stroke.r;
      pixels[pixelIndex + 1] = stroke.g;
      pixels[pixelIndex + 2] = stroke.b;
      pixels[pixelIndex + 3] = options.originalAlphaMask?.[index] ?? 255;
      continue;
    }

    pixels[pixelIndex] = background.r;
    pixels[pixelIndex + 1] = background.g;
    pixels[pixelIndex + 2] = background.b;
    pixels[pixelIndex + 3] = options.keepTransparentBackground ? 0 : 255;
  }

  return new ImageData(pixels, width, height);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function extractAlphaMask(imageData: ImageData): Uint8ClampedArray {
  const alphaMask = new Uint8ClampedArray(imageData.width * imageData.height);
  for (let pixelIndex = 3, alphaIndex = 0; pixelIndex < imageData.data.length; pixelIndex += 4, alphaIndex += 1) {
    alphaMask[alphaIndex] = imageData.data[pixelIndex];
  }
  return alphaMask;
}

export function processLineArt(
  source: ProcessedImageSource,
  options: LineArtOptions,
): ImageData {
  const grayscale = toGrayscale(source.imageData);
  const blurred = boxBlur(
    grayscale,
    source.width,
    source.height,
    Math.round(options.smoothing),
  );
  const edges = sobelEdgeDetect(blurred, source.width, source.height);
  const threshold = calculateThreshold(options.lineStrength, options.detailLevel);
  const mask = thresholdEdges(edges, threshold);
  const alphaMask = extractAlphaMask(source.imageData);

  return renderLineArt(mask, source.width, source.height, {
    backgroundColor: options.backgroundColor,
    lineColor: options.lineColor,
    invert: options.invert,
    keepTransparentBackground: options.keepTransparentBackground,
    originalAlphaMask: alphaMask,
  });
}

export function buildEdgePreviewData(
  source: ProcessedImageSource,
  options: LineArtOptions,
): EdgePixelResult {
  const grayscale = toGrayscale(source.imageData);
  const blurred = boxBlur(
    grayscale,
    source.width,
    source.height,
    Math.round(options.smoothing),
  );
  const edges = sobelEdgeDetect(blurred, source.width, source.height);
  const threshold = calculateThreshold(options.lineStrength, options.detailLevel);

  return {
    mask: thresholdEdges(edges, threshold),
    alphaMask: extractAlphaMask(source.imageData),
  };
}

function calculateThreshold(lineStrength: number, detailLevel: number) {
  const normalizedStrength = lineStrength / 100;
  const normalizedDetail = detailLevel / 100;

  const baseThreshold = 40 + normalizedStrength * 200;
  const detailOffset = (1 - normalizedDetail) * 90;

  return Math.max(8, Math.min(255, baseThreshold + detailOffset));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeValue =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => value + value)
          .join("")
      : normalized;

  const parsed = Number.parseInt(safeValue, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}
