import { db } from '../db';
import { facilitiesTable } from '../db/schema';
import { type CreateFacilityInput, type Facility } from '../schema';
import { eq } from 'drizzle-orm';

export const createFacility = async (input: CreateFacilityInput): Promise<Facility> => {
  try {
    // Insert facility record
    const result = await db.insert(facilitiesTable)
      .values({
        facility_name: input.facility_name,
        facility_type: input.facility_type,
        location: input.location,
        capacity: input.capacity,
        cost_per_person: input.cost_per_person.toString(), // Convert number to string for numeric column
        description: input.description
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const facility = result[0];
    return {
      ...facility,
      cost_per_person: parseFloat(facility.cost_per_person) // Convert string back to number
    };
  } catch (error) {
    console.error('Facility creation failed:', error);
    throw error;
  }
};

export const getFacilities = async (): Promise<Facility[]> => {
  try {
    const results = await db.select()
      .from(facilitiesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(facility => ({
      ...facility,
      cost_per_person: parseFloat(facility.cost_per_person) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch facilities:', error);
    throw error;
  }
};

export const getFacilityById = async (id: number): Promise<Facility | null> => {
  try {
    const results = await db.select()
      .from(facilitiesTable)
      .where(eq(facilitiesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const facility = results[0];
    return {
      ...facility,
      cost_per_person: parseFloat(facility.cost_per_person) // Convert string back to number
    };
  } catch (error) {
    console.error('Failed to fetch facility by ID:', error);
    throw error;
  }
};