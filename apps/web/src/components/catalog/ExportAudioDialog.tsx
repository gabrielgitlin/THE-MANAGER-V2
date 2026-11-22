import React, { useState } from 'react';
import Modal from '../Modal';

interface ExportAudioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  audioUrl?: string;
}

function extractFilename(url: string): string {
  try {
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    const match = last.match(/^\d+_(.+)$/);
    return match ? match[1] : last;
  } catch {
    return url;
  }
}

function isWav(url: string): boolean {
  return url.toLowerCase().includes('.wav');
}

async function convertWavToMp3(url: string, onProgress?: (msg: string) => void): Promise<Blob> {
  onProgress?.('Fetching audio…');
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  onProgress?.('Decoding audio…');
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  onProgress?.('Encoding MP3…');
  const lamejs = await import('lamejs');
  const Mp3Encoder = lamejs.default?.Mp3Encoder ?? (lamejs as any).Mp3Encoder;

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(numChannels > 1 ? 2 : 1, sampleRate, 128);

  // Convert Float32Array to Int16Array
  function floatToInt16(float32: Float32Array): Int16Array {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16;
  }

  const leftChannel = floatToInt16(audioBuffer.getChannelData(0));
  const rightChannel = numChannels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : leftChannel;

  const chunkSize = 1152;
  const mp3Data: Int8Array[] = [];

  for (let i = 0; i < leftChannel.length; i += chunkSize) {
    const leftChunk = leftChannel.subarray(i, i + chunkSize);
    const rightChunk = rightChannel.subarray(i, i + chunkSize);
    const encoded = numChannels > 1
      ? encoder.encodeBuffer(leftChunk, rightChunk)
      : encoder.encodeBuffer(leftChunk);
    if (encoded.length > 0) mp3Data.push(encoded);
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) mp3Data.push(flushed);

  const totalLen = mp3Data.reduce((acc, arr) => acc + arr.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of mp3Data) {
    merged.set(new Uint8Array(chunk.buffer), offset);
    offset += chunk.length;
  }

  return new Blob([merged], { type: 'audio/mpeg' });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function directDownload(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  triggerDownload(blob, filename);
}

export default function ExportAudioDialog({
  isOpen,
  onClose,
  trackTitle,
  audioUrl,
}: ExportAudioDialogProps) {
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filename = audioUrl ? extractFilename(audioUrl) : '';
  const wav = audioUrl ? isWav(audioUrl) : false;

  const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';

  const handleDownloadDirect = async () => {
    if (!audioUrl) return;
    setConverting(true);
    setProgress('Preparing download…');
    setError(null);
    try {
      await directDownload(audioUrl, filename);
    } catch (err: any) {
      setError(err?.message || 'Download failed.');
    } finally {
      setConverting(false);
      setProgress('');
    }
  };

  const handleDownloadMp3 = async () => {
    if (!audioUrl) return;
    setConverting(true);
    setError(null);
    try {
      const mp3Blob = await convertWavToMp3(audioUrl, msg => setProgress(msg));
      const mp3Filename = filename.replace(/\.[^.]+$/, '') + '.mp3';
      triggerDownload(mp3Blob, mp3Filename);
    } catch (err: any) {
      setError(err?.message || 'Conversion failed.');
    } finally {
      setConverting(false);
      setProgress('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Audio" maxWidth="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div style={{ color: 'var(--status-red)', fontSize: 13, padding: '8px 12px', background: 'var(--status-red-bg)', border: '1px solid var(--status-red)' }}>
            {error}
          </div>
        )}

        <div>
          <p style={{ color: 'var(--t1)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{trackTitle}</p>
          {filename && (
            <p style={{ color: 'var(--t3)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{filename}</p>
          )}
        </div>

        {!audioUrl ? (
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>No audio file attached to this track.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {converting && progress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: 13, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--border-2)', borderTopColor: 'var(--brand-1)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                {progress}
              </div>
            )}

            {wav ? (
              <>
                <button
                  className="btn btn-secondary"
                  disabled={converting}
                  onClick={handleDownloadDirect}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                >
                  <img src="/TM-Download-negro.svg" alt="" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.7 }} />
                  Download WAV
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={converting}
                  onClick={handleDownloadMp3}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                >
                  <img src="/TM-Download-negro.svg" alt="" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.7 }} />
                  {converting ? 'Converting to MP3…' : 'Download MP3'}
                </button>
              </>
            ) : (
              <button
                className="btn btn-secondary"
                disabled={converting}
                onClick={handleDownloadDirect}
                style={{ justifyContent: 'flex-start', gap: 10 }}
              >
                <img src="/TM-Download-negro.svg" alt="" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.7 }} />
                {converting ? 'Downloading…' : `Download ${ext}`}
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}
