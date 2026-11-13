import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Loader2,
  CheckCircle,
  RefreshCw,
  FilePlus2,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  ArrowRight
} from "lucide-react";

import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { convertDocumentToHtml } from "../services/documentToPdfService"; // Ensure this path is correct for your project

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function DocumentToPDF() {
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getFilename = () => {
    return `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
  };

  // Select and process document
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    setError("");
    setSuccess("");
    setPdfBlob(null);
    setHtmlContent("");
    setFile(null);

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than 15 MB.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected file is empty.");
      return;
    }

    setLoading(true);

    try {
      const html = await convertDocumentToHtml(selectedFile);
      setFile(selectedFile);
      setHtmlContent(html);
      setSuccess("Document uploaded successfully.");
    } catch (err) {
      setError(err.message || "Unable to process this document.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Generate PDF
  const handleConvert = async () => {
    if (!previewRef.current || !file || converting) return;

    setConverting(true);
    setError("");
    setSuccess("");
    setPdfBlob(null);

    try {
      const element = previewRef.current;

      // Wait for browser fonts to finish loading
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Wait for images inside the document to load
      const images = Array.from(element.querySelectorAll("img"));
      await Promise.all(images.map((img) => img.decode().catch(() => {})));

      // Convert document preview into a canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        windowWidth: element.scrollWidth,
        scrollX: 0,
        scrollY: 0,
      });

      if (!canvas.width || !canvas.height) {
        throw new Error("Unable to render the document.");
      }

      // A4 dimensions
      const pageWidth = 210;
      const pageHeight = 297;

      // Calculate how many canvas pixels fit on one A4 page
      const pageHeightPx = Math.floor(canvas.width * (pageHeight / pageWidth));
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let page = 0; page < totalPages; page++) {
        const startY = page * pageHeightPx;
        const currentHeight = Math.min(pageHeightPx, canvas.height - startY);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentHeight;

        const context = pageCanvas.getContext("2d");
        if (!context) throw new Error("Unable to prepare PDF page.");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        context.drawImage(
          canvas,
          0, startY, canvas.width, currentHeight,
          0, 0, canvas.width, currentHeight
        );

        const imageData = pageCanvas.toDataURL("image/jpeg", 0.95);

        if (page > 0) {
          pdf.addPage("a4", "portrait");
        }

        const renderedHeight = currentHeight * (pageWidth / canvas.width);
        pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, renderedHeight);

        pageCanvas.width = 0;
        pageCanvas.height = 0;
      }

      const blob = pdf.output("blob");
      if (!blob || blob.size === 0) throw new Error("Generated PDF is empty.");

      setPdfBlob(blob);
      setSuccess(`PDF generated successfully! Total pages: ${totalPages}.`);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(`PDF generation failed: ${err.message || "Unknown error"}`);
    } finally {
      setConverting(false);
    }
  };

  // Download generated PDF
  const handleDownload = () => {
    if (!pdfBlob || !file) return;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setSuccess("PDF downloaded successfully!");
  };

  // Add another document
  const handleAddAnother = () => {
    setError("");
    fileInputRef.current?.click();
  };

  // Reset everything
  const handleReset = () => {
    setFile(null);
    setHtmlContent("");
    setPdfBlob(null);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (loading || converting) return;
    const droppedFile = event.dataTransfer.files?.[0];
    handleFile(droppedFile);
  };

  const formatSize = (size) => {
    return size >= 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(2)} MB`
      : `${(size / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 shadow-inner ring-1 ring-indigo-200/50">
            <FileText size={36} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Document to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">PDF</span>
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Transform your documents into high-quality, universally readable PDF files securely inside your browser.
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt,.html,.htm,.csv,.xlsx"
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="hidden"
        />

        {/* Status Alerts */}
        <div className="mb-8 space-y-4">
          {success && (
            <div className="flex animate-in fade-in slide-in-from-top-4 items-center gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={18} />
              </div>
              <p className="font-medium text-emerald-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex animate-in fade-in slide-in-from-top-4 items-center gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle size={18} />
              </div>
              <p className="font-medium text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        {!file && !loading && (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border-2 border-dashed border-slate-300 bg-white p-12 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-2xl hover:shadow-indigo-100/50 sm:p-20"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="pointer-events-none mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-100">
              <Upload size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Drop your document here</h2>
            <p className="mt-2 text-slate-500">or click anywhere to browse from your device</p>

            <div className="mt-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-indigo-600 group-hover:shadow-md">
                Select Document <ArrowRight size={16} />
              </span>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
              <span className="rounded-md bg-slate-100 px-2 py-1">DOCX, TXT, HTML, CSV, XLSX</span>
              <span>•</span>
              <span>Max 15 MB</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-white p-20 text-center shadow-sm ring-1 ring-slate-200/50">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
              <Loader2 className="absolute inset-0 h-full w-full animate-spin text-indigo-600" strokeWidth={2} />
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-900">Processing document...</h3>
            <p className="mt-2 text-slate-500">Parsing contents and preparing your preview.</p>
          </div>
        )}

        {/* Editor / Preview Area */}
        {file && !loading && (
          <div className="space-y-6 animate-in fade-in duration-500">

            {/* File Info Bar */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/50 sm:flex-row sm:items-center sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-900">{file.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <span>{formatSize(file.size)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle size={14} /> Ready to convert
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Sidebar Actions */}
              <div className="order-2 space-y-4 lg:order-1 lg:col-span-4">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sticky top-6">
                  <h3 className="mb-6 text-lg font-bold text-slate-900">Actions</h3>

                  <div className="space-y-3">
                    <button
                      onClick={handleConvert}
                      disabled={converting}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/40 disabled:opacity-70 disabled:pointer-events-none active:scale-[0.98]"
                    >
                      {converting ? (
                        <><Loader2 size={20} className="animate-spin" /> Converting...</>
                      ) : (
                        <><RefreshCw size={20} className="transition-transform group-hover:rotate-180" /> Convert to PDF</>
                      )}
                    </button>

                    <button
                      onClick={handleDownload}
                      disabled={!pdfBlob || converting}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/40 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none active:scale-[0.98]"
                    >
                      <Download size={20} className="transition-transform group-hover:-translate-y-1" /> Download PDF
                    </button>

                    <div className="my-6 h-px w-full bg-slate-100"></div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleAddAnother}
                        disabled={converting}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                      >
                        <FilePlus2 size={20} className="text-slate-400" /> Replace
                      </button>

                      <button
                        onClick={handleReset}
                        disabled={converting}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <RotateCcw size={20} className="text-slate-400" /> Reset
                      </button>
                    </div>
                  </div>

                  {pdfBlob && (
                    <div className="mt-6 animate-in slide-in-from-bottom-4 rounded-2xl bg-emerald-50/50 p-4 ring-1 ring-emerald-200/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <FileCheck2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">Success!</p>
                          <p className="text-xs text-emerald-700">Your PDF is ready to download.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Preview */}
              <div className="order-1 lg:order-2 lg:col-span-8">
                <div className="rounded-3xl bg-slate-200/50 p-4 sm:p-8 ring-1 ring-slate-200/50">
                  <div className="mb-4 flex items-center justify-between">
                    {/* <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Preview (Page 1)</span> */}
                  </div>

                  {/* The actual preview element - styled to look like paper */}
                  <div className="max-h-[700px] overflow-auto rounded-xl shadow-2xl bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    <div
                      ref={previewRef}
                      className="document-preview bg-white mx-auto p-8 sm:p-12 min-h-[800px]"
                      style={{ color: "#000000" }}
                    >
                      <style>{`
                        .document-preview h1, .document-preview h2, .document-preview h3 {
                          margin: 1.5em 0 0.5em;
                          font-weight: 700;
                          color: #0f172a;
                          line-height: 1.2;
                        }
                        .document-preview h1 { font-size: 2.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
                        .document-preview h2 { font-size: 1.875rem; }
                        .document-preview h3 { font-size: 1.5rem; }
                        .document-preview p { margin: 1em 0; line-height: 1.6; color: #334155; }
                        .document-preview table {
                          width: 100%; border-collapse: collapse; margin: 1.5em 0;
                          font-size: 0.875rem; border: 1px solid #e2e8f0;
                        }
                        .document-preview th, .document-preview td {
                          border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; color: #334155;
                        }
                        .document-preview th { background: #f8fafc; font-weight: 600; color: #0f172a; }
                        .document-preview img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5em 0; }
                        .document-preview pre {
                          white-space: pre-wrap; overflow-wrap: anywhere; background: #f8fafc;
                          padding: 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem;
                        }
                        .document-preview ul, .document-preview ol { padding-left: 1.5rem; margin: 1em 0; color: #334155; }
                        .document-preview li { margin: 0.25em 0; line-height: 1.6; }
                      `}</style>
                      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer / Privacy Info */}
        <div className="mt-12 flex items-center justify-center gap-3 rounded-3xl bg-slate-100 p-6 text-center sm:text-left sm:p-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-indigo-500 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Total Privacy Guarantee</h3>
            <p className="mt-1 text-sm text-slate-500">
              All document conversions run securely inside your browser. No files are ever uploaded or saved to our servers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
