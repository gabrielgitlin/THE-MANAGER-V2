/**
 * Utility to detect a PDF's first page dimensions using pdfjs-dist.
 * This is used to size the preparation/signing overlay to exactly match
 * the rendered PDF, so field percentage coordinates map correctly.
 */
import * as pdfjs from 'pdfjs-dist';

let workerInitialized = false;

function ensureWorker() {
  if (!workerInitialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).href;
    workerInitialized = true;
  }
}

export interface PdfPageSize {
  /** PDF page width in points */
  widthPt: number;
  /** PDF page height in points */
  heightPt: number;
  /** Rendered width in pixels (= targetWidthPx) */
  widthPx: number;
  /** Rendered height in pixels, maintaining aspect ratio */
  heightPx: number;
}

/**
 * Returns the rendered pixel dimensions of the first page of a PDF URL,
 * scaled so that the page width equals `targetWidthPx`.
 */
export async function getPdfFirstPageSize(
  url: string,
  targetWidthPx = 850,
): Promise<PdfPageSize> {
  ensureWorker();

  const loadingTask = pdfjs.getDocument({
    url,
    disableAutoFetch: true,
    disableStream: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  const scale = targetWidthPx / viewport.width;

  return {
    widthPt: viewport.width,
    heightPt: viewport.height,
    widthPx: targetWidthPx,
    heightPx: Math.round(viewport.height * scale),
  };
}
