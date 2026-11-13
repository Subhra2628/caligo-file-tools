
import { createWorker } from 'tesseract.js';

let workerPromise = null;

export async function recognizePdfPage(canvas) {
  try {
    if (!workerPromise) {
      workerPromise = createWorker('eng');
    }

    const worker = await workerPromise;
    const result = await worker.recognize(canvas);

    return result.data.text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  } catch (error) {
    workerPromise = null;
    throw new Error(`OCR failed: ${error.message}`);
  }
}
