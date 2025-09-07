import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  chartOfAccountsTable, 
  financialTransactionsTable, 
  transactionEntriesTable
} from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { 
  createFinancialTransaction, 
  getFinancialTransactions, 
  getTransactionById, 
  getTransactionEntries 
} from '../handlers/financial_transactions';
import { eq } from 'drizzle-orm';

// Test data
let testUserId: number;
let testAccountId1: number;
let testAccountId2: number;

const testTransactionInput: CreateTransactionInput = {
  transaction_reference: 'TXN-2024-001',
  description: 'Test payment transaction',
  package_booking_id: null,
  entries: [
    {
      account_id: 0, // Will be set in beforeEach
      debit_amount: 1000.00,
      credit_amount: 0.00,
      description: 'Cash received'
    },
    {
      account_id: 0, // Will be set in beforeEach
      debit_amount: 0.00,
      credit_amount: 1000.00,
      description: 'Revenue recognized'
    }
  ]
};

describe('createFinancialTransaction', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'admin'
      })
      .returning({ id: usersTable.id })
      .execute();
    testUserId = userResult[0].id;

    // Create test accounts
    const account1Result = await db.insert(chartOfAccountsTable)
      .values({
        account_code: '1100',
        account_name: 'Cash',
        account_type: 'Asset'
      })
      .returning({ id: chartOfAccountsTable.id })
      .execute();
    testAccountId1 = account1Result[0].id;

    const account2Result = await db.insert(chartOfAccountsTable)
      .values({
        account_code: '4100',
        account_name: 'Revenue',
        account_type: 'Revenue'
      })
      .returning({ id: chartOfAccountsTable.id })
      .execute();
    testAccountId2 = account2Result[0].id;

    // Update test input with actual account IDs
    testTransactionInput.entries[0].account_id = testAccountId1;
    testTransactionInput.entries[1].account_id = testAccountId2;
  });

  afterEach(resetDB);

  it('should create a financial transaction with entries', async () => {
    const result = await createFinancialTransaction(testTransactionInput, testUserId);

    expect(result.transaction_reference).toEqual('TXN-2024-001');
    expect(result.description).toEqual('Test payment transaction');
    expect(result.total_amount).toEqual(1000.00);
    expect(typeof result.total_amount).toEqual('number');
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const result = await createFinancialTransaction(testTransactionInput, testUserId);

    const transactions = await db.select()
      .from(financialTransactionsTable)
      .where(eq(financialTransactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].transaction_reference).toEqual('TXN-2024-001');
    expect(parseFloat(transactions[0].total_amount)).toEqual(1000.00);
  });

  it('should create transaction entries', async () => {
    const result = await createFinancialTransaction(testTransactionInput, testUserId);

    const entries = await db.select()
      .from(transactionEntriesTable)
      .where(eq(transactionEntriesTable.transaction_id, result.id))
      .execute();

    expect(entries).toHaveLength(2);
    expect(parseFloat(entries[0].debit_amount)).toEqual(1000.00);
    expect(parseFloat(entries[0].credit_amount)).toEqual(0.00);
    expect(parseFloat(entries[1].debit_amount)).toEqual(0.00);
    expect(parseFloat(entries[1].credit_amount)).toEqual(1000.00);
  });

  it('should handle transaction without entries', async () => {
    const inputWithoutEntries = {
      ...testTransactionInput,
      entries: []
    };

    const result = await createFinancialTransaction(inputWithoutEntries, testUserId);

    expect(result.total_amount).toEqual(0);
    expect(result.id).toBeDefined();

    const entries = await db.select()
      .from(transactionEntriesTable)
      .where(eq(transactionEntriesTable.transaction_id, result.id))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should throw error for non-existent account', async () => {
    const inputWithInvalidAccount = {
      ...testTransactionInput,
      entries: [{
        account_id: 99999,
        debit_amount: 100.00,
        credit_amount: 0.00,
        description: 'Invalid account'
      }]
    };

    await expect(
      createFinancialTransaction(inputWithInvalidAccount, testUserId)
    ).rejects.toThrow(/account IDs do not exist/i);
  });
});

