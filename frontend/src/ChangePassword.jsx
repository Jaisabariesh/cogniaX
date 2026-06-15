import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import './ChangePassword.css';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'error' or 'success'
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        setUserId(user.id);
      } else {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setMessageType('error');
      setMessage('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setMessageType('error');
        setMessage('Current password is incorrect.');
        setLoading(false);
        return;
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setMessageType('error');
        setMessage(`Error updating password: ${updateError.message}`);
      } else {
        setMessageType('success');
        setMessage('Password successfully changed!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate(`/${userId}`), 2000);
      }
    } catch (err) {
      console.error('Unexpected error during password change:', err);
      setMessageType('error');
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-pwd-body">
      <div className="change-pwd-card">
        <h1 className="change-pwd-title">Change Password</h1>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <input
            type="password"
            placeholder="Current Password"
            className="change-pwd-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            className="change-pwd-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="change-pwd-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="change-pwd-btn" disabled={loading}>
            {loading ? 'Processing...' : 'Update Password'}
          </button>
        </form>
        {message && <p className={`change-pwd-msg ${messageType}`}>{message}</p>}
        
        <button 
          className="change-pwd-back" 
          onClick={() => navigate(userId ? `/${userId}` : '/login')}
        >
          Cancel & Return
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;

