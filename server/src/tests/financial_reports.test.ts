import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  chartOfAccountsTable, 
  financialTransactionsTable, 
  transactionEntriesTable 
} from '../db/schema';
import { type DateRangeFilter } from '../schema';
import { getJournalReport } from '../handlers/financial_reports';

describe('getJournalReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return journal entries within date range', async () => {
    // Create prerequisite user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create chart of accounts
    const [cashAccount] = await db.insert(chartOfAccountsTable)
      .values({
        account_code: 'ACC-001',
        account_name: 'Cash',
        account_type: 'Asset'
      })
      .returning()
      .execute();

    const [revenueAccount] = await db.insert(chartOfAccountsTable)
      .values({
        account_code: 'ACC-002',
        account_name: 'Revenue',
        account_type: 'Revenue'
      })
      .returning()
      .execute();

    // Create financial transactions
    const transactionDate1 = new Date('2024-01-15');
    const transactionDate2 = new Date('2024-01-20');

    const [transaction1] = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: transactionDate1,
        transaction_reference: 'TXN-001',
        description: 'Payment received from customer',
        total_amount: '1000.00',
        created_by: user.id
      })
      .returning()
      .execute();

    const [transaction2] = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: transactionDate2,
        transaction_reference: 'TXN-002',
        description: 'Service revenue',
        total_amount: '500.00',
        created_by: user.id
      })
      .returning()
      .execute();

    // Create transaction entries
    await db.insert(transactionEntriesTable)
      .values([
        {
          transaction_id: transaction1.id,
          account_id: cashAccount.id,
          debit_amount: '1000.00',
          credit_amount: '0.00',
          description: 'Cash received'
        },
        {
          transaction_id: transaction1.id,
          account_id: revenueAccount.id,
          debit_amount: '0.00',
          credit_amount: '1000.00',
          description: 'Revenue earned'
        },
        {
          transaction_id: transaction2.id,
          account_id: cashAccount.id,
          debit_amount: '500.00',
          credit_amount: '0.00',
          description: 'Service payment'
        },
        {
          transaction_id: transaction2.id,
          account_id: revenueAccount.id,
          debit_amount: '0.00',
          credit_amount: '500.00',
          description: 'Service revenue'
        }
      ])
      .execute();

    // Test with date range filter
    const filter: DateRangeFilter = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getJournalReport(filter);

    // Should return 4 entries (2 transactions with 2 entries each)
    expect(result).toHaveLength(4);

    // Verify data structure and types
    result.forEach(entry => {
      expect(typeof entry.transaction_id).toBe('number');
      expect(entry.transaction_date).toBeInstanceOf(Date);
      expect(typeof entry.transaction_reference).toBe('string');
      expect(typeof entry.account_name).toBe('string');
      expect(typeof entry.account_code).toBe('string');
      expect(typeof entry.debit_amount).toBe('number');
      expect(typeof entry.credit_amount).toBe('number');
      expect(typeof entry.description).toBe('string');
    });

    // Verify specific entries are included
    const cashDebitEntries = result.filter(entry => 
      entry.account_code === 'ACC-001' && entry.debit_amount > 0
    );
    expect(cashDebitEntries).toHaveLength(2);
    
    const revenueEntries = result.filter(entry => 
      entry.account_code === 'ACC-002' && entry.credit_amount > 0
    );
    expect(revenueEntries).toHaveLength(2);

    // Verify amounts are correctly parsed as numbers
    const totalDebits = result.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = result.reduce((sum, entry) => sum + entry.credit_amount, 0);
    expect(totalDebits).toBe(1500);
    expect(totalCredits).toBe(1500);
  });

  it('should filter entries by start date', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const [cashAccount] = await db.insert(chartOfAccountsTable)
      .values({
        account_code: 'ACC-001',
        account_name: 'Cash',
        account_type: 'Asset'
      })
      .returning()
      .execute();

    // Create transactions with different dates
    const [oldTransaction] = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date('2023-12-15'),
        transaction_reference: 'TXN-OLD',
        description: 'Old transaction',
        total_amount: '100.00',
        created_by: user.id
      })
      .returning()
      .execute();

    const [newTransaction] = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date('2024-01-15'),
        transaction_reference: 'TXN-NEW',
        description: 'New transaction',
        total_amount: '200.00',
        created_by: user.id
      })
      .returning()
      .execute();

    // Create transaction entries
    await db.insert(transactionEntriesTable)
      .values([
        {
          transaction_id: oldTransaction.id,
          account_id: cashAccount.id,
          debit_amount: '100.00',
          credit_amount: '0.00',
          description: 'Old entry'
        },
        {
          transaction_id: newTransaction.id,
          account_id: cashAccount.id,
          debit_amount: '200.00',
          credit_amount: '0.00',
          description: 'New entry'
        }
      ])
      .execute();

    // Filter by start date - should only return new transaction
    const filter: DateRangeFilter = {
      start_date: new Date('2024-01-01')
    };

    const result = await getJournalReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].transaction_reference).toBe('TXN-NEW');
    expect(result[0].debit_amount).toBe(200);
  });

  it('should filter entries by end date', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const [cashAccount] = await db.insert(chartOfAccountsTable)
      .values({
        account_code: 'ACC-001',
        account_name: 'Cash',
        account_type: 'Asset'
      })
      .returning()
      .execute();

    // Create transactions with different dates
    const [earlyTransaction] = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date('2024-01-15'),
        transaction_reference: 'TXN-EARLY',
        description: 'Early transaction',
        total_amount: '100.00',
        created_by: user.id
      })
      .returning()
      .execute();

    const [lateTransaction] = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date('2024-02-15'),
        transaction_reference: 'TXN-LATE',
        description: 'Late transaction',
        total_amount: '200.00',
        created_by: user.id
      })
      .returning()
      .execute();

    // Create transaction entries
    await db.insert(transactionEntriesTable)
      .values([
        {
          transaction_id: earlyTransaction.id,
          account_id: cashAccount.id,
          debit_amount: '100.00',
          credit_amount: '0.00',
          description: 'Early entry'
        },
        {
          transaction_id: lateTransaction.id,
          account_id: cashAccount.id,
          debit_amount: '200.00',
          credit_amount: '0.00',
          description: 'Late entry'
        }
      ])
      .execute();

    // Filter by end date - should only return early transaction
    const filter: DateRangeFilter = {
      end_date: new Date('2024-01-31')
    };

    const result = await getJournalReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].transaction_reference).toBe('TXN-EARLY');
    expect(result[0].debit_amount).toBe(100);
  });

  it('should return all entries when no date filter is provided', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const [cashAccount] = await db.insert(chartOfAccountsTable)
      .values({
        account_code: 'ACC-001',
        account_name: 'Cash',
        account_type: 'Asset'
      })
      .returning()
      .execute();

    // Create multiple transactions across different dates
    const transactions = await db.insert(financialTransactionsTable)
      .values([
        {
          transaction_date: new Date('2023-12-15'),
          transaction_reference: 'TXN-2023',
          description: '2023 transaction',
          total_amount: '100.00',
          created_by: user.id
        },
        {
          transaction_date: new Date('2024-01-15'),
          transaction_reference: 'TXN-2024',
          description: '2024 transaction',
          total_amount: '200.00',
          created_by: user.id
        }
      ])
      .returning()
      .execute();

    // Create transaction entries
    await db.insert(transactionEntriesTable)
      .values([
        {
          transaction_id: transactions[0].id,
          account_id: cashAccount.id,
          debit_amount: '100.00',
          credit_amount: '0.00',
          description: '2023 entry'
        },
        {
          transaction_id: transactions[1].id,
          account_id: cashAccount.id,
          debit_amount: '200.00',
          credit_amount: '0.00',
          description: '2024 entry'
        }
      ])
      .execute();

    // No date filter - should return all entries
    const filter: DateRangeFilter = {};

    const result = await getJournalReport(filter);

    expect(result).toHaveLength(2);
    
    // Verify ordering (newest first)
    expect(result[0].transaction_reference).toBe('TXN-2024');
    expect(result[1].transaction_reference).toBe('TXN-2023');
  });

  it('should return empty array when no transactions exist', async () => {
    const filter: DateRangeFilter = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getJournalReport(filter);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle null description fields correctly', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const [cashAccount] = await db.insert(chartOfAccountsTable)
      .values({
        account_code: 'ACC-001',
        account_name: 'Cash',
        account_type: 'Asset'
      })
      .returning()
      .execute();

    const [transaction] = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date('2024-01-15'),
        transaction_reference: 'TXN-001',
        description: 'Test transaction',
        total_amount: '100.00',
        created_by: user.id
      })
      .returning()
      .execute();

    // Create entry with null description
    await db.insert(transactionEntriesTable)
      .values({
        transaction_id: transaction.id,
        account_id: cashAccount.id,
        debit_amount: '100.00',
        credit_amount: '0.00',
        description: null
      })
      .execute();

    const filter: DateRangeFilter = {};
    const result = await getJournalReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('');
  });
});