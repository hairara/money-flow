# 💰 MoneyFlow - Financial Tracker Implementation Guide

Complete implementation of envelope budgeting system with IndexedDB and React.

---

## 📦 File Structure

```
/
├── database.js           # Core database functions (IndexedDB with Dexie.js)
├── hooks.js              # React hooks wrapper
├── sample-components.jsx # Example React components
└── README.md             # This file
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install dexie react react-dom
```

**Package Versions:**
- `dexie`: ^3.2.0 (IndexedDB wrapper)
- `react`: ^18.0.0
- `react-dom`: ^18.0.0

### 2. Import Database & Hooks

```javascript
// In your main app file
import db from './database.js';
import { useDashboard, useCreateExpense } from './hooks.js';
```

### 3. Initialize Database (Automatic)

Database akan otomatis initialize pas pertama kali diakses. No additional setup needed!

---

## 🎯 Core Concepts

### Pendekatan B: Virtual Expense Model

**Budget Donor (Kategori yang kasih subsidi):**
```
Budget asli: Rp 2,000,000 (PRESERVED)
Actual spent: Rp 1,000,000
Subsidy given: Rp 200,000 (dianggap virtual expense)
Remaining: Rp 800,000
```

**Budget Recipient (Kategori yang terima subsidi):**
```
Budget asli: Rp 3,000,000 (PRESERVED)
Budget efektif: Rp 3,200,000 (3jt + 200k subsidy)
Actual spent: Rp 3,200,000
Remaining: Rp 0
```

---

## 📚 Usage Examples

### Example 1: Setup Initial Data

```javascript
import { 
  createEnvelope, 
  createCategory, 
  createIncome,
  allocateIncomeToBudgets 
} from './database.js';

// 1. Create Envelopes
const livingCost = await createEnvelope('Living Cost', 'Daily expenses', 1);
const savings = await createEnvelope('Savings', 'Long-term savings', 2);

// 2. Create Categories
const makan = await createCategory(livingCost.id, 'Makan', '', 1);
const transport = await createCategory(livingCost.id, 'Transport', '', 2);
const darurat = await createCategory(savings.id, 'Dana Darurat', '', 1);

// 3. Create Income
const income = await createIncome(
  '2025-02-01',
  'Gaji Bulanan',
  11000000,
  'Gaji periode Januari'
);

// 4. Allocate to Budgets
await allocateIncomeToBudgets(income.id, [
  { categoryId: makan.id, month: '2025-02', amount: 3000000 },
  { categoryId: transport.id, month: '2025-02', amount: 1500000 },
  { categoryId: darurat.id, month: '2025-02', amount: 1500000 }
]);
```

### Example 2: Add Normal Expense

```javascript
import { createExpense } from './database.js';

try {
  const expense = await createExpense(
    '2025-02-05',
    makan.id,
    50000,
    'Lunch dengan team'
  );
  
  console.log('Expense created:', expense);
} catch (error) {
  if (error.message === 'BUDGET_INSUFFICIENT') {
    // Handle subsidy flow
    console.log('Need subsidy!');
  }
}
```

### Example 3: Add Expense with Subsidy

```javascript
import { createExpenseWithSubsidy } from './database.js';

const result = await createExpenseWithSubsidy(
  '2025-02-20',
  makan.id,          // Recipient (budget habis)
  200000,            // Expense amount
  hangout.id,        // Donor category
  'Dinner date',     // Expense note
  'Budget Makan habis, ambil dari Hangout' // Subsidy note
);

console.log('Expense with subsidy:', result);
// result.expense: expense record
// result.subsidy: subsidy record
// result.deficit: amount borrowed
```

### Example 4: Get Budget Breakdown

```javascript
import { getBudgetBreakdown } from './database.js';

const breakdown = await getBudgetBreakdown(makan.id, '2025-02');

console.log(breakdown);
/*
{
  categoryId: 1,
  month: '2025-02',
  originalBudget: 3000000,      // Budget asli
  carriedOver: 0,
  totalBudget: 3200000,         // Budget + subsidy
  actualSpent: 3200000,         // Actual expenses
  subsidyReceived: 200000,      // Dari Hangout
  subsidyGiven: 0,
  totalSpent: 3200000,          // Untuk progress bar
  remaining: 0,
  utilizationPercent: 106.7     // Over budget!
}
*/
```

### Example 5: End of Month Review

