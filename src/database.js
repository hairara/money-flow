// ========================================
// DATABASE.JS - IndexedDB Implementation
// ========================================
// Financial Tracker with Envelope Budgeting System
// Using Dexie.js wrapper for easier IndexedDB operations

import Dexie from 'dexie';

// ===== DATABASE INITIALIZATION =====
class FinancialTrackerDB extends Dexie {
  constructor() {
    super('FinancialTrackerDB');
    
    // Define schema version 1
    this.version(1).stores({
      envelopes: '++id, name',
      categories: '++id, envelopeId, name, [envelopeId+name]',
      budgets: '++id, categoryId, month, [categoryId+month]',
      incomes: '++id, month, date, isAllocated',
      allocations: '++id, incomeId, budgetId, type',
      expenses: '++id, categoryId, month, date, isOverBudget',
      subsidies: '++id, expenseId, fromCategoryId, toCategoryId, month',
      carryovers: '++id, categoryId, fromMonth, toMonth',
      monthlySnapshots: '++id, month'
    });

    // Define table references
    this.envelopes = this.table('envelopes');
    this.categories = this.table('categories');
    this.budgets = this.table('budgets');
    this.incomes = this.table('incomes');
    this.allocations = this.table('allocations');
    this.expenses = this.table('expenses');
    this.subsidies = this.table('subsidies');
    this.carryovers = this.table('carryovers');
    this.monthlySnapshots = this.table('monthlySnapshots');
  }
}

// Create database instance
const db = new FinancialTrackerDB();

// ===== UTILITY FUNCTIONS =====

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};

/**
 * Get month from date
 */
export const getMonthFromDate = (dateString) => {
  return dateString.substring(0, 7); // YYYY-MM
};

// ===== ENVELOPE OPERATIONS =====

/**
 * Create new envelope
 */
