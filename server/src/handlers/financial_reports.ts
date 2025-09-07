import { db } from '../db';
import { financialTransactionsTable, transactionEntriesTable, chartOfAccountsTable } from '../db/schema';
import { type JournalEntry, type TrialBalanceEntry, type DateRangeFilter } from '../schema';
import { eq, and, gte, lte, desc, SQL } from 'drizzle-orm';

export async function getJournalReport(filter: DateRangeFilter): Promise<JournalEntry[]> {
  try {
    // Apply date filters conditionally
    const conditions: SQL<unknown>[] = [];

    if (filter.start_date) {
      conditions.push(gte(financialTransactionsTable.transaction_date, filter.start_date));
    }

    if (filter.end_date) {
      conditions.push(lte(financialTransactionsTable.transaction_date, filter.end_date));
    }

    // Build query based on whether we have conditions or not
    let results;
    
    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      results = await db.select({
        transaction_id: transactionEntriesTable.transaction_id,
        transaction_date: financialTransactionsTable.transaction_date,
        transaction_reference: financialTransactionsTable.transaction_reference,
        account_name: chartOfAccountsTable.account_name,
        account_code: chartOfAccountsTable.account_code,
        debit_amount: transactionEntriesTable.debit_amount,
        credit_amount: transactionEntriesTable.credit_amount,
        description: transactionEntriesTable.description
      })
      .from(transactionEntriesTable)
      .innerJoin(
        financialTransactionsTable,
        eq(transactionEntriesTable.transaction_id, financialTransactionsTable.id)
      )
      .innerJoin(
        chartOfAccountsTable,
        eq(transactionEntriesTable.account_id, chartOfAccountsTable.id)
      )
      .where(whereCondition)
      .orderBy(desc(financialTransactionsTable.transaction_date), financialTransactionsTable.transaction_reference)
      .execute();
    } else {
      results = await db.select({
        transaction_id: transactionEntriesTable.transaction_id,
        transaction_date: financialTransactionsTable.transaction_date,
        transaction_reference: financialTransactionsTable.transaction_reference,
        account_name: chartOfAccountsTable.account_name,
        account_code: chartOfAccountsTable.account_code,
        debit_amount: transactionEntriesTable.debit_amount,
        credit_amount: transactionEntriesTable.credit_amount,
        description: transactionEntriesTable.description
      })
      .from(transactionEntriesTable)
      .innerJoin(
        financialTransactionsTable,
        eq(transactionEntriesTable.transaction_id, financialTransactionsTable.id)
      )
      .innerJoin(
        chartOfAccountsTable,
        eq(transactionEntriesTable.account_id, chartOfAccountsTable.id)
      )
      .orderBy(desc(financialTransactionsTable.transaction_date), financialTransactionsTable.transaction_reference)
      .execute();
    }

    // Convert numeric fields to numbers and ensure proper types
    return results.map(result => ({
      transaction_id: result.transaction_id,
      transaction_date: result.transaction_date,
      transaction_reference: result.transaction_reference,
      account_name: result.account_name,
      account_code: result.account_code,
      debit_amount: parseFloat(result.debit_amount),
      credit_amount: parseFloat(result.credit_amount),
      description: result.description || ''
    }));
  } catch (error) {
    console.error('Journal report generation failed:', error);
    throw error;
  }
}

export async function getGeneralLedger(accountId: number, filter: DateRangeFilter): Promise<JournalEntry[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to generate general ledger for a specific account.
  return Promise.resolve([]);
}

export async function getTrialBalance(filter: DateRangeFilter): Promise<TrialBalanceEntry[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to generate trial balance report.
  return Promise.resolve([
    {
      account_code: 'ACC-001',
      account_name: 'Cash',
      account_type: 'Asset',
      debit_balance: 50000,
      credit_balance: 0
    },
    {
      account_code: 'ACC-002',
      account_name: 'Revenue',
      account_type: 'Revenue',
      debit_balance: 0,
      credit_balance: 50000
    }
  ]);
}

export async function getIncomeStatement(filter: DateRangeFilter): Promise<{
  revenues: TrialBalanceEntry[];
  expenses: TrialBalanceEntry[];
  netIncome: number;
}> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to generate income statement report.
  return Promise.resolve({
    revenues: [],
    expenses: [],
    netIncome: 0
  });
}

export async function getBalanceSheet(asOfDate: Date): Promise<{
  assets: TrialBalanceEntry[];
  liabilities: TrialBalanceEntry[];
  equity: TrialBalanceEntry[];
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
}> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to generate balance sheet report.
  return Promise.resolve({
    assets: [],
    liabilities: [],
    equity: [],
    totalAssets: 0,
    totalLiabilitiesAndEquity: 0
  });
}

export async function getCashFlow(filter: DateRangeFilter): Promise<{
  operatingActivities: JournalEntry[];
  investingActivities: JournalEntry[];
  financingActivities: JournalEntry[];
  netCashFlow: number;
}> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to generate cash flow statement.
  return Promise.resolve({
    operatingActivities: [],
    investingActivities: [],
    financingActivities: [],
    netCashFlow: 0
  });
}

export async function getTicketSalesReport(filter: DateRangeFilter): Promise<{
  packageName: string;
  ticketsSold: number;
  totalRevenue: number;
  averagePrice: number;
}[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to generate ticket sales report.
  return Promise.resolve([]);
}