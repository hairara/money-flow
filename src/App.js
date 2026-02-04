import React, { useState } from 'react';
import { setupInitialData } from './setupData';
import './App.css';

function App() {
  const [hasSetup, setHasSetup] = useState(false);
  const [message, setMessage] = useState('Klik tombol untuk setup data awal');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    try {
      setIsLoading(true);
      setMessage('🍼 Lagi nyiapin data...');

      const result = await setupInitialData();

      if (result.success) {
        setMessage('✅ Data setup BERHASIL!');
        setHasSetup(true); // 🔥 PINDAH MODE
    }

    } catch (err) {
      setMessage('❌ Fatal Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>MoneyFlow Tracker</h1>

    {!hasSetup ? (
      <>
        <p>{message}</p>

        <button
          onClick={handleSetup}
          disabled={isLoading}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            background: '#2D5F4C',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginTop: '20px'
          }}
        >
          {isLoading ? '⏳ Loading...' : '🚀 Setup Data Awal'}
        </button>
      </>
    ) : (
      <div style={{ marginTop: '40px' }}>
        <h2>📊 Dashboard</h2>
        <p>Data sudah siap 🎉</p>
        <p>(Next step: tampilkan data dari database)</p>
      </div>
    )}
  </div>
);

}

export default App;
