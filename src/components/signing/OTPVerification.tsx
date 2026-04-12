import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface OTPVerificationProps {
  onVerified: () => void;
  onRequestOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  onVerifyOTP: (code: string) => Promise<{ success: boolean; message: string; remaining_attempts?: number }>;
  emailHint: string;
  recipientEmail?: string;
}

export default function OTPVerification({ onVerified, onRequestOTP, onVerifyOTP, emailHint, recipientEmail }: OTPVerificationProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(recipientEmail || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'code') {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await onRequestOTP(email);
      if (result.success) {
        setStep('code');
        setResendTimer(60);
        setCanResend(false);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    }
    setLoading(false);
  };

  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      handleVerifyOTP(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (fullCode: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await onVerifyOTP(fullCode);
      if (result.success) {
        onVerified();
      } else {
        setError(result.message);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setCode(['', '', '', '', '', '']);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendTimer(60);
    setCode(['', '', '', '', '', '']);
    setError('');
    await onRequestOTP(email);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
      <ShieldCheck size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />

      {step === 'email' ? (
        <>
          <h2 style={{ color: 'var(--t1)', marginBottom: '8px' }}>Verify Your Identity</h2>
          <p style={{ color: 'var(--t2)', marginBottom: '24px', fontSize: '14px' }}>
            Enter your email address to receive a verification code.
            {emailHint && <><br />Expected: {emailHint}</>}
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--t1)',
              fontSize: '16px',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleRequestOTP()}
          />
          {error && <p style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
          <button
            onClick={handleRequestOTP}
            disabled={loading || !email}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading || !email ? 'not-allowed' : 'pointer',
              opacity: loading || !email ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Send Verification Code
          </button>
        </>
      ) : (
        <>
          <h2 style={{ color: 'var(--t1)', marginBottom: '8px' }}>Enter Verification Code</h2>
          <p style={{ color: 'var(--t2)', marginBottom: '24px', fontSize: '14px' }}>
            We sent a 6-digit code to {email}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: '48px',
                  height: '56px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--t1)',
                }}
              />
            ))}
          </div>
          {error && <p style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
          {loading && <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '12px auto' }} />}
          <p style={{ color: 'var(--t3)', fontSize: '13px', marginTop: '16px' }}>
            {canResend ? (
              <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                Resend code
              </button>
            ) : resendTimer > 0 ? (
              `Resend in ${resendTimer}s`
            ) : null}
          </p>
        </>
      )}
    </div>
  );
}
