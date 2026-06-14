import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { supabase } from './supabase';
import './VaultHome.css';

const VaultHome = () => {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [vaults, setVaults] = useState([]);
    const [newVaultName, setNewVaultName] = useState('');
    const [loading, setLoading] = useState(true);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('about');

    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            Cookies.remove('sb-access-token');
            Cookies.remove('sb-refresh-token');
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            navigate('/login');
        }
    };



    const handleResetPassword = async () => {
        setResetLoading(true);
        setResetMessage('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                const { error } = await supabase.auth.resetPasswordForEmail(user.email);
                if (error) {
                    setResetMessage(`Error: ${error.message}`);
                } else {
                    setResetMessage('Password reset email sent! Check your inbox.');
                }
            } else {
                setResetMessage('Could not retrieve user email.');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setResetMessage('An unexpected error occurred.');
        } finally {
            setResetLoading(false);
        }
    };

    const fetchVaults = useCallback(async () => {
        try {
            const token = Cookies.get('sb-access-token');
            const res = await axios.get(`http://localhost:3000/vaults`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setVaults(res.data);
        } catch (err) {
            console.error('Failed to fetch vaults:', err);
        } finally {
            setLoading(false);
        }
    }, []); // uid removed as it's not used in fetchVaults

    const handleCreateVault = async (e) => {
        e.preventDefault();
        if (!newVaultName.trim()) return;
        try {
            const token = Cookies.get('sb-access-token');
            const res = await axios.post(`http://localhost:3000/vaults`, 
                { name: newVaultName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setVaults([res.data, ...vaults]);
            setNewVaultName('');
        } catch (err) {
            console.error('Failed to create vault:', err);
        }
    };

    const handleDeleteVault = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this vault and all its contents? This action cannot be undone.')) return;
        try {
            const token = Cookies.get('sb-access-token');
            await axios.delete(`http://localhost:3000/vaults/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVaults(vaults.filter(v => v.id !== id));
        } catch (err) {
            console.error('Failed to delete vault:', err);
        }
    };

    useEffect(() => {
        if (uid) fetchVaults();
    }, [uid, fetchVaults]);

    if (loading) return <div className="vault-home-loading">
        <div className="spinner"></div>
        <p>Initializing Your Knowledge Base...</p>
    </div>;

    return (
        <div className="vault-home-container">
            <header className="vault-home-header">
                <div className="brand-logo-container">
                    <svg className="brand-logo-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 20L12 4L17 20" />
                        <path d="M10 14H14" />
                    </svg>
                </div>
                <h1>LUNA</h1>
                <p>ACCESSING THE SCIENTIFIC KNOWLEDGE REPOSITORY</p>
            </header>

            <main className="vault-grid-section">
                <div className="vault-grid">
                    <div className="vault-card create-card">
                        <form onSubmit={handleCreateVault}>
                            <input 
                                type="text" 
                                value={newVaultName}
                                onChange={(e) => setNewVaultName(e.target.value)}
                                placeholder="New Vault Name..."
                            />
                            <button type="submit">Create New Vault</button>
                        </form>
                    </div>

                    {vaults.map((vault) => (
                        <div 
                            key={vault.id} 
                            className="vault-card"
                            onClick={() => navigate(`/${uid}/vault/${vault.id}`)}
                        >
                             <div className="vault-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20L12 4L17 20"></path><path d="M10 14H14"></path></svg></div>
                            <div className="vault-info">
                                <h3>{vault.name}</h3>
                                <p>ENCRYPTED ARCHIVE • {new Date(vault.created).toLocaleDateString()}</p>
                            </div>
                            <button 
                                className="delete-vault-btn"
                                onClick={(e) => handleDeleteVault(vault.id, e)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </main>

             <footer className="vault-home-footer">
                <button onClick={() => setIsSettingsOpen(true)}>SYSTEM_SETTINGS</button>
            </footer>

            {isSettingsOpen && (
                <div className="settings-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="settings-header">
                            <h2>Settings</h2>
                            <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>✕</button>
                        </div>
                        <div className="settings-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                                onClick={() => setActiveTab('about')}
                            >
                                About
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                                onClick={() => setActiveTab('account')}
                            >
                                Account
                            </button>
                        </div>
                        <div className="settings-content">
                            {activeTab === 'about' && (
                                <div className="tab-pane about-pane">
                                    <h3>LUNA_VAULT</h3>
                                    <p>CORE_ENGINE_V1.0.0</p>
                                    <p>Secured research-grade workspace for classified intellectual synthesis.</p>
                                    <p className="copyright">© 2026 LUNA_ARCHIVES</p>
                                </div>
                            )}
                            {activeTab === 'account' && (
                                <div className="tab-pane account-pane">
                                    <div className="account-section">
                                        <h3>Change Password</h3>
                                        <p style={{color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.9rem'}}>Update your password securely by verifying your current one.</p>
                                        <button className="secondary-btn" onClick={() => { setIsSettingsOpen(false); navigate('/change-password'); }}>
                                            Go to Change Password
                                        </button>
                                    </div>
                                    <div className="account-section">
                                        <h3>Forgot Password?</h3>
                                        <p style={{color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.9rem'}}>Send a password reset link to your email.</p>
                                        <button className="secondary-btn" onClick={handleResetPassword} disabled={resetLoading}>
                                            {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                        {resetMessage && <p className="password-msg">{resetMessage}</p>}
                                    </div>
                                    <div className="account-section danger-zone">
                                        <h3>Session</h3>
                                        <p>Sign out of your account on this device.</p>
                                        <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VaultHome;
