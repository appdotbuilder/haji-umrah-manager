import { db } from '../db';
import { financialTransactionsTable, transactionEntriesTable, chartOfAccountsTable } from '../db/schema';
import { type FinancialTransaction, type TransactionEntry, type CreateTransactionInput } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export async function createFinancialTransaction(input: CreateTransactionInput, userId: number): Promise<FinancialTransaction> {
  try {
    // Validate that all referenced accounts exist
    if (input.entries.length > 0) {
      const accountIds = input.entries.map(entry => entry.account_id);
      const uniqueAccountIds = [...new Set(accountIds)];
      
      const existingAccounts = await db.select({ id: chartOfAccountsTable.id })
        .from(chartOfAccountsTable)
        .where(inArray(chartOfAccountsTable.id, uniqueAccountIds))
        .execute();

      if (existingAccounts.length !== uniqueAccountIds.length) {
        throw new Error('One or more account IDs do not exist');
      }
    }

    // Calculate total amount from entries (sum of all debits or credits - they should be equal)
    const totalDebitAmount = input.entries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCreditAmount = input.entries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const totalAmount = Math.max(totalDebitAmount, totalCreditAmount);

    // Start transaction - create the financial transaction first
    const transactionResult = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date(),
        transaction_reference: input.transaction_reference,
        description: input.description,
        total_amount: totalAmount.toString(),
        created_by: userId,
        package_booking_id: input.package_booking_id
      })
      .returning()
      .execute();

    const transaction = transactionResult[0];

    // Create transaction entries
    if (input.entries.length > 0) {
      await db.insert(transactionEntriesTable)
        .values(input.entries.map(entry => ({
          transaction_id: transaction.id,
          account_id: entry.account_id,
          debit_amount: entry.debit_amount.toString(),
          credit_amount: entry.credit_amount.toString(),
          description: entry.description
        })))
        .execute();
    }

    // Return transaction with numeric conversion
    return {
      ...transaction,
      total_amount: parseFloat(transaction.total_amount)
    };
  } catch (error) {
    console.error('Financial transaction creation failed:', error);
    throw error;
  }
}

export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
  try {
    const results = await db.select()
      .from(financialTransactionsTable)
      .orderBy(financialTransactionsTable.transaction_date)
      .execute();

    return results.map(transaction => ({
      ...transaction,
      total_amount: parseFloat(transaction.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch financial transactions:', error);
    throw error;
  }
}

export async function getTransactionById(id: number): Promise<FinancialTransaction | null> {
  try {
    const results = await db.select()
      .from(financialTransactionsTable)
      .where(eq(financialTransactionsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const transaction = results[0];
    return {
      ...transaction,
      total_amount: parseFloat(transaction.total_amount)
    };
  } catch (error) {
    console.error('Failed to fetch transaction by ID:', error);
    throw error;
  }
}

export async function getTransactionEntries(transactionId: number): Promise<TransactionEntry[]> {
  try {
    const results = await db.select()
      .from(transactionEntriesTable)
      .where(eq(transactionEntriesTable.transaction_id, transactionId))
      .orderBy(transactionEntriesTable.created_at)
      .execute();

    return results.map(entry => ({
      ...entry,
      debit_amount: parseFloat(entry.debit_amount),
      credit_amount: parseFloat(entry.credit_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch transaction entries:', error);
    throw error;
  }
}