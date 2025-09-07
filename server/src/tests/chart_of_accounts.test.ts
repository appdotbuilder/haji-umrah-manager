import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chartOfAccountsTable } from '../db/schema';
import { type CreateAccountInput } from '../schema';
import { createAccount, getChartOfAccounts, getAccountById, updateAccountBalance } from '../handlers/chart_of_accounts';
import { eq } from 'drizzle-orm';

// Test input for creating accounts
const testAccountInput: CreateAccountInput = {
  account_code: 'ACC001',
  account_name: 'Test Cash Account',
  account_type: 'Asset',
  parent_account_id: null
};

const testSubAccountInput: CreateAccountInput = {
  account_code: 'ACC002',
  account_name: 'Test Bank Account',
  account_type: 'Asset',
  parent_account_id: null // Will be set to parent account ID in tests
};

describe('chart of accounts handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createAccount', () => {
    it('should create an account successfully', async () => {
      const result = await createAccount(testAccountInput);

      expect(result.account_code).toEqual('ACC001');
      expect(result.account_name).toEqual('Test Cash Account');
      expect(result.account_type).toEqual('Asset');
      expect(result.parent_account_id).toBeNull();
      expect(result.balance).toEqual(0);
      expect(typeof result.balance).toBe('number');
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save account to database', async () => {
      const result = await createAccount(testAccountInput);

      const accounts = await db.select()
        .from(chartOfAccountsTable)
        .where(eq(chartOfAccountsTable.id, result.id))
        .execute();

      expect(accounts).toHaveLength(1);
      expect(accounts[0].account_code).toEqual('ACC001');
      expect(accounts[0].account_name).toEqual('Test Cash Account');
      expect(accounts[0].account_type).toEqual('Asset');
      expect(parseFloat(accounts[0].balance)).toEqual(0);
      expect(accounts[0].is_active).toBe(true);
    });

    it('should create account with parent relationship', async () => {
      // Create parent account first
      const parentAccount = await createAccount(testAccountInput);

      // Create child account
      const childInput = {
        ...testSubAccountInput,
        parent_account_id: parentAccount.id
      };
      const childAccount = await createAccount(childInput);

      expect(childAccount.parent_account_id).toEqual(parentAccount.id);
      expect(childAccount.account_code).toEqual('ACC002');
      expect(childAccount.account_name).toEqual('Test Bank Account');
    });

    it('should throw error when parent account does not exist', async () => {
      const invalidInput = {
        ...testAccountInput,
        parent_account_id: 999
      };

      await expect(createAccount(invalidInput)).rejects.toThrow(/parent account not found/i);
    });

    it('should handle duplicate account codes', async () => {
      // Create first account
      await createAccount(testAccountInput);

      // Try to create account with same code
      await expect(createAccount(testAccountInput)).rejects.toThrow();
    });
  });

  describe('getChartOfAccounts', () => {
    it('should return empty array when no accounts exist', async () => {
      const result = await getChartOfAccounts();

      expect(result).toEqual([]);
    });

    it('should return all accounts', async () => {
      // Create test accounts
      await createAccount(testAccountInput);
      const parentAccount = await createAccount({
        account_code: 'ACC003',
        account_name: 'Parent Account',
        account_type: 'Liability',
        parent_account_id: null
      });
      await createAccount({
        ...testSubAccountInput,
        parent_account_id: parentAccount.id
      });

      const result = await getChartOfAccounts();

      expect(result).toHaveLength(3);
      expect(result.every(account => typeof account.balance === 'number')).toBe(true);
      expect(result.every(account => account.is_active === true)).toBe(true);
      
      // Check specific accounts exist
      const accountCodes = result.map(a => a.account_code);
      expect(accountCodes).toContain('ACC001');
      expect(accountCodes).toContain('ACC002');
      expect(accountCodes).toContain('ACC003');
    });

    it('should return accounts with correct numeric conversion', async () => {
      await createAccount(testAccountInput);

      const result = await getChartOfAccounts();

      expect(result).toHaveLength(1);
      expect(typeof result[0].balance).toBe('number');
      expect(result[0].balance).toEqual(0);
    });
  });

  describe('getAccountById', () => {
    it('should return null when account does not exist', async () => {
      const result = await getAccountById(999);

      expect(result).toBeNull();
    });

    it('should return account when it exists', async () => {
      const createdAccount = await createAccount(testAccountInput);

      const result = await getAccountById(createdAccount.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(createdAccount.id);
      expect(result!.account_code).toEqual('ACC001');
      expect(result!.account_name).toEqual('Test Cash Account');
      expect(result!.account_type).toEqual('Asset');
      expect(typeof result!.balance).toBe('number');
      expect(result!.balance).toEqual(0);
    });

    it('should handle parent-child relationship correctly', async () => {
      const parentAccount = await createAccount(testAccountInput);
      const childAccount = await createAccount({
        ...testSubAccountInput,
        parent_account_id: parentAccount.id
      });

      const result = await getAccountById(childAccount.id);

      expect(result).not.toBeNull();
      expect(result!.parent_account_id).toEqual(parentAccount.id);
    });
  });

  describe('updateAccountBalance', () => {
    it('should update account balance successfully', async () => {
      const account = await createAccount(testAccountInput);
      const newBalance = 1500.75;

      const result = await updateAccountBalance(account.id, newBalance);

      expect(result.id).toEqual(account.id);
      expect(result.balance).toEqual(newBalance);
      expect(typeof result.balance).toBe('number');
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should persist balance update to database', async () => {
      const account = await createAccount(testAccountInput);
      const newBalance = 2500.50;

      await updateAccountBalance(account.id, newBalance);

      // Verify balance was updated in database
      const updatedAccount = await getAccountById(account.id);
      expect(updatedAccount).not.toBeNull();
      expect(updatedAccount!.balance).toEqual(newBalance);
    });

    it('should throw error when account does not exist', async () => {
      await expect(updateAccountBalance(999, 100.00)).rejects.toThrow(/account not found/i);
    });

    it('should handle negative balances', async () => {
      const account = await createAccount(testAccountInput);
      const negativeBalance = -500.25;

      const result = await updateAccountBalance(account.id, negativeBalance);

      expect(result.balance).toEqual(negativeBalance);
      expect(typeof result.balance).toBe('number');
    });

    it('should handle zero balance', async () => {
      const account = await createAccount(testAccountInput);
      
      // First set to non-zero
      await updateAccountBalance(account.id, 100);
      
      // Then set to zero
      const result = await updateAccountBalance(account.id, 0);

      expect(result.balance).toEqual(0);
      expect(typeof result.balance).toBe('number');
    });

    it('should handle large decimal amounts', async () => {
      const account = await createAccount(testAccountInput);
      const largeAmount = 999999.99;

      const result = await updateAccountBalance(account.id, largeAmount);

      expect(result.balance).toEqual(largeAmount);
      expect(typeof result.balance).toBe('number');
    });
  });
});