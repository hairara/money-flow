import React, { useState } from 'react';
import { setupInitialData } from './setupData.js';
import { useDashboard } from './hooks.js';
import './App.css';

function App() {
  const [showSetup, setShowSetup] = useState(false);
  
  return (
    <div className="App">
      {showSetup ? <SetupPage /> : <DashboardPage />}
    </div>
  );
}

// Setup Page Component
function SetupPage() {
  const [message, setMessage] = useState('Klik tombol untuk setup data awal');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setMessage('Setting up data...');
    
    const result = await setupInitialData();
    
    if (result.success) {
      setMessage('✅ Data setup berhasil! Refresh page untuk liat dashboard.');
    } else {
      setMessage('❌ Error: ' + result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>MoneyFlow Tracker - Setup</h1>
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

// Dashboard Page Component
function DashboardPage() {
  const { summary, envelopeTotals, loading, error } = useDashboard('2025-02');

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Loading Dashboard...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Error: {error}</h1>
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>No data found</h1>
        <p>Please setup data first</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>💰 MoneyFlow Tracker</h1>
      <h2>Dashboard - Februari 2025</h2>
      
      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '30px',
        marginBottom: '40px'
      }}>
        <StatCard 
          label="Total Sisa Uang"
          value={`Rp ${summary.totalRemaining.toLocaleString('id-ID')}`}
          color="#2D5F4C"
        />
        
        <StatCard 
          label="Total Income"
          value={`Rp ${summary.totalIncome.toLocaleString('id-ID')}`}
          color="#5B8FB9"
        />
        
        <StatCard 
          label="Total Expense"
          value={`Rp ${summary.totalExpense.toLocaleString('id-ID')}`}
          color="#D65D5D"
          subtitle={`${summary.budgetUtilization.toFixed(1)}% dari budget`}
        />
      </div>

      {/* Envelopes */}
      <h2>📊 Budget per Kantong</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
        marginTop: '20px'
      }}>
        {envelopeTotals.map(({ envelope, total, categories }) => (
          <EnvelopeCard 
            key={envelope.id}
            envelope={envelope}
            total={total}
            categories={categories}
          />
        ))}
      </div>

      {/* Alerts */}
      {summary.overBudgetCount > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '15px 20px',
          background: '#FFF8ED',
          border: '2px solid #E8A87C',
          borderRadius: '8px',
          color: '#8B5A00'
        }}>
          ⚠️ <strong>Warning:</strong> {summary.overBudgetCount} kategori over budget bulan ini!
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color, subtitle }) {
  return (
    <div style={{
      padding: '25px',
      background: 'white',
      border: '2px solid #E5E0D8',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        fontSize: '12px', 
        fontWeight: '600',
        color: '#6B6B6B',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '10px'
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: '700',
        color: color,
        marginBottom: '5px'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// Envelope Card Component
function EnvelopeCard({ envelope, total, categories }) {
  return (
    <div style={{
      background: 'white',
      border: '2px solid #E5E0D8',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 25px',
        background: 'linear-gradient(135deg, #2D5F4C 0%, #3D7F6C 100%)',
        color: 'white'
      }}>
        <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
          {envelope.name}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '700' }}>
          Rp {total.toLocaleString('id-ID')}
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: '15px 25px 25px' }}>
        {categories.map((cat) => (
          <CategoryItem key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}

// Category Item Component (simplified - no breakdown yet)
function CategoryItem({ category }) {
  return (
    <div style={{
      padding: '15px 0',
      borderBottom: '1px solid #F0EBE3'
    }}>
      <div style={{ 
        fontWeight: '600',
        color: '#2C2C2C',
        marginBottom: '5px'
      }}>
        {category.name}
      </div>
      <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
        Loading budget info...
      </div>
    </div>
  );
}

export default App;