// ========================================
// DATABASE.JS - Native IndexedDB (Simplified)
// ========================================

const DB_NAME = 'FinancialTrackerDB';
const DB_VERSION = 3;

// ===== DATABASE INITIALIZATION =====
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('envelopes')) {
        const envelopeStore = db.createObjectStore('envelopes', { keyPath: 'id', autoIncrement: true });
        envelopeStore.createIndex('name', 'name', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        categoryStore.createIndex('envelopeId', 'envelopeId', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('budgets')) {
        const budgetStore = db.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true });
        budgetStore.createIndex('categoryId', 'categoryId', { unique: false });
        budgetStore.createIndex('month', 'month', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('incomes')) {
        const incomeStore = db.createObjectStore('incomes', { keyPath: 'id', autoIncrement: true });
        incomeStore.createIndex('month', 'month', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('allocations')) {
        db.createObjectStore('allocations', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        expenseStore.createIndex('categoryId', 'categoryId', { unique: false });
        expenseStore.createIndex('month', 'month', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('subsidies')) {
        const subsidyStore = db.createObjectStore('subsidies', { keyPath: 'id', autoIncrement: true });
        subsidyStore.createIndex('fromCategoryId', 'fromCategoryId', { unique: false });
        subsidyStore.createIndex('toCategoryId', 'toCategoryId', { unique: false });
      }
    };
  });
};

// ===== UTILITY FUNCTIONS =====
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const formatDate = (date) => {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};

export const getMonthFromDate = (dateString) => {
  return dateString.substring(0, 7);
};

// ===== ENVELOPE OPERATIONS =====
export const createEnvelope = async (name, description = '', order = 0) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['envelopes'], 'readwrite');
    const store = tx.objectStore('envelopes');
    
    const envelope = {
      name,
      description,
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const request = store.add(envelope);
    
    request.onsuccess = () => {
      resolve({ id: request.result, ...envelope });
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getAllEnvelopes = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['envelopes'], 'readonly');
    const store = tx.objectStore('envelopes');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const envelopes = request.result.sort((a, b) => a.order - b.order);
      resolve(envelopes);
    };
    
    request.onerror = () => reject(request.error);
  });
};