describe('getFinancialTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'admin'
      })
      .returning({ id: usersTable.id })
      .execute();
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getFinancialTransactions();
    expect(result).toEqual([]);
  });

  it('should return all financial transactions', async () => {
    // Create multiple transactions
    await db.insert(financialTransactionsTable)
      .values([
        {
          transaction_date: new Date('2024-01-01'),
          transaction_reference: 'TXN-001',
          description: 'First transaction',
          total_amount: '1000.00',
          created_by: testUserId
        },
        {
          transaction_date: new Date('2024-01-02'),
          transaction_reference: 'TXN-002',
          description: 'Second transaction',
          total_amount: '2000.00',
          created_by: testUserId
        }
      ])
      .execute();

    const result = await getFinancialTransactions();

    expect(result).toHaveLength(2);
    expect(result[0].transaction_reference).toEqual('TXN-001');
    expect(result[0].total_amount).toEqual(1000.00);
    expect(typeof result[0].total_amount).toEqual('number');
    expect(result[1].transaction_reference).toEqual('TXN-002');
    expect(result[1].total_amount).toEqual(2000.00);
  });
});

describe('getTransactionById', () => {
  beforeEach(async () => {
    await createDB();
    
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'admin'
      })
      .returning({ id: usersTable.id })
      .execute();
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should return null for non-existent transaction', async () => {
    const result = await getTransactionById(99999);
    expect(result).toBeNull();
  });

  it('should return transaction by ID', async () => {
    const transactionResult = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date('2024-01-01'),
        transaction_reference: 'TXN-001',
        description: 'Test transaction',
        total_amount: '1500.00',
        created_by: testUserId
      })
      .returning({ id: financialTransactionsTable.id })
      .execute();

    const result = await getTransactionById(transactionResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.transaction_reference).toEqual('TXN-001');
    expect(result!.total_amount).toEqual(1500.00);
    expect(typeof result!.total_amount).toEqual('number');
  });
});

describe('getTransactionEntries', () => {
  beforeEach(async () => {
    await createDB();
    
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'admin'
      })
      .returning({ id: usersTable.id })
      .execute();
    testUserId = userResult[0].id;

    const accountResult = await db.insert(chartOfAccountsTable)
      .values({
        account_code: '1100',
        account_name: 'Cash',
        account_type: 'Asset'
      })
      .returning({ id: chartOfAccountsTable.id })
      .execute();
    testAccountId1 = accountResult[0].id;
  });

  afterEach(resetDB);

  it('should return empty array for transaction without entries', async () => {
    const transactionResult = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date(),
        transaction_reference: 'TXN-001',
        description: 'Test transaction',
        total_amount: '0.00',
        created_by: testUserId
      })
      .returning({ id: financialTransactionsTable.id })
      .execute();

    const result = await getTransactionEntries(transactionResult[0].id);
    expect(result).toEqual([]);
  });

  it('should return all entries for a transaction', async () => {
    const transactionResult = await db.insert(financialTransactionsTable)
      .values({
        transaction_date: new Date(),
        transaction_reference: 'TXN-001',
        description: 'Test transaction',
        total_amount: '1000.00',
        created_by: testUserId
      })
      .returning({ id: financialTransactionsTable.id })
      .execute();

    await db.insert(transactionEntriesTable)
      .values([
        {
          transaction_id: transactionResult[0].id,
          account_id: testAccountId1,
          debit_amount: '1000.00',
          credit_amount: '0.00',
          description: 'Debit entry'
        },
        {
          transaction_id: transactionResult[0].id,
          account_id: testAccountId1,
          debit_amount: '0.00',
          credit_amount: '1000.00',
          description: 'Credit entry'
        }
      ])
      .execute();

    const result = await getTransactionEntries(transactionResult[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].debit_amount).toEqual(1000.00);
    expect(result[0].credit_amount).toEqual(0.00);
    expect(typeof result[0].debit_amount).toEqual('number');
    expect(result[1].debit_amount).toEqual(0.00);
    expect(result[1].credit_amount).toEqual(1000.00);
    expect(typeof result[1].credit_amount).toEqual('number');
  });

  it('should return empty array for non-existent transaction', async () => {
    const result = await getTransactionEntries(99999);
    expect(result).toEqual([]);
  });
});