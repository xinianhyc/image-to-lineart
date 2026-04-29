export function Header() {
  return (
    <header className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-8 sm:px-6 lg:px-8">
      <span className="w-fit rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-medium tracking-[0.24em] text-slate-700 uppercase shadow-sm backdrop-blur">
        Canvas Line Art Tool
      </span>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          线稿转换器
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          上传图片，一键生成自定义背景色线稿。所有处理都在浏览器本地完成，不经过任何服务器。
        </p>
      </div>
    </header>
  );
}
