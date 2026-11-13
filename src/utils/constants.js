// File size limits are shown to users and checked before processing.
const MB = 1024 * 1024

export const LIMITS = {
  image: { maxFileSize: 25 * MB, maxFiles: 20 },
  pdf: { maxFileSize: 50 * MB, maxPages: 200 },
  document: { maxFileSize: 15 * MB },
}

export const IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}
