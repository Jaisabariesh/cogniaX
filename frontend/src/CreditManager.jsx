import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CreditManager = ({ uid }) => {
  const [credits, setCredits] = useState(0);

  const fetchCredits = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/user/${uid}`);
      setCredits(res.data.credits);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  };

  useEffect(() => {
    if (uid) fetchCredits();
  }, [uid]);

  return (
    <div style={{
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      marginBottom: '15px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>AI Credits</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00d2ff' }}>
        {credits}
      </div>
    </div>
  );
};

export default CreditManager;
