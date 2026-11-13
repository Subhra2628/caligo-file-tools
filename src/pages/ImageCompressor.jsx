import { useRef, useState } from 'react'
import { compressImage } from '../services/imageCompressService'
import {
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImageIcon,
  Settings2,
  ArrowRight,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck
} from 'lucide-react'

export default function ImageCompressor() {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  // Slider State
  const [compressionMode, setCompressionMode] = useState('custom') // 'auto' | 'custom'
  const [targetKb, setTargetKb] = useState(50)

  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleFile = (selectedFile) => {
    if (!selectedFile) return
    setError('')
    setResult(null)

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).')
      return
    }

    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  const handleReset = () => {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCompress = async () => {
    setIsCompressing(true)
    setError('')

    try {
      const originalKb = file.size / 1024;

      const compressedFile = await compressImage(file, {
        mode: compressionMode,
        targetKb: targetKb
      });

      const finalKb = compressedFile.size / 1024;
      const savingsPercent = (((originalKb - finalKb) / originalKb) * 100).toFixed(1);
      const newPreviewUrl = URL.createObjectURL(compressedFile);

      setResult({
        url: newPreviewUrl,
        originalSize: originalKb,
        compressedSize: finalKb,
        savings: savingsPercent > 0 ? savingsPercent : 0
      });

    } catch (err) {
      setError(err.message || 'Failed to compress image. Please try again.')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result.url
    link.download = `compressed_${file.name}`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const sliderTicks = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header Area */}
        <div className="mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 shadow-inner ring-1 ring-indigo-200/50">
            <ImageIcon size={36} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Image <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Compressor</span>
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Reduce image file sizes instantly while maintaining perfect quality. Entirely in your browser.
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

        {/* Upload Zone */}
        {!file && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
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
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />

              <div className="pointer-events-none mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-110 group-hover:bg-indigo-100 group-hover:shadow-lg">
                <Upload size={40} strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Drop your image here</h2>
              <p className="mt-2 text-slate-500">or click anywhere to browse from your device</p>

              <div className="mt-8 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-indigo-600 group-hover:shadow-md">
                  Select Image <ArrowRight size={16} />
                </span>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                <span className="rounded-md bg-slate-100 px-2 py-1">JPG, PNG, WebP</span>
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
                  All image compression runs securely inside your browser. Your photos are never uploaded to any server.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Workspace */}
        {file && (
          <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in duration-500">

            {/* Left Column: Image Preview */}
            <div className="order-2 lg:order-1 lg:col-span-5 space-y-4">
              {/* Preview Container */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100/50">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* File Info Bar */}
              <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/50">
                <div className="overflow-hidden">
                  <p className="truncate font-bold text-slate-900" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    Original: {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  <RotateCcw size={14} /> Change
                </button>
              </div>
            </div>

            {/* Right Column: Settings & Actions */}
            <div className="order-1 lg:order-2 lg:col-span-7 space-y-6">

              {/* Compression Settings Panel */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-50/50 blur-3xl" />

                <div className="relative z-10 mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Settings2 size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Settings</h2>
                </div>

                {/* Mode Toggle Buttons */}
                <div className="relative z-10 mb-8 flex gap-2 rounded-2xl bg-slate-100 p-1.5">
                  <button
                    onClick={() => setCompressionMode('auto')}
                    disabled={result !== null || isCompressing}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                      compressionMode === 'auto'
                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'
                    }`}
                  >
                    <Sparkles size={18} className={compressionMode === 'auto' ? 'text-indigo-500' : ''} />
                    Auto (Lossless)
                  </button>
                  <button
                    onClick={() => setCompressionMode('custom')}
                    disabled={result !== null || isCompressing}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                      compressionMode === 'custom'
                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'
                    }`}
                  >
                    <SlidersHorizontal size={18} className={compressionMode === 'custom' ? 'text-indigo-500' : ''} />
                    Custom Target
                  </button>
                </div>

                {/* Slider UI */}
                <div className={`relative z-10 transition-all duration-300 ${compressionMode === 'auto' ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                  <div className="mb-6 flex items-end justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">Target File Size</h3>
                      <p className="text-sm font-medium text-slate-500">Drag to exact KB size</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 px-4 py-2 ring-1 ring-indigo-100">
                      <span className="text-3xl font-black text-indigo-600">{targetKb}</span>
                      <span className="ml-1 text-sm font-bold text-indigo-400">KB</span>
                    </div>
                  </div>

                  <div className="relative mb-10 mt-8">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={targetKb}
                      onChange={(e) => setTargetKb(Number(e.target.value))}
                      disabled={compressionMode === 'auto' || result !== null || isCompressing}
                      className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed"
                    />

                    {/* Tick Marks */}
                    <div className="absolute -bottom-7 left-0 right-0 flex justify-between px-1">
                      {sliderTicks.map((tick) => (
                        <div key={tick} className="flex flex-col items-center">
                          <div className="h-1.5 w-[2px] bg-slate-300 mb-1 rounded-full" />
                          <span className={`text-[11px] font-bold ${
                            (tick === 10 || tick === 50 || tick === 100) ? 'text-slate-500' : 'text-transparent sm:text-slate-400'
                          }`}>
                            {tick}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compress Button */}
                {!result ? (
                  <button
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="relative z-10 mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-lg font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/40 disabled:opacity-70 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {isCompressing ? (
                      <><Loader2 className="animate-spin" size={24} /> Compressing...</>
                    ) : (
                      'Compress Image Now'
                    )}
                  </button>
                ) : null}
              </div>

              {/* Success / Result Panel */}
              {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-900">Compression Complete!</h2>
                  </div>

                  <div className="mb-8 flex flex-col sm:flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100 gap-4">
                    <div className="text-center w-full sm:w-auto">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Original</p>
                      <p className="text-xl font-bold text-slate-700">{result.originalSize.toFixed(1)} KB</p>
                    </div>

                    <ArrowRight className="hidden sm:block text-slate-300" size={24} />

                    <div className="text-center w-full sm:w-auto">
                      <p className="text-sm font-bold text-emerald-500 uppercase tracking-wider">Compressed</p>
                      <p className="text-3xl font-black text-emerald-600">{result.compressedSize.toFixed(1)} KB</p>
                    </div>

                    <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 text-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Savings</p>
                      <p className="text-2xl font-bold text-indigo-600">-{result.savings}%</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleReset}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-4 py-4 font-bold text-emerald-700 transition hover:bg-emerald-100/50"
                    >
                      <RotateCcw size={20} /> Compress Another
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                    >
                      <Download size={20} /> Download Image
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
