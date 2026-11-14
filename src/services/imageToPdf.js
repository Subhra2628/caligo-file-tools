import { jsPDF } from 'jspdf';

/**
 * Load an image and return its temporary object URL.
 * The caller is responsible for revoking the URL.
 */
const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.decoding = 'async';
    img.src = url;
  });

/**
 * Convert one or more images into an A4 PDF.
 */
export const convertImagesToPdf = async (files, onProgress) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Please select at least one image.');
  }

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('One of the selected files is empty or invalid.');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error(`Unsupported image file: ${file.name}`);
    }
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const a4Width = 210;
  const a4Height = 297;
  const margin = 15;
  const maxImgWidth = a4Width - margin * 2;
  const maxImgHeight = a4Height - margin * 2;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { img, url } = await loadImage(file);

    try {
      if (!img.naturalWidth || !img.naturalHeight) {
        throw new Error(`Invalid image dimensions: ${file.name}`);
      }

      const ratio = Math.min(
        maxImgWidth / img.naturalWidth,
        maxImgHeight / img.naturalHeight
      );

      const finalWidth = img.naturalWidth * ratio;
      const finalHeight = img.naturalHeight * ratio;
      const xOffset = (a4Width - finalWidth) / 2;
      const yOffset = (a4Height - finalHeight) / 2;

      // jsPDF accepts the loaded image and embeds it in the PDF.
      pdf.addImage(img, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);

      if (i < files.length - 1) {
        pdf.addPage();
      }

      onProgress?.(Math.round(((i + 1) / files.length) * 100));
    } finally {
      // Always release temporary browser resources, including on conversion errors.
      URL.revokeObjectURL(url);
      img.src = '';
    }
  }

  const pdfBlob = pdf.output('blob');

  if (!pdfBlob || pdfBlob.size === 0) {
    throw new Error('The generated PDF is empty.');
  }

  const firstName = files[0].name.replace(/\.[^.]+$/, '');

  const outputName =
    files.length === 1
      ? `${firstName || 'image'}_converted.pdf`
      : 'images_to_pdf_collection.pdf';

  return new File([pdfBlob], outputName, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
};
