import { mergePdfFiles } from "../services/margePdf";

import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Merge,
  Loader2,
  AlertCircle,
  CheckCircle,
  Files,
} from "lucide-react";

// import {

//   downloadMergedPdf,
// } from "../services/mergePdfService";
import { downloadMergedPdf } from "../services/margePdf";
export default function MergePDF() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const addFiles = (selectedFiles) => {
    setError("");
    setSuccess(false);

    const pdfFiles = Array.from(selectedFiles).filter(
      (file) => file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== selectedFiles.length) {
      setError("Only PDF files are allowed.");
    }

    setFiles((previousFiles) => {
      const newFiles = [...previousFiles];

      pdfFiles.forEach((file) => {
        const alreadyExists = newFiles.some(
          (existingFile) =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );

        if (!alreadyExists) {
          newFiles.push(file);
        }
      });

      return newFiles;
    });
  };

  const handleFileChange = (event) => {
    addFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    addFiles(Array.from(event.dataTransfer.files || []));
  };

  const removeFile = (index) => {
    setFiles((previousFiles) =>
      previousFiles.filter((_, i) => i !== index)
    );

    setError("");
    setSuccess(false);
  };

  const moveFile = (index, direction) => {
    setFiles((previousFiles) => {
      const updatedFiles = [...previousFiles];
      const targetIndex = index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >= updatedFiles.length
      ) {
        return previousFiles;
      }

      [updatedFiles[index], updatedFiles[targetIndex]] = [
        updatedFiles[targetIndex],
        updatedFiles[index],
      ];

      return updatedFiles;
    });

    setSuccess(false);
  };

  const clearFiles = () => {
    setFiles([]);
    setError("");
    setSuccess(false);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least two PDF files.");
      return;
    }

    try {
      setIsMerging(true);
      setError("");
      setSuccess(false);

      const mergedPdf = await mergePdfFiles(files);

      downloadMergedPdf(mergedPdf, "caligo-merged.pdf");

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to merge PDF files.");
    } finally {
      setIsMerging(false);
    }
  };

  const totalSize = files.reduce(
    (total, file) => total + file.size,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Merge size={30} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Merge PDF Files
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Combine multiple PDF documents into one file.
            Arrange your files in the order you want before merging.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

          {/* Upload Area */}
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
              <Upload size={26} />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">
              Drop your PDF files here
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              or click to browse files
            </p>

            <span className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white">
              Choose PDF Files
            </span>

            <p className="mt-4 text-xs text-slate-400">
              Select two or more PDF files
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              role="status"
              className="mt-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              <CheckCircle size={18} />
              Your PDF files have been merged successfully!
            </div>
          )}

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-8">

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Selected Files
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {files.length} PDF files · {formatSize(totalSize)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFiles}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              </div>

              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4"
                  >
                    {/* File Icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <FileText size={22} />
                    </div>

                    {/* File Information */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-semibold text-slate-800"
                        title={file.name}
                      >
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatSize(file.size)}
                      </p>
                    </div>

                    {/* Position */}
                    <span className="hidden rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:block">
                      {index + 1}
                    </span>

                    {/* Reorder */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || isMerging}
                        onClick={() => moveFile(index, -1)}
                        aria-label={`Move ${file.name} up`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index === files.length - 1 || isMerging
                        }
                        onClick={() => moveFile(index, 1)}
                        aria-label={`Move ${file.name} down`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      disabled={isMerging}
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* File Summary */}
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
                <Files className="shrink-0 text-indigo-600" size={22} />

                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    Ready to merge
                  </p>

                  <p className="mt-1 text-xs text-indigo-700">
                    Files will be merged in the order shown above.
                  </p>
                </div>
              </div>

              {/* Merge Button */}
              <button
                type="button"
                onClick={handleMerge}
                disabled={files.length < 2 || isMerging}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMerging ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Merging PDFs...
                  </>
                ) : (
                  <>
                    <Merge size={19} />
                    Merge PDF Files
                  </>
                )}
              </button>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                No files selected yet.
              </p>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <FileText className="mx-auto mb-2 text-indigo-600" size={23} />
            <h3 className="text-sm font-semibold text-slate-800">
              Multiple PDFs
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Combine multiple documents.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <ArrowUp className="mx-auto mb-2 text-indigo-600" size={23} />
            <h3 className="text-sm font-semibold text-slate-800">
              Custom Order
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Arrange pages before merging.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <Download className="mx-auto mb-2 text-indigo-600" size={23} />
            <h3 className="text-sm font-semibold text-slate-800">
              Quick Download
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Download your merged PDF.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Your PDF files are processed locally in your browser.
          They are not uploaded to a server by this tool.
        </p>
      </div>
    </div>
  );
}

