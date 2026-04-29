import { forwardRef } from "react";

type ImagePreviewProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  imageUrl?: string;
  isLoading?: boolean;
  canvasMode?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
};

export const ImagePreview = forwardRef<HTMLCanvasElement, ImagePreviewProps>(
  function ImagePreview(
    {
      title,
      description,
      emptyTitle,
      emptyDescription,
      imageUrl,
      isLoading = false,
      canvasMode = false,
      canvasWidth,
      canvasHeight,
    },
    ref,
  ) {
    return (
      <section className="rounded-[28px] border border-white/65 bg-white/75 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          {isLoading ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              处理中
            </span>
          ) : null}
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_rgba(241,245,249,0.95)_55%,_rgba(226,232,240,0.9))] p-3">
          <div className="preview-grid relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-slate-300 bg-white/65 p-2 sm:min-h-[360px]">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/82 backdrop-blur-sm">
                <span className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                <p className="text-sm font-medium text-slate-600">
                  正在重新渲染线稿效果...
                </p>
              </div>
            ) : null}

            {canvasMode ? (
              <canvas
                ref={ref}
                width={canvasWidth}
                height={canvasHeight}
                className={`max-h-[68vh] max-w-full rounded-[14px] object-contain shadow-[0_16px_40px_rgba(15,23,42,0.12)] ${
                  canvasWidth ? "block" : "hidden"
                }`}
              />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="max-h-[68vh] max-w-full rounded-[14px] object-contain shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
              />
            ) : null}

            {!imageUrl && !canvasWidth ? (
              <div className="flex max-w-xs flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white shadow-lg shadow-slate-900/15">
                  {canvasMode ? "✦" : "↑"}
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  {emptyTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {emptyDescription}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  },
);
