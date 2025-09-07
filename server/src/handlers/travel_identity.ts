import { db } from '../db';
import { travelIdentityTable } from '../db/schema';
import { type TravelIdentity, type UpdateTravelIdentityInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getTravelIdentity = async (): Promise<TravelIdentity | null> => {
  try {
    const results = await db.select()
      .from(travelIdentityTable)
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Travel identity fetch failed:', error);
    throw error;
  }
};

export const updateTravelIdentity = async (input: UpdateTravelIdentityInput): Promise<TravelIdentity> => {
  try {
    // First, check if a travel identity record exists
    const existing = await getTravelIdentity();

    if (!existing) {
      // Create new travel identity record with required fields
      const result = await db.insert(travelIdentityTable)
        .values({
          travel_name: input.travel_name || 'Default Travel Agency',
          logo_url: input.logo_url || null,
          address: input.address || 'Default Address',
          email: input.email || 'contact@travelagency.com',
          phone: input.phone || '+1-000-000-0000',
          theme: input.theme || 'purple'
        })
        .returning()
        .execute();

      return result[0];
    }

    // Update existing record
    const result = await db.update(travelIdentityTable)
      .set({
        ...(input.travel_name !== undefined && { travel_name: input.travel_name }),
        ...(input.logo_url !== undefined && { logo_url: input.logo_url }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.theme !== undefined && { theme: input.theme }),
        updated_at: new Date()
      })
      .where(eq(travelIdentityTable.id, existing.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Travel identity update failed:', error);
    throw error;
  }
};