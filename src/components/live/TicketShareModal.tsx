import React, { useRef, useState } from 'react';

import VintageTicket, { type VintageTicketData } from './VintageTicket';
import { generateTicketPng, generateTicketBlob, downloadTicketImage, sanitizeFilename } from '../../lib/ticketGenerator';

interface TicketShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: VintageTicketData;
}

export default function TicketShareModal({ isOpen, onClose, ticketData }: TicketShareModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await generateTicketPng(ticketRef.current);
      const filename = `ticket-${sanitizeFilename(ticketData.artistName)}-${ticketData.date}.png`;
      downloadTicketImage(dataUrl, filename);
    } catch (err) {
      console.error('Error generating ticket:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!ticketRef.current) return;
    setGenerating(true);
    try {
      const blob = await generateTicketBlob(ticketRef.current);
      const file = new File([blob], `ticket-${sanitizeFilename(ticketData.artistName)}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${ticketData.artistName} — ${ticketData.venueName}`,
          text: `${ticketData.artistName} live at ${ticketData.venueName}, ${ticketData.city}`,
          files: [file],
        });
      } else {
        await handleDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Error sharing:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!ticketRef.current) return;
    setGenerating(true);
    try {
      const blob = await generateTicketBlob(ticketRef.current);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-xl p-6" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-2)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>Share Ticket</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="" />
          </button>
        </div>

        {/* Ticket preview */}
        <div className="flex justify-center mb-6 overflow-auto">
          <VintageTicket ref={ticketRef} data={ticketData} scale={1} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-brand-1 text-white disabled:opacity-50"
          >
            <img src="/TM-Download-negro.svg" className="pxi-md icon-white" alt="" />
            {generating ? 'Generating...' : 'Download PNG'}
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            >
              <img src="/TM-Share-negro.svg" className="pxi-md icon-muted" alt="" />
              Share
            </button>
          )}

          <button
            onClick={handleCopyToClipboard}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
          >
            {copied ? <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" /> : <img src="/TM-Copy-negro.svg" className="pxi-md icon-muted" alt="" />}
            {copied ? 'Copied!' : 'Copy Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
