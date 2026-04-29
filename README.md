# 线稿转换器

一个基于 React + TypeScript + Vite + Tailwind CSS 的纯前端图片线稿转换网站。用户上传图片后，应用会在浏览器本地使用 HTML Canvas 进行灰度化、降噪、Sobel 边缘检测和阈值渲染，生成类似绿色聊天截图中的线稿效果。

## 特性

- 支持 `png`、`jpg`、`jpeg`、`webp`
- 支持拖拽上传和点击选择文件
- 左侧显示原图，右侧实时显示线稿结果
- 支持自定义背景颜色、线条颜色、线条强度、细节保留、平滑降噪
- 提供基础色调色盘，可一键选择常用背景色与线条色
- 支持反色、透明背景开关
- 参数变化后自动重新渲染
- 图片过大时自动等比缩放到最大边 `1600px`
- 支持导出 PNG，文件名格式为 `line-art-时间戳.png`
- 所有处理都在浏览器本地完成，不依赖后端

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- HTML Canvas

## 项目目录结构

```text
line-art-converter/
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ index.html
├─ README.md
└─ src/
   ├─ App.tsx
   ├─ index.css
   ├─ main.tsx
   ├─ types.ts
   ├─ components/
   │  ├─ ControlsPanel.tsx
   │  ├─ Header.tsx
   │  ├─ ImagePreview.tsx
   │  ├─ Toggle.tsx
   │  └─ UploadPanel.tsx
   └─ utils/
      └─ imageProcessing.ts
```

## 安装与运行

```bash
npm install
npm run dev
```

打开本地开发地址后即可使用。

## 打包命令

```bash
npm run build
```

## 核心算法说明

核心处理流程位于 `src/utils/imageProcessing.ts`：

1. `loadImageToCanvas(file)`
   - 把用户上传的图片读入浏览器。
   - 创建离屏 canvas，并在载入时完成尺寸控制。

2. `resizeImageIfNeeded(image, maxSize = 1600)`
   - 若图片最大边超过 `1600px`，则按比例缩放，避免浏览器卡顿。

3. `toGrayscale(imageData)`
   - 使用公式：
   - `gray = 0.299 * r + 0.587 * g + 0.114 * b`
   - 把彩色图转换为灰度图。

4. `boxBlur(grayData, width, height, radius)`
   - 使用简单盒式模糊对灰度图降噪。
   - `平滑降噪` 参数越大，噪点越少，但细节也会变软。

5. `sobelEdgeDetect(grayData, width, height)`
   - 使用 Sobel 算子计算边缘强度：
   - `gx = -p00 + p02 - 2*p10 + 2*p12 - p20 + p22`
   - `gy = -p00 - 2*p01 - p02 + p20 + 2*p21 + p22`
   - `magnitude = sqrt(gx*gx + gy*gy)`

6. `thresholdEdges(edgeData, threshold)`
   - 根据阈值把边缘强度转换为黑白边缘掩码。

7. `renderLineArt(edgeData, width, height, options)`
   - 边缘区域绘制为线条颜色。
   - 非边缘区域绘制为背景色。
   - 若开启透明背景，则非线条区域 alpha 为 `0`。
   - 若开启反色，则交换线条与背景的判断结果。

8. `downloadCanvas(canvas, filename)`
   - 使用 `canvas.toDataURL("image/png")` 导出结果。

## 参数逻辑

- `线条强度`
  - 提高后，阈值变高，结果更干净，线条更少。
- `细节保留`
  - 提高后，阈值偏低，更多细节边缘会保留。
- `平滑降噪`
  - 提高后，盒式模糊半径变大，噪点减少，但边缘更柔和。

## 运行命令

```bash
npm install
npm run dev
npm run build
```

## 后续可优化方向

- 使用 Web Worker 把像素运算移到后台线程，减少主线程阻塞
- 增加实时缩放、平移和对比视图
- 增加更多线稿风格预设，例如纯黑白、蓝图、反白稿
- 用积分图优化盒式模糊，提升大图处理性能
- 加入局部阈值、自适应边缘增强，让复杂背景的结果更稳定
