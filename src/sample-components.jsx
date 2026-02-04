// ========================================
// SAMPLE-COMPONENTS.JSX - Example Usage
// ========================================
// Sample React components showing how to use the hooks and database

import React, { useState } from 'react';
import {
  useDashboard,
  useEnvelopeCard,
  useCreateExpense,
  useCreateIncome,
  useAllocateIncome,
  useEndOfMonthReview,
  useProcessCarryOver,
  useCurrentMonth,
  useBackupRestore
} from './hooks.js';

// ===== DASHBOARD COMPONENT =====
export const Dashboard = () => {
  const { currentMonth } = useCurrentMonth();
  const { summary, envelopeTotals, loading, error, reload } = useDashboard(currentMonth);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!summary) return <div>No data</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard - {currentMonth}</h1>
      
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sisa Uang</div>
          <div className="stat-value">
            Rp {summary.totalRemaining.toLocaleString('id-ID')}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">
            Rp {summary.totalIncome.toLocaleString('id-ID')}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Expense</div>
          <div className="stat-value">
            Rp {summary.totalExpense.toLocaleString('id-ID')}
          </div>
          <div className="stat-change">
            {summary.budgetUtilization.toFixed(1)}% dari budget
          </div>
        </div>
      </div>

      {/* Envelope Cards */}
      <div className="envelope-grid">
        {envelopeTotals.map(({ envelope, total, categories }) => (
          <EnvelopeCard 
            key={envelope.id} 
            envelope={envelope} 
            month={currentMonth}
          />
        ))}
      </div>

      {/* Alerts */}
      {summary.overBudgetCount > 0 && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <div>
            {summary.overBudgetCount} kategori over budget bulan ini!
          </div>
        </div>
      )}
    </div>
  );
};

