import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { API_URL, RAZORPAY_KEY_ID } from './config';

const CreditManager = ({ uid, refreshKey }) => {
  const [credits, setCredits] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(50);
  const [loading, setLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/credits/${uid}`);
      setCredits(res.data.credits);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, [uid]);

  useEffect(() => {
    if (uid) fetchCredits();
  }, [uid, refreshKey, fetchCredits]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleTopup = async () => {
    setLoading(true);

    try {
      // 1. ENSURE RAZORPAY IS LOADED
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Check your internet connection.');
      }

      // 2. CREATE ORDER (Backend)
      const orderRes = await axios.post(`${API_URL}/create-razorpay-order`, {
        amount: topupAmount,
        uid: uid
      });

      if (!orderRes.data?.id) {
        throw new Error(orderRes.data?.detail || 'Order creation failed');
      }

      const { id: order_id, amount, currency, key_id } = orderRes.data;
      console.log('✅ Order created:', order_id, 'using Key:', key_id);

      // 3. CHECKOUT (Frontend)
      const options = {
        key: key_id || RAZORPAY_KEY_ID, // Use backend key if available, fallback to config
        amount: amount,
        currency: currency,
        name: 'COGNIA',
        description: `Top up Credits`,
        order_id: order_id, 
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_URL}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              uid,
              creditsToAdd: topupAmount, 
            });

            if (verifyRes.data.success) {
              fetchCredits();
              setIsModalOpen(false);
              alert('Payment Successful! Credits added.');
            }
          } catch (err) {
            console.error('Verification failed:', err);
            const serverError = err.response?.data?.error || 'Verification failed';
            alert(`Payment verification failed: ${serverError}`);
          } finally {
            setLoading(false);
          }
        },
        theme: { color: '#3478f6' },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Topup error:', err);
      const msg = err.response?.data?.detail || err.message;
      alert(`Failed to initiate payment: ${msg}`);
      setLoading(false);
    }
  };

  // ---- Styles ----
  const styles = {
    wrapper: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '12px 16px',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    label: {
      color: '#888',
      fontSize: '13px',
      fontWeight: '500',
    },
    creditCount: {
      color: '#fff',
      fontSize: '20px',
      fontWeight: '700',
      letterSpacing: '-0.5px',
    },
    addBtn: {
      marginLeft: 'auto',
      width: '28px',
      height: '28px',
      borderRadius: '8px',
      background: '#3478f6',
      color: '#fff',
      border: 'none',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s',
    },
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    modal: {
      width: '100%',
      maxWidth: '400px',
      background: '#111',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '24px',
      boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: '24px 24px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '700',
      color: '#fff',
    },
    closeBtn: {
      background: 'transparent',
      border: 'none',
      color: '#fff',
      fontSize: '24px',
      cursor: 'pointer',
      lineHeight: 1,
    },
    modalBody: {
      padding: '0 24px 24px',
    },
    subtext: {
      color: '#888',
      fontSize: '14px',
      marginBottom: '16px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      background: 'rgba(0,255,127,0.10)',
      border: '1px solid rgba(0,255,127,0.20)',
      borderRadius: '999px',
      color: '#00ff7f',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '20px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '16px',
    },
    amtBtn: (selected) => ({
      padding: '16px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.15s',
      background: selected ? '#fff' : '#1a1a1a',
      color: selected ? '#000' : '#fff',
      border: selected ? '1px solid #fff' : '1px solid #2a2a2a',
    }),
    customInput: {
      width: '100%',
      padding: '14px',
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      color: '#fff',
      fontSize: '15px',
      fontWeight: '500',
      outline: 'none',
      boxSizing: 'border-box',
    },
    modalFooter: {
      padding: '20px 24px',
      background: '#0a0a0a',
    },
    payBtn: (disabled) => ({
      width: '100%',
      padding: '16px',
      background: disabled ? '#333' : '#fff',
      color: disabled ? '#666' : '#000',
      border: 'none',
      borderRadius: '14px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
    }),
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.row}>
        <span style={styles.label}>Credits</span>
        <span style={styles.creditCount} title="50 free monthly">{typeof credits === 'number' ? credits.toFixed ? Math.round(credits * 100) / 100 : credits : credits}</span>
        <button
          style={styles.addBtn}
          onClick={() => setIsModalOpen(true)}
          title="Top up credits"
        >
          +
        </button>
      </div>

      {isModalOpen && createPortal(
        <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Top Up Credits</h2>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.subtext}>1 Credit = ₹1 &nbsp;·&nbsp; Credits never expire</p>
              <div style={styles.badge}>⚡ UPI Supported</div>

              <div style={styles.grid}>
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    style={styles.amtBtn(topupAmount === amt)}
                    onClick={() => setTopupAmount(amt)}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                placeholder="Custom amount..."
                min={1}
                style={styles.customInput}
              />
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.payBtn(loading || topupAmount < 1)}
                onClick={handleTopup}
                disabled={loading || topupAmount < 1}
              >
                {loading ? 'Processing...' : `Pay ₹${topupAmount}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CreditManager;
