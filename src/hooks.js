// ========================================
// HOOKS.JS - React Hooks for Financial Tracker
// ========================================
// Custom hooks to easily use database functions in React components

import { useState, useEffect, useCallback } from 'react';
import {
  getAllEnvelopes,
  getAllCategories,
  getCategoriesByEnvelope,
  getBudgetsByMonth,
  getBudgetBreakdown,
  getBudgetRemaining,
  getEnvelopeTotal,
  getIncomesByMonth,
  getTotalIncome,
  getExpensesByMonth,
  getDashboardSummary,
  getCategoriesWithRemainingBudget,
  createEnvelope,
  createCategory,
  createIncome,
  createExpense,
  createExpenseWithSubsidy,
  setBudget,
  allocateIncomeToBudgets,
  processCarryOver,
  autoFillBudgetsFromPreviousMonth,
  getCurrentMonth,
  exportAllData,
  importAllData
} from './database.js';

// ===== ENVELOPE HOOKS =====

/**
 * Hook to get all envelopes
 */
export const useEnvelopes = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEnvelopes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllEnvelopes();
      setEnvelopes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnvelopes();
  }, [loadEnvelopes]);

  return { envelopes, loading, error, reload: loadEnvelopes };
};

/**
 * Hook to create envelope
 */
export const useCreateEnvelope = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = async (name, description, order) => {
    try {
      setCreating(true);
      setError(null);
      const result = await createEnvelope(name, description, order);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { create, creating, error };
};

// ===== CATEGORY HOOKS =====

/**
 * Hook to get all categories
 */
export const useCategories = (envelopeId = null) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = envelopeId 
        ? await getCategoriesByEnvelope(envelopeId)
        : await getAllCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [envelopeId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return { categories, loading, error, reload: loadCategories };
};

/**
 * Hook to create category
 */
export const useCreateCategory = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = async (envelopeId, name, description, order) => {
    try {
      setCreating(true);
      setError(null);
      const result = await createCategory(envelopeId, name, description, order);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { create, creating, error };
};

// ===== BUDGET HOOKS =====

/**
 * Hook to get budget breakdown for a category
 */
export const useBudgetBreakdown = (categoryId, month) => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBreakdown = useCallback(async () => {
    if (!categoryId || !month) {
      setBreakdown(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getBudgetBreakdown(categoryId, month);
      setBreakdown(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryId, month]);

  useEffect(() => {
    loadBreakdown();
  }, [loadBreakdown]);

  return { breakdown, loading, error, reload: loadBreakdown };
};

/**
 * Hook to get budgets for a month with breakdowns
 */
export const useMonthBudgets = (month) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBudgets = useCallback(async () => {
    if (!month) return;

    try {
      setLoading(true);
      const budgetData = await getBudgetsByMonth(month);
      
      // Get breakdowns for each budget
      const budgetsWithBreakdowns = await Promise.all(
        budgetData.map(async (budget) => ({
          ...budget,
          breakdown: await getBudgetBreakdown(budget.categoryId, month)
        }))
      );
      
      setBudgets(budgetsWithBreakdowns);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return { budgets, loading, error, reload: loadBudgets };
};

/**
 * Hook to set/update budget
 */
export const useSetBudget = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveBudget = async (categoryId, month, budgetAmount, carriedOver = 0) => {
    try {
      setSaving(true);
      setError(null);
      const result = await setBudget(categoryId, month, budgetAmount, carriedOver);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { saveBudget, saving, error };
};

// ===== INCOME HOOKS =====

/**
 * Hook to get incomes for a month
 */
export const useIncomes = (month) => {
  const [incomes, setIncomes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIncomes = useCallback(async () => {
    if (!month) return;

    try {
      setLoading(true);
      const data = await getIncomesByMonth(month);
      const totalAmount = await getTotalIncome(month);
      setIncomes(data);
      setTotal(totalAmount);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  return { incomes, total, loading, error, reload: loadIncomes };
};

/**
 * Hook to create income
 */
export const useCreateIncome = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = async (date, source, amount, note) => {
    try {
      setCreating(true);
      setError(null);
      const result = await createIncome(date, source, amount, note);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { create, creating, error };
};

/**
 * Hook to allocate income to budgets
 */
export const useAllocateIncome = () => {
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState(null);

  const allocate = async (incomeId, allocations) => {
    try {
      setAllocating(true);
      setError(null);
      const result = await allocateIncomeToBudgets(incomeId, allocations);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setAllocating(false);
    }
  };

  return { allocate, allocating, error };
};

// ===== EXPENSE HOOKS =====

/**
 * Hook to get expenses for a month
 */
export const useExpenses = (month, categoryId = null) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadExpenses = useCallback(async () => {
    if (!month) return;

    try {
      setLoading(true);
      const data = await getExpensesByMonth(month);
      
      // Filter by category if provided
      const filtered = categoryId 
        ? data.filter(e => e.categoryId === categoryId)
        : data;
      
      setExpenses(filtered);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month, categoryId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  return { expenses, loading, error, reload: loadExpenses };
};

/**
 * Hook to create expense
 */
export const useCreateExpense = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [needsSubsidy, setNeedsSubsidy] = useState(false);
  const [subsidyInfo, setSubsidyInfo] = useState(null);

  const create = async (date, categoryId, amount, note) => {
    try {
      setCreating(true);
      setError(null);
      setNeedsSubsidy(false);
      setSubsidyInfo(null);

      const result = await createExpense(date, categoryId, amount, note);
      return result;
    } catch (err) {
      if (err.message === 'BUDGET_INSUFFICIENT') {
        setNeedsSubsidy(true);
        setSubsidyInfo({
          categoryId,
          amount,
          available: err.available || 0,
          required: err.required || amount
        });
      }
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const createWithSubsidy = async (date, categoryId, amount, fromCategoryId, note, subsidyNote) => {
    try {
      setCreating(true);
      setError(null);
      const result = await createExpenseWithSubsidy(
        date,
        categoryId,
        amount,
        fromCategoryId,
        note,
        subsidyNote
      );
      setNeedsSubsidy(false);
      setSubsidyInfo(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { 
    create, 
    createWithSubsidy, 
    creating, 
    error, 
    needsSubsidy, 
    subsidyInfo,
    clearSubsidyInfo: () => {
      setNeedsSubsidy(false);
      setSubsidyInfo(null);
    }
  };
};

// ===== DASHBOARD HOOKS =====

/**
 * Hook to get dashboard summary
 */
export const useDashboard = (month) => {
  const [summary, setSummary] = useState(null);
  const [envelopeTotals, setEnvelopeTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    if (!month) {
      month = getCurrentMonth();
    }

    try {
      setLoading(true);
      
      // Get summary
      const summaryData = await getDashboardSummary(month);
      setSummary(summaryData);
      
      // Get envelope totals
      const envelopes = await getAllEnvelopes();
      const totals = await Promise.all(
        envelopes.map(async (envelope) => ({
          envelope,
          total: await getEnvelopeTotal(envelope.id, month),
          categories: await getCategoriesByEnvelope(envelope.id)
        }))
      );
      setEnvelopeTotals(totals);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return { summary, envelopeTotals, loading, error, reload: loadDashboard };
};

/**
 * Hook for envelope card with categories and budgets
 */
export const useEnvelopeCard = (envelopeId, month) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEnvelopeCard = useCallback(async () => {
    if (!envelopeId || !month) return;

    try {
      setLoading(true);
      
      const categories = await getCategoriesByEnvelope(envelopeId);
      const total = await getEnvelopeTotal(envelopeId, month);
      
      // Get breakdown for each category
      const categoriesWithBreakdown = await Promise.all(
        categories.map(async (cat) => ({
          ...cat,
          breakdown: await getBudgetBreakdown(cat.id, month)
        }))
      );
      
      setData({
        envelopeId,
        total,
        categories: categoriesWithBreakdown
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [envelopeId, month]);

  useEffect(() => {
    loadEnvelopeCard();
  }, [loadEnvelopeCard]);

  return { data, loading, error, reload: loadEnvelopeCard };
};

// ===== CARRY OVER HOOKS =====

/**
 * Hook for end of month review
 */
export const useEndOfMonthReview = (month) => {
  const [categoriesWithRemaining, setCategoriesWithRemaining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReview = useCallback(async () => {
    if (!month) return;

    try {
      setLoading(true);
      const data = await getCategoriesWithRemainingBudget(month);
      setCategoriesWithRemaining(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  return { categoriesWithRemaining, loading, error, reload: loadReview };
};

/**
 * Hook to process carry over
 */
export const useProcessCarryOver = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const process = async (categoryId, fromMonth, action, carriedAmount = null) => {
    try {
      setProcessing(true);
      setError(null);
      const result = await processCarryOver(categoryId, fromMonth, action, carriedAmount);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return { process, processing, error };
};

// ===== UTILITY HOOKS =====

/**
 * Hook for auto-fill budgets from previous month
 */
export const useAutoFillBudgets = () => {
  const [filling, setFilling] = useState(false);
  const [error, setError] = useState(null);

  const autoFill = async (currentMonth) => {
    try {
      setFilling(true);
      setError(null);
      const result = await autoFillBudgetsFromPreviousMonth(currentMonth);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setFilling(false);
    }
  };

  return { autoFill, filling, error };
};

/**
 * Hook for backup/restore
 */
export const useBackupRestore = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const exportData = async () => {
    try {
      setProcessing(true);
      setError(null);
      const data = await exportAllData();
      
      // Create download
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moneyflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const importData = async (file) => {
    try {
      setProcessing(true);
      setError(null);
      
      const reader = new FileReader();
      const data = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target.result);
            resolve(parsed);
          } catch (err) {
            reject(new Error('Invalid JSON file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
      
      const result = await importAllData(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return { exportData, importData, processing, error };
};

/**
 * Hook for current month state
 */
export const useCurrentMonth = () => {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  const nextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const next = new Date(year, month, 1);
    setCurrentMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const prevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    setCurrentMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToMonth = (month) => {
    setCurrentMonth(month);
  };

  return { currentMonth, nextMonth, prevMonth, goToMonth };
};
