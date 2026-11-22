import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center px-5 py-8 sm:px-6 sm:py-12 lg:px-8"
      style={{
        background: 'var(--bg)',
        paddingTop: 'calc(var(--sat) + 2rem)',
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            The Manager
          </h1>
          <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '6px', letterSpacing: '0.5px' }}>
            Artist Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', textAlign: 'center', marginBottom: '20px' }}>
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h2>

          <form className="space-y-4" onSubmit={isSignUp ? handleSignUp : handleLogin}>
            {isSignUp && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--status-red-bg)',
                border: '1px solid rgba(221,85,85,0.2)',
                color: 'var(--status-red)',
                padding: '8px 12px',
                fontSize: '11px',
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: 'var(--status-green-bg)',
                border: '1px solid rgba(68,170,153,0.2)',
                color: 'var(--status-green)',
                padding: '8px 12px',
                fontSize: '11px',
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              style={{ padding: '10px 20px', marginTop: '8px' }}
            >
              {loading
                ? (isSignUp ? 'Creating Account...' : 'Signing in...')
                : (isSignUp ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>

          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="btn-secondary w-full"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
