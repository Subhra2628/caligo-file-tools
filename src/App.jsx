import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'

// Tool pages are loaded only when the user opens them.
const DocumentToPDF = lazy(() => import('./pages/DocumentToPDF'))
const PDFToText = lazy(() => import('./pages/PDFToText'))
const ImageCompressor = lazy(() => import('./pages/ImageCompressor'))
const ImageToPDF = lazy(() => import('./pages/ImageToPDF'))
const CompressFile = lazy(() => import('./pages/pdfCompress'))
const PdfToWord = lazy(() => import('./pages/PdfToWord.jsx'))
const WordToPdf = lazy(() => import('./pages/wordToPdf.jsx'))
const PdfToImage = lazy(() => import('./pages/pdfToimage.jsx'))
const MergePdf = lazy(() => import('./pages/mergepdf.jsx'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="document-to-pdf" element={<DocumentToPDF />} />
        <Route path="pdf-to-text" element={<PDFToText />} />
        <Route path="image-compressor" element={<ImageCompressor />} />
        <Route path="image-to-pdf" element={<ImageToPDF />} />
        <Route path="file-compress" element={<CompressFile />} />
        <Route path="pdf-word" element={<PdfToWord />} />
        <Route path="word-pdf" element={<WordToPdf />} />
        <Route path="pdf-image" element={<PdfToImage />} />
          <Route path="merge-pdf" element={<MergePdf  />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
