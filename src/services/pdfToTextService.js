
// import * as pdfjsLib from "pdfjs-dist";
// import { recognizePdfPage } from "./ocrService";

// // Configure PDF.js worker.
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// const OCR_SCALE = 2;

// // Validate the selected file.
// function validatePdfFile(file) {
//   if (!file || !(file instanceof File)) {
//     throw new Error("Please select a valid PDF file.");
//   }

//   if (
//     file.type !== "application/pdf" &&
//     !file.name.toLowerCase().endsWith(".pdf")
//   ) {
//     throw new Error("The selected file is not a PDF.");
//   }
// }

// // Report progress after each page.
// function reportProgress(callback, currentPage, totalPages) {
//   if (typeof callback === "function") {
//     callback({
//       currentPage,
//       totalPages,
//     });
//   }
// }

// // Convert PDF.js text items into readable lines.

// function formatPageText(items) {
//   // Keep actual text items only.
//   const textItems = items.filter(
//     (item) =>
//       item.str &&
//       item.str.length > 0 &&
//       item.transform &&
//       item.transform.length >= 6
//   );

//   // Sort text from top to bottom, then left to right.
//   const sortedItems = [...textItems].sort((a, b) => {
//     const yDifference = b.transform[5] - a.transform[5];

//     if (Math.abs(yDifference) > 2.5) {
//       return yDifference;
//     }

//     return a.transform[4] - b.transform[4];
//   });

//   const lines = [];

//   for (const item of sortedItems) {
//     const x = item.transform[4];
//     const y = item.transform[5];

//     const fontSize = Math.max(
//       Math.abs(item.transform[0]),
//       Math.abs(item.transform[3]),
//       1
//     );

//     // Find an existing line at approximately the same vertical position.
//     let line = lines.find(
//       (existingLine) =>
//         Math.abs(existingLine.y - y) <=
//         Math.max(2.5, fontSize * 0.2)
//     );

//     if (!line) {
//       line = {
//         y,
//         items: [],
//       };

//       lines.push(line);
//     }

//     line.items.push({
//       text: item.str,
//       x,
//       width: Math.abs(item.width || 0),
//       fontSize,
//       hasEOL: item.hasEOL,
//     });
//   }

//   // Sort lines from top to bottom.
//   lines.sort((a, b) => b.y - a.y);

//   return lines
//     .map((line) => {
//       // Sort individual items from left to right.
//       line.items.sort((a, b) => a.x - b.x);

//       let result = "";
//       let previousItem = null;

//       for (const item of line.items) {
//         let text = item.text;

//         if (previousItem) {
//           const previousEnd =
//             previousItem.x + previousItem.width;

//           const gap = item.x - previousEnd;

//           const spaceThreshold = Math.max(
//             1,
//             Math.min(previousItem.fontSize, item.fontSize) * 0.18
//           );

//           // Preserve existing spaces; add a space when
//           // separate PDF text items have a visible word gap.
//           if (
//             !result.endsWith(" ") &&
//             !text.startsWith(" ") &&
//             gap > spaceThreshold
//           ) {
//             result += " ";
//           }
//         }

//         result += text;

//         previousItem = item;
//       }

//       return result.trim();
//     })
//     .filter(Boolean)
//     .join("\n");
// }

// // Extract selectable text from one PDF page.
// async function extractPageText(page) {
//   const content = await page.getTextContent();
//   return formatPageText(content.items);
// }

// // Render one page for OCR.
// async function renderPageForOCR(page) {
//   const viewport = page.getViewport({
//     scale: OCR_SCALE,
//   });

//   const canvas = document.createElement("canvas");
//   const context = canvas.getContext("2d", {
//     alpha: false,
//   });

//   if (!context) {
//     throw new Error("Unable to create canvas context for OCR.");
//   }

//   canvas.width = Math.ceil(viewport.width);
//   canvas.height = Math.ceil(viewport.height);

//   try {
//     await page.render({
//       canvasContext: context,
//       viewport,
//     }).promise;

//     const result = await recognizePdfPage(canvas);

