import React, { useState } from 'react';
import { setupInitialData } from './setupData.js';
import './App.css';

function App() {
  const [message, setMessage] = useState('Klik tombol untuk setup data awal');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setMessage('Setting up data...');
    
    const result = await setupInitialData();
    
    if (result.success) {
      setMessage('✅ Data setup berhasil! Refresh page untuk liat hasilnya.');
    } else {
      setMessage('❌ Error: ' + result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="App" style={{ padding: '40px', textAlign: 'center' }}>
      <h1>MoneyFlow Tracker</h1>
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
        {isLoading ? 'Loading...' : '🚀 Setup Data Awal'}
      </button>
    </div>
  );
}

export default App;