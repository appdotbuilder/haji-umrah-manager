import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { banksTable } from '../db/schema';
import { type CreateBankInput } from '../schema';
import { createBank, getBanks, getBankById } from '../handlers/banks';
import { eq } from 'drizzle-orm';

// Test input data
const testBankInput: CreateBankInput = {
  bank_name: 'Test Bank',
  account_number: '1234567890',
  account_holder_name: 'Test Travel Agency',
  branch: 'Main Branch',
  swift_code: 'TESTBNK123'
};

const testBankInputWithoutSwift: CreateBankInput = {
  bank_name: 'Local Bank',
  account_number: '9876543210',
  account_holder_name: 'Local Travel Services',
  branch: 'Downtown Branch',
  swift_code: null
};

describe('createBank', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a bank with all fields', async () => {
    const result = await createBank(testBankInput);

    // Verify returned bank data
    expect(result.bank_name).toEqual('Test Bank');
    expect(result.account_number).toEqual('1234567890');
    expect(result.account_holder_name).toEqual('Test Travel Agency');
    expect(result.branch).toEqual('Main Branch');
    expect(result.swift_code).toEqual('TESTBNK123');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a bank without swift code', async () => {
    const result = await createBank(testBankInputWithoutSwift);

    expect(result.bank_name).toEqual('Local Bank');
    expect(result.account_number).toEqual('9876543210');
    expect(result.account_holder_name).toEqual('Local Travel Services');
    expect(result.branch).toEqual('Downtown Branch');
    expect(result.swift_code).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save bank to database', async () => {
    const result = await createBank(testBankInput);

    // Verify bank is saved in database
    const banks = await db.select()
      .from(banksTable)
      .where(eq(banksTable.id, result.id))
      .execute();

    expect(banks).toHaveLength(1);
    expect(banks[0].bank_name).toEqual('Test Bank');
    expect(banks[0].account_number).toEqual('1234567890');
    expect(banks[0].account_holder_name).toEqual('Test Travel Agency');
    expect(banks[0].branch).toEqual('Main Branch');
    expect(banks[0].swift_code).toEqual('TESTBNK123');
    expect(banks[0].is_active).toBe(true);
  });

  it('should set default values correctly', async () => {
    const result = await createBank(testBankInput);

    // Verify default values
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are recent (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    expect(result.created_at >= oneMinuteAgo).toBe(true);
    expect(result.updated_at >= oneMinuteAgo).toBe(true);
  });
});

describe('getBanks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no banks exist', async () => {
    const result = await getBanks();
    expect(result).toEqual([]);
  });

  it('should return all banks', async () => {
    // Create multiple banks
    await createBank(testBankInput);
    await createBank(testBankInputWithoutSwift);

    const result = await getBanks();

    expect(result).toHaveLength(2);
    expect(result[0].bank_name).toEqual('Test Bank');
    expect(result[1].bank_name).toEqual('Local Bank');
    
    // Verify all banks have proper structure
    result.forEach(bank => {
      expect(bank.id).toBeDefined();
      expect(bank.bank_name).toBeDefined();
      expect(bank.account_number).toBeDefined();
      expect(bank.account_holder_name).toBeDefined();
      expect(bank.branch).toBeDefined();
      expect(typeof bank.is_active).toBe('boolean');
      expect(bank.created_at).toBeInstanceOf(Date);
      expect(bank.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return banks in creation order', async () => {
    const bank1 = await createBank(testBankInput);
    const bank2 = await createBank(testBankInputWithoutSwift);

    const result = await getBanks();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(bank1.id);
    expect(result[1].id).toEqual(bank2.id);
  });
});

describe('getBankById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when bank does not exist', async () => {
    const result = await getBankById(999);
    expect(result).toBeNull();
  });

  it('should return specific bank by ID', async () => {
    // Create multiple banks
    const bank1 = await createBank(testBankInput);
    const bank2 = await createBank(testBankInputWithoutSwift);

    // Fetch first bank
    const result1 = await getBankById(bank1.id);
    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(bank1.id);
    expect(result1!.bank_name).toEqual('Test Bank');
    expect(result1!.swift_code).toEqual('TESTBNK123');

    // Fetch second bank
    const result2 = await getBankById(bank2.id);
    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(bank2.id);
    expect(result2!.bank_name).toEqual('Local Bank');
    expect(result2!.swift_code).toBeNull();
  });

  it('should return bank with all fields populated', async () => {
    const createdBank = await createBank(testBankInput);
    const result = await getBankById(createdBank.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBank.id);
    expect(result!.bank_name).toEqual('Test Bank');
    expect(result!.account_number).toEqual('1234567890');
    expect(result!.account_holder_name).toEqual('Test Travel Agency');
    expect(result!.branch).toEqual('Main Branch');
    expect(result!.swift_code).toEqual('TESTBNK123');
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different bank configurations', async () => {
    // Test bank with swift code
    const bankWithSwift = await createBank(testBankInput);
    const resultWithSwift = await getBankById(bankWithSwift.id);
    expect(resultWithSwift!.swift_code).toEqual('TESTBNK123');

    // Test bank without swift code
    const bankWithoutSwift = await createBank(testBankInputWithoutSwift);
    const resultWithoutSwift = await getBankById(bankWithoutSwift.id);
    expect(resultWithoutSwift!.swift_code).toBeNull();
  });
});