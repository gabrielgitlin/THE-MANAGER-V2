// src/components/contacts/PaymentTab.tsx
import React, { useState, useEffect } from 'react';
import { getContactPaymentInfo, upsertContactPaymentInfo } from '../../lib/contacts';
import type { ContactPaymentInfo, ContactPaymentFormData } from '../../types/contacts';

const EMPTY_FORM: ContactPaymentFormData = {
  bankName: '', accountHolderName: '', routingNumber: '', accountNumber: '',
  accountType: undefined, swiftCode: '', iban: '', bankAddress: '',
  paypalEmail: '', venmoHandle: '', zelleContact: '',
  taxId: '', w9OnFile: false,
};

function mask(val: string | undefined, show = 4): string {
  if (!val) return '—';
  if (val.length <= show) return val;
  return '•'.repeat(val.length - show) + val.slice(-show);
}

export default function PaymentTab({ contactId }: { contactId: string }) {
  const [data, setData] = useState<ContactPaymentInfo | null>(null);
  const [form, setForm] = useState<ContactPaymentFormData>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, [contactId]);

  async function load() {
    try {
      setIsLoading(true);
      const result = await getContactPaymentInfo(contactId);
      setData(result);
      if (result) {
        setForm({
          bankName: result.bankName ?? '',
          accountHolderName: result.accountHolderName ?? '',
          routingNumber: result.routingNumber ?? '',
          accountNumber: result.accountNumber ?? '',
          accountType: result.accountType,
          swiftCode: result.swiftCode ?? '',
          iban: result.iban ?? '',
          bankAddress: result.bankAddress ?? '',
          paypalEmail: result.paypalEmail ?? '',
          venmoHandle: result.venmoHandle ?? '',
          zelleContact: result.zelleContact ?? '',
          taxId: result.taxId ?? '',
          w9OnFile: result.w9OnFile,
        });
      }
    } catch { setError('Failed to load payment info.'); }
    finally { setIsLoading(false); }
  }

  function set<K extends keyof ContactPaymentFormData>(key: K, val: ContactPaymentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await upsertContactPaymentInfo(contactId, form);
      await load();
      setIsEditing(false);
    } catch { setError('Failed to save.'); }
    finally { setIsSaving(false); }
  }

  if (isLoading) return <p className="text-t3 text-sm">Loading...</p>;

  const hasAny = data && (
    data.bankName || data.routingNumber || data.accountNumber ||
    data.swiftCode || data.iban || data.paypalEmail ||
    data.venmoHandle || data.zelleContact || data.taxId || data.w9OnFile
  );

  // Edit form
  if (isEditing) {
    return (
      <div className="space-y-[28px]">
        {error && <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>}

        {/* Bank / ACH */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Bank / ACH</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['bankName',          'Bank Name'],
                ['accountHolderName', 'Account Holder Name'],
                ['routingNumber',     'Routing Number'],
                ['accountNumber',     'Account Number'],
              ] as Array<[keyof ContactPaymentFormData, string]>).map(([key, label]) => (
                <div key={key} className="form-field">
                  <label>{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
              <div className="form-field">
                <label>Account Type</label>
                <select
                  value={form.accountType ?? ''}
                  onChange={(e) =>
                    set('accountType', (e.target.value as 'checking' | 'savings') || undefined)
                  }
                >
                  <option value="">Select...</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Wire */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Wire / International</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['swiftCode',   'SWIFT / BIC Code'],
                ['iban',        'IBAN'],
                ['bankAddress', 'Bank Address'],
              ] as Array<[keyof ContactPaymentFormData, string]>).map(([key, label]) => (
                <div key={key} className="form-field">
                  <label>{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Digital */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Digital Payments</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                ['paypalEmail',  'PayPal (email)'],
                ['venmoHandle',  'Venmo (username)'],
                ['zelleContact', 'Zelle (email or phone)'],
              ] as Array<[keyof ContactPaymentFormData, string]>).map(([key, label]) => (
                <div key={key} className="form-field">
                  <label>{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tax */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Tax Information</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label>Tax ID (SSN or EIN)</label>
                <input
                  type="text"
                  value={form.taxId ?? ''}
                  onChange={(e) => set('taxId', e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
              <div className="form-field">
                <label>W-9 Status</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="w9OnFile"
                    checked={form.w9OnFile}
                    onChange={(e) => set('w9OnFile', e.target.checked)}
                  />
                  <label
                    htmlFor="w9OnFile"
                    className="text-t2 text-sm"
                    style={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 'normal' }}
                  >
                    W-9 has been received
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost btn-md" onClick={() => setIsEditing(false)}>Cancel</button>
          <button className="btn btn-primary btn-md" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Payment Info'}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasAny) {
    return (
      <div className="empty-state">
        <img src="/TM-File-negro.svg" className="pxi-xl icon-muted empty-state-icon" alt="" />
        <p className="empty-state-title">No payment information</p>
        <p className="empty-state-desc">
          Add bank details, wire info, digital payment handles, and tax information.
        </p>
        <button className="btn btn-primary btn-sm mt-4" onClick={() => setIsEditing(true)}>
          Add Payment Info
        </button>
      </div>
    );
  }

  // Read view (sensitive fields are masked)
  return (
    <div className="space-y-[28px]">
      <div className="flex justify-end">
        <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => setIsEditing(true)}>
          <img src="/TM-Pluma-negro.png" className="pxi-sm icon-white" alt="" />
          Edit
        </button>
      </div>

      {(data?.bankName || data?.routingNumber || data?.accountNumber) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Bank / ACH</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {data?.bankName          && <div><p className="section-header mb-0.5">Bank</p><p className="text-t1 text-sm">{data.bankName}</p></div>}
              {data?.accountHolderName && <div><p className="section-header mb-0.5">Account Holder</p><p className="text-t1 text-sm">{data.accountHolderName}</p></div>}
              {data?.routingNumber     && <div><p className="section-header mb-0.5">Routing #</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{mask(data.routingNumber)}</p></div>}
              {data?.accountNumber     && <div><p className="section-header mb-0.5">Account #</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{mask(data.accountNumber)}</p></div>}
              {data?.accountType       && <div><p className="section-header mb-0.5">Type</p><p className="text-t1 text-sm capitalize">{data.accountType}</p></div>}
            </div>
          </div>
        </div>
      )}

      {(data?.swiftCode || data?.iban) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Wire / International</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data?.swiftCode && <div><p className="section-header mb-0.5">SWIFT/BIC</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{data.swiftCode}</p></div>}
              {data?.iban      && <div><p className="section-header mb-0.5">IBAN</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{data.iban}</p></div>}
            </div>
          </div>
        </div>
      )}

      {(data?.paypalEmail || data?.venmoHandle || data?.zelleContact) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Digital Payments</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {data?.paypalEmail  && <div><p className="section-header mb-0.5">PayPal</p><p className="text-t1 text-sm">{data.paypalEmail}</p></div>}
              {data?.venmoHandle  && <div><p className="section-header mb-0.5">Venmo</p><p className="text-t1 text-sm">@{data.venmoHandle}</p></div>}
              {data?.zelleContact && <div><p className="section-header mb-0.5">Zelle</p><p className="text-t1 text-sm">{data.zelleContact}</p></div>}
            </div>
          </div>
        </div>
      )}

      {(data?.taxId || data?.w9OnFile) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Tax</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data?.taxId && (
                <div>
                  <p className="section-header mb-0.5">Tax ID</p>
                  <p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                    {mask(data.taxId)}
                  </p>
                </div>
              )}
              <div>
                <p className="section-header mb-0.5">W-9</p>
                <span className={`status-badge ${data?.w9OnFile ? 'badge-green' : 'badge-neutral'}`}>
                  {data?.w9OnFile ? 'On file' : 'Not received'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
