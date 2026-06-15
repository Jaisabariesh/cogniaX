import React, { useState, useEffect } from 'react';
import './Login.css';
import { supabase } from './supabase';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const COOKIE_EXPIRY_YEARS = 10;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot', 'reset'
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const persistSessionInCookies = (session) => {
    if (session) {
      Cookies.set('sb-access-token', session.access_token, { expires: COOKIE_EXPIRY_YEARS * 365 });
      Cookies.set('sb-refresh-token', session.refresh_token, { expires: COOKIE_EXPIRY_YEARS * 365 });
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (window.location.hash.includes('type=recovery')) {
        setAuthMode('reset');
        return;
      }

      const access_token = Cookies.get('sb-access-token');
      const refresh_token = Cookies.get('sb-refresh-token');

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        const { data } = await supabase.auth.getUser();
        if (data?.user) navigate(`/${data.user.id}`);
      }
    };
    restoreSession();
  }, [navigate]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) persistSessionInCookies(session);
      if (event === 'PASSWORD_RECOVERY') setAuthMode('reset');
    });
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Login error: ${error.message}`);
    } else if (data?.session && data?.user) {
      persistSessionInCookies(data.session);
      navigate(`/${data.user.id}`);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(`Signup error: ${error.message}`);
    } else if (data?.session && data?.user) {
      persistSessionInCookies(data.session);
      navigate(`/${data.user.id}`);
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      alert(`Reset error: ${error.message}`);
    } else {
      alert('Password reset link sent to your email.');
      setAuthMode('login');
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert(`Error updating password: ${error.message}`);
    } else {
      alert('Password updated successfully!');
      if (data?.user) navigate(`/${data.user.id}`);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert(`Google sign in error: ${error.message}`);
  };

  const renderContent = () => {
    switch (authMode) {
      case 'signup':
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">Get started with NoteBlurt today</p>
            </div>
            <form className="auth-form" onSubmit={handleSignup}>
              <input 
                type="email" 
                placeholder="Email" 
                className="input-pill" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-pill" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
            <div className="divider"><span>OR</span></div>
            <button className="btn-pill btn-secondary" onClick={handleGoogleSignIn}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
              Continue with Google
            </button>
            <div className="auth-footer">
              Already have an account? 
              <button className="auth-link" onClick={() => setAuthMode('login')}>Sign in</button>
            </div>
          </>
        );
      case 'forgot':
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-subtitle">Enter your email to receive a reset link</p>
            </div>
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <input 
                type="email" 
                placeholder="Email address" 
                className="input-pill" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Sending link...' : 'Send reset link'}
              </button>
            </form>
            <div className="auth-footer">
              Remember your password? 
              <button className="auth-link" onClick={() => setAuthMode('login')}>Sign in</button>
            </div>
          </>
        );
      case 'reset':
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Enter your new secured password below</p>
            </div>
            <form className="auth-form" onSubmit={handleUpdatePassword}>
              <input 
                type="password" 
                placeholder="New Password" 
                className="input-pill" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </>
        );
      default:
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your account</p>
            </div>
            <form className="auth-form" onSubmit={handleLogin}>
              <input 
                type="email" 
                placeholder="Email" 
                className="input-pill" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-pill" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              <button type="button" className="forgot-pwd-btn" onClick={() => setAuthMode('forgot')}>
                Forgot password?
              </button>
            </form>
            <div className="divider"><span>OR</span></div>
            <button className="btn-pill btn-secondary" onClick={handleGoogleSignIn}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
              Continue with Google
            </button>
            <div className="auth-footer">
              Don't have an account? 
              <button className="auth-link" onClick={() => setAuthMode('signup')}>Sign up</button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-wrapper">
        <div className="auth-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          NoteBlurt
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Login;
