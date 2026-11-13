import imageCompression from 'browser-image-compression';

/**
 * Compresses an image directly in the browser.
 *
 * @param {File} file - The original image file
 * @param {Object} config - Compression settings
 * @param {string} config.mode - 'auto' | 'custom'
 * @param {number} config.targetKb - The exact KB target (used if mode is 'custom')
 * @returns {Promise<File>} - The compressed File object
 */
export const compressImage = async (file, { mode = 'auto', targetKb = 50 } = {}) => {
  const originalKb = file.size / 1024;
  let targetSizeMB;

  if (mode === 'custom') {
    // 1. CUSTOM MODE: User wants a specific KB size
    targetSizeMB = targetKb / 1024;
  } else {
    // 2. AUTO MODE: Smart lossless-like compression (reduces by ~30% - 50% visually losslessly)
    // If the image is already tiny, we don't want to compress it to 0.
    const autoTargetKb = Math.max(originalKb * 0.6, 50);
    targetSizeMB = autoTargetKb / 1024;
  }

  // Safety Check: Never attempt to "compress" a file to a larger size than the original
  if (targetSizeMB * 1024 > originalKb) {
    targetSizeMB = originalKb / 1024;
  }

  const options = {
    maxSizeMB: targetSizeMB,
    maxWidthOrHeight: 2048,      // Prevents massive 8K images from crashing mobile browsers
    useWebWorker: true,          // Uses multithreading so your UI animations don't lag
    initialQuality: mode === 'auto' ? 0.85 : 0.75, // Auto starts with higher quality
    alwaysKeepResolution: false  // Allows downscaling dimensions if necessary to hit strict KB targets
  };

  try {
    const compressedBlob = await imageCompression(file, options);

    // The library returns a Blob. We convert it back into a File object with the original name
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });

    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image. It might be corrupted or unsupported.');
  }
};
