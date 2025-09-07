import { db } from '../db';
import { banksTable } from '../db/schema';
import { type Bank, type CreateBankInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createBank(input: CreateBankInput): Promise<Bank> {
  try {
    // Insert bank record
    const result = await db.insert(banksTable)
      .values({
        bank_name: input.bank_name,
        account_number: input.account_number,
        account_holder_name: input.account_holder_name,
        branch: input.branch,
        swift_code: input.swift_code
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Bank creation failed:', error);
    throw error;
  }
}

export async function getBanks(): Promise<Bank[]> {
  try {
    // Fetch all banks
    const result = await db.select()
      .from(banksTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch banks:', error);
    throw error;
  }
}

export async function getBankById(id: number): Promise<Bank | null> {
  try {
    // Fetch specific bank by ID
    const result = await db.select()
      .from(banksTable)
      .where(eq(banksTable.id, id))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch bank by ID:', error);
    throw error;
  }
}