// ===== ENVELOPE CARD COMPONENT =====
export const EnvelopeCard = ({ envelope, month }) => {
  const { data, loading, error } = useEnvelopeCard(envelope.id, month);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="envelope-card">
      <div className="envelope-header">
        <div className="envelope-name">{envelope.name}</div>
        <div className="envelope-total">
          Rp {data.total.toLocaleString('id-ID')}
        </div>
      </div>
      
      <div className="envelope-body">
        {data.categories.map((cat) => {
          const { breakdown } = cat;
          const percentage = (breakdown.totalSpent / breakdown.originalBudget) * 100;
          
          return (
            <div key={cat.id} className="category-item">
              <div className="category-info">
                <div className="category-name">{cat.name}</div>
                
                {/* Show subsidy info if exists */}
                {breakdown.subsidyGiven > 0 && (
                  <div className="subsidy-info">
                    🔄 Subsidi ke kategori lain: Rp {breakdown.subsidyGiven.toLocaleString('id-ID')}
                  </div>
                )}
                {breakdown.subsidyReceived > 0 && (
                  <div className="subsidy-info">
                    🔄 Terima subsidi: Rp {breakdown.subsidyReceived.toLocaleString('id-ID')}
                  </div>
                )}
                
                <div className="category-budget">
                  Sisa: Rp {breakdown.remaining.toLocaleString('id-ID')} 
                  {' '}dari Rp {breakdown.originalBudget.toLocaleString('id-ID')}
                </div>
                
                <div className="category-progress">
                  <div 
                    className={`category-progress-bar ${
                      percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : ''
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="category-amount">
                {breakdown.utilizationPercent.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== ADD EXPENSE COMPONENT =====
export const AddExpensePage = () => {
  const { currentMonth } = useCurrentMonth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    amount: '',
    note: ''
  });
  
  const [showSubsidyModal, setShowSubsidyModal] = useState(false);
  const [subsidyFromCategory, setSubsidyFromCategory] = useState('');
  
  const { 
    create, 
    createWithSubsidy, 
    creating, 
    error, 
    needsSubsidy, 
    subsidyInfo,
    clearSubsidyInfo 
  } = useCreateExpense();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await create(
        formData.date,
        parseInt(formData.categoryId),
        parseFloat(formData.amount),
        formData.note
      );
      
      // Success - reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        amount: '',
        note: ''
      });
      alert('Expense berhasil ditambahkan!');
    } catch (err) {
      if (needsSubsidy) {
        // Show subsidy modal
        setShowSubsidyModal(true);
      } else {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleSubsidySubmit = async () => {
    try {
      await createWithSubsidy(
        formData.date,
        parseInt(formData.categoryId),
        parseFloat(formData.amount),
        parseInt(subsidyFromCategory),
        formData.note,
        `Budget habis, ambil dari kategori donor`
      );
      
      // Success
      setShowSubsidyModal(false);
      clearSubsidyInfo();
      setSubsidyFromCategory('');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        amount: '',
        note: ''
      });
      alert('Expense dengan subsidi berhasil ditambahkan!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="add-expense-page">
      <h1>Add Expense</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input
            type="date"
            className="form-input"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Kategori</label>
          <select
            className="form-select"
            value={formData.categoryId}
            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
            required
          >
            <option value="">Pilih kategori...</option>
            {/* TODO: Load categories from database */}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Jumlah</label>
          <input
            type="number"
            className="form-input"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Catatan (Optional)</label>
          <textarea
            className="form-textarea"
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            rows="3"
          ></textarea>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? 'Menyimpan...' : '💾 Simpan Expense'}
        </button>
      </form>

      {/* Subsidy Modal */}
      {showSubsidyModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Budget Habis!</h2>
              <p className="modal-subtitle">
                Kategori tidak punya sisa budget. Pilih kategori lain untuk subsidi.
              </p>
            </div>

            <div className="alert alert-warning">
              <span className="alert-icon">⚠️</span>
              <div>
                Expense: <strong>Rp {parseFloat(formData.amount).toLocaleString('id-ID')}</strong>
                <br />
                Budget tersisa: <strong>Rp {(subsidyInfo?.available || 0).toLocaleString('id-ID')}</strong>
                <br />
                Kurang: <strong>Rp {((subsidyInfo?.required || 0) - (subsidyInfo?.available || 0)).toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ambil Budget dari Kategori:</label>
              <select
                className="form-select"
                value={subsidyFromCategory}
                onChange={(e) => setSubsidyFromCategory(e.target.value)}
              >
                <option value="">Pilih kategori...</option>
                {/* TODO: Load categories with remaining budget */}
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn btn-primary" 
                onClick={handleSubsidySubmit}
                disabled={!subsidyFromCategory || creating}
              >
                ✅ Confirm Subsidi
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowSubsidyModal(false);
                  clearSubsidyInfo();
                }}
              >
                ❌ Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== INCOME & ALLOCATION COMPONENT =====
export const IncomeAllocationPage = () => {
  const { currentMonth } = useCurrentMonth();
  const [step, setStep] = useState(1); // 1: Input Income, 2: Allocate
  const [incomeId, setIncomeId] = useState(null);
  const [totalIncome, setTotalIncome] = useState(0);
  
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '',
    amount: '',
    note: ''
  });
  
  const [allocations, setAllocations] = useState([]);
  
  const { create: createIncomeFunc, creating: creatingIncome } = useCreateIncome();
  const { allocate, allocating } = useAllocateIncome();

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await createIncomeFunc(
        incomeForm.date,
        incomeForm.source,
        parseFloat(incomeForm.amount),
        incomeForm.note
      );
      
      setIncomeId(result.id);
      setTotalIncome(parseFloat(incomeForm.amount));
      setStep(2);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    
    // Validate total allocation
    const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
    
    if (Math.abs(totalAllocated - totalIncome) > 0.01) {
      alert('Total alokasi harus sama dengan total income!');
      return;
    }
    
    try {
      await allocate(incomeId, allocations);
      
      // Success - reset
      alert('Income berhasil dialokasikan!');
      setStep(1);
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        source: '',
        amount: '',
        note: ''
      });
      setAllocations([]);
      setIncomeId(null);
      setTotalIncome(0);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (step === 1) {
    return (
      <div className="income-page">
        <h1>Input Income Baru</h1>
        
        <form onSubmit={handleIncomeSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                className="form-input"
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Sumber Income</label>
              <input
                type="text"
                className="form-input"
                value={incomeForm.source}
                onChange={(e) => setIncomeForm({...incomeForm, source: e.target.value})}
                placeholder="e.g., Gaji Bulanan, Freelance"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Jumlah</label>
            <input
              type="number"
              className="form-input"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
              placeholder="11000000"
              required
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Catatan (Optional)</label>
            <textarea
              className="form-textarea"
              value={incomeForm.note}
              onChange={(e) => setIncomeForm({...incomeForm, note: e.target.value})}
              rows="3"
              placeholder="Gaji periode Januari"
            ></textarea>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={creatingIncome}>
            {creatingIncome ? 'Menyimpan...' : '➡️ Lanjut ke Alokasi Budget'}
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Allocation
  return (
    <div className="income-page">
      <h1>Alokasi ke Budget Kategori</h1>
      
      <div className="alert alert-success">
        <span className="alert-icon">💰</span>
        <div>
          Total Income: <strong>Rp {totalIncome.toLocaleString('id-ID')}</strong>
          <br />
          Alokasikan ke masing-masing kategori.
        </div>
      </div>
      
      <form onSubmit={handleAllocationSubmit}>
        {/* TODO: Render allocation inputs for each category */}
        {/* This would dynamically load categories and allow user to input amounts */}
        
        <div className="flex-between mt-4">
          <div>
            <strong>Total Dialokasikan:</strong> Rp {
              allocations.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0).toLocaleString('id-ID')
            }
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={allocating}>
            {allocating ? 'Menyimpan...' : '💾 Simpan Alokasi'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ===== END OF MONTH REVIEW COMPONENT =====
export const EndOfMonthReviewPage = () => {
  const { currentMonth, nextMonth } = useCurrentMonth();
  const { categoriesWithRemaining, loading, error, reload } = useEndOfMonthReview(currentMonth);
  const { process, processing } = useProcessCarryOver();
  
  const [decisions, setDecisions] = useState({});

  const handleCarryOver = async (categoryId, action) => {
    try {
      const remaining = categoriesWithRemaining.find(
        c => c.category.id === categoryId
      )?.remaining;
      
      await process(categoryId, currentMonth, action, remaining);
      
      setDecisions({
        ...decisions,
        [categoryId]: action
      });
      
      reload();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const confirmAndCloseMonth = () => {
    const hasUndecided = categoriesWithRemaining.some(
      c => !decisions[c.category.id]
    );
    
    if (hasUndecided) {
      alert('Masih ada kategori yang belum diputuskan!');
      return;
    }
    
    // Create monthly snapshot
    alert('Bulan berhasil ditutup!');
    nextMonth(); // Move to next month
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="review-page">
      <h1>End of Month Review - {currentMonth}</h1>
      
      <div className="alert alert-warning">
        <span className="alert-icon">⚠️</span>
        <div>
          Tentukan apa yang mau dilakukan dengan sisa budget di setiap kategori.
        </div>
      </div>

      {categoriesWithRemaining.map(({ category, remaining, breakdown }) => (
        <div key={category.id} className="card mb-4">
          <div className="category-item">
            <div className="category-info">
              <div className="category-name">{category.name}</div>
              <div className="category-budget">
                Sisa budget: Rp {remaining.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleCarryOver(category.id, 'carry')}
                disabled={processing || decisions[category.id]}
              >
                {decisions[category.id] === 'carry' ? '✓ Carried' : '↗️ Carry Over'}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={() => handleCarryOver(category.id, 'reset')}
                disabled={processing || decisions[category.id]}
              >
                {decisions[category.id] === 'reset' ? '✓ Reset' : '🔄 Reset'}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-2 mt-4">
        <button 
          className="btn btn-accent"
          onClick={confirmAndCloseMonth}
          disabled={processing}
        >
          ✅ Confirm & Tutup Bulan
        </button>
      </div>
    </div>
  );
};

// ===== BACKUP/RESTORE COMPONENT =====
export const BackupRestorePage = () => {
  const { exportData, importData, processing, error } = useBackupRestore();
  const [fileInput, setFileInput] = useState(null);

  const handleExport = async () => {
    try {
      await exportData();
      alert('Backup berhasil di-download!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!confirm('Import akan menghapus semua data yang ada. Lanjutkan?')) {
      return;
    }
    
    try {
      await importData(file);
      alert('Data berhasil di-restore!');
      window.location.reload(); // Reload to refresh all data
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="backup-page">
      <h1>Backup & Restore</h1>
      
      <div className="card">
        <h2>Export Backup</h2>
        <p>Download semua data dalam format JSON</p>
        <button 
          className="btn btn-primary"
          onClick={handleExport}
          disabled={processing}
        >
          📦 Download Backup
        </button>
      </div>

      <div className="card mt-4">
        <h2>Import/Restore</h2>
        <p>Upload file backup untuk restore data</p>
        
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Warning:</strong> Import akan menghapus semua data yang ada!
          </div>
        </div>
        
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={processing}
        />
      </div>
    </div>
  );
};

// Export all components
export default {
  Dashboard,
  EnvelopeCard,
  AddExpensePage,
  IncomeAllocationPage,
  EndOfMonthReviewPage,
  BackupRestorePage
};
