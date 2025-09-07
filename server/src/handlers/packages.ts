import { db } from '../db';
import { packagesTable, packageTypesTable } from '../db/schema';
import { type Package, type CreatePackageInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createPackage(input: CreatePackageInput): Promise<Package> {
  try {
    // Verify that the package_type_id exists
    const packageType = await db.select()
      .from(packageTypesTable)
      .where(eq(packageTypesTable.id, input.package_type_id))
      .execute();

    if (packageType.length === 0) {
      throw new Error('Package type not found');
    }

    // Insert package record - using explicit column mapping
    const insertData = {
      package_name: input.package_name,
      package_type: input.package_type,
      package_type_id: input.package_type_id,
      description: input.description,
      duration_days: input.duration_days,
      base_price: input.base_price.toString(), // Convert number to string for numeric column
      max_participants: input.max_participants,
      departure_date: input.departure_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      return_date: input.return_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      itinerary: input.itinerary,
      inclusions: input.inclusions,
      exclusions: input.exclusions,
      terms_conditions: input.terms_conditions
    };

    const result = await db.insert(packagesTable)
      .values(insertData)
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const packageRecord = result[0];
    return {
      ...packageRecord,
      base_price: parseFloat(packageRecord.base_price), // Convert string back to number
      departure_date: new Date(packageRecord.departure_date), // Ensure Date object
      return_date: new Date(packageRecord.return_date) // Ensure Date object
    };
  } catch (error) {
    console.error('Package creation failed:', error);
    throw error;
  }
}

export async function getPackages(): Promise<Package[]> {
  try {
    const results = await db.select()
      .from(packagesTable)
      .execute();

    // Convert numeric and date fields back to proper types
    return results.map(packageRecord => ({
      ...packageRecord,
      base_price: parseFloat(packageRecord.base_price),
      departure_date: new Date(packageRecord.departure_date),
      return_date: new Date(packageRecord.return_date)
    }));
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    throw error;
  }
}

export async function getUmrahPackages(): Promise<Package[]> {
  try {
    const results = await db.select()
      .from(packagesTable)
      .where(eq(packagesTable.package_type, 'umrah'))
      .execute();

    // Convert numeric and date fields back to proper types
    return results.map(packageRecord => ({
      ...packageRecord,
      base_price: parseFloat(packageRecord.base_price),
      departure_date: new Date(packageRecord.departure_date),
      return_date: new Date(packageRecord.return_date)
    }));
  } catch (error) {
    console.error('Failed to fetch Umrah packages:', error);
    throw error;
  }
}

export async function getHajiPackages(): Promise<Package[]> {
  try {
    const results = await db.select()
      .from(packagesTable)
      .where(eq(packagesTable.package_type, 'haji'))
      .execute();

    // Convert numeric and date fields back to proper types
    return results.map(packageRecord => ({
      ...packageRecord,
      base_price: parseFloat(packageRecord.base_price),
      departure_date: new Date(packageRecord.departure_date),
      return_date: new Date(packageRecord.return_date)
    }));
  } catch (error) {
    console.error('Failed to fetch Haji packages:', error);
    throw error;
  }
}

export async function getPackageById(id: number): Promise<Package | null> {
  try {
    const results = await db.select()
      .from(packagesTable)
      .where(eq(packagesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric and date fields back to proper types
    const packageRecord = results[0];
    return {
      ...packageRecord,
      base_price: parseFloat(packageRecord.base_price),
      departure_date: new Date(packageRecord.departure_date),
      return_date: new Date(packageRecord.return_date)
    };
  } catch (error) {
    console.error('Failed to fetch package by ID:', error);
    throw error;
  }
}