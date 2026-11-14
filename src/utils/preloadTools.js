// Preload a tool's route chunk before the user opens it.
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
const pendingRoutes = new Map();

export function preloadTool(path) {
  const preload = toolPreloaders[path];
  if (!preload || preloadedRoutes.has(path)) return Promise.resolve();

  // Reuse an in-flight import instead of requesting the same chunk repeatedly.
  if (pendingRoutes.has(path)) return pendingRoutes.get(path);

  const request = preload()
    .then(() => {
      preloadedRoutes.add(path);
    })
    .catch(() => {
      // Leave failed routes retryable on the next user interaction.
    })
    .finally(() => {
      pendingRoutes.delete(path);
    });

  pendingRoutes.set(path, request);
  return request;
}

// Warm a small set of common tools after the homepage becomes idle.
// Avoid background downloads on slow connections or when the user saves data.
export function scheduleCommonToolPreloads() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType)) {
    return () => {};
  }

  const commonRoutes = ["/image-to-pdf", "/merge-pdf", "/image-compressor"];
  let index = 0;
  let cancelled = false;
  let idleHandle;
  let timeoutHandle;

  const scheduleNext = () => {
    if (cancelled || index >= commonRoutes.length) return;

    const runNext = () => {
      if (cancelled) return;

      preloadTool(commonRoutes[index]).finally(() => {
        index += 1;
        scheduleNext();
      });
    };

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(runNext, { timeout: 4000 });
    } else {
      timeoutHandle = window.setTimeout(runNext, 1500);
    }
  };

  scheduleNext();

  return () => {
    cancelled = true;
    if (idleHandle && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleHandle);
    }
    if (timeoutHandle) {
      window.clearTimeout(timeoutHandle);
    }
  };
}
