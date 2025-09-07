import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { packagesTable, packageTypesTable } from '../db/schema';
import { type CreatePackageInput } from '../schema';
import { createPackage, getPackages, getUmrahPackages, getHajiPackages, getPackageById } from '../handlers/packages';
import { eq } from 'drizzle-orm';

// Helper to create a package type for testing
async function createTestPackageType() {
  const result = await db.insert(packageTypesTable)
    .values({
      type_name: 'Test Package Type',
      description: 'A package type for testing'
    })
    .returning()
    .execute();
  
  return result[0];
}

// Test input for Umrah package
const umrahPackageInput: CreatePackageInput = {
  package_name: 'Premium Umrah Package',
  package_type: 'umrah',
  package_type_id: 1, // Will be updated in tests
  description: 'A premium Umrah experience',
  duration_days: 14,
  base_price: 2500.00,
  max_participants: 50,
  departure_date: new Date('2024-12-01'),
  return_date: new Date('2024-12-15'),
  itinerary: 'Day 1: Arrive in Mecca...',
  inclusions: 'Hotel, meals, transport',
  exclusions: 'Personal expenses',
  terms_conditions: 'Terms and conditions apply'
};

// Test input for Haji package
const hajiPackageInput: CreatePackageInput = {
  package_name: 'Complete Haji Package',
  package_type: 'haji',
  package_type_id: 1, // Will be updated in tests
  description: 'Complete Haji pilgrimage package',
  duration_days: 21,
  base_price: 4500.00,
  max_participants: 30,
  departure_date: new Date('2024-06-01'),
  return_date: new Date('2024-06-22'),
  itinerary: 'Day 1: Arrive in Mecca, Day 2: Tawaf...',
  inclusions: 'Hotel, meals, transport, guide',
  exclusions: 'Personal shopping',
  terms_conditions: 'Strict terms apply for Haji'
};

