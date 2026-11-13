
import { PDFDocument } from "pdf-lib";

/**
 * Merge multiple PDF files into one PDF.
 * @param {File[]} files - Array of PDF files.
 * @returns {Promise<Uint8Array>} Merged PDF bytes.
 */
export async function mergePdfFiles(files) {
  try {
    if (!Array.isArray(files) || files.length < 2) {
      throw new Error("Please select at least two PDF files.");
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      if (!(file instanceof File) || file.type !== "application/pdf") {
        throw new Error(`Invalid PDF file: ${file?.name || "Unknown file"}`);
      }

      const arrayBuffer = await file.arrayBuffer();

      const pdf = await PDFDocument.load(arrayBuffer);

      const copiedPages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    return await mergedPdf.save();
  } catch (error) {
    console.error("PDF merge error:", error);

    throw new Error(
      error.message || "Unable to merge PDF files."
    );
  }
}

/**
 * Download merged PDF.
 * @param {Uint8Array} pdfBytes
 * @param {string} fileName
 */
export function downloadMergedPdf(
  pdfBytes,
  fileName = "caligo-merged.pdf"
) {
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

  URL.revokeObjectURL(url);
}