//     return Array.isArray(result)
//       ? result.join("\n")
//       : String(result || "");
//   } finally {
//     // Release the canvas memory.
//     canvas.width = 0;
//     canvas.height = 0;
//   }
// }

// // Shared PDF processing function.
// async function processPdf(file, onProgress, useOcr = false) {
//   validatePdfFile(file);

//   let loadingTask;

//   try {
//     const fileData = new Uint8Array(await file.arrayBuffer());

//     loadingTask = pdfjsLib.getDocument({
//       data: fileData,
//       isEvalSupported: false,
//     });

//     const pdf = await loadingTask.promise;
//     const totalPages = pdf.numPages;
//     const extractedPages = [];
//     const warnings = [];

//     reportProgress(onProgress, 0, totalPages);

//     // Process pages one at a time.
//     for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
//       let page;

//       try {
//         page = await pdf.getPage(pageNumber);

//         let pageText = "";

//         if (useOcr) {
//           pageText = await renderPageForOCR(page);
//         } else {
//           pageText = await extractPageText(page);
//         }

//         if (!pageText.trim()) {
//           pageText = useOcr
//             ? "[No readable text detected on this page.]"
//             : "[No selectable text found. Try enabling OCR mode.]";

//           warnings.push(`Page ${pageNumber} contains no extracted text.`);
//         }

//         extractedPages.push(
//           `========== PAGE ${pageNumber} ==========\n\n${pageText.trim()}`
//         );

//       } catch (error) {
//         throw new Error(
//           `Failed to process page ${pageNumber}: ${error.message}`
//         );

//       } finally {
//         if (page) {
//           page.cleanup();
//         }
//       }

//       reportProgress(onProgress, pageNumber, totalPages);
//     }

//     return {
//       text: extractedPages.join("\n\n"),
//       totalPages,
//       warnings,
//     };

//   } catch (error) {
//     console.error("PDF text extraction failed:", error);

//     if (error.name === "PasswordException") {
//       throw new Error(
//         "This PDF is password protected. Please use an accessible PDF."
//       );
//     }

//     throw new Error(
//       error.message || "Unable to extract text from this PDF."
//     );

//   } finally {
//     if (loadingTask) {
//       await loadingTask.destroy();
//     }
//   }
// }

// // Normal text extraction.
// export async function extractPDFText(file, onProgress) {
//   return processPdf(file, onProgress, false);
// }

// // OCR extraction for scanned/image-based PDFs.
// export async function extractPDFTextWithOCR(file, onProgress) {
//   return processPdf(file, onProgress, true);
// }

// // Detailed conversion API, if you need it elsewhere.
// export async function convertPdfToTextDetailed(file, onProgress) {
//   return extractPDFText(file, onProgress);
// }


import * as pdfjsLib from "pdfjs-dist";
import { recognizePdfPage } from "./ocrService";

// --------------------------------------------------
// PDF.js configuration
// --------------------------------------------------

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const DEFAULT_OPTIONS = {
  ocrScale: 2,
  minTextLength: 3,
  lineTolerance: 2.5,
  spaceThreshold: 0.18,
  useOcrFallback: false,
};

// --------------------------------------------------
// File validation
// --------------------------------------------------

function validatePdfFile(file) {
  if (
    typeof File === "undefined" ||
    !(file instanceof File)
  ) {
    throw new Error("Please select a valid PDF file.");
  }

  if (
    file.type !== "application/pdf" &&
    !file.name?.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("The selected file is not a PDF.");
  }

  if (file.size === 0) {
    throw new Error("The selected PDF file is empty.");
  }
}

// --------------------------------------------------
// Progress reporting
// --------------------------------------------------

function reportProgress(callback, currentPage, totalPages) {
  if (typeof callback === "function") {
    callback({
      currentPage,
      totalPages,
    });
  }
}
function extractTextItems(textContent, viewport) {
  return textContent.items
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => {
      const transform = item.transform || [];

      const fontSize = Math.hypot(
        transform[2] || 0,
        transform[3] || 0
      );

      const fontName = item.fontName || "";
      const fontStyle = textContent.styles?.[fontName] || {};

      return {
        text: item.str,

        // Position
        x: transform[4] || 0,
        y: viewport.height - (transform[5] || 0),

        // Dimensions
        width: item.width || 0,
        height: item.height || 0,

        // Font information
        fontSize,
        fontName,
        fontFamily: fontStyle.fontFamily || "",

        // Text information
        direction: item.dir || "ltr",
        hasEOL: item.hasEOL || false,
      };
    });
}
// --------------------------------------------------
// Text item validation
// --------------------------------------------------

