import { toPng, toBlob } from 'html-to-image';

export async function generateTicketPng(element: HTMLElement): Promise<string> {
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: 'transparent',
  });
  return dataUrl;
}

export async function generateTicketBlob(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: 'transparent',
  });
  if (!blob) throw new Error('Failed to generate ticket image');
  return blob;
}

export function downloadTicketImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
}
