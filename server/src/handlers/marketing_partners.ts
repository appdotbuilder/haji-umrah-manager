import { db } from '../db';
import { marketingPartnersTable } from '../db/schema';
import { type MarketingPartner, type CreateMarketingPartnerInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createMarketingPartner(input: CreateMarketingPartnerInput): Promise<MarketingPartner> {
  try {
    // Insert marketing partner record
    const result = await db.insert(marketingPartnersTable)
      .values({
        name: input.name,
        contact_person: input.contact_person,
        email: input.email,
        phone: input.phone,
        commission_rate: input.commission_rate.toString(), // Convert number to string for numeric column
        address: input.address
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const partner = result[0];
    return {
      ...partner,
      commission_rate: parseFloat(partner.commission_rate) // Convert string back to number
    };
  } catch (error) {
    console.error('Marketing partner creation failed:', error);
    throw error;
  }
}

export async function getMarketingPartners(): Promise<MarketingPartner[]> {
  try {
    const result = await db.select()
      .from(marketingPartnersTable)
      .execute();

    // Convert numeric fields back to numbers
    return result.map(partner => ({
      ...partner,
      commission_rate: parseFloat(partner.commission_rate)
    }));
  } catch (error) {
    console.error('Failed to fetch marketing partners:', error);
    throw error;
  }
}

export async function getMarketingPartnerById(id: number): Promise<MarketingPartner | null> {
  try {
    const result = await db.select()
      .from(marketingPartnersTable)
      .where(eq(marketingPartnersTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const partner = result[0];
    return {
      ...partner,
      commission_rate: parseFloat(partner.commission_rate)
    };
  } catch (error) {
    console.error('Failed to fetch marketing partner by ID:', error);
    throw error;
  }
}

export async function updateMarketingPartner(id: number, input: Partial<CreateMarketingPartnerInput>): Promise<MarketingPartner> {
  try {
    // Build update object, converting numbers to strings for numeric columns
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.contact_person !== undefined) updateData.contact_person = input.contact_person;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.commission_rate !== undefined) updateData.commission_rate = input.commission_rate.toString();
    if (input.address !== undefined) updateData.address = input.address;
    
    // Add updated timestamp
    updateData.updated_at = new Date();

    const result = await db.update(marketingPartnersTable)
      .set(updateData)
      .where(eq(marketingPartnersTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Marketing partner with ID ${id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const partner = result[0];
    return {
      ...partner,
      commission_rate: parseFloat(partner.commission_rate)
    };
  } catch (error) {
    console.error('Marketing partner update failed:', error);
    throw error;
  }
}