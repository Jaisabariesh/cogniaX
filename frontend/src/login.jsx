import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import { supabase } from './supabase';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const COOKIE_EXPIRY_YEARS = 10;

const Login = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  // 🔁 Store session tokens in cookies
  const persistSessionInCookies = (session) => {
    if (session) {
      Cookies.set('sb-access-token', session.access_token, { expires: COOKIE_EXPIRY_YEARS * 365 });
      Cookies.set('sb-refresh-token', session.refresh_token, { expires: COOKIE_EXPIRY_YEARS * 365 });
    }
  };

  // ✅ On initial load, try to restore session
  useEffect(() => {
    const restoreSession = async () => {
      // Don't auto-redirect if user is completing a password recovery via email link
      if (window.location.hash.includes('type=recovery')) {
        return;
      }

      const access_token = Cookies.get('sb-access-token');
      const refresh_token = Cookies.get('sb-refresh-token');

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });

        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          navigate(`/${data.user.id}`);
        } else {
          console.error('User fetch error:', error);
        }
      }
    };

    restoreSession();
  }, [navigate]);

  // 🔄 Persist updated tokens from Supabase to cookies (if changed manually)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        persistSessionInCookies(session);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsSettingNewPassword(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      alert(`Login error: ${error.message}`);
    } else {
      const { session, user } = data;
      if (session && user) {
        persistSessionInCookies(session);
        alert('Login successful!');
        navigate(`/${user.id}`);
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    });

    if (error) {
      alert(`Signup error: ${error.message}`);
    } else {
      const { session, user } = data;
      if (session && user) {
        persistSessionInCookies(session);
        alert('Signup successful!');
        navigate(`/${user.id}`);
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) {
      alert(`Reset error: ${error.message}`);
    } else {
      alert('Password reset link sent to your email.');
      setIsForgotPassword(false);
      setResetEmail('');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert(`Error updating password: ${error.message}`);
    } else {
      alert('Password updated successfully! You will now be redirected.');
      setIsSettingNewPassword(false);
      if (data?.user) {
        navigate(`/${data.user.id}`);
      }
    }
  };

  return (
    <>
      <div className={`half-screen-rectangle ${isLogin ? '' : 'move-right'}`} />

      {isLogin ? (
        <div className="login">
          <button className="right" onClick={() => { setIsLogin(false); setIsForgotPassword(false); }}>
            Not signed in yet?
          </button>
          
          {!isForgotPassword ? (
            <>
              <h1 className="title">Hello Again!</h1>
              <form onSubmit={handleLogin}>
                <div className="placeholders">
                  <input
                    type="text"
                    placeholder="Email"
                    className="input-box"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                  <br />
                  <input
                    type="password"
                    placeholder="Password"
                    className="input-box"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <br />
                </div>
                <button type="submit" className="signin-button">Sign In</button>
                <button 
                  type="button" 
                  className="forgot-password-link" 
                  onClick={() => setIsForgotPassword(true)}
                  style={{ display: 'block', background: 'none', border: 'none', color: '#ff0080', cursor: 'pointer', marginTop: '15px', fontSize: '14px', width: '100%' }}
                >
                  Forgot Password?
                </button>
              </form>
            </>
          ) : isSettingNewPassword ? (
            <>
              <h1 className="title" style={{ fontSize: '1.8rem' }}>Set New Password</h1>
              <form onSubmit={handleUpdatePassword}>
                <div className="placeholders">
                  <p style={{ color: '#eaeaea', marginBottom: '15px', fontSize: '14px' }}>Enter your new secured password below</p>
                  <input
                    type="password"
                    placeholder="New Password"
                    className="input-box"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <br />
                </div>
                <button type="submit" className="signin-button">Update Password</button>
              </form>
            </>
          ) : (
            <>
              <h1 className="title" style={{ fontSize: '1.8rem' }}>Reset Password</h1>
              <form onSubmit={handleForgotPassword}>
                <div className="placeholders">
                  <p style={{ color: '#eaeaea', marginBottom: '15px', fontSize: '14px' }}>Enter your email to receive a reset link</p>
                  <input
                    type="email"
                    placeholder="Email"
                    className="input-box"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <br />
                </div>
                <button type="submit" className="signin-button">Send Reset Link</button>
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(false)}
                  style={{ display: 'block', background: 'none', border: 'none', color: '#eaeaea', cursor: 'pointer', marginTop: '15px', fontSize: '14px', width: '100%', textDecoration: 'underline' }}
                >
                  Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <div className="signup visible">
          <button className="left" onClick={() => setIsLogin(true)}>
            Already there?
          </button>
          <h1 className="title-left">Getting started!</h1>
          <form onSubmit={handleSignup}>
            <div className="placeholders-left">
              <input
                type="text"
                placeholder="Email"
                className="input-box"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
              <br />
              <input
                type="password"
                placeholder="Password"
                className="input-box"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />
              <br />
            </div>
            <button type="submit" className="signup-button">Sign Up</button>
          </form>
        </div>
      )}
    </>
  );
};

export default Login;