// ===== CATEGORY OPERATIONS =====
export const createCategory = async (envelopeId, name, description = '', order = 0) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['categories'], 'readwrite');
    const store = tx.objectStore('categories');
    
    const category = {
      envelopeId,
      name,
      description,
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const request = store.add(category);
    
    request.onsuccess = () => {
      resolve({ id: request.result, ...category });
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getCategoriesByEnvelope = async (envelopeId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['categories'], 'readonly');
    const store = tx.objectStore('categories');
    const index = store.index('envelopeId');
    const request = index.getAll(envelopeId);
    
    request.onsuccess = () => {
      const categories = request.result.sort((a, b) => a.order - b.order);
      resolve(categories);
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getAllCategories = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['categories'], 'readonly');
    const store = tx.objectStore('categories');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ===== BUDGET OPERATIONS =====
export const setBudget = async (categoryId, month, budgetAmount, carriedOver = 0) => {
  const db = await initDB();
  
  // Check if budget exists
  const existing = await getBudget(categoryId, month);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['budgets'], 'readwrite');
    const store = tx.objectStore('budgets');
    
    const budgetData = {
      categoryId,
      month,
      budgetAmount,
      carriedOver,
      totalBudget: budgetAmount + carriedOver,
      updatedAt: new Date().toISOString()
    };
    
    let request;
    
    if (existing) {
      budgetData.id = existing.id;
      budgetData.createdAt = existing.createdAt;
      request = store.put(budgetData);
    } else {
      budgetData.createdAt = new Date().toISOString();
      request = store.add(budgetData);
    }
    
    request.onsuccess = () => {
      resolve({ id: request.result, ...budgetData });
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getBudget = async (categoryId, month) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['budgets'], 'readonly');
    const store = tx.objectStore('budgets');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const budget = request.result.find(
        b => b.categoryId === categoryId && b.month === month
      );
      resolve(budget || null);
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getBudgetsByMonth = async (month) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['budgets'], 'readonly');
    const store = tx.objectStore('budgets');
    const index = store.index('month');
    const request = index.getAll(month);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ===== INCOME OPERATIONS =====
export const createIncome = async (date, source, amount, note = '') => {
  const db = await initDB();
  const dateStr = formatDate(date);
  const month = getMonthFromDate(dateStr);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['incomes'], 'readwrite');
    const store = tx.objectStore('incomes');
    
    const income = {
      date: dateStr,
      month,
      source,
      amount,
      note,
      isAllocated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const request = store.add(income);
    
    request.onsuccess = () => {
      resolve({ id: request.result, ...income });
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getIncomesByMonth = async (month) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['incomes'], 'readonly');
    const store = tx.objectStore('incomes');
    const index = store.index('month');
    const request = index.getAll(month);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTotalIncome = async (month) => {
  const incomes = await getIncomesByMonth(month);
  return incomes.reduce((sum, income) => sum + income.amount, 0);
};

export const markIncomeAsAllocated = async (incomeId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['incomes'], 'readwrite');
    const store = tx.objectStore('incomes');
    const getRequest = store.get(incomeId);
    
    getRequest.onsuccess = () => {
      const income = getRequest.result;
      income.isAllocated = true;
      income.updatedAt = new Date().toISOString();
      
      const putRequest = store.put(income);
      putRequest.onsuccess = () => resolve(income);
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// ===== ALLOCATION OPERATIONS =====
export const allocateIncomeToBudgets = async (incomeId, allocations, type = 'income') => {
  const results = [];
  
  for (const allocation of allocations) {
    const { categoryId, month, amount, note = '' } = allocation;
    
    // Get or create budget
    let budget = await getBudget(categoryId, month);
    
    if (!budget) {
      budget = await setBudget(categoryId, month, amount, 0);
    } else {
      await setBudget(categoryId, month, budget.budgetAmount + amount, budget.carriedOver);
    }
    
    // Create allocation record
    const db = await initDB();
    const allocationId = await new Promise((resolve, reject) => {
      const tx = db.transaction(['allocations'], 'readwrite');
      const store = tx.objectStore('allocations');
      
      const allocationData = {
        incomeId,
        budgetId: budget.id,
        amount,
        type,
        note,
        createdAt: new Date().toISOString()
      };
      
      const request = store.add(allocationData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    results.push({ allocationId, budgetId: budget.id, categoryId, amount });
  }
  
  // Mark income as allocated
  if (incomeId) {
    await markIncomeAsAllocated(incomeId);
  }
  
  return results;
};

// ===== EXPENSE OPERATIONS =====
export const getExpensesByMonth = async (month) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['expenses'], 'readonly');
    const store = tx.objectStore('expenses');
    const index = store.index('month');
    const request = index.getAll(month);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getExpensesByCategory = async (categoryId, month) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['expenses'], 'readonly');
    const store = tx.objectStore('expenses');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const expenses = request.result.filter(
        e => e.categoryId === categoryId && e.month === month
      );
      resolve(expenses);
    };
    
    request.onerror = () => reject(request.error);
  });
};

// ===== SUBSIDY OPERATIONS =====
export const getSubsidiesGiven = async (categoryId, month) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['subsidies'], 'readonly');
    const store = tx.objectStore('subsidies');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const subsidies = request.result.filter(
        s => s.fromCategoryId === categoryId && s.month === month
      );
      resolve(subsidies);
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getSubsidiesReceived = async (categoryId, month) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['subsidies'], 'readonly');
    const store = tx.objectStore('subsidies');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const subsidies = request.result.filter(
        s => s.toCategoryId === categoryId && s.month === month
      );
      resolve(subsidies);
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const sumSubsidiesGiven = async (categoryId, month) => {
  const subsidies = await getSubsidiesGiven(categoryId, month);
  return subsidies.reduce((sum, s) => sum + s.amount, 0);
};

