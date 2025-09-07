import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { packageTypesTable } from '../db/schema';
import { type CreatePackageTypeInput } from '../schema';
import { createPackageType, getPackageTypes, getPackageTypeById } from '../handlers/package_types';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreatePackageTypeInput = {
  type_name: 'Premium Umrah',
  description: 'Premium Umrah package with luxury accommodations'
};

const testInputMinimal: CreatePackageTypeInput = {
  type_name: 'Basic Haji',
  description: null
};

describe('Package Types Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createPackageType', () => {
    it('should create a package type with full details', async () => {
      const result = await createPackageType(testInput);

      expect(result.type_name).toEqual('Premium Umrah');
      expect(result.description).toEqual('Premium Umrah package with luxury accommodations');
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a package type with minimal details', async () => {
      const result = await createPackageType(testInputMinimal);

      expect(result.type_name).toEqual('Basic Haji');
      expect(result.description).toBeNull();
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save package type to database correctly', async () => {
      const result = await createPackageType(testInput);

      const savedPackageTypes = await db.select()
        .from(packageTypesTable)
        .where(eq(packageTypesTable.id, result.id))
        .execute();

      expect(savedPackageTypes).toHaveLength(1);
      expect(savedPackageTypes[0].type_name).toEqual('Premium Umrah');
      expect(savedPackageTypes[0].description).toEqual('Premium Umrah package with luxury accommodations');
      expect(savedPackageTypes[0].is_active).toBe(true);
    });

    it('should handle duplicate type name error', async () => {
      await createPackageType(testInput);
      
      await expect(createPackageType(testInput)).rejects.toThrow(/unique/i);
    });
  });

  describe('getPackageTypes', () => {
    it('should return empty array when no package types exist', async () => {
      const result = await getPackageTypes();

      expect(result).toEqual([]);
    });

    it('should return all package types', async () => {
      // Create multiple package types
      await createPackageType(testInput);
      await createPackageType(testInputMinimal);

      const result = await getPackageTypes();

      expect(result).toHaveLength(2);
      
      // Verify first package type
      const premiumType = result.find(pt => pt.type_name === 'Premium Umrah');
      expect(premiumType).toBeDefined();
      expect(premiumType!.description).toEqual('Premium Umrah package with luxury accommodations');
      expect(premiumType!.is_active).toBe(true);

      // Verify second package type
      const basicType = result.find(pt => pt.type_name === 'Basic Haji');
      expect(basicType).toBeDefined();
      expect(basicType!.description).toBeNull();
      expect(basicType!.is_active).toBe(true);
    });

    it('should return package types with proper date objects', async () => {
      await createPackageType(testInput);
      
      const result = await getPackageTypes();

      expect(result).toHaveLength(1);
      expect(result[0].created_at).toBeInstanceOf(Date);
      expect(result[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getPackageTypeById', () => {
    it('should return null for non-existent package type', async () => {
      const result = await getPackageTypeById(999);

      expect(result).toBeNull();
    });

    it('should return correct package type by ID', async () => {
      const created = await createPackageType(testInput);
      
      const result = await getPackageTypeById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.type_name).toEqual('Premium Umrah');
      expect(result!.description).toEqual('Premium Umrah package with luxury accommodations');
      expect(result!.is_active).toBe(true);
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return correct package type when multiple exist', async () => {
      const created1 = await createPackageType(testInput);
      const created2 = await createPackageType(testInputMinimal);
      
      const result1 = await getPackageTypeById(created1.id);
      const result2 = await getPackageTypeById(created2.id);

      expect(result1).not.toBeNull();
      expect(result1!.type_name).toEqual('Premium Umrah');
      expect(result1!.description).toEqual('Premium Umrah package with luxury accommodations');

      expect(result2).not.toBeNull();
      expect(result2!.type_name).toEqual('Basic Haji');
      expect(result2!.description).toBeNull();
    });
  });

  describe('Database constraints and validation', () => {
    it('should verify package type is saved correctly in database', async () => {
      const created = await createPackageType(testInput);

      // Query database directly to verify
      const dbResults = await db.select()
        .from(packageTypesTable)
        .where(eq(packageTypesTable.id, created.id))
        .execute();

      expect(dbResults).toHaveLength(1);
      
      const dbPackageType = dbResults[0];
      expect(dbPackageType.type_name).toEqual(testInput.type_name);
      expect(dbPackageType.description).toEqual(testInput.description);
      expect(dbPackageType.is_active).toBe(true);
      expect(dbPackageType.created_at).toBeInstanceOf(Date);
      expect(dbPackageType.updated_at).toBeInstanceOf(Date);
    });

    it('should handle null description correctly', async () => {
      const created = await createPackageType(testInputMinimal);

      const dbResults = await db.select()
        .from(packageTypesTable)
        .where(eq(packageTypesTable.id, created.id))
        .execute();

      expect(dbResults[0].description).toBeNull();
    });
  });
});