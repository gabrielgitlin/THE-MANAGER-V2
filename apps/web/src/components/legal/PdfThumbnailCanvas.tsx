/**
 * Renders the first page of a PDF as a small canvas thumbnail.
 * Reuses the same pdfjs-dist worker that SignaturePreparationModal uses.
 */
import React, { useEffect, useRef, useState } from 'react';
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

interface Props {
  url: string;
  /** Rendered pixel width — height is calculated from the page aspect ratio */
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function PdfThumbnailCanvas({ url, width = 52, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderHeight, setRenderHeight] = useState(Math.round(width * 1.414)); // A4 fallback
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!url) { setStatus('error'); return; }
    let cancelled = false;
    ensureWorker();

    (async () => {
      try {
        const task = pdfjs.getDocument({ url, disableAutoFetch: true, disableStream: true });
        const pdf = await task.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const scale = width / page.getViewport({ scale: 1 }).width;
        const vp = page.getViewport({ scale });
        const h = Math.round(vp.height);
        setRenderHeight(h);

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = width;
        canvas.height = h;

        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
        if (!cancelled) setStatus('done');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [url, width]);

  if (status === 'error') return null;

  return (
    <>
      {/* Placeholder while rendering — same dimensions to avoid layout shift */}
      {status === 'loading' && (
        <div
          style={{
            width,
            height: renderHeight,
            background: 'var(--surface-3)',
            flexShrink: 0,
            ...style,
          }}
          className={className}
        />
      )}
      <canvas
        ref={canvasRef}
        style={{
          width,
          height: renderHeight,
          display: status === 'done' ? 'block' : 'none',
          flexShrink: 0,
          ...style,
        }}
        className={className}
      />
    </>
  );
}
