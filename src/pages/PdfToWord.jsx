import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload, Download, RotateCcw, CheckCircle2, AlertCircle, AlertTriangle,
  Loader2, FileText, FileType2, Lock, ShieldCheck, X, ArrowRight,
} from 'lucide-react'
import { convertPdfToWordDetailed } from "../services/pdfToWord";

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB, matches the service limit

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value >= 100 || i === 0 ? value.toFixed(0) : value.toFixed(value >= 10 ? 1 : 2)} ${units[i]}`
}

function isPdf(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

/* Accessible on/off switch */
function Toggle({ checked, onChange, disabled, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-xl p-3 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="mt-0.5 block text-sm text-slate-600">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none ${
          checked ? 'bg-brand-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export default function PdfToWord() {
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)
  const abortRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const [preservePageBreaks, setPreservePageBreaks] = useState(false)
  const [removeHeadersFooters, setRemoveHeadersFooters] = useState(true)

  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)

  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
 const optionsLocked = isConverting
  // Free the download URL when it is replaced or the page is closed
  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url)
    }
  }, [result])

  // Cancel any running conversion when leaving the page
  useEffect(() => () => abortRef.current?.abort(), [])

  const clearResult = useCallback(() => setResult(null), [])

  const handleFile = useCallback(
    (selected) => {
      if (!selected) return
      setError('')
      setNeedsPassword(false)
      setPassword('')
      setProgress(0)
      clearResult()

      if (!isPdf(selected)) {
        setError('This is not a PDF. Choose a file that ends in .pdf.')
        return
      }
      if (selected.size === 0) {
        setError('This file is empty. Choose a PDF that has content.')
        return
      }
      if (selected.size > MAX_SIZE) {
        setError(`This file is ${formatBytes(selected.size)}. The limit is 50 MB.`)
        return
      }
      setFile(selected)
    },
    [clearResult]
  )

  const handleDrop = (event) => {
    event.preventDefault()
    dragCounter.current = 0
    setDragActive(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  const handleDragEnter = (event) => {
    event.preventDefault()
    dragCounter.current += 1
    setDragActive(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    dragCounter.current = Math.max(0, dragCounter.current - 1)
    if (dragCounter.current === 0) setDragActive(false)
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setFile(null)
    clearResult()
    setError('')
    setNeedsPassword(false)
    setPassword('')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
const handleConvert = async () => {
  if (!file) return

  const controller = new AbortController()
  abortRef.current = controller

  setIsConverting(true)
  setError('')
  setProgress(0)
  clearResult()

  try {
    const { file: docx, pageCount, warnings } =
      await convertPdfToWordDetailed(
        file,
        {
          password: password || undefined,
          preservePageBreaks,
          removeHeadersFooters,
          signal: controller.signal,
        },
        (p) => setProgress(p)
      )

    setNeedsPassword(false)

    setResult({
      url: URL.createObjectURL(docx),
      name: docx.name,
      size: docx.size,
      pageCount,
      warnings,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      setError('Conversion cancelled.')
    } else if (
      err?.code === 'PASSWORD_REQUIRED' ||
      err?.code === 'PASSWORD_INCORRECT'
    ) {
      setNeedsPassword(true)
      setError(err.message)
    } else if (err?.code === 'NO_TEXT_LAYER') {
      setError('This PDF has no extractable text. OCR is required.')
    } else {
      setError(err?.message || 'Conversion failed.')
    }
  } finally {
    setIsConverting(false)
    abortRef.current = null
  }
}
//   const handleConvert = async () => {
//     if (!file) return

//     const controller = new AbortController()
//     abortRef.current = controller

//     setIsConverting(true)
//     setError('')
//     setProgress(0)
//     clearResult()

//     try {
//       const { file: docx, pageCount, warnings } = await convertPdfToWordDetailed(
//         file,
//         {
//           password: password || undefined,
//           preservePageBreaks,
//           removeHeadersFooters,
//           signal: controller.signal,
//         },
//         (p) => setProgress(p)
//       )

//       setNeedsPassword(false)
//       setResult({
//         url: URL.createObjectURL(docx),
//         name: docx.name,
//         size: docx.size,
//         pageCount,
//         warnings,
//       })
//     } catch (err) {
//       if (err?.name === 'AbortError') {
//         setError('Conversion cancelled.')
//       } else if (err?.code === 'PASSWORD_REQUIRED' || err?.code === 'PASSWORD_INCORRECT') {
//         setNeedsPassword(true)
//         setError(err.message)
//       } else if (err?.code === 'NO_TEXT_LAYER') {
//         setError(
//           'This PDF is a scan or a photo, so it has no text to convert. Run OCR on it first, then try again.'
//         )
//       } else {
//         setError(err?.message || 'Conversion failed. Try again or choose a different file.')
//       }
//     } finally {
//       setIsConverting(false)
//       abortRef.current = null
//     }
//   }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result.url
    link.download = result.name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

//   const optionsLocked = isConverting

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex items-center gap-4 sm:mb-10 sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 sm:h-14 sm:w-14">
          <FileType2 className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            PDF to Word
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Turn a PDF into an editable Word document.
          </p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            className="rounded-md p-1 text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!file && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose a PDF to convert. You can also drag and drop one here."
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 sm:rounded-3xl sm:py-16 ${
              dragActive
                ? 'border-brand-500 bg-brand-50'
                : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                handleFile(e.target.files?.[0])
                e.target.value = '' // allows re-selecting the same file
              }}
            />
            <div
              className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition motion-reduce:transition-none sm:h-20 sm:w-20 ${
                dragActive ? 'scale-110 ring-brand-300' : 'group-hover:-translate-y-0.5'
              }`}
            >
              <Upload className="h-7 w-7 text-brand-600 sm:h-8 sm:w-8" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
              {dragActive ? 'Drop the PDF to add it' : 'Drag a PDF here, or click to browse'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">PDF files up to 50 MB</p>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-slate-700 ring-1 ring-slate-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <p className="text-sm leading-relaxed">
              Your file stays on your device. The conversion runs in your browser and nothing is uploaded.
            </p>
          </div>
        </>
      )}

      {/* Workspace */}
      {file && (
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* File summary */}
          <aside className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-col lg:p-8 lg:text-center">
              <div className="relative shrink-0">
                <FileText className="h-14 w-14 text-slate-300 lg:h-16 lg:w-16" strokeWidth={1.25} aria-hidden="true" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  PDF
                </span>
              </div>
              <div className="min-w-0 flex-1 lg:mt-3 lg:flex-none">
                <p className="break-words font-semibold text-slate-800" title={file.name}>
                  {file.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">{formatBytes(file.size)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Choose a different file
            </button>

            <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-blue-900">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
              <p className="text-sm leading-relaxed">
                Text, headings, lists and tables are rebuilt. Images and exact page design are not carried over.
              </p>
            </div>
          </aside>

          {/* Options & result */}
          <section className="space-y-6 lg:col-span-3" aria-label="Conversion options">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Options</h2>
              <p className="mb-3 text-sm text-slate-600">The defaults work well for most documents.</p>

              <div className="-mx-3 divide-y divide-slate-100">
                <Toggle
                  checked={!preservePageBreaks}
                  onChange={(on) => setPreservePageBreaks(!on)}
                  disabled={optionsLocked}
                  label="Reflow text across pages"
                  description="Easier to edit. Turn off to keep every PDF page on its own Word page."
                />
                <Toggle
                  checked={removeHeadersFooters}
                  onChange={setRemoveHeadersFooters}
                  disabled={optionsLocked}
                  label="Remove headers, footers and page numbers"
                  description="Deletes lines that repeat on every page."
                />
              </div>

              {/* Password */}
              {needsPassword && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <label
                    htmlFor="pdf-password"
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    PDF password
                  </label>
                  <input
                    id="pdf-password"
                    type="password"
                    autoComplete="off"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && password && !isConverting) handleConvert()
                    }}
                    disabled={isConverting}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-60"
                  />
                </div>
              )}

              {/* Action / progress */}
              <div className="mt-6">
                {isConverting ? (
                  <div className="space-y-3" aria-live="polite">
                    <div className="flex items-center justify-between gap-3 text-sm font-medium text-brand-700">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        {progress < 85 ? 'Reading pages…' : progress < 100 ? 'Building Word file…' : 'Finishing…'}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                      aria-label="Conversion progress"
                      className="h-2 w-full overflow-hidden rounded-full bg-brand-100"
                    >
                      <div
                        className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => abortRef.current?.abort()}
                      className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={needsPassword && !password}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                  >
                    <FileType2 className="h-5 w-5" aria-hidden="true" />
                    {needsPassword
                      ? 'Unlock and convert'
                      : result
                        ? 'Convert again with these options'
                        : 'Convert to Word'}
                  </button>
                )}
              </div>
            </div>

            {/* Result */}
            {result && !isConverting && (
              <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-green-600" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-green-900">Word file ready</h2>
                    <p className="truncate text-sm text-green-800" title={result.name}>
                      {result.name}
                    </p>
                  </div>
                </div>

                <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_auto] sm:items-center">
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
                    <dt className="text-xs font-medium text-slate-600">PDF</dt>
                    <dd className="text-lg font-bold text-slate-800">{formatBytes(file.size)}</dd>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 text-slate-400 sm:block" aria-hidden="true" />
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
                    <dt className="text-xs font-medium text-green-700">Word</dt>
                    <dd className="text-lg font-bold text-green-800">{formatBytes(result.size)}</dd>
                  </div>
                  <div className="col-span-2 rounded-xl bg-white p-3 text-center shadow-sm sm:col-span-1 sm:ml-2 sm:min-w-[5.5rem]">
                    <dt className="text-xs font-medium text-slate-600">Pages</dt>
                    <dd className="text-lg font-bold text-brand-600">{result.pageCount}</dd>
                  </div>
                </dl>

                {result.warnings.length > 0 && (
                  <div className="mb-5 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      Check these before sharing
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                      {result.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-500/40 active:scale-[0.99] motion-reduce:transition-none"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                  Download Word file
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}






