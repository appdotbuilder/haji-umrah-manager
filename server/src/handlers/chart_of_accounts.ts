import { db } from '../db';
import { chartOfAccountsTable } from '../db/schema';
import { type ChartOfAccounts, type CreateAccountInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createAccount(input: CreateAccountInput): Promise<ChartOfAccounts> {
  try {
    // Validate parent account exists if provided
    if (input.parent_account_id !== null) {
      const parentAccount = await db.select()
        .from(chartOfAccountsTable)
        .where(eq(chartOfAccountsTable.id, input.parent_account_id))
        .execute();

      if (parentAccount.length === 0) {
        throw new Error('Parent account not found');
      }
    }

    // Insert the new account
    const result = await db.insert(chartOfAccountsTable)
      .values({
        account_code: input.account_code,
        account_name: input.account_name,
        account_type: input.account_type,
        parent_account_id: input.parent_account_id,
        balance: '0', // Default balance as string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const account = result[0];
    return {
      ...account,
      balance: parseFloat(account.balance)
    };
  } catch (error) {
    console.error('Account creation failed:', error);
    throw error;
  }
}

export async function getChartOfAccounts(): Promise<ChartOfAccounts[]> {
  try {
    const results = await db.select()
      .from(chartOfAccountsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(account => ({
      ...account,
      balance: parseFloat(account.balance)
    }));
  } catch (error) {
    console.error('Failed to fetch chart of accounts:', error);
    throw error;
  }
}

export async function getAccountById(id: number): Promise<ChartOfAccounts | null> {
  try {
    const results = await db.select()
      .from(chartOfAccountsTable)
      .where(eq(chartOfAccountsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const account = results[0];
    return {
      ...account,
      balance: parseFloat(account.balance)
    };
  } catch (error) {
    console.error('Failed to fetch account by ID:', error);
    throw error;
  }
}

export async function updateAccountBalance(id: number, newBalance: number): Promise<ChartOfAccounts> {
  try {
    // Check if account exists
    const existingAccount = await getAccountById(id);
    if (!existingAccount) {
      throw new Error('Account not found');
    }

    // Update the account balance
    const result = await db.update(chartOfAccountsTable)
      .set({ 
        balance: newBalance.toString(), // Convert number to string for numeric column
        updated_at: new Date()
      })
      .where(eq(chartOfAccountsTable.id, id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const account = result[0];
    return {
      ...account,
      balance: parseFloat(account.balance)
    };
  } catch (error) {
    console.error('Account balance update failed:', error);
    throw error;
  }
}