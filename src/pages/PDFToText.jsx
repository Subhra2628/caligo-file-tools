import { useRef, useState } from 'react'
import {
  FileText, Upload, Download, Copy, RotateCcw,
  CheckCircle, AlertCircle, Loader2, File, Wand2,
  ShieldCheck, ArrowRight, FileCheck2
} from 'lucide-react'
// import { convertPdfToTextDetailed } from '../services/pdfToTextService'
// Import both functions from your updated service
// import { extractPDFText, extractPDFTextWithOCR } from '../services/pdfToTextService'
import {
  extractPDFText,
  extractPDFTextWithOCR,
} from '../services/pdfToTextService'
export default function PDFToText() {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  // Track if OCR mode is enabled
  const [useOcr, setUseOcr] = useState(false)


const handleFile = async (selectedFile) => {
  if (!selectedFile) return

  setFile(null)
  setExtractedText('')
  setError('')
  setSuccess('')
  setProgress(0)
  setTotalPages(0)

  if (
    selectedFile.type !== 'application/pdf' &&
    !selectedFile.name.toLowerCase().endsWith('.pdf')
  ) {
    setError('Please select a valid PDF file.')
    return
  }

  if (selectedFile.size > 30 * 1024 * 1024) {
    setError('File size must be less than 30 MB.')
    return
  }

  setFile(selectedFile)
  setLoading(true)

  try {
    const extractionFunction = useOcr
      ? extractPDFTextWithOCR
      : extractPDFText

    const result = await extractionFunction(
      selectedFile,
      (status) => {
        setTotalPages(status.totalPages)

        if (status.totalPages > 0) {
          setProgress(
            Math.round(
              (status.currentPage / status.totalPages) * 100
            )
          )
        }
      }
    )

    setExtractedText(result.text)
    setTotalPages(result.totalPages)
    setProgress(100)

    setSuccess(
      useOcr
        ? 'OCR extraction completed successfully!'
        : 'Text extracted successfully!'
    )

  } catch (err) {
    setError(err.message || 'Failed to extract text from PDF.')

  } finally {
    setLoading(false)
  }
}

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const droppedFile = event.dataTransfer.files?.[0]
    handleFile(droppedFile)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText)
      setSuccess('Text copied to clipboard!')
      setTimeout(() => setSuccess(''), 3000) // Clear success message after 3s
    } catch {
      setError('Unable to copy text. Please copy it manually.')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${file.name.replace(/\.pdf$/i, '')}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setSuccess('Text file downloaded successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleReset = () => {
    setFile(null)
    setExtractedText('')
    setError('')
    setSuccess('')
    setProgress(0)
    setTotalPages(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header Area */}
        <div className="mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 shadow-inner ring-1 ring-indigo-200/50">
            <FileText size={36} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              PDF to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Text</span>
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Instantly extract readable, copy-pasteable text from any PDF document securely inside your browser.
            </p>
          </div>
        </div>

        {/* Upload & Setup Section */}
        {!file && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Premium OCR Toggle Card */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm transition-colors hover:bg-indigo-50/80">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
                  <Wand2 size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Advanced OCR Mode</p>
                  <p className="text-sm font-medium text-slate-500">Enable for scanned documents, images, or regional languages.</p>
                </div>
              </div>

              {/* Custom iOS-style Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={useOcr}
                onClick={() => setUseOcr(!useOcr)}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  useOcr ? 'bg-indigo-600 shadow-inner' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                    useOcr ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Interactive Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-16 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-xl hover:shadow-indigo-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />

              <div className="pointer-events-none mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-110 group-hover:bg-indigo-100 group-hover:shadow-lg">
                <Upload size={36} strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Click to upload or drag & drop
              </h2>
              <p className="mt-2 text-slate-500">
                PDF documents up to 30 MB
              </p>

              <div className="mt-8 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-indigo-600 group-hover:shadow-md">
                  Select Document <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Global Alerts */}
        <div className="my-6 space-y-4">
          {error && (
            <div className="flex animate-in fade-in slide-in-from-top-2 items-start gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200/50">
              <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={20} />
              <p className="font-medium text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && !error && (
            <div className="flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200/50">
              <CheckCircle className="shrink-0 text-emerald-600" size={20} />
              <p className="font-medium text-emerald-800 text-sm">{success}</p>
            </div>
          )}
        </div>

        {/* Processing State & File Info */}
        {file && (
          <div className="space-y-6 animate-in fade-in duration-500">

            {/* File Info Bar */}
            <div className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <File size={24} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900" title={file.name}>
                    {file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    {totalPages > 0 && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span>{totalPages} Pages</span>
                      </>
                    )}
                    {useOcr && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span className="text-indigo-600">OCR Enabled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Start Over
              </button>
            </div>

            {/* Beautiful Progress Card */}
            {loading && (
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50 text-center animate-in fade-in slide-in-from-bottom-4">
                <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900">
                  {useOcr ? 'Running AI OCR Extraction...' : 'Extracting text...'}
                </h3>

                <div className="mx-auto mt-6 max-w-md">
                  <div className="mb-2 flex justify-between text-sm font-semibold">
                    <span className="text-slate-500">Processing Document</span>
                    <span className="text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-400">
                    Reading page {Math.max(1, Math.ceil((progress / 100) * totalPages))} of {totalPages || '...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Editor / Result Area */}
        {extractedText && !loading && (
          <div className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Toolbar */}
            <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Extraction Complete</h2>
                  <p className="text-xs font-medium text-slate-500">Review, edit, or copy your text below.</p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-indigo-600"
                >
                  <Copy size={16} />
                  Copy Text
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Download size={16} />
                  Download .txt
                </button>
              </div>
            </div>

            {/* Text Area */}
            <div className="p-4 sm:p-6 bg-slate-100/50">
              <textarea
                value={extractedText}
                onChange={(event) => setExtractedText(event.target.value)}
                className="w-full min-h-[500px] resize-y rounded-2xl border-0 bg-white p-6 font-sans text-base leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Extracted text will appear here..."
                spellCheck="false"
              />
            </div>
          </div>
        )}

        {/* Privacy Notice Footer */}
        <div className="mt-12 flex items-center justify-center gap-3 rounded-3xl bg-slate-100/80 p-6 text-center sm:text-left sm:p-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Total Privacy Guarantee</h3>
            <p className="mt-1 text-sm text-slate-500">
              All text extraction runs securely inside your browser. No files are ever uploaded or saved to our servers.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
