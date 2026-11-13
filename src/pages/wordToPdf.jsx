
import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Wand2,
  ShieldCheck,
  ArrowRight,
  FileCheck2,
} from "lucide-react";

import { convertWordToPDF } from "../services/wordToPdf";

export default function WordToPDF() {
  const fileInputRef = useRef(null);
  const downloadUrlRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [warnings, setWarnings] = useState([]);

  // --------------------------------------------------
  // File validation and conversion
  // --------------------------------------------------

  const handleFile = async (selectedFile) => {
    if (!selectedFile || loading) return;

    setError("");
    setSuccess("");
    setWarnings([]);
    setProgress(0);
    setTotalPages(0);

    if (
      !selectedFile.name.toLowerCase().endsWith(".docx")
    ) {
      setError("Please select a valid DOCX Word document.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected document is empty.");
      return;
    }

    if (selectedFile.size > 30 * 1024 * 1024) {
      setError("File size must be less than 30 MB.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const result = await convertWordToPDF(
        selectedFile,
        (status) => {
          if (status.totalPages > 0) {
            setTotalPages(status.totalPages);

            setProgress(
              Math.round(
                (status.currentPage / status.totalPages) * 100
              )
            );
          }
        }
      );

      setTotalPages(result.totalPages);
      setProgress(100);
      setWarnings(result.warnings || []);

      // Release previous download URL.
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }

      downloadUrlRef.current = URL.createObjectURL(
        result.blob
      );

      setSuccess("Word document converted successfully!");

    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to convert Word document."
      );

      setFile(null);

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Drag and drop
  // --------------------------------------------------

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    handleFile(droppedFile);
  };

  // --------------------------------------------------
  // Download PDF
  // --------------------------------------------------

  const handleDownload = () => {
    if (!downloadUrlRef.current || !file) return;

    const link = document.createElement("a");

    link.href = downloadUrlRef.current;
    link.download = file.name.replace(
      /\.docx$/i,
      ".pdf"
    );

    document.body.appendChild(link);
    link.click();
    link.remove();

    setSuccess("PDF downloaded successfully!");
  };

  // --------------------------------------------------
  // Reset
  // --------------------------------------------------

  const handleReset = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }

    setFile(null);
    setError("");
    setSuccess("");
    setProgress(0);
    setTotalPages(0);
    setWarnings([]);
    setDragActive(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --------------------------------------------------
  // Component UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">

          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 shadow-inner ring-1 ring-indigo-200/50">
            <FileText size={36} strokeWidth={1.5} />
          </div>

          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Word to{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                PDF
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Convert your Word documents into downloadable PDF files directly inside your browser.
            </p>
          </div>
        </div>

        {/* Upload Section */}
        {!file && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Information Card */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm transition-colors hover:bg-indigo-50/80 sm:flex-row">

              <div className="flex items-center gap-4 text-center sm:text-left">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
                  <Wand2 size={24} strokeWidth={1.5} />
                </div>

                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Smart Document Conversion
                  </p>

                  <p className="text-sm font-medium text-slate-500">
                    Supports paragraphs, headings, lists and tables.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-indigo-100 px-4 py-2 text-xs font-bold text-indigo-700">
                DOCX TO PDF
              </span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDragActive(false);
                }
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-16 ${
                dragActive
                  ? "scale-[0.99] border-indigo-500 bg-indigo-50/50"
                  : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-xl hover:shadow-indigo-100/50"
              }`}
            >

              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />

              <div className="pointer-events-none mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-110 group-hover:bg-indigo-100 group-hover:shadow-lg">
                <Upload size={36} strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Click to upload or drag & drop
              </h2>

              <p className="mt-2 text-slate-500">
                Word documents (.docx) up to 30 MB
              </p>

              <div className="mt-8 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-indigo-600 group-hover:shadow-md">
                  Select Document
                  <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        <div className="my-6 space-y-4">

          {error && (
            <div className="flex animate-in fade-in slide-in-from-top-2 items-start gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200/50">

              <AlertCircle
                className="mt-0.5 shrink-0 text-red-600"
                size={20}
              />

              <p className="text-sm font-medium text-red-800">
                {error}
              </p>
            </div>
          )}

          {success && !error && (
            <div className="flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200/50">

              <CheckCircle
                className="shrink-0 text-emerald-600"
                size={20}
              />

              <p className="text-sm font-medium text-emerald-800">
                {success}
              </p>
            </div>
          )}
        </div>

        {/* File Information */}
        {file && (
          <div className="space-y-6 animate-in fade-in duration-500">

            <div className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50 sm:flex-row sm:items-center">

              <div className="flex min-w-0 items-center gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <File size={24} />
                </div>

                <div className="min-w-0">

                  <p
                    className="truncate font-bold text-slate-900"
                    title={file.name}
                  >
                    {file.name}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">

                    <span>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>

                    {totalPages > 0 && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{totalPages} Pages</span>
                      </>
                    )}

                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Start Over
              </button>
            </div>

            {/* Progress */}
            {loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/50">

                <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-600" />

                <h3 className="text-xl font-bold text-slate-900">
                  Converting Word to PDF...
                </h3>

                <div className="mx-auto mt-6 max-w-md">

                  <div className="mb-2 flex justify-between text-sm font-semibold">
                    <span className="text-slate-500">
                      Processing Document
                    </span>

                    <span className="text-indigo-600">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-400">
                    {progress === 100
                      ? "Finalizing PDF..."
                      : "Preparing your document..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conversion Result */}
        {file && !loading && success && downloadUrlRef.current && (
          <div className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Toolbar */}
            <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FileCheck2 size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Conversion Complete
                  </h2>

                  <p className="text-xs font-medium text-slate-500">
                    Your PDF is ready to download.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
              >
                <Download size={17} />
                Download PDF
              </button>
            </div>

            {/* Result Information */}
            <div className="space-y-4 bg-slate-100/50 p-6">

              <div className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <FileText size={24} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-800">
                    {file.name.replace(/\.docx$/i, ".pdf")}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    PDF Document · {totalPages} Pages
                  </p>
                </div>

                <CheckCircle
                  className="shrink-0 text-emerald-500"
                  size={22}
                />
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

                  <div className="mb-2 flex items-center gap-2 text-amber-800">
                    <AlertCircle size={18} />

                    <p className="font-bold text-sm">
                      Conversion Warnings
                    </p>
                  </div>

                  <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-12 flex items-center justify-center gap-3 rounded-3xl bg-slate-100/80 p-6 text-center sm:p-8 sm:text-left">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Your Documents Stay Private
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Conversion runs locally inside your browser. Your Word documents are not uploaded to our servers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
