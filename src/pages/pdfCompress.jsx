import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload, Download, RotateCcw, CheckCircle2, AlertCircle, Loader2,
  FileArchive, ArrowRight, File as FileIcon, Info, Zap, Scale, Minimize2, X,
} from 'lucide-react'
import { compressFileToZip } from '../services/compressFile'

const MAX_SIZE = 100 * 1024 * 1024 // 100 MB

const PRESETS = [
  { label: 'Fast', level: 1, hint: 'Quickest, larger file', icon: Zap },
  { label: 'Balanced', level: 6, hint: 'Good size, good speed', icon: Scale },
  { label: 'Smallest', level: 9, hint: 'Best ratio, slower', icon: Minimize2 },
]

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value >= 100 || i === 0 ? value.toFixed(0) : value.toFixed(value >= 10 ? 1 : 2)} ${units[i]}`
}

function getExtension(name = '') {
  const part = name.includes('.') ? name.split('.').pop() : ''
  return part ? part.slice(0, 5).toUpperCase() : 'FILE'
}

export default function FileCompressor() {
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [zipLevel, setZipLevel] = useState(6)
  const [isCompressing, setIsCompressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Free the blob URL when it is replaced or the component unmounts
  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url)
    }
  }, [result])

  const clearResult = useCallback(() => setResult(null), [])

  const handleFile = useCallback((selected) => {
    if (!selected) return
    setError('')
    clearResult()
    setProgress(0)

    if (selected.size === 0) {
      setError('This file is empty. Choose a file that has content.')
      return
    }
    if (selected.size > MAX_SIZE) {
      setError(`This file is ${formatBytes(selected.size)}. The limit is 100 MB.`)
      return
    }
    setFile(selected)
  }, [clearResult])

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
    setFile(null)
    clearResult()
    setError('')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCompress = async () => {
    if (!file) return
    setIsCompressing(true)
    setError('')
    setProgress(0)
    clearResult()

    try {
      const processed = await compressFileToZip(file, { level: zipLevel }, (p) =>
        setProgress(Math.round(p))
      )
      setProgress(100)

      const saved = Math.max(0, ((file.size - processed.size) / file.size) * 100)
      setResult({
        url: URL.createObjectURL(processed),
        name: processed.name,
        originalSize: file.size,
        compressedSize: processed.size,
        savings: saved,
      })
    } catch (err) {
      setError(err?.message || 'Compression failed. Try again or choose a different file.')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result.url
    link.download = result.name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const activePreset = PRESETS.find((p) => p.level === zipLevel)
  const settingsLocked = isCompressing

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex items-center gap-4 sm:mb-10 sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 sm:h-14 sm:w-14">
          <FileArchive className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            File Compressor
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Turn any file into a smaller ZIP. Everything runs in your browser, so nothing is uploaded.
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
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a file to compress. You can also drag and drop one here."
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
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = '' // allows re-selecting the same file
            }}
          />
          <div
            className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition sm:h-20 sm:w-20 ${
              dragActive ? 'scale-110 ring-brand-300' : 'group-hover:-translate-y-0.5'
            } motion-reduce:transition-none`}
          >
            <Upload className="h-7 w-7 text-brand-600 sm:h-8 sm:w-8" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
            {dragActive ? 'Drop to add the file' : 'Drag a file here, or click to browse'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Any file type, up to 100 MB</p>
        </div>
      )}

      {/* Workspace */}
      {file && (
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* File summary */}
          <aside className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-col lg:items-center lg:p-8 lg:text-center">
              <div className="relative shrink-0">
                <FileIcon className="h-14 w-14 text-slate-300 lg:h-16 lg:w-16" strokeWidth={1.25} aria-hidden="true" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {getExtension(file.name)}
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
              disabled={isCompressing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Choose a different file
            </button>

            <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-blue-900">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
              <p className="text-sm leading-relaxed">
                Text files like .txt, .csv and .json shrink a lot. Images, videos and many PDFs are already compressed, so savings will be small.
              </p>
            </div>
          </aside>

          {/* Settings & result */}
          <section className="space-y-6 lg:col-span-3" aria-label="Compression settings">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Compression level</h2>
                  <p className="text-sm text-slate-600">
                    {activePreset ? activePreset.hint : 'Higher levels make smaller files but take longer.'}
                  </p>
                </div>
                <div
                  className="shrink-0 rounded-xl bg-brand-50 px-4 py-2 text-center"
                  aria-hidden="true"
                >
                  <span className="block text-xs font-medium text-brand-700">Level</span>
                  <span className="text-2xl font-bold leading-none text-brand-600">{zipLevel}</span>
                </div>
              </div>

              {/* Presets */}
              <div
                role="radiogroup"
                aria-label="Compression presets"
                className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1"
              >
                {PRESETS.map(({ label, level, icon: Icon }) => {
                  const selected = zipLevel === level
                  return (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={settingsLocked}
                      onClick={() => setZipLevel(level)}
                      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:justify-center sm:gap-2 sm:text-sm ${
                        selected
                          ? 'bg-white text-brand-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Fine control */}
              <div className="mt-6">
                <label htmlFor="zip-level" className="mb-2 block text-sm font-medium text-slate-700">
                  Fine-tune
                </label>
                <input
                  id="zip-level"
                  type="range"
                  min="1"
                  max="9"
                  step="1"
                  value={zipLevel}
                  onChange={(e) => setZipLevel(Number(e.target.value))}
                  disabled={settingsLocked}
                  aria-valuetext={`Level ${zipLevel}`}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="mt-2 flex justify-between px-0.5 text-xs text-slate-500">
                  <span>1 Fast</span>
                  <span>5</span>
                  <span>9 Smallest</span>
                </div>
              </div>

              {/* Action / progress */}
              <div className="mt-8">
                {isCompressing ? (
                  <div className="space-y-3" aria-live="polite">
                    <div className="flex items-center justify-between text-sm font-medium text-brand-700">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        Compressing…
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                      aria-label="Compression progress"
                      className="h-2 w-full overflow-hidden rounded-full bg-brand-100"
                    >
                      <div
                        className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompress}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 active:scale-[0.99] motion-reduce:transition-none"
                  >
                    <FileArchive className="h-5 w-5" aria-hidden="true" />
                    {result ? 'Compress again with these settings' : 'Create ZIP'}
                  </button>
                )}
              </div>
            </div>

            {/* Result */}
            {result && !isCompressing && (
              <div
                role="status"
                className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm sm:p-6"
              >
                <div className="mb-5 flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-green-600" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-green-900">ZIP ready</h2>
                    <p className="truncate text-sm text-green-800" title={result.name}>
                      {result.name}
                    </p>
                  </div>
                </div>

                <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_auto] sm:items-center">
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
                    <dt className="text-xs font-medium text-slate-600">Original</dt>
                    <dd className="text-lg font-bold text-slate-800">{formatBytes(result.originalSize)}</dd>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 text-slate-400 sm:block" aria-hidden="true" />
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
                    <dt className="text-xs font-medium text-green-700">ZIP</dt>
                    <dd className="text-lg font-bold text-green-800">{formatBytes(result.compressedSize)}</dd>
                  </div>
                  <div className="col-span-2 rounded-xl bg-white p-3 text-center shadow-sm sm:col-span-1 sm:ml-2 sm:min-w-[5.5rem]">
                    <dt className="text-xs font-medium text-slate-600">Saved</dt>
                    <dd className="text-lg font-bold text-brand-600">
                      {result.savings >= 0.1 ? `${result.savings.toFixed(1)}%` : 'None'}
                    </dd>
                  </div>
                </dl>

                {result.savings < 0.1 && (
                  <p className="mb-5 rounded-lg bg-white/70 p-3 text-sm text-slate-700">
                    This file is already compressed, so the ZIP is about the same size. You can still download it to bundle the file.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-500/40 active:scale-[0.99] motion-reduce:transition-none"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                  Download ZIP
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