```javascript
import { 
  getCategoriesWithRemainingBudget,
  processCarryOver 
} from './database.js';

// 1. Get categories with remaining budget
const categories = await getCategoriesWithRemainingBudget('2025-02');

// 2. Process carry over for each
for (const { category, remaining } of categories) {
  // User decides: carry or reset
  const action = userChoice; // 'carry' or 'reset'
  
  await processCarryOver(
    category.id,
    '2025-02',
    action,
    remaining // Can carry partial amount
  );
}
```

### Example 6: Using React Hooks

```javascript
import { useDashboard, useCreateExpense } from './hooks.js';

function Dashboard() {
  const { summary, envelopeTotals, loading } = useDashboard('2025-02');
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Total: Rp {summary.totalRemaining.toLocaleString()}</h1>
      {envelopeTotals.map(({ envelope, total }) => (
        <div key={envelope.id}>
          {envelope.name}: Rp {total.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

function AddExpense() {
  const { create, needsSubsidy, subsidyInfo } = useCreateExpense();
  
  const handleSubmit = async (data) => {
    try {
      await create(data.date, data.categoryId, data.amount, data.note);
      alert('Success!');
    } catch (err) {
      if (needsSubsidy) {
        // Show subsidy modal
        // User selects donor category
        // Then call createWithSubsidy()
      }
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## 🔑 Key Functions Reference

### Envelope Operations
- `createEnvelope(name, description, order)`
- `getAllEnvelopes()`
- `updateEnvelope(id, updates)`
- `deleteEnvelope(id)`

### Category Operations
- `createCategory(envelopeId, name, description, order)`
- `getAllCategories()`
- `getCategoriesByEnvelope(envelopeId)`
- `updateCategory(id, updates)`
- `deleteCategory(id)`

### Budget Operations
- `setBudget(categoryId, month, budgetAmount, carriedOver)`
- `getBudget(categoryId, month)`
- `getBudgetsByMonth(month)`
- `autoFillBudgetsFromPreviousMonth(currentMonth)`

### Income Operations
- `createIncome(date, source, amount, note)`
- `getIncomesByMonth(month)`
- `getTotalIncome(month)`
- `allocateIncomeToBudgets(incomeId, allocations)`

### Expense Operations
- `createExpense(date, categoryId, amount, note)`
- `createExpenseWithSubsidy(date, categoryId, amount, fromCategoryId, note, subsidyNote)`
- `getExpensesByMonth(month)`
- `getExpensesByCategory(categoryId, month)`
- `deleteExpense(expenseId)`

### Subsidy Operations
- `getSubsidiesGiven(categoryId, month)`
- `getSubsidiesReceived(categoryId, month)`
- `sumSubsidiesGiven(categoryId, month)`
- `sumSubsidiesReceived(categoryId, month)`

### Computed Values
- `getBudgetRemaining(categoryId, month)` ⭐ Core calculation
- `getBudgetBreakdown(categoryId, month)` ⭐ For UI display
- `getEnvelopeTotal(envelopeId, month)`
- `getDashboardSummary(month)`

### Carry Over Operations
- `processCarryOver(categoryId, fromMonth, action, carriedAmount)`
- `getCategoriesWithRemainingBudget(month)`

### Backup & Restore
- `exportAllData()` - Returns JSON object
- `importAllData(data)` - Clears DB and imports

---

## 🎨 React Hooks Reference

### Data Hooks
- `useEnvelopes()` - Get all envelopes
- `useCategories(envelopeId)` - Get categories
- `useBudgetBreakdown(categoryId, month)` - Get budget breakdown
- `useMonthBudgets(month)` - Get all budgets for month
- `useIncomes(month)` - Get incomes
- `useExpenses(month, categoryId)` - Get expenses
- `useDashboard(month)` - Get dashboard summary
- `useEnvelopeCard(envelopeId, month)` - Get envelope card data
- `useEndOfMonthReview(month)` - Get categories for review

### Action Hooks
- `useCreateEnvelope()` - Create envelope
- `useCreateCategory()` - Create category
- `useSetBudget()` - Set/update budget
- `useCreateIncome()` - Create income
- `useAllocateIncome()` - Allocate income to budgets
- `useCreateExpense()` - Create expense (with subsidy detection)
- `useProcessCarryOver()` - Process carry over
- `useAutoFillBudgets()` - Auto-fill from previous month
- `useBackupRestore()` - Export/import data

### Utility Hooks
- `useCurrentMonth()` - Month navigation

---

## 🔥 Common Workflows

### Workflow 1: Monthly Setup (Awal Bulan)

```javascript
import { autoFillBudgetsFromPreviousMonth } from './database.js';