export const sumSubsidiesReceived = async (categoryId, month) => {
  const subsidies = await getSubsidiesReceived(categoryId, month);
  return subsidies.reduce((sum, s) => sum + s.amount, 0);
};

// ===== COMPUTED VALUES =====
export const sumExpenses = async (categoryId, month) => {
  const expenses = await getExpensesByCategory(categoryId, month);
  return expenses.reduce((sum, e) => sum + e.amount, 0);
};

export const getBudgetRemaining = async (categoryId, month) => {
  const budget = await getBudget(categoryId, month);
  if (!budget) return 0;
  
  const totalExpenses = await sumExpenses(categoryId, month);
  const subsidiesReceived = await sumSubsidiesReceived(categoryId, month);
  const subsidiesGiven = await sumSubsidiesGiven(categoryId, month);
  
  return budget.totalBudget + subsidiesReceived - totalExpenses - subsidiesGiven;
};

export const getBudgetBreakdown = async (categoryId, month) => {
  const budget = await getBudget(categoryId, month);
  
  if (!budget) {
    return {
      categoryId,
      month,
      originalBudget: 0,
      carriedOver: 0,
      totalBudget: 0,
      actualSpent: 0,
      subsidyReceived: 0,
      subsidyGiven: 0,
      totalSpent: 0,
      remaining: 0,
      utilizationPercent: 0
    };
  }
  
  const actualSpent = await sumExpenses(categoryId, month);
  const subsidyReceived = await sumSubsidiesReceived(categoryId, month);
  const subsidyGiven = await sumSubsidiesGiven(categoryId, month);
  
  const totalSpent = actualSpent + subsidyGiven;
  const remaining = budget.totalBudget + subsidyReceived - actualSpent - subsidyGiven;
  const utilizationPercent = budget.budgetAmount > 0 
    ? (totalSpent / budget.budgetAmount) * 100 
    : 0;
  
  return {
    categoryId,
    month,
    originalBudget: budget.budgetAmount,
    carriedOver: budget.carriedOver,
    totalBudget: budget.totalBudget,
    actualSpent,
    subsidyReceived,
    subsidyGiven,
    totalSpent,
    remaining,
    utilizationPercent: Math.round(utilizationPercent * 10) / 10
  };
};

export const getEnvelopeTotal = async (envelopeId, month) => {
  const categories = await getCategoriesByEnvelope(envelopeId);
  let total = 0;
  
  for (const cat of categories) {
    const remaining = await getBudgetRemaining(cat.id, month);
    total += remaining;
  }
  
  return total;
};

export const getDashboardSummary = async (month) => {
  const totalIncome = await getTotalIncome(month);
  const expenses = await getExpensesByMonth(month);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const envelopes = await getAllEnvelopes();
  let totalRemaining = 0;
  
  for (const envelope of envelopes) {
    const envTotal = await getEnvelopeTotal(envelope.id, month);
    totalRemaining += envTotal;
  }
  
  const budgets = await getBudgetsByMonth(month);
  const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  
  const overBudgetExpenses = expenses.filter(e => e.isOverBudget);
  const overBudgetCount = overBudgetExpenses.length;
  
  return {
    month,
    totalIncome,
    totalExpense,
    totalBudget,
    totalRemaining,
    savedAmount: totalIncome - totalExpense,
    budgetUtilization: totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0,
    overBudgetCount
  };
};

// ===== EXPORT/IMPORT =====
export const exportAllData = async () => {
  const db = await initDB();
  
  const getData = (storeName) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };
  
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    envelopes: await getData('envelopes'),
    categories: await getData('categories'),
    budgets: await getData('budgets'),
    incomes: await getData('incomes'),
    allocations: await getData('allocations'),
    expenses: await getData('expenses'),
    subsidies: await getData('subsidies')
  };
  
  return data;
};

export default { initDB };