import { useMemo, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

type UploadPanelProps = {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  fileName?: string;
};

export function UploadPanel({
  onFileSelect,
  isLoading,
  fileName,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hintText = useMemo(() => {
    if (fileName) {
      return `当前文件：${fileName}`;
    }

    return "支持 PNG、JPG、JPEG、WEBP，拖拽或点击都可以。";
  }, [fileName]);

  function handleFiles(fileList: FileList | null) {
    const nextFile = fileList?.[0];
    if (!nextFile) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      window.alert("请选择 PNG、JPG、JPEG 或 WEBP 图片。");
      return;
    }

    onFileSelect(nextFile);
  }

  return (
    <section className="rounded-[28px] border border-white/65 bg-white/75 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">上传图片</h2>
        <p className="mt-1 text-sm text-slate-500">
          图片只会在当前浏览器里处理，不会上传到服务器。
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
          }
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`group flex w-full flex-col items-center justify-center rounded-[24px] border border-dashed px-6 py-10 text-center transition ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/60"
        }`}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white shadow-xl shadow-slate-900/20 transition group-hover:bg-emerald-600">
          ⤴
        </div>
        <span className="text-base font-semibold text-slate-800">
          拖拽图片到这里
        </span>
        <span className="mt-2 text-sm text-slate-500">或点击选择本地文件</span>
        <span className="mt-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
          {isLoading ? "图片处理中..." : hintText}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </section>
  );
}