function getValidTextItems(items) {
  return items.filter((item) => {
    return (
      typeof item.str === "string" &&
      item.str.trim().length > 0 &&
      Array.isArray(item.transform) &&
      item.transform.length >= 6
    );
  });
}

// --------------------------------------------------
// Font size calculation
// --------------------------------------------------

function getFontSize(item) {
  return Math.max(
    Math.hypot(
      item.transform[0],
      item.transform[1]
    ),
    Math.hypot(
      item.transform[2],
      item.transform[3]
    ),
    1
  );
}

// --------------------------------------------------
// Group text items into lines
// --------------------------------------------------

function groupTextIntoLines(items) {
  const sortedItems = [...items].sort((a, b) => {
    const yDifference =
      b.transform[5] - a.transform[5];

    if (Math.abs(yDifference) > 2.5) {
      return yDifference;
    }

    return a.transform[4] - b.transform[4];
  });

  const lines = [];

  for (const item of sortedItems) {
    const x = item.transform[4];
    const y = item.transform[5];
    const fontSize = getFontSize(item);

    let line = lines.find((existing) => {
      const tolerance = Math.max(
        2.5,
        Math.min(existing.fontSize, fontSize) * 0.2
      );

      return Math.abs(existing.y - y) <= tolerance;
    });

    if (!line) {
      line = {
        y,
        fontSize,
        items: [],
      };

      lines.push(line);
    }

    line.items.push({
      text: item.str,
      x,
      width: Math.abs(item.width || 0),
      fontSize,
      hasEOL: item.hasEOL,
    });

    line.fontSize = Math.max(
      line.fontSize,
      fontSize
    );
  }

  return lines.sort((a, b) => b.y - a.y);
}

// --------------------------------------------------
// Format individual text lines
// --------------------------------------------------

function formatTextLine(items) {
  const sorted = [...items].sort(
    (a, b) => a.x - b.x
  );

  let result = "";
  let previousItem = null;

  for (const item of sorted) {
    const text = item.text;

    if (previousItem) {
      const previousEnd =
        previousItem.x + previousItem.width;

      const gap = item.x - previousEnd;

      const threshold = Math.max(
        1,
        Math.min(
          previousItem.fontSize,
          item.fontSize
        ) * DEFAULT_OPTIONS.spaceThreshold
      );

      if (
        gap > threshold &&
        !result.endsWith(" ") &&
        !text.startsWith(" ")
      ) {
        result += " ";
      }
    }

    result += text;

    previousItem = item;
  }

  return result.trim();
}

// --------------------------------------------------
// Extract and format PDF page text
// --------------------------------------------------

function formatPageText(items) {
  const validItems = getValidTextItems(items);

  if (!validItems.length) {
    return "";
  }

  const lines = groupTextIntoLines(validItems);

  return lines
    .map((line) => formatTextLine(line.items))
    .filter(Boolean)
    .join("\n");
}

async function extractPageText(page) {
  const content = await page.getTextContent({
    includeMarkedContent: false,
    disableNormalization: false,
  });

  const viewport = page.getViewport({ scale: 1 });

  const textItems = extractTextItems(
    content,
    viewport
  );

  return formatPageText(content.items);
}
// --------------------------------------------------
// Render PDF page for OCR
// --------------------------------------------------

