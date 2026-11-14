import { PDFDocument } from "pdf-lib";

/**
 * Merge multiple PDF files into one PDF.
 * @param {File[]} files
 * @returns {Promise<Uint8Array>}
 */
export async function mergePdfFiles(files) {
  if (!Array.isArray(files) || files.length < 2) {
    throw new Error("Please select at least two PDF files.");
  }

  const mergedPdf = await PDFDocument.create();

  try {
    for (const file of files) {
      const isPdf =
        file instanceof File &&
        (file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"));

      if (!isPdf || file.size === 0) {
        throw new Error(`Invalid or empty PDF file: ${file?.name || "Unknown file"}`);
      }

      const pdf = await PDFDocument.load(await file.arrayBuffer());

      if (pdf.getPageCount() === 0) {
        throw new Error(`The PDF contains no pages: ${file.name}`);
      }

      const copiedPages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();

    if (!mergedBytes?.length) {
      throw new Error("The merged PDF is empty.");
    }

    return mergedBytes;
  } catch (error) {
    console.error("PDF merge error:", error);
    throw new Error(error.message || "Unable to merge PDF files.", {
      cause: error,
    });
  }
}

/**
 * Download merged PDF bytes.
 * @param {Uint8Array} pdfBytes
 * @param {string} fileName
 */
export function downloadMergedPdf(
  pdfBytes,
  fileName = "caligo-merged.pdf"
) {
  if (!pdfBytes?.length) {
    throw new Error("There is no merged PDF to download.");
  }

  const blob = new Blob([pdfBytes], {
    type: "application/pdf",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Give the browser time to begin the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
