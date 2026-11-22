import React, { useRef, useState } from 'react';
import { Link2 } from 'lucide-react';
import {
  detectSourceFromUrl,
  guessNameFromUrl,
  isValidHttpUrl,
  type AssetSourceType,
  type AssetSubmission,
} from '../../lib/assetSources';

type Mode = 'upload' | 'link';

interface AssetInputProps {
  /** Called when the user clicks the Add button with a valid submission. */
  onSubmit: (submission: AssetSubmission) => void | Promise<void>;
  /** Optional accept= for the hidden file input (e.g. "image/*,application/pdf") */
  accept?: string;
  /** Disable the inputs while the parent is saving. */
  disabled?: boolean;
  /** Show compact layout (used inside narrow forms). */
  compact?: boolean;
  /** Label on the submit button. */
  submitLabel?: string;
  /**
   * If true the component keeps its internal state after submit so the user
   * can add multiple items in sequence. Defaults to true.
   */
  resetOnSubmit?: boolean;
}

/**
 * Unified "attach file or paste a cloud link" control used everywhere in
 * The Manager that supports user-provided assets. Parent is responsible for
 * the actual persistence — this component just collects the right shape.
 *
 * Native cloud pickers (Google Picker, Dropbox Chooser, SharePoint Picker)
 * can be slotted into the "Add Link" tab later; the submission shape is
 * already compatible.
 */
export default function AssetInput({
  onSubmit,
  accept,
  disabled,
  compact,
  submitLabel = 'Add',
  resetOnSubmit = true,
}: AssetInputProps) {
  const [mode, setMode] = useState<Mode>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setUrl('');
    setName('');
    setError(null);
  };

  const pickFile = (f: File | null) => {
    setFile(f);
    if (f && !name) setName(f.name);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const handleSubmit = async () => {
    setError(null);

    if (mode === 'upload') {
      if (!file) {
        setError('Choose a file first');
        return;
      }
      const submission: AssetSubmission = {
        name: name || file.name,
        sourceType: 'upload',
        file,
        mimeType: file.type || undefined,
        size: file.size,
      };
      try {
        setBusy(true);
        await onSubmit(submission);
        if (resetOnSubmit) reset();
      } catch (err: any) {
        setError(err?.message || 'Upload failed');
      } finally {
        setBusy(false);
      }
      return;
    }

    // link mode
    const trimmed = url.trim();
    if (!trimmed || !isValidHttpUrl(trimmed)) {
      setError('Paste a full https:// link');
      return;
    }
    const sourceType: AssetSourceType = detectSourceFromUrl(trimmed);
    const submission: AssetSubmission = {
      name: name || guessNameFromUrl(trimmed),
      sourceType,
      url: trimmed,
    };
    try {
      setBusy(true);
      await onSubmit(submission);
      if (resetOnSubmit) reset();
    } catch (err: any) {
      setError(err?.message || 'Could not save link');
    } finally {
      setBusy(false);
    }
  };

  const isDisabled = disabled || busy;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: compact ? 12 : 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          disabled={isDisabled}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            background: mode === 'upload' ? 'var(--brand-1)' : 'var(--surface-2)',
            color: mode === 'upload' ? '#fff' : 'var(--t2)',
            border: 'none',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <img src="/TM-Upload-negro.svg" className="pxi-sm icon-white" alt="" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          disabled={isDisabled}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            background: mode === 'link' ? 'var(--brand-1)' : 'var(--surface-2)',
            color: mode === 'link' ? '#fff' : 'var(--t2)',
            border: 'none',
            borderLeft: '1px solid var(--border)',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Link2 size={14} />
          Add Link
        </button>
      </div>

      {/* Body */}
      {mode === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDisabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isDisabled && fileInputRef.current?.click()}
          style={{
            border: `1px dashed ${isDragging ? 'var(--brand-1)' : 'var(--border)'}`,
            padding: compact ? 16 : 24,
            textAlign: 'center',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            background: isDragging ? 'var(--surface-2)' : 'transparent',
          }}
        >
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <img src="/TM-File-negro.svg" className="pxi-md icon-muted" alt="" />
              <span style={{ color: 'var(--t1)', fontSize: 14 }}>{file.name}</span>
              <span style={{ color: 'var(--t3)', fontSize: 12 }}>
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); pickFile(null); }}
                disabled={isDisabled}
                style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}
                aria-label="Remove file"
              >
                <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="" />
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--t3)', fontSize: 13 }}>
              <img src="/TM-Upload-negro.svg" className="pxi-lg icon-muted" style={{ margin: '0 auto 6px', display: 'block' }} alt="" />
              Click or drag a file here
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            disabled={isDisabled}
            style={{ display: 'none' }}
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://drive.google.com/... or https://www.dropbox.com/... or https://*.sharepoint.com/..."
            disabled={isDisabled}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--t1)',
              fontSize: 14,
              width: '100%',
            }}
          />
          <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
            Paste a share link from Google Drive, Dropbox, SharePoint, or OneDrive. Make sure the
            link is viewable by the people who should have access — The Manager only stores the
            reference.
          </p>
        </div>
      )}

      {/* Name override */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Display name (optional)"
        disabled={isDisabled}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          color: 'var(--t1)',
          fontSize: 14,
          width: '100%',
        }}
      />

      {error && (
        <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            background: 'var(--brand-1)',
            color: '#fff',
            border: 'none',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