// Auto-fill budgets from previous month
const result = await autoFillBudgetsFromPreviousMonth('2025-03');
console.log(`${result.filled} budgets filled from 2025-02`);

// User can then edit budgets if needed
```

### Workflow 2: Add Income & Allocate

```javascript
// 1. Create income
const income = await createIncome(
  '2025-02-01',
  'Gaji Bulanan',
  11000000
);

// 2. Allocate to categories
await allocateIncomeToBudgets(income.id, [
  { categoryId: 1, month: '2025-02', amount: 3000000 },
  { categoryId: 2, month: '2025-02', amount: 1500000 },
  // ... more allocations
]);
```

### Workflow 3: Daily Expense Entry

```javascript
// Normal expense
try {
  await createExpense('2025-02-05', categoryId, 50000, 'Lunch');
} catch (error) {
  if (error.message === 'BUDGET_INSUFFICIENT') {
    // Ask user to select donor category
    const donorId = await askUserForDonor();
    
    // Create with subsidy
    await createExpenseWithSubsidy(
      '2025-02-05',
      categoryId,
      50000,
      donorId,
      'Lunch',
      'Budget habis, ambil dari donor'
    );
  }
}
```

### Workflow 4: End of Month

```javascript
// 1. Get categories with remaining budget
const categories = await getCategoriesWithRemainingBudget('2025-02');

// 2. For each category, let user decide
for (const { category, remaining } of categories) {
  const action = await askUser(`Carry over ${remaining} or reset?`);
  
  await processCarryOver(
    category.id,
    '2025-02',
    action === 'carry' ? 'carry' : 'reset',
    remaining
  );
}

// 3. Create monthly snapshot (optional, for analytics)
await createMonthlySnapshot('2025-02');
```

---

## 💾 Backup Strategy

### Automatic Weekly Backup (Recommended)

```javascript
import { exportAllData } from './database.js';

// Run this every week
setInterval(async () => {
  const data = await exportAllData();
  
  // Download as JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `moneyflow-backup-${new Date().toISOString()}.json`;
  link.click();
}, 7 * 24 * 60 * 60 * 1000); // 7 days
```

### Manual Backup via Hook

```javascript
const { exportData } = useBackupRestore();

<button onClick={exportData}>
  📦 Download Backup
</button>
```

---

## 🐛 Debugging Tips

### 1. Check Database Content

```javascript
import db from './database.js';

// View all data
console.log('Envelopes:', await db.envelopes.toArray());
console.log('Categories:', await db.categories.toArray());
console.log('Budgets:', await db.budgets.toArray());
console.log('Expenses:', await db.expenses.toArray());
console.log('Subsidies:', await db.subsidies.toArray());
```

### 2. Clear Database (Reset)

```javascript
// Delete database completely
await db.delete();
// Reload page to reinitialize
window.location.reload();
```

### 3. Validate Budget Calculations

```javascript
import { getBudgetBreakdown, getBudgetRemaining } from './database.js';

const breakdown = await getBudgetBreakdown(categoryId, month);
const remaining = await getBudgetRemaining(categoryId, month);

console.log('Breakdown:', breakdown);
console.log('Remaining:', remaining);

// Should match
console.assert(
  breakdown.remaining === remaining,
  'Calculation mismatch!'
);
```

---

## 🎯 Next Steps

1. **Copy files** to your React project
2. **Install dependencies** (`npm install dexie`)
3. **Import and use hooks** in your components
4. **Test with sample data** (see Example 1)
5. **Build your UI** using the provided sample components as reference

---

## 📖 Additional Resources

- [Dexie.js Documentation](https://dexie.org/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- Database Schema: See `database-schema-updated.md`
- UI Mockup: See `moneyflow-ui-mockup.html`

---

## ⚠️ Important Notes

1. **Budget asli preserved**: `budgets.budgetAmount` never changes from subsidy
2. **Subsidy = Virtual Expense**: Donor's spent increases, budget stays same
3. **Always use transactions**: For critical operations (expense + subsidy)
4. **Backup regularly**: Data is stored locally in browser
5. **Test thoroughly**: Especially subsidy calculations

---

**Happy coding! 🚀**