describe('Package Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createPackage', () => {
    it('should create an Umrah package successfully', async () => {
      // Create prerequisite package type
      const packageType = await createTestPackageType();
      const input = { ...umrahPackageInput, package_type_id: packageType.id };

      const result = await createPackage(input);

      // Verify basic fields
      expect(result.package_name).toEqual('Premium Umrah Package');
      expect(result.package_type).toEqual('umrah');
      expect(result.package_type_id).toEqual(packageType.id);
      expect(result.description).toEqual(input.description);
      expect(result.duration_days).toEqual(14);
      expect(result.base_price).toEqual(2500.00);
      expect(typeof result.base_price).toEqual('number');
      expect(result.max_participants).toEqual(50);
      expect(result.departure_date).toEqual(input.departure_date);
      expect(result.return_date).toEqual(input.return_date);
      expect(result.is_active).toEqual(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a Haji package successfully', async () => {
      const packageType = await createTestPackageType();
      const input = { ...hajiPackageInput, package_type_id: packageType.id };

      const result = await createPackage(input);

      expect(result.package_name).toEqual('Complete Haji Package');
      expect(result.package_type).toEqual('haji');
      expect(result.base_price).toEqual(4500.00);
      expect(typeof result.base_price).toEqual('number');
      expect(result.duration_days).toEqual(21);
      expect(result.max_participants).toEqual(30);
    });

    it('should save package to database correctly', async () => {
      const packageType = await createTestPackageType();
      const input = { ...umrahPackageInput, package_type_id: packageType.id };

      const result = await createPackage(input);

      // Verify it exists in database
      const packages = await db.select()
        .from(packagesTable)
        .where(eq(packagesTable.id, result.id))
        .execute();

      expect(packages).toHaveLength(1);
      const dbPackage = packages[0];
      expect(dbPackage.package_name).toEqual('Premium Umrah Package');
      expect(dbPackage.package_type).toEqual('umrah');
      expect(parseFloat(dbPackage.base_price)).toEqual(2500.00);
      expect(dbPackage.duration_days).toEqual(14);
      expect(dbPackage.is_active).toEqual(true);
    });

    it('should handle nullable fields correctly', async () => {
      const packageType = await createTestPackageType();
      const input: CreatePackageInput = {
        package_name: 'Basic Package',
        package_type: 'umrah',
        package_type_id: packageType.id,
        description: null,
        duration_days: 7,
        base_price: 1000.00,
        max_participants: 20,
        departure_date: new Date('2024-12-01'),
        return_date: new Date('2024-12-08'),
        itinerary: null,
        inclusions: null,
        exclusions: null,
        terms_conditions: null
      };

      const result = await createPackage(input);

      expect(result.description).toBeNull();
      expect(result.itinerary).toBeNull();
      expect(result.inclusions).toBeNull();
      expect(result.exclusions).toBeNull();
      expect(result.terms_conditions).toBeNull();
    });

    it('should throw error for non-existent package type', async () => {
      const input = { ...umrahPackageInput, package_type_id: 999 };

      await expect(createPackage(input)).rejects.toThrow(/package type not found/i);
    });
  });

  describe('getPackages', () => {
    it('should return empty array when no packages exist', async () => {
      const result = await getPackages();
      expect(result).toEqual([]);
    });

    it('should return all packages', async () => {
      const packageType = await createTestPackageType();
      
      // Create multiple packages
      await createPackage({ ...umrahPackageInput, package_type_id: packageType.id });
      await createPackage({ ...hajiPackageInput, package_type_id: packageType.id });

      const result = await getPackages();

      expect(result).toHaveLength(2);
      expect(result.map(p => p.package_name)).toContain('Premium Umrah Package');
      expect(result.map(p => p.package_name)).toContain('Complete Haji Package');
      
      // Verify numeric conversion
      result.forEach(pkg => {
        expect(typeof pkg.base_price).toEqual('number');
      });
    });
  });

  describe('getUmrahPackages', () => {
    it('should return only Umrah packages', async () => {
      const packageType = await createTestPackageType();
      
      // Create both types
      await createPackage({ ...umrahPackageInput, package_type_id: packageType.id });
      await createPackage({ ...hajiPackageInput, package_type_id: packageType.id });

      const result = await getUmrahPackages();

      expect(result).toHaveLength(1);
      expect(result[0].package_name).toEqual('Premium Umrah Package');
      expect(result[0].package_type).toEqual('umrah');
      expect(typeof result[0].base_price).toEqual('number');
    });

    it('should return empty array when no Umrah packages exist', async () => {
      const packageType = await createTestPackageType();
      
      // Create only Haji package
      await createPackage({ ...hajiPackageInput, package_type_id: packageType.id });

      const result = await getUmrahPackages();
      expect(result).toEqual([]);
    });
  });

  describe('getHajiPackages', () => {
    it('should return only Haji packages', async () => {
      const packageType = await createTestPackageType();
      
      // Create both types
      await createPackage({ ...umrahPackageInput, package_type_id: packageType.id });
      await createPackage({ ...hajiPackageInput, package_type_id: packageType.id });

      const result = await getHajiPackages();

      expect(result).toHaveLength(1);
      expect(result[0].package_name).toEqual('Complete Haji Package');
      expect(result[0].package_type).toEqual('haji');
      expect(typeof result[0].base_price).toEqual('number');
    });

    it('should return empty array when no Haji packages exist', async () => {
      const packageType = await createTestPackageType();
      
      // Create only Umrah package
      await createPackage({ ...umrahPackageInput, package_type_id: packageType.id });

      const result = await getHajiPackages();
      expect(result).toEqual([]);
    });
  });

  describe('getPackageById', () => {
    it('should return package when found', async () => {
      const packageType = await createTestPackageType();
      const created = await createPackage({ ...umrahPackageInput, package_type_id: packageType.id });

      const result = await getPackageById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(created.id);
      expect(result?.package_name).toEqual('Premium Umrah Package');
      expect(result?.package_type).toEqual('umrah');
      expect(typeof result?.base_price).toEqual('number');
      expect(result?.base_price).toEqual(2500.00);
    });

    it('should return null when package not found', async () => {
      const result = await getPackageById(999);
      expect(result).toBeNull();
    });

    it('should handle numeric conversion correctly', async () => {
      const packageType = await createTestPackageType();
      const created = await createPackage({ ...umrahPackageInput, package_type_id: packageType.id });

      const result = await getPackageById(created.id);

      expect(result?.base_price).toEqual(2500.00);
      expect(typeof result?.base_price).toEqual('number');
    });
  });

  describe('Date handling', () => {
    it('should handle date fields correctly', async () => {
      const packageType = await createTestPackageType();
      const departureDate = new Date('2024-12-01');
      const returnDate = new Date('2024-12-15');
      
      const input = { 
        ...umrahPackageInput, 
        package_type_id: packageType.id,
        departure_date: departureDate,
        return_date: returnDate
      };

      const result = await createPackage(input);

      expect(result.departure_date).toEqual(departureDate);
      expect(result.return_date).toEqual(returnDate);
      expect(result.departure_date).toBeInstanceOf(Date);
      expect(result.return_date).toBeInstanceOf(Date);
    });
  });
});