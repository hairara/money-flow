import React from 'react';
import './App.css';
import { createIncome } from './database';

function App() {
  return <Dashboard />;
}

// Dashboard dengan dummy data
function Dashboard() {
  // state income (REAL INPUT)
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');

  const handleAddIncome = async () => {
  if (!incomeName || !incomeAmount) return;

  await createIncome(
    new Date().toISOString().slice(0, 10),
    incomeName,
    Number(incomeAmount),
    ''
  );

  setIncomeName('');
  setIncomeAmount('');  

  alert('Income tersimpan ✅');
    };

  // Dummy data
  const summary = {
    totalRemaining: 8750000,
    totalIncome: 11000000,
    totalExpense: 2250000,
    budgetUtilization: 20.5,
    overBudgetCount: 0
  };

  const envelopes = [
    {
      envelope: { id: 1, name: 'Living Cost' },
      total: 5800000,
      categories: [
        { id: 1, name: 'Makan', budget: 3000000, spent: 750000 },
        { id: 2, name: 'Transport', budget: 1500000, spent: 300000 },
        { id: 3, name: 'Skincare', budget: 500000, spent: 150000 },
        { id: 4, name: 'Hangout', budget: 2000000, spent: 1000000 }
      ]
    },
    {
      envelope: { id: 2, name: 'Savings' },
      total: 3950000,
      categories: [
        { id: 5, name: 'Dana Darurat', budget: 1500000, spent: 0 },
        { id: 6, name: 'Investasi', budget: 2000000, spent: 50000 },
        { id: 7, name: 'Dana Flexible', budget: 300000, spent: 0 },
        { id: 8, name: 'Dana Buffer', budget: 200000, spent: 0 }
      ]
    }
  ];

  return (
    <div style={{ marginTop: '40px', textAlign: 'left' }}>
    <h2>📊 Dashboard</h2>

    <h3>➕ Tambah Income</h3>
    <input
      type="text"
      placeholder="Nama income"
      value={incomeName}
      onChange={e => setIncomeName(e.target.value)}
    />
    <br /><br />
    <input
      type="number"
      placeholder="Nominal"
      value={incomeAmount}
      onChange={e => setIncomeAmount(e.target.value)}
    />
    <br /><br />
    <button onClick={handleAddIncome}>
      Simpan Income
    </button>

      
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
        {envelopes.map(({ envelope, total, categories }) => (
          <EnvelopeCard 
            key={envelope.id}
            envelope={envelope}
            total={total}
            categories={categories}
          />
        ))}
      </div>
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
        {categories.map((cat) => {
          const remaining = cat.budget - cat.spent;
          const percentage = (cat.spent / cat.budget) * 100;
          
          return (
            <div 
              key={cat.id}
              style={{
                padding: '15px 0',
                borderBottom: '1px solid #F0EBE3'
              }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div>
                  <div style={{ 
                    fontWeight: '600',
                    color: '#2C2C2C',
                    marginBottom: '4px'
                  }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
                    Sisa: Rp {remaining.toLocaleString('id-ID')} dari Rp {cat.budget.toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: '600',
                  color: percentage >= 90 ? '#D65D5D' : percentage >= 75 ? '#E8A87C' : '#2D5F4C'
                }}>
                  {percentage.toFixed(0)}%
                </div>
              </div>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: '#F5F1EA',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(percentage, 100)}%`,
                  height: '100%',
                  background: percentage >= 90 
                    ? 'linear-gradient(90deg, #D65D5D 0%, #E87D7D 100%)'
                    : percentage >= 75
                    ? 'linear-gradient(90deg, #E8A87C 0%, #F5C9A0 100%)'
                    : 'linear-gradient(90deg, #2D5F4C 0%, #3D7F6C 100%)',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;