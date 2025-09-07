import { db } from '../db';
import { packageTypesTable } from '../db/schema';
import { type CreatePackageTypeInput, type PackageType } from '../schema';
import { eq } from 'drizzle-orm';

export const createPackageType = async (input: CreatePackageTypeInput): Promise<PackageType> => {
  try {
    const result = await db.insert(packageTypesTable)
      .values({
        type_name: input.type_name,
        description: input.description
      })
      .returning()
      .execute();

    const packageType = result[0];
    return {
      ...packageType
    };
  } catch (error) {
    console.error('Package type creation failed:', error);
    throw error;
  }
};

export const getPackageTypes = async (): Promise<PackageType[]> => {
  try {
    const results = await db.select()
      .from(packageTypesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch package types:', error);
    throw error;
  }
};

export const getPackageTypeById = async (id: number): Promise<PackageType | null> => {
  try {
    const results = await db.select()
      .from(packageTypesTable)
      .where(eq(packageTypesTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch package type by ID:', error);
    throw error;
  }
};