import { db } from '../db';
import { pilgrimsTable } from '../db/schema';
import { type Pilgrim, type CreatePilgrimInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createPilgrim(input: CreatePilgrimInput): Promise<Pilgrim> {
  try {
    // Convert Date objects to strings for database insertion
    const result = await db.insert(pilgrimsTable)
      .values({
        ...input,
        passport_expiry: input.passport_expiry.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        date_of_birth: input.date_of_birth.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    // Convert string dates back to Date objects for return
    const pilgrim = result[0];
    return {
      ...pilgrim,
      passport_expiry: new Date(pilgrim.passport_expiry),
      date_of_birth: new Date(pilgrim.date_of_birth)
    };
  } catch (error) {
    console.error('Pilgrim creation failed:', error);
    throw error;
  }
}

export async function getPilgrims(): Promise<Pilgrim[]> {
  try {
    const result = await db.select()
      .from(pilgrimsTable)
      .execute();

    // Convert string dates back to Date objects
    return result.map(pilgrim => ({
      ...pilgrim,
      passport_expiry: new Date(pilgrim.passport_expiry),
      date_of_birth: new Date(pilgrim.date_of_birth)
    }));
  } catch (error) {
    console.error('Failed to fetch pilgrims:', error);
    throw error;
  }
}

export async function getPilgrimById(id: number): Promise<Pilgrim | null> {
  try {
    const result = await db.select()
      .from(pilgrimsTable)
      .where(eq(pilgrimsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert string dates back to Date objects
    const pilgrim = result[0];
    return {
      ...pilgrim,
      passport_expiry: new Date(pilgrim.passport_expiry),
      date_of_birth: new Date(pilgrim.date_of_birth)
    };
  } catch (error) {
    console.error('Failed to fetch pilgrim by ID:', error);
    throw error;
  }
}

export async function updatePilgrim(id: number, input: Partial<CreatePilgrimInput>): Promise<Pilgrim> {
  try {
    // Convert Date objects to strings if they exist in the input
    const updateData: any = { ...input, updated_at: new Date() };
    if (input.passport_expiry) {
      updateData.passport_expiry = input.passport_expiry.toISOString().split('T')[0];
    }
    if (input.date_of_birth) {
      updateData.date_of_birth = input.date_of_birth.toISOString().split('T')[0];
    }

    const result = await db.update(pilgrimsTable)
      .set(updateData)
      .where(eq(pilgrimsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Pilgrim with ID ${id} not found`);
    }

    // Convert string dates back to Date objects
    const pilgrim = result[0];
    return {
      ...pilgrim,
      passport_expiry: new Date(pilgrim.passport_expiry),
      date_of_birth: new Date(pilgrim.date_of_birth)
    };
  } catch (error) {
    console.error('Pilgrim update failed:', error);
    throw error;
  }
}