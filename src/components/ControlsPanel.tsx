import {
  QUALITY_PROFILES,
  type LineArtOptions,
  type QualityLevel,
} from "../types";
import { Toggle } from "./Toggle";

const BASIC_BACKGROUND_COLORS = [
  "#8CEA66",
  "#FFFFFF",
  "#F8E16C",
  "#FFD3B6",
  "#B8E1FF",
  "#E9D5FF",
  "#111827",
  "#F3F4F6",
];

const BASIC_LINE_COLORS = [
  "#1B3518",
  "#111827",
  "#FFFFFF",
  "#166534",
  "#1D4ED8",
  "#B91C1C",
  "#7C3AED",
  "#92400E",
];

type ControlsPanelProps = {
  options: LineArtOptions;
  onChange: <K extends keyof LineArtOptions>(
    key: K,
    value: LineArtOptions[K],
  ) => void;
  onReset: () => void;
  onDownload: () => void;
  downloadDisabled: boolean;
};

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  hint: string;
};

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
}: SliderFieldProps) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-slate-800">{label}</span>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider-thumb h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
      />
    </label>
  );
}

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  palette: string[];
};

function ColorField({ label, value, onChange, palette }: ColorFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-slate-800">{label}</span>
          <p className="mt-1 text-xs tracking-[0.2em] text-slate-500 uppercase">
            {value}
          </p>
        </div>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-12 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-1"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {palette.map((color) => {
          const isActive = color.toLowerCase() === value.toLowerCase();

          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              aria-label={`${label} ${color}`}
              className={`h-8 w-8 rounded-full border-2 transition hover:scale-105 ${
                isActive
                  ? "border-slate-900 shadow-[0_0_0_3px_rgba(15,23,42,0.12)]"
                  : "border-white shadow-sm"
              }`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ControlsPanel({
  options,
  onChange,
  onReset,
  onDownload,
  downloadDisabled,
}: ControlsPanelProps) {
  const selectedQuality = QUALITY_PROFILES[options.qualityLevel];
  const qualityLevels = Object.entries(QUALITY_PROFILES) as Array<
    [QualityLevel, (typeof QUALITY_PROFILES)[QualityLevel]]
  >;

  return (
    <section className="rounded-[28px] border border-white/65 bg-white/75 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">参数面板</h2>
          <p className="mt-1 text-sm text-slate-500">
            调整颜色与边缘阈值，结果会自动重新渲染。
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        >
          重置默认参数
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-slate-800">图片质量</h3>
              <p className="mt-1 text-xs text-slate-500">
                页面预览与下载导出会使用不同分辨率，下载时会重新高质量渲染。
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {selectedQuality.label}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {qualityLevels.map(([qualityLevel, profile]) => {
              const isActive = options.qualityLevel === qualityLevel;

              return (
                <button
                  key={qualityLevel}
                  type="button"
                  onClick={() => onChange("qualityLevel", qualityLevel)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50 shadow-[0_12px_30px_rgba(16,185,129,0.15)]"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {profile.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {profile.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedQuality.warning ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {selectedQuality.warning}
            </div>
          ) : null}
        </div>

        <ColorField
          label="背景颜色"
          value={options.backgroundColor}
          onChange={(value) => onChange("backgroundColor", value)}
          palette={BASIC_BACKGROUND_COLORS}
        />
        <ColorField
          label="线条颜色"
          value={options.lineColor}
          onChange={(value) => onChange("lineColor", value)}
          palette={BASIC_LINE_COLORS}
        />
        <SliderField
          label="线条强度"
          value={options.lineStrength}
          min={0}
          max={100}
          hint="值越高，进入线条判断的边缘越少。"
          onChange={(value) => onChange("lineStrength", value)}
        />
        <SliderField
          label="细节保留"
          value={options.detailLevel}
          min={0}
          max={100}
          hint="值越高，弱边缘也会被保留下来。"
          onChange={(value) => onChange("detailLevel", value)}
        />
        <SliderField
          label="平滑降噪"
          value={options.smoothing}
          min={0}
          max={10}
          hint="盒式模糊半径，适合压掉杂色与噪点。"
          onChange={(value) => onChange("smoothing", value)}
        />
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4 py-4 text-white">
          <p className="text-sm font-medium">当前效果思路</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            灰度化 → 降噪 → Sobel 边缘检测 → 阈值筛选 → 自定义颜色渲染
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Toggle
          checked={options.invert}
          onChange={(value) => onChange("invert", value)}
          label="反色"
          hint="反转线条区域与背景区域的判断逻辑。"
        />
        <Toggle
          checked={options.keepTransparentBackground}
          onChange={(value) => onChange("keepTransparentBackground", value)}
          label="保留透明背景"
          hint="非线条区域输出透明，适合叠加到其他设计稿中。"
        />
        <Toggle
          checked={options.fastPreviewMode}
          onChange={(value) => onChange("fastPreviewMode", value)}
          label="仅预览快速模式"
          hint="页面预览会优先保证流畅度，下载时仍会按所选质量档位重新高质量计算。"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          disabled={downloadDisabled}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          下载 PNG
        </button>
        <p className="flex items-center text-sm text-slate-500">
          导出文件名格式：
          <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
            {`line-art-${options.qualityLevel}-时间戳.png`}
          </code>
        </p>
      </div>
    </section>
  );
}
