import { useRef, useState, useEffect } from 'react'
import {
  Upload, Download, RotateCcw, CheckCircle, AlertCircle,
  Loader2, FileText, Images, X, Plus, Trash2, ArrowRight, ShieldCheck, FileCheck2
} from 'lucide-react'
import { convertImagesToPdf } from '../services/imageToPdf'

export default function ImageToPdf() {
  const fileInputRef = useRef(null)
  const addMoreInputRef = useRef(null)

  // State holds an array of objects: { id, file, previewUrl }
  const [images, setImages] = useState([])
  const [dragActive, setDragActive] = useState(false)

  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Cleanup object URLs to prevent memory leaks when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
  }, [images])

  const processFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return
    setError('')
    setResult(null)

    const validFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'))

    if (validFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP).')
      return
    }

    const newImages = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setImages((prev) => [...prev, ...newImages])
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    processFiles(event.dataTransfer.files)
  }

  const removeImage = (idToRemove) => {
    setImages((prev) => {
      const imgToRemove = prev.find(img => img.id === idToRemove)
      if (imgToRemove) URL.revokeObjectURL(imgToRemove.previewUrl)
      return prev.filter(img => img.id !== idToRemove)
    })
  }

  const handleReset = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl))
    setImages([])
    setResult(null)
    setError('')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConvert = async () => {
    if (images.length === 0) return
    setIsConverting(true)
    setError('')
    setProgress(0)

    try {
      const fileObjects = images.map((img) => img.file)
      const pdfFile = await convertImagesToPdf(fileObjects, (p) => setProgress(p))

      setTimeout(() => {
        setResult({
          url: URL.createObjectURL(pdfFile),
          name: pdfFile.name,
          size: pdfFile.size / 1024,
          pages: images.length
        })
        setIsConverting(false)
      }, 400)

    } catch (err) {
      setError(err.message || 'Failed to generate PDF.')
      setIsConverting(false)
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

  const totalOriginalSizeKb = images.reduce((acc, img) => acc + (img.file.size / 1024), 0)

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header Area */}
        <div className="mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 shadow-inner ring-1 ring-indigo-200/50">
            <FileText size={36} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Image to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">PDF</span>
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Combine multiple JPG, PNG, or WebP images into a single, perfectly formatted PDF document.
            </p>
          </div>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="mb-6 flex animate-in fade-in slide-in-from-top-2 items-start gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200/50">
            <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={20} />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Zone (Shows when empty) */}
        {images.length === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-20 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-xl hover:shadow-indigo-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
              />

              <div className="pointer-events-none mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-110 group-hover:bg-indigo-100 group-hover:shadow-lg">
                <Images size={40} strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Upload your images</h2>
              <p className="mt-2 text-slate-500">Drag and drop one or multiple images here</p>

              <div className="mt-8 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-indigo-600 group-hover:shadow-md">
                  Select Images <ArrowRight size={16} />
                </span>
              </div>
            </div>

            {/* Privacy Notice Footer */}
            <div className="mt-12 flex items-center justify-center gap-3 rounded-3xl bg-slate-100/80 p-6 text-center sm:text-left sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-indigo-500 shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Total Privacy Guarantee</h3>
                <p className="mt-1 text-sm text-slate-500">
                  All PDF generation runs securely inside your browser. Your images are never uploaded to any server.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Workspace */}
        {images.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in duration-500">

            {/* Left Column: Image Thumbnail Grid */}
            <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Selected Images ({images.length})
                    </h3>
                    <p className="text-sm font-medium text-slate-500">Drag items to reorder (coming soon)</p>
                  </div>

                  {/* Add More Button */}
                  {!result && !isConverting && (
                    <button
                      onClick={() => addMoreInputRef.current?.click()}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-95"
                    >
                      <Plus size={18} /> Add More
                    </button>
                  )}
                  <input
                    ref={addMoreInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => processFiles(e.target.files)}
                  />
                </div>

                {/* The Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((img, index) => (
                    <div key={img.id} className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100">
                      {/* Page Number Badge */}
                      <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-xs font-bold text-white backdrop-blur-md">
                        {index + 1}
                      </div>

                      {/* Remove Button */}
                      {!result && !isConverting && (
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm opacity-0 backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Remove image"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      )}

                      <img
                        src={img.previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear All Button */}
              {!result && (
                <button
                  onClick={handleReset}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-red-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:ring-red-200"
                >
                  <Trash2 size={18} /> Clear All Images
                </button>
              )}
            </div>

            {/* Right Column: Actions & Results */}
            <div className="order-1 lg:order-2 lg:col-span-4 space-y-6">

              {/* Summary & Conversion Panel */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-50/50 blur-3xl" />

                <div className="relative z-10 mb-6 border-b border-slate-100 pb-5">
                  <h2 className="text-xl font-bold text-slate-900">Document Summary</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Review before generating PDF</p>
                </div>

                <div className="relative z-10 space-y-4 mb-8">
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <span className="text-sm font-semibold text-slate-500">Total Pages:</span>
                    <span className="text-sm font-bold text-slate-900">{images.length} Pages</span>
                  </div>
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <span className="text-sm font-semibold text-slate-500">Image Size:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {totalOriginalSizeKb > 1024 ? (totalOriginalSizeKb / 1024).toFixed(2) + ' MB' : Math.round(totalOriginalSizeKb) + ' KB'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <span className="text-sm font-semibold text-slate-500">Format:</span>
                    <span className="text-sm font-bold text-slate-900">Portrait (A4)</span>
                  </div>
                </div>

                {/* Action Button & Progress */}
                {!result ? (
                  <div className="relative z-10">
                    {isConverting ? (
                      <div className="rounded-2xl bg-indigo-50 p-5 ring-1 ring-indigo-100">
                        <div className="mb-3 flex items-center justify-between text-sm font-bold text-indigo-700">
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={18} /> Generating PDF
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-indigo-100">
                          <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleConvert}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-lg font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/40 active:scale-[0.98]"
                      >
                        Convert to PDF
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Success Result Box */}
              {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <FileCheck2 size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-900">PDF Ready!</h2>
                  </div>

                  <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm text-center ring-1 ring-emerald-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Final PDF Size</p>
                    <p className="text-3xl font-black text-emerald-600">
                      {result.size > 1024 ? (result.size / 1024).toFixed(2) + ' MB' : result.size.toFixed(0) + ' KB'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                    >
                      <Download size={20} /> Download PDF
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3.5 text-base font-bold text-emerald-700 transition hover:bg-emerald-100/50"
                    >
                      <RotateCcw size={18} /> Convert More Images
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