async function renderPageForOCR(
  page,
  options = {}
) {
  const viewport = page.getViewport({
    scale: options.ocrScale || DEFAULT_OPTIONS.ocrScale,
  });

  const canvas = document.createElement("canvas");

  const context = canvas.getContext("2d", {
    alpha: false,
  });

  if (!context) {
    throw new Error(
      "Unable to create canvas context for OCR."
    );
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  try {
    const renderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
    });

    await renderTask.promise;

    const result = await recognizePdfPage(canvas);

    if (Array.isArray(result)) {
      return result
        .filter(Boolean)
        .join("\n");
    }

    return String(result || "").trim();

  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

// --------------------------------------------------
// OCR fallback
// --------------------------------------------------

function shouldUseOCR(text, options) {
  if (!options.useOcrFallback) {
    return false;
  }

  return (
    text.trim().length <
    options.minTextLength
  );
}

// --------------------------------------------------
// Process PDF
// --------------------------------------------------

async function processPdf(
  file,
  onProgress,
  useOcr = false,
  customOptions = {}
) {
  validatePdfFile(file);

  const options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
  };

  let loadingTask;
  let pdf;

  try {
    const fileData = new Uint8Array(
      await file.arrayBuffer()
    );

    loadingTask = pdfjsLib.getDocument({
      data: fileData,
      isEvalSupported: false,
    });

    pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;

    if (!totalPages) {
      throw new Error(
        "The PDF does not contain any pages."
      );
    }

    const extractedPages = [];
    const warnings = [];

    reportProgress(
      onProgress,
      0,
      totalPages
    );

    // Process pages sequentially.
    for (
      let pageNumber = 1;
      pageNumber <= totalPages;
      pageNumber++
    ) {
      let page;

      try {
        page = await pdf.getPage(pageNumber);

        let pageText = "";

        // Full OCR mode.
        if (useOcr) {
          pageText = await renderPageForOCR(
            page,
            options
          );
        } else {
          // Normal selectable text extraction.
          pageText = await extractPageText(page);

          // Optional OCR fallback.
          if (shouldUseOCR(pageText, options)) {
            pageText = await renderPageForOCR(
              page,
              options
            );
          }
        }

        pageText = pageText.trim();

        if (!pageText) {
          pageText = useOcr
            ? "[No readable text detected on this page.]"
            : "[No selectable text found. Try enabling OCR mode.]";

          warnings.push(
            `Page ${pageNumber} contains no extracted text.`
          );
        }

      extractedPages.push(pageText);

      } catch (error) {
        console.error(
          `Error processing PDF page ${pageNumber}:`,
          error
        );

        warnings.push(
          `Page ${pageNumber} could not be processed: ${error.message}`
        );

        extractedPages.push(
          `========== PAGE ${pageNumber} ==========\n\n[Page extraction failed.]`
        );

      } finally {
        if (page) {
          page.cleanup();
        }
      }

      reportProgress(
        onProgress,
        pageNumber,
        totalPages
      );
    }

    return {
      text: extractedPages.join("\n\n"),
      totalPages,
      warnings,
    };

  } catch (error) {
    console.error(
      "PDF text extraction failed:",
      error
    );

    if (error.name === "PasswordException") {
      throw new Error(
        "This PDF is password protected. Please use an accessible PDF."
      );
    }

    if (error.name === "InvalidPDFException") {
      throw new Error(
        "The PDF file is corrupted or invalid."
      );
    }

    if (error.name === "MissingPDFException") {
      throw new Error(
        "The PDF file could not be found."
      );
    }

    throw new Error(
      error.message ||
      "Unable to extract text from this PDF."
    );

  } finally {
    if (loadingTask) {
      await loadingTask.destroy();
    }
  }
}

// --------------------------------------------------
// Public APIs
// --------------------------------------------------

// Normal text extraction.
export async function extractPDFText(
  file,
  onProgress
) {
  return processPdf(
    file,
    onProgress,
    false
  );
}

// Full OCR extraction.
export async function extractPDFTextWithOCR(
  file,
  onProgress
) {
  return processPdf(
    file,
    onProgress,
    true
  );
}

// Optional normal extraction with OCR fallback.
export async function extractPDFTextWithFallback(
  file,
  onProgress
) {
  return processPdf(
    file,
    onProgress,
    false,
    {
      useOcrFallback: true,
    }
  );
}

// Backward-compatible detailed conversion API.
export async function convertPdfToTextDetailed(
  file,
  onProgress
) {
  return extractPDFText(
    file,
    onProgress
  );
}
