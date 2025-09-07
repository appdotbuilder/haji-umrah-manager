import { db } from '../db';
import { airlinesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Airline, type CreateAirlineInput } from '../schema';

export const createAirline = async (input: CreateAirlineInput): Promise<Airline> => {
  try {
    // Insert airline record
    const result = await db.insert(airlinesTable)
      .values({
        airline_name: input.airline_name,
        airline_code: input.airline_code,
        contact_info: input.contact_info
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Airline creation failed:', error);
    throw error;
  }
};

export const getAirlines = async (): Promise<Airline[]> => {
  try {
    const result = await db.select()
      .from(airlinesTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch airlines:', error);
    throw error;
  }
};

export const getAirlineById = async (id: number): Promise<Airline | null> => {
  try {
    const result = await db.select()
      .from(airlinesTable)
      .where(eq(airlinesTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to fetch airline by ID:', error);
    throw error;
  }
};