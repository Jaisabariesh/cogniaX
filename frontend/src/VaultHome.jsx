import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { supabase } from './supabase';
import { API_URL } from './config';
import './VaultHome.css';

const VaultHome = () => {
    useEffect(() => {
        // Force scrollability on the vault page
        document.documentElement.classList.add('vault-page-active');
        document.body.classList.add('vault-page-active');

        return () => {
            document.documentElement.classList.remove('vault-page-active');
            document.body.classList.remove('vault-page-active');
        };
    }, []);

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
            const res = await axios.get(`${API_URL}/vaults`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVaults(res.data);
        } catch (err) {
            console.error('Failed to fetch vaults:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreateVault = async (e) => {
        e.preventDefault();
        if (!newVaultName.trim()) return;
        try {
            const token = Cookies.get('sb-access-token');
            const res = await axios.post(`${API_URL}/vaults`, 
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
        if (!window.confirm('Are you sure you want to delete this vault? This action cannot be undone.')) return;
        try {
            const token = Cookies.get('sb-access-token');
            await axios.delete(`${API_URL}/vaults/${id}`, {
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

    if (loading) return (
        <div className="vault-home-loading">
            <div className="spinner"></div>
            <p style={{color: '#a3a3a3', fontSize: '0.9rem', fontWeight: 500}}>Opening Your Vaults...</p>
        </div>
    );

    return (
        <div className="vault-home-container">
            <header className="vault-home-header">
                <h1>Cognitive Vaults</h1>
                <p>Your cognitive architecture. Synthesis, simulation, and structured research start here.</p>
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
                            <div className="vault-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </div>
                            <div className="vault-info">
                                <h3>{vault.name}</h3>
                                <p>Created {new Date(vault.created).toLocaleDateString()}</p>
                            </div>
                            <button 
                                className="delete-vault-btn"
                                onClick={(e) => handleDeleteVault(vault.id, e)}
                                title="Delete Vault"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </main>

             <footer className="vault-home-footer">
                <button className="btn-settings" onClick={() => setIsSettingsOpen(true)}>
                    System Settings
                </button>
            </footer>

            {isSettingsOpen && (
                <div className="settings-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="settings-header">
                            <h2>Settings</h2>
                            <button className="close-btn" style={{background: 'none', border: 'none', color: '#737373', fontSize: '1.2rem', cursor: 'pointer'}} onClick={() => setIsSettingsOpen(false)}>✕</button>
                        </div>
                        <div className="settings-tabs" style={{display: 'flex', borderBottom: '1px solid #262626'}}>
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
                                    <h3>LUNA v1.0</h3>
                                    <p style={{color: '#a3a3a3', lineHeight: '1.6'}}>A high-performance workspace designed for intellectual synthesis and scientific capture.</p>
                                    <p style={{color: '#525252', fontSize: '0.8rem', marginTop: '40px'}}>© 2026 LUNA Interactive</p>
                                </div>
                            )}
                            {activeTab === 'account' && (
                                <div className="tab-pane account-pane">
                                    <div className="account-section">
                                        <h3>Security</h3>
                                        <button className="secondary-btn" onClick={() => { setIsSettingsOpen(false); navigate('/change-password'); }}>
                                            Update Password
                                        </button>
                                    </div>
                                    <div className="account-section">
                                        <h3>Session</h3>
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
