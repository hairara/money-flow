// setupData.js - Run this once to setup initial data

import { 
  createEnvelope, 
  createCategory, 
  createIncome,
  allocateIncomeToBudgets 
} from './database.js';

export const setupInitialData = async () => {
  try {
    console.log('Setting up data...');
    
    // 1. Create Envelopes
    const livingCost = await createEnvelope('Living Cost', 'Daily expenses', 1);
    const savings = await createEnvelope('Savings', 'Long-term savings', 2);
    
    console.log('Envelopes created!');
    
    // 2. Create Categories
    const makan = await createCategory(livingCost.id, 'Makan', '', 1);
    const transport = await createCategory(livingCost.id, 'Transport', '', 2);
    const skincare = await createCategory(livingCost.id, 'Skincare', '', 3);
    const hangout = await createCategory(livingCost.id, 'Hangout', '', 4);
    
    const darurat = await createCategory(savings.id, 'Dana Darurat', '', 1);
    const investasi = await createCategory(savings.id, 'Investasi', '', 2);
    
    console.log('Categories created!');
    
    // 3. Create Income
    const income = await createIncome(
      '2025-02-01',
      'Gaji Bulanan',
      11000000,
      'Gaji periode Januari'
    );
    
    console.log('Income created!');
    
    // 4. Allocate to Budgets
    await allocateIncomeToBudgets(income.id, [
      { categoryId: makan.id, month: '2025-02', amount: 3000000 },
      { categoryId: transport.id, month: '2025-02', amount: 1500000 },
      { categoryId: skincare.id, month: '2025-02', amount: 500000 },
      { categoryId: hangout.id, month: '2025-02', amount: 2000000 },
      { categoryId: darurat.id, month: '2025-02', amount: 1500000 },
      { categoryId: investasi.id, month: '2025-02', amount: 2500000 }
    ]);
    
    console.log('✅ Data setup complete!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error setting up data:', error);
    return { success: false, error };
  }
};