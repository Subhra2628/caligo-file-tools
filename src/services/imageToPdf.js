import { jsPDF } from 'jspdf';

/**
 * Helper function to load an image file and get its dimensions
 */
const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      resolve({ img, url });
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
};

/**
 * Converts one or multiple images into a single PDF file.
 *
 * @param {File[]} files - Array of image File objects
 * @param {Function} onProgress - Callback for progress updates (0 to 100)
 * @returns {Promise<File>} - The generated PDF File object
 */
export const convertImagesToPdf = async (files, onProgress) => {
  try {
    // Initialize a new A4 PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Standard A4 dimensions in mm
    const a4Width = 210;
    const a4Height = 297;
    const margin = 15; // 15mm safe margin on all sides

    const maxImgWidth = a4Width - (margin * 2);
    const maxImgHeight = a4Height - (margin * 2);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 1. Load the image to get its natural dimensions
      const { img, url } = await loadImage(file);

      // 2. Calculate the scaling ratio to fit the image inside the A4 margins without distortion
      const ratio = Math.min(maxImgWidth / img.width, maxImgHeight / img.height);
      const finalWidth = img.width * ratio;
      const finalHeight = img.height * ratio;

      // 3. Center the image on the page
      const xOffset = (a4Width - finalWidth) / 2;
      const yOffset = (a4Height - finalHeight) / 2;

      // 4. Add the image to the PDF canvas
      // We use 'JPEG' as the format alias, jsPDF handles both PNG and JPG smoothly
      pdf.addImage(img, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);

      // Clean up the object URL from memory
      URL.revokeObjectURL(url);

      // 5. Add a new page if this isn't the last image
      if (i < files.length - 1) {
        pdf.addPage();
      }

      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / files.length) * 100));
      }
    }

    // Generate the PDF blob
    const pdfBlob = pdf.output('blob');

    // Create a dynamic file name based on the first image or a generic name
    const outputName = files.length === 1
      ? `${files[0].name.split('.')[0]}_converted.pdf`
      : `images_to_pdf_collection.pdf`;

    return new File([pdfBlob], outputName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Failed to convert images to PDF. Ensure the files are valid images.');
  }
};
