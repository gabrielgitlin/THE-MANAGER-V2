// src/components/contacts/DocumentsTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getContactFiles, uploadContactFile, deleteContactFile, getContactFileDownloadUrl } from '../../lib/contacts';
import type { ContactFile } from '../../types/contacts';

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsTab({ contactId }: { contactId: string }) {
  const [files, setFiles] = useState<ContactFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, [contactId]);

  async function load() {
    try {
      setIsLoading(true);
      setFiles(await getContactFiles(contactId));
    } catch { setError('Failed to load documents.'); }
    finally { setIsLoading(false); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadContactFile(contactId, file, file.name.replace(/\.[^.]+$/, ''));
      await load();
    } catch { setError('Upload failed. Check file size (max 25 MB).'); }
    finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDownload(file: ContactFile) {
    try {
      const url = await getContactFileDownloadUrl(file.filePath);
      window.open(url, '_blank');
    } catch { setError('Failed to generate download link.'); }
  }

  async function handleDelete(file: ContactFile) {
    if (!window.confirm(`Delete "${file.fileName}"?`)) return;
    try {
      await deleteContactFile(file);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch { setError('Failed to delete file.'); }
  }

  if (isLoading) return <p className="text-t3 text-sm">Loading...</p>;

  return (
    <div className="space-y-[28px]">
      {error && (
        <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>
      )}

      <div className="flex justify-end">
        <button
          className="btn btn-primary btn-sm flex items-center gap-1"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <img src="/TM-Upload-negro.svg" className="pxi-sm icon-white" alt="" />
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <img src="/TM-File-negro.svg" className="pxi-xl icon-muted empty-state-icon" alt="" />
          <p className="empty-state-title">No documents</p>
          <p className="empty-state-desc">
            Upload passports, W-9s, contracts, NDAs, or any other relevant files.
            Files are stored privately and only accessible by your team.
          </p>
        </div>
      ) : (
        <div className="tm-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <img src="/TM-File-negro.svg" className="pxi-sm icon-muted flex-shrink-0" alt="" />
                        <span className="text-t1 text-sm">{file.fileName}</span>
                      </div>
                    </td>
                    <td className="text-t3 text-xs">{formatSize(file.fileSize)}</td>
                    <td className="text-t3 text-xs">
                      {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Download"
                          onClick={() => handleDownload(file)}
                        >
                          <img src="/TM-Download-negro.svg" className="pxi-sm icon-muted" alt="Download" />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete"
                          onClick={() => handleDelete(file)}
                        >
                          <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
