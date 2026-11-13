import JSZip from 'jszip'

/**
 * Compresses any file into a ZIP archive in the browser.
 *
 * @param {File} file - The original file to compress
 * @param {Object} config - Compression settings
 * @param {number} config.level - Compression level (1 = fastest, 9 = maximum)
 * @param {Function} onProgress - Callback function for progress updates (0 to 100)
 * @returns {Promise<File>} - The compressed ZIP File object
 */
export const compressFileToZip = async (file, { level = 6 } = {}, onProgress) => {
  try {
    const zip = new JSZip();

    // Add the file to the zip archive
    zip.file(file.name, file);

    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: level },
      },
      (metadata) => {
        if (onProgress) {
          onProgress(Math.round(metadata.percent));
        }
      }
    );

    // Safely extract the original file name without its extension
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    return new File([zipBlob], `${originalName}_compressed.zip`, {
      type: 'application/zip',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('ZIP Error:', error);
    throw new Error('Failed to create ZIP archive.');
  }
};
