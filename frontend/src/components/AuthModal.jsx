import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, initialMode = 'login', noticeMsg = '', onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMsg('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign Up Flow: registers account, but requires user to log in
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.message || 'Registration failed. Please check your details.');
        } else {

          setPassword('');
          setError('');
          setSuccessMsg('Account created successfully! Please enter your password to log in.');
          setMode('login');
        }
      } else {
        // Log In Flow: validates credentials and returns signed JWT token
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.message || 'Invalid email or password');
        } else {
          setName('');
          setEmail('');
          setPassword('');
          setError('');
          setSuccessMsg('');
          // Pass user & JWT token to parent to save in sessionStorage
          onAuthSuccess(data.user, data.token);
        }
      }
    } catch (err) {
      setError('Could not connect to the authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-header-left">
            <div className="auth-header-icon">
              {mode === 'login' ? (
                <LogIn size={20} color="#ffffff" />
              ) : (
                <UserPlus size={20} color="#ffffff" />
              )}
            </div>
            <div>
              <h2 className="auth-modal-title">
                {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <span className="auth-modal-subtitle">
                {mode === 'login'
                  ? 'Log in to save books and sync your wishlist'
                  : 'Sign up to compare prices across Finland'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMsg('');
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Notice Message Banner (e.g. Please Login to access the wishlist) */}
        {noticeMsg && mode === 'login' && !error && !successMsg && (
          <div className="auth-notice-banner">
            <Lock size={15} color="#fbbf24" />
            <span>{noticeMsg}</span>
          </div>
        )}

        {/* Success Alert Banner (e.g. after signup) */}
        {successMsg && (
          <div className="auth-success-alert">
            <CheckCircle2 size={16} color="#34d399" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={16} color="#f43f5e" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field-group">
              <label className="auth-field-label">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Matti Virtanen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div className="auth-field-group">
            <label className="auth-field-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus={mode === 'login'}
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-field-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-btn-spinner"></span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <div className="auth-modal-footer">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccessMsg('');
                }}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
