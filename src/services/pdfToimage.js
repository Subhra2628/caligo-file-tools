
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const DEFAULT_SCALE = 2;
const MAX_CANVAS_PIXELS = 16000000;

function validateFile(file) {
  if (!file) {
    throw new Error("Please select a PDF file.");
  }

  if (file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please select a valid PDF file.");
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error("PDF size must be less than 50 MB.");
  }
}

async function renderPageToImage(
  page,
  pageNumber,
  format,
  scale,
  quality
) {
  const viewport = page.getViewport({ scale });

  // Prevent excessive canvas memory usage
  const pixelCount = viewport.width * viewport.height;

  if (pixelCount > MAX_CANVAS_PIXELS) {
    throw new Error(
      `Page ${pageNumber} is too large to convert at this resolution.`
    );
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create canvas context.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const mimeType = format === "jpg"
    ? "image/jpeg"
    : "image/png";

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error(`Failed to convert page ${pageNumber}.`));
      },
      mimeType,
      format === "jpg" ? quality : undefined
    );
  });

  const image = {
    pageNumber,
    blob,
    width: canvas.width,
    height: canvas.height,
    fileName: `page-${pageNumber}.${format}`,
  };

  // Release canvas memory
  canvas.width = 0;
  canvas.height = 0;

  return image;
}

export async function convertPdfToImages(
  file,
  onProgress = () => {},
  options = {}
) {
  validateFile(file);

  const {
    format = "png",
    scale = DEFAULT_SCALE,
    quality = 0.92,
  } = options;

  if (!["png", "jpg"].includes(format)) {
    throw new Error("Supported formats are PNG and JPG.");
  }

  if (!Number.isFinite(scale) || scale < 0.5 || scale > 4) {
    throw new Error("Image scale must be between 0.5 and 4.");
  }

  if (!Number.isFinite(quality) || quality < 0.1 || quality > 1) {
    throw new Error("Image quality must be between 0.1 and 1.");
  }

  let pdf;
  const images = [];

  try {
    const arrayBuffer = await file.arrayBuffer();

    pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    const totalPages = pdf.numPages;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      try {
        const image = await renderPageToImage(
          page,
          pageNumber,
          format,
          scale,
          quality
        );

        images.push(image);
      } finally {
        page.cleanup();
      }

      onProgress({
        currentPage: pageNumber,
        totalPages,
        progress: Math.round((pageNumber / totalPages) * 100),
      });
    }

    return {
      images,
      totalPages,
      format,
      fileName: file.name.replace(/\.pdf$/i, ""),
    };
  } catch (error) {
    // Release already-created image blobs on failure
    images.length = 0;

    throw new Error(
      error.message || "Failed to convert PDF pages into images."
    );
  } finally {
  if (pdf) {
    await pdf.cleanup();
  }
}
}
