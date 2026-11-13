
import {
  FileText,
  ScanText,
  Minimize2,
  Images,
  FileArchive,
  FileImage,
  FileType,
  FileOutput,
  Merge,
} from "lucide-react";

// Central tool configuration
export const TOOLS = [
  {
    id: "document-to-pdf",
    path: "/document-to-pdf",
    name: "Document to PDF",
    description: "Convert TXT and DOCX documents into PDF files.",
    formats: "TXT, DOCX → PDF",
    icon: FileText,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    phase: 7,
  },
  {
    id: "pdf-to-text",
    path: "/pdf-to-text",
    name: "PDF to Text",
    description: "Extract text from PDF documents and download it as TXT.",
    formats: "PDF → TXT",
    icon: ScanText,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    phase: 8,
  },
  {
    id: "image-compressor",
    path: "/image-compressor",
    name: "Image Compressor",
    description: "Reduce JPG, PNG, and WebP image file sizes.",
    formats: "JPG, PNG, WebP",
    icon: Minimize2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    phase: 5,
  },
  {
    id: "image-to-pdf",
    path: "/image-to-pdf",
    name: "Image to PDF",
    description: "Combine images into one PDF and arrange their order.",
    formats: "JPG, PNG, WebP → PDF",
    icon: Images,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    phase: 6,
  },
  {
    id: "file-compress",
    path: "/file-compress",
    name: "File Compressor",
    description: "Compress multiple files into a single ZIP archive.",
    formats: "PDF, TXT, DOCX, CSV",
    icon: FileArchive,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    phase: 5,
  },
  {
    id: "pdf-word",
    path: "/pdf-word",
    name: "PDF to Word",
    description: "Convert PDF documents into editable Word files.",
    formats: "PDF → DOCX",
    icon: FileType,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    phase: 5,
  },
  {
    id: "word-pdf",
    path: "/word-pdf",
    name: "Word to PDF",
    description: "Convert Word documents into shareable PDF files.",
    formats: "DOCX → PDF",
    icon: FileOutput,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    phase: 5,
  },
  {
    id: "pdf-image",
    path: "/pdf-image",
    name: "PDF to Image",
    description: "Convert PDF pages into downloadable images.",
    formats: "PDF → JPG, PNG",
    icon: FileImage,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    phase: 5,
  },
  {
    id: "merge-pdf",
    path: "/merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDF documents into one file.",
    formats: "PDF + PDF → PDF",
    icon: Merge,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    phase: 5,
  },
];

// Get one tool by its ID
export function getTool(id) {
  return TOOLS.find((tool) => tool.id === id) || null;
}

// Get tools by phase
export function getToolsByPhase(phase) {
  return TOOLS.filter((tool) => tool.phase === phase);
}
