import { db } from '../db';
import { visitCitiesTable } from '../db/schema';
import { type VisitCity, type CreateVisitCityInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createVisitCity(input: CreateVisitCityInput): Promise<VisitCity> {
  try {
    const result = await db.insert(visitCitiesTable)
      .values({
        city_name: input.city_name,
        country: input.country,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Visit city creation failed:', error);
    throw error;
  }
}

export async function getVisitCities(): Promise<VisitCity[]> {
  try {
    const result = await db.select()
      .from(visitCitiesTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch visit cities:', error);
    throw error;
  }
}

export async function getVisitCityById(id: number): Promise<VisitCity | null> {
  try {
    const result = await db.select()
      .from(visitCitiesTable)
      .where(eq(visitCitiesTable.id, id))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch visit city by ID:', error);
    throw error;
  }
}