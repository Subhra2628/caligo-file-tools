
import { useRef, useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  Image,
  ShieldCheck,
  Wand2,
} from "lucide-react";

import { convertPdfToImages } from "../services/pdfToimage";

export default function PdfToImages() {
  const inputRef = useRef(null);
  const downloadUrlsRef = useRef([]);

  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("png");
  const [scale, setScale] = useState("2");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      downloadUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const clearDownloadUrls = () => {
    downloadUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    downloadUrlsRef.current = [];
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile || loading) return;

    setError("");
    setSuccess("");
    setImages([]);
    setProgress(0);
    setCurrentPage(0);
    setTotalPages(0);

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("PDF size must be less than 50 MB.");
      return;
    }

    clearDownloadUrls();
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files?.[0];

    handleFile(droppedFile);
  };

  const handleConvert = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setImages([]);
    setProgress(0);

    clearDownloadUrls();

    try {
      const result = await convertPdfToImages(
        file,
        (status) => {
          setProgress(status.progress);
          setCurrentPage(status.currentPage);
          setTotalPages(status.totalPages);
        },
        {
          format,
          scale: Number(scale),
          quality: 0.92,
        }
      );

      const preparedImages = result.images.map((image) => {
        const url = URL.createObjectURL(image.blob);

        downloadUrlsRef.current.push(url);

        return {
          ...image,
          url,
        };
      });

      setImages(preparedImages);
      setProgress(100);
      setSuccess(
        `${result.totalPages} pages converted successfully!`
      );
    } catch (err) {
      setError(err.message || "Failed to convert PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (image) => {
    const link = document.createElement("a");

    link.href = image.url;
    link.download = image.fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadAll = () => {
    images.forEach((image, index) => {
      setTimeout(() => handleDownload(image), index * 200);
    });
  };

  const handleReset = () => {
    if (loading) return;

    clearDownloadUrls();

    setFile(null);
    setImages([]);
    setProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
    setError("");
    setSuccess("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <FileImage size={32} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            PDF to Image Converter
          </h1>

          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            Convert PDF pages into high-quality PNG or JPG images.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

          {/* Upload */}
          {!file && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50"
            >
              <Upload
                size={38}
                className="mx-auto mb-4 text-blue-500"
              />

              <h2 className="text-lg font-semibold text-slate-800">
                Upload your PDF file
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Drag and drop your file here or browse
              </p>

              <span className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white">
                Choose PDF
              </span>

              <p className="mt-3 text-xs text-slate-400">
                Maximum file size: 50 MB
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {/* Selected File */}
          {file && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-red-500" size={28} />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleReset}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                title="Remove file"
              >
                <RotateCcw size={19} />
              </button>
            </div>
          )}

          {/* Settings */}
          {file && !success && (
            <div className="mb-6 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Image Format
                </label>

                <select
                  value={format}
                  disabled={loading}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Image Resolution
                </label>

                <select
                  value={scale}
                  disabled={loading}
                  onChange={(e) => setScale(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="1">Standard (1x)</option>
                  <option value="2">High (2x)</option>
                  <option value="3">Very High (3x)</option>
                  <option value="4">Ultra (4x)</option>
                </select>
              </div>

            </div>
          )}

          {/* Convert Button */}
          {file && !success && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Convert to Images
                </>
              )}
            </button>
          )}

          {/* Progress */}
          {loading && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>
                  Converting page {currentPage} of {totalPages || "..."}
                </span>

                <span>{progress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle size={20} className="shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* Image Results */}
          {images.length > 0 && (
            <div className="mt-8">

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Converted Images
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {images.length} images generated
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Download size={17} />
                  Download All
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {images.map((image) => (
                  <div
                    key={image.pageNumber}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 p-3">
                      <div className="flex items-center gap-2">
                        <Image size={18} className="text-blue-500" />

                        <span className="text-sm font-semibold text-slate-700">
                          Page {image.pageNumber}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownload(image)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        title="Download image"
                      >
                        <Download size={18} />
                      </button>
                    </div>

                    <div className="bg-slate-100 p-3">
                      <img
                        src={image.url}
                        alt={`PDF page ${image.pageNumber}`}
                        loading="lazy"
                        className="mx-auto h-auto max-h-96 w-full rounded-md object-contain shadow-sm"
                      />
                    </div>

                    <div className="p-3 text-xs text-slate-500">
                      {image.width} × {image.height} pixels
                    </div>
                  </div>
                ))}

              </div>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={18} />
                Convert Another PDF
              </button>
            </div>
          )}

          {/* Privacy */}
          <div className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <ShieldCheck size={17} className="text-green-600" />
            Your PDF is processed locally in your browser.
          </div>

        </div>
      </div>
    </div>
  );
}
