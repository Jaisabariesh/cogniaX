import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './VaultHome.css';

const VaultHome = () => {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [vaults, setVaults] = useState([]);
    const [newVaultName, setNewVaultName] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchVaults = useCallback(async () => {
        try {
            const token = Cookies.get('sb-access-token');
            const res = await axios.get(`http://localhost:3000/vaults/${uid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVaults(res.data);
        } catch (err) {
            console.error('Failed to fetch vaults:', err);
        } finally {
            setLoading(false);
        }
    }, [uid]);

    const handleCreateVault = async (e) => {
        e.preventDefault();
        if (!newVaultName.trim()) return;
        try {
            const token = Cookies.get('sb-access-token');
            const res = await axios.post(`http://localhost:3000/vaults/${uid}`, 
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
            await axios.delete(`http://localhost:3000/vaults/${id}`);
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
                <h1>COGNIA</h1>
                <p>Select a vault to begin your intellectual journey</p>
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
                            <div className="vault-icon">📁</div>
                            <div className="vault-info">
                                <h3>{vault.name}</h3>
                                <p>{new Date(vault.created).toLocaleDateString()}</p>
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
                <button onClick={() => navigate('/login')}>Sign Out</button>
            </footer>
        </div>
    );
};

export default VaultHome;
