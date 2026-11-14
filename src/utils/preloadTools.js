// Preload a tool's route chunk before the user opens it.
// This reduces the wait on navigation without loading every tool on the homepage.
const toolPreloaders = {
  "/document-to-pdf": () => import("../pages/DocumentToPDF"),
  "/pdf-to-text": () => import("../pages/PDFToText"),
  "/image-compressor": () => import("../pages/ImageCompressor"),
  "/image-to-pdf": () => import("../pages/ImageToPDF"),
  "/file-compress": () => import("../pages/pdfCompress"),
  "/pdf-word": () => import("../pages/PdfToWord.jsx"),
  "/word-pdf": () => import("../pages/wordToPdf.jsx"),
  "/pdf-image": () => import("../pages/pdfToimage.jsx"),
  "/merge-pdf": () => import("../pages/mergepdf.jsx"),
};

const preloadedRoutes = new Set();

export function preloadTool(path) {
  const preload = toolPreloaders[path];
  if (!preload || preloadedRoutes.has(path)) return;

  // Mark only after the import succeeds so a failed request can be retried.
  preload()
    .then(() => preloadedRoutes.add(path))
    .catch(() => {});
}