export const createEnvelope = async (name, description = '', order = 0) => {
  try {
    const id = await db.envelopes.add({
      name,
      description,
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id, name, description, order };
  } catch (error) {
    console.error('Error creating envelope:', error);
    throw error;
  }
};

/**
 * Get all envelopes
 */
export const getAllEnvelopes = async () => {
  try {
    return await db.envelopes.orderBy('order').toArray();
  } catch (error) {
    console.error('Error getting envelopes:', error);
    throw error;
  }
};

/**
 * Update envelope
 */
export const updateEnvelope = async (id, updates) => {
  try {
    await db.envelopes.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return await db.envelopes.get(id);
  } catch (error) {
    console.error('Error updating envelope:', error);
    throw error;
  }
};

/**
 * Delete envelope (and all its categories)
 */
export const deleteEnvelope = async (id) => {
  try {
    // Get all categories in this envelope
    const categories = await db.categories.where('envelopeId').equals(id).toArray();
    
    // Delete all budgets for these categories
    for (const cat of categories) {
      await db.budgets.where('categoryId').equals(cat.id).delete();
      await db.expenses.where('categoryId').equals(cat.id).delete();
    }
    
    // Delete all categories
    await db.categories.where('envelopeId').equals(id).delete();
    
    // Delete envelope
    await db.envelopes.delete(id);
  } catch (error) {
    console.error('Error deleting envelope:', error);
    throw error;
  }
};

// ===== CATEGORY OPERATIONS =====

/**
 * Create new category
 */
export const createCategory = async (envelopeId, name, description = '', order = 0) => {
  try {
    const id = await db.categories.add({
      envelopeId,
      name,
      description,
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id, envelopeId, name, description, order };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Get all categories
 */
export const getAllCategories = async () => {
  try {
    return await db.categories.orderBy('order').toArray();
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

/**
 * Get categories by envelope
 */
export const getCategoriesByEnvelope = async (envelopeId) => {
  try {
    return await db.categories
      .where('envelopeId')
      .equals(envelopeId)
      .sortBy('order');
  } catch (error) {
    console.error('Error getting categories by envelope:', error);
    throw error;
  }
};

/**
 * Update category
 */
export const updateCategory = async (id, updates) => {
  try {
    await db.categories.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return await db.categories.get(id);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (id) => {
  try {
    await db.budgets.where('categoryId').equals(id).delete();
    await db.expenses.where('categoryId').equals(id).delete();
    await db.categories.delete(id);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// ===== BUDGET OPERATIONS =====

/**
 * Create or update budget for category in a month
 */
export const setBudget = async (categoryId, month, budgetAmount, carriedOver = 0) => {
  try {
    // Check if budget already exists
    const existing = await db.budgets
      .where('[categoryId+month]')
      .equals([categoryId, month])
      .first();

    const budgetData = {
      categoryId,
      month,
      budgetAmount,
      carriedOver,
      totalBudget: budgetAmount + carriedOver,
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      await db.budgets.update(existing.id, budgetData);
      return { ...existing, ...budgetData };
    } else {
      const id = await db.budgets.add({
        ...budgetData,
        createdAt: new Date().toISOString()
      });
      return { id, ...budgetData };
    }
  } catch (error) {
    console.error('Error setting budget:', error);
    throw error;
  }
};

/**
 * Get budget for category in a month
 */
export const getBudget = async (categoryId, month) => {
  try {
    return await db.budgets
      .where('[categoryId+month]')
      .equals([categoryId, month])
      .first();
  } catch (error) {
    console.error('Error getting budget:', error);
    throw error;
  }
};

/**
 * Get all budgets for a month
 */
export const getBudgetsByMonth = async (month) => {
  try {
    return await db.budgets.where('month').equals(month).toArray();
  } catch (error) {
    console.error('Error getting budgets by month:', error);
    throw error;
  }
};

/**
 * Auto-fill budgets from previous month
 */
export const autoFillBudgetsFromPreviousMonth = async (currentMonth) => {
  try {
    // Calculate previous month
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month-2 because JS months are 0-indexed
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all budgets from previous month
    const prevBudgets = await getBudgetsByMonth(prevMonth);
    
    if (prevBudgets.length === 0) {
      return { filled: 0, message: 'No budgets found in previous month' };
    }
    
    // Create budgets for current month
    let filled = 0;
    for (const prevBudget of prevBudgets) {
      // Check if budget already exists for current month
      const existing = await getBudget(prevBudget.categoryId, currentMonth);
      
      if (!existing) {
        await setBudget(
          prevBudget.categoryId,
          currentMonth,
          prevBudget.budgetAmount, // Copy budget amount (NOT totalBudget)
          0 // No carry over by default
        );
        filled++;
      }
    }
    
    return { filled, message: `${filled} budgets filled from ${prevMonth}` };
  } catch (error) {
    console.error('Error auto-filling budgets:', error);
    throw error;
  }
};

// ===== INCOME OPERATIONS =====

/**
 * Create income
 */
export const createIncome = async (date, source, amount, note = '') => {
  try {
    const dateStr = formatDate(date);
    const month = getMonthFromDate(dateStr);
    
    const id = await db.incomes.add({
      date: dateStr,
      month,
      source,
      amount,
      note,
      isAllocated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { id, date: dateStr, month, source, amount, note, isAllocated: false };
  } catch (error) {
    console.error('Error creating income:', error);
    throw error;
  }
};

/**
 * Get all incomes for a month
 */
export const getIncomesByMonth = async (month) => {
  try {
    return await db.incomes.where('month').equals(month).toArray();
  } catch (error) {
    console.error('Error getting incomes:', error);
    throw error;
  }
};

/**
 * Get total income for a month
 */
export const getTotalIncome = async (month) => {
  try {
    const incomes = await getIncomesByMonth(month);
    return incomes.reduce((sum, income) => sum + income.amount, 0);
  } catch (error) {
    console.error('Error getting total income:', error);
    throw error;
  }
};

/**
 * Mark income as allocated
 */
export const markIncomeAsAllocated = async (incomeId) => {
  try {
    await db.incomes.update(incomeId, {
      isAllocated: true,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking income as allocated:', error);
    throw error;
  }
};

// ===== ALLOCATION OPERATIONS =====

/**
 * Allocate income to budgets
 * @param {number} incomeId - Income ID (can be null for carry over)
 * @param {Array} allocations - [{categoryId, month, amount, note}]
 * @param {string} type - 'income' or 'carryover'
 */
export const allocateIncomeToBudgets = async (incomeId, allocations, type = 'income') => {
  try {
    const results = [];
    
    for (const allocation of allocations) {
      const { categoryId, month, amount, note = '' } = allocation;
      
      // Get or create budget
      let budget = await getBudget(categoryId, month);
      
      if (!budget) {
        // Create new budget
        budget = await setBudget(categoryId, month, amount, 0);
      } else {
        // Update existing budget
        await db.budgets.update(budget.id, {
          budgetAmount: budget.budgetAmount + amount,
          totalBudget: budget.totalBudget + amount,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Create allocation record
      const allocationId = await db.allocations.add({
        incomeId,
        budgetId: budget.id,
        amount,
        type,
        note,
        createdAt: new Date().toISOString()
      });
      
      results.push({ allocationId, budgetId: budget.id, categoryId, amount });
    }
    
    // Mark income as allocated if incomeId provided
    if (incomeId) {
      await markIncomeAsAllocated(incomeId);
    }
    
    return results;
  } catch (error) {
    console.error('Error allocating income to budgets:', error);
    throw error;
  }
};

// ===== EXPENSE OPERATIONS =====

/**
 * Create expense (normal - budget sufficient)
 */
export const createExpense = async (date, categoryId, amount, note = '') => {
  try {
    const dateStr = formatDate(date);
    const month = getMonthFromDate(dateStr);
    
    // Check budget remaining
    const remaining = await getBudgetRemaining(categoryId, month);
    
    if (remaining < amount) {
      throw new Error('BUDGET_INSUFFICIENT', { 
        categoryId, 
        month, 
        required: amount, 
        available: remaining 
      });
    }
    
    const id = await db.expenses.add({
      date: dateStr,
      month,
      categoryId,
      amount,
      note,
      isOverBudget: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { id, date: dateStr, month, categoryId, amount, note, isOverBudget: false };
  } catch (error) {
    if (error.message === 'BUDGET_INSUFFICIENT') {
      throw error;
    }
    console.error('Error creating expense:', error);
    throw error;
  }
};

/**
 * Create expense with subsidy (budget insufficient)
 * @param {string} date - Date of expense
 * @param {number} categoryId - Category ID (recipient)
 * @param {number} amount - Expense amount
 * @param {number} fromCategoryId - Category ID (donor)
 * @param {string} note - Expense note
 * @param {string} subsidyNote - Subsidy note
 */
export const createExpenseWithSubsidy = async (
  date,
  categoryId,
  amount,
  fromCategoryId,
  note = '',
  subsidyNote = ''
) => {
  try {
    const dateStr = formatDate(date);
    const month = getMonthFromDate(dateStr);
    
    // Check donor budget
    const donorRemaining = await getBudgetRemaining(fromCategoryId, month);
    const recipientRemaining = await getBudgetRemaining(categoryId, month);
    const deficit = amount - recipientRemaining;
    
    if (donorRemaining < deficit) {
      throw new Error('Donor category does not have enough budget');
    }
    
    // Start transaction-like operations
    // 1. Create expense
    const expenseId = await db.expenses.add({
      date: dateStr,
      month,
      categoryId,
      amount,
      note,
      isOverBudget: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 2. Create subsidy record
    const subsidyId = await db.subsidies.add({
      expenseId,
      fromCategoryId,
      toCategoryId: categoryId,
      amount: deficit,
      month,
      note: subsidyNote || `Budget insufficient, borrowed from donor category`,
      createdAt: new Date().toISOString()
    });
    
    // 3. Update recipient budget totalBudget
    const recipientBudget = await getBudget(categoryId, month);
    if (recipientBudget) {
      await db.budgets.update(recipientBudget.id, {
        totalBudget: recipientBudget.totalBudget + deficit,
        updatedAt: new Date().toISOString()
      });
    }
    
    return {
      expenseId,
      subsidyId,
      deficit,
      expense: {
        id: expenseId,
        date: dateStr,
        month,
        categoryId,
        amount,
        note,
        isOverBudget: true
      },
      subsidy: {
        id: subsidyId,
        expenseId,
        fromCategoryId,
        toCategoryId: categoryId,
        amount: deficit,
        month,
        note: subsidyNote
      }
    };
  } catch (error) {
    console.error('Error creating expense with subsidy:', error);
    throw error;
  }
};

/**
 * Get all expenses for a month
 */
export const getExpensesByMonth = async (month) => {
  try {
    return await db.expenses.where('month').equals(month).toArray();
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

/**
 * Get expenses by category
 */
export const getExpensesByCategory = async (categoryId, month) => {
  try {
    return await db.expenses
      .where('[categoryId+month]')
      .equals([categoryId, month])
      .toArray();
  } catch (error) {
    console.error('Error getting expenses by category:', error);
    throw error;
  }
};

/**
 * Delete expense (and related subsidy if exists)
 */
export const deleteExpense = async (expenseId) => {
  try {
    // Delete related subsidies
    await db.subsidies.where('expenseId').equals(expenseId).delete();
    
    // Delete expense
    await db.expenses.delete(expenseId);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// ===== SUBSIDY OPERATIONS =====

/**
 * Get subsidies given by a category (donor)
 */
export const getSubsidiesGiven = async (categoryId, month) => {
  try {
    return await db.subsidies
      .where('fromCategoryId')
      .equals(categoryId)
      .and(s => s.month === month)
      .toArray();
  } catch (error) {
    console.error('Error getting subsidies given:', error);
    throw error;
  }
};

/**
 * Get subsidies received by a category (recipient)
 */
export const getSubsidiesReceived = async (categoryId, month) => {
  try {
    return await db.subsidies
      .where('toCategoryId')
      .equals(categoryId)
      .and(s => s.month === month)
      .toArray();
  } catch (error) {
    console.error('Error getting subsidies received:', error);
    throw error;
  }
};

/**
 * Get total subsidies given by category
 */
export const sumSubsidiesGiven = async (categoryId, month) => {
  try {
    const subsidies = await getSubsidiesGiven(categoryId, month);
    return subsidies.reduce((sum, s) => sum + s.amount, 0);
  } catch (error) {
    console.error('Error summing subsidies given:', error);
    throw error;
  }
};

/**
 * Get total subsidies received by category
 */
export const sumSubsidiesReceived = async (categoryId, month) => {
  try {
    const subsidies = await getSubsidiesReceived(categoryId, month);
    return subsidies.reduce((sum, s) => sum + s.amount, 0);
  } catch (error) {
    console.error('Error summing subsidies received:', error);
    throw error;
  }
};

// ===== COMPUTED VALUES =====

/**
 * Get total expenses for a category in a month
 */
export const sumExpenses = async (categoryId, month) => {
  try {
    const expenses = await getExpensesByCategory(categoryId, month);
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  } catch (error) {
    console.error('Error summing expenses:', error);
    throw error;
  }
};

/**
 * Calculate budget remaining for a category
 * CORE CALCULATION - Pendekatan B (Virtual Expense)
 */
export const getBudgetRemaining = async (categoryId, month) => {
  try {
    const budget = await getBudget(categoryId, month);
    if (!budget) return 0;
    
    const totalExpenses = await sumExpenses(categoryId, month);
    const subsidiesReceived = await sumSubsidiesReceived(categoryId, month);
    const subsidiesGiven = await sumSubsidiesGiven(categoryId, month);
    
    // Formula: Budget + Subsidi Diterima - Expenses - Subsidi Dikasih
    return budget.totalBudget + subsidiesReceived - totalExpenses - subsidiesGiven;
  } catch (error) {
    console.error('Error getting budget remaining:', error);
    throw error;
  }
};

/**
 * Get detailed budget breakdown for UI
 * Shows: original budget, carry over, subsidy in/out, expenses, remaining
 */
export const getBudgetBreakdown = async (categoryId, month) => {
  try {
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
      utilizationPercent: Math.round(utilizationPercent * 10) / 10 // Round to 1 decimal
    };
  } catch (error) {
    console.error('Error getting budget breakdown:', error);
    throw error;
  }
};

/**
 * Get total budget for an envelope (sum of all categories)
 */
export const getEnvelopeTotal = async (envelopeId, month) => {
  try {
    const categories = await getCategoriesByEnvelope(envelopeId);
    let total = 0;
    
    for (const cat of categories) {
      const remaining = await getBudgetRemaining(cat.id, month);
      total += remaining;
    }
    
    return total;
  } catch (error) {
    console.error('Error getting envelope total:', error);
    throw error;
  }
};

/**
 * Get dashboard summary for a month
 */
export const getDashboardSummary = async (month) => {
  try {
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
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    throw error;
  }
};

// ===== CARRY OVER OPERATIONS =====

/**
 * Process carry over for a category
 * @param {number} categoryId
 * @param {string} fromMonth - YYYY-MM
 * @param {string} action - 'carry' or 'reset'
 * @param {number} carriedAmount - Amount to carry (can be partial)
 */
export const processCarryOver = async (categoryId, fromMonth, action, carriedAmount = null) => {
  try {
    // Calculate next month
    const [year, month] = fromMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1); // month is correct because JS months are 0-indexed
    const toMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    
    const remainingBudget = await getBudgetRemaining(categoryId, fromMonth);
    
    if (remainingBudget <= 0) {
      return { success: false, message: 'No remaining budget to carry over' };
    }
    
    const amountToCarry = carriedAmount !== null ? carriedAmount : remainingBudget;
    
    if (amountToCarry > remainingBudget) {
      throw new Error('Cannot carry more than remaining budget');
    }
    
    // Create carryover record
    const carryoverId = await db.carryovers.add({
      categoryId,
      fromMonth,
      toMonth,
      remainingBudget,
      carriedAmount: action === 'carry' ? amountToCarry : 0,
      action,
      note: action === 'carry' 
        ? `Carried over ${amountToCarry} to ${toMonth}` 
        : `Reset ${remainingBudget}, not carried over`,
      createdAt: new Date().toISOString()
    });
    
    // If carry, update next month's budget
    if (action === 'carry' && amountToCarry > 0) {
      const nextBudget = await getBudget(categoryId, toMonth);
      
      if (nextBudget) {
        // Update existing budget
        await db.budgets.update(nextBudget.id, {
          carriedOver: nextBudget.carriedOver + amountToCarry,
          totalBudget: nextBudget.totalBudget + amountToCarry,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new budget with carry over
        await setBudget(categoryId, toMonth, 0, amountToCarry);
      }
      
      // Create allocation record for carry over
      const newBudget = await getBudget(categoryId, toMonth);
      await db.allocations.add({
        incomeId: null, // No income source for carry over
        budgetId: newBudget.id,
        amount: amountToCarry,
        type: 'carryover',
        note: `Carried over from ${fromMonth}`,
        createdAt: new Date().toISOString()
      });
    }
    
    return {
      success: true,
      carryoverId,
      action,
      fromMonth,
      toMonth,
      remainingBudget,
      carriedAmount: action === 'carry' ? amountToCarry : 0
    };
  } catch (error) {
    console.error('Error processing carry over:', error);
    throw error;
  }
};

/**
 * Get categories with remaining budget for end of month review
 */
export const getCategoriesWithRemainingBudget = async (month) => {
  try {
    const categories = await getAllCategories();
    const results = [];
    
    for (const category of categories) {
      const remaining = await getBudgetRemaining(category.id, month);
      if (remaining > 0) {
        results.push({
          category,
          remaining,
          breakdown: await getBudgetBreakdown(category.id, month)
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error getting categories with remaining budget:', error);
    throw error;
  }
};

// ===== MONTHLY SNAPSHOT OPERATIONS =====

/**
 * Create monthly snapshot
 */
export const createMonthlySnapshot = async (month) => {
  try {
    const summary = await getDashboardSummary(month);
    
    const existing = await db.monthlySnapshots.where('month').equals(month).first();
    
    if (existing) {
      await db.monthlySnapshots.update(existing.id, {
        ...summary,
        updatedAt: new Date().toISOString()
      });
      return existing.id;
    } else {
      return await db.monthlySnapshots.add({
        ...summary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error creating monthly snapshot:', error);
    throw error;
  }
};

// ===== BACKUP & RESTORE =====

/**
 * Export all data to JSON
 */
export const exportAllData = async () => {
  try {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      envelopes: await db.envelopes.toArray(),
      categories: await db.categories.toArray(),
      budgets: await db.budgets.toArray(),
      incomes: await db.incomes.toArray(),
      allocations: await db.allocations.toArray(),
      expenses: await db.expenses.toArray(),
      subsidies: await db.subsidies.toArray(),
      carryovers: await db.carryovers.toArray(),
      monthlySnapshots: await db.monthlySnapshots.toArray()
    };
    
    return data;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

/**
 * Import data from JSON (will clear existing data)
 */
export const importAllData = async (data) => {
  try {
    // Validate data structure
    if (!data.version || !data.envelopes) {
      throw new Error('Invalid backup file format');
    }
    
    // Clear all tables
    await db.envelopes.clear();
    await db.categories.clear();
    await db.budgets.clear();
    await db.incomes.clear();
    await db.allocations.clear();
    await db.expenses.clear();
    await db.subsidies.clear();
    await db.carryovers.clear();
    await db.monthlySnapshots.clear();
    
    // Import data
    if (data.envelopes?.length) await db.envelopes.bulkAdd(data.envelopes);
    if (data.categories?.length) await db.categories.bulkAdd(data.categories);
    if (data.budgets?.length) await db.budgets.bulkAdd(data.budgets);
    if (data.incomes?.length) await db.incomes.bulkAdd(data.incomes);
    if (data.allocations?.length) await db.allocations.bulkAdd(data.allocations);
    if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
    if (data.subsidies?.length) await db.subsidies.bulkAdd(data.subsidies);
    if (data.carryovers?.length) await db.carryovers.bulkAdd(data.carryovers);
    if (data.monthlySnapshots?.length) await db.monthlySnapshots.bulkAdd(data.monthlySnapshots);
    
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};

// ===== EXPORT DEFAULT =====
export default db;
