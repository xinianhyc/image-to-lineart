import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ControlsPanel } from "./components/ControlsPanel";
import { Header } from "./components/Header";
import { ImagePreview } from "./components/ImagePreview";
import { UploadPanel } from "./components/UploadPanel";
import {
  QUALITY_PROFILES,
  type LineArtOptions,
  type ProcessedImageSource,
} from "./types";
import {
  downloadCanvas,
  loadImageToCanvas,
  processLineArt,
} from "./utils/imageProcessing";

const DEFAULT_OPTIONS: LineArtOptions = {
  backgroundColor: "#8CEA66",
  lineColor: "#1B3518",
  lineStrength: 48,
  detailLevel: 62,
  smoothing: 2,
  invert: false,
  keepTransparentBackground: false,
  qualityLevel: "hd",
  fastPreviewMode: true,
};

function App() {
  const [options, setOptions] = useState<LineArtOptions>(DEFAULT_OPTIONS);
  const deferredOptions = useDeferredValue(options);
  const [source, setSource] = useState<ProcessedImageSource | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qualityProfile = QUALITY_PROFILES[options.qualityLevel];
  const effectivePreviewMaxSize = useMemo(() => {
    if (options.fastPreviewMode) {
      return Math.min(qualityProfile.previewMaxSize, 1200);
    }

    return qualityProfile.previewMaxSize;
  }, [options.fastPreviewMode, qualityProfile.previewMaxSize]);
  const previewPixelRatio = useMemo(() => {
    if (typeof window === "undefined") {
      return 1;
    }

    if (options.fastPreviewMode) {
      return 1;
    }

    return Math.min(window.devicePixelRatio || 1, 1.5);
  }, [options.fastPreviewMode]);

  useEffect(() => {
    return () => {
      if (originalPreviewUrl) {
        URL.revokeObjectURL(originalPreviewUrl);
      }
    };
  }, [originalPreviewUrl]);

  useEffect(() => {
    if (!originalFile) {
      setSource(null);
      return;
    }

    let isCancelled = false;
    setIsPreparingPreview(true);

    void loadImageToCanvas(
      originalFile,
      effectivePreviewMaxSize,
      previewPixelRatio,
    )
      .then((nextSource) => {
        if (isCancelled) {
          return;
        }

        setSource(nextSource);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setSource(null);
        setErrorMessage(
          error instanceof Error ? error.message : "图片处理失败，请重试。",
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsPreparingPreview(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [effectivePreviewMaxSize, originalFile, previewPixelRatio]);

  useEffect(() => {
    if (!source || !resultCanvasRef.current) {
      return;
    }

    let isCancelled = false;
    setIsRenderingPreview(true);

    const renderFrame = window.setTimeout(() => {
      if (isCancelled || !resultCanvasRef.current) {
        return;
      }

      const result = processLineArt(source, deferredOptions);
      const canvas = resultCanvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        setErrorMessage("当前浏览器不支持 Canvas 渲染。");
        setIsRenderingPreview(false);
        return;
      }

      canvas.width = source.width;
      canvas.height = source.height;
      canvas.style.width = `${source.displayWidth}px`;
      canvas.style.height = `${source.displayHeight}px`;
      context.putImageData(result, 0, 0);
      setIsRenderingPreview(false);
    }, 30);

    return () => {
      isCancelled = true;
      window.clearTimeout(renderFrame);
    };
  }, [deferredOptions, source]);

  const hasImage = Boolean(source);
  const previewCanvasSize = useMemo(
    () => ({
      width: source?.displayWidth,
      height: source?.displayHeight,
    }),
    [source],
  );
  const isBusy = isPreparingPreview || isRenderingPreview || isExporting;

  async function handleFileSelect(file: File) {
    setErrorMessage(undefined);
    setIsPreparingPreview(true);

    try {
      const nextPreviewUrl = URL.createObjectURL(file);

      setSource(null);
      setOriginalFile(file);
      setFileName(file.name);
      setOriginalPreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return nextPreviewUrl;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "图片处理失败，请重试。",
      );
    }
  }

  function handleOptionChange<K extends keyof LineArtOptions>(
    key: K,
    value: LineArtOptions[K],
  ) {
    setOptions((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleReset() {
    setOptions(DEFAULT_OPTIONS);
  }

  async function handleDownload() {
    if (!originalFile || !source) {
      return;
    }

    setErrorMessage(undefined);
    setIsExporting(true);

    try {
      const exportMaxSize = getExportRenderSize(source, qualityProfile);
      const exportSource = await loadImageToCanvas(originalFile, exportMaxSize, 1);
      const exportResult = processLineArt(exportSource, options);
      const exportCanvas = document.createElement("canvas");
      const exportContext = exportCanvas.getContext("2d");

      if (!exportContext) {
        throw new Error("当前浏览器不支持 Canvas 导出。");
      }

      exportCanvas.width = exportSource.width;
      exportCanvas.height = exportSource.height;
      exportContext.putImageData(exportResult, 0, 0);

      downloadCanvas(
        exportCanvas,
        `line-art-${options.qualityLevel}-${Date.now()}.png`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "导出失败，请重试。",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#eff8dd_0%,_#f8fbff_30%,_#eef5f9_100%)] text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(140,234,102,0.34),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(27,53,24,0.08),_transparent_36%)]" />
      <Header />

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:pb-10">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <UploadPanel
              onFileSelect={handleFileSelect}
              isLoading={isBusy}
              fileName={fileName}
            />
            <ImagePreview
              title="原图预览"
              description="上传后的原始图片会显示在这里。"
              emptyTitle="等待上传图片"
              emptyDescription="先放一张图片进来，左侧显示原图，右侧会自动生成线稿效果。"
              imageUrl={originalPreviewUrl}
            />
          </div>

          <ImagePreview
            ref={resultCanvasRef}
            title="线稿结果"
            description="结果由 Canvas 在本地实时计算生成。"
            emptyTitle="等待生成线稿"
            emptyDescription="上传图片后会在这里看到绿色线稿风格结果。"
            canvasMode
            canvasWidth={previewCanvasSize.width}
            canvasHeight={previewCanvasSize.height}
            isLoading={isPreparingPreview || isRenderingPreview || isExporting}
          />
        </div>

        <ControlsPanel
          options={options}
          onChange={handleOptionChange}
          onReset={handleReset}
          onDownload={handleDownload}
          downloadDisabled={!hasImage || isBusy}
        />
      </main>
    </div>
  );
}

export default App;

function getExportRenderSize(
  source: ProcessedImageSource,
  profile: (typeof QUALITY_PROFILES)[keyof typeof QUALITY_PROFILES],
) {
  const originalMaxDimension = Math.max(source.naturalWidth, source.naturalHeight);
  const scaledPreviewTarget = Math.round(profile.previewMaxSize * profile.exportScale);
  const targetSize = Math.max(profile.exportMaxSize, scaledPreviewTarget);

  return Math.min(originalMaxDimension, targetSize);
}
